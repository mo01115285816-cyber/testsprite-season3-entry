'use client';

import dynamic from 'next/dynamic';
import React, { useCallback } from 'react';
import type { editor } from 'monaco-editor';
import { nexusTheme, NEXUS_THEME_NAME } from '@/lib/monaco/theme';
import { useI18n } from '@/lib/i18n';

// CRITICAL: dynamic import with ssr:false — this is what makes Monaco work
// reliably on mobile and avoids hydration issues.
function MonacoLoadingState() {
  const { t } = useI18n();
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0f0f0f] text-zinc-500 font-mono text-xs">
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
        <span>{t('monaco.loading')}</span>
      </div>
    </div>
  );
}

const MonacoEditorLoader = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: MonacoLoadingState,
});

interface MonacoEditorProps {
  value: string;
  language: string;
  path?: string;
  onChange: (value: string) => void;
  onSave: () => void;
  fontSize?: number;
  readOnly?: boolean;
}

export default function MonacoEditor({
  value,
  language,
  path,
  onChange,
  onSave,
  fontSize = 14,
  readOnly = false,
}: MonacoEditorProps) {
  const handleBeforeMount = useCallback((monaco: any) => {
    monaco.editor.defineTheme(NEXUS_THEME_NAME, nexusTheme);
  }, []);

  const handleMount = useCallback((editorInstance: editor.IStandaloneCodeEditor, monaco: any) => {
    // Ctrl+S to save
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
    // Focus the editor
    editorInstance.focus();
  }, [onSave]);

  return (
    <MonacoEditorLoader
      height="100%"
      theme={NEXUS_THEME_NAME}
      path={path}
      defaultLanguage={language}
      language={language}
      value={value}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={(val) => onChange(val || '')}
      options={{
        minimap: { enabled: false },
        fontSize,
        fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontLigatures: true,
        tabSize: 2,
        automaticLayout: true,
        lineNumbers: 'on',
        lineHeight: 22,
        padding: { top: 12, bottom: 12 },
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        renderWhitespace: 'selection',
        renderLineHighlight: 'all',
        wordWrap: 'on',
        wrappingIndent: 'indent',
        autoIndent: 'advanced',
        formatOnPaste: true,
        quickSuggestions: { other: true, comments: false, strings: false },
        snippetSuggestions: 'inline',
        folding: true,
        showFoldingControls: 'always',
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: 'active', indentation: true },
        readOnly,
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
          useShadows: false,
        },
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        contextmenu: true,
        mouseWheelZoom: true,
        multiCursorModifier: 'ctrlCmd',
      }}
    />
  );
}
