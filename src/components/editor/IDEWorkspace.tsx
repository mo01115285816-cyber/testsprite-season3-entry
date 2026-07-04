'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PanelRightOpen, PanelRightClose, Bug, Sparkles, Save, Smile, Trash2, Search, HelpCircle } from 'lucide-react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { preprocessArabicCode, preprocessReactCode, isReactCode } from '@/lib/diagnostics';
import FileExplorer from '@/components/filesystem/FileExplorer';
import EditorTabs from '@/components/editor/EditorTabs';
import MonacoEditor from '@/components/editor/MonacoEditor';
import LinterPanel from '@/components/LinterPanel';
import type { DiagnosticIssue } from '@/lib/diagnostics';

interface IDEWorkspaceProps {
  lintIssues: DiagnosticIssue[];
  deepIssues: any[];
  isLintPanelOpen: boolean;
  setIsLintPanelOpen: (open: boolean) => void;
  activeLintTab: 'realtime' | 'deep';
  setActiveLintTab: (tab: 'realtime' | 'deep') => void;
  code: string;
  setCode: (code: string) => void;
  isDeepLinting: boolean;
  deepLintSummary: string | null;
  runDeepLint: () => Promise<void>;
  applyQuickFix: (targetText: string, replacementText: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onTriggerAiGeneration?: (prompt: string) => void;
  isAgentThinking?: boolean;
  isFormatting: boolean;
  formatCode: () => Promise<void>;
  // Restored toolbar props
  setIsIconModalOpen: (open: boolean) => void;
  isConfirmingClear: boolean;
  setIsConfirmingClear: (val: boolean) => void;
}

export default function IDEWorkspace({
  lintIssues, deepIssues, isLintPanelOpen, setIsLintPanelOpen,
  activeLintTab, setActiveLintTab, isDeepLinting, deepLintSummary,
  runDeepLint, applyQuickFix, textareaRef, onTriggerAiGeneration,
  isAgentThinking, isFormatting, formatCode,
  setIsIconModalOpen, isConfirmingClear, setIsConfirmingClear,
  // NOTE: code + setCode come from parent but we override with file-system active content
  code: _parentCode, setCode: _parentSetCode,
}: IDEWorkspaceProps) {
  const fs = useFileSystem();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [localCode, setLocalCode] = useState('');

  // Sync local code with active file — read fresh from DB to avoid stale content
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (fs.activeFile?.id) {
        // Read fresh content from IndexedDB (files state might be stale)
        const { getFile } = await import('@/lib/filesystem/db');
        const fresh = await getFile(fs.activeFile.id);
        if (!cancelled && fresh) {
          setLocalCode(fresh.content || '');
        }
      } else {
        if (!cancelled) setLocalCode('');
      }
    })();
    return () => { cancelled = true; };
  }, [fs.activeFile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditorChange = useCallback((value: string) => {
    setLocalCode(value);
    if (fs.activeTab) {
      fs.markTabDirty(fs.activeTab.id, true);
    }
  }, [fs.activeTab, fs.markTabDirty]);

  const handleSave = useCallback(() => {
    if (fs.activeFile) {
      fs.saveFileContent(fs.activeFile.id, localCode);
    }
  }, [fs.activeFile, localCode, fs.saveFileContent]);

  // Format handler — formats local code, then saves
  const handleFormat = useCallback(async () => {
    if (!localCode) return;
    // We'll call the parent formatCode but it operates on parent's code state.
    // To keep it simple, we update parent code first, then format.
    _parentSetCode(localCode);
    await formatCode();
  }, [localCode, _parentSetCode, formatCode]);

  // Processed code for preview (Arabic translation + React compilation)
  const processedCode = useMemo(() => {
    if (!localCode) return '';
    const arabicPreprocessed = preprocessArabicCode(localCode);
    const isReact = isReactCode(arabicPreprocessed);
    if (isReact) {
      return preprocessReactCode(arabicPreprocessed);
    }
    return arabicPreprocessed;
  }, [localCode]);

  const activeLanguage = fs.activeFile?.language || 'plaintext';

  return (
    <div className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
      {/* Sidebar: File Explorer — overlay on mobile, inline on desktop */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="shrink-0 overflow-hidden absolute md:relative right-0 top-0 bottom-0 z-30 md:z-auto"
          >
            <FileExplorer
              files={fs.files}
              activeFileId={fs.activeFile?.id || null}
              onOpenFile={fs.openFile}
              onCreateFile={fs.createNewFile}
              onCreateFolder={fs.createNewFolder}
              onDeleteFile={fs.deleteFileById}
              onRenameFile={fs.renameFileById}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main editor area */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#0f0f0f]">
        {/* Editor toolbar */}
        <div className="shrink-0 flex items-center justify-between h-9 bg-brand-bg border-b border-brand-accent/10 px-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={sidebarOpen ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي'}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded hover:bg-brand-accent/10 text-zinc-400 hover:text-brand-accent transition-colors cursor-pointer"
            >
              {sidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            </button>
            {fs.activeFile && (
              <span className="text-[10px] text-zinc-500 font-mono ml-2 truncate max-w-[200px]">
                {fs.activeFile.path}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="بحث في الكود (Ctrl+F)"
              onClick={() => {
                // Monaco handles Ctrl+F internally; this button is a hint
                const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true });
                document.dispatchEvent(event);
              }}
              disabled={!fs.activeFile}
              className="magnetic p-1.5 rounded text-zinc-400 hover:text-brand-accent hover:bg-brand-accent/10 disabled:opacity-40 cursor-pointer"
              title="بحث (Ctrl+F)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="مكتبة الأيقونات"
              onClick={() => setIsIconModalOpen(true)}
              className="magnetic p-1.5 rounded text-zinc-400 hover:text-brand-accent hover:bg-brand-accent/10 cursor-pointer"
              title="مكتبة الأيقونات"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="تنسيق الكود"
              onClick={handleFormat}
              disabled={isFormatting || !fs.activeFile}
              className="magnetic flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-zinc-300 hover:text-brand-accent hover:bg-brand-accent/10 disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden md:inline">تنسيق</span>
            </button>
            <button
              type="button"
              aria-label="فحص الأمان"
              onClick={runDeepLint}
              disabled={isDeepLinting || !fs.activeFile}
              className="magnetic flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-zinc-300 hover:text-brand-accent hover:bg-brand-accent/10 disabled:opacity-40 cursor-pointer"
            >
              <Bug className="w-3 h-3" />
              <span className="hidden md:inline">فحص</span>
            </button>
            <button
              type="button"
              aria-label="حفظ الملف"
              onClick={handleSave}
              disabled={!fs.activeFile}
              className="magnetic flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-zinc-300 hover:text-brand-accent hover:bg-brand-accent/10 disabled:opacity-40 cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span className="hidden md:inline">حفظ</span>
            </button>
            <button
              type="button"
              aria-label={isLintPanelOpen ? 'إخفاء الفاحص' : 'إظهار الفاحص'}
              onClick={() => setIsLintPanelOpen(!isLintPanelOpen)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isLintPanelOpen ? 'bg-brand-accent/10 text-brand-accent' : 'text-zinc-400 hover:text-brand-accent hover:bg-brand-accent/10'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="مسح الكود"
              onClick={() => {
                if (isConfirmingClear) {
                  setLocalCode('');
                  if (fs.activeFile) {
                    fs.saveFileContent(fs.activeFile.id, '');
                  }
                  setIsConfirmingClear(false);
                } else {
                  setIsConfirmingClear(true);
                  setTimeout(() => setIsConfirmingClear(false), 3000);
                }
              }}
              disabled={!fs.activeFile}
              className={`magnetic p-1.5 rounded transition-colors cursor-pointer disabled:opacity-40 ${
                isConfirmingClear ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
              }`}
              title={isConfirmingClear ? 'اضغط مرة أخرى للتأكيد' : 'مسح الكود'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Editor tabs */}
        <EditorTabs
          tabs={fs.openTabs}
          activeTabId={fs.activeTabId}
          onSelectTab={fs.setActiveTab}
          onCloseTab={fs.closeTab}
        />

        {/* Monaco Editor — matches reference: flex-1 relative, h-full w-full inner */}
        <div className="flex-1 relative bg-[#0f0f0f] min-h-0">
          {fs.activeFile ? (
            <div className="h-full w-full">
              <MonacoEditor
                value={localCode}
                language={activeLanguage}
                path={fs.activeFile.path}
                onChange={handleEditorChange}
                onSave={handleSave}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-[#0f0f0f] text-center">
              <Sparkles className="w-6 h-6 text-brand-accent/30 mb-2" />
              <p className="text-[11px] text-zinc-600 max-w-xs">
                افتح ملفاً من المستكشف لتبدأ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Linter Panel */}
      <LinterPanel
        isLintPanelOpen={isLintPanelOpen}
        setIsLintPanelOpen={setIsLintPanelOpen}
        activeLintTab={activeLintTab}
        setActiveLintTab={setActiveLintTab}
        lintIssues={lintIssues}
        deepIssues={deepIssues}
        code={localCode}
        isDeepLinting={isDeepLinting}
        deepLintSummary={deepLintSummary}
        runDeepLint={runDeepLint}
        applyQuickFix={applyQuickFix}
        textareaRef={textareaRef}
      />
    </div>
  );
}
