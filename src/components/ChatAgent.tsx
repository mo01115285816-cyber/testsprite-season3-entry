'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Check, 
  RefreshCw, 
  User, 
  Copy, 
  ArrowUp,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Plus,
  Mic,
  Paperclip,
  FileText,
  Terminal
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

// مفسر نصوص ذكي ومخصص لعرض النصوص العربية والماركدون بمحاذاة كاملة وانسيابية مذهلة
const AppleMarkdownRenderer = ({ content, onCopy, copiedId }: { content: string, onCopy: (text: string, id: string) => void, copiedId: string | null }) => {
  if (!content) return null;
  
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let currentLanguage = 'javascript';
  const renderedElements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    // كشف وتنسيق كتل الأكواد البرمجية الفاخرة بستايل macOS
    if (line.trim().startsWith('\`\`\`')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const completeCode = codeLines.join('\n');
        const isBlockCopied = copiedId === `code-${idx}`;
        renderedElements.push(
          <div key={`code-block-${idx}`} className="my-6 border border-brand-accent/20 rounded-2xl overflow-hidden bg-brand-bg shadow-[0_0_25px_rgba(93,214,44,0.05)]" dir="ltr">
            {/* شريط نوافذ macOS الشهير */}
            <div className="flex items-center justify-between px-5 py-3 bg-brand-card border-b border-brand-accent/15">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/90"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/90"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/90"></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">{currentLanguage}</span>
                <button 
                  onClick={() => onCopy(completeCode, `code-${idx}`)}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-white/5"
                  title="نسخ الكود"
                >
                  {isBlockCopied ? (
                    <Check className="w-3.5 h-3.5 text-[#30D158]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <pre className="p-5 overflow-x-auto text-[13px] font-mono text-zinc-300 leading-relaxed text-left hide-scrollbar">
              <code>{completeCode}</code>
            </pre>
          </div>
        );
        codeLines = [];
      } else {
        inCodeBlock = true;
        const match = line.match(/\`\`\`(\w+)/);
        currentLanguage = match ? match[1] : 'javascript';
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    // تنسيق العناوين العريضة والفخمة
    if (line.startsWith('### ')) {
      renderedElements.push(<h3 key={idx} className="text-base font-bold text-white mt-6 mb-3 tracking-tight">{line.replace('### ', '')}</h3>);
      return;
    }
    if (line.startsWith('## ')) {
      renderedElements.push(<h2 key={idx} className="text-lg font-extrabold text-white mt-7 mb-4 tracking-tight">{line.replace('## ', '')}</h2>);
      return;
    }
    if (line.startsWith('# ')) {
      renderedElements.push(<h1 key={idx} className="text-xl font-black text-white mt-8 mb-4 tracking-tight">{line.replace('# ', '')}</h1>);
      return;
    }

    // القوائم المنقطة الأنيقة والمنسقة هندسياً
    if (line.startsWith('- ') || line.startsWith('* ')) {
      renderedElements.push(
        <li key={idx} className="list-none flex items-start gap-2.5 text-zinc-300 my-2.5 text-[15.5px] leading-[1.85] pr-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0 mt-2.5"></span>
          <span>{parseInlineFormatting(line.substring(2))}</span>
        </li>
      );
      return;
    }

    // الأسطر العادية مع تباعدات هوامش ومعدل تباعد أسطر 1.85 لراحة قراءة تامة
    if (line.trim() === '') {
      renderedElements.push(<div key={idx} className="h-4" />);
    } else {
      renderedElements.push(
        <p key={idx} className="text-zinc-200 leading-[1.85] my-4 text-[16px] md:text-[17px] font-normal tracking-wide text-right whitespace-pre-wrap">
          {parseInlineFormatting(line)}
        </p>
      );
    }
  });

  // إذا انتهى النص ولا زال بداخل كود بلوك نغلقه تلقائياً احتياطاً
  if (inCodeBlock && codeLines.length > 0) {
    const completeCode = codeLines.join('\n');
    renderedElements.push(
      <div key={`code-block-end`} className="my-6 border border-white/5 rounded-2xl overflow-hidden bg-[#09090b] shadow-2xl" dir="ltr">
        <div className="flex items-center justify-between px-5 py-3 bg-[#111114] border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/90"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/90"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/90"></span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">{currentLanguage}</span>
          </div>
        </div>
        <pre className="p-5 overflow-x-auto text-[13px] font-mono text-zinc-300 leading-relaxed text-left hide-scrollbar">
          <code>{completeCode}</code>
        </pre>
      </div>
    );
  }

  return <div className="space-y-1">{renderedElements}</div>;
};

// تحليل التنسيقات الداخلية للكلمات البارزة
function parseInlineFormatting(text: string) {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const codeRegex = /\`(.*?)\`/g;
  
  let formattedText = text.replace(boldRegex, '||B||$1||B||').replace(codeRegex, '||C||$1||C||');
  const tokens = formattedText.split('||');
  
  let isBold = false;
  let isCode = false;
  
  return tokens.map((token, idx) => {
    if (token === 'B') {
      isBold = !isBold;
      return null;
    }
    if (token === 'C') {
      isCode = !isCode;
      return null;
    }
    
    if (isBold) {
      return <strong key={idx} className="font-bold text-white">{token}</strong>;
    }
    if (isCode) {
      return <code key={idx} className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-300 font-mono text-xs border border-white/5" dir="ltr">{token}</code>;
    }
    return token;
  }).filter(Boolean);
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  isGreeting?: boolean;
}

export interface ChatAgentProps {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isAgentThinking: boolean;
  agentStatus: string;
  dynamicSteps: string[] | null;
  activeStepIndex: number | null;
  completedStepIndices: number[];
  handleSendAgentPrompt: () => Promise<void>;
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  handleClearChat?: () => void;
  agentModels?: Record<string, string>; // New prop for real model tracking
  isFullStack?: boolean;
  setIsFullStack?: (val: boolean) => void;
}

export default function ChatAgent({
  messages,
  chatInput,
  setChatInput,
  isAgentThinking,
  agentStatus,
  dynamicSteps,
  activeStepIndex,
  completedStepIndices,
  handleSendAgentPrompt,
  chatScrollRef,
  handleClearChat,
  agentModels = {}, // Default to empty object
  isFullStack = false,
  setIsFullStack
}: ChatAgentProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const fileInputLocalRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // تتبع دوري لمدخلات النص لتجنب المشاكل البرمجية والـ Closure Stale
  const chatInputRef = useRef(chatInput);
  useEffect(() => {
    chatInputRef.current = chatInput;
  }, [chatInput]);

  // إغلاق قائمة خيارات الإدخال (+) عند النقر خارجها خارج النطاق التفاعلي
  useEffect(() => {
    const handleClickOutsideMenu = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, []);

  // تهيئة نظام التعرف الصوتي الذكي باللغة العربية مع معالجة الأخطاء
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'ar-SA';
        
        rec.onstart = () => {
          setIsRecording(true);
        };
        
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setChatInput(chatInputRef.current ? chatInputRef.current + " " + transcript : transcript);
          }
        };
        
        rec.onerror = (event: any) => {
          const errorType = event && event.error ? event.error : "unknown";
          console.error(`Speech recognition error [${errorType}]:`, {
            error: errorType,
            message: event.message,
            event
          });
          setIsRecording(false);
        };
        
        rec.onend = () => {
          setIsRecording(false);
        };
        
        recognitionRef.current = rec;
      }
    }
  }, [setChatInput]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      // محاكاة الإدخال الصوتي بذكاء في البيئات التي لا تدعم الميكروفون المباشر
      if (isRecording) {
        setIsRecording(false);
      } else {
        setIsRecording(true);
        setTimeout(() => {
          setIsRecording(prev => {
            if (prev) {
              setChatInput(chatInputRef.current ? chatInputRef.current + " أريد تصميم واجهة مستخدم حديثة بالكامل" : "أريد تصميم واجهة مستخدم حديثة بالكامل");
              return false;
            }
            return false;
          });
        }, 2200);
      }
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        setIsRecording(true);
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
        setIsRecording(false);
      }
    }
  };

  // إرفاق ملف نصي أو برمجية وقراءتها المباشرة لإدراجها في الحقل المخصص
  const handleLocalFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const fileContent = event.target.result;
          const newContent = `\n\n\`\`\`${file.name.split('.').pop() || 'text'}\n// اسم الملف: ${file.name}\n${fileContent}\n\`\`\``;
          setChatInput(chatInputRef.current + newContent);
        }
      };
      reader.readAsText(file);
      setIsPlusMenuOpen(false);
    }
  };

  const handleInsertTemplate = (templateType: 'html' | 'react') => {
    const templates = {
      html: "أريد بناء صفحة هبوط فخمة وجذابة لحملة تسويقية باستخدام HTML و CSS مع تباين ألوان رائع وتأثيرات بصرية حديثة.",
      react: "أريد تصميم مكون React تفاعلي ومحترف يعرض لوحة تحكم (Dashboard) صغيرة لتحليلات المستخدم مع رسوم بيانية وتأثيرات حركية."
    };
    setChatInput(templates[templateType]);
    setIsPlusMenuOpen(false);
  };

  // تعديل ارتفاع حقل الكتابة بذكاء وتجنب ظهور شريط التمرير نهائياً
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [chatInput]);

  const copyToClipboard = (text: string, id: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (err) {
      navigator.clipboard?.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpandMessage = (msgId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAgentPrompt();
    }
  };

  return (
    <div className="h-full w-full bg-[#0f0f0f] text-brand-text flex flex-col overflow-hidden antialiased selection:bg-brand-accent/20 selection:text-brand-text relative tech-dot-grid" dir="rtl">
      
      {/* هيدر عائم فخم كلياً - متناسق الارتفاع مع حقل الإدخال وهو مغلق بدقة شديدة */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-brand-bg via-brand-bg/95 to-transparent shrink-0 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto relative pointer-events-auto">
          <header className="relative rounded-[26px] bg-brand-card/90 backdrop-blur-2xl border border-brand-accent/25 shadow-[0_0_15px_rgba(93,214,44,0.08)] p-1.5 pr-5 pl-1.5 flex items-center justify-between transition-all duration-500 h-[50px]">
            
            {/* الشعار المبتكر والاحترافي لـ NEXUS */}
            <div className="flex items-center gap-3">
              {/* أيقونة الشعار الهندسية الفريدة */}
              <div className="relative flex items-center justify-center">
                <svg className="w-5.5 h-5.5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="nexusLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#a1a1aa" />
                      <stop offset="100%" stopColor="#3f3f46" />
                    </linearGradient>
                  </defs>
                  <path d="M25 25V75L45 50L25 25Z" fill="url(#nexusLogoGrad)" />
                  <path d="M75 75V25L55 50L75 75Z" fill="url(#nexusLogoGrad)" />
                  <circle cx="50" cy="50" r="10" stroke="white" strokeWidth="4" className="animate-pulse" />
                </svg>
                {/* نقطة مضيئة للدلالة على الذكاء التفاعلي النشط */}
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#30D158] shadow-[0_0_8px_#30D158]"></div>
              </div>
              
              {/* النص المكتوب للشعار الإنجليزي الفخم */}
              <h1 className="text-xs font-black tracking-[0.2em] text-white font-mono uppercase">
                NEXUS
              </h1>
            </div>

            {/* زر سلة المحذوفات المصمم على مقاس صندوق الإدخال تماماً لتماثل بصري مذهل */}
            {handleClearChat && (
              <button 
                onClick={handleClearChat}
                className="h-[36px] w-[36px] rounded-full bg-zinc-900/40 hover:bg-rose-950/30 text-zinc-400 hover:text-rose-400 hover:border-rose-900/30 transition-all duration-300 border border-white/5 active:scale-90 flex items-center justify-center cursor-pointer"
                title="حذف وتفريغ الشات بالكامل"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </header>
        </div>
      </div>

      {/* مساحة عرض المحادثات الرئيسية المريحة للعين */}
      <div 
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-[98px] pb-[120px] md:pt-[116px] md:pb-[136px] space-y-8 z-10 flex flex-col"
      >
        <div className="max-w-3xl mx-auto w-full space-y-10 flex-1 flex flex-col justify-center">
          {messages.length === 0 ? (
            /* واجهة ترحيبية ناعمة جداً في حال عدم وجود أي رسائل */
            <div className="text-center py-12 px-4 animate-fade-in flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4 text-zinc-400 apple-glow">
                <Sparkles className="w-5 h-5 text-white/80" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">مرحباً بك في NEXUS</h2>
              <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
                اكتب أي استفسار أو ابدأ محادثة جديدة الآن لتجربة واجهة المستخدم السلسة والمتقنة.
              </p>
            </div>
          ) : (
            <div className="space-y-10 flex flex-col">
              {messages.map((msg) => {
                const isAgent = msg.role === 'agent';
                
                // حساب ما إذا كانت رسالة المستخدم طويلة وتستحق كبسة "عرض المزيد"
                const isLongUserMsg = !isAgent && msg.content.length > 130;
                const isExpanded = expandedMessages[msg.id];

                return (
                  <div 
                    key={msg.id}
                    className={`flex w-full ${isAgent ? 'justify-start' : 'justify-end'} animate-fade-in`}
                  >
                    <div className={`w-full flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                      
                      {/* حاوية الرسالة الاحترافية */}
                      {isAgent ? (
                        // رسالة الوكيل: تدفق ناصع ومحاذاة ممتازة بدون كبسولات خلفية
                        <div className="w-full text-zinc-200 py-2 text-right">
                          <div className="prose prose-invert max-w-none">
                            <AppleMarkdownRenderer 
                              content={msg.content} 
                              onCopy={(code, id) => copyToClipboard(code, id)} 
                              copiedId={copiedId}
                            />
                          </div>
                          
                          {/* شريط الأيقونات والتفاعل لرد المساعد */}
                          {!msg.isGreeting && (
                            <div className="mt-4 flex items-center gap-6 text-zinc-500 pr-1 select-none">
                              <button className="hover:text-zinc-300 transition-colors cursor-pointer" title="أعجبني">
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button className="hover:text-zinc-300 transition-colors cursor-pointer" title="لم يعجبني">
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                className="hover:text-zinc-300 transition-all flex items-center gap-1 cursor-pointer"
                                title="نسخ الرسالة"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="w-4 h-4 text-[#30D158]" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        // رسالة المستخدم: كبسولة دائرية فخمة للغاية ومستقرة تماماً تطابق الصورة 100%
                        <div 
                          className={`relative bg-brand-card text-brand-text border border-brand-accent/20 shadow-lg rounded-[26px] p-5 max-w-[85%] md:max-w-[75%] transition-all duration-300 ease-out ${
                            isLongUserMsg && !isExpanded ? 'max-h-[140px] overflow-hidden' : 'max-h-[2000px]'
                          }`}
                        >
                          <div className={`text-[15.5px] font-bold leading-[1.8] tracking-wide text-right whitespace-pre-wrap transition-all duration-300 ${isLongUserMsg ? 'pb-10' : ''}`}>
                            {msg.content}
                          </div>

                          {/* تأثير التلاشي الزجاجي فقط عند عدم التمدد ليلائم المظهر المريح للعين */}
                          {isLongUserMsg && !isExpanded && (
                            <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end justify-start pointer-events-none bubble-fade-gradient">
                              <div className="h-full w-full" />
                            </div>
                          )}

                          {/* زر تمديد دائري خالي تماماً من النصوص ويطابق الصورة في الجهة اليسرى */}
                          {isLongUserMsg && (
                            <button
                              onClick={() => toggleExpandMessage(msg.id)}
                              className="absolute left-4 bottom-3 h-8 w-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-white/5 hover:text-white transition-all flex items-center justify-center shadow-lg cursor-pointer z-10"
                              title={isExpanded ? "عرض أقل" : "عرض المزيد"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                              )}
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* بطاقة خطوات التفكير المصغرة والأنيقة للغاية (Micro-status capsule) */}
          {isAgentThinking && (
            <div className="flex gap-4 animate-fade-in mt-4">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>

              <div className="flex-1 max-w-[80%] md:max-w-[60%]">
                <div className="bg-[#09090b]/90 border border-white/5 rounded-2xl p-4 shadow-xl relative overflow-hidden backdrop-blur-xl">
                  {/* عنوان الحالة المصغر */}
                  <div className="flex flex-col gap-2 mb-3 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A84FF] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0A84FF]"></span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{agentStatus || "الذكاء الاصطناعي يعمل الآن..."}</span>
                    </div>
                    
                    {/* Real Model Indicator Badge - Dynamic and precise */}
                    {Object.keys(agentModels).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(agentModels).map(([agent, model]) => (
                          <div 
                            key={agent} 
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/10 shadow-sm animate-fade-in"
                          >
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">{agent}:</span>
                            <span className="text-[8px] font-mono font-black text-[#30D158]">{model}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* الخطوات كقائمة مصغرة ونظيفة جداً */}
                  <div className="space-y-1.5">
                    {(() => {
                      const fallbackSteps = [
                        'جاري تحليل السياق واستخراج التفاصيل...',
                        'تحليل طبيعة الطلب والتعديلات المطلوبة...',
                        'صياغة الكود النهائي والتأكد من جودته...'
                      ];
                      const renderSteps = dynamicSteps || fallbackSteps;
                      return renderSteps.map((step, idx) => {
                        const isActive = dynamicSteps ? (idx === activeStepIndex) : (idx === 0);
                        const isCompleted = dynamicSteps ? completedStepIndices.includes(idx) : false;
                        
                        return (
                          <div 
                            key={idx}
                            className={`flex items-center gap-2.5 py-0.5 rounded transition-all duration-300 ${
                              isActive
                                ? 'text-white font-semibold' 
                                : isCompleted 
                                  ? 'text-zinc-600 opacity-60' 
                                  : 'text-zinc-700'
                            }`}
                          >
                            <div className="shrink-0 flex items-center justify-center">
                              {isCompleted ? (
                                <Check className="w-3.5 h-3.5 text-[#30D158]" />
                              ) : isActive ? (
                                <div className="w-3.5 h-3.5 rounded-full border border-[#0A84FF] border-t-transparent animate-spin" />
                              ) : (
                                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                              )}
                            </div>
                            <span className="text-[11px]">{step}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* صندوق الإدخال الثابت كلياً بالأسفل - بارتفاع مطابق تماماً للهيدر العائم */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-brand-bg via-brand-bg/95 to-transparent shrink-0 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto relative pointer-events-auto">
          
          {/* Active Mode Pill Indicator when floating selection is hidden */}
          {!showModeSelection && (
            <div className="flex justify-center mb-1.5">
              <button
                type="button"
                onClick={() => setShowModeSelection(true)}
                className={`px-2.5 py-0.5 text-[9.5px] font-bold rounded-full border transition-all flex items-center justify-center gap-1 cursor-pointer hover:scale-105 active:scale-95 ${
                  isFullStack
                    ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.08)]'
                    : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
                title="تغيير وضع التطوير والإنشاء"
              >
                {isFullStack ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-[#22c55e] shrink-0" />
                    <span>مشروع كامل (Full-Stack) ⚡</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                    <span>تعديل كود فردي 🌐</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* محدد وضع توليد الكود: ميزة Full-Stack عسكرية واحترافية */}
          {showModeSelection && (
            <div className="flex items-center justify-center gap-1.5 mb-2.5 bg-brand-card/75 backdrop-blur-md border border-brand-accent/15 rounded-full p-0.5 max-w-[270px] mx-auto shadow-lg animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setIsFullStack?.(false);
                  setShowModeSelection(false);
                }}
                className={`flex-1 py-0.5 px-2.5 text-[10px] font-bold rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer h-[24px] ${
                  !isFullStack 
                    ? 'bg-zinc-800 text-white shadow-sm border border-white/5' 
                    : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                <Bot className="w-3 h-3" />
                <span>كود فردي</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFullStack?.(true);
                  setShowModeSelection(false);
                }}
                className={`flex-1 py-0.5 px-2.5 text-[10px] font-bold rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer h-[24px] ${
                  isFullStack 
                    ? 'bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.12)]' 
                    : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#22c55e] animate-pulse" />
                <span>Full-Stack</span>
              </button>
            </div>
          )}

          {/* كبسولة إرسال متكاملة تماماً بارتفاع 50px في وضعها الأساسي لتطابق الهيدر */}
          <div className={`relative rounded-[26px] transition-all duration-500 bg-brand-card/90 backdrop-blur-2xl border ${
            isInputFocused 
              ? 'border-[#22c55e]/60 shadow-[0_0_22px_rgba(34,197,94,0.18)]' 
              : 'border-brand-accent/20 shadow-[0_0_12px_rgba(93,214,44,0.06)]'
          } p-1.5 flex items-end gap-2.5 min-h-[50px]`}>
            
            {/* قنوات رفع وملفات مخفية لخدمة النقر برمجياً */}
            <input 
              type="file" 
              ref={fileInputLocalRef} 
              onChange={handleLocalFileAttach} 
              className="hidden" 
              accept=".txt,.js,.jsx,.ts,.tsx,.css,.html,.json,.md,.py"
            />

            {/* 1. زر علامة الزائد (+) الاحترافي العالي التفاعلية */}
            <div ref={plusMenuRef} className="relative shrink-0 flex">
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                disabled={isAgentThinking}
                className="h-[36px] w-[36px] rounded-full bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-white/5 active:scale-90 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm relative group"
                title="خيارات إضافية وإرفاق ملفات"
              >
                <Plus className="w-4.5 h-4.5 stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
              </button>

              {/* القائمة المنبثقة خيارات التوليد السريعة */}
              <AnimatePresence>
                {isPlusMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-12 right-0 w-56 bg-[#0c0c0e]/95 border border-white/10 rounded-2xl p-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-3xl z-50 flex flex-col gap-1 text-right"
                  >
                    <button
                      onClick={() => fileInputLocalRef.current?.click()}
                      className="w-full px-3 py-2 text-xs text-zinc-350 hover:text-white hover:bg-zinc-900 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span>إرفاق ملف كود/نص</span>
                      <Paperclip className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#22c55e] transition-colors stroke-[2]" />
                    </button>
                    <button
                      onClick={() => handleInsertTemplate('html')}
                      className="w-full px-3 py-2 text-xs text-zinc-350 hover:text-white hover:bg-zinc-900 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span>قالب صفحة HTML</span>
                      <FileText className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors stroke-[2]" />
                    </button>
                    <button
                      onClick={() => handleInsertTemplate('react')}
                      className="w-full px-3 py-2 text-xs text-zinc-350 hover:text-white hover:bg-zinc-900 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span>قالب مكون React</span>
                      <Terminal className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#22c55e] transition-colors stroke-[2]" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* حقل النص الذكي الفاخر الخالي تماماً من أشرطة التمرير والتعقيد */}
            <textarea
              ref={textareaRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onKeyDown={handleKeyPress}
              disabled={isAgentThinking}
              placeholder={isRecording ? "جاري الاستماع إليك بكل وضوح..." : "اكتب فكرتك أو استفسارك هنا..."}
              className={`flex-1 bg-transparent border-none outline-none focus:ring-0 px-1 py-1.5 text-[14.5px] font-medium resize-none max-h-[140px] min-h-[36px] hide-scrollbar text-right leading-relaxed transition-all duration-300 ${
                isRecording ? 'text-[#30d158] placeholder-[#30d158]/50 animate-pulse font-bold' : 'text-brand-text placeholder-zinc-600'
              }`}
              rows={1}
            />

            {/* 2. زر المايك (التحكم بالصوت) بخصائص حركية أنيقة وتوهج تنبيطي */}
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isAgentThinking}
              className={`h-[36px] w-[36px] rounded-full border active:scale-90 transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer shadow-sm relative group ${
                isRecording 
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse' 
                  : 'bg-zinc-900/60 hover:bg-zinc-800 border-white/5 text-zinc-400 hover:text-white'
              }`}
              title="إدخال صوتي ذكي باللغة العربية"
            >
              <Mic className="w-4.5 h-4.5 stroke-[2] transition-colors group-hover:scale-105" />
            </button>

            {/* 3. زر الإرسال المطور (الوزن والارتفاع والتأثيرات التفاعلية) */}
            <button
              onClick={handleSendAgentPrompt}
              disabled={(!chatInput.trim() && !isRecording) || isAgentThinking}
              className={`h-[36px] w-[36px] rounded-full active:scale-90 transition-all duration-300 shadow-xl flex items-center justify-center shrink-0 cursor-pointer ${
                chatInput.trim() 
                  ? 'bg-brand-accent hover:bg-brand-accent/90 hover:scale-105 text-[#0f0f0f] shadow-[0_0_12px_rgba(34,197,94,0.25)]' 
                  : 'bg-zinc-900/40 opacity-30 text-zinc-600 border border-white/5'
              }`}
              title="إرسال"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.8]" />
            </button>
            
          </div>

        </div>
      </div>

    </div>
  );
}

