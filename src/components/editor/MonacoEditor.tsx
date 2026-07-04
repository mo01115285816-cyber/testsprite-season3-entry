'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import Editor, { type OnMount, type BeforeMount, type OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { nexusTheme, NEXUS_THEME_NAME } from '@/lib/monaco/theme';

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onFormat?: () => void;
  fontSize?: number;
  readOnly?: boolean;
}

export default function MonacoEditor({
  value,
  language,
  onChange,
  onSave,
  fontSize = 14,
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme(NEXUS_THEME_NAME, nexusTheme);
  }, []);

  const handleMount: OnMount = useCallback((editorInstance, monaco) => {
    editorRef.current = editorInstance;

    // Ctrl+S to save
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Focus the editor
    editorInstance.focus();
  }, [onSave]);

  const handleChange: OnChange = useCallback((newValue) => {
    onChange(newValue || '');
  }, [onChange]);

  return (
    <div className="w-full h-full overflow-hidden bg-[#0f0f0f]">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        theme={NEXUS_THEME_NAME}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        loading={
          <div className="flex items-center justify-center h-full bg-[#0f0f0f]">
            <div className="text-zinc-500 text-sm font-mono animate-pulse">
              ...تحميل المحرر
            </div>
          </div>
        }
        options={{
          fontSize,
          fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontLigatures: true,
          lineHeight: 1.6,
          letterSpacing: 0.3,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          cursorBlinking: 'smooth',
          renderWhitespace: 'selection',
          renderLineHighlight: 'all',
          roundedSelection: true,
          padding: { top: 16, bottom: 16 },
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          wrappingIndent: 'indent',
          autoIndent: 'advanced',
          formatOnPaste: true,
          formatOnType: false,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          quickSuggestions: { other: true, comments: false, strings: false },
          snippetSuggestions: 'inline',
          codeLens: true,
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
          selectionClipboard: false,
        }}
      />
    </div>
  );
}
