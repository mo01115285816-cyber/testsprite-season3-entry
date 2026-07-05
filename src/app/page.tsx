'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
 Sparkles, ChevronDown, Check, Copy, Bot, Code2, Play, Upload, Download,
 FileText, FileCode, FileJson, Printer, Layers, FileCode2, FileArchive, Activity, TerminalSquare, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { isZipBytes, extractZipArchive, ancestors, type StoredFile } from '../lib/zip';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Imported Shared Utilities
import { isReactCode, getClientSideDiagnostics, preprocessReactCode, preprocessArabicCode, DiagnosticIssue } from '../lib/diagnostics';
import { parseInlineStyles, serializeInlineStyles } from '../lib/styles';

// Imported Modular Components
import LinterPanel from '../components/LinterPanel';
import LivePreview from '../components/LivePreview';
import ChatAgent from '../components/ChatAgent';
import IconHelperModal from '../components/IconHelperModal';
import InspectPanel, { SelectedElement } from '../components/InspectPanel';
import CodeEditor, { WorkspaceFile, WorkspaceFiles } from '../components/CodeEditor';
import { CompressModal } from '../components/CompressModal';
import LoopDashboard from '../components/LoopDashboard';
import TestRunnerPanel from '../components/TestRunnerPanel';

// Workspace Database Client using HTML5 native IndexedDB with absolute safety constraints
class WorkspaceDB {
 private dbName = "nexus_workspace_db";
 private storeName = "files";
 private version = 1;

 private getDB(): Promise<IDBDatabase> {
 return new Promise((resolve, reject) => {
 const request = indexedDB.open(this.dbName, this.version);
 request.onerror = () => reject(request.error);
 request.onsuccess = () => resolve(request.result);
 request.onupgradeneeded = (e: any) => {
 const db = e.target.result;
 if (!db.objectStoreNames.contains(this.storeName)) {
 db.createObjectStore(this.storeName);
 }
 };
 });
 }

 async saveFiles(files: WorkspaceFiles): Promise<void> {
 const db = await this.getDB();
 return new Promise((resolve, reject) => {
 const transaction = db.transaction(this.storeName, "readwrite");
 const store = transaction.objectStore(this.storeName);
 const request = store.put(files, "workspace_files");
 request.onsuccess = () => resolve();
 request.onerror = () => reject(request.error);
 });
 }

 async loadFiles(): Promise<WorkspaceFiles | null> {
 const db = await this.getDB();
 return new Promise((resolve, reject) => {
 const transaction = db.transaction(this.storeName, "readonly");
 const store = transaction.objectStore(this.storeName);
 const request = store.get("workspace_files");
 request.onsuccess = () => resolve(request.result || null);
 request.onerror = () => reject(request.error);
 });
 }

 async saveActiveFile(path: string): Promise<void> {
 const db = await this.getDB();
 return new Promise((resolve, reject) => {
 const transaction = db.transaction(this.storeName, "readwrite");
 const store = transaction.objectStore(this.storeName);
 const request = store.put(path, "active_file_path");
 request.onsuccess = () => resolve();
 request.onerror = () => reject(request.error);
 });
 }

 async loadActiveFile(): Promise<string | null> {
 const db = await this.getDB();
 return new Promise((resolve, reject) => {
 const transaction = db.transaction(this.storeName, "readonly");
 const store = transaction.objectStore(this.storeName);
 const request = store.get("active_file_path");
 request.onsuccess = () => resolve(request.result || null);
 request.onerror = () => reject(request.error);
 });
 }

 async clearFiles(): Promise<void> {
 const db = await this.getDB();
 return new Promise((resolve, reject) => {
 const transaction = db.transaction(this.storeName, "readwrite");
 const store = transaction.objectStore(this.storeName);
 store.delete("workspace_files");
 store.delete("active_file_path");
 transaction.oncomplete = () => resolve();
 transaction.onerror = () => reject(transaction.error);
 });
 }
}

// Beautiful standard seedling files mapping matching professional dark-cyber aesthetics
const DEFAULT_FILES: WorkspaceFiles = {
 "index.html": {
 name: "index.html",
 content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>مشروع NEXUS الجديد</title>
 <link rel="stylesheet" href="style.css">
</head>
<body>
 <div class="container animate__animated animate__fadeIn">
 <div class="card">
 <h1>مرحباً بك في بيئة NEXUS IDE الاحترافية! 🚀</h1>
 <p>هذا نظام ملفات افتراضي متكامل ومحرر Monaco متطور يدعم معاينتك البرمجية فوراً.</p>
 <button onclick="showAlert()">اضغط للتجربة</button>
 </div>
 </div>
 <script src="script.js"></script>
</body>
</html>`,
 isFolder: false
 },
 "style.css": {
 name: "style.css",
 content: `body {
 font-family: system-ui, -apple-system, sans-serif;
 background: radial-gradient(circle, #0e1712 0%, #030705 100%);
 color: #e2e8f0;
 display: flex;
 align-items: center;
 justify-content: center;
 height: 100vh;
 margin: 0;
}
.container {
 max-width: 500px;
 width: 90%;
}
.card {
 background: rgba(30, 41, 59, 0.4);
 backdrop-filter: blur(12px);
 border: 1px solid rgba(93, 214, 44, 0.2);
 border-radius: 24px;
 padding: 3rem 2rem;
 text-align: center;
 box-shadow: none;
}
h1 {
 font-size: 1.8rem;
 color: #5dd62c;
 margin-top: 0;
 margin-bottom: 1rem;
 text-shadow: none;
}
p {
 color: #94a3b8;
 line-height: 1.7;
 margin-bottom: 2rem;
}
button {
 background: #5dd62c;
 color: #030705;
 border: none;
 padding: 0.85rem 2.5rem;
 border-radius: 9999px;
 font-size: 0.95rem;
 font-weight: 800;
 cursor: pointer;
 box-shadow: none;
 transition: all 0.3s ease;
}
button:hover {
 background: #76e048;
 box-shadow: none;
 transform: translateY(-2px);
}`,
 isFolder: false
 },
 "script.js": {
 name: "script.js",
 content: `function showAlert() {
 alert("مرحباً بك! الكود يعمل ويتم استيراد الملفات الخارجية بنجاح باهر!");
}`,
 isFolder: false
 },
 "README.md": {
 name: "README.md",
 content: `# NEXUS IDE 💻

مرحباً بك في بيئة التطوير المتكاملة الذكية! 

## المميزات الجديدة:
1. **محرر Monaco المتكامل**: نفس المحرك المستخدم في VS Code لدعم التلوين الذكي وتصحيح الأخطاء.
2. **نظام الملفات الافتراضي (VFS)**: يدعم إنشاء ملفات ومجلدات متعددة وحذفها وإعادة تسميتها وحفظها تلقائياً.
3. **مترجم وباني المواقع المدمج**: يربط تلقائياً بين ملفات HTML و CSS و JavaScript ويترجم الأكواد العربية.
4. **الوضع التفاعلي**: معاينة فورية وعالية السرعة.
`,
 isFolder: false
 },
 "src": {
 name: "src",
 content: "",
 isFolder: true,
 isOpen: true
 },
 "src/App.tsx": {
 name: "App.tsx",
 content: `// كود متفاعل بلغة React بالكامل!
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

تصدير افتراضي مكون تطبيق_معاينة;`,
 isFolder: false
 }
};

export default function HTMLPreviewApp() {
 const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'agent'>('editor');
 const [isFormatting, setIsFormatting] = useState(false);
 const [isDragging, setIsDragging] = useState(false);
 const [isConfirmingClear, setIsConfirmingClear] = useState(false);
 
 // Real-time Linting & Diagnostics States
 const [isDeepLinting, setIsDeepLinting] = useState(false);
 const [deepLintSummary, setDeepLintSummary] = useState<string | null>(null);
 const [isLintPanelOpen, setIsLintPanelOpen] = useState(false);
 const [activeLintTab, setActiveLintTab] = useState<'realtime' | 'deep'>('realtime');
 const [deepIssues, setDeepIssues] = useState<any[]>([]);

 // Icon Helper Library States
 const [isIconModalOpen, setIsIconModalOpen] = useState(false);
 
 // Custom High Performance Editor States
 const [currentLine, setCurrentLine] = useState<number>(1);
 const [currentCol, setCurrentCol] = useState<number>(1);
 const [editorScrollTop, setEditorScrollTop] = useState<number>(0);
 const [editorHeight, setEditorHeight] = useState<number>(600);
 const textareaRef = useRef<HTMLTextAreaElement>(null);
 const sidebarRef = useRef<HTMLDivElement>(null);
 
 // Inspect Element States
 const [inspectModeActive, setInspectModeActive] = useState(false);
 const [previewSize, setPreviewSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
 const [isCSSCopied, setIsCSSCopied] = useState(false);
 const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
 
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const [isCopied, setIsCopied] = useState(false);
 const [isCompressModalOpen, setIsCompressModalOpen] = useState(false);
 const [isLoopDashboardOpen, setIsLoopDashboardOpen] = useState(false);
 const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
 const menuRef = useRef<HTMLDivElement>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [isMounted, setIsMounted] = useState(false);

 // Resize observer to auto fit device preview without overflow on mobile devices
 const containerRef = useRef<HTMLDivElement>(null);
 const [containerWidth, setContainerWidth] = useState<number>(1000);

 // Simulated live clock for device mockups
 const [simulatedTime, setSimulatedTime] = useState('11:00');

 // Agent State
 const [chatInput, setChatInput] = useState('');
 const [isAgentThinking, setIsAgentThinking] = useState(false);
 const [agentStatus, setAgentStatus] = useState('');
 const [dynamicSteps, setDynamicSteps] = useState<string[] | null>(null);
 const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
 const [completedStepIndices, setCompletedStepIndices] = useState<number[]>([]);
 const [agentModels, setAgentModels] = useState<Record<string, string>>({});
 const [messages, setMessages] = useState<{id: string, role: 'user' | 'agent', content: string, isGreeting?: boolean}[]>([]);
 const chatScrollRef = useRef<HTMLDivElement>(null);
 const [isFullStack, setIsFullStack] = useState(false);

 // Virtual File System State
 const [files, setFiles] = useState<WorkspaceFiles>({});
 const [activeFile, setActiveFile] = useState<string>("index.html");

 // Dynamic code getter & setter linked directly with VFS active file
 const code = useMemo(() => {
 return files[activeFile]?.content || "";
 }, [files, activeFile]);

 const setCode = (newCode: string) => {
 setFiles(prev => {
 const activeItem = prev[activeFile];
 if (!activeItem || activeItem.isFolder) return prev;
 return {
 ...prev,
 [activeFile]: {
 ...activeItem,
 content: newCode
 }
 };
 });
 };

 // Load files from IndexedDB or migrate from LocalStorage legacy content
 useEffect(() => {
 setIsMounted(true);
 
 async function initWorkspace() {
 if (typeof window === 'undefined') return;
 
 try {
 const db = new WorkspaceDB();
 const loadedFiles = await db.loadFiles();
 const loadedActive = await db.loadActiveFile();
 
 if (loadedFiles && Object.keys(loadedFiles).length > 0) {
 setFiles(loadedFiles);
 if (loadedActive && loadedFiles[loadedActive]) {
 setActiveFile(loadedActive);
 } else {
 const firstFile = Object.keys(loadedFiles).find(k => !loadedFiles[k].isFolder);
 setActiveFile(firstFile || "");
 }
 } else {
 // Check if user explicitly cleared the workspace
 const wasCleared = localStorage.getItem('nexus_workspace_cleared');
 if (wasCleared === 'true') {
 // User cleared — start with empty workspace
 setFiles({});
 setActiveFile("");
 } else {
 // First visit — seed default files
 let initialFiles = { ...DEFAULT_FILES };
 setFiles(initialFiles);
 setActiveFile("index.html");
 await db.saveFiles(initialFiles);
 await db.saveActiveFile("index.html");
 }
 }
 } catch (err) {
 console.error("Failed to initialize IndexedDB workspace, using localStorage fallback:", err);
 try {
 const fallbackStore = localStorage.getItem('nexus_vfs_files');
 if (fallbackStore) {
 const parsed = JSON.parse(fallbackStore);
 if (parsed && Object.keys(parsed).length > 0) {
 setFiles(parsed);
 const firstFile = Object.keys(parsed).find(k => !parsed[k].isFolder);
 setActiveFile(firstFile || "");
 } else {
 setFiles({});
 setActiveFile("");
 }
 } else {
 const wasCleared = localStorage.getItem('nexus_workspace_cleared');
 if (wasCleared === 'true') {
 setFiles({});
 setActiveFile("");
 } else {
 setFiles({ ...DEFAULT_FILES });
 setActiveFile("index.html");
 localStorage.setItem('nexus_vfs_files', JSON.stringify(DEFAULT_FILES));
 }
 }
 } catch (_) {
 setFiles({});
 setActiveFile("");
 }
 }
 }
 
 initWorkspace();
 }, []);

 // Sync VFS changes back to database asynchronously with debounced layout flow
 useEffect(() => {
 if (!isMounted || Object.keys(files).length === 0) return;
 
 const saveTimeout = setTimeout(async () => {
 try {
 const db = new WorkspaceDB();
 await db.saveFiles(files);
 await db.saveActiveFile(activeFile);
 } catch (err) {
 console.error("Failed to save files, using localStorage fallback:", err);
 try {
 localStorage.setItem('nexus_vfs_files', JSON.stringify(files));
 localStorage.setItem('nexus_vfs_active', activeFile);
 } catch (_) {}
 }
 }, 400);

 return () => clearTimeout(saveTimeout);
 }, [files, activeFile, isMounted]);

 useEffect(() => {
 const handleResize = () => {
 if (containerRef.current) {
 setContainerWidth(containerRef.current.clientWidth || 1000);
 }
 };
 window.addEventListener('resize', handleResize);
 handleResize();
 return () => window.removeEventListener('resize', handleResize);
 }, []);

 useEffect(() => {
 const timer = setInterval(() => {
 const now = new Date();
 const hh = String(now.getHours()).padStart(2, '0');
 const mm = String(now.getMinutes()).padStart(2, '0');
 setSimulatedTime(`${hh}:${mm}`);
 }, 5000);

 const now = new Date();
 setSimulatedTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);

 return () => clearInterval(timer);
 }, []);

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
 setIsMenuOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 useEffect(() => {
 if (chatScrollRef.current && activeTab === 'agent') {
 chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
 }
 }, [messages, agentStatus, activeTab]);

 useEffect(() => {
 const handleMessage = (e: MessageEvent) => {
 if (e.data && e.data.type === 'ELEMENT_CLICKED') {
 setSelectedElement({
 tagName: e.data.tagName,
 id: e.data.id,
 classes: e.data.classes,
 styleAttr: e.data.styleAttr,
 innerText: e.data.innerText,
 styles: e.data.styles,
 path: e.data.path ? e.data.path.map(Number) : [],
 });
 }
 };
 window.addEventListener('message', handleMessage);
 return () => window.removeEventListener('message', handleMessage);
 }, []);

 useEffect(() => {
 if (activeTab === 'editor' && textareaRef.current) {
 setEditorHeight(textareaRef.current.clientHeight || 600);
 }
 }, [activeTab]);

 const isReactActive = useMemo(() => {
 return isReactCode(code);
 }, [code]);

 // Real-time Linting calculation
 const lintIssues: DiagnosticIssue[] = useMemo(() => {
 return getClientSideDiagnostics(code, isReactActive);
 }, [code, isReactActive]);

 const handleDownload = (format: 'code' | 'md' = 'code') => {
 const trimmed = (code || '').trim();
 let filename = 'index.html';
 let mimeType = 'text/html;charset=utf-8';
 let finalCode = code;

 if (format === 'code') {
 // Original auto detection logic
 let autoMime = 'text/html;charset=utf-8';
 let autoFilename = 'index.html';

 if (!trimmed) {
 autoFilename = 'code.txt';
 autoMime = 'text/plain;charset=utf-8';
 } else {
 const isJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
 let parsesAsJson = false;
 if (isJson) {
 try {
 JSON.parse(trimmed);
 parsesAsJson = true;
 } catch (_) {}
 }

 if (parsesAsJson) {
 autoFilename = 'data.json';
 autoMime = 'application/json;charset=utf-8';
 } else {
 const lower = trimmed.toLowerCase();
 const hasHtmlTag = lower.includes('<!doctype html') || lower.includes('<html') || lower.includes('<body') || lower.includes('</head>');
 const hasHtmlStructure = lower.startsWith('<div') || lower.startsWith('<span') || lower.startsWith('<section') || lower.startsWith('<p') || lower.startsWith('<button');
 const hasReactKeywords = lower.includes('usestate') || lower.includes('useeffect') || lower.includes('import {') || lower.includes('export default function') || lower.includes('classname=') || lower.includes('useref') || lower.includes('import react');

 if (lower.startsWith('<svg') || (lower.includes('<svg') && !lower.includes('<html'))) {
 autoFilename = 'image.svg';
 autoMime = 'image/svg+xml;charset=utf-8';
 } else if (hasReactKeywords || lower.includes('reactdom.') || lower.includes('from \'react\'') || lower.includes('from "react"')) {
 autoFilename = 'App.tsx';
 autoMime = 'text/typescript;charset=utf-8';
 } else if (trimmed.includes('{') && trimmed.includes('}') && (trimmed.includes('background') || trimmed.includes('color:') || trimmed.includes('margin:') || trimmed.includes('padding:') || trimmed.includes('@media')) && !trimmed.includes('<') && !trimmed.includes('function') && !trimmed.includes('const ') && !trimmed.includes('let ')) {
 autoFilename = 'style.css';
 autoMime = 'text/css;charset=utf-8';
 } else if ((trimmed.includes('def ') || trimmed.includes('import ') || trimmed.includes('print(')) && !trimmed.includes('<') && !trimmed.includes('const ') && !trimmed.includes('function ')) {
 autoFilename = 'script.py';
 autoMime = 'text/x-python;charset=utf-8';
 } else if (trimmed.includes('function ') || trimmed.includes('const ') || trimmed.includes('let ') || trimmed.includes('var ') || trimmed.includes('console.log')) {
 const isTypescript = trimmed.includes(': string') || trimmed.includes(': number') || trimmed.includes(': any') || trimmed.includes('interface ') || trimmed.includes('type ');
 autoFilename = isTypescript ? 'script.ts' : 'script.js';
 autoMime = isTypescript ? 'text/typescript;charset=utf-8' : 'application/javascript;charset=utf-8';
 } else if (hasHtmlTag || hasHtmlStructure) {
 autoFilename = 'index.html';
 autoMime = 'text/html;charset=utf-8';
 } else {
 autoFilename = 'code.txt';
 autoMime = 'text/plain;charset=utf-8';
 }
 }
 }

 filename = autoFilename;
 mimeType = autoMime;
 } else if (format === 'md') {
 filename = 'README.md';
 mimeType = 'text/markdown;charset=utf-8';
 
 // Smart Markdown checks
 const isAlreadyMarkdown = trimmed.startsWith('#') || trimmed.includes('\n# ') || trimmed.includes('\n## ');
 if (isAlreadyMarkdown) {
 finalCode = code;
 } else {
 // Detect programming language for code blocks
 const lowerCode = trimmed.toLowerCase();
 let lang = 'html';
 if (lowerCode.includes('usestate') || lowerCode.includes('import {') || lowerCode.includes('export default')) {
 lang = 'tsx';
 } else if (lowerCode.includes('def ') || lowerCode.includes('print(')) {
 lang = 'python';
 } else if (lowerCode.includes('console.log') || lowerCode.includes('let ') || lowerCode.includes('const ')) {
 lang = 'javascript';
 } else if (lowerCode.includes('{') && lowerCode.includes('}') && (lowerCode.includes('background') || lowerCode.includes('color:'))) {
 lang = 'css';
 } else if (lowerCode.startsWith('<svg')) {
 lang = 'xml';
 } else if (lowerCode.startsWith('{') || lowerCode.startsWith('[')) {
 lang = 'json';
 }

 const now = new Date();
 const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
 const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

 finalCode = `# 💻 الكود المصدري والمستندات التقنية

مرحباً بك! تم تصدير هذا الملف البرمجي وتوثيقه باحترافية من المساعد الذكي وبيئة العمل التفاعلية.

## 📊 معلومات الملف والتصدير
- **تاريخ التصدير**: ${dateStr}
- **الوقت المعياري**: ${timeStr}
- **لغة المصدر المكتشفة**: \`${lang.toUpperCase()}\`
- **حجم الملف المصدري**: ${(new Blob([code]).size / 1024).toFixed(2)} كيلوبايت

---

## 🚀 الكود المصدري الكامل (\`${lang === 'tsx' ? 'App.tsx' : lang === 'python' ? 'script.py' : lang === 'json' ? 'data.json' : lang === 'css' ? 'style.css' : 'index.html'}\`)

يمكنك استخدام الكود المباشر أدناه في مشروعك أو بيئة التطوير الخاصة بك:

\`\`\`${lang}
${code}
\`\`\`

---

## 🛠️ تفاصيل التشغيل الموصى بها
${lang === 'html' ? `
1. احفظ المحتوى كملف باسم \`index.html\`.
2. انقر نقرًا مزدوجًا على الملف لفتحه في أي متصفح ويب (مثل Chrome، Safari، أو Edge).
3. يتضمن الكود الأنماط (CSS) والتفاعلية المطلوبة للمعاينة المباشرة المتميزة.
` : lang === 'tsx' ? `
1. احفظ الكود باسم \`App.tsx\` أو داخل مشروع React المفضل لديك.
2. تأكد من توفر المكتبات المعتمدة مثل \`lucide-react\` أو \`motion/react\` أو غيرها.
3. قم بتشغيل خادم التطوير للاستفادة من واجهات ريأكت المتكاملة.
` : `
1. شغّل الكود باستخدام المترجم أو المفسر الخاص بلغة \`${lang.toUpperCase()}\`.
2. تأكد من تلبية جميع متطلبات وتبعيات الملف البرمجي المنفذ.
`}

---

*شكراً لاستخدامك منصتنا الذكية لإنشاء وتطوير الواجهات البرمجية والتطبيقات! ✨*
`;
 }
 }

 const blob = new Blob([finalCode], { type: mimeType });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = filename;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 setIsMenuOpen(false);
 };

 const handleCopy = () => {
 navigator.clipboard.writeText(code);
 setIsCopied(true);
 setTimeout(() => setIsCopied(false), 2000);
 };

 const handleCopyCSS = () => {
 if (!selectedElement) return;
 const selector = selectedElement.id 
 ? `#${selectedElement.id}` 
 : selectedElement.classes 
 ? `.${selectedElement.classes.split(' ')[0]}` 
 : selectedElement.tagName;
 
 const currentStyles = parseInlineStyles(selectedElement.styleAttr || '');
 const formattedLines = Object.entries(currentStyles)
 .map(([k, v]) => ` ${k}: ${v};`)
 .join('\n');
 
 const selectorStyle = `/* التنسيقات المعدلة للعنصر <${selectedElement.tagName}> */\n${selector} {\n${formattedLines}\n}`;
 navigator.clipboard.writeText(selectorStyle);
 setIsCSSCopied(true);
 setTimeout(() => setIsCSSCopied(false), 1500);
 };

 const triggerFileInput = () => {
 if (fileInputRef.current) fileInputRef.current.click();
 };

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files;
 if (files && files.length > 0) {
 const file = files[0];
 handleFileDrop(file);
 }
 };

 const handleFileDrop = async (file: File) => {
    const buffer = new Uint8Array(await file.arrayBuffer());

    // Detect ZIP by magic bytes (not extension)
    if (isZipBytes(buffer)) {
      try {
        const outcome = await extractZipArchive(buffer);
        const newFiles: WorkspaceFiles = {};
        const folderPaths = new Set<string>();
        let firstFile = '';

        for (const stored of outcome.files) {
          newFiles[stored.path] = {
            name: stored.name,
            content: stored.content,
            isFolder: false
          };
          if (!firstFile) firstFile = stored.path;
          for (const ancestor of ancestors(stored.path)) {
            folderPaths.add(ancestor);
          }
        }

        folderPaths.forEach(folderPath => {
          const parts = folderPath.split('/');
          newFiles[folderPath] = {
            name: parts[parts.length - 1],
            content: '',
            isFolder: true,
            isOpen: true
          };
        });

        setFiles(newFiles);
        if (firstFile) {
          setActiveFile(firstFile);
          setActiveTab('editor');
        }

        try {
          const db = new WorkspaceDB();
          await db.saveFiles(newFiles);
          await db.saveActiveFile(firstFile);
        } catch (e) {}
      } catch (err: any) {
        alert(err?.message || 'تعذّر فك ضغط الملف.');
      }
      return;
    }

    // Regular file
    const name = file.name;
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    setFiles(prev => ({
      ...prev,
      [name]: {
        name,
        content: decoded,
        isFolder: false
      }
    }));
    setActiveFile(name);
    setActiveTab('editor');
  };

  const handleDownloadZip = async () => {
 const zip = new JSZip();
 
 // Get project name from files
 const paths = Object.keys(files);
 let projectName = 'nexus-project';
 const rootFolders = new Set<string>();
 paths.forEach(p => {
 const parts = p.split('/');
 if (parts.length > 1) {
 rootFolders.add(parts[0]);
 }
 });
 if (rootFolders.size > 0) {
 projectName = Array.from(rootFolders)[0];
 }
 
 // Package all files inside our VFS into a single structured ZIP archive
 Object.entries(files).forEach(([path, file]) => {
 if (!file.isFolder) {
 zip.file(path, file.content);
 }
 });
 
 try {
 const content = await zip.generateAsync({ type: 'blob' });
 saveAs(content, `${projectName}.zip`);
 } catch (err) {
 alert('عذراً، فشلت عملية ضغط وتصدير المشروع كملف ZIP.');
 }
 setIsMenuOpen(false);
 };

 // Clear entire workspace — deletes from IndexedDB + localStorage permanently
 const handleClearWorkspace = async () => {
 if (!confirm('هل أنت متأكد من حذف جميع الملفات؟ لا يمكن التراجع عن هذا الإجراء.')) return;
 
 try {
 const db = new WorkspaceDB();
 await db.clearFiles();
 } catch (e) {
 console.error('Failed to clear IndexedDB:', e);
 }
 
 // Clear localStorage keys
 localStorage.removeItem('nexus_vfs_files');
 localStorage.removeItem('nexus_vfs_active');
 localStorage.removeItem('html_preview_code');
 // Mark as explicitly cleared so init doesn't re-seed defaults
 localStorage.setItem('nexus_workspace_cleared', 'true');
 
 // Reset state
 setFiles({});
 setActiveFile("");
 setCode("");
 setIsMenuOpen(false);
 };

 const formatCode = async () => {
 if (!code) return;
 setIsFormatting(true);
 try {
 const response = await fetch('/api/format', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ code })
 });
 const data = await response.json();
 if (data.formatted) {
 setCode(data.formatted);
 } else {
 alert(data.error || 'فشلت عملية تنسيق الكود.');
 }
 } catch (err) {
 alert("حدث خطأ فني أثناء الاتصال بخدمة التنسيق.");
 } finally {
 setIsFormatting(false);
 }
 };

 const runDeepLint = async () => {
 if (!code.trim()) return;
 setIsDeepLinting(true);
 setDeepIssues([]);
 setDeepLintSummary(null);
 setIsLintPanelOpen(true);
 setActiveLintTab('deep');
 try {
 const response = await fetch('/api/lint', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ code, isReact: isReactActive })
 });
 const data = await response.json();
 if (data.issues) {
 setDeepIssues(data.issues);
 const errs = data.issues.filter((i: any) => i.type === 'error').length;
 const warns = data.issues.filter((i: any) => i.type === 'warning').length;
 setDeepLintSummary(`أكمل الـ AI مراجعة الكود بنجاح: تم رصد ${errs} أخطاء و ${warns} تنبيهات.`);
 } else {
 alert(data.error || 'فشلت عملية فحص الذكاء الاصطناعي المعمق');
 }
 } catch (err) {
 alert('حدث خطأ فني أثناء الاتصال بالخادم للتدقيق البرمجي.');
 } finally {
 setIsDeepLinting(false);
 }
 };

 const applyQuickFix = (targetText: string, replacementText: string) => {
 if (!targetText) return;
 if (!code.includes(targetText)) {
 alert("عذراً، لم يتم العثور على الجزء المراد إصلاحه في طيات الكود الحالي (قد يكون قد تم تعديله بالفعل).");
 return;
 }
 setCode(code.replace(targetText, replacementText));
 };

 const handleSendAgentPrompt = async () => {
 if (!chatInput.trim() || isAgentThinking) return;
 const prompt = chatInput.trim();
 setChatInput('');
 setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: prompt }]);
 setIsAgentThinking(true);
 setAgentStatus("");
 setDynamicSteps(null);
 setActiveStepIndex(null);
 setCompletedStepIndices([]);
 setAgentModels({});

 try {
 const res = await fetch('/api/agent', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ code, prompt, isFullStack })
 });
 
 if (!res.body) throw new Error("No response body");
 const reader = res.body.getReader();
 const decoder = new TextDecoder("utf-8");
 let incompleteChunk = "";
 
 while (true) {
 const { value, done } = await reader.read();
 if (done) break;
 
 incompleteChunk += decoder.decode(value, { stream: true });
 const lines = incompleteChunk.split('\n\n');
 incompleteChunk = lines.pop() || "";
 
 for (const line of lines) {
 if (line.startsWith('data: ')) {
 const dataStr = line.substring(6);
 try {
 const data = JSON.parse(dataStr);
 if (data.type === 'status') {
 setAgentStatus(data.message);
 } else if (data.type === 'steps_init') {
 setDynamicSteps(data.steps);
 setActiveStepIndex(0);
 } else if (data.type === 'step_active') {
 setActiveStepIndex(data.index);
 } else if (data.type === 'step_complete') {
 setCompletedStepIndices(prev => prev.includes(data.index) ? prev : [...prev, data.index]);
 } else if (data.type === 'stream_code') {
 // لو مفيش ملف نشط، أنشئ ملف تلقائياً وحط الكود فيه
 if (!activeFile || !files[activeFile] || files[activeFile].isFolder) {
 const newFileName = `code_${Date.now()}.html`;
 setFiles(prev => ({
 ...prev,
 [newFileName]: {
 name: newFileName,
 content: data.code,
 isFolder: false
 }
 }));
 setActiveFile(newFileName);
 } else {
 setCode(data.code);
 }
 } else if (data.type === 'stream_full_text') {
 const fullText = data.text;
 const filesFound: Record<string, string> = {};
 const regex = /<FILE\s+path=["']([^"']+)["']\s*>([\s\S]*?)(?:<\/FILE>|$)/g;
 let match;
 let lastActiveFilePath = "";
 while ((match = regex.exec(fullText)) !== null) {
 const filePath = match[1];
 let content = match[2];
 content = content.replace(/^```[a-z]*\n/i, "").replace(/```$/i, "").trimEnd();
 filesFound[filePath] = content;
 lastActiveFilePath = filePath;
 }
 
 if (Object.keys(filesFound).length > 0) {
 setFiles(prev => {
 const updated = { ...prev };
 let hasChanged = false;
 
 Object.entries(filesFound).forEach(([path, content]) => {
 if (!updated[path] || updated[path].content !== content) {
 const parts = path.split('/');
 let currentPath = "";
 for (let i = 0; i < parts.length - 1; i++) {
 currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
 if (!updated[currentPath]) {
 updated[currentPath] = {
 name: parts[i],
 content: "",
 isFolder: true,
 isOpen: true
 };
 hasChanged = true;
 }
 }
 
 updated[path] = {
 name: parts[parts.length - 1],
 content: content,
 isFolder: false
 };
 hasChanged = true;
 }
 });
 
 return hasChanged ? updated : prev;
 });
 
 if (lastActiveFilePath) {
 setActiveFile(lastActiveFilePath);
 setActiveTab('editor');
 }
 }
 } else if (data.type === 'model_info') {
 setAgentModels(prev => ({ ...prev, [data.agent]: data.model }));
 } else if (data.type === 'final') {
 if (data.code) {
 if (!activeFile || !files[activeFile] || files[activeFile].isFolder) {
 const newFileName = `result_${Date.now()}.html`;
 setFiles(prev => ({
 ...prev,
 [newFileName]: {
 name: newFileName,
 content: data.code,
 isFolder: false
 }
 }));
 setActiveFile(newFileName);
 } else {
 setCode(data.code);
 }
 }
 setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: data.message }]);
 setIsAgentThinking(false);
 } else if (data.type === 'error') {
 setChatInput(prompt);
 setMessages(prev => [...prev, {
 id: `err-${Date.now()}`,
 role: 'agent',
 content: `حدث خطأ: ${data.message}\n\nتم إعادة طلبك إلى حقل الإدخال. حاول مرة أخرى بعد لحظات.`
 }]);
 setIsAgentThinking(false);
 }
 } catch(e) {}
 }
 }
 }
 } catch (err: any) {
 setChatInput(prompt);
 setMessages(prev => [...prev, {
 id: `err-${Date.now()}`,
 role: 'agent',
 content: `تعذّر الاتصال بالخادم. يرجى المحاولة مرة أخرى بعد ثوانٍ.\nتم إعادة طلبك إلى حقل الإدخال.`
 }]);
 setIsAgentThinking(false);
 }
 };

 const handleTriggerAiFromEditor = async (promptText: string) => {
 if (isAgentThinking || !promptText.trim()) return;
 setCode(''); // Clear standard editor to print generated component
 setChatInput('');
 setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: promptText }]);
 setIsAgentThinking(true);
 setAgentStatus("جاري تحويل طلبك لصفحة برمجية متفاعلة...");
 setDynamicSteps(["تحليل الطلب", "توليد الكود", "تنسيق مظهر البطاقة", "بناء الواجهة"]);
 setActiveStepIndex(0);
 setCompletedStepIndices([]);
 setAgentModels({});

 try {
 const res = await fetch('/api/agent', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ code: '', prompt: promptText })
 });
 
 if (!res.body) throw new Error("No response body");
 const reader = res.body.getReader();
 const decoder = new TextDecoder("utf-8");
 let incompleteChunk = "";
 
 while (true) {
 const { value, done } = await reader.read();
 if (done) break;
 
 incompleteChunk += decoder.decode(value, { stream: true });
 const lines = incompleteChunk.split('\n\n');
 incompleteChunk = lines.pop() || "";
 
 for (const line of lines) {
 if (line.startsWith('data: ')) {
 const dataStr = line.substring(6);
 try {
 const data = JSON.parse(dataStr);
 if (data.type === 'status') {
 setAgentStatus(data.message);
 } else if (data.type === 'steps_init') {
 setDynamicSteps(data.steps);
 setActiveStepIndex(0);
 } else if (data.type === 'step_active') {
 setActiveStepIndex(data.index);
 } else if (data.type === 'step_complete') {
 setCompletedStepIndices(prev => prev.includes(data.index) ? prev : [...prev, data.index]);
 } else if (data.type === 'stream_code') {
 setCode(data.code);
 } else if (data.type === 'model_info') {
 setAgentModels(prev => ({ ...prev, [data.agent]: data.model }));
 } else if (data.type === 'final') {
 if (data.code) setCode(data.code);
 setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: data.message }]);
 setIsAgentThinking(false);
 } else if (data.type === 'error') {
 setChatInput(promptText);
 setMessages(prev => [...prev, {
 id: `err-${Date.now()}`,
 role: 'agent',
 content: `حدث خطأ: ${data.message}\n\nتم إعادة طلبك إلى حقل الإدخال. حاول مرة أخرى بعد لحظات.`
 }]);
 setIsAgentThinking(false);
 }
 } catch(e) {}
 }
 }
 }
 } catch (err: any) {
 setChatInput(promptText);
 setMessages(prev => [...prev, {
 id: `err-${Date.now()}`,
 role: 'agent',
 content: `تعذّر الاتصال بالخادم. يرجى المحاولة مرة أخرى بعد ثوانٍ.\nتم إعادة طلبك إلى حقل الإدخال.`
 }]);
 setIsAgentThinking(false);
 }
 };

 const updateSelectedElementInOriginalCode = (updates: {
 styleAttr?: string;
 id?: string;
 classes?: string;
 innerText?: string;
 }) => {
 if (!selectedElement) return;
 try {
 const parser = new DOMParser();
 const doc = parser.parseFromString(code, 'text/html');
 
 let current: Element | null = doc.body;
 const path = selectedElement.path;
 
 for (const idx of path) {
 if (current && current.children[idx]) {
 current = current.children[idx];
 } else {
 current = null;
 break;
 }
 }
 
 if (current) {
 if (updates.id !== undefined) {
 if (updates.id.trim() === '') current.removeAttribute('id');
 else current.setAttribute('id', updates.id);
 setSelectedElement(prev => prev ? { ...prev, id: updates.id! } : null);
 }
 if (updates.classes !== undefined) {
 if (updates.classes.trim() === '') current.removeAttribute('class');
 else current.setAttribute('class', updates.classes);
 setSelectedElement(prev => prev ? { ...prev, classes: updates.classes! } : null);
 }
 if (updates.styleAttr !== undefined) {
 if (updates.styleAttr.trim() === '') current.removeAttribute('style');
 else current.setAttribute('style', updates.styleAttr);
 setSelectedElement(prev => prev ? { ...prev, styleAttr: updates.styleAttr! } : null);
 }
 if (updates.innerText !== undefined) {
 current.textContent = updates.innerText;
 setSelectedElement(prev => prev ? { ...prev, innerText: updates.innerText! } : null);
 }
 
 let newCode = doc.documentElement.outerHTML;
 if (code.trim().toLowerCase().startsWith('<!doctype html>')) {
 newCode = '<!DOCTYPE html>\n' + newCode;
 } else if (code.trim().toLowerCase().startsWith('<!doctype')) {
 const matches = code.match(/^<!doctype[^>]*>/i);
 if (matches) newCode = matches[0] + '\n' + newCode;
 }
 setCode(newCode);
 }
 } catch (e) {}
 };

 const processedCode = useMemo(() => {
 if (!code) return "";
 if (typeof window === 'undefined') return code;
 
 // Convert Arabic coding syntax tags/attributes/keywords to standard HTML/React
 const arabicPreprocessed = preprocessArabicCode(code);
 
 if (isReactActive) {
 const preprocessed = preprocessReactCode(arabicPreprocessed);
 return `<!DOCTYPE html>
<html lang="ar" dir="rtl" class="h-full">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>React Workspace Preview</title>
 <!-- Tailwind CSS CDN -->
 <script src="https://cdn.tailwindcss.com"></script>
 <!-- Tailwind Animate CSS -->
 <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
 <style>
 @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');
 body {
 font-family: 'Tajawal', sans-serif;
 background: #020617;
 color: #f1f5f9;
 margin: 0;
 padding: 0;
 box-sizing: border-box;
 }
 </style>
</head>
<body class="h-full">
 <div id="react-root" class="h-full"></div>

 <!-- Loading indicator overlay -->
 <div id="react-loader" style="position: fixed; inset: 0; background: #030712; display: flex; flex-direction: column; align-items: center; justify-center: center; z-index: 9999; font-family: sans-serif; color: #94a3b8; font-weight: 500;">
 <div style="font-size: 13px; margin-bottom: 8px;">جاري تجميع وتشغيل واجهة React...</div>
 <div style="border: 2px solid #10b981; border-top-color: transparent; width: 24px; height: 24px; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
 <style>
 @keyframes spin { to { transform: rotate(360deg); } }
 </style>
 </div>

 <!-- Error Boundary Overlay UI -->
 <div id="error-overlay" style="display: none; position: fixed; inset: 0; background: rgba(2,6,23,0.98); z-index: 10000; padding: 24px; box-sizing: border-box; overflow-y: auto; direction: rtl;">
 <div style="max-width: 640px; margin: 40px auto; background: #0f172a; border-radius: 16px; border: 1px solid #ef4444; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); padding: 28px; font-family: 'Tajawal', sans-serif;">
 <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
 <div style="background: rgba(239, 68, 68, 0.1); padding: 8px; border-radius: 50%;">
 <svg style="width: 28px; height: 28px; color: #ef4444;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
 </svg>
 </div>
 <div>
 <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fecaca;">خطأ في تجميع الكود أو بناء الواجهة (Compilation Error)</h3>
 <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">واجه المترجم المستقل مشكلة أثناء معالجة الكود المصدري وإعداده للعرض</p>
 </div>
 </div>
 <div id="error-message" style="background: #030712; padding: 16px; border-radius: 8px; border: 1px solid #1e293b; font-size: 13px; line-height: 1.6; white-space: pre-wrap; color: #f87171; font-family: monospace; max-height: 250px; overflow-y: auto; direction: ltr; text-align: left; margin-bottom: 16px;"></div>
 
 <div id="error-advice" style="font-size: 12px; color: #94a3b8; border-top: 1px solid #1e293b; padding-top: 16px; line-height: 1.6;">
 <strong style="color: #f1f5f9; display: block; margin-bottom: 6px;">🎯 نصائح ذكية لإصلاح الخطأ بسرعة:</strong>
 • تأكد من توازن وجاهزية جميع الأقواس الدائرية والمنحنية <code style="color: #60a5fa; font-family: monospace;">{}</code> أو <code style="color: #60a5fa; font-family: monospace;">()</code>.<br/>
 • تأكد من عدم استخدام تعبيرات أو مكتبات غير مستوردة أو مصطلحات خارج نطاق React.<br/>
 • لا تضع أقواس الإرجاع بداخل دالة مكون بدون إرجاع كامل وصحيح.<br/>
 • تأكد من إعلان واستيراد جميع المكونات المستهدفة بشكل سليم.
 </div>
 </div>
 </div>

 <!-- React & Babel Standalone Compilers -->
 <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
 <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
 <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

 <!-- Recharts & Dependencies -->
 <script src="https://unpkg.com/prop-types@15.8.1/prop-types.min.js" crossorigin></script>
 <script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.js" crossorigin></script>

 <!-- Canvas Confetti -->
 <script src="https://unpkg.com/canvas-confetti@1.6.0/dist/confetti.browser.js" crossorigin></script>

 <!-- Lucide Icons CDN Proxy setup -->
 <script src="https://unpkg.com/lucide@latest"></script>
 <script>
 // Create modern standard proxy for framer-motion matching HTML tags dynamically
 const motionProxy = new Proxy({}, {
 get: (target, tagName) => {
 return function MotionComponent({ children, ...props }) {
 const cleanProps = {};
 for (let key in props) {
 // Remove framer-motion custom props to prevent warnings/crashes in regular DOM
 if (!['animate', 'initial', 'exit', 'transition', 'variants', 'whileHover', 'whileTap', 'viewport', 'onAnimationComplete', 'layout', 'layoutId'].includes(key)) {
 cleanProps[key] = props[key];
 }
 }
 return React.createElement(tagName, cleanProps, children);
 };
 }
 });

 window.MockModules = {
 'lucide-react': new Proxy({}, {
 get: (target, propName) => {
 return function LucideProxyComponent(props) {
 const containerRef = React.useRef(null);
 React.useEffect(() => {
 let active = true;
 const renderIcon = () => {
 if (!containerRef.current) return false;
 const icon = window.lucide && window.lucide.icons 
 ? (window.lucide.icons[propName] || window.lucide.icons[propName.toLowerCase()] || window.lucide.icons[propName.charAt(0).toUpperCase() + propName.slice(1)] || window.lucide.icons['HelpCircle'] || window.lucide.icons['help-circle'])
 : null;
 if (icon) {
 containerRef.current.innerHTML = '';
 const attrs = icon[1];
 const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
 for (let k in attrs) {
 svg.setAttribute(k, attrs[k]);
 }
 if (props.className) svg.setAttribute('class', (svg.getAttribute('class') || '') + ' ' + props.className);
 if (props.color) svg.setAttribute('stroke', props.color);
 if (props.size) {
 svg.setAttribute('width', props.size);
 svg.setAttribute('height', props.size);
 }
 const children = icon[2] || [];
 children.forEach(child => {
 const node = document.createElementNS('http://www.w3.org/2000/svg', child[0]);
 for (let key in child[1]) {
 node.setAttribute(key, child[1][key]);
 }
 svg.appendChild(node);
 });
 containerRef.current.appendChild(svg);
 return true;
 }
 return false;
 };

 if (!renderIcon() && active) {
 let attempts = 0;
 const interval = setInterval(() => {
 attempts++;
 if (!active || renderIcon() || attempts > 60) {
 clearInterval(interval);
 }
 }, 50);
 return () => {
 active = false;
 clearInterval(interval);
 };
 }
 }, [props.className, props.color, props.size]);

 return React.createElement('span', { 
 ref: containerRef, 
 style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: props.size || '16px', height: props.size || '16px', ...props.style } 
 });
 };
 }
 }),
 'framer-motion': {
 motion: motionProxy,
 AnimatePresence: ({ children }) => children,
 layoutId: 'layout',
 useAnimation: () => ({ start: () => Promise.resolve() }),
 },
 'motion/react': {
 motion: motionProxy,
 AnimatePresence: ({ children }) => children,
 },
 'canvas-confetti': window.confetti || function() { console.log('Confetti activated!'); },
 'recharts': new Proxy({}, {
 get: (target, name) => {
 if (window.Recharts && window.Recharts[name]) {
 return window.Recharts[name];
 }
 // Dynamic fallback to maintain high visual layout standards
 return function ChartPlaceholder({ children, width, height }) {
 return React.createElement('div', {
 style: {
 width: width || '100%',
 height: height || '220px',
 background: '#0f171c',
 border: '1px solid #1e293b',
 borderRadius: '12px',
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 justifyContent: 'center',
 color: '#94a3b8',
 fontSize: '12px',
 position: 'relative',
 padding: '16px',
 fontFamily: 'Tajawal, sans-serif'
 }
 }, 
 React.createElement('div', { style: { fontWeight: 'bold', color: '#10b981', marginBottom: '4px' } }, 'مخطط بياني: ' + name),
 React.createElement('div', { style: { opacity: 0.7 } }, 'معاينة تفاعلية مفعّلة بنجاح'),
 children
 );
 };
 }
 })
 };

 // Generic MockModules fallback Proxy to prevent crash on any un-mocked npm import
 window.MockModules = new Proxy(window.MockModules, {
 get: (target, prop) => {
 if (prop in target) {
 return target[prop];
 }
 return new Proxy({}, {
 get: (innerTarget, key) => {
 return function GenericMockComponent({ children }) {
 return children || null;
 };
 }
 });
 }
 });
 </script>

 <!-- Mount independent compiler system -->
 <script type="text/babel" data-presets="react,typescript">
 function showErrorOverlay(err, componentStack = '') {
 document.getElementById('react-loader').style.display = 'none';
 document.getElementById('error-overlay').style.display = 'block';
 let cleanMsg = err && err.message ? err.message : String(err);
 if (err && err.stack) {
 cleanMsg += '\n\nStack:\n' + err.stack;
 }
 if (componentStack) {
 cleanMsg += '\n\nComponent Stack:\n' + componentStack;
 }
 document.getElementById('error-message').textContent = cleanMsg;
 }

 try {
 window.onerror = function(message, source, lineno, colno, error) {
 showErrorOverlay({ message: message, stack: error ? error.stack : '' });
 return true;
 };

 window.addEventListener('unhandledrejection', function(event) {
 showErrorOverlay({ message: 'Async Promise Rejection: ' + (event.reason ? (event.reason.message || String(event.reason)) : 'Unknown rejection'), stack: event.reason ? event.reason.stack : '' });
 });

 const React = window.React;
 const ReactDOM = window.ReactDOM;

 // Class ErrorBoundary to capture React components runtime crashes beautifully
 class ErrorBoundary extends React.Component {
 constructor(props) {
 super(props);
 this.state = { hasError: false, error: null, errorInfo: null };
 }

 static getDerivedStateFromError(error) {
 return { hasError: true, error: error };
 }

 componentDidCatch(error, errorInfo) {
 console.error("React Error Boundary caught an error:", error, errorInfo);
 this.setState({ errorInfo: errorInfo });
 }

 render() {
 if (this.state.hasError) {
 const errorMsg = this.state.error ? (this.state.error.message || String(this.state.error)) : "Unknown runtime error";
 const stack = this.state.error && this.state.error.stack ? this.state.error.stack : "";
 const componentStack = this.state.errorInfo && this.state.errorInfo.componentStack ? this.state.errorInfo.componentStack : "";

 return (
 <div style={{
 padding: '24px',
 background: '#090d16',
 color: '#f1f5f9',
 minHeight: '100vh',
 fontFamily: "'Tajawal', sans-serif",
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 direction: 'rtl',
 boxSizing: 'border-box'
 }}>
 <div style={{
 maxWidth: '640px',
 width: '100%',
 background: '#0f172a',
 borderRadius: '16px',
 border: '1px solid #ef4444',
 boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
 padding: '28px',
 boxSizing: 'border-box'
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
 <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '50%' }}>
 <svg style={{ width: '28px', height: '28px', color: '#ef4444' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
 </svg>
 </div>
 <div>
 <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fecaca', fontFamily: "'Tajawal', sans-serif" }}>خطأ تشغيل في واجهة React (Runtime Error)</h3>
 <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8', fontFamily: "'Tajawal', sans-serif" }}>تم اعتراض الخطأ وتطويقه بنجاح لمنع توقف المحاكي أو اختفاء الشاشة</p>
 </div>
 </div>
 
 <div style={{
 background: '#030712',
 padding: '16px',
 borderRadius: '8px',
 border: '1px solid #1e293b',
 fontSize: '13px',
 lineHeight: '1.6',
 whiteSpace: 'pre-wrap',
 color: '#f87171',
 fontFamily: "monospace",
 maxHeight: '180px',
 overflowY: 'auto',
 marginBottom: '16px',
 direction: 'ltr',
 textAlign: 'left'
 }}>
 {errorMsg}
 </div>

 {componentStack && (
 <div style={{ marginBottom: '16px' }}>
 <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', fontFamily: "'Tajawal', sans-serif" }}>مكان حدوث المشكلة بالمكونات (Component Nesting Check):</p>
 <pre style={{
 background: '#030712',
 padding: '12px',
 borderRadius: '6px',
 border: '1px solid #1e293b',
 fontSize: '11px',
 color: '#64748b',
 fontFamily: 'monospace',
 overflowX: 'auto',
 maxHeight: '100px',
 margin: 0,
 direction: 'ltr',
 textAlign: 'left'
 }}>
 {componentStack}
 </pre>
 </div>
 )}

 {stack && (
 <div style={{ marginBottom: '16px' }}>
 <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', fontFamily: "'Tajawal', sans-serif" }}>مسار تتبع الملف والمصادر (JavaScript Stack Trace):</p>
 <pre style={{
 background: '#030712',
 padding: '12px',
 borderRadius: '6px',
 border: '1px solid #1e293b',
 fontSize: '11px',
 color: '#475569',
 fontFamily: 'monospace',
 overflowX: 'auto',
 maxHeight: '100px',
 margin: 0,
 direction: 'ltr',
 textAlign: 'left'
 }}>
 {stack}
 </pre>
 </div>
 )}

 <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <span style={{ fontSize: '11px', color: '#64748b', fontFamily: "'Tajawal', sans-serif" }}>نصيحة: تحقق من كتابة دالة الـ click أو الـ state بطريقة غير دائرية.</span>
 <button 
 onClick={() => window.location.reload()} 
 style={{
 background: '#ef4444',
 color: 'white',
 border: 'none',
 padding: '8px 16px',
 borderRadius: '8px',
 fontSize: '12px',
 fontWeight: '600',
 cursor: 'pointer',
 transition: 'background 0.2s',
 fontFamily: "'Tajawal', sans-serif"
 }}
 onMouseOver={(e) => e.target.style.background = '#dc2626'}
 onMouseOut={(e) => e.target.style.background = '#ef4444'}
 >
 تحديث المعاينة 🔄
 </button>
 </div>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
 }

 // Actual user source evaluation
 ${preprocessed}

 const TargetComponent = window._exports && window._exports.default ? window._exports.default : (window.App || window.Main || null);
 
 if (!TargetComponent) {
 throw new Error('لم يتم العثور على مكون افتراضي مصدر للتصدير (export default). يرجى التأكد من تصنيع "export default function App() {}" لتشغيل الصفحة بنجاح.');
 }

 const root = ReactDOM.createRoot(document.getElementById('react-root'));
 root.render(
 React.createElement(ErrorBoundary, null, 
 React.createElement(TargetComponent)
 )
 );
 
 // Hide standard loading panel
 document.getElementById('react-loader').style.display = 'none';
 } catch (err) {
 showErrorOverlay(err);
 }
 </script>
</body>
</html>`;
 }

 try {
 let htmlToParse = arabicPreprocessed;
 
 // If we are editing "index.html" (or any standard html file), let's resolve relative CSS and JS imports from the VFS:
 if (activeFile.endsWith('.html') || activeFile.endsWith('.htm')) {
 try {
 const parser = new DOMParser();
 const doc = parser.parseFromString(arabicPreprocessed, 'text/html');
 
 // 1. Resolve relative CSS links (<link rel="stylesheet" href="style.css">)
 const links = doc.querySelectorAll('link[rel="stylesheet"]');
 links.forEach(link => {
 const href = link.getAttribute('href');
 if (href && files[href] && !files[href].isFolder) {
 const styleEl = doc.createElement('style');
 styleEl.textContent = files[href].content;
 link.parentNode?.replaceChild(styleEl, link);
 }
 });

 // 2. Resolve relative JS scripts (<script src="script.js"></script>)
 const scripts = doc.querySelectorAll('script[src]');
 scripts.forEach(script => {
 const src = script.getAttribute('src');
 if (src && files[src] && !files[src].isFolder) {
 const scriptEl = doc.createElement('script');
 scriptEl.textContent = files[src].content;
 script.parentNode?.replaceChild(scriptEl, script);
 }
 });

 htmlToParse = doc.documentElement.outerHTML;
 if (arabicPreprocessed.trim().toLowerCase().startsWith('<!doctype html>')) {
 htmlToParse = '<!DOCTYPE html>\n' + htmlToParse;
 }
 } catch (err) {
 console.error("VFS relative resolution error:", err);
 }
 }

 let parsedHtmlResult = htmlToParse;
 const t = parsedHtmlResult.trim().toLowerCase();
 // Only SVG Wrapper for centering and rendering
 // Also inject a tech background to see transparency perfectly 
 if (t.startsWith('<svg') || (t.includes('<svg') && !t.includes('<html') && !t.includes('<body'))) {
 parsedHtmlResult = `<!DOCTYPE html>
<html>
<head>
 <style>
 body {
 margin: 0; padding: 0; min-height: 100vh;
 display: flex; justify-content: center; align-items: center;
 background-color: #030712;
 background-image: radial-gradient(#1e293b 1px, transparent 1px);
 background-size: 20px 20px;
 }
 .svg-w {
 display: flex;
 justify-content: center;
 align-items: center;
 max-width: 95vw;
 max-height: 95vh;
 filter: none;
 }
 .svg-w svg { width: 100%; height: 100%; }
 </style>
</head>
<body>
 <div class="svg-w">
 ${htmlToParse}
 </div>
</body>
</html>`;
 }

 const parser = new DOMParser();
 const doc = parser.parseFromString(parsedHtmlResult, 'text/html');

 if (inspectModeActive) {
 const style = doc.createElement('style');
 style.id = 'inspect-helper-styles';
 style.textContent = `
 .inspect-hovered {
 outline: 2px dashed #059669 !important;
 outline-offset: -2px !important;
 cursor: pointer !important;
 transition: all 0.15s ease !important;
 }
 .inspect-selected {
 outline: 2px solid #10b981 !important;
 outline-offset: -2px !important;
 background-color: rgba(16, 185, 129, 0.08) !important;
 }
 `;
 doc.head.appendChild(style);

 const script = doc.createElement('script');
 script.id = 'inspect-helper-script';
 script.textContent = `
 (function() {
 let hovered = null;
 let selected = null;
 function getElementPath(el) {
 const path = [];
 let curr = el;
 while (curr && curr !== document.body) {
 const parent = curr.parentElement;
 if (!parent) break;
 path.unshift(Array.from(parent.children).indexOf(curr));
 curr = parent;
 }
 return path;
 }
 document.addEventListener('mouseover', (e) => {
 e.stopPropagation();
 const el = e.target;
 if (el && el.tagName && el !== document.body && el !== document.documentElement && el.id !== 'inspect-helper-styles') {
 if (hovered && hovered !== el) hovered.classList.remove('inspect-hovered');
 hovered = el; hovered.classList.add('inspect-hovered');
 }
 }, true);
 document.addEventListener('mouseout', () => {
 if (hovered) { hovered.classList.remove('inspect-hovered'); hovered = null; }
 }, true);
 document.addEventListener('click', (e) => {
 e.preventDefault(); e.stopPropagation();
 const el = e.target;
 if (el && el.tagName && el !== document.body && el !== document.documentElement) {
 if (selected) selected.classList.remove('inspect-selected');
 selected = el; selected.classList.add('inspect-selected');
 const computed = window.getComputedStyle(el);
 window.parent.postMessage({
 type: 'ELEMENT_CLICKED',
 path: getElementPath(el),
 tagName: el.tagName.toLowerCase(),
 id: el.id || '',
 classes: el.className.replace('inspect-hovered', '').replace('inspect-selected', '').trim(),
 styleAttr: el.getAttribute('style') || '',
 innerText: el.innerText || el.textContent || '',
 styles: { color: computed.color, backgroundColor: computed.backgroundColor }
 }, '*');
 }
 }, true);
 })();
 `;
 doc.body.appendChild(script);
 }

 let res = doc.documentElement.outerHTML;
 if (parsedHtmlResult.trim().toLowerCase().startsWith('<!doctype html>')) {
 res = '<!DOCTYPE html>\n' + res;
 } else if (parsedHtmlResult.trim().toLowerCase().startsWith('<!doctype')) {
 const matches = parsedHtmlResult.match(/^<!doctype[^>]*>/i);
 if (matches) res = matches[0] + '\n' + res;
 }
 return res;
 } catch (err) {
 return arabicPreprocessed;
 }
 }, [code, inspectModeActive, isReactActive, files, activeFile]);

 const charsCount = code.length;

 // Real-time scale calculation for standard devices to prevent layout spill on mobile
 const simulatedScale = useMemo(() => {
 if (previewSize === 'desktop') return 1;
 const borderSpacing = 32; // Safety gap
 const simulatedDeviceWidth = previewSize === 'mobile' ? 418 : 792;
 if (containerWidth < simulatedDeviceWidth + borderSpacing) {
 return (containerWidth - borderSpacing) / simulatedDeviceWidth;
 }
 return 1;
 }, [containerWidth, previewSize]);

 // Handle Drag events globally
 const handleDragOverGlobal = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setIsDragging(true);
 };

 const handleDropGlobal = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setIsDragging(false);
 const files = e.dataTransfer.files;
 if (files && files.length > 0) {
 const file = files[0];
 const name = file.name.toLowerCase();
 const isSupportedType = 
 name.endsWith('.html') || 
 name.endsWith('.htm') || 
 name.endsWith('.txt') || 
 name.endsWith('.md') || 
 name.endsWith('.svg') || 
 name.endsWith('.js') || 
 name.endsWith('.jsx') || 
 name.endsWith('.ts') || 
 name.endsWith('.tsx') || 
 name.endsWith('.css') || 
 name.endsWith('.json') ||
 file.type.startsWith('text/') ||
 file.type.includes('svg') ||
 file.type.includes('javascript') ||
 file.type.includes('json');

 if (isSupportedType) {
 handleFileDrop(file);
 } else {
 alert("يرجى سحب وإفلات ملف مدعوم فقط (مثل: نصوص أو أكواد برمجية .html, .css, .js, .tsx, .txt)");
 }
 }
 };

 const insertCodeAtCursor = (insertedValue: string) => {
 const textarea = textareaRef.current;
 if (textarea) {
 const start = textarea.selectionStart;
 const end = textarea.selectionEnd;
 const text = textarea.value;
 const before = text.substring(0, start);
 const after = text.substring(end, text.length);
 const newCode = before + insertedValue + after;
 setCode(newCode);
 
 // Reset scroll & cursor positions
 setTimeout(() => {
 textarea.focus();
 textarea.setSelectionRange(start + insertedValue.length, start + insertedValue.length);
 }, 50);
 } else {
 setCode(code + '\n' + insertedValue);
 }
 };

 return (
 <div 
 className="h-screen w-screen flex flex-col bg-brand-bg text-brand-text font-sans antialiased overflow-hidden relative select-none"
 onDragEnter={handleDragOverGlobal}
 onDragOver={handleDragOverGlobal}
 >
 {/* Background Geometric Grid & Ambient Glow Layers */}
 <div className="absolute inset-0 tech-grid opacity-50 pointer-events-none z-0" />
 <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] pointer-events-none z-0 filter blur-3xl opacity-90" />
 <div className="absolute bottom-[-15%] right-[10%] w-[700px] h-[700px] pointer-events-none z-0 filter blur-3xl opacity-60" />
 
 
 {/* Drag & Drop Neon Glowing Overlay */}
 <AnimatePresence>
 {isDragging && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-brand-bg/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 border-4 border-dashed border-brand-accent/50 m-4 rounded-3xl"
 onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
 onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
 onDrop={handleDropGlobal}
 >
 <motion.div
 initial={{ scale: 0.9, y: 15 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.9, y: 15 }}
 className="bg-brand-card border border-brand-accent/30 rounded-3xl p-8 max-w-md text-center shadow-none relative overflow-hidden pointer-events-none"
 >
 <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-accent via-brand-deep to-brand-accent" />
 <div className="w-16 h-16 bg-brand-accent/10 border border-brand-accent/30 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
 <Upload className="w-8 h-8 text-brand-accent animate-bounce" />
 </div>
 <h3 className="text-xl font-bold text-brand-text mb-2 font-sans">أفلت الملف هنا للرفع</h3>
 <p className="text-zinc-400 text-xs sm:text-sm font-medium leading-relaxed mb-4">
 سيتم قراءة محتوى الملف وتحديث المحرر فوراً بكل سهولة وأمان بلمح البصر.
 </p>
 <span className="text-[10px] bg-brand-bg border border-brand-accent/25 text-brand-accent px-3 py-1 rounded-full font-mono font-bold mt-1 inline-block">
 دعم كامل لـ .html, .css, .js, .tsx, .txt, .json, .zip
 </span>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* 1. Header Area: Floating Glass Navbar (editor tab only) */}
 {activeTab === 'editor' && (
 <header className="fixed top-6 left-1/2 -translate-x-1/2 z-40 max-w-5xl w-[calc(100%-2.5rem)] bg-brand-card/90 backdrop-blur-md rounded-full border border-brand-accent/20 shadow-none px-4 h-[58px] flex items-center justify-between text-brand-text select-none">
 <div className="flex items-center gap-3">
 <div className="relative flex items-center justify-center">
 <img
 src="/nexus-logo.webp"
 alt="NEXUS logo"
 width={28}
 height={28}
 className="w-7 h-7 object-contain drop-shadow-none"
 />
 </div>
 <div className="flex flex-col text-right justify-center">
 <h1 className="text-sm md:text-base font-black text-brand-text font-mono tracking-[0.2em] uppercase">
 NEXUS
 </h1>
 </div>
 </div>
 
 {/* Simple actions nested cleanly */}
 <div className="flex items-center gap-2">
 <input 
 type="file" 
 accept=".html,.htm,.txt,.md,.svg,.css,.js,.jsx,.ts,.tsx,.json,.zip" 
 ref={fileInputRef} 
 className="hidden" 
 onChange={handleFileUpload} 
 />
 <button
 onClick={() => setIsCompressModalOpen(true)}
 className="flex items-center gap-1.5 bg-[#0f0f0f] hover:bg-brand-bg/85 border border-brand-accent/30 hover:border-brand-accent/60 text-brand-text transition-all px-3.5 py-1.5 rounded-full text-xs font-bold active:scale-95 cursor-pointer h-9"
 title="أداة ضغط الملفات"
 >
 <FileArchive className="w-3.5 h-3.5 text-brand-accent" />
 <span className="hidden md:inline">ضغط الملفات</span>
 </button>
 <button
 type="button"
 onClick={() => setIsLoopDashboardOpen(true)}
 aria-label="Open Loop Dashboard"
 className="magnetic flex items-center gap-1.5 bg-gradient-to-l from-brand-accent/20 to-brand-deep/20 hover:from-brand-accent/30 hover:to-brand-deep/30 border border-brand-accent/40 hover:border-brand-accent/60 text-brand-accent transition-all px-3.5 py-1.5 rounded-full text-xs font-extrabold active:scale-95 shadow-none cursor-pointer h-9"
 title="لوحة الحلقة"
 >
 <Activity className="w-3.5 h-3.5" />
 <span className="hidden md:inline">الحلقة</span>
 </button>
 <button
 type="button"
 onClick={() => setIsTestRunnerOpen(true)}
 aria-label="Open Test Runner"
 className="magnetic flex items-center gap-1.5 bg-[#0f0f0f] hover:bg-brand-bg/85 border border-brand-accent/30 hover:border-brand-accent/60 text-brand-accent transition-all px-3.5 py-1.5 rounded-full text-xs font-bold active:scale-95 cursor-pointer h-9"
 title="مشغّل الاختبارات"
 >
 <TerminalSquare className="w-3.5 h-3.5" />
 <span className="hidden md:inline">الاختبارات</span>
 </button>
 <button 
 onClick={triggerFileInput}
 className="flex items-center gap-1.5 bg-brand-bg hover:bg-brand-bg/85 hover:border-brand-accent/40 text-brand-text transition-all px-3.5 py-1.5 rounded-full text-xs font-bold active:scale-95 cursor-pointer border border-brand-accent/20 h-9"
 title="رفع ملف أو مشروع ZIP"
 >
 <Upload className="w-3.5 h-3.5 text-brand-accent" />
 <span className="hidden md:inline">رفع ملف</span>
 </button>

 <div className="relative" ref={menuRef}>
 <button
 onClick={() => setIsMenuOpen(!isMenuOpen)}
 className="flex items-center gap-1.5 bg-[#0f0f0f] border border-brand-accent/30 hover:border-brand-accent/60 text-brand-text transition-all px-3.5 py-1.5 rounded-full text-xs font-extrabold active:scale-95 cursor-pointer h-9"
 >
 <Download className="w-3.5 h-3.5 text-brand-accent" />
 <span>تنزيل</span>
 <ChevronDown className="w-3.5 h-3.5 text-brand-accent" />
 </button>

 <AnimatePresence>
 {isMenuOpen && (
 <motion.div
 initial={{ opacity: 0, y: 10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.95 }}
 transition={{ duration: 0.15, ease: 'easeOut' }}
 className="absolute left-0 mt-2.5 w-64 bg-[#121215]/95 rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 text-zinc-100 backdrop-blur-xl"
 >
 <div className="p-2 gap-1 flex flex-col" dir="rtl">
 <button
 onClick={() => handleDownload('code')}
 className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-[#5dd62c]/10 text-zinc-200 hover:text-[#5dd62c] rounded-xl transition-all w-full text-right cursor-pointer"
 >
 <Download className="w-4 h-4 text-[#5dd62c]" />
 تنزيل الملف المفتوح
 </button>

 <button
 onClick={handleDownloadZip}
 className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-[#5dd62c]/10 text-zinc-200 hover:text-[#5dd62c] rounded-xl transition-all w-full text-right cursor-pointer"
 >
 <FileArchive className="w-4 h-4 text-[#5dd62c]" />
 تحميل المشروع بالكامل (.ZIP)
 </button>

 <button
 onClick={() => handleDownload('md')}
 className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-[#5dd62c]/10 text-zinc-200 hover:text-[#5dd62c] rounded-xl transition-all w-full text-right cursor-pointer"
 >
 <FileText className="w-4 h-4 text-[#5dd62c]" />
 تنزيل كمستند توثيق .md
 </button>

 <div className="border-t border-white/5 my-1" />

 <button
 onClick={handleCopy}
 className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all w-full text-right cursor-pointer"
 >
 {isCopied ? <Check className="w-4 h-4 text-[#5dd62c]" /> : <Copy className="w-4 h-4 text-zinc-400" />}
 {isCopied ? 'تم نسخ الكود!' : 'نسخ الكود بالكامل'}
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 </header>
 )}

 {/* 2. Main content viewport shell */}
 <main className={`flex-1 min-h-0 relative flex flex-col pb-20 ${activeTab === 'editor' ? 'pt-24' : 'pt-6'}`}>
 <div className="flex-1 min-h-0 flex flex-row w-full h-full position-relative overflow-hidden" ref={containerRef}>
 
 <AnimatePresence mode="wait">
 {activeTab === 'editor' && (
 <motion.div
 key="editor-tab"
 initial={{ opacity: 0, scale: 0.99 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.99 }}
 transition={{ duration: 0.15 }}
 className="flex-1 min-h-0 flex flex-row overflow-hidden relative"
 >
 <CodeEditor
 code={code}
 setCode={setCode}
 formatCode={formatCode}
 isFormatting={isFormatting}
 setIsIconModalOpen={setIsIconModalOpen}
 isConfirmingClear={isConfirmingClear}
 setIsConfirmingClear={setIsConfirmingClear}
 isReactActive={isReactActive}
 lintIssues={lintIssues}
 deepIssues={deepIssues}
 textareaRef={textareaRef}
 sidebarRef={sidebarRef}
 isLintPanelOpen={isLintPanelOpen}
 setIsLintPanelOpen={setIsLintPanelOpen}
 currentLine={currentLine}
 setCurrentLine={setCurrentLine}
 currentCol={currentCol}
 setCurrentCol={setCurrentCol}
 editorScrollTop={editorScrollTop}
 setEditorScrollTop={setEditorScrollTop}
 editorHeight={editorHeight}
 setEditorHeight={setEditorHeight}
 onTriggerAiGeneration={handleTriggerAiFromEditor}
 isAgentThinking={isAgentThinking}
 files={files}
 setFiles={setFiles}
 activeFile={activeFile}
 setActiveFile={setActiveFile}
 onClearWorkspace={handleClearWorkspace}
 />

 {/* Sliding Diagnostics sidebar */}
 <LinterPanel
 isLintPanelOpen={isLintPanelOpen}
 setIsLintPanelOpen={setIsLintPanelOpen}
 activeLintTab={activeLintTab}
 setActiveLintTab={setActiveLintTab}
 lintIssues={lintIssues}
 deepIssues={deepIssues}
 code={code}
 isDeepLinting={isDeepLinting}
 deepLintSummary={deepLintSummary}
 runDeepLint={runDeepLint}
 applyQuickFix={applyQuickFix}
 textareaRef={textareaRef}
 />
 </motion.div>
 )}

 {activeTab === 'preview' && (
 <motion.div
 key="preview-tab"
 initial={{ opacity: 0, scale: 0.99 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.99 }}
 transition={{ duration: 0.15 }}
 className="flex-1 min-h-0 flex flex-row overflow-hidden relative h-full w-full"
 >
 <LivePreview
 isReactActive={isReactActive}
 processedCode={processedCode}
 previewSize={previewSize}
 setPreviewSize={setPreviewSize}
 simulatedScale={simulatedScale}
 simulatedTime={simulatedTime}
 inspectModeActive={inspectModeActive}
 setInspectModeActive={setInspectModeActive}
 />

 <InspectPanel
 selectedElement={selectedElement}
 updateSelectedElementInOriginalCode={updateSelectedElementInOriginalCode}
 handleCopyCSS={handleCopyCSS}
 isCSSCopied={isCSSCopied}
 inspectModeActive={inspectModeActive}
 />
 </motion.div>
 )}

 {activeTab === 'agent' && (
 <motion.div
 key="agent-tab"
 initial={{ opacity: 0, scale: 0.99 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.99 }}
 transition={{ duration: 0.15 }}
 className="flex-1 min-h-0 h-full w-full flex overflow-hidden relative"
 >
 <ChatAgent
 messages={messages}
 chatInput={chatInput}
 setChatInput={setChatInput}
 isAgentThinking={isAgentThinking}
 agentStatus={agentStatus}
 dynamicSteps={dynamicSteps}
 activeStepIndex={activeStepIndex}
 completedStepIndices={completedStepIndices}
 handleSendAgentPrompt={handleSendAgentPrompt}
 chatScrollRef={chatScrollRef}
 handleClearChat={() => setMessages([])}
 agentModels={agentModels}
 isFullStack={isFullStack}
 setIsFullStack={setIsFullStack}
 />
 </motion.div>
 )}
 </AnimatePresence>

 </div>
 </main>

 {/* 3. Redesigned Floating Bottom Dock */}
 <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[calc(100%-2.5rem)] select-none">
 <div className="bg-brand-card/95 backdrop-blur-md rounded-full shadow-none border border-brand-accent/25 px-2 py-1.5 flex justify-between items-center h-14 relative w-full">
 {[
 { id: 'editor', label: 'المحرر', icon: Code2 },
 { id: 'preview', label: 'المعاينة', icon: Play },
 { id: 'agent', label: 'الذكاء', icon: Bot, isNew: true },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as 'editor' | 'preview' | 'agent')}
 className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 select-none cursor-pointer ${
 activeTab === propsActive(tab.id) 
 ? 'text-brand-accent font-extrabold bg-[#0f0f0f]/90 border border-brand-accent/30 shadow-none' 
 : 'text-zinc-400 hover:text-brand-accent/85'
 }`}
 >
 <tab.icon className="w-3.5 h-3.5" />
 <span>{tab.label}</span>
 {tab.isNew && (
 <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-accent shadow-none animate-ping" />
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Dynamic Dialog for choosing and configuring Icons */}
 <IconHelperModal
 isOpen={isIconModalOpen}
 onClose={() => setIsIconModalOpen(false)}
 insertCodeAtCursor={insertCodeAtCursor}
 />

 <AnimatePresence>
 {isCompressModalOpen && (
 <CompressModal onClose={() => setIsCompressModalOpen(false)} />
 )}
 </AnimatePresence>

 <LoopDashboard isOpen={isLoopDashboardOpen} onClose={() => setIsLoopDashboardOpen(false)} />
 <TestRunnerPanel isOpen={isTestRunnerOpen} onClose={() => setIsTestRunnerOpen(false)} />

 </div>
 );
}

function propsActive(id: string): 'editor' | 'preview' | 'agent' {
 return id as 'editor' | 'preview' | 'agent';
}
