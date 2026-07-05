'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Code2, Sparkles, Smile, Trash2, Bug, AlertCircle, AlertTriangle, X, Play, Copy, HelpCircle,
  Search, ChevronLeft, ChevronRight, Folder, FolderOpen, FileCode, Hash, FileText, FileJson,
  Plus, Edit2, ChevronDown, Check, FolderPlus, FilePlus, ChevronRight as ChevronRightIcon,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor, { Monaco } from '@monaco-editor/react';
import { DiagnosticIssue } from '../lib/diagnostics';

// Virtual File System type definitions
export interface WorkspaceFile {
  name: string;
  content: string;
  isFolder: boolean;
  isOpen?: boolean;
}

export type WorkspaceFiles = Record<string, WorkspaceFile>;

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
  
  // Virtual File System properties
  files: WorkspaceFiles;
  setFiles: React.Dispatch<React.SetStateAction<WorkspaceFiles>>;
  activeFile: string;
  setActiveFile: (path: string) => void;
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

  // VFS properties
  files,
  setFiles,
  activeFile,
  setActiveFile,
}: CodeEditorProps) {

  const [isArabicHelpOpen, setIsArabicHelpOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(null);
  const [isConfirmWipeOpen, setIsConfirmWipeOpen] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Dynamic extraction of project name from active folders
  const getProjectName = (files: WorkspaceFiles) => {
    const paths = Object.keys(files);
    if (paths.length === 0) return "مشروع جديد";
    const rootFolders = new Set<string>();
    paths.forEach(p => {
      const parts = p.split('/');
      if (parts.length > 1) {
        rootFolders.add(parts[0]);
      }
    });
    if (rootFolders.size > 0) {
      return Array.from(rootFolders)[0];
    }
    return "مشروعي";
  };

  // States for creating files/folders
  const [showCreateInput, setShowCreateInput] = useState<{ isFolder: boolean; parentDir: string } | null>(null);
  const [createName, setCreateName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [fileFilter, setFileFilter] = useState('');

  // Advanced Search & Replace Engine States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCopyPanelOpen, setIsCopyPanelOpen] = useState(false);
  const [copyStartLine, setCopyStartLine] = useState<number | ''>('');
  const [copyEndLine, setCopyEndLine] = useState<number | ''>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matches, setMatches] = useState<any[]>([]);
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);
  const [searchWholeWord, setSearchWholeWord] = useState(false);
  const [searchRegex, setSearchRegex] = useState(false);

  // Register markers on editor mount or diagnostics update
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers = [
          ...lintIssues.map(issue => ({
            startLineNumber: issue.line || 1,
            startColumn: 1,
            endLineNumber: issue.line || 1,
            endColumn: model.getLineLength(issue.line || 1) + 1,
            message: issue.message,
            severity: issue.type === 'error' ? monacoRef.current.MarkerSeverity.Error : monacoRef.current.MarkerSeverity.Warning
          })),
          ...deepIssues.map(issue => ({
            startLineNumber: issue.line || 1,
            startColumn: 1,
            endLineNumber: issue.line || 1,
            endColumn: model.getLineLength(issue.line || 1) + 1,
            message: issue.message,
            severity: issue.type === 'error' ? monacoRef.current.MarkerSeverity.Error : monacoRef.current.MarkerSeverity.Warning
          }))
        ];
        monacoRef.current.editor.setModelMarkers(model, "nexus-owner", markers);
      }
    }
  }, [lintIssues, deepIssues, activeFile, code]);

  // Synchronize custom search panel with Monaco search matches
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!editorRef.current || !query) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }
    const model = editorRef.current.getModel();
    const monacoMatches = model.findMatches(query, false, searchRegex, searchCaseSensitive, searchWholeWord ? 'word' : null, true);
    
    const formattedMatches = monacoMatches.map((m: any, idx: number) => ({
      start: model.getOffsetAt(m.range.getStartPosition()),
      end: model.getOffsetAt(m.range.getEndPosition()),
      line: m.range.startLineNumber,
      range: m.range
    }));

    setMatches(formattedMatches);
    if (formattedMatches.length > 0) {
      setCurrentMatchIndex(0);
      editorRef.current.setSelection(formattedMatches[0].range);
      editorRef.current.revealRangeInCenter(formattedMatches[0].range);
      
      setCurrentLine(formattedMatches[0].range.startLineNumber);
      setCurrentCol(formattedMatches[0].range.startColumn);
    } else {
      setCurrentMatchIndex(-1);
    }
  };

  useEffect(() => {
    if (isSearchOpen && searchQuery) {
      handleSearch(searchQuery);
    }
  }, [searchCaseSensitive, searchWholeWord, searchRegex]);

  const handleNextMatch = () => {
    if (matches.length === 0 || !editorRef.current) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    const match = matches[nextIndex];
    editorRef.current.setSelection(match.range);
    editorRef.current.revealRangeInCenter(match.range);
    setCurrentLine(match.range.startLineNumber);
    setCurrentCol(match.range.startColumn);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0 || !editorRef.current) return;
    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIndex);
    const match = matches[prevIndex];
    editorRef.current.setSelection(match.range);
    editorRef.current.revealRangeInCenter(match.range);
    setCurrentLine(match.range.startLineNumber);
    setCurrentCol(match.range.startColumn);
  };

  const handleReplace = () => {
    if (currentMatchIndex < 0 || !editorRef.current || matches.length === 0) return;
    const match = matches[currentMatchIndex];
    editorRef.current.executeEdits("nexus-search-replace", [{
      range: match.range,
      text: replaceQuery,
      forceMoveMarkers: true
    }]);
    handleSearch(searchQuery);
  };

  const handleReplaceAll = () => {
    if (!editorRef.current || matches.length === 0) return;
    const edits = matches.map((m: any) => ({
      range: m.range,
      text: replaceQuery,
      forceMoveMarkers: true
    }));
    editorRef.current.executeEdits("nexus-search-replace-all", edits);
    handleSearch(searchQuery);
  };

  // Setup Monaco custom theme and configure features
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define glowing cyberpunk green dark theme
    monaco.editor.defineTheme('nexus-cyber-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '5dd62c', fontStyle: 'bold' },
        { token: 'string', foreground: '22c55e' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'regexp', foreground: '10b981' },
        { token: 'type', foreground: '38bdf8' },
        { token: 'class', foreground: 'fbbf24' },
        { token: 'function', foreground: '60a5fa' },
        { token: 'variable', foreground: 'e2e8f0' },
      ],
      colors: {
        'editor.background': '#0f0f0f',
        'editor.foreground': '#f8f8f8',
        'editor.lineHighlightBackground': '#18181b',
        'editorGutter.background': '#0b0b0c',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#5dd62c',
        'editor.selectionBackground': '#5dd62c25',
        'editor.inactiveSelectionBackground': '#5dd62c10',
        'editorWidget.background': '#18181b',
        'editorWidget.border': '#5dd62c30',
        'editorSuggestWidget.background': '#18181b',
        'editorSuggestWidget.border': '#5dd62c20',
        'editorSuggestWidget.selectedBackground': '#5dd62c20',
      },
    });

    monaco.editor.setTheme('nexus-cyber-theme');

    // Setup cursor and position listeners
    editor.onDidChangeCursorPosition((e: any) => {
      setCurrentLine(e.position.lineNumber);
      setCurrentCol(e.position.column);
    });

    // Handle scroll bounds
    editor.onDidScrollChange((e: any) => {
      setEditorScrollTop(e.scrollTop);
    });

    // Keyboard bindings for search/replace
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setIsSearchOpen(prev => !prev);
    });
  };

  // Guess code editor language by file extension
  const getEditorLanguage = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': case 'htm': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'jsx': return 'javascript';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'html';
    }
  };

  // Boilerplate seed for newly created files
  const getInitialContent = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
        return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة جديدة</title>
</head>
<body>
    <h1>صفحة جديدة جاهزة للتصميم ✨</h1>
</body>
</html>`;
      case 'css':
        return `/* تنسيقات CSS مخصصة */\nbody {\n    margin: 0;\n    padding: 0;\n}`;
      case 'js':
        return `// كود جافا سكريبت مخصص\nconsole.log("تم تحميل الملف بنجاح!");`;
      case 'tsx': case 'jsx':
        return `// مكون React مخصص\nimport React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-8 text-center">\n      <h1 className="text-2xl font-bold">مكون ريأكت جديد ⚛️</h1>\n    </div>\n  );\n}`;
      case 'json':
        return `{\n  "name": "data",\n  "version": "1.0.0"\n}`;
      case 'md':
        return `# مستند توثيقي جديد 📜\n\nاكتب هنا توثيق المشروع بالماركدون.`;
      default:
        return '';
    }
  };

  // Create file/folder in the virtual workspace
  const handleCreateItem = () => {
    if (!createName.trim()) {
      setShowCreateInput(null);
      return;
    }

    const isFolder = showCreateInput?.isFolder || false;
    const parentDir = showCreateInput?.parentDir || '';
    const fullPath = parentDir ? `${parentDir}/${createName.trim()}` : createName.trim();

    if (files[fullPath]) {
      alert("هذا الملف أو المجلد موجود بالفعل!");
      return;
    }

    const newFiles = { ...files };
    
    // Auto create folders along the path if nested
    const parts = fullPath.split('/');
    let currentPath = "";
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (i < parts.length - 1) {
        if (!newFiles[currentPath]) {
          newFiles[currentPath] = {
            name: part,
            content: "",
            isFolder: true,
            isOpen: true
          };
        }
      } else {
        newFiles[currentPath] = {
          name: part,
          content: isFolder ? "" : getInitialContent(part),
          isFolder: isFolder,
          isOpen: isFolder ? true : undefined
        };
      }
    }

    setFiles(newFiles);
    setShowCreateInput(null);
    setCreateName('');
    
    if (!isFolder) {
      setActiveFile(fullPath);
    }
  };

  // Delete file/folder with children propagation
  const handleDeleteItem = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (path === "index.html") {
      alert("لا يمكن حذف ملف index.html الرئيسي الخاص بالنظام!");
      return;
    }
    setDeleteConfirmPath(path);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmPath) return;
    const path = deleteConfirmPath;

    const newFiles = { ...files };
    delete newFiles[path];

    // Propagate deletion to children of this folder
    if (files[path]?.isFolder) {
      Object.keys(files).forEach(key => {
        if (key.startsWith(`${path}/`)) {
          delete newFiles[key];
        }
      });
    }

    setFiles(newFiles);

    // Reset active file if it was deleted or inside deleted folder
    if (activeFile === path || activeFile.startsWith(`${path}/`)) {
      setActiveFile("index.html");
    }

    setDeleteConfirmPath(null);
  };

  // Rename file/folder with child updates
  const handleRenameItem = () => {
    if (!renamingPath || !renameValue.trim()) {
      setRenamingPath(null);
      return;
    }

    const oldPath = renamingPath;
    const newName = renameValue.trim();
    const parts = oldPath.split('/');
    const oldName = parts[parts.length - 1];

    if (newName === oldName) {
      setRenamingPath(null);
      return;
    }

    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');

    if (files[newPath]) {
      alert("الملف أو المجلد الجديد موجود بالفعل!");
      return;
    }

    const newFiles = { ...files };
    const targetItem = files[oldPath];

    newFiles[newPath] = {
      ...targetItem,
      name: newName
    };
    delete newFiles[oldPath];

    // Update children paths recursively if renaming a folder
    if (targetItem.isFolder) {
      Object.keys(files).forEach(key => {
        if (key.startsWith(`${oldPath}/`)) {
          const remainingPath = key.substring(oldPath.length);
          const childNewPath = `${newPath}${remainingPath}`;
          newFiles[childNewPath] = {
            ...files[key]
          };
          delete newFiles[key];

          if (activeFile === key) {
            setActiveFile(childNewPath);
          }
        }
      });
    }

    setFiles(newFiles);
    setRenamingPath(null);
    setRenameValue('');

    if (activeFile === oldPath) {
      setActiveFile(newPath);
    }
  };

  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => ({
      ...prev,
      [path]: {
        ...prev[path],
        isOpen: !prev[path].isOpen
      }
    }));
  };

  // Sorting virtual file system to show folders first, then files
  const sortedFilePaths = Object.keys(files).sort((a, b) => {
    const aParts = a.split('/');
    const bParts = b.split('/');
    const maxLength = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < maxLength; i++) {
      if (aParts[i] !== bParts[i]) {
        if (!aParts[i]) return -1;
        if (!bParts[i]) return 1;
        
        const aIsDir = i < aParts.length - 1 || files[aParts.slice(0, i + 1).join('/')]?.isFolder;
        const bIsDir = i < bParts.length - 1 || files[bParts.slice(0, i + 1).join('/')]?.isFolder;

        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;

        return aParts[i].localeCompare(bParts[i]);
      }
    }
    return a.localeCompare(b);
  });

  // Filter paths matching current query and active folder toggles
  const visibleFilePaths = sortedFilePaths.filter(path => {
    // Search query filter
    if (fileFilter && !path.toLowerCase().includes(fileFilter.toLowerCase())) {
      return false;
    }

    const parts = path.split('/');
    let currentParent = "";
    
    // Toggle expand/collapse filters
    for (let i = 0; i < parts.length - 1; i++) {
      currentParent = currentParent ? `${currentParent}/${parts[i]}` : parts[i];
      if (files[currentParent] && files[currentParent].isOpen === false) {
        return false;
      }
    }
    return true;
  });

  const getFileIcon = (filePath: string, isFolder: boolean, isOpen?: boolean) => {
    if (isFolder) {
      return isOpen ? (
        <FolderOpen className="w-4 h-4 text-brand-accent/90 shrink-0" />
      ) : (
        <Folder className="w-4 h-4 text-brand-accent/70 shrink-0" />
      );
    }

    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': case 'htm':
        return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'css':
        return <Hash className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'js':
        return <Code2 className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'tsx': case 'jsx':
        return <FileCode className="w-4 h-4 text-emerald-300 shrink-0" />;
      case 'ts':
        return <Code2 className="w-4 h-4 text-sky-300 shrink-0" />;
      case 'json':
        return <FileJson className="w-4 h-4 text-pink-400 shrink-0" />;
      case 'md':
        return <FileText className="w-4 h-4 text-zinc-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-zinc-300 shrink-0" />;
    }
  };

  const linesCount = code.split('\n').length;
  const errorsCount = lintIssues.filter(i => i.type === 'error').length + deepIssues.filter(i => i.type === 'error').length;
  const warningsCount = lintIssues.filter(i => i.type === 'warning').length + deepIssues.filter(i => i.type === 'warning').length;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-brand-bg border-r border-brand-accent/15 relative overflow-hidden" id="nexus-core-ide">
      
      {/* Redesigned formatting and action toolbar */}
      <div className="h-12 bg-brand-card/90 backdrop-blur-md border-b border-brand-accent/15 px-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            {/* Sidebar Explorer Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center justify-center w-7 h-7 rounded-md border transition-all select-none cursor-pointer duration-150 ${
                isSidebarOpen 
                  ? 'bg-brand-accent/15 border-brand-accent/40 text-brand-text shadow-[0_0_8px_rgba(93,214,44,0.15)]' 
                  : 'bg-brand-bg border-brand-accent/20 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-brand-accent/40'
              }`}
              title="مستكشف ملفات المشروع"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-3.5 bg-zinc-850 mx-0.5" />

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

      {/* Collapsible Search & Replace panel */}
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
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-4xl">
                 <div className="relative flex items-center bg-brand-bg border border-brand-accent/20 rounded-xl px-3 py-1.5 focus-within:border-brand-accent/50 focus-within:shadow-[0_0_8px_rgba(93,214,44,0.1)] transition-all w-full sm:w-80">
                   <button
                     onClick={() => handleSearch(searchQuery)}
                     className="p-1 hover:bg-brand-accent/15 rounded-lg text-zinc-400 hover:text-brand-accent duration-150 transition-all shrink-0 ml-1.5 cursor-pointer flex items-center justify-center border border-transparent hover:border-brand-accent/30"
                     title="البحث الفوري والدقيق الآن 🚀"
                   >
                     <Search className="w-4 h-4 text-brand-accent animate-pulse" />
                   </button>
                   <input
                     type="text"
                     placeholder="ابحث عن نص أو كود..."
                     value={searchQuery}
                     onChange={(e) => handleSearch(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         handleNextMatch();
                       }
                     }}
                     className="bg-transparent text-white placeholder-zinc-500 outline-none text-xs w-full text-left font-mono font-bold"
                     dir="ltr"
                   />
                   {searchQuery && (
                     <button 
                       onClick={() => handleSearch('')}
                       className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded ml-0.5 transition-colors"
                     >
                       <X className="w-3 h-3" />
                     </button>
                   )}
                 </div>

                 {searchQuery && (
                   <span className="px-2.5 py-1 text-[10px] bg-brand-accent/10 border border-brand-accent/20 text-brand-text rounded-lg font-mono font-extrabold select-none">
                     {matches.length > 0 ? `${currentMatchIndex + 1} من ${matches.length}` : 'لا يوجد تطابق ⚠️'}
                   </span>
                 )}

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

                 <div className="flex items-center gap-1.5 bg-brand-bg border border-brand-accent/15 rounded-xl p-0.5 select-none">
                   <button
                     onClick={() => setSearchCaseSensitive(!searchCaseSensitive)}
                     className={`px-2.5 py-1 text-[10px] rounded-lg border font-mono font-bold transition-all cursor-pointer ${
                       searchCaseSensitive 
                         ? 'bg-brand-accent/20 border-brand-accent/35 text-brand-text font-black' 
                         : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                     }`}
                     title="حساسية حالة الأحرف (Aa)"
                   >
                     Aa
                   </button>
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

              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  handleSearch('');
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

      {/* Main Workspace split into Collapsible File Tree Sidebar & Monaco Code Editor */}
      <div className="flex-1 min-h-0 flex flex-row relative w-full h-full overflow-hidden editor-grid bg-brand-bg/50">
        
        {/* Animated File Explorer sidebar (Right side for RTL layout) */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="h-full bg-[#111114] border-l border-brand-accent/15 flex flex-col shrink-0 select-none z-10 overflow-hidden"
              dir="rtl"
            >
              {/* Sidebar Header */}
              <div className="p-3 border-b border-brand-accent/10 flex items-center justify-between">
                <span className="font-bold text-xs tracking-wide text-brand-text font-sans truncate max-w-[130px]" title={getProjectName(files)}>
                  {getProjectName(files)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => setShowCreateInput({ isFolder: false, parentDir: '' })}
                    className="p-1 hover:bg-brand-accent/10 hover:text-[#5dd62c] text-zinc-400 rounded transition-all cursor-pointer"
                    title="ملف جديد"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setShowCreateInput({ isFolder: true, parentDir: '' })}
                    className="p-1 hover:bg-brand-accent/10 hover:text-[#5dd62c] text-zinc-400 rounded transition-all cursor-pointer"
                    title="مجلد جديد"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setIsConfirmWipeOpen(true)}
                    className="p-1 hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 rounded transition-all cursor-pointer"
                    title="تهيئة ومسح بيئة العمل بالكامل"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Workspace Search Filter */}
              <div className="p-2 border-b border-brand-accent/5">
                <div className="relative flex items-center bg-brand-bg border border-brand-accent/10 focus-within:border-brand-accent/30 rounded-lg px-2 py-1 transition-all">
                  <Search className="w-3 h-3 text-zinc-500 ml-1.5" />
                  <input
                    type="text"
                    placeholder="تصفية الملفات..."
                    value={fileFilter}
                    onChange={(e) => setFileFilter(e.target.value)}
                    className="bg-transparent text-xs text-white placeholder-zinc-600 outline-none w-full"
                  />
                  {fileFilter && (
                    <button onClick={() => setFileFilter('')} className="text-zinc-500 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Create Input (Rootlevel fallback) */}
              {showCreateInput && showCreateInput.parentDir === '' && (
                <div className="p-2 bg-brand-accent/5 border-b border-brand-accent/10 flex items-center gap-1.5 animate__animated animate__fadeIn duration-150">
                  {showCreateInput.isFolder ? <Folder className="w-3.5 h-3.5 text-brand-accent" /> : <FileCode className="w-3.5 h-3.5 text-brand-accent" />}
                  <input
                    autoFocus
                    type="text"
                    placeholder={showCreateInput.isFolder ? "اسم المجلد..." : "اسم الملف..."}
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateItem();
                      if (e.key === 'Escape') setShowCreateInput(null);
                    }}
                    className="bg-transparent text-xs text-white outline-none w-full border-b border-brand-accent/40 py-0.5"
                  />
                  <button onClick={handleCreateItem} className="text-brand-accent hover:text-white p-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setShowCreateInput(null); setCreateName(''); }} className="text-rose-400 hover:text-white p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* File list tree scroll view */}
              <div className="flex-1 overflow-y-auto py-2 space-y-0.5 text-xs font-mono font-medium hide-scrollbar">
                {visibleFilePaths.map((path) => {
                  const item = files[path];
                  if (!item) return null;
                  
                  const parts = path.split('/');
                  const depth = parts.length - 1;
                  const displayName = item.name;
                  const isActive = activeFile === path && !item.isFolder;

                  return (
                    <div key={path} className="flex flex-col">
                      <div
                        onClick={(e) => {
                          if (item.isFolder) {
                            toggleFolder(path, e);
                          } else {
                            setActiveFile(path);
                          }
                        }}
                        style={{ paddingRight: `${Math.max(12, depth * 14 + 12)}px` }}
                        className={`group flex items-center justify-between py-1.5 px-3 cursor-pointer select-none transition-all duration-150 rounded-lg mx-1 ${
                          isActive 
                            ? 'bg-brand-accent/15 text-brand-accent font-black border-r-2 border-brand-accent' 
                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-left w-full min-w-0" dir="ltr">
                          {getFileIcon(path, item.isFolder, item.isOpen)}
                          
                          {renamingPath === path ? (
                            <input
                              autoFocus
                              type="text"
                              value={renameValue}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={handleRenameItem}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameItem();
                                if (e.key === 'Escape') setRenamingPath(null);
                              }}
                              className="bg-zinc-800 text-xs text-white outline-none rounded border border-brand-accent/40 px-1 w-full"
                            />
                          ) : (
                            <span className="truncate text-xs tracking-wide">{displayName}</span>
                          )}
                        </div>

                        {/* File Action Hover buttons */}
                        {renamingPath !== path && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-[#111114]/90 pr-2 shrink-0 transition-opacity duration-100">
                            {item.isFolder && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCreateInput({ isFolder: false, parentDir: path });
                                }}
                                className="p-0.5 hover:text-[#5dd62c]"
                                title="ملف جديد داخل هذا المجلد"
                              >
                                <FilePlus className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingPath(path);
                                setRenameValue(displayName);
                              }}
                              className="p-0.5 hover:text-amber-400"
                              title="إعادة التسمية"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteItem(path, e)}
                              className="p-0.5 hover:text-rose-450"
                              title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Folder-scoped create file helper input */}
                      {showCreateInput && showCreateInput.parentDir === path && (
                        <div 
                          style={{ paddingRight: `${(depth + 1) * 14 + 12}px` }}
                          className="py-1 bg-brand-accent/5 flex items-center gap-1.5 mx-1"
                        >
                          {showCreateInput.isFolder ? <Folder className="w-3 h-3 text-brand-accent" /> : <FileCode className="w-3 h-3 text-brand-accent" />}
                          <input
                            autoFocus
                            type="text"
                            placeholder={showCreateInput.isFolder ? "اسم المجلد..." : "اسم الملف..."}
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateItem();
                              if (e.key === 'Escape') setShowCreateInput(null);
                            }}
                            className="bg-transparent text-xs text-white outline-none w-full border-b border-brand-accent/40 py-0.5 font-mono"
                          />
                          <button onClick={handleCreateItem} className="text-brand-accent hover:text-white p-0.5">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => { setShowCreateInput(null); setCreateName(''); }} className="text-rose-450 hover:text-white p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {visibleFilePaths.length === 0 && (
                  <div className="text-center py-8 text-zinc-650 font-sans text-xs">
                    لم يتم العثور على ملفات متطابقة
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Monaco Editor Container */}
        <div className="flex-1 h-full min-w-0 bg-[#0f0f0f] relative flex flex-col overflow-hidden" dir="ltr">
          <Editor
            height="100%"
            language={getEditorLanguage(activeFile)}
            theme="nexus-cyber-theme"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              fontSize: 14,
              lineHeight: 24,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontFamily: "var(--font-mono)",
              wordWrap: "on",
              padding: { top: 16, bottom: 16 },
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              fontLigatures: true,
            }}
            onMount={handleEditorDidMount}
            loading={
              <div className="absolute inset-0 bg-[#0f0f0f] flex flex-col items-center justify-center text-zinc-500 font-sans">
                <div className="border-2 border-brand-accent border-t-transparent w-6 h-6 rounded-full animate-spin mb-3" />
                <span className="text-xs">جاري تحميل محرك الأكواد المتطور...</span>
              </div>
            }
          />
        </div>
      </div>

      {/* Editor Line Col Footer */}
      <div className="h-8 bg-brand-card border-t border-brand-accent/15 px-4 flex items-center justify-between text-[10px] text-zinc-400 select-none shrink-0 font-mono font-bold" dir="rtl">
        <div className="flex items-center gap-3">
          <span>{linesCount} سطر</span>
          <span>{code.length} حرف</span>
          <span className="text-[9px] bg-brand-accent/10 px-2 py-0.5 rounded text-brand-text font-bold uppercase select-none tracking-wider">{activeFile}</span>
        </div>
        <div className="flex items-center gap-2" dir="ltr">
          <span>LN: {currentLine}</span>
          <span>COL: {currentCol}</span>
        </div>
      </div>

      {/* Modern Arabic Compiler Documentation & Template Modal */}
      {isArabicHelpOpen && (
        <div className="absolute inset-0 bg-[#070709]/95 z-30 flex flex-col p-6 overflow-y-auto" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-accent/15 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-accent animate-pulse" />
              <h2 className="text-sm font-black text-brand-text font-sans">البرمجة باللغة العربية الفصحى 🌟</h2>
            </div>
            <button 
              onClick={() => setIsArabicHelpOpen(false)}
              className="p-1 hover:bg-brand-accent/10 text-zinc-400 hover:text-brand-accent rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div className="text-xs text-zinc-300 leading-relaxed mb-6 space-y-2 select-none font-sans">
            <p>
              أهلاً بك في <strong>NEXUS ARABIC</strong>! لقد قمنا بابتكار مترجم (Transpiler) فوري فخم مدمج في محرر الأكواد يترجم الكلمات والوسوم وحالات React العربية إلى رموز برمجية قياسية تعمل على المتصفح والـ DOM فوراً!
            </p>
            <p>
              اكتب الكود باللغة العربية بالكامل، وراقب المعاينة المتفاعلة تظهر بشكل حي في الجانب المقابل!
            </p>
          </div>

          {/* Quick Loading Templates */}
          <div className="mb-6 font-sans">
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
  </تنسيق>
</رأس-مستند>
<جسم>
  <حاوية فئة="max-w-xl mx-auto mt-20 p-8 rounded-3xl bg-[#1c1917]/70 border border-[#44403c] text-center shadow-2xl">
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
          <div className="flex-1 min-h-0 overflow-y-auto border border-brand-accent/15 rounded-xl bg-brand-card/30 p-4 font-sans">
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
                  <tbody className="divide-y divide-zinc-800/65 text-zinc-300">
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;حاوية&gt;</td><td className="py-2 px-3 font-mono">&lt;div&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;عنوان1&gt; ... &lt;عنوان3&gt;</td><td className="py-2 px-3 font-mono">&lt;h1&gt; ... &lt;h3&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;فقرة&gt;</td><td className="py-2 px-3 font-mono">&lt;p&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;رابط&gt;</td><td className="py-2 px-3 font-mono">&lt;a&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;زر&gt;</td><td className="py-2 px-3 font-mono">&lt;button&gt;</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">&lt;صورة&gt;</td><td className="py-2 px-3 font-mono">&lt;img&gt;</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table className="w-full text-right my-2">
                  <thead>
                    <tr className="border-b border-brand-accent/15 text-zinc-400 bg-brand-card/40 text-[10px]">
                      <th className="py-2 px-3 font-extrabold">السمة/الكلمة العربية</th>
                      <th className="py-2 px-3 font-extrabold">المقابل القياسي (JS/React)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/65 text-zinc-300">
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">استخدم_حالة</td><td className="py-2 px-3 font-mono">useState</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">استخدم_تأثير</td><td className="py-2 px-3 font-mono">useEffect</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">ثابت / متغير</td><td className="py-2 px-3 font-mono">const / let</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">دالة / إرجاع</td><td className="py-2 px-3 font-mono">function / return</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">مكون / تصدير / افتراضي</td><td className="py-2 px-3 font-mono">Component / export / default</td></tr>
                    <tr><td className="py-2 px-3 text-brand-accent font-mono">الحدث / فئة / لغة / اتجاه</td><td className="py-2 px-3 font-mono">onClick / className / lang / dir</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Deletion Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmPath && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmPath(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-sm bg-[#121215] border border-red-500/30 rounded-2xl p-6 shadow-[0_20px_50px_rgba(239,68,68,0.15)] overflow-hidden text-right"
              dir="rtl"
            >
              {/* Top Warning Icon Accent */}
              <div className="mx-auto w-12 h-12 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>

              {/* Header */}
              <h3 className="text-sm font-black text-white mb-2 text-center">
                تأكيد حذف الملف نهائياً ⚠️
              </h3>
              
              {/* Description */}
              <p className="text-xs text-zinc-400 leading-relaxed text-center mb-6">
                هل أنت متأكد تماماً من رغبتك في حذف <span className="font-bold font-mono text-red-400">"{deleteConfirmPath}"</span> بشكل نهائي وكل محتوياته؟ لا يمكن التراجع عن هذا الإجراء أبداً.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmPath(null)}
                  className="flex-1 py-2 px-4 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-850 hover:text-white transition-all cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 px-4 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl text-xs font-black hover:bg-red-500/35 hover:text-red-300 transition-all cursor-pointer shadow-[0_4px_15px_rgba(239,68,68,0.2)]"
                >
                  نعم، احذف 🗑️
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Wipe Confirmation Modal */}
      <AnimatePresence>
        {isConfirmWipeOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmWipeOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-sm bg-[#121215] border border-amber-500/30 rounded-2xl p-6 shadow-[0_20px_50px_rgba(245,158,11,0.15)] overflow-hidden text-right"
              dir="rtl"
            >
              <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 animate-bounce" />
              </div>

              <h3 className="text-sm font-black text-white mb-2 text-center">
                إعادة تهيئة بيئة العمل ⚠️
              </h3>
              
              <p className="text-xs text-zinc-400 leading-relaxed text-center mb-6">
                هل أنت متأكد تماماً من رغبتك في <span className="font-bold text-amber-400">مسح وتفريغ كافة ملفات المجلد</span> والبدء من الصفر تماماً؟ لا يمكن التراجع عن هذا الإجراء أبداً.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirmWipeOpen(false)}
                  className="flex-1 py-2 px-4 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-850 hover:text-white transition-all cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  onClick={() => {
                    setFiles({});
                    setActiveFile("");
                    setIsConfirmWipeOpen(false);
                  }}
                  className="flex-1 py-2 px-4 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl text-xs font-black hover:bg-amber-500/35 hover:text-amber-300 transition-all cursor-pointer shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
                >
                  نعم، مسح الكل 🧹
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
