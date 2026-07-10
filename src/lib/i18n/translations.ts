/**
 * NEXUS i18n — Translation dictionary
 * Organized by feature area for maintainability.
 * Keys are dot-notation: `area.key`
 */

import type { Lang } from './detect';

type Dict = Record<string, { ar: string; en: string }>;

export const translations: Dict = {
  // ============ LAYOUT / META ============
  'meta.title': { ar: 'NEXUS — بيئة تطوير ذكية بالعربية', en: 'NEXUS — AI-Powered Arabic IDE' },
  'meta.description': { ar: 'بيئة تطوير ذكية لكتابة ومعاينة الأكواد مع محرك أمان سيبراني متقدم مدعوم بالذكاء الاصطناعي', en: 'A smart development environment for writing and previewing code with an AI-powered cybersecurity engine' },

  // ============ NAV TABS ============
  'nav.editor': { ar: 'المحرر', en: 'Editor' },
  'nav.preview': { ar: 'المعاينة', en: 'Preview' },
  'nav.agent': { ar: 'الذكاء', en: 'Agent' },

  // ============ HEADER ============
  'header.compress': { ar: 'ضغط الملفات', en: 'Compress' },
  'header.loop': { ar: 'الحلقة', en: 'Loop' },
  'header.tests': { ar: 'الاختبارات', en: 'Tests' },
  'header.upload': { ar: 'رفع ملف', en: 'Upload' },
  'header.download': { ar: 'تنزيل', en: 'Download' },
  'header.compressTooltip': { ar: 'أداة ضغط الملفات', en: 'File Compression Tool' },
  'header.loopTooltip': { ar: 'لوحة الحلقة', en: 'Loop Dashboard' },
  'header.testsTooltip': { ar: 'مشغّل الاختبارات', en: 'Test Runner' },
  'header.uploadTooltip': { ar: 'رفع ملف أو مشروع ZIP', en: 'Upload a file or ZIP project' },

  // ============ DOWNLOAD MENU ============
  'menu.downloadCurrent': { ar: 'تنزيل الملف المفتوح', en: 'Download current file' },
  'menu.downloadProjectZip': { ar: 'تحميل المشروع بالكامل (.ZIP)', en: 'Download entire project (.ZIP)' },
  'menu.downloadAsMd': { ar: 'تنزيل كمستند توثيق .md', en: 'Download as .md documentation' },
  'menu.copyAllCode': { ar: 'نسخ الكود بالكامل', en: 'Copy all code' },
  'menu.codeCopied': { ar: 'تم نسخ الكود!', en: 'Code copied!' },

  // ============ DRAG & DROP OVERLAY ============
  'dropzone.title': { ar: 'أفلت الملف هنا للرفع', en: 'Drop file here to upload' },
  'dropzone.description': { ar: 'سيتم قراءة محتوى الملف وتحديث المحرر فوراً بكل سهولة وأمان بلمح البصر.', en: 'The file content will be read and the editor updated instantly, safely and effortlessly.' },
  'dropzone.supportedTypes': { ar: 'دعم كامل لـ .html, .css, .js, .tsx, .txt, .json, .zip', en: 'Full support for .html, .css, .js, .tsx, .txt, .json, .zip' },

  // ============ EDITOR TOOLBAR ============
  'editor.fileExplorer': { ar: 'مستكشف ملفات المشروع', en: 'Project File Explorer' },
  'editor.lint': { ar: 'فحص الأخطاء والمشاكل الأمنية', en: 'Security & Error Analysis' },
  'editor.arabicCode': { ar: 'البرمجة بالعربية 🌟', en: 'Arabic Coding 🌟' },
  'editor.copyRange': { ar: 'النسخ الدقيق للأكواد بين سطرين', en: 'Precise Code Range Copy' },
  'editor.search': { ar: 'البحث والاستبدال المتقدم (Ctrl+F)', en: 'Advanced Search & Replace (Ctrl+F)' },
  'editor.format': { ar: 'تنسيق الأكواد تلقائياً', en: 'Auto-format Code' },
  'editor.icons': { ar: 'مكتبة أيقونات (Lucide)', en: 'Icon Library (Lucide)' },
  'editor.saveVersion': { ar: 'حفظ نسخة يدوية', en: 'Save Version Manually' },
  'editor.history': { ar: 'سجل التغييرات', en: 'Change History' },
  'editor.clearCode': { ar: 'حذف الكود', en: 'Clear Code' },
  'editor.newFile': { ar: 'ملف جديد', en: 'New File' },
  'editor.newFolder': { ar: 'مجلد جديد', en: 'New Folder' },
  'editor.deleteProject': { ar: 'حذف المشروع بالكامل', en: 'Delete Entire Project' },
  'editor.filterFiles': { ar: 'تصفية الملفات...', en: 'Filter files...' },
  'editor.newFileIn': { ar: 'ملف جديد داخل هذا المجلد', en: 'New file in this folder' },
  'editor.rename': { ar: 'إعادة التسمية', en: 'Rename' },
  'editor.delete': { ar: 'حذف', en: 'Delete' },
  'editor.arabicHelpTooltip': { ar: 'دليل البرمجة باللغة العربية وتحميل القوالب', en: 'Arabic coding guide and template loader' },
  'editor.confirmClear': { ar: 'تأكيد الحذف؟', en: 'Confirm clear?' },
  'editor.copyPanelTitle': { ar: 'النسخ الدقيق بين سطرين', en: 'Precise Copy Between Two Lines' },
  'editor.fromLine': { ar: 'من سطر:', en: 'From line:' },
  'editor.toLine': { ar: 'إلى سطر:', en: 'To line:' },
  'editor.copyRangeShort': { ar: 'النسخ الدقيق للأكواد', en: 'Precise Code Copy' },
  'editor.copyRangeButton': { ar: 'نسخ النطاق 🚀', en: 'Copy Range 🚀' },
  'editor.closeCopy': { ar: 'إغلاق النسخ', en: 'Close copy' },
  'editor.folderNamePlaceholder': { ar: 'اسم المجلد...', en: 'Folder name...' },
  'editor.fileNamePlaceholder': { ar: 'اسم الملف...', en: 'File name...' },
  'editor.loadingEngine': { ar: 'جاري تحميل محرك الأكواد المتطور...', en: 'Loading advanced code engine...' },
  'editor.defaultProjectName': { ar: 'مشروع جديد', en: 'New Project' },
  'editor.myProject': { ar: 'مشروعي', en: 'My Project' },

  // ============ EDITOR STATUS BAR ============
  'editor.lines': { ar: 'سطر', en: 'lines' },
  'editor.chars': { ar: 'حرف', en: 'chars' },
  'editor.ln': { ar: 'السطر:', en: 'LN:' },
  'editor.col': { ar: 'العمود:', en: 'COL:' },

  // ============ VERSION HISTORY ============
  'history.title': { ar: 'سجل التغييرات', en: 'Change History' },
  'history.empty': { ar: 'لا توجد نسخ محفوظة بعد', en: 'No saved versions yet' },
  'history.manual': { ar: 'يدوي', en: 'Manual' },
  'history.auto': { ar: 'تلقائي', en: 'Auto' },
  'history.restore': { ar: 'استعادة', en: 'Restore' },
  'history.restored': { ar: '✓ تم استعادة النسخة بنجاح', en: '✓ Version restored successfully' },

  // ============ PREVIEW ============
  'preview.desktop': { ar: 'سطح المكتب', en: 'Desktop' },
  'preview.tablet': { ar: 'لوحي', en: 'Tablet' },
  'preview.mobile': { ar: 'موبايل', en: 'Mobile' },
  'preview.split': { ar: 'عرض منقسم (مقارنة)', en: 'Split View (Compare)' },
  'preview.perfMonitor': { ar: 'لوحة الأداء', en: 'Performance Monitor' },
  'preview.inspectActive': { ar: 'التفتيش نشط', en: 'Inspect Active' },
  'preview.inspector': { ar: 'مفتش HTML', en: 'HTML Inspector' },

  // ============ AGENT / CHAT ============
  'agent.greeting': { ar: 'مرحباً! أنا وكيلك الذكي. اكتب طلبك وسأساعدك.', en: "Hello! I'm your AI agent. Type your request and I'll help you." },
  'agent.inputPlaceholder': { ar: 'اكتب رسالتك هنا...', en: 'Type your message here...' },
  'agent.send': { ar: 'إرسال', en: 'Send' },
  'agent.copy': { ar: 'نسخ', en: 'Copy' },
  'agent.copyCode': { ar: 'نسخ الكود', en: 'Copy code' },
  'agent.copied': { ar: 'تم النسخ', en: 'Copied' },
  'agent.deleteChat': { ar: 'حذف المحادثة', en: 'Delete conversation' },
  'agent.modeChat': { ar: 'مستشار', en: 'Advisor' },
  'agent.modeCode': { ar: 'مهندس', en: 'Engineer' },
  'agent.modeUI': { ar: 'مصمم', en: 'Designer' },
  'agent.modeFullStack': { ar: 'Full-Stack', en: 'Full-Stack' },
  'agent.thinking': { ar: 'يفكر...', en: 'Thinking...' },
  'agent.newChat': { ar: 'محادثة جديدة', en: 'New chat' },
  'agent.thumbsUp': { ar: 'إعجاب', en: 'Like' },
  'agent.thumbsDown': { ar: 'عدم إعجاب', en: 'Dislike' },
  'agent.you': { ar: 'أنت', en: 'You' },
  'agent.attachFile': { ar: 'إرفاق ملف', en: 'Attach file' },
  'agent.voiceInput': { ar: 'إدخال صوتي', en: 'Voice input' },
  'agent.clearChatTooltip': { ar: 'حذف وتفريغ الشات بالكامل', en: 'Clear and empty the entire chat' },
  'agent.emptyState': { ar: 'ابدأ بكتابة طلبك في الأسفل', en: 'Start by typing your request below' },
  'agent.likeTooltip': { ar: 'أعجبني', en: 'Like' },
  'agent.dislikeTooltip': { ar: 'لم يعجبني', en: 'Dislike' },
  'agent.copyMessageTooltip': { ar: 'نسخ الرسالة', en: 'Copy message' },
  'agent.showLess': { ar: 'عرض أقل', en: 'Show less' },
  'agent.showMore': { ar: 'عرض المزيد', en: 'Show more' },
  'agent.aiWorking': { ar: 'الذكاء الاصطناعي يعمل الآن...', en: 'AI is working now...' },
  'agent.fallbackStep1': { ar: 'جاري تحليل السياق واستخراج التفاصيل...', en: 'Analyzing context and extracting details...' },
  'agent.fallbackStep2': { ar: 'تحليل طبيعة الطلب والتعديلات المطلوبة...', en: 'Analyzing the request nature and required modifications...' },
  'agent.fallbackStep3': { ar: 'صياغة الكود النهائي والتأكد من جودته...', en: 'Crafting the final code and ensuring its quality...' },
  'agent.changeModeTooltip': { ar: 'تغيير وضع التطوير والإنشاء', en: 'Change development and generation mode' },
  'agent.fullStackMode': { ar: 'مشروع كامل (Full-Stack) ⚡', en: 'Full project (Full-Stack) ⚡' },
  'agent.singleCodeMode': { ar: 'تعديل كود فردي 🌐', en: 'Single code edit 🌐' },
  'agent.singleCodeShort': { ar: 'كود فردي', en: 'Single code' },
  'agent.moreOptionsTooltip': { ar: 'خيارات إضافية وإرفاق ملفات', en: 'More options and file attachment' },
  'agent.attachCodeFile': { ar: 'إرفاق ملف كود/نص', en: 'Attach code/text file' },
  'agent.htmlTemplate': { ar: 'قالب صفحة HTML', en: 'HTML page template' },
  'agent.reactTemplate': { ar: 'قالب مكون React', en: 'React component template' },
  'agent.listening': { ar: 'جاري الاستماع إليك بكل وضوح...', en: 'Listening to you clearly...' },
  'agent.inputPlaceholderIdea': { ar: 'اكتب فكرتك أو استفسارك هنا...', en: 'Type your idea or question here...' },
  'agent.voiceInputArabic': { ar: 'إدخال صوتي ذكي باللغة العربية', en: 'Smart Arabic voice input' },

  // ============ LINTER ============
  'linter.title': { ar: 'الفاحص', en: 'Linter' },
  'linter.realtime': { ar: 'تحليل فوري', en: 'Real-time' },
  'linter.ai': { ar: 'تحليل ذكي', en: 'AI Analysis' },
  'linter.noIssues': { ar: 'لا توجد مشاكل', en: 'No issues found' },
  'linter.scan': { ar: 'فحص الأمان', en: 'Security Scan' },
  'linter.scanning': { ar: 'جاري الفحص...', en: 'Scanning...' },
  'linter.header': { ar: 'مدقق وتصحيح الأخطاء', en: 'Bug Checker & Fixer' },
  'linter.realtimeTab': { ar: 'فحص فوري', en: 'Real-time scan' },
  'linter.aiTab': { ar: 'تحليل الـ AI', en: 'AI Analysis' },
  'linter.emptyTitle': { ar: 'تصميم ممتاز ومتناسق!', en: 'Excellent and consistent design!' },
  'linter.emptyDesc': { ar: 'لم يرصد مصحح الأخطاء الفوري أية مشاكل برمجية أو علامات توازن مفقودة في الكود الحالي.', en: 'The real-time bug checker did not detect any programming issues or missing balance markers in the current code.' },
  'linter.line': { ar: 'السطر', en: 'Line' },
  'linter.quickFix': { ar: 'إصلاح فوري بضغطة واحدة', en: 'One-click instant fix' },
  'linter.quickFixShort': { ar: 'إصلاح فوري للخطأ', en: 'Instant bug fix' },
  'linter.deepTitle': { ar: 'مدقق الأكواد المعمق من Gemini', en: 'Deep code checker powered by Gemini' },
  'linter.deepDesc': { ar: 'يستعين هذا المدقق بقدرات الذكاء الاصطناعي الأقوى لتحليل مكونات React وواجهات HTML دلالياً وكشف الأخطاء المنطقية وتوفير سياق تصميم فريد.', en: 'This checker leverages the most powerful AI capabilities to semantically analyze React components and HTML interfaces, detect logical errors, and provide unique design context.' },
  'linter.deepAnalyzing': { ar: 'جاري التحليل المعمق للرموز...', en: 'Deep code analysis in progress...' },
  'linter.startDeepScan': { ar: 'ابدأ الفحص المعزز بالـ AI ⚡', en: 'Start AI-enhanced scan ⚡' },
  'linter.aiReading': { ar: 'يقرأ الذكاء الاصطناعي سياقك...', en: 'AI is reading your context...' },
  'linter.aiReadingDesc': { ar: 'يتم الآن تفسير هيكلية الـ JSX وأنماط CSS للوقوف على التناسق والدقة التجميعية.', en: 'Now interpreting the JSX structure and CSS patterns to assess consistency and assembly precision.' },
  'linter.noDeepReviews': { ar: 'لا توجد مراجعات عميقة مخزنة', en: 'No deep reviews stored' },
  'linter.clickToRecord': { ar: 'اضغط على الزر الأخضر أعلاه لتسجيل النتيجة.', en: 'Click the green button above to record the result.' },

  // ============ COMPRESS MODAL ============
  'compress.title': { ar: 'ضغط الملفات', en: 'Compress Files' },
  'compress.dropzone': { ar: 'اسحب الملفات هنا أو اضغط للاختيار', en: 'Drag files here or click to select' },
  'compress.format': { ar: 'الصيغة', en: 'Format' },
  'compress.compress': { ar: 'ضغط', en: 'Compress' },
  'compress.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'compress.modalTitle': { ar: 'أداة ضغط الملفات', en: 'File Compression Tool' },
  'compress.dropNow': { ar: 'أفلت الملفات الآن', en: 'Drop files now' },
  'compress.dropHint': { ar: 'قم بتحميل وإفلات الملفات هنا', en: 'Upload and drop files here' },
  'compress.maxFilesLabel': { ar: 'الحد الأقصى', en: 'Maximum' },
  'compress.fileUnit': { ar: 'ملف', en: 'files' },
  'compress.storeOnly': { ar: 'تخزين فقط (للخطوط/الفيديو)', en: 'Store only (for fonts/video)' },
  'compress.removeFile': { ar: 'إزالة الملف', en: 'Remove file' },
  'compress.successTitle': { ar: 'تم الضغط بنجاح', en: 'Compression successful' },
  'compress.successDescStart': { ar: 'تم ضغط', en: 'Compressed' },
  'compress.successDescEnd': { ar: 'ملفات جاهزة للتحميل والتأمين.', en: 'files ready for download and securing.' },
  'compress.downloadFormat': { ar: 'تحميل', en: 'Download' },
  'compress.newTool': { ar: 'أداة جديدة', en: 'New tool' },
  'compress.compressing': { ar: 'يتم الضغط', en: 'Compressing' },
  'compress.startCompress': { ar: 'بدء الضغط', en: 'Start compression' },

  // ============ ICON HELPER ============
  'icons.title': { ar: 'مكتبة الأيقونات', en: 'Icon Library' },
  'icons.search': { ar: 'بحث عن أيقونة...', en: 'Search icons...' },
  'icons.copy': { ar: 'نسخ الاسم', en: 'Copy name' },
  'icons.size': { ar: 'الحجم', en: 'Size' },
  'icons.color': { ar: 'اللون', en: 'Color' },
  'icons.modalTitle': { ar: 'مكتبة أيقونات Lucide الـ SVG', en: 'Lucide SVG Icon Library' },
  'icons.modalDesc': { ar: 'خصص أيقونتك واضغط عليها لإدراج كود الـ SVG الخاص بها مباشرةً عند مؤشر الكتابة.', en: 'Customize your icon and click on it to insert its SVG code directly at the cursor.' },
  'icons.sizeLabel': { ar: 'الحجم النهائي (Size PX)', en: 'Final size' },
  'icons.strokeWidthLabel': { ar: 'سُمك الإطار (Stroke Width)', en: 'Stroke width' },
  'icons.colorLabel': { ar: 'اللون النشط (Color)', en: 'Active color' },
  'icons.colorAuto': { ar: 'تلقائي (currentColor)', en: 'Auto (currentColor)' },
  'icons.colorWhite': { ar: 'أبيض فاصع', en: 'Pure white' },
  'icons.colorEmerald': { ar: 'أخضر زمردي', en: 'Emerald green' },
  'icons.colorSky': { ar: 'أزرق سماوي', en: 'Sky blue' },
  'icons.colorGold': { ar: 'ذهبي لامع', en: 'Shiny gold' },
  'icons.colorDarkRed': { ar: 'أحمر داكن', en: 'Dark red' },
  'icons.colorCustom': { ar: 'مخصص (Hex Code)', en: 'Custom (Hex Code)' },
  'icons.searchPlaceholder': { ar: 'ابحث عن أيقونة... (مثال: home, user, شمس)', en: 'Search for an icon... (e.g. home, user, sun)' },
  'icons.noMatches': { ar: 'لم يتم العثور على أيقونات مطابقة لبحثك.', en: 'No matching icons found for your search.' },
  'icons.showAll': { ar: 'عرض جميع الأيقونات', en: 'Show all icons' },
  'icons.tip': { ar: 'نصيحة: يمكنك نسخ رابط Lucide CDN لتشغيل الأيقونات العادية بالكلاسات إذا رغبت.', en: 'Tip: you can copy the Lucide CDN link to enable regular icons via classes if you wish.' },
  'icons.linkCopied': { ar: 'تم نسخ الرابط!', en: 'Link copied!' },
  'icons.copyCdn': { ar: 'نسخ كود Lucide CDN', en: 'Copy Lucide CDN code' },

  // ============ INSPECT PANEL ============
  'inspect.title': { ar: 'المفتش', en: 'Inspector' },
  'inspect.element': { ar: 'العنصر', en: 'Element' },
  'inspect.styles': { ar: 'الأنماط', en: 'Styles' },
  'inspect.computed': { ar: 'المحسوبة', en: 'Computed' },
  'inspect.selected': { ar: 'العنصر المحدَّد', en: 'Selected element' },
  'inspect.copyModified': { ar: 'نسخ كود CSS المعدَّل', en: 'Copy modified CSS' },
  'inspect.copied': { ar: 'تم نسخ التنسيق!', en: 'CSS copied!' },
  'inspect.liveStyles': { ar: 'التنسيقات المباشرة (CSS Property)', en: 'Live styles (CSS Property)' },
  'inspect.rawInline': { ar: 'التنسيق المضمن الشامل (Raw CSS Inline)', en: 'Raw inline CSS' },
  'inspect.id': { ar: 'مُعرف العنصر (ID)', en: 'Element ID' },
  'inspect.classes': { ar: 'الكلاسات (Classes)', en: 'Classes' },
  'inspect.textContent': { ar: 'تعديل النص (Text Content)', en: 'Edit text content' },
  'inspect.noElement': { ar: 'لم يتم تحديد عنصر', en: 'No element selected' },
  'inspect.noElementDesc': { ar: 'انقر فوق أي عنصر في شاشة المحاكاة لتعديله بالبث الحي!', en: 'Click any element in the preview screen to edit it live!' },
  'inspect.liveValues': { ar: 'القيم المباشرة', en: 'Live values' },
  'inspect.noElementMobileTitle': { ar: 'لم يتم تحديد عنصر لبدء تخصيص التنسيق', en: 'No element selected to start styling' },
  'inspect.noElementMobileDesc': { ar: 'انقر فوق أي جزء في شاشة المحاكاة بالأسفل للمعالجة بالبث المباشر.', en: 'Click any part of the preview screen below to edit it live.' },

  // ============ INSPECT CSS FIELDS ============
  'inspect.field.color': { ar: 'اللون (Color)', en: 'Color' },
  'inspect.field.background': { ar: 'الخلفية (Background)', en: 'Background' },
  'inspect.field.padding': { ar: 'التباعد الداخلي (Padding)', en: 'Padding' },
  'inspect.field.margin': { ar: 'الهامش الخارجي (Margin)', en: 'Margin' },
  'inspect.field.fontSize': { ar: 'حجم الخط (Size)', en: 'Font Size' },
  'inspect.field.textAlign': { ar: 'محاذاة النص (Align)', en: 'Text Align' },
  'inspect.field.borderRadius': { ar: 'انحناء الحواف (Radius)', en: 'Border Radius' },
  'inspect.field.border': { ar: 'الإطار (Border)', en: 'Border' },

  // ============ LOOP DASHBOARD ============
  'loop.title': { ar: 'لوحة الحلقة', en: 'Loop Dashboard' },
  'loop.iterations': { ar: 'التكرارات', en: 'Iterations' },
  'loop.testsBanked': { ar: 'الاختبارات المحفوظة', en: 'Tests Banked' },
  'loop.bugsCaught': { ar: 'الأخطاء المكتشفة', en: 'Bugs Caught' },
  'loop.cicd': { ar: 'CI/CD', en: 'CI/CD' },

  // ============ TEST RUNNER ============
  'tests.title': { ar: 'لوحة الاختبارات', en: 'Test Runner' },
  'tests.runAll': { ar: 'تشغيل الكل', en: 'Run All' },
  'tests.run': { ar: 'تشغيل', en: 'Run' },
  'tests.passed': { ar: 'نجح', en: 'Passed' },
  'tests.failed': { ar: 'فشل', en: 'Failed' },
  'tests.running': { ar: 'جاري التشغيل', en: 'Running' },
  'tests.pending': { ar: 'في الانتظار', en: 'Pending' },

  // ============ TOASTS / NOTICES ============
  'toast.saved': { ar: '✓ تم الحفظ', en: '✓ Saved' },
  'toast.deleted': { ar: '✓ تم الحذف', en: '✓ Deleted' },
  'toast.copied': { ar: '✓ تم النسخ', en: '✓ Copied' },
  'toast.rangeCopied': { ar: 'تم النسخ بنجاح! ✓', en: 'Copied successfully! ✓' },
  'toast.error': { ar: 'حدث خطأ', en: 'An error occurred' },

  // ============ ADVANCED SEARCH PANEL ============
  'search.title': { ar: 'البحث الفوري والدقيق الآن 🚀', en: 'Instant precise search now 🚀' },
  'search.placeholder': { ar: 'ابحث عن نص أو كود...', en: 'Search for text or code...' },
  'search.matchOf': { ar: 'من', en: 'of' },
  'search.noMatch': { ar: 'لا يوجد تطابق ⚠️', en: 'No match ⚠️' },
  'search.prev': { ar: 'السابق', en: 'Previous' },
  'search.next': { ar: 'التالي', en: 'Next' },
  'search.caseSensitive': { ar: 'حساسية حالة الأحرف (Aa)', en: 'Case sensitive (Aa)' },
  'search.wholeWord': { ar: 'طابق الكلمة بالكامل فقط', en: 'Match whole word only' },
  'search.regex': { ar: 'البحث الذكي باستخدام التعبيرات النمطية (Regex)', en: 'Smart search using regular expressions (Regex)' },
  'search.close': { ar: 'إغلاق البحث', en: 'Close search' },
  'search.replacePlaceholder': { ar: 'استبدل النص الحالي بـ...', en: 'Replace current text with...' },
  'search.replaceOne': { ar: 'استبدال فردي', en: 'Replace single' },
  'search.replaceOneTooltip': { ar: 'استبدال الجزء المحدد حالياً فقط', en: 'Replace only the currently selected match' },
  'search.replaceAll': { ar: 'استبدال الكل بدقة 🚀', en: 'Replace all precisely 🚀' },
  'search.replaceAllTooltip': { ar: 'استبدال وتحديث كافة التطابقات فوراً وبدقة', en: 'Replace and update all matches instantly and precisely' },

  // ============ FILE EXPLORER ============
  'files.newFile': { ar: 'ملف جديد', en: 'New File' },
  'files.newFolder': { ar: 'مجلد جديد', en: 'New Folder' },
  'files.rename': { ar: 'إعادة التسمية', en: 'Rename' },
  'files.delete': { ar: 'حذف', en: 'Delete' },
  'files.empty': { ar: 'لا توجد ملفات', en: 'No files' },
  'files.noMatches': { ar: 'لم يتم العثور على ملفات متطابقة', en: 'No matching files found' },
  'files.explorerTitle': { ar: 'المستكشف', en: 'Explorer' },
  'files.fileNamePlaceholder': { ar: 'اسم الملف', en: 'File name' },
  'files.folderNamePlaceholder': { ar: 'اسم المجلد', en: 'Folder name' },
  'files.searchPlaceholder': { ar: 'بحث في الملفات...', en: 'Search files...' },
  'files.itemUnit': { ar: 'عنصر', en: 'items' },

  // ============ EDITOR TABS ============
  'editorTabs.noOpenFiles': { ar: 'لا توجد ملفات مفتوحة', en: 'No open files' },

  // ============ MONACO EDITOR ============
  'monaco.loading': { ar: '...تحميل المحرر', en: 'Loading editor...' },

  // ============ IDE WORKSPACE ============
  'ide.hideSidebar': { ar: 'إخفاء الشريط الجانبي', en: 'Hide sidebar' },
  'ide.showSidebar': { ar: 'إظهار الشريط الجانبي', en: 'Show sidebar' },
  'ide.searchCodeAria': { ar: 'بحث في الكود (Ctrl+F)', en: 'Search in code (Ctrl+F)' },
  'ide.searchCodeTitle': { ar: 'بحث (Ctrl+F)', en: 'Search (Ctrl+F)' },
  'ide.formatCodeAria': { ar: 'تنسيق الكود', en: 'Format code' },
  'ide.formatShort': { ar: 'تنسيق', en: 'Format' },
  'ide.scanShort': { ar: 'فحص', en: 'Scan' },
  'ide.saveFileAria': { ar: 'حفظ الملف', en: 'Save file' },
  'ide.hideLinter': { ar: 'إخفاء الفاحص', en: 'Hide linter' },
  'ide.showLinter': { ar: 'إظهار الفاحص', en: 'Show linter' },
  'ide.clearCodeAria': { ar: 'مسح الكود', en: 'Clear code' },
  'ide.pressAgainToConfirm': { ar: 'اضغط مرة أخرى للتأكيد', en: 'Press again to confirm' },
  'ide.emptyState': { ar: 'افتح ملفاً من المستكشف لتبدأ', en: 'Open a file from the explorer to begin' },

  // ============ ARABIC HELP MODAL ============
  'arabicHelp.title': { ar: 'البرمجة باللغة العربية الفصحى 🌟', en: 'Programming in Classical Arabic 🌟' },
  'arabicHelp.welcome': { ar: 'أهلاً بك في NEXUS ARABIC! لقد قمنا بابتكار مترجم (Transpiler) فوري فخم مدمج في محرر الأكواد يترجم الكلمات والوسوم وحالات React العربية إلى رموز برمجية قياسية تعمل على المتصفح والـ DOM فوراً!', en: 'Welcome to NEXUS ARABIC! We have created an instant luxury transpiler built into the code editor that translates Arabic words, tags, and React states into standard code symbols that work in the browser and DOM instantly!' },
  'arabicHelp.writeCode': { ar: 'اكتب الكود باللغة العربية بالكامل، وراقب المعاينة المتفاعلة تظهر بشكل حي في الجانب المقابل!', en: 'Write the code entirely in Arabic, and watch the interactive preview come to life on the opposite side!' },
  'arabicHelp.templatesTitle': { ar: 'قوالب جاهزة قابلة للتجربة الفورية كلياً:', en: 'Ready-to-use templates for instant trial:' },
  'arabicHelp.templateHtml': { ar: 'قالب HTML5 بالعربية الفصحى', en: 'HTML5 template in Classical Arabic' },
  'arabicHelp.templateHtmlDesc': { ar: 'مستند كامل مستقل يستخدم وسوم مثل <حاوية> و <فقرة> و <زر> والسمات المتأصلة.', en: 'A complete standalone document using tags like <حاوية>, <فقرة>, <زر> and native attributes.' },
  'arabicHelp.templateReact': { ar: 'قالب React متفاعل بالعربية', en: 'Interactive React template in Arabic' },
  'arabicHelp.templateReactDesc': { ar: 'أبلكيشن React متطور يستخدم العداد والتفاعلية الكاملة عبر تعيين الدوال والـ useState العربية.', en: 'An advanced React app using a counter and full interactivity via Arabic function definitions and useState.' },
  'arabicHelp.dictTitle': { ar: '📂 قاموس وسوم البرمجة والسمات العربية ومقابلها', en: '📂 Dictionary of Arabic programming tags and attributes and their equivalents' },
  'arabicHelp.tagArabic': { ar: 'الوسم العربي', en: 'Arabic tag' },
  'arabicHelp.tagStandard': { ar: 'المقابل القياسي (HTML)', en: 'Standard equivalent (HTML)' },
  'arabicHelp.attrArabic': { ar: 'السمة/الكلمة العربية', en: 'Arabic attribute/keyword' },
  'arabicHelp.attrStandard': { ar: 'المقابل القياسي (JS/React)', en: 'Standard equivalent (JS/React)' },

  // ============ CONFIRMATION MODALS ============
  'modal.confirmDeleteTitle': { ar: 'تأكيد حذف الملف نهائياً ⚠️', en: 'Confirm permanent file deletion ⚠️' },
  'modal.confirmDeleteDescStart': { ar: 'هل أنت متأكد تماماً من رغبتك في حذف', en: 'Are you absolutely sure you want to delete' },
  'modal.confirmDeleteDescEnd': { ar: 'بشكل نهائي وكل محتوياته؟ لا يمكن التراجع عن هذا الإجراء أبداً.', en: 'permanently and all its contents? This action cannot be undone.' },
  'modal.cancel': { ar: 'إلغاء الأمر', en: 'Cancel' },
  'modal.confirmDelete': { ar: 'نعم، احذف 🗑️', en: 'Yes, delete 🗑️' },
  'modal.confirmWipeTitle': { ar: 'إعادة تهيئة بيئة العمل ⚠️', en: 'Reset workspace ⚠️' },
  'modal.confirmWipeDescStart': { ar: 'هل أنت متأكد تماماً من رغبتك في', en: 'Are you absolutely sure you want to' },
  'modal.wipeAction': { ar: 'مسح وتفريغ كافة ملفات المجلد', en: 'wipe and clear all folder files' },
  'modal.confirmWipeDescEnd': { ar: 'والبدء من الصفر تماماً؟ لا يمكن التراجع عن هذا الإجراء أبداً.', en: 'and start completely from scratch? This action cannot be undone.' },
  'modal.confirmWipe': { ar: 'نعم، مسح الكل 🧹', en: 'Yes, wipe all 🧹' },

  // ============ ERROR MESSAGES ============
  'error.fetchFailed': { ar: 'فشل في جلب البيانات', en: 'Failed to fetch data' },
  'error.network': { ar: 'خطأ في الشبكة', en: 'Network error' },
  'error.unexpected': { ar: 'خطأ غير متوقع', en: 'Unexpected error' },

  // ============ COMMON ============
  'common.close': { ar: 'إغلاق', en: 'Close' },
  'common.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'common.save': { ar: 'حفظ', en: 'Save' },
  'common.confirm': { ar: 'تأكيد', en: 'Confirm' },
  'common.loading': { ar: 'جاري التحميل...', en: 'Loading...' },
};

/**
 * Get a translated string by key.
 * Falls back to the key itself if not found (makes missing keys obvious in dev).
 */
export function t(key: string, lang: Lang): string {
  const entry = translations[key];
  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] Missing translation key: "${key}"`);
    }
    return key;
  }
  return entry[lang];
}
