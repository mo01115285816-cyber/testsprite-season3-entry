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
): Promise<any> {
  const modelsToTry = [params.model, "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        // console.warn(`[Gemini API Format] Attempt ${attempt} failed for model ${currentModel}:`, err);

        const errMsg = String(err.message || "").toUpperCase();
        const isQuotaExceeded = 
          errMsg.includes("QUOTA") || 
          errMsg.includes("429") || 
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          err.status === 429;

        if (isQuotaExceeded) {
          // console.warn(`[Gemini API Format] Quota exceeded for model ${currentModel}. Skipping retries for this model and moving to next fallback.`);
          // Break the retry loop and try the next fallback model immediately to avoid unnecessary delay/timeouts
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
          throw err;
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
    const { code } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `أنت مساعد خبير في كتابة وتنسيق أكواد HTML/CSS/JS.
المطلوب منك:
1. ترتيب وتنسيق الكود المرفق ليكون سهل القراءة ومنظماً (Indentation).
2. إذا كان الكود عبارة عن تصميم شكل بصري ثابت (Static) يمكن تشغيله، قم بإضافة تفاعلات حيوية بسيطة باستخدام JavaScript (أو CSS animations) بحيث يبدو حياً ويعمل دون تغيير التصميم الأصلي (مثلا جعل الزر يظهر رسالة، أو العداد يعمل). 
3. ألا تُغير التصميم الأساسي (الألوان والخطوط والأشكال) إطلاقا.
4. اكتشاف أي ثغرات أمنية (Security vulnerabilities) أو أخطاء برمجية في الكود (Bugs).
5. كتابة ملخص قصير (باللغة العربية) يشرح ما قمت بتعديله أو تحسينه في الكود، أو الأخطاء والثغرات التي وجدتها وتم معالجتها.

الكود:
${code}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            code: {
              type: "STRING",
              description: "The formatted and enhanced HTML code. No markdown formatting."
            },
            summary: {
              type: "STRING",
              description: "A short professional summary in Arabic explaining what was changed, including security issues or bugs found."
            }
          },
          required: ["code", "summary"]
        }
      }
    });
    
    let parsedData;
    try {
      parsedData = JSON.parse(response.text || "{}");
    } catch(e) {
      return NextResponse.json({ error: "Failed to parse API response" }, { status: 500 });
    }

    return NextResponse.json({ code: parsedData.code, summary: parsedData.summary });
  } catch (error: any) {
    if (error?.message?.includes("QUOTA") || error?.message?.includes("429")) {
       return NextResponse.json({ error: "الحد المجاني انتهى للفرمتة الذكية." }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to format code" }, { status: 500 });
  }
}
