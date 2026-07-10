'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FilePlus, FolderPlus, Trash2, Edit3, ChevronRight, ChevronDown,
  Search, FileText, Folder, FolderOpen
} from 'lucide-react';
import type { FileNode } from '@/lib/filesystem/types';
import { getLanguageIcon } from '@/lib/filesystem/types';
import { useI18n } from '@/lib/i18n';

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string | null;
  onOpenFile: (fileId: string) => void;
  onCreateFile: (name: string, parentId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
}

interface TreeNodeProps {
  node: FileNode;
  files: FileNode[];
  level: number;
  activeFileId: string | null;
  onOpenFile: (fileId: string) => void;
  onCreateFile: (name: string, parentId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
}

function TreeNode({
  node, files, level, activeFileId, onOpenFile, onCreateFile, onCreateFolder, onDeleteFile, onRenameFile,
}: TreeNodeProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [isCreating, setIsCreating] = useState<null | 'file' | 'folder'>(null);
  const [newItemName, setNewItemName] = useState('');

  const children = files.filter(f => f.parentId === node.id);
  const isActive = node.id === activeFileId && node.type === 'file';

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== node.name) {
      onRenameFile(node.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleCreateSubmit = () => {
    if (newItemName.trim()) {
      if (isCreating === 'file') {
        onCreateFile(newItemName.trim(), node.type === 'folder' ? node.id : null);
      } else {
        onCreateFolder(newItemName.trim(), node.type === 'folder' ? node.id : null);
      }
    }
    setIsCreating(null);
    setNewItemName('');
    setExpanded(true);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors text-xs ${
          isActive ? 'bg-brand-accent/10 text-brand-accent' : 'text-zinc-300 hover:bg-brand-accent/5'
        }`}
        style={{ paddingRight: `${level * 12 + 8}px` }}
        onClick={() => {
          if (node.type === 'folder') {
            setExpanded(!expanded);
          } else {
            onOpenFile(node.id);
          }
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {node.type === 'folder' ? (
          <>
            {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
            {expanded ? <FolderOpen className="w-3.5 h-3.5 text-brand-accent shrink-0" /> : <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <span className="text-xs shrink-0">{getLanguageIcon(node.name)}</span>
          </>
        )}
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setIsRenaming(false); }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-brand-bg border border-brand-accent/30 rounded px-1 text-xs text-brand-text outline-none"
            autoFocus
          />
        ) : (
          <span className="flex-1 truncate font-mono">{node.name}</span>
        )}
        {showActions && !isRenaming && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label={t('files.newFile')}
              onClick={(e) => { e.stopPropagation(); setIsCreating('file'); setExpanded(true); }}
              className="p-0.5 rounded hover:bg-brand-accent/20 text-zinc-500 hover:text-brand-accent"
            >
              <FilePlus className="w-3 h-3" />
            </button>
            {node.type === 'folder' && (
              <button
                type="button"
                aria-label={t('files.newFolder')}
                onClick={(e) => { e.stopPropagation(); setIsCreating('folder'); setExpanded(true); }}
                className="p-0.5 rounded hover:bg-brand-accent/20 text-zinc-500 hover:text-brand-accent"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              aria-label={t('files.rename')}
              onClick={(e) => { e.stopPropagation(); setIsRenaming(true); setRenameValue(node.name); }}
              className="p-0.5 rounded hover:bg-brand-accent/20 text-zinc-500 hover:text-brand-accent"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              type="button"
              aria-label={t('files.delete')}
              onClick={(e) => { e.stopPropagation(); onDeleteFile(node.id); }}
              className="p-0.5 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* New item input */}
      {isCreating && (
        <div
          className="flex items-center gap-1.5 px-2 py-1"
          style={{ paddingRight: `${(level + 1) * 12 + 8}px` }}
        >
          {isCreating === 'file' ? <FileText className="w-3 h-3 text-zinc-400" /> : <Folder className="w-3 h-3 text-zinc-400" />}
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onBlur={handleCreateSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSubmit(); if (e.key === 'Escape') { setIsCreating(null); setNewItemName(''); } }}
            placeholder={isCreating === 'file' ? t('files.fileNamePlaceholder') : t('files.folderNamePlaceholder')}
            className="flex-1 bg-brand-bg border border-brand-accent/30 rounded px-1 text-xs text-brand-text outline-none placeholder:text-zinc-600"
            autoFocus
          />
        </div>
      )}

      {/* Children */}
      <AnimatePresence initial={false}>
        {node.type === 'folder' && expanded && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {children.map(child => (
              <TreeNode
                key={child.id}
                node={child}
                files={files}
                level={level + 1}
                activeFileId={activeFileId}
                onOpenFile={onOpenFile}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onDeleteFile={onDeleteFile}
                onRenameFile={onRenameFile}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FileExplorer({
  files, activeFileId, onOpenFile, onCreateFile, onCreateFolder, onDeleteFile, onRenameFile,
}: FileExplorerProps) {
  const { t, dir } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const rootFiles = files.filter(f => f.parentId === null);

  const filteredFiles = searchQuery
    ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : rootFiles;

  return (
    <div className="flex flex-col h-full bg-brand-bg border-l border-brand-accent/10 select-none" dir={dir}>
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-brand-accent/10 flex items-center justify-between">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{t('files.explorerTitle')}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label={t('files.newFile')}
            onClick={() => onCreateFile(prompt('اسم الملف الجديد:') || '', null)}
            className="p-1 rounded hover:bg-brand-accent/10 text-zinc-500 hover:text-brand-accent transition-colors cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label={t('files.newFolder')}
            onClick={() => onCreateFolder(prompt('اسم المجلد الجديد:') || '', null)}
            className="p-1 rounded hover:bg-brand-accent/10 text-zinc-500 hover:text-brand-accent transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 px-2 py-2 border-b border-brand-accent/10">
        <div className="relative">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('files.searchPlaceholder')}
            className="w-full bg-brand-card/50 border border-brand-accent/10 rounded-lg pr-7 pl-2 py-1.5 text-[11px] text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-brand-accent/30"
          />
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <FileText className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="text-[10px] text-zinc-600">{t('files.empty')}</p>
          </div>
        ) : searchQuery ? (
          // Flat list when searching
          filteredFiles.map(file => (
            <div
              key={file.id}
              className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors text-xs ${
                file.id === activeFileId ? 'bg-brand-accent/10 text-brand-accent' : 'text-zinc-300 hover:bg-brand-accent/5'
              }`}
              onClick={() => file.type === 'file' && onOpenFile(file.id)}
            >
              <span className="text-xs">{getLanguageIcon(file.name)}</span>
              <span className="flex-1 truncate font-mono">{file.name}</span>
            </div>
          ))
        ) : (
          rootFiles.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              files={files}
              level={0}
              activeFileId={activeFileId}
              onOpenFile={onOpenFile}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-3 py-1.5 border-t border-brand-accent/10 text-[9px] text-zinc-600 font-mono text-center">
        {files.length} {t('files.itemUnit')}
      </div>
    </div>
  );
}
