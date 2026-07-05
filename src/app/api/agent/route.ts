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
    "gemini-2.5-flash",
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
    const { code, prompt: userPrompt, isFullStack } = await req.json();
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

          let agentType = isFullStack ? "FULL_STACK" : "CODE"; 
          let steps = isFullStack 
            ? [
                "تحليل المتطلبات واختيار إطار العمل وتوليد خارطة الطريق عسكرياً",
                "إنشاء ملف المخطط العسكري الكامل (.md) وتصميم الهيكل",
                "كتابة وتوليد ملفات المشروع المترابطة بالتفصيل والاحترافية",
                "التدقيق الوظيفي وتأمين الكود النهائي للمشروع"
              ]
            : ["تحليل المشكلة", "تحديث الكود", "اعتماد التعديلات"];
          
          if (!isFullStack) {
            try {
              const { response: classResponse, modelUsed: classModel } = await generateContentWithRetry(ai, {
                model: "gemini-2.5-flash",
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
          } else {
            sendModelInfo("منسق المخططات العسكرية", "gemini-2.5-flash");
          }

          sendStepsInit(steps);

          const runStreamingAgent = async (prompt: string, agentTitle: string) => {
            let modelUsedOut = "gemini-2.5-flash";
            let fullResponse = "";
            let currentCode = "";
            let currentStep = 0;
            
            try {
              const streamModelsToTry = [
                "gemini-2.5-flash",
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
                         
                         if (agentType === "FULL_STACK" || agentType === "CODE" || agentType === "UI_ARTIST") {
                           // All agents use stream_full_text so page.tsx can parse <FILE> tags
                           if (agentType === "FULL_STACK") {
                             if (currentStep === 0 && fullResponse.includes("<FILE")) {
                                sendStepComplete(0);
                                sendStepActive(1);
                                currentStep = 1;
                             }
                             if (currentStep === 1 && (fullResponse.includes("مشروع_مخطط.md") || fullResponse.includes("plan.md")) && fullResponse.indexOf("<FILE") !== fullResponse.lastIndexOf("<FILE")) {
                                sendStepComplete(1);
                                sendStepActive(2);
                                currentStep = 2;
                             }
                           }
                           sendStatus("الوكيل الذكي: جاري كتابة الملفات...");
                           controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stream_full_text', text: fullResponse })}\n\n`));
                         } else {
                           // CHAT/ADVISOR — no code, just text
                           sendStatus("الوكيل الذكي: جاري صياغة الرد...");
                           controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stream_full_text', text: fullResponse })}\n\n`));
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

            let extractedReply = "";
            const replyStart = fullResponse.indexOf("<REPLY>");
            const replyEnd = fullResponse.indexOf("</REPLY>");
            if (replyStart !== -1 && replyEnd !== -1) {
               extractedReply = fullResponse.substring(replyStart + 7, replyEnd).trim();
            } else if (replyStart !== -1) {
               // Tolerant: accept reply without closing tag — take until next <FILE or <CODE or end
               const afterReply = fullResponse.substring(replyStart + 7);
               const terminator = "<FILE";
               const termIdx = afterReply.indexOf(terminator);
               const maybeReply = (termIdx > -1 ? afterReply.substring(0, termIdx) : afterReply).trim();
               if (maybeReply) extractedReply = maybeReply;
            }
            // If still empty, use a neutral default based on agent type
            if (!extractedReply) {
              extractedReply = agentType === "FULL_STACK"
                ? "تم إنشاء ملفات المشروع. يمكنك تصفحها في المستكشف وتجربتها في المعاينة."
                : "تم التنفيذ. يمكنك مراجعة الكود في المحرر.";
            }

            return { code: currentCode || code, reply: extractedReply };
          };

          let finalResult = { code, reply: "" };

          // Unified tone instructions — applied to ALL agent types
          const toneInstructions = `قواعد الرد (إلزامية):
- اكتب بلغة عربية فصحى حديثة واضحة ومباشرة.
- ممنوع استخدام نعوت احتفالية مثل "رائع" أو "مذهل" أو "بامتياز" أو "فائق الجمال" إلا إذا كانت تصف شيئاً محدداً بدقة.
- طول الرد يتناسب مع حجم المهمة الفعلية: رد قصير لتعديل بسيط، رد أكثر تفصيلاً لمشروع متكامل.
- عند وصف خطأ أو مشكلة، استخدم نبرة هادئة ومباشرة بدون أي نغمة احتفالية.
- اذكر تفاصيل فعلية عما تم تنفيذه: التقنية المستخدمة، أهم الملفات أو المكونات التي أُنشئت أو عُدّلت، أهم قرار تقني تم اتخاذه.`;

          if (agentType === "FULL_STACK") {
             const fullStackPrompt = `أنت مهندس برمجيات ومصمم معماري Full-Stack.
مهمتك: بناء مشروع كامل متكامل من الصفر بناءً على طلب المستخدم التالي:

طلب المستخدم: ${userPrompt}

القواعد:
1. [تحديد إطار العمل]:
بناءً على طلب المستخدم أعلاه، حدد أفضل إطار عمل من بين:
- HTML5 / CSS3 / Vanilla JS (للصفحات البسيطة)
- React / Tailwind (للواجهات التفاعلية)
- Next.js / React (للتطبيقات متعددة الصفحات)
- Angular (للتطبيقات المؤسسية)

2. [إنشاء مجلد للمشروع]:
اختر اسماً إنجليزياً للمشروع (مثال: TravelPlanner, TaskBoard). جميع الملفات تُحفظ داخل هذا المجلد.

3. [إنشاء ملف مخطط (.md)]:
قبل كتابة أي كود، أنشئ ملف "مشروع_مخطط.md" داخل مجلد المشروع. اكتب فيه:
- التقنية وإطار العمل المختار وسبب الاختيار.
- هيكلية المجلدات والملفات.
- خطوات العمل التفصيلية.

4. [كتابة الملفات]:
بعد المخطط، اكتب جميع ملفات المشروع بصيغة:
<FILE path="ProjectName/filename.ext">content</FILE>

${toneInstructions}

ابدأ التنفيذ فوراً. لا تطلب توضيحاً أو تفاصيل إضافية. نفذ طلب المستخدم أعلاه مباشرة.

بعد الانتهاء من كتابة جميع الملفات، اكتب ملخصاً نهائياً في وسم <REPLY> يشرح:
- التقنية والإطار الذي اخترته وسبب الاختيار باختصار.
- أهم الملفات التي أنشأتها.
- ما ينبغي للمستخدم معرفته بعد البناء (كيفية التشغيل، أي ملاحظات مهمة).
<REPLY>
(ملخص المشروع المنفذ بالتفاصيل الفعلية)
</REPLY>`;
             finalResult = await runStreamingAgent(fullStackPrompt, "المهندس المعماري (Full-Stack)");
          } else if (agentType === "CHAT" || agentType === "ADVISOR") {
             const advisoryPrompt = `أنت مستشار تقني خبير في معمارية وتطوير برمجيات الويب.
مهمتك: تقديم استشارة برمجية وتوجيه تقني للمستخدم.

أجب بدقة على استفسارات المستخدم البرمجية والتقنية، واقترح الحلول الأكثر كفاءة وأماناً.

الكود الحالي للسياق:
${code}

${toneInstructions}

نسق الرد باستخدام الماركدون بعناوين ونقاط واضحة.
<REPLY>
(ردك الاستشاري المنظم بالتفاصيل الفعلية)
</REPLY>`;
             finalResult = await runStreamingAgent(advisoryPrompt, "المستشار التقني");
          } else if (agentType === "UI_ARTIST") {
             for(let i = 0; i < Math.max(1, steps.length - 1); i++) sendStepActive(i);
             const proPrompt = `أنت مهندس ومصمم واجهات محترف.
مهمتك: تحويل الكود المرفق أو بناء الكود المطلوب ليكون احترافياً جاهزاً للإنتاج.

المهارات المطلوبة:
- Accessibility: تباين ألوان 4.5:1، aria-labels.
- أزرار لا تقل عن 44px، مسافات 8px بين العناصر التفاعلية.
- تجنب الإيموجي (استخدم lucide-react)، حالات Hover / Focus واضحة.
- نص أساسي 16px، تباعد خطوط 1.5، دعم الوضع الليلي.
- تصميم يعتمد على الجوال أولاً.
- تجنب التدرجات الزرقاء/البنفسجية الرخيصة.
- ابتكر هوية بصرية مميزة (Brutalist, Minimalist, Glassmorphism).

اكتب الكود بالكامل (React / Tailwind)، لا تحذف المنطق الأساسي.

طلب المستخدم: ${userPrompt}

الكود الحالي:
${code}

${toneInstructions}

صغ ردك بهذا التنسيق:
قاعدة إلزامية: يجب أن تكتب كل كود تنشئه بصيغة ملفات باستخدام الوسم التالي:
<FILE path="filename.ext">content</FILE>

اختر اسم الملف المناسب حسب نوع الكود (index.html, style.css, app.jsx, إلخ).

بعد كتابة جميع الملفات، اكتب ملخصاً في وسم <REPLY>:
<REPLY>
(شرح فعلي للتغييرات التصميمية والقرارات التقنية التي اتخذتها)
</REPLY>`;
             finalResult = await runStreamingAgent(proPrompt, "المهندس المصمم (UI/UX)");
          } else { // CODE AGENT
             for(let i = 0; i < Math.max(1, steps.length - 1); i++) sendStepActive(i);
             const engineerPrompt = `أنت مهندس برمجيات محترف.
مهمتك: تلبية طلب المستخدم بحل المشكلات البرمجية، تنفيذ المنطق الوظيفي، وكتابة كود بأفضل الممارسات.
راعي الأمان الأساسي للكود ومنع الثغرات (مثل XSS).

طلب المستخدم: ${userPrompt}

الكود الحالي:
${code}

${toneInstructions}

قاعدة إلزامية: يجب أن تكتب كل كود تنشئه بصيغة ملفات باستخدام الوسم التالي:
<FILE path="filename.ext">content</FILE>

مثال:
<FILE path="index.html"><!DOCTYPE html>...</FILE>
<FILE path="style.css">body { ... }</FILE>
<FILE path="script.js">console.log('...');</FILE>

اختر اسم الملف المناسب حسب نوع الكود (index.html, style.css, script.js, app.js, إلخ).
إذا كان طلب المستخدم يتطلب أكثر من ملف، أنشئ كل ملف في وسم <FILE> منفصل.

بعد كتابة جميع الملفات، اكتب ملخصاً في وسم <REPLY>:
<REPLY>
(شرح تقني للتغييرات الفعلية التي قمت بها والملفات التي أنشأتها)
</REPLY>`;
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
