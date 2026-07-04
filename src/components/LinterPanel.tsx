'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bug, X, ShieldCheck, AlertCircle, AlertTriangle, 
  Wrench, Sparkles, RefreshCw 
} from 'lucide-react';
import { DiagnosticIssue } from '../lib/diagnostics';

interface LinterPanelProps {
  isLintPanelOpen: boolean;
  setIsLintPanelOpen: (open: boolean) => void;
  activeLintTab: 'realtime' | 'deep';
  setActiveLintTab: (tab: 'realtime' | 'deep') => void;
  lintIssues: DiagnosticIssue[];
  deepIssues: any[];
  code: string;
  isDeepLinting: boolean;
  deepLintSummary: string | null;
  runDeepLint: () => Promise<void>;
  applyQuickFix: (targetText: string, replacementText: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function LinterPanel({
  isLintPanelOpen,
  setIsLintPanelOpen,
  activeLintTab,
  setActiveLintTab,
  lintIssues,
  deepIssues,
  code,
  isDeepLinting,
  deepLintSummary,
  runDeepLint,
  applyQuickFix,
  textareaRef,
}: LinterPanelProps) {
  
  const focusOnLine = (line: number) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const lines = code.split('\n');
      let offset = 0;
      for (let k = 0; k < Math.min(line - 1, lines.length); k++) {
        offset += lines[k].length + 1;
      }
      textarea.focus();
      textarea.setSelectionRange(offset, offset + (lines[line - 1] || '').length);
      textarea.scrollTop = Math.max(0, (line - 4) * 24);
    }
  };

  return (
    <AnimatePresence>
      {isLintPanelOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ 
            width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : '380px', 
            opacity: 1 
          }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="shrink-0 border-r border-brand-accent/15 bg-brand-bg h-full flex flex-col z-20 overflow-hidden relative"
          dir="rtl"
        >
          {/* Panel header */}
          <div className="p-3 bg-brand-card border-b border-brand-accent/15 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="font-sans font-black text-xs text-brand-text">مدقق وتصحيح الأخطاء</span>
            </div>
            <button
              onClick={() => setIsLintPanelOpen(false)}
              className="text-zinc-400 hover:text-brand-accent transition-all p-1 hover:bg-brand-bg rounded-lg cursor-pointer animate-fade-in"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Diagnostic tabs */}
          <div className="flex border-b border-brand-accent/15 bg-brand-card shrink-0 text-xs">
            <button
              onClick={() => setActiveLintTab('realtime')}
              className={`flex-1 text-center py-2.5 font-bold select-none duration-150 relative cursor-pointer ${
                activeLintTab === 'realtime' ? 'text-brand-text font-extrabold' : 'text-zinc-400 hover:text-brand-accent/80'
              }`}
            >
              <span>فحص فوري ({lintIssues.length})</span>
              {activeLintTab === 'realtime' && (
                <motion.div layoutId="lintToken" className="absolute bottom-0 inset-x-0 h-0.5 bg-rose-500" />
              )}
            </button>
            <button
              onClick={() => setActiveLintTab('deep')}
              className={`flex-1 text-center py-2.5 font-bold select-none duration-150 relative cursor-pointer ${
                activeLintTab === 'deep' ? 'text-brand-text font-extrabold' : 'text-zinc-400 hover:text-brand-accent/80'
              }`}
            >
              <span>تحليل الـ AI ({deepIssues.length})</span>
              {activeLintTab === 'deep' && (
                <motion.div layoutId="lintToken" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-accent" />
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
            {activeLintTab === 'realtime' && (
              <>
                {lintIssues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center mb-4 text-white">
                      <ShieldCheck className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="text-xs font-extrabold text-zinc-100 mb-1">تصميم ممتاز ومتناسق!</h4>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">لم يرصد مصحح الأخطاء الفوري أية مشاكل برمجية أو علامات توازن مفقودة في الكود الحالي.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {lintIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-3 rounded-xl border transition-all ${
                          issue.type === 'error'
                            ? 'bg-red-500/5 hover:bg-red-500/8 border-red-500/20 shadow-[0_2px_8px_rgba(239,68,68,0.05)]'
                            : 'bg-amber-500/5 hover:bg-amber-500/8 border-amber-500/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 p-1 rounded-md ${issue.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-500'}`}>
                            {issue.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-zinc-200 truncate">{issue.message}</span>
                              <button
                                onClick={() => focusOnLine(issue.line)}
                                className="text-[9px] font-black bg-[#121215] hover:bg-zinc-900 text-zinc-400 border border-white/5 px-1.5 py-0.5 rounded leading-none shrink-0 cursor-pointer"
                              >
                                السطر {issue.line}
                              </button>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">{issue.explanation}</p>
                            <div className="bg-[#09090b] p-2 rounded-lg border border-white/5 mt-2 text-[10px] text-white leading-relaxed flex items-start gap-1">
                              <span className="shrink-0 text-[11px]">💡</span>
                              <span>{issue.suggestion}</span>
                            </div>

                            {issue.targetText && issue.replacementText !== undefined && (
                              <button
                                onClick={() => applyQuickFix(issue.targetText!, issue.replacementText!)}
                                className="w-full mt-2.5 py-1.5 px-2.5 rounded-lg bg-brand-accent/10 hover:bg-brand-accent text-brand-accent hover:text-brand-bg transition-all text-[10px] font-black border border-brand-accent/25 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>إصلاح فوري بضغطة واحدة</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeLintTab === 'deep' && (
              <>
                {/* deep reviewer initiator card */}
                <div className="bg-brand-card p-4 rounded-2xl border border-brand-accent/15 mb-2 shadow-[0_0_15px_rgba(93,214,44,0.03)]">
                  <h4 className="text-xs font-black text-zinc-200 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
                    <span>مدقق الأكواد المعمق من Gemini</span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
                    يستعين هذا المدقق بقدرات الذكاء الاصطناعي الأقوى لتحليل مكونات React وواجهات HTML دلالياً وكشف الأخطاء المنطقية وتوفير سياق تصميم فريد.
                  </p>
                  <button
                    onClick={runDeepLint}
                    disabled={isDeepLinting}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-accent via-brand-deep to-brand-accent text-brand-bg transition-all text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(93,214,44,0.12)] active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    {isDeepLinting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    )}
                    <span>{isDeepLinting ? 'جاري التحليل المعمق للرموز...' : 'ابدأ الفحص المعزز بالـ AI ⚡'}</span>
                  </button>
                </div>

                {/* deep lint results */}
                {isDeepLinting ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4">
                    <div className="relative mb-4 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-2 border-brand-accent/25 border-t-brand-accent border-r-white/10 border-b-white/10 border-l-white/10 animate-spin" />
                      <Sparkles className="w-4 h-4 text-brand-accent absolute animate-pulse" />
                    </div>
                    <h4 className="text-[11px] font-extrabold text-zinc-300">يقرأ الذكاء الاصطناعي سياقك...</h4>
                    <p className="text-[9px] text-zinc-400 max-w-xs mt-1">يتم الآن تفسير هيكلية الـ JSX وأنماط CSS للوقوف على التناسق والدقة التجميعية.</p>
                  </div>
                ) : (
                  <>
                    {deepIssues.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-brand-card rounded-2xl border border-brand-accent/15">
                        <ShieldCheck className="w-10 h-10 text-brand-accent/80" />
                        <h5 className="text-[11px] font-bold text-zinc-400 mt-2">لا توجد مراجعات عميقة مخزنة</h5>
                        <p className="text-[9px] text-zinc-650 mt-1">اضغط على الزر الأخضر أعلاه لتسجيل النتيجة.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {deepLintSummary && (
                          <div className="bg-brand-card p-2.5 rounded-xl border border-brand-accent/15 text-[10px] text-zinc-300 leading-relaxed select-none">
                            {deepLintSummary}
                          </div>
                        )}
                        {deepIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className={`p-3 rounded-xl border transition-all ${
                              issue.type === 'error'
                                ? 'bg-red-500/5 hover:bg-red-500/8 border-red-500/20 shadow-[0_2px_8px_rgba(239,68,68,0.05)]'
                                : 'bg-amber-500/5 hover:bg-amber-500/8 border-amber-500/20'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`mt-0.5 p-1 rounded-md ${issue.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-500'}`}>
                                {issue.isSecurityIssue ? <ShieldCheck className="w-3.5 h-3.5" /> : (issue.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-black text-zinc-200 truncate">{issue.message}</span>
                                  <div className="flex gap-1">
                                    {issue.cvss !== undefined && (
                                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 ${issue.cvss >= 9 ? 'bg-rose-500/20 text-rose-400' : issue.cvss >= 7 ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        CVSS: {issue.cvss}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => focusOnLine(issue.line)}
                                      className="text-[9px] font-black bg-brand-bg hover:bg-brand-card text-brand-accent border border-brand-accent/20 px-1.5 py-0.5 rounded leading-none shrink-0 cursor-pointer"
                                    >
                                      السطر {issue.line}
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">{issue.explanation}</p>
                                
                                {issue.cwe && (
                                  <div className="mt-2 text-[9px] text-zinc-400 flex items-center gap-1 font-mono">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    <span>{issue.cwe}</span>
                                  </div>
                                )}

                                {issue.poc && (
                                  <div className="mt-2 text-[9px] bg-brand-bg border border-brand-accent/20 rounded p-2 overflow-x-auto text-brand-text font-mono" dir="ltr">
                                    <div className="text-rose-400/80 uppercase mb-1 text-[8px] font-sans font-bold flex items-center gap-1">
                                      <Bug className="w-2.5 h-2.5" /> Proof of Concept (PoC)
                                    </div>
                                    {issue.poc}
                                  </div>
                                )}

                                <div className="bg-brand-bg p-2 rounded-lg border border-brand-accent/20 mt-2 text-[10px] text-brand-text leading-relaxed flex items-start gap-1">
                                  <span className="shrink-0 text-[11px]">💡</span>
                                  <span>{issue.suggestion}</span>
                                </div>

                                {issue.targetText && issue.replacementText !== undefined && (
                                  <button
                                    onClick={() => applyQuickFix(issue.targetText!, issue.replacementText!)}
                                    className="w-full mt-2.5 py-1.5 px-2.5 rounded-lg bg-brand-accent/10 hover:bg-brand-accent text-brand-accent hover:text-brand-bg transition-all text-[10px] font-black border border-brand-accent/25 flex items-center justify-center gap-1 cursor-pointer"
                                    title="إصلاح فوري للخطأ"
                                  >
                                    <Wrench className="w-3 h-3" />
                                    <span>إصلاح فوري للخطأ</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
