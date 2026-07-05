"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import {
  Folder,
  File,
  FileCode,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  Terminal as TerminalIcon,
  Sparkles,
  Play,
  Send,
  Code,
  HelpCircle,
  Bug,
  BookOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Activity,
  User,
  Monitor,
  Info,
  Layers,
  Check,
  X,
  Database,
  Search,
  Smile,
  Save,
  PanelRightOpen,
  PanelRightClose
} from "lucide-react";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-brand-card text-zinc-400 font-mono text-sm">
      <div className="flex flex-col items-center gap-3">
        <Activity className="h-8 w-8 animate-spin text-brand-accent" />
        <span>Loading NEXUS Core Editor...</span>
      </div>
    </div>
  ),
});

interface VirtualFile {
  path: string;
  name: string;
  content: string;
  isFolder: boolean;
  language?: string;
  isOpen?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const DEFAULT_FILES: VirtualFile[] = [
  {
    path: "/index.html",
    name: "index.html",
    content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #f0fdf4;
            color: #14532d;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background-color: white;
            padding: 2.5rem;
            border-radius: 1.5rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
            text-align: center;
            max-width: 450px;
            width: 90%;
        }
        h1 { margin-top: 0; color: #166534; font-size: 1.75rem; font-weight: 800; }
        button {
            background-color: #22c55e;
            color: white;
            border: none;
            padding: 0.85rem 2rem;
            border-radius: 0.75rem;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>مرحباً بك في NEXUS</h1>
        <button onclick="alert('الكود يعمل!')">اضغط للتجربة</button>
    </div>
</body>
</html>`,
    isFolder: false,
    language: "html",
  },
  {
    path: "/style.css",
    name: "style.css",
    content: `/* NEXUS Stylesheet */
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0f0f0f;
  color: #f8f8f8;
}`,
    isFolder: false,
    language: "css",
  },
  {
    path: "/app.js",
    name: "app.js",
    content: `// NEXUS JavaScript
console.log('Hello from NEXUS!');`,
    isFolder: false,
    language: "javascript",
  },
];

export default function IDEWorkspaceNew() {
  // ----------------- State Managers -----------------
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>("/index.html");
  const [terminalDir, setTerminalDir] = useState<string>("/");
  const [terminalInput, setTerminalInput] = useState<string>("");
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalHistoryIndex, setTerminalHistoryIndex] = useState<number>(-1);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ type: "input" | "output" | "error" | "system"; text: string }>>([
    { type: "system", text: "NEXUS Core Console v1.0.0 initialized." },
    { type: "system", text: "Type 'help' for a list of available CLI commands." },
    { type: "system", text: "Persistent IndexedDB/LocalStorage state: READY." },
  ]);

  // AI Assistant States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am NEXUS AI, your embedded software engineering companion. Ask me any coding questions, select code in Monaco to refactor or explain, or trigger dynamic code generation directly!",
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Monaco and Selection States
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [editorSelectionRange, setEditorSelectionRange] = useState<any>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Sidebar Controls
  const [newFileName, setNewFileName] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [showNewFileInput, setShowNewFileInput] = useState<string | null>(null); // path of parent folder, or "/" for root
  const [showNewFolderInput, setShowNewFolderInput] = useState<string | null>(null);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>("");

  // Tabs
  const [openTabs, setOpenTabs] = useState<string[]>(["/index.html"]);

  // Floating AI Prompt Bar (Ctrl + K)
  const [showPromptBar, setShowPromptBar] = useState<boolean>(false);
  const [promptBarValue, setPromptBarValue] = useState<string>("");
  const [promptBarLoading, setPromptBarLoading] = useState<boolean>(false);

  // Layout UI Panels
  const [isTerminalExpanded, setIsTerminalExpanded] = useState<boolean>(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [isAiPanelExpanded, setIsAiPanelExpanded] = useState<boolean>(true);

  // Refs for auto scrolling
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load / Save persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFiles = localStorage.getItem("nexus_virtual_files");
      if (savedFiles) {
        try {
          const parsed = JSON.parse(savedFiles);
          if (parsed && parsed.length > 0) {
            setFiles(parsed);
          } else {
            setFiles(DEFAULT_FILES);
          }
        } catch (e) {
          setFiles(DEFAULT_FILES);
        }
      } else {
        setFiles(DEFAULT_FILES);
        localStorage.setItem("nexus_virtual_files", JSON.stringify(DEFAULT_FILES));
      }

      const savedTabs = localStorage.getItem("nexus_open_tabs");
      if (savedTabs) {
        try {
          setOpenTabs(JSON.parse(savedTabs));
        } catch (_) {}
      }

      const savedActiveFile = localStorage.getItem("nexus_active_file");
      if (savedActiveFile) {
        // Verify the saved active file exists in the loaded files
        const savedFilesData = JSON.parse(savedFiles);
        const fileExists = savedFilesData.some((f: VirtualFile) => f.path === savedActiveFile);
        if (fileExists) {
          setActiveFilePath(savedActiveFile);
        } else {
          // Active file doesn't exist in loaded files — fall back to first file
          const firstFile = savedFilesData.find((f: VirtualFile) => !f.isFolder);
          if (firstFile) {
            setActiveFilePath(firstFile.path);
          }
        }
      }
    }
  }, []);

  // Save changes to localStorage whenever files modify
  const saveFilesToStorage = (updatedFiles: VirtualFile[]) => {
    setFiles(updatedFiles);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_virtual_files", JSON.stringify(updatedFiles));
    }
  };

  useEffect(() => {
    if (files.length > 0 && typeof window !== "undefined") {
      localStorage.setItem("nexus_virtual_files", JSON.stringify(files));
    }
  }, [files]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_open_tabs", JSON.stringify(openTabs));
    }
  }, [openTabs]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_active_file", activeFilePath);
    }
  }, [activeFilePath]);

  // Scroll views to bottom
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Ref to always refer to latest runCurrentFile callback without triggering effect updates
  const runRef = useRef<() => void>(() => {});
  useEffect(() => {
    runRef.current = runCurrentFile;
  });

  // Handle Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K triggers AI Prompt Bar
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowPromptBar((prev) => !prev);
      }
      // Ctrl+P or Cmd+P triggers current file run
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Active File Helper
  const activeFile = files.find((f) => f.path === activeFilePath);

  // Fix: if activeFilePath doesn't exist in loaded files, fall back to first file
  useEffect(() => {
    if (files.length > 0 && !activeFile) {
      const firstFile = files.find((f) => !f.isFolder);
      if (firstFile) {
        setActiveFilePath(firstFile.path);
        if (!openTabs.includes(firstFile.path)) {
          setOpenTabs([firstFile.path]);
        }
      }
    }
  }, [files, activeFile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------- Virtual File System Operations -----------------

  const handleCreateFile = (parentFolder: string) => {
    if (!newFileName.trim()) return;

    // Sanitize path
    const resolvedPath = parentFolder === "/" 
      ? `/${newFileName.trim()}` 
      : `${parentFolder}/${newFileName.trim()}`;

    // Check if file already exists
    if (files.some((f) => f.path === resolvedPath)) {
      alert("Error: A file or directory with this name already exists.");
      return;
    }

    const extension = newFileName.split(".").pop() || "";
    let language = "text";
    if (["js", "jsx"].includes(extension)) language = "javascript";
    else if (["ts", "tsx"].includes(extension)) language = "typescript";
    else if (["json"].includes(extension)) language = "json";
    else if (["md", "markdown"].includes(extension)) language = "markdown";
    else if (["html"].includes(extension)) language = "html";
    else if (["css"].includes(extension)) language = "css";

    const newFile: VirtualFile = {
      path: resolvedPath,
      name: newFileName.trim(),
      content: `// File created: ${newFileName}\n// Created inside NEXUS IDE at ${new Date().toLocaleTimeString()}\n\n`,
      isFolder: false,
      language,
    };

    const updated = [...files, newFile];
    saveFilesToStorage(updated);
    setNewFileName("");
    setShowNewFileInput(null);
    setActiveFilePath(resolvedPath);
    if (!openTabs.includes(resolvedPath)) {
      setOpenTabs([...openTabs, resolvedPath]);
    }

    setTerminalLogs((prev) => [
      ...prev,
      { type: "system", text: `📁 File created successfully: ${resolvedPath}` },
    ]);
  };

  const handleCreateFolder = (parentFolder: string) => {
    if (!newFolderName.trim()) return;

    const resolvedPath = parentFolder === "/" 
      ? `/${newFolderName.trim()}` 
      : `${parentFolder}/${newFolderName.trim()}`;

    if (files.some((f) => f.path === resolvedPath)) {
      alert("Error: A file or folder with this name already exists.");
      return;
    }

    const newFolder: VirtualFile = {
      path: resolvedPath,
      name: newFolderName.trim(),
      content: "",
      isFolder: true,
      isOpen: true,
    };

    const updated = [...files, newFolder];
    saveFilesToStorage(updated);
    setNewFolderName("");
    setShowNewFolderInput(null);

    setTerminalLogs((prev) => [
      ...prev,
      { type: "system", text: `📁 Directory created successfully: ${resolvedPath}` },
    ]);
  };

  const handleDeletePath = (pathToDelete: string) => {
    // Confirm delete
    if (!confirm(`Are you sure you want to delete ${pathToDelete}?`)) return;

    // Filter out files
    const updated = files.filter(
      (f) => f.path !== pathToDelete && !f.path.startsWith(pathToDelete + "/")
    );

    saveFilesToStorage(updated);

    // Remove deleted files from tabs
    const updatedTabs = openTabs.filter(
      (tab) => tab !== pathToDelete && !tab.startsWith(pathToDelete + "/")
    );
    setOpenTabs(updatedTabs);

    // Redirect active file if deleted
    if (activeFilePath === pathToDelete || activeFilePath.startsWith(pathToDelete + "/")) {
      if (updatedTabs.length > 0) {
        setActiveFilePath(updatedTabs[0]);
      } else {
        const remainingFiles = updated.filter((f) => !f.isFolder);
        if (remainingFiles.length > 0) {
          setActiveFilePath(remainingFiles[0].path);
        } else {
          setActiveFilePath("");
        }
      }
    }

    setTerminalLogs((prev) => [
      ...prev,
      { type: "system", text: `🗑️ Deleted: ${pathToDelete}` },
    ]);
  };

  const handleRenamePath = (oldPath: string) => {
    if (!editingNameValue.trim() || editingNameValue.trim() === oldPath.split("/").pop()) {
      setEditingPath(null);
      return;
    }

    const pathParts = oldPath.split("/");
    pathParts.pop();
    const newPath = [...pathParts, editingNameValue.trim()].join("/");

    // Check conflict
    if (files.some((f) => f.path === newPath)) {
      alert("Error: Target path already exists.");
      return;
    }

    const updated = files.map((f) => {
      if (f.path === oldPath) {
        return {
          ...f,
          path: newPath,
          name: editingNameValue.trim(),
        };
      }
      if (f.path.startsWith(oldPath + "/")) {
        const subRelativePath = f.path.substring(oldPath.length);
        return {
          ...f,
          path: newPath + subRelativePath,
        };
      }
      return f;
    });

    saveFilesToStorage(updated);

    // Update Tabs
    const updatedTabs = openTabs.map((tab) => {
      if (tab === oldPath) return newPath;
      if (tab.startsWith(oldPath + "/")) {
        const subRelativePath = tab.substring(oldPath.length);
        return newPath + subRelativePath;
      }
      return tab;
    });
    setOpenTabs(updatedTabs);

    // Update active path
    if (activeFilePath === oldPath) {
      setActiveFilePath(newPath);
    } else if (activeFilePath.startsWith(oldPath + "/")) {
      const subRelativePath = activeFilePath.substring(oldPath.length);
      setActiveFilePath(newPath + subRelativePath);
    }

    setEditingPath(null);
    setTerminalLogs((prev) => [
      ...prev,
      { type: "system", text: `✏️ Renamed: ${oldPath} ➔ ${newPath}` },
    ]);
  };

  const handleUpdateContent = (newContent: string) => {
    if (!activeFilePath) return;
    const updated = files.map((f) => {
      if (f.path === activeFilePath) {
        return { ...f, content: newContent };
      }
      return f;
    });
    setFiles(updated);
  };

  const toggleFolderOpen = (path: string) => {
    const updated = files.map((f) => {
      if (f.path === path && f.isFolder) {
        return { ...f, isOpen: !f.isOpen };
      }
      return f;
    });
    setFiles(updated);
  };

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(updatedTabs);

    if (activeFilePath === path) {
      if (updatedTabs.length > 0) {
        setActiveFilePath(updatedTabs[updatedTabs.length - 1]);
      } else {
        setActiveFilePath("");
      }
    }
  };

  const selectFile = (path: string) => {
    setActiveFilePath(path);
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path]);
    }
  };

  // ----------------- Code Runner & Interpreter -----------------

  const runCurrentFile = () => {
    if (!activeFile || activeFile.isFolder) {
      setTerminalLogs((prev) => [
        ...prev,
        { type: "error", text: "❌ Error: No executable file selected." },
      ]);
      return;
    }

    if (activeFile.language !== "javascript") {
      setTerminalLogs((prev) => [
        ...prev,
        { type: "error", text: `❌ Run Engine currently supports executing JavaScript files. Selected file language is: ${activeFile.language || "unknown"}` },
      ]);
      return;
    }

    setIsTerminalExpanded(true);
    setTerminalLogs((prev) => [
      ...prev,
      { type: "input", text: `node ${activeFile.path}` },
      { type: "system", text: `[Executing ${activeFile.name} inside Virtual Sandbox...]` },
    ]);

    // Create sandbox environment capturing console.log output
    const outputBuffer: string[] = [];
    const customConsole = {
      log: (...args: any[]) => {
        const formatted = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        outputBuffer.push(formatted);
      },
      error: (...args: any[]) => {
        const formatted = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        outputBuffer.push(`🔴 Error: ${formatted}`);
      },
      warn: (...args: any[]) => {
        const formatted = args.map(arg => String(arg)).join(' ');
        outputBuffer.push(`🟡 Warn: ${formatted}`);
      }
    };

    try {
      // Create executable script bundling virtual modules or simple isolated code execution
      // We substitute global console with our console log wrapper
      const scriptExecutor = new Function("console", activeFile.content);
      scriptExecutor(customConsole);

      const logsToAdd = outputBuffer.map(log => ({
        type: log.startsWith("🔴") ? "error" as const : (log.startsWith("🟡") ? "system" as const : "output" as const),
        text: log
      }));

      setTerminalLogs((prev) => [
        ...prev,
        ...logsToAdd,
        { type: "system", text: `[Process terminated with exit code 0]` },
      ]);
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        ...outputBuffer.map(log => ({ type: "output" as const, text: log })),
        { type: "error", text: `❌ Runtime Exception: ${err.message}` },
        { type: "error", text: err.stack ? err.stack.split("\n")[0] : "" },
      ]);
    }
  };

  // ----------------- Terminal CLI Commands Engine -----------------

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const command = terminalInput.trim();
    if (!command) return;

    // Add to history
    const updatedHistory = [command, ...terminalHistory.slice(0, 49)];
    setTerminalHistory(updatedHistory);
    setTerminalHistoryIndex(-1);

    setTerminalLogs((prev) => [...prev, { type: "input", text: `${terminalDir === "/" ? "" : terminalDir}$ ${command}` }]);
    setTerminalInput("");

    const parts = command.split(" ");
    const baseCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (baseCmd) {
      case "help":
        setTerminalLogs((prev) => [
          ...prev,
          { type: "output", text: "🛠️ Available NEXUS Terminal commands:" },
          { type: "output", text: "  help                - Display this menu" },
          { type: "output", text: "  ls                  - List files in current directory" },
          { type: "output", text: "  cat <file>          - View details of a file" },
          { type: "output", text: "  node <file>         - Run JavaScript files inside the virtual sandbox" },
          { type: "output", text: "  clear               - Clear screen console history" },
          { type: "output", text: "  create <file> <txt> - Create a new file" },
          { type: "output", text: "  mkdir <name>        - Create a directory" },
          { type: "output", text: "  rm <path>           - Remove a file or folder" },
          { type: "output", text: "  ai <prompt>         - Directly query NEXUS AI about workspace code" },
          { type: "output", text: "  info                - Display details of NEXUS system specs" },
          { type: "output", text: "  reset               - Reset code tree back to standard templates" },
        ]);
        break;

      case "ls":
        // Show files inside current folder
        const items = files.filter((f) => {
          if (terminalDir === "/") {
            return f.path.split("/").length === 2; // e.g. /index.js or /src
          } else {
            return f.path.startsWith(terminalDir + "/") && f.path.substring(terminalDir.length + 1).split("/").length === 1;
          }
        });

        if (items.length === 0) {
          setTerminalLogs((prev) => [...prev, { type: "output", text: "(empty directory)" }]);
        } else {
          items.forEach((item) => {
            setTerminalLogs((prev) => [
              ...prev,
              {
                type: "output",
                text: item.isFolder 
                  ? `📂  \u001b[34m${item.name}/\u001b[0m` 
                  : `📄  ${item.name}`,
              },
            ]);
          });
        }
        break;

      case "cat":
        if (args.length === 0) {
          setTerminalLogs((prev) => [...prev, { type: "error", text: "Usage: cat <filename>" }]);
          break;
        }
        const targetFile = files.find((f) => !f.isFolder && (f.name === args[0] || f.path === args[0]));
        if (targetFile) {
          setTerminalLogs((prev) => [
            ...prev,
            { type: "output", text: targetFile.content },
          ]);
        } else {
          setTerminalLogs((prev) => [...prev, { type: "error", text: `cat: ${args[0]}: No such file` }]);
        }
        break;

      case "node":
      case "run":
        if (args.length === 0) {
          setTerminalLogs((prev) => [...prev, { type: "error", text: "Usage: node <filename>" }]);
          break;
        }
        const fileToExec = files.find((f) => !f.isFolder && (f.name === args[0] || f.path === args[0] || f.path === "/" + args[0]));
        if (fileToExec) {
          setActiveFilePath(fileToExec.path);
          // Small timeout to simulate load and run
          setTimeout(() => {
            runCurrentFile();
          }, 100);
        } else {
          setTerminalLogs((prev) => [...prev, { type: "error", text: `node: ${args[0]}: File not found` }]);
        }
        break;

      case "clear":
        setTerminalLogs([]);
        break;

      case "create":
        if (args.length < 2) {
          setTerminalLogs((prev) => [...prev, { type: "error", text: "Usage: create <filename> <content>" }]);
          break;
        }
        const name = args[0];
        const text = args.slice(1).join(" ");
        const path = terminalDir === "/" ? `/${name}` : `${terminalDir}/${name}`;

        if (files.some((f) => f.path === path)) {
          setTerminalLogs((prev) => [...prev, { type: "error", text: "File already exists" }]);
          break;
        }

        const newF: VirtualFile = {
          path,
          name,
          content: text,
          isFolder: false,
          language: name.split(".").pop() || "text",
        };
        saveFilesToStorage([...files, newF]);
        setTerminalLogs((prev) => [...prev, { type: "output", text: `File '${name}' created successfully.` }]);
        break;

      case "mkdir":
        if (args.length === 0) {
          setTerminalLogs((prev) => [...prev, { type: "error", text: "Usage: mkdir <foldername>" }]);
          break;
        }
        const folderName = args[0];
        const folderPath = terminalDir === "/" ? `/${folderName}` : `${terminalDir}/${folderName}`;

        if (files.some((f) => f.path === folderPath)) {
          setTerminalLogs((prev) => [...prev, { type: "error", text: "Directory already exists" }]);
          break;
        }

        const newFold: VirtualFile = {
          path: folderPath,
          name: folderName,
          content: "",
          isFolder: true,
          isOpen: true,
        };
        saveFilesToStorage([...files, newFold]);
        setTerminalLogs((prev) => [...prev, { type: "output", text: `Directory '${folderName}' created successfully.` }]);
        break;

      case "rm":
        if (args.length === 0) {
          setTerminalLogs((prev) => [...prev, { type: "error", text: "Usage: rm <path>" }]);
          break;
        }
        const pathToRemove = terminalDir === "/" ? `/${args[0]}` : `${terminalDir}/${args[0]}`;
        if (files.some((f) => f.path === pathToRemove)) {
          const filtered = files.filter((f) => f.path !== pathToRemove && !f.path.startsWith(pathToRemove + "/"));
          saveFilesToStorage(filtered);
          setTerminalLogs((prev) => [...prev, { type: "output", text: `Successfully removed '${args[0]}'` }]);
        } else {
          setTerminalLogs((prev) => [...prev, { type: "error", text: `rm: ${args[0]}: No such file or directory` }]);
        }
        break;

      case "info":
        setTerminalLogs((prev) => [
          ...prev,
          { type: "output", text: "🤖 NEXUS IDE Core System Status:" },
          { type: "output", text: "  - Environment: Next.js + React Cloud Container" },
          { type: "output", text: "  - Engine: Monaco Editor integration" },
          { type: "output", text: "  - Storage: Fully client-sandboxed browser memory (Local Storage)" },
          { type: "output", text: "  - AI Copilot: Gemini 3.5 Flash server-side pipeline" },
          { type: "output", text: `  - Total Files: ${files.length}` },
          { type: "output", text: `  - Connected Active File: ${activeFilePath || "None"}` },
        ]);
        break;

      case "reset":
        if (confirm("Reset everything back to templates? This will delete your custom code.")) {
          saveFilesToStorage(DEFAULT_FILES);
          setActiveFilePath("/index.html");
          setOpenTabs(["/index.html"]);
          setTerminalLogs((prev) => [...prev, { type: "system", text: "🔄 System restored to defaults." }]);
        }
        break;

      case "ai":
        if (args.length === 0) {
          setTerminalLogs((prev) => [...prev, { type: "error", text: "Usage: ai <prompt>" }]);
          break;
        }
        const promptText = args.join(" ");
        setTerminalLogs((prev) => [...prev, { type: "system", text: "🤖 Querying NEXUS AI..." }]);
        try {
          const res = await fetch("/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "terminal",
              prompt: promptText,
              currentFile: activeFile,
              fileTree: files,
            }),
          });
          const data = await res.json();
          if (data.error) {
            setTerminalLogs((prev) => [...prev, { type: "error", text: `AI Error: ${data.error}` }]);
          } else {
            setTerminalLogs((prev) => [
              ...prev,
              { type: "output", text: `🤖 AI Shell Assistant:` },
              { type: "output", text: data.result },
            ]);
          }
        } catch (err: any) {
          setTerminalLogs((prev) => [...prev, { type: "error", text: `Connection Failed: ${err.message}` }]);
        }
        break;

      default:
        setTerminalLogs((prev) => [
          ...prev,
          { type: "error", text: `sh: command not found: ${baseCmd}. Type 'help' to see valid utilities.` },
        ]);
        break;
    }
  };

  // Handle Terminal History navigation
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (terminalHistory.length > 0) {
        const nextIndex = terminalHistoryIndex + 1;
        if (nextIndex < terminalHistory.length) {
          setTerminalHistoryIndex(nextIndex);
          setTerminalInput(terminalHistory[nextIndex]);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = terminalHistoryIndex - 1;
      if (nextIndex >= 0) {
        setTerminalHistoryIndex(nextIndex);
        setTerminalInput(terminalHistory[nextIndex]);
      } else {
        setTerminalHistoryIndex(-1);
        setTerminalInput("");
      }
    }
  };

  // ----------------- Gemini AI Assistant Panel Features -----------------

  const handleSendChat = async (presetPrompt?: string) => {
    const promptToSend = presetPrompt || chatInput.trim();
    if (!promptToSend && !presetPrompt) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: promptToSend,
      timestamp: new Date(),
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsAiGenerating(true);

    try {
      // Map ChatMessage format to Gemini's expected parameters
      const history = updatedMessages.slice(0, -1).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          prompt: promptToSend,
          currentFile: activeFile,
          fileTree: files.map(f => ({ path: f.path, name: f.name, isFolder: f.isFolder })),
          chatHistory: history,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `🔴 Failed to generate content: ${data.error}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: data.result,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `🔴 Connection lost: ${err.message}. Please verify your network.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // AI Direct Editor Integration Action: Explain Code
  const handleAiAction = async (actionType: "explain" | "fix") => {
    if (!selectedCode) {
      alert("Please highlight/select a block of code inside the Monaco editor first!");
      return;
    }

    setIsAiPanelExpanded(true);
    setIsAiGenerating(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: `${actionType === "explain" ? "Explain" : "Identify and fix bugs in"} this highlighted block:\n\`\`\`javascript\n${selectedCode}\n\`\`\``,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          selectedCode: selectedCode,
          currentFile: activeFile,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `🔴 Error during AI Code operation: ${data.error}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: data.result,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `🔴 Code analysis failed: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Inline Code Prompt Generator (Ctrl+K overlay)
  const handlePromptBarSubmit = async () => {
    if (!promptBarValue.trim() || !activeFile) return;

    setPromptBarLoading(true);

    try {
      // Get selected text range or complete file context
      const contextPrompt = selectedCode 
        ? `Highlighted target snippet to modify:\n${selectedCode}\n\nInstruction: ${promptBarValue}`
        : `Complete file code:\n${activeFile.content}\n\nInstruction: ${promptBarValue}`;

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          prompt: contextPrompt,
          currentFile: activeFile,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert("Error executing inline generator: " + data.error);
      } else {
        // Strip markdown blocks if returned
        let generatedCode = data.result;
        if (generatedCode.startsWith("```")) {
          // Remove start codeblock syntax
          generatedCode = generatedCode.replace(/^```[a-zA-Z]*\n/, "");
          // Remove end codeblock syntax
          generatedCode = generatedCode.replace(/\n```$/, "");
        }

        if (editorInstance && editorSelectionRange) {
          // Replace selection in Monaco
          const op = {
            range: editorSelectionRange,
            text: generatedCode,
            forceMoveMarkers: true,
          };
          editorInstance.executeEdits("nexus-ai", [op]);
        } else {
          // Append code to active file
          handleUpdateContent(activeFile.content + "\n" + generatedCode);
        }

        setTerminalLogs((prev) => [
          ...prev,
          { type: "system", text: "✨ AI successfully injected changes to editor." }
        ]);
      }
    } catch (err: any) {
      alert("AI Inline execution failed: " + err.message);
    } finally {
      setPromptBarLoading(false);
      setShowPromptBar(false);
      setPromptBarValue("");
    }
  };

  // ----------------- Monaco Editor Handlers -----------------

  const handleEditorDidMount = (editor: any, monaco: any) => {
    setEditorInstance(editor);

    // Track text selection to empower localized AI operations
    editor.onDidChangeCursorSelection((e: any) => {
      const model = editor.getModel();
      if (model) {
        const selectionText = model.getValueInRange(e.selection);
        setSelectedCode(selectionText);
        setEditorSelectionRange(e.selection);
      }
    });

    // Custom commands inside Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      setShowPromptBar(true);
    });
  };

  // Render file tree recursively
  const renderFileTree = (currentPath: string = "/") => {
    // Find files directly inside currentPath
    const nodes = files.filter((f) => {
      const parent = f.path.substring(0, f.path.lastIndexOf("/"));
      const parentResolved = parent === "" ? "/" : parent;
      return parentResolved === currentPath;
    });

    // Sort folders first, then files
    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div className="flex flex-col gap-1 pl-2">
        {sortedNodes.map((node) => {
          const isSelected = activeFilePath === node.path;
          return (
            <div key={node.path} className="flex flex-col">
              <div
                className={`group flex items-center justify-between rounded px-2 py-1 text-xs transition-colors cursor-pointer ${
                  isSelected 
                    ? "bg-brand-deep/40 text-brand-accent border-l border-brand-accent" 
                    : "hover:bg-brand-card text-zinc-300"
                }`}
                onClick={() => {
                  if (node.isFolder) {
                    toggleFolderOpen(node.path);
                  } else {
                    selectFile(node.path);
                  }
                }}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {node.isFolder ? (
                    node.isOpen ? (
                      <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-zinc-500 shrink-0" />
                    )
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}

                  {node.isFolder ? (
                    node.isOpen ? (
                      <FolderOpen className="h-4 w-4 text-yellow-500 shrink-0" />
                    ) : (
                      <Folder className="h-4 w-4 text-yellow-600 shrink-0" />
                    )
                  ) : node.name.endsWith(".js") ? (
                    <FileCode className="h-4 w-4 text-yellow-500 shrink-0" />
                  ) : node.name.endsWith(".json") ? (
                    <FileCode className="h-4 w-4 text-brand-accent shrink-0" />
                  ) : node.name.endsWith(".md") ? (
                    <BookOpen className="h-4 w-4 text-brand-accent shrink-0" />
                  ) : (
                    <File className="h-4 w-4 text-zinc-400 shrink-0" />
                  )}

                  {editingPath === node.path ? (
                    <input
                      type="text"
                      className="bg-brand-accent/15 text-white rounded px-1 py-0.5 outline-none border border-brand-accent text-xs w-28"
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      onBlur={() => handleRenamePath(node.path)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenamePath(node.path);
                        if (e.key === "Escape") setEditingPath(null);
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate font-mono text-[11px]">{node.name}</span>
                  )}
                </div>

                {editingPath !== node.path && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {node.isFolder && (
                      <>
                        <button
                          title="Add File"
                          className="p-0.5 hover:text-brand-accent rounded hover:bg-brand-accent/15"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNewFileInput(node.path);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          title="Add Folder"
                          className="p-0.5 hover:text-brand-accent rounded hover:bg-brand-accent/15"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNewFolderInput(node.path);
                          }}
                        >
                          <FolderPlus className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    <button
                      title="Rename"
                      className="p-0.5 hover:text-brand-accent rounded hover:bg-brand-accent/15"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPath(node.path);
                        setEditingNameValue(node.name);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      title="Delete"
                      className="p-0.5 hover:text-red-400 rounded hover:bg-brand-accent/15"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePath(node.path);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Collapsed input templates */}
              {node.isFolder && showNewFileInput === node.path && (
                <div className="flex items-center gap-1 pl-4 pr-2 py-1 bg-brand-card rounded" onClick={(e) => e.stopPropagation()}>
                  <File className="h-3 w-3 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="filename.js..."
                    className="bg-brand-accent/15 border border-brand-accent/20 rounded px-1.5 py-0.5 text-[10px] w-full text-white outline-none"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onBlur={() => {
                      if (!newFileName) setShowNewFileInput(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFile(node.path);
                      if (e.key === "Escape") setShowNewFileInput(null);
                    }}
                    autoFocus
                  />
                  <button onClick={() => handleCreateFile(node.path)}>
                    <Check className="h-3 w-3 text-brand-accent" />
                  </button>
                </div>
              )}

              {node.isFolder && showNewFolderInput === node.path && (
                <div className="flex items-center gap-1 pl-4 pr-2 py-1 bg-brand-card rounded" onClick={(e) => e.stopPropagation()}>
                  <Folder className="h-3 w-3 text-yellow-500" />
                  <input
                    type="text"
                    placeholder="Folder name..."
                    className="bg-brand-accent/15 border border-brand-accent/20 rounded px-1.5 py-0.5 text-[10px] w-full text-white outline-none"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onBlur={() => {
                      if (!newFolderName) setShowNewFolderInput(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateFolder(node.path);
                      if (e.key === "Escape") setShowNewFolderInput(null);
                    }}
                    autoFocus
                  />
                  <button onClick={() => handleCreateFolder(node.path)}>
                    <Check className="h-3 w-3 text-brand-accent" />
                  </button>
                </div>
              )}

              {/* Recursive directories */}
              {node.isFolder && node.isOpen && (
                <div className="border-l border-brand-accent/1060 ml-2">
                  {renderFileTree(node.path)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full w-full flex-col bg-brand-bg font-sans text-brand-text overflow-hidden">
      
      {/* ----------------- شريط أدوات المحرر ----------------- */}
      <div className="shrink-0 flex items-center justify-between h-9 bg-brand-bg border-b border-brand-accent/10 px-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={isSidebarExpanded ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي'}
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="p-1.5 rounded hover:bg-brand-accent/10 text-zinc-400 hover:text-brand-accent transition-colors cursor-pointer"
          >
            {isSidebarExpanded ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>
          {activeFile && (
            <span className="text-[10px] text-zinc-500 font-mono ml-2 truncate max-w-[200px]">
              {activeFile.path}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="بحث في الكود"
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true });
              document.dispatchEvent(event);
            }}
            disabled={!activeFile}
            className="p-1.5 rounded text-zinc-400 hover:text-brand-accent hover:bg-brand-accent/10 disabled:opacity-40 cursor-pointer"
            title="بحث"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="مكتبة الأيقونات"
            onClick={() => setShowPromptBar(true)}
            className="p-1.5 rounded text-zinc-400 hover:text-brand-accent hover:bg-brand-accent/10 cursor-pointer"
            title="مكتبة الأيقونات"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="تنسيق الكود"
            onClick={async () => {
              if (!activeFile) return;
              try {
                const res = await fetch('/api/format', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: activeFile.content }),
                });
                const data = await res.json();
                if (data.code) {
                  handleUpdateContent(data.code);
                }
              } catch (e) {}
            }}
            disabled={!activeFile}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-zinc-300 hover:text-brand-accent hover:bg-brand-accent/10 disabled:opacity-40 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden md:inline">تنسيق</span>
          </button>
          <button
            type="button"
            aria-label="فحص الأمان"
            onClick={async () => {
              if (!activeFile) return;
              try {
                const res = await fetch('/api/lint', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: activeFile.content, isReact: activeFile.language === 'javascript' }),
                });
                const data = await res.json();
                if (data.issues) {
                  alert('تم العثور على ' + data.issues.length + ' مشكلة');
                }
              } catch (e) {}
            }}
            disabled={!activeFile}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-zinc-300 hover:text-brand-accent hover:bg-brand-accent/10 disabled:opacity-40 cursor-pointer"
          >
            <Bug className="w-3 h-3" />
            <span className="hidden md:inline">فحص</span>
          </button>
          <button
            type="button"
            aria-label="حفظ الملف"
            onClick={() => {
              setTerminalLogs((prev) => [...prev, { type: "system", text: "تم الحفظ" }]);
            }}
            disabled={!activeFile}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-zinc-300 hover:text-brand-accent hover:bg-brand-accent/10 disabled:opacity-40 cursor-pointer"
          >
            <Save className="w-3 h-3" />
            <span className="hidden md:inline">حفظ</span>
          </button>
          <button
            type="button"
            aria-label="مسح الكود"
            onClick={() => {
              if (!activeFile) return;
              if (confirm('هل تريد مسح محتوى ' + activeFile.name + '؟')) {
                handleUpdateContent('');
              }
            }}
            disabled={!activeFile}
            className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 cursor-pointer"
            title="مسح الكود"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ----------------- Floating Prompt Bar (Ctrl+K) ----------------- */}
      <AnimatePresence>
        {showPromptBar && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-24 px-4">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="w-full max-w-xl rounded-xl border border-brand-accent/20 bg-brand-card p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-brand-accent/15 pb-2 mb-3">
                <div className="flex items-center gap-2 text-brand-accent text-xs font-medium">
                  <Sparkles className="h-4 w-4" />
                  <span>NEXUS Inline AI Generator (Ctrl+K)</span>
                </div>
                <button
                  onClick={() => setShowPromptBar(false)}
                  className="rounded p-0.5 text-zinc-500 hover:bg-brand-accent/15 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selectedCode ? (
                <div className="mb-3 rounded border border-brand-accent/15 bg-brand-bg p-2 text-[10px] font-mono text-zinc-400 max-h-24 overflow-y-auto">
                  <div className="text-zinc-500 border-b border-brand-accent/15 pb-1 mb-1">Targeting highlighted selection:</div>
                  {selectedCode}
                </div>
              ) : (
                <div className="mb-3 text-[11px] text-zinc-400 bg-brand-deep/20 text-brand-accent rounded p-2 flex items-start gap-2 border border-brand-deep">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>No selection detected. NEXUS AI will append generated logic or refactor the entire active file.</span>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Write a function that checks for prime numbers..."
                  className="flex-1 rounded-md border border-brand-accent/20 bg-brand-bg px-3 py-2 text-sm text-white outline-none focus:border-brand-accent placeholder-zinc-500"
                  value={promptBarValue}
                  onChange={(e) => setPromptBarValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePromptBarSubmit();
                    if (e.key === "Escape") setShowPromptBar(false);
                  }}
                  autoFocus
                />
                <button
                  disabled={promptBarLoading}
                  onClick={handlePromptBarSubmit}
                  className="flex items-center justify-center rounded-md bg-brand-accent px-4 py-2 hover:bg-brand-accent transition-colors disabled:opacity-50"
                >
                  {promptBarLoading ? (
                    <Activity className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
              <div className="mt-2 text-[10px] text-zinc-500 text-right">
                Press Enter to generate, Esc to cancel
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- Main Workspace Panels ----------------- */}
      <div className="flex flex-1 w-full overflow-hidden">
        
        {/* 1. SIDEBAR (Virtual File Explorer) */}
        <AnimatePresence initial={false}>
          {isSidebarExpanded && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex h-full flex-col border-r border-brand-accent/15 bg-brand-card/50 shrink-0 overflow-hidden absolute md:relative right-0 top-0 bottom-0 z-30 md:z-auto w-[240px]"
            >
              {/* Explorer Header */}
              <div className="flex h-10 w-full items-center justify-between border-b border-brand-accent/15 px-3 bg-brand-card/30 shrink-0">
                <span className="font-mono text-xs font-semibold tracking-wider text-zinc-400">
                  WORKSPACE EXPLORER
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    title="New File"
                    onClick={() => setShowNewFileInput("/")}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-brand-accent/15 rounded transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    title="New Folder"
                    onClick={() => setShowNewFolderInput("/")}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-brand-accent/15 rounded transition-colors"
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Local File List Area */}
              <div className="flex-1 overflow-y-auto py-2">
                
                {/* Root New File Form */}
                {showNewFileInput === "/" && (
                  <div className="mx-2 mb-2 flex items-center gap-1 p-1 bg-brand-bg rounded border border-brand-accent/15">
                    <File className="h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="filename.js..."
                      className="bg-transparent border-none rounded p-0.5 text-xs w-full text-white outline-none placeholder-zinc-600"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onBlur={() => {
                        if (!newFileName) setShowNewFileInput(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateFile("/");
                        if (e.key === "Escape") setShowNewFileInput(null);
                      }}
                      autoFocus
                    />
                    <button onClick={() => handleCreateFile("/")} className="p-0.5 hover:text-brand-accent">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Root New Folder Form */}
                {showNewFolderInput === "/" && (
                  <div className="mx-2 mb-2 flex items-center gap-1 p-1 bg-brand-bg rounded border border-brand-accent/15">
                    <Folder className="h-3.5 w-3.5 text-yellow-500" />
                    <input
                      type="text"
                      placeholder="Folder name..."
                      className="bg-transparent border-none rounded p-0.5 text-xs w-full text-white outline-none placeholder-zinc-600"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={() => {
                        if (!newFolderName) setShowNewFolderInput(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateFolder("/");
                        if (e.key === "Escape") setShowNewFolderInput(null);
                      }}
                      autoFocus
                    />
                    <button onClick={() => handleCreateFolder("/")} className="p-0.5 hover:text-brand-accent">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {renderFileTree("/")}
              </div>

              {/* Status Section inside Sidebar */}
              <div className="border-t border-brand-accent/15 bg-brand-bg p-2.5 font-mono text-[10px] text-zinc-500">
                <div className="flex items-center gap-1.5 mb-1 text-zinc-400">
                  <Database className="h-3.5 w-3.5 text-brand-accent" />
                  <span>Sandbox Database</span>
                </div>
                <div>Storage: Persistent browser memory</div>
                <div className="flex justify-between mt-1 text-zinc-600">
                  <span>Files: {files.length}</span>
                  <span>Quota: 100% Free</span>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* TOGGLE SIDEBAR BUTTON */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="flex h-full w-2 items-center justify-center border-r border-brand-accent/15 bg-brand-bg hover:bg-brand-card transition-colors shrink-0"
          title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <div className="h-6 w-1 rounded-full bg-brand-accent/15" />
        </button>

        {/* 2. EDITOR AND TERMINAL SECTION (Middle) */}
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          
          {/* Tabs header */}
          <div className="flex h-10 w-full items-center justify-between border-b border-brand-accent/15 bg-brand-bg overflow-x-auto shrink-0 scrollbar-none">
            <div className="flex h-full">
              {openTabs.map((tabPath) => {
                const tabFile = files.find((f) => f.path === tabPath);
                if (!tabFile) return null;
                const isActive = activeFilePath === tabPath;
                return (
                  <div
                    key={tabPath}
                    onClick={() => selectFile(tabPath)}
                    className={`group flex h-full items-center gap-2 border-r border-brand-accent/15 px-4 py-1.5 text-xs transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-brand-card text-brand-text border-t-2 border-brand-accent font-medium" 
                        : "bg-brand-bg text-zinc-400 hover:bg-brand-card/60 hover:text-zinc-200"
                    }`}
                  >
                    {tabFile.isFolder ? (
                      <Folder className="h-3.5 w-3.5 text-yellow-500" />
                    ) : tabFile.name.endsWith(".js") ? (
                      <FileCode className="h-3.5 w-3.5 text-yellow-500" />
                    ) : tabFile.name.endsWith(".md") ? (
                      <BookOpen className="h-3.5 w-3.5 text-brand-accent" />
                    ) : (
                      <File className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    <span className="font-mono text-[11px]">{tabFile.name}</span>
                    <button
                      onClick={(e) => closeTab(tabPath, e)}
                      className="p-0.5 rounded-full hover:bg-brand-accent/15 text-zinc-500 hover:text-brand-text"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Clear tabs or stats */}
            {openTabs.length > 0 && (
              <button
                onClick={() => setOpenTabs([])}
                className="px-3 text-[10px] text-zinc-500 hover:text-red-400 font-mono"
              >
                Close All
              </button>
            )}
          </div>

          {/* Core Monaco Editor Frame */}
          <div className="flex-1 relative bg-brand-card">
            {activeFile ? (
              <div className="h-full w-full">
                {/* Editor floating toolbar */}
                <div className="absolute right-4 top-2 z-10 flex gap-1 bg-brand-card/90 backdrop-blur border border-brand-accent/15 rounded p-1 shadow-md opacity-80 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleAiAction("explain")}
                    disabled={!selectedCode}
                    className="flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-mono font-medium text-zinc-300 hover:text-brand-accent disabled:opacity-40"
                    title="Explain highlighted code with Gemini AI"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Explain Selected</span>
                  </button>
                  <button
                    onClick={() => handleAiAction("fix")}
                    disabled={!selectedCode}
                    className="flex items-center gap-1.5 border-l border-brand-accent/15 pl-2 rounded px-2 py-1 text-[10px] font-mono font-medium text-zinc-300 hover:text-brand-accent disabled:opacity-40"
                    title="Auto-fix selected bugs using Gemini"
                  >
                    <Bug className="h-3.5 w-3.5" />
                    <span>Fix Bugs</span>
                  </button>
                </div>

                <MonacoEditor
                  height="100%"
                  theme="vs-dark"
                  path={activeFile.path}
                  language={activeFile.language}
                  value={activeFile.content}
                  onChange={(val) => handleUpdateContent(val || "")}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontFamily: "var(--font-mono)",
                    tabSize: 2,
                    automaticLayout: true,
                    lineNumbers: "on",
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    padding: { top: 12 },
                    lineHeight: 22,
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 bg-brand-bg">
                <Sparkles className="h-12 w-12 text-brand-accent/20 mb-4 animate-pulse" />
                <h3 className="font-semibold text-zinc-300 mb-1 text-sm">No Active Document Open</h3>
                <p className="text-xs text-zinc-500 max-w-sm">
                  Select an existing file in the workspace tree or click the <span className="text-zinc-400 font-semibold">plus icon</span> inside Explorer sidebar to initiate.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ----------------- Status bar footer ----------------- */}
      <footer className="flex h-6 w-full items-center justify-between border-t border-brand-accent/15 bg-brand-bg px-4 font-mono text-[10px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-brand-accent">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
            </span>
            <span>SYSTEM_ONLINE</span>
          </div>
          <div>Active Document: {activeFile ? activeFile.name : "None"}</div>
          <div className="hidden sm:inline">Active Language: {activeFile ? activeFile.language : "None"}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:inline">Line Col: 1:1</div>
          <div className="flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            <span>Node Sandbox Mode</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
