'use client';

import React, { useEffect, useState } from 'react';
import { 
  Code2, Sparkles, Smile, Trash2, Bug, AlertCircle, AlertTriangle, X, Play, Copy, HelpCircle,
  Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DiagnosticIssue } from '../lib/diagnostics';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  formatCode: () => Promise<void>;
  isFormatting: boolean;
  setIsIconModalOpen: (open: boolean) => void;
  isConfirmingClear: boolean;
  setIsConfirmingClear: (val: boolean) => void;
  isReactActive: boolean;
  lintIssues: DiagnosticIssue[];
  deepIssues: any[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  isLintPanelOpen: boolean;
  setIsLintPanelOpen: (open: boolean) => void;
  currentLine: number;
  setCurrentLine: (line: number) => void;
  currentCol: number;
  setCurrentCol: (col: number) => void;
  editorScrollTop: number;
  setEditorScrollTop: (scroll: number) => void;
  editorHeight: number;
  setEditorHeight: (height: number) => void;
  onTriggerAiGeneration?: (prompt: string) => void;
  isAgentThinking?: boolean;
}

export default function CodeEditor({
  code,
  setCode,
  formatCode,
  isFormatting,
  setIsIconModalOpen,
  isConfirmingClear,
  setIsConfirmingClear,
  isReactActive,
  lintIssues,
  deepIssues,
  textareaRef,
  sidebarRef,
  isLintPanelOpen,
  setIsLintPanelOpen,
  currentLine,
  setCurrentLine,
  currentCol,
  setCurrentCol,
  editorScrollTop,
  setEditorScrollTop,
  editorHeight,
  setEditorHeight,
  onTriggerAiGeneration,
  isAgentThinking = false,
}: CodeEditorProps) {

  const [isArabicHelpOpen, setIsArabicHelpOpen] = useState(false);
  const linesCount = code.split('\n').length;

  // Advanced Search & Replace Engine States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Advanced Copy Range States
  const [isCopyPanelOpen, setIsCopyPanelOpen] = useState(false);
  const [copyStartLine, setCopyStartLine] = useState<number | ''>('');
  const [copyEndLine, setCopyEndLine] = useState<number | ''>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matches, setMatches] = useState<{ start: number; end: number; line: number }[]>([]);
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);
  const [searchWholeWord, setSearchWholeWord] = useState(false);
  const [searchRegex, setSearchRegex] = useState(false);

  // Keyboard Shortcut Ctrl+F / Cmd+F to toggle search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const findMatches = (
    query: string, 
    text: string, 
    caseSensitive: boolean, 
    wholeWord: boolean, 
    isRegex: boolean
  ) => {
    if (!query) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }
    
    try {
      let regexFlags = 'g';
      if (!caseSensitive) regexFlags += 'i';
      
      let pattern = query;
      if (!isRegex) {
        pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      
      const re = new RegExp(pattern, regexFlags);
      const newMatches: { start: number; end: number; line: number }[] = [];
      let match;
      
      while ((match = re.exec(text)) !== null) {
        if (match.index === re.lastIndex) {
          re.lastIndex++;
        }
        
        const textBefore = text.substring(0, match.index);
        const lineNumber = textBefore.split('\n').length;
        
        newMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          line: lineNumber,
        });
        
        if (!re.global) break;
      }
      
      setMatches(newMatches);
      if (newMatches.length > 0) {
        setCurrentMatchIndex(prev => {
          if (prev >= 0 && prev < newMatches.length) return prev;
          return 0;
        });
      } else {
        setCurrentMatchIndex(-1);
      }
    } catch (err) {
      setMatches([]);
      setCurrentMatchIndex(-1);
    }
  };

  useEffect(() => {
    findMatches(searchQuery, code, searchCaseSensitive, searchWholeWord, searchRegex);
  }, [searchQuery, code, searchCaseSensitive, searchWholeWord, searchRegex]);

  // Immediately focus selection and scroll to match when matches or query changes
  useEffect(() => {
    if (searchQuery && matches.length > 0) {
      const index = currentMatchIndex >= 0 && currentMatchIndex < matches.length ? currentMatchIndex : 0;
      const match = matches[index];
      if (textareaRef.current && match) {
        // Set selection in textarea without stealing physical focus from search input
        textareaRef.current.setSelectionRange(match.start, match.end);

        // Calculate and apply precise scroll position
        const LINE_HEIGHT = 24;
        const targetScroll = Math.max(0, (match.line - 4) * LINE_HEIGHT);
        textareaRef.current.scrollTop = targetScroll;
        setEditorScrollTop(targetScroll);
        if (sidebarRef.current) sidebarRef.current.scrollTop = targetScroll;

        setCurrentLine(match.line);
        const textBefore = code.substring(0, match.start);
        const lines = textBefore.split('\n');
        setCurrentCol(lines[lines.length - 1].length + 1);
      }
    }
  }, [matches, searchQuery, currentMatchIndex]);

  const goToMatch = (index: number) => {
    if (index < 0 || index >= matches.length) return;
    
    const match = matches[index];
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(match.start, match.end);
      
      const LINE_HEIGHT = 24;
      const targetScroll = Math.max(0, (match.line - 4) * LINE_HEIGHT);
      
      textareaRef.current.scrollTop = targetScroll;
      setEditorScrollTop(targetScroll);
      if (sidebarRef.current) sidebarRef.current.scrollTop = targetScroll;
      
      setCurrentLine(match.line);
      const textBefore = code.substring(0, match.start);
      const lines = textBefore.split('\n');
      setCurrentCol(lines[lines.length - 1].length + 1);
    }
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    goToMatch(nextIndex);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIndex);
    goToMatch(prevIndex);
  };

  const handleReplace = () => {
    if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;
    
    const match = matches[currentMatchIndex];
    const newCode = code.substring(0, match.start) + replaceQuery + code.substring(match.end);
    setCode(newCode);
  };

  const handleReplaceAll = () => {
    if (!searchQuery || matches.length === 0) return;
    
    try {
      let regexFlags = 'g';
      if (!searchCaseSensitive) regexFlags += 'i';
      
      let pattern = searchQuery;
      if (!searchRegex) {
        pattern = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      
      if (searchWholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      
      const re = new RegExp(pattern, regexFlags);
      const newCode = code.replace(re, replaceQuery);
      setCode(newCode);
    } catch (err) {
      alert("حدث خطأ في تعبير البحث المدخل (Regex).");
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      setEditorHeight(textareaRef.current.clientHeight || 600);
    }
  }, [setEditorHeight, textareaRef]);

  const errorsCount = lintIssues.filter(i => i.type === 'error').length + deepIssues.filter(i => i.type === 'error').length;
  const warningsCount = lintIssues.filter(i => i.type === 'warning').length + deepIssues.filter(i => i.type === 'warning').length;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-brand-bg border-r border-brand-accent/15 relative overflow-hidden">
      
      {/* Redesigned formatting and action toolbar */}
      <div className="h-12 bg-brand-card/90 backdrop-blur-md border-b border-brand-accent/15 px-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsLintPanelOpen(!isLintPanelOpen)}
              className={`relative flex items-center justify-center w-7 h-7 rounded-md transition-all select-none cursor-pointer border ${
                isLintPanelOpen 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-md shadow-rose-550/5' 
                  : 'bg-brand-bg border-brand-accent/20 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-brand-accent/40'
              }`}
              title="فحص الأخطاء والمشاكل الأمنية"
            >
              <Bug className="w-3.5 h-3.5" />
              {errorsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-black font-black text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black shadow-sm">
                  {errorsCount}
                </span>
              )}
              {errorsCount === 0 && warningsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black font-black text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black shadow-sm">
                  {warningsCount}
                </span>
              )}
            </button>
            <span className="text-[9px] bg-brand-bg px-2 py-1 rounded border border-brand-accent/20 font-mono text-zinc-400 tracking-wider">
              {isReactActive ? 'React ⚛️' : 'HTML5 🌐'}
            </span>
            <button
              onClick={() => setIsArabicHelpOpen(true)}
              className="text-[9.5px] font-black h-5.5 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent px-2 rounded-md hover:bg-brand-accent/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              title="دليل البرمجة باللغة العربية وتحميل القوالب"
            >
              <Sparkles className="w-2.5 h-2.5 text-brand-accent animate-pulse" />
              <span>البرمجة بالعربية 🌟</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Advanced Copy by Range Toggle Button */}
            <button
              onClick={() => {
                setIsCopyPanelOpen(!isCopyPanelOpen);
                if (!isCopyPanelOpen) setIsSearchOpen(false); // close search if open
              }}
              className={`flex items-center justify-center w-7 h-7 rounded-md select-none cursor-pointer duration-150 transition-all shadow-sm ${
                isCopyPanelOpen 
                  ? 'bg-brand-accent/20 border border-brand-accent/50 text-brand-text shadow-[0_0_8px_rgba(93,214,44,0.25)]' 
                  : 'bg-brand-bg border border-brand-accent/20 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-brand-accent/40'
              }`}
              title="النسخ الدقيق للأكواد بين سطرين"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Advanced Search & Replace Toggle Button */}
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (!isSearchOpen) setIsCopyPanelOpen(false); // close copy if open
              }}
              className={`flex items-center justify-center w-7 h-7 rounded-md select-none cursor-pointer duration-150 transition-all shadow-sm ${
                isSearchOpen 
                  ? 'bg-brand-accent/20 border border-brand-accent/50 text-brand-text shadow-[0_0_8px_rgba(93,214,44,0.25)]' 
                  : 'bg-brand-bg border border-brand-accent/20 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-brand-accent/40'
              }`}
              title="البحث والاستبدال المتقدم (Ctrl+F)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={formatCode}
              disabled={isFormatting}
              className="flex items-center justify-center w-7 h-7 bg-brand-bg border border-brand-accent/20 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 hover:border-brand-accent/40 disabled:opacity-40 select-none cursor-pointer duration-150 transition-all shadow-sm"
              title="تنسيق الأكواد تلقائياً"
            >
              {isFormatting ? (
                <div className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
              )}
            </button>
 
             <button
               onClick={() => setIsIconModalOpen(true)}
               className="flex items-center justify-center w-7 h-7 bg-brand-bg border border-brand-accent/20 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 hover:border-brand-accent/40 select-none cursor-pointer duration-150 transition-all shadow-sm"
               title="مكتبة أيقونات (Lucide)"
             >
               <Smile className="w-3.5 h-3.5 text-brand-accent/90" />
             </button>
 
             <span className="w-px h-3.5 bg-zinc-800 mx-0.5" />
 
             <button
               onClick={() => {
                 if (isConfirmingClear) {
                   setCode('');
                   setIsConfirmingClear(false);
                 } else {
                   setIsConfirmingClear(true);
                 }
               }}
               className={`flex items-center justify-center w-7 h-7 bg-brand-bg border rounded-md select-none cursor-pointer duration-150 transition-all shadow-sm ${
                 isConfirmingClear 
                   ? 'border-rose-500/30 text-rose-450 bg-rose-500/10 animate-pulse' 
                   : 'border-brand-accent/20 text-zinc-400 hover:text-rose-450 hover:border-rose-500/30 hover:bg-rose-500/10'
               }`}
               title={isConfirmingClear ? 'تأكيد الحذف؟' : 'حذف الكود'}
             >
               <Trash2 className="w-3.5 h-3.5" />
             </button>
           </div>
       </div>
 
       {/* Collapsible Copy Range panel */}
       <AnimatePresence>
         {isCopyPanelOpen && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.18, ease: 'easeOut' }}
             className="border-b border-brand-accent/15 bg-[#0a0a0c]/95 backdrop-blur-md px-5 py-4 flex flex-col gap-3.5 shrink-0 overflow-hidden relative z-20"
             dir="rtl"
           >
             <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
               <div className="flex flex-wrap items-center gap-4 flex-1">
                 <div className="flex items-center gap-2">
                   <Copy className="w-4 h-4 text-brand-accent" />
                   <span className="font-bold text-brand-text">النسخ الدقيق بين سطرين</span>
                 </div>
                 
                 <div className="flex items-center gap-2 bg-brand-bg border border-brand-accent/20 rounded-xl px-3 py-1.5 focus-within:border-brand-accent/50 focus-within:shadow-[0_0_8px_rgba(93,214,44,0.1)] transition-all">
                   <span className="text-zinc-400 font-mono text-[10px]">من سطر:</span>
                   <input
                     type="number"
                     placeholder="1"
                     min="1"
                     max={linesCount}
                     value={copyStartLine}
                     onChange={(e) => setCopyStartLine(e.target.value ? parseInt(e.target.value) : '')}
                     className="bg-transparent text-white placeholder-zinc-600 outline-none w-14 text-center font-mono font-bold"
                     dir="ltr"
                   />
                 </div>

                 <div className="flex items-center gap-2 bg-brand-bg border border-brand-accent/20 rounded-xl px-3 py-1.5 focus-within:border-brand-accent/50 focus-within:shadow-[0_0_8px_rgba(93,214,44,0.1)] transition-all">
                   <span className="text-zinc-400 font-mono text-[10px]">إلى سطر:</span>
                   <input
                     type="number"
                     placeholder={linesCount.toString()}
                     min="1"
                     max={linesCount}
                     value={copyEndLine}
                     onChange={(e) => setCopyEndLine(e.target.value ? parseInt(e.target.value) : '')}
                     className="bg-transparent text-white placeholder-zinc-600 outline-none w-14 text-center font-mono font-bold"
                     dir="ltr"
                   />
                 </div>
                 
                 <button
                   onClick={() => {
                     if (typeof copyStartLine !== 'number' || typeof copyEndLine !== 'number') {
                       alert('يرجى إدخال أرقام صحيحة لسطر البداية والنهاية.');
                       return;
                     }
                     const lines = code.split('\n');
                     const start = Math.max(1, copyStartLine);
                     const end = Math.min(lines.length, copyEndLine);
                     
                     if (start > end) {
                       alert('سطر البداية يجب أن يكون أصغر من أو يساوي سطر النهاية.');
                       return;
                     }
                     
                     const codeToCopy = lines.slice(start - 1, end).join('\n');
                     navigator.clipboard.writeText(codeToCopy).then(() => {
                       setCopySuccess(true);
                       setTimeout(() => setCopySuccess(false), 2000);
                     });
                   }}
                   className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-black text-[10.5px] duration-150 transition-all cursor-pointer shadow-sm ${
                     copySuccess
                       ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                       : 'bg-brand-accent/15 border border-brand-accent/20 text-brand-text hover:bg-brand-accent/25 hover:border-brand-accent/40 shadow-[0_3px_10px_rgba(93,214,44,0.1)]'
                   }`}
                   title="النسخ الدقيق للأكواد"
                 >
                   {copySuccess ? 'تم النسخ بنجاح! ✓' : 'نسخ النطاق 🚀'}
                 </button>
               </div>

               <button 
                 onClick={() => setIsCopyPanelOpen(false)}
                 className="p-1 hover:bg-rose-500/10 hover:text-rose-450 border border-transparent hover:border-rose-500/20 text-zinc-400 rounded-lg mr-auto cursor-pointer transition-all"
                 title="إغلاق النسخ"
               >
                 <X className="w-4 h-4" />
               </button>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Collapsible Search & Replace panel with micro-interactions */}
       <AnimatePresence>
         {isSearchOpen && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.18, ease: 'easeOut' }}
             className="border-b border-brand-accent/15 bg-[#0a0a0c]/95 backdrop-blur-md px-5 py-4 flex flex-col gap-3.5 shrink-0 overflow-hidden relative z-20"
             dir="rtl"
           >
             {/* Find input and its controllers row */}
             <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
               <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-4xl">
                  <div className="relative flex items-center bg-brand-bg border border-brand-accent/20 rounded-xl px-3 py-1.5 focus-within:border-brand-accent/50 focus-within:shadow-[0_0_8px_rgba(93,214,44,0.1)] transition-all w-full sm:w-80">
                    <button
                      onClick={() => {
                        findMatches(searchQuery, code, searchCaseSensitive, searchWholeWord, searchRegex);
                      }}
                      className="p-1 hover:bg-brand-accent/15 rounded-lg text-zinc-400 hover:text-brand-accent duration-150 transition-all shrink-0 ml-1.5 cursor-pointer flex items-center justify-center border border-transparent hover:border-brand-accent/30"
                      title="البحث الفوري والدقيق الآن 🚀"
                    >
                      <Search className="w-4 h-4 text-brand-accent animate-pulse" />
                    </button>
                    <input
                      type="text"
                      placeholder="ابحث عن نص أو كود..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (matches.length > 0) {
                            handleNextMatch();
                          }
                        }
                      }}
                      className="bg-transparent text-white placeholder-zinc-500 outline-none text-xs w-full text-left font-mono font-bold"
                      dir="ltr"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded ml-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
 
                  {/* Match Count Tag */}
                  {searchQuery && (
                    <span className="px-2.5 py-1 text-[10px] bg-brand-accent/10 border border-brand-accent/20 text-brand-text rounded-lg font-mono font-extrabold select-none">
                      {matches.length > 0 ? `${currentMatchIndex + 1} من ${matches.length}` : 'لا يوجد تطابق ⚠️'}
                    </span>
                  )}
 
                  {/* Navigation buttons */}
                  <div className="flex items-center gap-1 bg-brand-bg border border-brand-accent/20 rounded-xl p-0.5">
                    <button
                      onClick={handlePrevMatch}
                      disabled={matches.length === 0}
                      className="p-1 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
                      title="السابق"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMatch}
                      disabled={matches.length === 0}
                      className="p-1 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
                      title="التالي"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
 
                  {/* Advanced Query Modifiers */}
                  <div className="flex items-center gap-1.5 bg-brand-bg border border-brand-accent/15 rounded-xl p-0.5 select-none">
                    {/* Case sensitive */}
                    <button
                      onClick={() => setSearchCaseSensitive(!searchCaseSensitive)}
                      className={`px-2.5 py-1 text-[10px] rounded-lg border font-mono font-bold transition-all cursor-pointer ${
                        searchCaseSensitive 
                          ? 'bg-brand-accent/20 border-brand-accent/35 text-brand-text font-black' 
                          : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="حساسية حالة الأحرف (مطابقة شكل الحروف العادية/الكبيرة والإنجليزية)"
                    >
                      Aa
                    </button>
                    {/* Whole Word */}
                    <button
                      onClick={() => setSearchWholeWord(!searchWholeWord)}
                      className={`px-2.5 py-1 text-[10px] rounded-lg border font-mono font-bold transition-all cursor-pointer ${
                        searchWholeWord 
                          ? 'bg-brand-accent/20 border-brand-accent/35 text-brand-text font-black' 
                          : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="طابق الكلمة بالكامل فقط"
                    >
                      Ab
                    </button>
                    {/* Regex Search */}
                    <button
                      onClick={() => setSearchRegex(!searchRegex)}
                      className={`px-2.5 py-1 text-[10px] rounded-lg border font-mono font-bold transition-all cursor-pointer ${
                        searchRegex 
                          ? 'bg-brand-accent/20 border-brand-accent/35 text-brand-text font-black' 
                          : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="البحث الذكي باستخدام التعبيرات النمطية (Regex)"
                    >
                      .*
                    </button>
                  </div>
               </div>
 
               {/* Close Panel Button */}
               <button 
                 onClick={() => {
                   setIsSearchOpen(false);
                   setSearchQuery('');
                   setMatches([]);
                 }}
                 className="p-1 hover:bg-rose-500/10 hover:text-rose-450 border border-transparent hover:border-rose-500/20 text-zinc-400 rounded-lg mr-auto cursor-pointer transition-all"
                 title="إغلاق البحث"
               >
                 <X className="w-4 h-4" />
               </button>
             </div>
 
             {/* Replace Line */}
             <div className="flex flex-wrap items-center gap-2.5 border-t border-brand-accent/10 pt-3 text-xs">
               <div className="relative flex items-center bg-brand-bg border border-brand-accent/20 rounded-xl px-3 py-1.5 focus-within:border-brand-accent/50 transition-all w-full sm:w-72">
                 <input
                   type="text"
                   placeholder="استبدل النص الحالي بـ..."
                   value={replaceQuery}
                   onChange={(e) => setReplaceQuery(e.target.value)}
                   className="bg-transparent text-white placeholder-zinc-500 outline-none text-xs w-full text-left font-mono"
                   dir="ltr"
                 />
               </div>
 
               {/* Action buttons */}
               <div className="flex items-center gap-2">
                 <button
                   onClick={handleReplace}
                   disabled={currentMatchIndex < 0}
                   className="px-4 py-1.5 rounded-xl border border-brand-accent/20 text-zinc-300 hover:text-white hover:bg-white/5 text-[10.5px] font-black duration-150 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                   title="استبدال الجزء المحدد حالياً فقط"
                 >
                   استبدال فردي
                 </button>
                 <button
                   onClick={handleReplaceAll}
                   disabled={matches.length === 0}
                   className="px-4 py-1.5 rounded-xl bg-brand-accent/15 border border-brand-accent/20 text-brand-text hover:bg-brand-accent/25 hover:border-brand-accent/40 text-[10.5px] font-black duration-150 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-[0_3px_10px_rgba(93,214,44,0.1)]"
                   title="استبدال وتحديث كافة التطابقات فوراً وبدقة"
                 >
                   استبدال الكل بدقة 🚀
                 </button>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
 
       {/* Multi-line sync workspace */}
      <div className="flex-1 min-h-0 flex flex-row relative w-full h-full overflow-hidden editor-grid bg-brand-bg/50">
        {/* Scroll Synchronized line guides */}
        <div
          ref={sidebarRef}
          className="w-12 shrink-0 bg-[#141414] border-r border-brand-accent/15 text-right select-none overflow-hidden py-4"
          style={{ direction: 'ltr' }}
        >
          {(() => {
            const LINE_HEIGHT = 24;
            const visibleLines = Math.ceil(editorHeight / LINE_HEIGHT);
            const relativeLine = Math.floor(editorScrollTop / LINE_HEIGHT);
            const startLine = Math.max(1, relativeLine - 10);
            const endLine = Math.min(linesCount, relativeLine + visibleLines + 10);

            const lineNumbers = [];
            for (let i = startLine; i <= endLine; i++) {
              const isCurrent = i === currentLine;
               const isMatched = matches.some(m => m.line === i);
              const hasLineError = lintIssues.some(issue => issue.line === i && issue.type === 'error') || deepIssues.some(issue => issue.line === i && issue.type === 'error');
              const hasLineWarning = lintIssues.some(issue => issue.line === i && issue.type === 'warning') || deepIssues.some(issue => issue.line === i && issue.type === 'warning');
              
              let gutterStyle = "px-3 text-right";
              let borderStyle = "";
              let textStyle = "text-zinc-600 font-light";
              let bgStyle = "";

              if (isCurrent) {
                borderStyle = "border-r-2 border-brand-accent";
                textStyle = "text-brand-accent font-bold";
                bgStyle = "bg-brand-accent/5";
              }

              if (isMatched && searchQuery) {
                borderStyle = "border-r-2 border-amber-500/80";
                textStyle = "text-amber-400 font-bold animate-pulse";
                bgStyle = i === (matches[currentMatchIndex]?.line) ? "bg-amber-500/25" : "bg-amber-500/10";
              }

              if (hasLineError) {
                borderStyle = "border-r-2 border-red-500";
                textStyle = "text-red-400 font-black animate-pulse";
                bgStyle = "bg-red-500/15";
              } else if (hasLineWarning) {
                borderStyle = "border-r-2 border-amber-500";
                textStyle = "text-amber-400 font-bold";
                bgStyle = "bg-amber-500/10";
              }

              lineNumbers.push(
                <div
                  key={i}
                  style={{ height: `${LINE_HEIGHT}px`, lineHeight: `${LINE_HEIGHT}px` }}
                  className={`duration-150 font-mono text-[10px] flex items-center justify-end relative select-none ${gutterStyle} ${borderStyle} ${textStyle} ${bgStyle}`}
                  title={
                    hasLineError ? 'يحتوي هذا السطر على خطأ برمجي!' :
                    hasLineWarning ? 'هذا السطر به بعض التنبيهات أو النصائح التنسيقية.' :
                    undefined
                  }
                >
                  {hasLineError && <span className="absolute left-1 w-1.5 h-1.5 rounded-full bg-red-500" />}
                  {!hasLineError && hasLineWarning && <span className="absolute left-1 w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  <span>{i}</span>
                </div>
              );
            }

            return (
              <div
                style={{
                  paddingTop: `${(startLine - 1) * LINE_HEIGHT}px`,
                  paddingBottom: `${Math.max(0, linesCount - endLine) * LINE_HEIGHT}px`,
                }}
              >
                {lineNumbers}
              </div>
            );
          })()}
        </div>

        {/* Editor Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            const val = e.target;
            const textBeforeCursor = val.value.substring(0, val.selectionStart);
            const lines = textBeforeCursor.split('\n');
            setCurrentLine(lines.length);
            setCurrentCol(lines[lines.length - 1].length + 1);
          }}
          onScroll={(e) => {
            const el = e.currentTarget;
            setEditorScrollTop(el.scrollTop);
            if (sidebarRef.current) sidebarRef.current.scrollTop = el.scrollTop;
          }}
          onSelect={(e) => {
            const val = e.currentTarget;
            const textBeforeCursor = val.value.substring(0, val.selectionStart);
            const lines = textBeforeCursor.split('\n');
            setCurrentLine(lines.length);
            setCurrentCol(lines[lines.length - 1].length + 1);
          }}
          className="flex-1 min-w-0 bg-transparent text-brand-text font-mono text-sm sm:text-base py-4 px-5 outline-none scroll-smooth selection:bg-brand-accent/20 selection:text-brand-text leading-6 overflow-auto resize-none"
          style={{ lineHeight: '24px', whiteSpace: 'pre', wordBreak: 'keep-all' }}
          placeholder="الصق كود الـ HTML هنا..."
          spellCheck="false"
          dir="ltr"
        />


      </div>

      {/* Editor Line Col Footer */}
      <div className="h-8 bg-brand-card border-t border-brand-accent/15 px-4 flex items-center justify-between text-[10px] text-zinc-400 select-none shrink-0 font-mono font-bold">
        <div className="flex items-center gap-3">
          <span>{linesCount} سطر</span>
          <span>{code.length} كود حرف</span>
        </div>
        <div className="flex items-center gap-2">
          <span>السطر: {currentLine}</span>
          <span>العمود: {currentCol}</span>
        </div>
      </div>

      {/* Modern Arabic Compiler Documentation & Template Modal */}
      {isArabicHelpOpen && (
        <div className="absolute inset-0 bg-[#070709]/95 z-30 flex flex-col p-6 overflow-y-auto" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-accent/15 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-accent animate-pulse" />
              <h2 className="text-sm font-black text-brand-text">البرمجة باللغة العربية الفصحى 🌟</h2>
            </div>
            <button 
              onClick={() => setIsArabicHelpOpen(false)}
              className="p-1 hover:bg-brand-accent/10 text-zinc-400 hover:text-brand-accent rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div className="text-xs text-zinc-300 leading-relaxed mb-6 space-y-2 select-none">
            <p>
              أهلاً بك في <strong>NEXUS ARABIC</strong>! لقد قمنا بابتكار مترجم (Transpiler) فوري فخم مدمج في محرر الأكواد يترجم الكلمات والوسوم وحالات React العربية إلى رموز برمجية قياسية تعمل على المتصفح والـ DOM فوراً!
            </p>
            <p>
              اكتب الكود باللغة العربية بالكامل، وراقب المعاينة المتفاعلة تظهر بشكل حي في الجانب المقابل!
            </p>
          </div>

          {/* Quick Loading Templates */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-zinc-100 mb-3 flex items-center gap-1.5 border-r-2 border-brand-accent pr-2 select-none">قوالب جاهزة قابلة للتجربة الفورية كلياً:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setCode(`<!DOCTYPE html>
<مستند لغة="ar" اتجاه="rtl">
<رأس-مستند>
  <هوية-ترميز مظهر="UTF-8" />
  <عنوان-الصفحة>موقع البرمجة بالعربية</عنوان-الصفحة>
  <تنسيق>
    body {
      background-color: #0c0a09;
      color: #fafaf9;
      font-family: system-ui, sans-serif;
    }
  </tنسيق>
</رأس-مستند>
<جسم>
  <حاوية فئة="max-w-xl mx-auto mt-20 p-8 rounded-3xl bg-[#1c1917]/70 border border-[#44403c] text-center shadow-2xl animate__animated animate__fadeIn">
    <عنوان1 فئة="text-4xl font-extrabold text-[#10b981] mb-4">مرحباً بك في لغة الويب العربية! 🚀</عنوان1>
    <فقرة فئة="text-[#a8a29e] leading-relaxed mb-6">
      لقد كتبت هذا الكود باللغة العربية بالكامل! يقوم محرك NEXUS بترجمة الوسوم العربية تلقائياً.
    </فقرة>
    <زر الحدث="console.log('مرحباً بكم في البرمجة باللغة العربية!')" فئة="inline-block px-6 py-3 bg-[#10b981] text-black font-extrabold rounded-full hover:scale-105 duration-150 cursor-pointer">
      مرحباً بالمتصفح 👋
    </زر>
  </حاوية>
</جسم>
</مستند>`);
                  setIsArabicHelpOpen(false);
                }}
                className="p-4 rounded-xl bg-brand-card hover:bg-brand-accent/5 border border-brand-accent/15 hover:border-brand-accent/40 transition-all text-right group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🌐</span>
                  <span className="font-extrabold text-xs text-brand-text group-hover:text-brand-accent transition-colors">قالب HTML5 بالعربية الفصحى</span>
                </div>
                <p className="text-[10px] text-zinc-400 group-hover:text-zinc-300 leading-normal">
                  مستند كامل مستقل يستخدم وسوم مثل &lt;حاوية&gt; و &lt;فقرة&gt; و &lt;زر&gt; والسمات المتأصلة.
                </p>
              </button>

              <button
                onClick={() => {
                  setCode(`// كود متفاعل بلغة React بالكامل!
ثابت مكون تطبيق_معاينة () {
  ثابت [العد, تعيين_العد] = استخدم_حالة(0);
  
  إرجاع (
    <حاوية فئة="flex flex-col items-center justify-center p-8 bg-[#0c0a09]/80 text-white rounded-3xl border border-[#44403c] shadow-2xl">
      <عنوان2 فئة="text-2xl font-black text-[#10b981] mb-4 font-sans">مرحباً من React بالعربية! ⚛️</عنوان2>
      <فقرة فئة="text-zinc-400 mb-6 font-medium text-center">
        تحديث فوري للحالة باستخدام الأكواد العربية والـ Hooks!
      </فقرة>
      <حاوية فئة="text-6xl font-black text-white mb-6">
        {العد}
      </حاوية>
      <حاوية فئة="flex gap-4">
        <زر الحدث={() => تعيين_العد(العد + 1)} فئة="px-6 py-2.5 bg-[#10b981] text-black font-extrabold rounded-full hover:scale-105 duration-150 transition-all cursor-pointer">
          زيادة العداد ➕
        </زر>
        <زر الحدث={() => تعيين_العد(0)} فئة="px-6 py-2.5 bg-[#292524] text-[#fafaf9] font-extrabold rounded-full hover:scale-105 duration-150 transition-all cursor-pointer">
          تصفير 🔄
        </زر>
      </حاوية>
    </حاوية>
  );
}

تصدير افتراضي مكون تطبيق_معاينة;`);
                  setIsArabicHelpOpen(false);
                }}
                className="p-4 rounded-xl bg-brand-card hover:bg-brand-accent/5 border border-brand-accent/15 hover:border-brand-accent/40 transition-all text-right group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">⚛️</span>
                  <span className="font-extrabold text-xs text-brand-text group-hover:text-brand-accent transition-colors">قالب React متفاعل بالعربية</span>
                </div>
                <p className="text-[10px] text-zinc-400 group-hover:text-zinc-300 leading-normal">
                  أبلكيشن React متطور يستخدم العداد والتفاعلية الكاملة عبر تعيين الدوال والـ useState العربية.
                </p>
              </button>
            </div>
          </div>

          {/* Mapping Documentation Tables */}
          <div className="flex-1 min-h-0 overflow-y-auto border border-brand-accent/15 rounded-xl bg-brand-card/30 p-4">
            <h4 className="text-xs font-black text-brand-accent mb-3 flex items-center gap-1 w-full border-b border-brand-accent/10 pb-2">📂 قاموس وسوم البرمجة والسمات العربية ومقابلها</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div>
                <table className="w-full text-right my-2">
                  <thead>
                    <tr className="border-b border-brand-accent/15 text-zinc-400 bg-brand-card/40 text-[10px]">
                      <th className="py-2 px-3 font-extrabold">الوسم العربي</th>
                      <th className="py-2 px-3 font-extrabold">المقابل القياسي (HTML)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/65">
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;حاوية&gt;</td><td className="py-2 px-3 text-zinc-350 font-mono">&lt;div&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;عنوان1&gt; ... &lt;عنوان3&gt;</td><td className="py-2 px-3 text-zinc-350 font-mono">&lt;h1&gt; ... &lt;h3&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;فقرة&gt;</td><td className="py-2 px-3 text-zinc-350 font-mono">&lt;p&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;رابط&gt;</td><td className="py-2 px-3 text-zinc-350 font-mono">&lt;a&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;زر&gt;</td><td className="py-2 px-3 text-zinc-350 font-mono">&lt;button&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;صورة&gt;</td><td className="py-2 px-3 text-zinc-350 font-mono">&lt;img&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;جدول&gt; / &lt;صف&gt; / &lt;خلية&gt;</td><td className="py-2 px-3 text-zinc-350 font-mono">&lt;table&gt; / &lt;tr&gt; / &lt;td&gt;</td></tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <table className="w-full text-right my-2">
                  <thead>
                    <tr className="border-b border-brand-accent/15 text-zinc-400 bg-brand-card/40 text-[10px]">
                      <th className="py-2 px-3 font-extrabold">السمة العربية</th>
                      <th className="py-2 px-3 font-extrabold">المقابل القياسي (React/HTML)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/65">
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">فئة= أو كلاس=</td><td className="py-2 px-3 text-zinc-350 font-mono">class= (أو className)</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">رابط=</td><td className="py-2 px-3 text-zinc-350 font-mono">href=</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">مصدر= أو مسار=</td><td className="py-2 px-3 text-zinc-350 font-mono">src=</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">معرف= أو هوية=</td><td className="py-2 px-3 text-zinc-350 font-mono">id=</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">تنسيق= أو مظهر=</td><td className="py-2 px-3 text-zinc-350 font-mono">style=</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">الحدث= أو ضغطة=</td><td className="py-2 px-3 text-zinc-350 font-mono">onClick=</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">مكون / تصدير / افتراضي / دالة</td><td className="py-2 px-3 text-zinc-350 font-mono">component / export / default / function</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
