// Client-side code diagnostics, checks and preprocessing for HTML & React (Babel)

export const isReactCode = (codeString: string): boolean => {
  if (!codeString) return false;
  
  // Also translate Arabic code before detecting compiling mode!
  const translated = preprocessArabicCode(codeString);
  const trimmed = translated.trim();
  if (trimmed.toLowerCase().startsWith('<!doctype html') || trimmed.toLowerCase().startsWith('<html') || trimmed.toLowerCase().startsWith('<!doctype')) {
    return false;
  }
  
  const reactKeywords = [
    'import React',
    'import {',
    'useState(',
    'useEffect(',
    'useRef(',
    'useMemo(',
    'useCallback(',
    'export default function',
    'export default class',
    'export const',
    'return (',
    'return <',
    'class App extends',
    'createRoot(',
    'ReactDOM.'
  ];
  
  const hasKeyword = reactKeywords.some(keyword => translated.includes(keyword));
  const hasJSXReturn = /return\s*\(\s*</.test(translated) || /return\s*</.test(translated) || /className\s*=/.test(translated);
  
  return hasKeyword || hasJSXReturn;
};

export const preprocessReactCode = (rawCode: string): string => {
  let processed = rawCode;
  
  // 1. Clear side-effect CSS/asset imports
  processed = processed.replace(/import\s+['"][^'"]+['"]\s*;?/gi, '');
  
  // 2. Rewrite React named imports & general named imports (multi-line & single-line)
  const importRegex = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]\s*;?/gi;
  
  processed = processed.replace(importRegex, (match, importsStr, moduleName) => {
    importsStr = importsStr.trim();
    moduleName = moduleName.trim();
    
    // Namespace import: import * as X from 'module'
    if (importsStr.startsWith('* as ')) {
      const alias = importsStr.substring(5).trim();
      if (moduleName === 'react') {
        return `// react namespace\n`;
      }
      return `const ${alias} = window.MockModules['${moduleName}'] || {};\n`;
    }
    
    const hasBraces = importsStr.includes('{') && importsStr.includes('}');
    let defaultImport = '';
    let namedImportsStr = '';
    
    if (hasBraces) {
      const braceStart = importsStr.indexOf('{');
      const braceEnd = importsStr.indexOf('}');
      namedImportsStr = importsStr.substring(braceStart + 1, braceEnd).trim();
      
      const beforeBrace = importsStr.substring(0, braceStart).trim();
      if (beforeBrace && beforeBrace.endsWith(',')) {
        defaultImport = beforeBrace.slice(0, -1).trim();
      } else {
        defaultImport = beforeBrace;
      }
    } else {
      defaultImport = importsStr;
    }
    
    let result = '';
    
    // Handle default import (prevent redeclaring React block variables to avoid JavaScript reference crashes)
    if (defaultImport && defaultImport !== 'React') {
      if (moduleName === 'react') {
        result += `const ${defaultImport} = React;\n`;
      } else {
        result += `const ${defaultImport} = window.MockModules['${moduleName}']?.default || window.MockModules['${moduleName}'] || {};\n`;
      }
    }
    
    // Handle named imports
    if (namedImportsStr) {
      const destructuredNames = namedImportsStr.split(',').map(n => {
        const parts = n.trim().split(/\s+as\s+/);
        if (parts.length === 2) {
          return `${parts[0].trim()}: ${parts[1].trim()}`;
        }
        return parts[0].trim();
      }).filter(Boolean).join(', ');

      if (destructuredNames) {
        if (moduleName === 'react') {
          result += `const { ${destructuredNames} } = React;\n`;
        } else {
          result += `const { ${destructuredNames} } = window.MockModules['${moduleName}'] || {};\n`;
        }
      }
    }
    
    return result;
  });

  // Strip any lingering standard imports that were not covered to satisfy Babel standalone compiler in browser
  processed = processed.replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*;?/gi, '');
  processed = processed.replace(/import\s+[^;]+;?/gi, ''); 
  
  // 3. Robust exports rewriter
  let exportDefaultName = '';

  // Match anonymous arrow default export: export default () => { ... } or export default (props) => { ... }
  processed = processed.replace(/export\s+default\s+(?:\(\s*([^)]*)\s*\)|([a-zA-Z0-9_$]+))\s*=>/g, (match, args, singleArg) => {
    exportDefaultName = '_AnonymousApp';
    const finalArgs = singleArg || args || '';
    return `const _AnonymousApp = (${finalArgs}) =>`;
  });

  // Match anonymous function default export: export default function(...) { ... }
  processed = processed.replace(/export\s+default\s+function\s*\(\s*([^)]*)\s*\)/g, (match, args) => {
    exportDefaultName = '_AnonymousApp';
    return `function _AnonymousApp(${args || ''})`;
  });

  // Match standard named default functions: export default function App
  processed = processed.replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, (_, name) => {
    exportDefaultName = name;
    return `function ${name}`;
  });

  // Match default class export: export default class App
  processed = processed.replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/g, (_, name) => {
    exportDefaultName = name;
    return `class ${name}`;
  });

  // Match named variable default exports: export default App;
  processed = processed.replace(/export\s+default\s+([A-Za-z0-9_]+)\s*;?/g, (_, name) => {
    exportDefaultName = name;
    return '';
  });

  // Strip named exports but keep implementation
  processed = processed.replace(/export\s+const\s+([A-Za-z0-9_]+)/g, (_, name) => {
    return `const ${name}`;
  });

  processed = processed.replace(/export\s+function\s+([A-Za-z0-9_]+)/g, (_, name) => {
    return `function ${name}`;
  });

  processed = processed.replace(/export\s+class\s+([A-Za-z0-9_]+)/g, (_, name) => {
    return `class ${name}`;
  });

  if (exportDefaultName) {
    processed += `\nwindow._exports = { default: ${exportDefaultName} };`;
  }

  return processed;
};

export interface DiagnosticIssue {
  id: string;
  type: 'error' | 'warning';
  line: number;
  message: string;
  explanation: string;
  suggestion: string;
  targetText?: string;
  replacementText?: string;
  cvss?: number;
  poc?: string;
  cwe?: string;
  isSecurityIssue?: boolean;
}

export const getClientSideDiagnostics = (codeText: string, isReact: boolean): DiagnosticIssue[] => {
  const issues: DiagnosticIssue[] = [];
  if (!codeText) return issues;

  // Rule 1: Brackets Balance Check
  const balanceCheck = (openChar: string, closeChar: string, nameAr: string) => {
    let openCount = 0;
    let closeCount = 0;
    for (let i = 0; i < codeText.length; i++) {
      if (codeText[i] === openChar) openCount++;
      if (codeText[i] === closeChar) closeCount++;
    }
    if (openCount !== closeCount) {
      issues.push({
        id: `balance-${openChar}`,
        type: 'error',
        line: 1,
        message: `عدم توازن في الأقواس ${nameAr}`,
        explanation: `مجموع أقواس الفتح '${openChar}' هو ${openCount}، بينما مجموع أقواس الإغلاق '${closeChar}' هو ${closeCount}. هذا يسبب خللاً في تشغيل الكود البرمجي.`,
        suggestion: `تأكد من موازنة كل قوس فتح '${openChar}' بقوس إغلاق '${closeChar}' مطابق له.`
      });
    }
  };

  balanceCheck('{', '}', 'الموجية (Curly Braces)');
  balanceCheck('[', ']', 'المربعة (Square Brackets)');
  balanceCheck('(', ')', 'الدائرية (Parentheses)');

  // Rule 2: React-Specific Checks
  if (isReact) {
    const classRegex = /\sclass=(['"])(.*?)\1/g;
    let match;
    while ((match = classRegex.exec(codeText)) !== null) {
      const matchText = match[0];
      const classVal = match[2];
      const matchIndex = match.index;
      const beforeMatch = codeText.substring(0, matchIndex);
      const lineNum = beforeMatch.split('\n').length;
      
      issues.push({
        id: `react-class-${matchIndex}`,
        type: 'warning',
        line: lineNum,
        message: 'استخدام class بدلاً من className',
        explanation: `في كود React (JSX)، تعتبر الكلمة 'class' كلمة محجوزة في لغة JavaScript. يجب استخدام السمة 'className' بدلاً منها لتحديد الفئات التنسيقية.`,
        suggestion: `استبدل السمة 'class' بـ 'className' لتتوافق مع بيئة React.`,
        targetText: matchText,
        replacementText: ` className=${match[1]}${classVal}${match[1]}`
      });
    }

    const htmlCommentRegex = /<!--([\s\S]*?)-->/g;
    while ((match = htmlCommentRegex.exec(codeText)) !== null) {
      const matchText = match[0];
      const commentContent = match[1];
      const matchIndex = match.index;
      const beforeMatch = codeText.substring(0, matchIndex);
      const lineNum = beforeMatch.split('\n').length;

      issues.push({
        id: `react-comment-${matchIndex}`,
        type: 'warning',
        line: lineNum,
        message: 'استخدام تعليقات HTML قياسية داخل React',
        explanation: `تستخدم React تعليقات الأقواس الموجية داخل JSX: {/* تعليقك هنا */} بدلاً من تعليقات HTML القياسية <!-- ... --> التي قد تتسبب في توقف المترجم.`,
        suggestion: `استبدل تعليق HTML بـ تعليق JSX الصحيح.`,
        targetText: matchText,
        replacementText: `{/*${commentContent}*/}`
      });
    }

    const inlineStyleStringRegex = /style=["']([^"']+)["']/g;
    while ((match = inlineStyleStringRegex.exec(codeText)) !== null) {
      const matchText = match[0];
      const matchIndex = match.index;
      const beforeMatch = codeText.substring(0, matchIndex);
      const lineNum = beforeMatch.split('\n').length;

      issues.push({
        id: `react-styleString-${matchIndex}`,
        type: 'warning',
        line: lineNum,
        message: 'تنسيق داخلي كسلسلة نصية بدلاً من كائن (Object)',
        explanation: `تتوقع React قيمة السمة 'style' ككائن برمجي (Object)، مثل: style={{}} بدلاف من التنسيق النصي العادي style="..." المتبع في HTML.`,
        suggestion: `قم بتحويل النمط النصي إلى كائن React، مثل: style={{ color: "red" }}.`
      });
    }

    const hookInIfRegex = /if\s*\(.*?\)\s*\{[^}]*\b(useState|useEffect|useRef|useMemo|useCallback)\b/g;
    while ((match = hookInIfRegex.exec(codeText)) !== null) {
      const matchIndex = match.index;
      const beforeMatch = codeText.substring(0, matchIndex);
      const lineNum = beforeMatch.split('\n').length;
      const hookName = match[1];

      issues.push({
        id: `react-hookRule-${matchIndex}`,
        type: 'error',
        line: lineNum,
        message: `تم تعريف ${hookName} داخل جملة شرطية`,
        explanation: `تنص قواعد React الصارمة (Rules of Hooks) على وجوب استدعاء الـ Hooks في المستوى الأعلى للمكون فقط. لا تستدعِ الـ Hooks داخل جمل شرطية أو حلقات تكرارية.`,
        suggestion: `انقل استدعاء الـ Hook '${hookName}' إلى السطور الأولى في دالة المكون.`
      });
    }

    const hasExportDefault = codeText.includes('export default') || codeText.includes('function App') || codeText.includes('function Main');
    if (!hasExportDefault) {
      issues.push({
        id: `react-missingExport`,
        type: 'error',
        line: 1,
        message: 'مكون دخل رئيسي مفقود',
        explanation: `لم يتم العثور على تصدير لمكون افتراضي (export default) أو دالة باسم App أو Main. قد يواجه المحاكي مشكلة في تشغيل الصفحة.`,
        suggestion: 'تأكد من إعلان دالة مكون رئيسية والبدء بتصديرها: export default function App() { ... }'
      });
    }
  } else {
    const classNameRegex = /\sclassName=(['"])(.*?)\1/g;
    let match;
    while ((match = classNameRegex.exec(codeText)) !== null) {
      const matchText = match[0];
      const classVal = match[2];
      const matchIndex = match.index;
      const beforeMatch = codeText.substring(0, matchIndex);
      const lineNum = beforeMatch.split('\n').length;

      issues.push({
        id: `html-classname-${matchIndex}`,
        type: 'warning',
        line: lineNum,
        message: 'استخدام className في كود HTML قياسي',
        explanation: `تستخدم ملفات HTML القياسية الكلمة المفتاحية 'class' لحجم كود أصغر وتوافقية كاملة، بينما 'className' مخصصة فقط لـ React.`,
        suggestion: `استبدل 'className' بـ 'class'.`,
        targetText: matchText,
        replacementText: ` class=${match[1]}${classVal}${match[1]}`
      });
    }

    const tagsStack: { name: string; line: number }[] = [];
    const htmlTagRegex = /<(\/?[a-zA-Z0-9:-]+)([^>]*?)>/g;
    const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    
    while ((match = htmlTagRegex.exec(codeText)) !== null) {
      let tagName = match[1];
      const tagContent = match[2];
      const matchIndex = match.index;
      const beforeMatch = codeText.substring(0, matchIndex);
      const lineNum = beforeMatch.split('\n').length;

      const isClosing = tagName.startsWith('/');
      if (isClosing) {
        tagName = tagName.substring(1);
      }

      tagName = tagName.toLowerCase();
      const isSelfClosing = tagContent.trim().endsWith('/') || voidElements.has(tagName);

      if (!isSelfClosing) {
        if (!isClosing) {
          tagsStack.push({ name: tagName, line: lineNum });
        } else {
          if (tagsStack.length === 0) {
            issues.push({
              id: `html-extraClose-${matchIndex}`,
              type: 'warning',
              line: lineNum,
              message: `وسم إغلاق زائد </${tagName}>`,
              explanation: `تم إغلاق الوسم </${tagName}> دون فتح عنصر مقابل له مسبقاً في الصفحة.`,
              suggestion: `تخلص من وسم الإغلاق الزائد لضمان هيكلية DOM سليمة.`,
              targetText: match[0],
              replacementText: ''
            });
          } else {
            const lastOpened = tagsStack[tagsStack.length - 1];
            if (lastOpened.name === tagName) {
              tagsStack.pop();
            } else {
              issues.push({
                id: `html-mismatch-${matchIndex}`,
                type: 'warning',
                line: lineNum,
                message: `تداخل غير متوافق للوسوم (فتح <${lastOpened.name}> وإغلاق </${tagName}>)`,
                explanation: `تم فتح العنصر <${lastOpened.name}> في السطر ${lastOpened.line}، ولكن تم محاولة إغلاق القالب بـ </${tagName}> في السطر ${lineNum}. تفرض المعايير إغلاق العناصر بترتبيتها العكسية للفتح.`,
                suggestion: `أغلق العنصر <${lastOpened.name}> أولاً قبل إغلاق العناصر الخارجية.`
              });
              tagsStack.pop();
            }
          }
        }
      }
    }

    tagsStack.forEach((unclosed, idx) => {
      issues.push({
        id: `html-unclosed-${idx}-${unclosed.line}`,
        type: 'warning',
        line: unclosed.line,
        message: `وسم غير مغلق <${unclosed.name}>`,
        explanation: `تم فتح العنصر <${unclosed.name}> في السطر ${unclosed.line} ولكن لم يتم إغلاقه تالياً في كود الصفحة.`,
        suggestion: `قم بإضافة وسم الإغلاق المناسب </${unclosed.name}> لإغلاق العنصر بأمان.`
      });
    });

    const idRegex = /\sid=(['"])(.*?)\1/g;
    const detectedIds = new Map<string, number[]>();
    while ((match = idRegex.exec(codeText)) !== null) {
      const idVal = match[2];
      const matchIndex = match.index;
      const beforeMatch = codeText.substring(0, matchIndex);
      const lineNum = beforeMatch.split('\n').length;

      if (!detectedIds.has(idVal)) {
        detectedIds.set(idVal, []);
      }
      detectedIds.get(idVal)!.push(lineNum);
    }

    detectedIds.forEach((linesList, idVal) => {
      if (linesList.length > 1) {
        issues.push({
          id: `html-dup-id-${idVal}`,
          type: 'warning',
          line: linesList[1],
          message: `معرّف ID مكرر: '${idVal}'`,
          explanation: `تم تكرار المعرّف الفريد 'id="${idVal}"' في السطور التالية: ${linesList.join(', ')}. يجب أن يكون المعرّف فريداً تماماً في مستند الويب لتمكين الـ JavaScript والـ CSS من استهدافه بسلامة.`,
          suggestion: `قم بتعديل قيم المعرّف ID ليكون لكل عنصر معرّف فريد وخاص به، أو استبدله بصنف (Class) مشترك.`
        });
      }
    });

    if (!codeText.toLowerCase().includes('<!doctype html') && !codeText.toLowerCase().includes('<html')) {
      issues.push({
        id: `html-missingDoctype`,
        type: 'warning',
        line: 1,
        message: 'مستند يفتقد لإعلان النوع DOCTYPE كـ HTML5',
        explanation: `يبدأ المستند مباشرة دون إعلان الترويسة الأساسية <!DOCTYPE html> أو وسم <html>. قد يتسبب هذا في تفعيل وضع Quirks Mode من مستعرض الويب وتغيير الأنماط والتنسيق التوافقي.`,
        suggestion: 'أضف العبارة التقنية <!DOCTYPE html> في السطر الأول من الملف.'
      });
    }
  }

  return issues;
};

// Robust Arabic coding map & preprocessor to support Arabic-based HTML and JSX compilation in NEXUS on the fly
export function preprocessArabicCode(rawCode: string): string {
  if (!rawCode) return rawCode;
  let processed = rawCode;
  
  // 1. Arabic HTML element/tag names map
  const tagMapping: { [key: string]: string } = {
    'حاوية': 'div',
    'طاقة': 'div',
    'طاقه': 'div',
    'بطاقة': 'div',
    'بطاقه': 'div',
    'عنوان1': 'h1',
    'عنوان2': 'h2',
    'عنوان3': 'h3',
    'عنوان4': 'h4',
    'عنوان5': 'h5',
    'عنوان6': 'h6',
    'فقرة': 'p',
    'رابط': 'a',
    'صورة': 'img',
    'زر': 'button',
    'قائمة': 'ul',
    'قائمة-مرتبة': 'ol',
    'عنصر-قائمة': 'li',
    'جدول': 'table',
    'صف': 'tr',
    'خلية': 'td',
    'رأس-جدول': 'th',
    'جسم-جدول': 'tbody',
    'مدخل': 'input',
    'نموذج': 'form',
    'نص-طويل': 'textarea',
    'تحديد': 'select',
    'خيار': 'option',
    'تسمية': 'label',
    'فيديو': 'video',
    'صوت': 'audio',
    'لوحة': 'canvas',
    'سبان': 'span',
    'قسم': 'section',
    'رأس': 'header',
    'تذييل': 'footer',
    'مستند': 'html',
    'جسم': 'body',
    'رأس-مستند': 'head',
    'عنوان-الصفحة': 'title'
  };

  // Replace tags: <حاوية -> <div, </حاوية> -> </div>
  Object.keys(tagMapping).forEach(arTag => {
    const enTag = tagMapping[arTag];
    
    // Match opening tags: <Tag followed by space or >
    const openRegex = new RegExp(`<(${arTag})([\\s>])`, 'g');
    processed = processed.replace(openRegex, `<${enTag}$2`);
    
    // Match closing tags: </Tag followed by space or >
    const closeRegex = new RegExp(`</(${arTag})([\\s>])`, 'g');
    processed = processed.replace(closeRegex, `</${enTag}$2`);
  });

  // 2. Arabic attributes inside tags
  const attrMapping: { [key: string]: string } = {
    'كلاس': 'class',
    'فئة': 'class',
    'معرف': 'id',
    'هوية': 'id',
    'تنسيق': 'style',
    'مظهر': 'style',
    'مصدر': 'src',
    'مسار': 'src',
    'رابط': 'href',
    'بديل': 'alt',
    'قيمة': 'value',
    'مكان': 'placeholder',
    'مؤقت': 'placeholder',
    'نوع': 'type',
    'عرض': 'width',
    'ارتفاع': 'height',
    'الحدث': 'onClick',
    'ضغطة': 'onClick',
    'عند_الضغط': 'onClick',
    'عند_التغيير': 'onChange',
    'عند_الإرسال': 'onSubmit'
  };

  Object.keys(attrMapping).forEach(arAttr => {
    const enAttr = attrMapping[arAttr];
    // Match Arabic attributes preceded by a space or parenthesis and followed by equals (with optional spaces around)
    const attrRegex = new RegExp(`([\\s({])(${arAttr})\\s*=\\s*`, 'g');
    processed = processed.replace(attrRegex, `$1${enAttr}=`);
  });

  // 3. Standalone boolean attributes (e.g., مغلق, معطل, مطلوب, تلقائي, تحكم) inside tags or code
  const booleanMapping: { [key: string]: string } = {
    'معطل': 'disabled',
    'مغلق': 'disabled',
    'مطلوب': 'required',
    'تلقائي': 'autoplay',
    'تحكم': 'controls'
  };

  Object.keys(booleanMapping).forEach(arBool => {
    const enBool = booleanMapping[arBool];
    // Word boundary replace to safeguard Arabic content safely
    const boolRegex = new RegExp(`\\b(${arBool})\\b`, 'g');
    processed = processed.replace(boolRegex, enBool);
  });

  // 4. JavaScript/JSX core keywords translation for Arabic React code definition
  const jsMapping: { [key: string]: string } = {
    'استيراد': 'import',
    'من': 'from',
    'تصدير': 'export',
    'افتراضي': 'default',
    'دالة': 'function',
    'ثابت': 'const',
    'متغير': 'let',
    'إرجاع': 'return',
    'استخدم_حالة': 'useState',
    'استخدم_تأثير': 'useEffect',
    'استخدم_مرجع': 'useRef'
  };

  Object.keys(jsMapping).forEach(arJS => {
    const enJS = jsMapping[arJS];
    // Safeguard by ensuring match has word boundaries or punctuation surroundings
    const jsRegex = new RegExp(`\\b(${arJS})\\b`, 'g');
    processed = processed.replace(jsRegex, enJS);
  });

  return processed;
}

// Check if raw text represents a plain natural language Arabic instruction rather than actual HTML/JSX syntax
export function checkIsPlainPrompt(codeText: string): boolean {
  if (!codeText) return false;
  const trimmed = codeText.trim();
  if (trimmed.length < 5) return false;
  
  // If it has any typical HTML or XML tags, it's probably code
  if (/<[a-zA-Zأ-ي]+[^>]*>/.test(trimmed)) return false;
  
  // If it has standard JS symbols or keywords
  if (/\b(const|let|var|function|import|export|return)\b/.test(trimmed)) return false;
  
  // If it has common Arabic words used for prompting
  const promptKeywords = [
    'اعمل', 'أنشئ', 'صمم', 'اكتب', 'سوي', 'تعديل', 'ضيف', 'اضف', 'صلح', 'ابني', 'أريد', 'اريد', 'ابي', 'ابغى', 'كيف', 'ممكن', 'تغيير', 'طريقه', 'طريقة', 'تعمل', 'حاوية', 'بطاقة', 'طاقة', 'طاقه', 'حاويه'
  ];
  const hasPromptKeyword = promptKeywords.some(keyword => trimmed.includes(keyword));
  
  // Arabic text check (approximate regex)
  const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
  
  return hasArabic && (hasPromptKeyword || trimmed.split(' ').length > 2);
}
