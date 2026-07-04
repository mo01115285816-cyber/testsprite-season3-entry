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
        // console.warn(`[Gemini API Lint] Attempt ${attempt} failed for model ${currentModel}:`, err);

        const errMsg = String(err.message || "").toUpperCase();
        const isQuotaExceeded = 
          errMsg.includes("QUOTA") || 
          errMsg.includes("429") || 
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          err.status === 429;

        if (isQuotaExceeded) {
          // console.warn(`[Gemini API Lint] Quota exceeded for model ${currentModel}. Skipping retries for this model and moving to next fallback.`);
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
    const { code, isReact } = await req.json();

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

    const prompt = `أنت مهندس أمن سيبراني خبير وباحث ثغرات متقدم ومدقق شيفرات برمجية (Cybersecurity Code Auditor & SAST Architect).
الكود البرمجي للمستخدم هو تطبيق ${isReact ? 'React (JSX / TypeScript)' : 'HTML5 / CSS / Inline JS'}.

لدينا هنا ترقية الأداة إلى الجيل الثالث فائق التطور. المطلوب منك هو إجراء فحص أمني دقيق للغاية وتقييم معمق يتضمن المكونات الخمسة التالية:

1. **محرك التحليل العميق وتتبع تدفق البيانات لرحلة المدخل (Deep Taint Analysis Engine):**
   - **تتبع البيانات (Data Flow Mapping):** حدد بدقة مسار "المدخل" (Source) مثل (req.query, location.search, e.data, e.target.value, URLSearchParams, props) وتتبع تحركاته وتحولاته حتى وصوله إلى "الحوض" البرمجي الخطر (Sink) مثل (innerHTML, eval, Function, fetch, href, localStorage, document.write, dangerouslySetInnerHTML). اكتب هذه المحطات في حقل "taintFlow" كخطوات متسلسلة تتبع تدفق المتغير.
   - **تحليل الحساسية الميدانية (Field-Sensitive Analysis):** ميز بدقة بين تلاعب المتغيرات العادية وبين تلاعب المفاتيح الحساسة الخاصة بكائنات جافا سكريبت العميقة (مثل obj.__proto__ و obj.constructor.prototype و prototype pollution). لا تعلم على الدوال البرمجية مثل deepMerge بـ "خطر" إلا إذا كان بالإمكان حوايتها وتمرير هذه المفاتيح الحساسة تحديداً دون تأمين أو فلترة.
   - **تحليل تبعية المسار والفلترة (Path Dependency Sensitivity):** اكتشف ما إذا كان هناك دالة تطهير أو فلتر (مثل sanitizePath, replace, encodeURIComponent) ولكن يتم تجاوزه أو عدم تنفيذه إلا إذا مر المدخل عبر شروط معينة (مثل conditional statements والمقارنات الضعيفة)، واشرح ذلك في "dependencyCond".

2. **عقلية المهاجم وسلسلة الهجمات (Attack Chaining Engine):**
   - **دمج الثغرات الذكي (Attack Chaining):** لا تقدم كل ثغرة بمعزل عن الأخرى بشكل سطحي، بل اكتشف سيناريوهات الهجوم المركبة. (مثال: "وجود ثغرة IDOR في تحميل ملفات التعريف وثغرة Mass Assignment في التعديل يشكلان هجوماً مركباً متكاملاً لتغيير صلاحيات المستخدم العادي إلى مدير عام للجروب"). اكتب هذا السيناريو الكامل في حقل "attackChain".
   - **إثبات المفهوم (Proof of Concept - PoC):** قم بتطوير سيناريو استغلال هجومي عملي في حقل "poc" يصف الخطوات العملية التي يمكن للمهاجم اتخاذها لاختراق وتحدي هذا الجزء البرمجي (مثل: 1. تسجيل الدخول كمستخدم عادي 2. تعديل رأس الطلب JWT 3. تغيير المعرف ID 4. رفع الصلاحيات).
   - **محاكاة بيئة التشغيل وسلوك المتصفح (Runtime Simulation):** تفوق على فحص التعبيرات الساكن وتخيل في ذهنك تشغيل محرك JavaScript Virtual Machine داخل المتصفح، محاكياً تمرير مدخلات ملغمة مثل (\`<img src=x onerror=...>\` أو \`javascript:alert(1)\`) ولاحظ تأثيرها المباشر على شجرة الـ DOM أو الـ React State والنتائج المترتبة عليها، واكتب النتيجة المحاكية في حقل "simulatedImpact".

3. **التقرير الجراحي وعروض الأدلة الصارمة (Precision Code Quoting):**
   - حدد السطر الدقيق (line) حيث تكمن المشكلة وصنفها حسب تصنيف ثغرات الويب الدولي CWE (مثل CWE-79: Cross-site Scripting, CWE-1321: Prototype Pollution).
   - استخرج الاقتباس الدقيق والكامل للكود المعرض للخطر من ملف الكود واكتبه في حقل "codeQuote".
   - احسب درجة خطورة دقيقة وجريئة للثغرة بناء على معايير CVSS v3 (مثل: v3 Score: 8.8) في حقل "cvss".
   - صياغة اقتراح إصلاح "جراحي" فائق الدقة والاستبدال (Surgical Fix) يعالج المشكلة جذرياً ولا يتحدث بنصائح إنشائية عامة (مثال: "استبدل new Function(code) بـ JSON.parse" أو "استبدل innerHTML بـ textContent أو استخدم DOMPurify").

الكود البرمجي للمستخدم المطلوب فحصه:
"""
${code}
"""

أعد النتيجة حصراً بصيغة JSON متوافقة تماماً وبدقة تامة مع المخطط الهيكلي التالي من غير أي كلام أو مقدمات، وتأكد من ملء الحقول الإضافية الفائقة لتزويد الأداة الأنيقة بمسارات الأمان المتقدمة:
{
  "issues": [
    {
      "id": "معرف_عشوائي_فريد",
      "type": "error" | "warning",
      "line": 15,
      "message": "عنوان الخطأ أو الثغرة الجيل الثالث باختصار",
      "explanation": "شرح فني دقيق وعميق بناءً على تتبع مسار البيانات أو محاكاة الاستغلال",
      "suggestion": "اقتراح ترقيع أو تعديل جراحي دقيق (Surgical Repair) خطوة بخطوة وبكود بديل آمن وسليم",
      "isSecurityIssue": true | false,
      "cvss": 7.5,
      "cwe": "CWE-XYZ: Name",
      "poc": "خطوات الاستغلال العملية المفصلة وعقلية المهاجم",
      "targetText": "الجزء الدقيق الخطأ حرفياً (للاستبدال المباشر بضغطة واحدة)",
      "replacementText": "النص البرمجي الصحيح البديل للإصلاح الجراحي",
      "codeQuote": "اقتباس نص الكود البرمجي الدقيق المعرض للخطر من ملف المستخدم كما هو",
      "taintFlow": [
        "إدخال المستخدم الأولي (Source) من e.data مثلاً",
        "تجاوز دالة الفلتر العادية بسب عدم التحقق من المفتاح الحساس",
        "الوصول إلى الحوض الخطر (Sink) innerHTML وهو ما يسبب الثغرة"
      ],
      "attackChain": "التسلسل الهجومي الكامل في حال تم دمج هذه الثغرة مع ثغرة أخرى أو معطيات بيئة العمل",
      "simulatedImpact": "نتيجة محاكاة محرك الـ JS والـ DOM المتخيلة عند تمرير مدخل خبيث تجريبي",
      "dependencyCond": "تحليل شروط ومسارات الفلترة وكيفية تجاوزها أو عدم كفايتها تحت ظروف معينة"
    }
  ]
}

تنبيهات جوهرية للمدقق الذكي:
- صغ كافة النصوص والتحليلات بلغة فصحى راقية للغاية وأنيقة.
- في حال كان الكود نظيفاً من الثغرات، أعد مصفوفة "issues" فارغة تماماً ولا تلقِ اتهامات عشوائية.
- تأكد من مطابقة الكود المقتبس "codeQuote" والتعقب الحرفي لـ "targetText" و "replacementText" لتسهيل عمليات الإصلاح التلقائي بضغطة زر.`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            issues: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  type: { type: "STRING", enum: ["error", "warning"] },
                  line: { type: "INTEGER" },
                  message: { type: "STRING" },
                  explanation: { type: "STRING" },
                  suggestion: { type: "STRING" },
                  targetText: { type: "STRING" },
                  replacementText: { type: "STRING" },
                  cvss: { type: "NUMBER" },
                  poc: { type: "STRING" },
                  cwe: { type: "STRING" },
                  isSecurityIssue: { type: "BOOLEAN" },
                  codeQuote: { type: "STRING" },
                  taintFlow: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  },
                  attackChain: { type: "STRING" },
                  simulatedImpact: { type: "STRING" },
                  dependencyCond: { type: "STRING" }
                },
                required: ["id", "type", "line", "message", "explanation", "suggestion"]
              }
            }
          },
          required: ["issues"]
        }
      }
    });

    let resultData;
    try {
      resultData = JSON.parse(response.text || "{}");
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse API response JSON" }, { status: 500 });
    }

    return NextResponse.json(resultData);
  } catch (error: any) {
    // If it's a quota issue, return an empty issues list so the frontend doesn't break
    if (error?.message?.includes("QUOTA") || error?.message?.includes("429")) {
      return NextResponse.json({ issues: [] });
    }
    return NextResponse.json({ error: "Failed to compile deep code linting" }, { status: 500 });
  }
}
