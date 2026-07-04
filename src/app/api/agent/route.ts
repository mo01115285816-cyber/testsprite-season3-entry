import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Robust helper with exponential backoff and alternate backup models to prevent 503/transient API failures
async function generateContentWithRetry(
  ai: any,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  retries = 3,
  delay = 500
): Promise<{ response: any; modelUsed: string }> {
  const modelsToTry = [
    params.model, 
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro"
  ];
  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        return { response, modelUsed: currentModel };
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err.message || "").toUpperCase();
        const isQuotaExceeded = 
          errMsg.includes("QUOTA") || 
          errMsg.includes("429") || 
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          err.status === 429;

        if (isQuotaExceeded) {
          // Wait briefly to let the transient global/project limit recover, then fall back
          await new Promise(r => setTimeout(r, 1000));
          break;
        }

        const isRetryable = 
          errMsg.includes("503") || 
          errMsg.includes("UNAVAILABLE") || 
          err.status === 503 ||
          errMsg.includes("FETCH") ||
          errMsg.includes("NETWORK") ||
          errMsg.includes("SERVICE TEMPORARILY OVERLOADED");

        if (!isRetryable) {
          break; // Skip retrying this model, quickly move to next backup model
        }

        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt - 1)));
        }
      }
    }
  }
  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const { code, prompt: userPrompt } = await req.json();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendStatus = (msg: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: msg })}\n\n`));
        };
        const sendStepsInit = (steps: string[]) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'steps_init', steps })}\n\n`));
        };
        const sendStepActive = (index: number) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'step_active', index })}\n\n`));
        };
        const sendStepComplete = (index: number) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'step_complete', index })}\n\n`));
        };
        const sendModelInfo = (agent: string, model: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'model_info', agent, model })}\n\n`));
        };
        const sendFinal = (finalCode: string, msg: string) => {
           controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'final', code: finalCode, message: msg })}\n\n`));
        };
        const sendError = (errMsg: string) => {
           controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`));
        };

        try {
          if (!process.env.GEMINI_API_KEY) {
            sendError("مفتاح API غير متوفر (GEMINI_API_KEY)");
            return controller.close();
          }

          const ai = new GoogleGenAI({ 
             apiKey: process.env.GEMINI_API_KEY,
             httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });

          sendStatus("المحرك الذكي: جاري تحليل طلبك لاختيار الوكيل المناسب بدقة...");
          
          const classAndPlanPrompt = `أنت نظام توجيه مهام ذكي وسريع جداً (Router).
حلل طلب المستخدم بالنسبة للكود الحالي.
اختر الوكيل المناسب بدقة:
1. "CHAT": المستشار الفني (لأسئلة عامة، شرح كود، نصائح دون الحاجة لتغيير الكود فعلياً).
2. "CODE": المبرمج العادي / مهندس البرمجيات (لبناء منطق وظيفي، إصلاح خطأ برمجي، قواعد بيانات، API).
3. "UI_ARTIST": مهندس ومصمم الواجهات المحترف (لتطوير واجهات المستخدم، وتجربة المستخدم UI/UX، وكتابة أكواد Frontend بناءً على المهارات الفنية الدقيقة والقواعد الاحترافية).

بمجرد اختيارك للوكيل، استنتج 3 أو 4 خطوات حقيقية ومحددة باللغة العربية سيفعلها هذا الوكيل لتنفيذ الطلب. اجعل الخطوات تعكس ما سيحدث حقاً.

طلب المستخدم: "${userPrompt}"

أعد النتيجة في صيغة JSON صالحة حصراً بهذا المخطط:
{
  "agentType": "CHAT" | "CODE" | "UI_ARTIST",
  "steps": ["خطوة 1", "خطوة 2", "خطوة 3"]
}`;

          let agentType = "CODE"; 
          let steps = ["تحليل المشكلة", "تحديث الكود", "اعتماد التعديلات"];
          
          try {
            const { response: classResponse, modelUsed: classModel } = await generateContentWithRetry(ai, {
              model: "gemini-3.5-flash",
              contents: classAndPlanPrompt,
              config: { responseMimeType: "application/json" }
            });
            const classData = JSON.parse(classResponse.text || "{}");
            sendModelInfo("نظام التوجيه الذكي", classModel);
            if (classData.agentType) agentType = classData.agentType;
            if (classData.steps && Array.isArray(classData.steps) && classData.steps.length > 0) {
                steps = classData.steps;
            }
          } catch (err) {
            console.error("Router error fallback to CODE", err);
          }

          sendStepsInit(steps);

          const runStreamingAgent = async (prompt: string, agentTitle: string) => {
            let modelUsedOut = "gemini-3.5-flash";
            let fullResponse = "";
            let currentCode = "";
            
            try {
              const streamModelsToTry = [
                "gemini-3.5-flash",
                "gemini-3.1-flash-lite",
                "gemini-2.5-flash",
                "gemini-2.5-pro",
                "gemini-3.1-pro-preview"
              ];
              let streamSuccess = false;
              let lastStreamError: any = null;
              
              for (const sm of streamModelsToTry) {
                 try {
                   console.log(`📡 [Streaming Agent] Initializing stream with model: ${sm}`);
                   
                   let streamObj: any = null;
                   let lastEx: any = null;
                   
                   // Try up to 2 attempts for each model with a 1500ms sleep on 429
                   for (let attempt = 1; attempt <= 2; attempt++) {
                      try {
                         streamObj = await ai.models.generateContentStream({
                           model: sm,
                           contents: prompt
                         });
                         lastEx = null;
                         break;
                      } catch (errEx: any) {
                         lastEx = errEx;
                         const errStr = String(errEx.message || "").toUpperCase();
                         const isQuota = errStr.includes("QUOTA") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errEx.status === 429;
                         if (isQuota) {
                            console.log(`⏳ Model ${sm} got 429 Quota Exhausted on attempt ${attempt}. Sleeping 1500ms...`);
                            await new Promise(r => setTimeout(r, 1500));
                         } else {
                            break; // Bypass non-429 failures quickly to preserve latency
                         }
                      }
                   }
                   
                   if (lastEx) {
                      throw lastEx;
                   }

                   modelUsedOut = sm;
                   sendModelInfo(agentTitle, sm);
                   
                   for await (const chunk of streamObj) {
                      if (chunk.text) {
                         fullResponse += chunk.text;
                         
                         const codeStart = fullResponse.indexOf("<CODE>");
                         const codeEnd = fullResponse.indexOf("</CODE>");
                         
                         if (codeStart === -1) {
                           sendStatus("الوكيل الذكي: جاري صياغة الرد والشرح التفصيلي للحل وتجهيز البنية...");
                         } else {
                           sendStatus("الوكيل الذكي: جاري كتابة وتوليد شيفرة المكونات التفاعلية (React/Tailwind) مباشرة...");
                         }
                         
                         if (codeStart !== -1) {
                           let rawCode = "";
                           if (codeEnd !== -1) {
                             rawCode = fullResponse.substring(codeStart + 6, codeEnd);
                           } else {
                             rawCode = fullResponse.substring(codeStart + 6);
                           }
                           currentCode = rawCode.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trimStart();
                           controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stream_code', code: currentCode })}\n\n`));
                         }
                      }
                   }
                   streamSuccess = true;
                   break;
                 } catch(ex: any) {
                   console.error(`❌ [Streaming Agent] Failed with model ${sm}:`, ex);
                   lastStreamError = ex;
                   // Wait 1500ms before falling back to next model to let rate limits cool down
                   const errStr = String(ex.message || "").toUpperCase();
                   if (errStr.includes("QUOTA") || errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || ex.status === 429) {
                     console.log("Sleeping 1500ms after a 429 before attempting fallback model...");
                     await new Promise(r => setTimeout(r, 1500));
                   }
                 }
              }
              if (!streamSuccess) throw lastStreamError || new Error("فشلت عملية البث من جميع نماذج الذكاء الاصطناعي المتاحة.");
            } catch(streamErr: any) {
                console.error("🚨 [Streaming Agent] Stream error:", streamErr);
                throw streamErr; 
            }

            let extractedReply = "تم إنجاز المطلوب بنجاح.";
            const replyStart = fullResponse.indexOf("<REPLY>");
            const replyEnd = fullResponse.indexOf("</REPLY>");
            if (replyStart !== -1 && replyEnd !== -1) {
               extractedReply = fullResponse.substring(replyStart + 7, replyEnd).trim();
            } else if (replyStart !== -1) {
               const maybeReply = fullResponse.substring(replyStart + 7, fullResponse.indexOf("<CODE>") > -1 ? fullResponse.indexOf("<CODE>") : undefined).trim();
               if (maybeReply) extractedReply = maybeReply;
            }

            return { code: currentCode || code, reply: extractedReply };
          };

          let finalResult = { code, reply: "" };

          if (agentType === "CHAT") {
             for(let i = 0; i < Math.max(1, steps.length - 1); i++) sendStepActive(i);
             const advisoryPrompt = `أنت مهندس برمجيات ومستشار تقني خبير ومصمم ذو رؤية ثاقبة.
المستخدم لديه استفسار تقني أو عام أو يحتاج شرحاً أو نصيحة، ولا يرغب في تعديل الكود مباشرة، أو أن سؤاله لا يتطلب أي تغيير في الملفات.

طلب المستخدم: ${userPrompt}

الكود الحالي للسياق العام لتستشهد به إن لزم الأمر:
${code}

صغ ردك دائماً باللغة العربية بأسلوب احترافي وودود ومشوق:
<REPLY>
(ردك الاستشاري الكامل والمفصل والمنظم هنا بالتفصيل وبدون أي وسوم كود إلا لتوضيحات صغيرة)
</REPLY>`;
             finalResult = await runStreamingAgent(advisoryPrompt, "المستشار التقني");
          } else if (agentType === "UI_ARTIST") {
             for(let i = 0; i < Math.max(1, steps.length - 1); i++) sendStepActive(i);
             const proPrompt = `أنت مهندس ومصمم الواجهات المحترف (UI/UX Pro Max & Frontend Artist).
أنت تدمج بين التفكير البرمجي المعقد والذوق الفني العالي جداً.
مهمتك: تحويل الكود المرفق أو بناء الكود المطلوب ليكون تحفة فنية احترافية (Masterpiece) جاهزة للإنتاج.
يجب أن تلتزم التزاماً دقيقاً وصارماً بالمهارات التالية:

1. [UI/UX Pro Max Intelligence]:
- Accessibility: تباين ألوان 4.5:1، استخدام aria-labels.
- Touch & Interaction: أزرار لا تقل عن 44px، مسافات 8px على الأقل بين العناصر التفاعلية.
- Style: تجنب الإيموجي (استخدم مكتبة lucide-react حصراً)، حالات Hover / Focus واضحة.
- Typography & Color: نص أساسي مقاس 16px، تباعد خطوط 1.5، دعم مذهل للوضع الليلي.
- Layout: تصميم يعتمد على الجوال أولاً، مع مقاسات حاويات دقيقة.

2. [Frontend Design & Canvas Design Principles]:
- تجنب التصاميم المعتادة للذكاء الاصطناعي (AI Slop) مثل التدرجات اللونية الزرقاء/البنفسجية الرخيصة.
- ابتكر هوية بصرية مذهلة (مثلاً: Brutalist, Minimalist, Glassmorphism).
- اجعل التنفيذ احترافياً لدرجة تبدو وكأن خبير بشري استغرق ساعات في تصميمه وتكويده.

اكتب الكود بالكامل (React / Tailwind)، لا تحذف المنطق الأساسي، بل ارتقِ بالتصميم لأعلى مستوى.

طلب المستخدم: ${userPrompt}

الكود الحالي المستهدف:
${code}

صغ ردك دائماً بهذا التنسيق حصراً بدون أي إضافات:
<REPLY>
(رسالتك التوضيحية المشوقة القصيرة باللغة العربية كمصمم يعرض عمله على العميل)
</REPLY>
<CODE>
(الكود المحدث والكامل هنا بدون أي اقتطاع)
</CODE>`;
             finalResult = await runStreamingAgent(proPrompt, "المهندس المصمم (UI/UX Artist)");
          } else { // CODE AGENT
             for(let i = 0; i < Math.max(1, steps.length - 1); i++) sendStepActive(i);
             const engineerPrompt = `أنت مهندس برمجيات متمرس ومحترف (Senior Full-Stack Engineer).
مهمتك الأساسية: تلبية طلب المستخدم بحل المشكلات البرمجية، تنفيذ المنطق الوظيفي، بناء مسارات البيانات، وكتابة كود يعتمد على قمة أفضل الممارسات (Best Practices).
راعي أيضاً أثناء العمل الأمان الأساسي للكود ومنع الثغرات البديهية (مثل XSS من خلال الاعتماد على React State السليم). اترك الجماليات العميقة للمصمم، وركز على القوة الوظيفية للكود والمنطقيات.

طلب المستخدم: ${userPrompt}

الكود الحالي المستهدف:
${code}

صغ ردك دائماً بهذا التنسيق حصراً بدون أي إضافات:
<REPLY>
(رسالتك التقنية باختصار شديد واحترافية باللغة العربية)
</REPLY>
<CODE>
(الكود المحدث والكامل هنا بدون أي اقتطاع)
</CODE>`;
             finalResult = await runStreamingAgent(engineerPrompt, "المهندس المبرمج");
          }

          // Complete all steps
          for(let i = 0; i < steps.length; i++) sendStepComplete(i);
          sendFinal(finalResult.code, finalResult.reply);

        } catch (err: any) {
          sendError(err.message?.includes("QUOTA") || err.message?.includes("429") 
            ? "عفواً، لقد تم تجاوز الحد المجاني لخدمات الذكاء الاصطناعي..." 
            : (err.message || "حدث خطأ غير متوقع في خوادم الذكاء الاصطناعي."));
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch(e) {
     return NextResponse.json({ error: "فشل استلام الطلب" }, { status: 400 });
  }
}
