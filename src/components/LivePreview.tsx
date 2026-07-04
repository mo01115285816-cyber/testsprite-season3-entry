'use client';

import React from 'react';
import { 
  Monitor, Tablet, Smartphone, Wifi, Battery, Signal, 
  Eye, Globe, Lock 
} from 'lucide-react';

interface LivePreviewProps {
  isReactActive: boolean;
  processedCode: string;
  previewSize: 'desktop' | 'tablet' | 'mobile';
  setPreviewSize: (size: 'desktop' | 'tablet' | 'mobile') => void;
  simulatedScale: number;
  simulatedTime: string;
  inspectModeActive: boolean;
  setInspectModeActive: (active: boolean) => void;
}

export default function LivePreview({
  isReactActive,
  processedCode,
  previewSize,
  setPreviewSize,
  simulatedScale,
  simulatedTime,
  inspectModeActive,
  setInspectModeActive,
}: LivePreviewProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-brand-bg relative overflow-hidden" dir="rtl">
      {/* Simulation Controls Toolbar */}
      <div className="h-12 bg-brand-card/90 backdrop-blur-md border-b border-brand-accent/15 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setPreviewSize('desktop')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              previewSize === 'desktop' ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30 shadow-[0_0_10px_rgba(93,214,44,0.15)]' : 'text-zinc-400 hover:text-brand-accent hover:bg-[#141414]'
            }`}
            title="معاينة سطح المكتب (Desktop)"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewSize('tablet')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              previewSize === 'tablet' ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30 shadow-[0_0_10px_rgba(93,214,44,0.15)]' : 'text-zinc-400 hover:text-brand-accent hover:bg-[#141414]'
            }`}
            title="معاينة الأجهزة اللوحية (Tablet)"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewSize('mobile')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              previewSize === 'mobile' ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30 shadow-[0_0_10px_rgba(93,214,44,0.15)]' : 'text-zinc-400 hover:text-brand-accent hover:bg-[#141414]'
            }`}
            title="معاينة الهاتف المحمول (Mobile)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* CSS Element Inspector Toggle Button (Only for HTML layout) */}
        {!isReactActive && (
          <button
            onClick={() => setInspectModeActive(!inspectModeActive)}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full border font-bold transition-all cursor-pointer select-none ${
              inspectModeActive 
                ? 'bg-gradient-to-r from-brand-accent via-brand-deep to-brand-accent text-brand-bg border-brand-accent shadow-[0_0_15px_rgba(93,214,44,0.2)]' 
                : 'bg-brand-bg border-brand-accent/20 text-zinc-300 hover:text-brand-accent hover:border-brand-accent/40'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{inspectModeActive ? 'وضع التفتيش نشط 🎯' : 'مفتش كلاسات الـ HTML'}</span>
          </button>
        )}
      </div>

      {/* Simulator Device Viewport Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex items-center justify-center bg-brand-bg/60 tech-dot-grid custom-scrollbar relative">
        
        {/* Render Desktop Frame */}
        {previewSize === 'desktop' && (
          <div className="w-full h-full max-w-7xl mx-auto bg-white rounded-2xl shadow-[0_20px_50px_rgba(93,214,44,0.1)] overflow-hidden border border-brand-accent/20 flex flex-col">
            {/* Desktop Mockup Header Browser Bar */}
            <div className="h-8 bg-zinc-900 border-b border-brand-accent/15 flex items-center px-4 justify-between select-none" dir="ltr">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-brand-accent/80 shadow-[0_0_5px_#5dd62c]"></span>
              </div>
              <div className="w-96 bg-[#161616] border border-brand-accent/10 rounded-md text-[10px] text-zinc-400 py-0.5 text-center flex items-center justify-center gap-1 shadow-inner px-2 truncate">
                <Lock className="w-2.5 h-2.5 text-brand-accent" />
                <span className="truncate text-zinc-300">localhost:3000/preview.html</span>
              </div>
              <div className="w-12"></div>
            </div>
            <iframe
              title="Desktop Live Preview"
              srcDoc={processedCode}
              className="flex-1 w-full border-0 bg-white"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        )}

        {/* Render Tablet Frame (iPad size mock with custom scale) */}
        {previewSize === 'tablet' && (
          <div 
            className="rounded-[40px] border-[16px] border-brand-card/95 bg-brand-card shadow-[0_0_50px_rgba(93,214,44,0.1)] relative overflow-hidden flex flex-col shrink-0"
            style={{
              width: '792px',
              height: '1024px',
              transform: `scale(${simulatedScale})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Tablet Header status bar */}
            <div className="h-7 bg-[#141414] text-zinc-300 flex justify-between items-center px-6 text-[10/11px] font-bold select-none border-b border-brand-accent/10" dir="ltr">
              <div className="font-mono text-xs">{simulatedTime}</div>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-brand-accent" />
                <Signal className="w-3 h-3 text-brand-accent" />
                <Battery className="w-3.5 h-3.5 text-brand-accent" />
              </div>
            </div>
            <div className="flex-1 relative bg-white">
              <iframe
                title="Tablet Live Preview"
                srcDoc={processedCode}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-modals"
              />
            </div>
          </div>
        )}

        {/* Render Mobile Frame (iPhone size mock with custom scale) */}
        {previewSize === 'mobile' && (
          <div 
            className="rounded-[55px] border-[16px] border-brand-card/95 bg-brand-card shadow-[0_0_50px_rgba(93,214,44,0.1)] relative overflow-hidden flex flex-col shrink-0"
            style={{
              width: '418px',
              height: '852px',
              transform: `scale(${simulatedScale})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Phone Notch & status details */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#161616] border border-brand-accent/20 rounded-full z-40 flex items-center justify-center overflow-hidden" />
            <div className="h-10 bg-[#141414] text-zinc-300 flex justify-between items-end pb-1.5 px-7 text-[10px] font-bold select-none z-30 border-b border-brand-accent/10" dir="ltr">
              <div className="font-mono font-bold text-xs">{simulatedTime}</div>
              <div className="flex items-center gap-1.5">
                <Signal className="w-3 h-3 text-brand-accent" />
                <Wifi className="w-3 h-3 text-brand-accent" />
                <Battery className="w-3.5 h-3.5 text-brand-accent" />
              </div>
            </div>
            <div className="flex-1 relative bg-white">
              <iframe
                title="Mobile Live Preview"
                srcDoc={processedCode}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-modals"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
