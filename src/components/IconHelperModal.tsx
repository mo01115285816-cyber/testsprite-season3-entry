'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Search, Smile, Check, Info, Palette, Sliders, Type, Copy
} from 'lucide-react';
import { ICON_LIBRARY } from '../lib/icons';
import { useI18n } from '@/lib/i18n';

interface IconHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  insertCodeAtCursor: (code: string) => void;
}

export default function IconHelperModal({
  isOpen,
  onClose,
  insertCodeAtCursor,
}: IconHelperModalProps) {
  const { t, dir } = useI18n();
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [iconSize, setIconSize] = useState('24');
  const [iconStrokeWidth, setIconStrokeWidth] = useState('2');
  const [iconColor, setIconColor] = useState('currentColor');
  const [iconCustomColor, setIconCustomColor] = useState('');

  const [copiedIconId, setCopiedIconId] = useState<string | null>(null);

  const finalColor = iconColor === 'custom' ? (iconCustomColor || '#10b981') : iconColor;

  const filteredIcons = useMemo(() => {
    if (!iconSearchQuery.trim()) return ICON_LIBRARY;
    const query = iconSearchQuery.trim().toLowerCase();
    return ICON_LIBRARY.filter(icon => 
      icon.name.includes(query) || 
      icon.label.toLowerCase().includes(query)
    );
  }, [iconSearchQuery]);

  const insertIconCode = (iconName: string, pathData: string) => {
    const formattedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${finalColor}" stroke-width="${iconStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${iconName}">${pathData}</svg>`;
    insertCodeAtCursor(formattedSVG);
    onClose();
  };

  const copyCDNLink = () => {
    const link = `<script src="https://unpkg.com/lucide@latest"></script>`;
    navigator.clipboard.writeText(link);
    setCopiedIconId('cdn');
    setTimeout(() => setCopiedIconId(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={dir}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#121215]/85 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#121215] border border-white/5 rounded-[30px] shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col relative overflow-hidden"
          >
            {/* Header banner glow */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-zinc-500 via-zinc-300 to-slate-500" />

            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-zinc-500/10 border border-zinc-500/20 rounded-xl text-white">
                  <Smile className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="text-sm sm:text-base font-black text-zinc-100">{t('icons.modalTitle')}</h3>
                  <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">{t('icons.modalDesc')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-300 hover:bg-[#121215] p-1.5 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main content grid */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
              
              {/* Sidebar controls (Col 1) */}
              <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-l border-white/5 p-4 shrink-0 overflow-y-auto select-none flex flex-col gap-4 custom-scrollbar">
                
                {/* 1. Size control */}
                <div className="bg-[#09090b]/50 p-3 rounded-xl border border-white/5">
                  <label className="text-[11px] font-black text-zinc-400 flex items-center gap-1.5 mb-2.5">
                    <Type className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t('icons.sizeLabel')}</span>
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="64"
                    value={iconSize}
                    onChange={(e) => setIconSize(e.target.value)}
                    className="w-full accent-zinc-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono font-bold mt-1.5">
                    <span>12px</span>
                    <span className="text-white">{iconSize}px</span>
                    <span>64px</span>
                  </div>
                </div>

                {/* 2. Stroke width control */}
                <div className="bg-[#09090b]/50 p-3 rounded-xl border border-white/5">
                  <label className="text-[11px] font-black text-zinc-400 flex items-center gap-1.5 mb-2.5">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t('icons.strokeWidthLabel')}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3.5"
                    step="0.5"
                    value={iconStrokeWidth}
                    onChange={(e) => setIconStrokeWidth(e.target.value)}
                    className="w-full accent-zinc-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono font-bold mt-1.5">
                    <span>1px</span>
                    <span className="text-white">{iconStrokeWidth}px</span>
                    <span>3.5px</span>
                  </div>
                </div>

                {/* 3. Color Controls */}
                <div className="bg-[#09090b]/50 p-3 rounded-xl border border-white/5 flex flex-col gap-2.5">
                  <label className="text-[11px] font-black text-zinc-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t('icons.colorLabel')}</span>
                  </label>
                  <select
                    value={iconColor}
                    onChange={(e) => setIconColor(e.target.value)}
                    className="w-full bg-[#09090b] border border-white/5 text-xs text-zinc-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-zinc-500/50"
                  >
                    <option value="currentColor">{t('icons.colorAuto')}</option>
                    <option value="#ffffff">{t('icons.colorWhite')}</option>
                    <option value="#10b981">{t('icons.colorEmerald')}</option>
                    <option value="#3b82f6">{t('icons.colorSky')}</option>
                    <option value="#f59e0b">{t('icons.colorGold')}</option>
                    <option value="#ef4444">{t('icons.colorDarkRed')}</option>
                    <option value="custom">{t('icons.colorCustom')}</option>
                  </select>

                  {iconColor === 'custom' && (
                    <input
                      type="text"
                      placeholder="#ff00ff"
                      value={iconCustomColor}
                      onChange={(e) => setIconCustomColor(e.target.value)}
                      className="w-full text-center bg-[#09090b] border border-white/5 text-xs text-zinc-200 rounded-lg py-1.5 px-2 focus:outline-none focus:border-zinc-500/50 font-mono"
                    />
                  )}
                </div>

              </div>

              {/* Grid content space (Col 2-4) */}
              <div className="lg:col-span-3 flex flex-col min-h-0 bg-[#020202]/40 p-4">
                
                {/* Search Bar input */}
                <div className="relative mb-4 shrink-0 select-none">
                  <input
                    type="text"
                    value={iconSearchQuery}
                    onChange={(e) => setIconSearchQuery(e.target.value)}
                    placeholder={t('icons.searchPlaceholder')}
                    className="w-full bg-[#09090b] border border-white/5 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-zinc-200 placeholder-slate-650 focus:outline-[#10b981]/50 text-right leading-none font-sans font-bold"
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute top-3.5 right-3.5" />
                </div>

                {/* Icons Grid scroll area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {filteredIcons.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {filteredIcons.map((icon) => (
                        <button
                          key={icon.name}
                          onClick={() => insertIconCode(icon.name, icon.path)}
                          className="p-3 bg-[#121215]/40 hover:bg-zinc-900 hover:border-zinc-500/30 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center transition-all group cursor-pointer active:scale-95 text-zinc-300"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={finalColor}
                            strokeWidth={iconStrokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mb-2 group-hover:scale-110 transition-transform"
                            dangerouslySetInnerHTML={{ __html: icon.path }}
                          />
                          <span className="text-[10px] font-bold text-zinc-200 truncate max-w-full block leading-snug">
                            {icon.label}
                          </span>
                          <span className="text-[8px] font-mono font-bold text-zinc-400 mt-0.5 opacity-60">
                            {icon.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-20 text-zinc-400">
                      <p className="text-xs font-bold font-sans">{t('icons.noMatches')}</p>
                      <button
                        onClick={() => setIconSearchQuery('')}
                        className="mt-2 text-xs text-white hover:underline font-bold cursor-pointer"
                      >
                        {t('icons.showAll')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Info footer bar split */}
                <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[9px] text-zinc-400 select-none shrink-0 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t('icons.tip')}</span>
                  </div>

                  <button
                    onClick={copyCDNLink}
                    className="flex items-center gap-1 bg-[#121215] hover:bg-slate-850 text-zinc-400 px-2.5 py-1.5 rounded-lg border border-white/5 transition-all cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedIconId === 'cdn' ? t('icons.linkCopied') : t('icons.copyCdn')}</span>
                  </button>
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
