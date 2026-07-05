'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { getLanguageIcon } from '@/lib/filesystem/types';
import type { EditorTab } from '@/lib/filesystem/types';

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

export default function EditorTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}: EditorTabsProps) {
  if (tabs.length === 0) {
    return (
      <div className="flex items-center h-9 bg-brand-bg border-b border-brand-accent/10 px-4">
        <span className="text-[11px] text-zinc-600 font-mono">لا توجد ملفات مفتوحة</span>
      </div>
    );
  }

  return (
    <div className="flex items-center h-9 bg-brand-bg border-b border-brand-accent/10 overflow-x-auto hide-scrollbar">
      <AnimatePresence initial={false}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className={`group flex items-center gap-2 px-3 h-full border-l border-brand-accent/10 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[#0f0f0f] text-brand-text'
                  : 'bg-brand-bg text-zinc-400 hover:bg-brand-bg/60 hover:text-zinc-200'
              }`}
              onClick={() => onSelectTab(tab.id)}
            >
              <span className="text-xs">{getLanguageIcon(tab.name)}</span>
              <span className={`text-xs font-mono whitespace-nowrap ${tab.isDirty ? 'italic' : ''}`}>
                {tab.name}
                {tab.isDirty && <span className="text-brand-accent ml-1">●</span>}
              </span>
              <button
                type="button"
                aria-label={`إغلاق ${tab.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 rounded hover:bg-brand-accent/20 text-zinc-500 hover:text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
