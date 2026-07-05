'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FileNode, EditorTab } from '@/lib/filesystem/types';
import {
  getAllFiles,
  getChildren,
  createFile,
  updateFileContent,
  deleteFile,
  renameFile,
  seedDefaultFiles,
} from '@/lib/filesystem/db';
import { getLanguageFromFilename } from '@/lib/filesystem/types';

export function useFileSystem() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load files on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      await seedDefaultFiles();
      const allFiles = await getAllFiles();
      if (mounted) {
        setFiles(allFiles);
        setIsLoading(false);
        // Auto-open index.html if it exists — pass allFiles directly
        const indexFile = allFiles.find(f => f.name === 'index.html');
        if (indexFile) {
          // Open directly without relying on stale `files` state
          const newTab: EditorTab = {
            id: `tab_${indexFile.id}`,
            fileId: indexFile.id,
            name: indexFile.name,
            path: indexFile.path,
            isDirty: false,
            language: indexFile.language || getLanguageFromFilename(indexFile.name),
          };
          setOpenTabs([newTab]);
          setActiveTabId(newTab.id);
        }
      }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshFiles = useCallback(async () => {
    const allFiles = await getAllFiles();
    setFiles(allFiles);
  }, []);

  const openFile = useCallback(async (fileId: string) => {
    // Read fresh from DB to avoid stale state
    const { getFile } = await import('@/lib/filesystem/db');
    const file = await getFile(fileId);
    if (!file) return;
    const existingTab = openTabs.find(t => t.fileId === fileId);
    if (!existingTab) {
      const newTab: EditorTab = {
        id: `tab_${fileId}`,
        fileId: file.id,
        name: file.name,
        path: file.path,
        isDirty: false,
        language: file.language || getLanguageFromFilename(file.name),
      };
      setOpenTabs(prev => [...prev, newTab]);
    }
    setActiveTabId(`tab_${fileId}`);
  }, [openTabs]);

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs(prev => {
      const idx = prev.findIndex(t => t.id === tabId);
      if (idx === -1) return prev;
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        const nextTab = newTabs[idx] || newTabs[idx - 1] || newTabs[0] || null;
        setActiveTabId(nextTab?.id || null);
      }
      return newTabs;
    });
  }, [activeTabId]);

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, [activeTabId]);

  const markTabDirty = useCallback((tabId: string, dirty: boolean) => {
    setOpenTabs(prev => prev.map(t => t.id === tabId ? { ...t, isDirty: dirty } : t));
  }, []);

  const saveFileContent = useCallback(async (fileId: string, content: string) => {
    await updateFileContent(fileId, content);
    const tabId = `tab_${fileId}`;
    markTabDirty(tabId, false);
    await refreshFiles();
  }, [markTabDirty, refreshFiles]);

  const createNewFile = useCallback(async (name: string, parentId: string | null = null) => {
    const parentPath = parentId ? files.find(f => f.id === parentId)?.path || '' : '';
    const path = `${parentPath}/${name}`;
    const language = getLanguageFromFilename(name);
    const newFile = await createFile({
      name,
      path,
      type: 'file',
      parentId,
      content: '',
      language,
    });
    await refreshFiles();
    await openFile(newFile.id);
    return newFile;
  }, [files, refreshFiles, openFile]);

  const createNewFolder = useCallback(async (name: string, parentId: string | null = null) => {
    const parentPath = parentId ? files.find(f => f.id === parentId)?.path || '' : '';
    const path = `${parentPath}/${name}`;
    const newFolder = await createFile({
      name,
      path,
      type: 'folder',
      parentId,
    });
    await refreshFiles();
    return newFolder;
  }, [files, refreshFiles]);

  const deleteFileById = useCallback(async (fileId: string) => {
    await deleteFile(fileId);
    // Close any open tabs for this file
    setOpenTabs(prev => prev.filter(t => t.fileId !== fileId));
    if (activeTabId === `tab_${fileId}`) {
      setActiveTabId(null);
    }
    await refreshFiles();
  }, [activeTabId, refreshFiles]);

  const renameFileById = useCallback(async (fileId: string, newName: string) => {
    await renameFile(fileId, newName);
    // Update open tabs
    setOpenTabs(prev => prev.map(t => t.fileId === fileId ? { ...t, name: newName } : t));
    await refreshFiles();
  }, [refreshFiles]);

  const getActiveFile = useCallback((): FileNode | null => {
    if (!activeTabId) return null;
    const tab = openTabs.find(t => t.id === activeTabId);
    if (!tab) return null;
    return files.find(f => f.id === tab.fileId) || null;
  }, [activeTabId, openTabs, files]);

  const getActiveFileContent = useCallback((): string => {
    const file = getActiveFile();
    return file?.content || '';
  }, [getActiveFile]);

  // Get the "preview" file — the active HTML file, or index.html if no HTML is open
  const getPreviewFile = useCallback((): FileNode | null => {
    const active = getActiveFile();
    if (active && (active.language === 'html' || active.name.endsWith('.html') || active.name.endsWith('.htm'))) {
      return active;
    }
    // Fallback to index.html
    return files.find(f => f.name === 'index.html') || files.find(f => f.language === 'html') || null;
  }, [getActiveFile, files]);

  return {
    files,
    openTabs,
    activeTabId,
    activeTab: openTabs.find(t => t.id === activeTabId) || null,
    activeFile: getActiveFile(),
    activeContent: getActiveFileContent(),
    previewFile: getPreviewFile(),
    isLoading,
    openFile,
    closeTab,
    setActiveTab,
    markTabDirty,
    saveFileContent,
    createNewFile,
    createNewFolder,
    deleteFileById,
    renameFileById,
    refreshFiles,
    getChildren: (parentId: string | null) => files.filter(f => f.parentId === parentId),
  };
}
