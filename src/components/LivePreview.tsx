'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
 Monitor, Tablet, Smartphone, Wifi, Battery, Signal, 
 Eye, Globe, Lock, Columns, Activity, Cpu, Zap, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [isSplitView, setIsSplitView] = useState(false);
  const [showPerfMonitor, setShowPerfMonitor] = useState(true);
  const [perfCollapsed, setPerfCollapsed] = useState(false);
  const [loadTime, setLoadTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1000);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeLoadStart = useRef<number>(0);

  // Measure container width for split view scaling
  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  // Calculate split scale — fit both frames side by side
  const splitScale = Math.min(1, (containerWidth - 80) / (418 + 1024));

  // Measure load time when processedCode changes
  useEffect(() => {
    if (!processedCode) return;
    iframeLoadStart.current = performance.now();
  }, [processedCode]);

  const handleIframeLoad = useCallback(() => {
    if (iframeLoadStart.current > 0) {
      const elapsed = performance.now() - iframeLoadStart.current;
      setLoadTime(Math.round(elapsed));
    }
  }, []);

  // Simulate memory usage based on code size + React mode
  useEffect(() => {
    if (!processedCode) {
      setMemoryUsage(0);
      return;
    }
    const codeSizeKB = new Blob([processedCode]).size / 1024;
    const baseMemory = isReactActive ? 15 : 5;
    const codeMemory = codeSizeKB * 0.1;
    const fluctuation = Math.sin(Date.now() / 5000) * 2;
    setMemoryUsage(Math.max(1, Math.round(baseMemory + codeMemory + fluctuation)));
  }, [processedCode, isReactActive]);

  const codeSizeKB = processedCode ? (new Blob([processedCode]).size / 1024).toFixed(1) : '0';
  const memColor = memoryUsage < 30 ? '#5dd62c' : memoryUsage < 60 ? '#f59e0b' : '#ef4444';

  // Single iframe renderer (reusable)
  const renderDesktop = (key: string, scale?: number) => (
    <div 
      key={key}
      className="bg-white rounded-2xl overflow-hidden border border-brand-accent/20 flex flex-col"
      style={scale ? { width: '100%', height: '100%', transform: `scale(${scale})`, transformOrigin: 'center center' } : undefined}
    >
      <div className="h-8 bg-zinc-900 border-b border-brand-accent/15 flex items-center px-4 justify-between select-none shrink-0" dir="ltr">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-brand-accent/80"></span>
        </div>
        <div className="bg-[#161616] border border-brand-accent/10 rounded-md text-[10px] text-zinc-400 py-0.5 text-center flex items-center justify-center gap-1 px-2 truncate max-w-[200px]">
          <Lock className="w-2.5 h-2.5 text-brand-accent" />
          <span className="truncate">localhost:3000</span>
        </div>
        <div className="w-8"></div>
      </div>
      <iframe
        title={`${key}-preview`}
        srcDoc={processedCode}
        className="flex-1 w-full border-0 bg-white"
        sandbox="allow-scripts allow-modals"
        onLoad={key === 'main' ? handleIframeLoad : undefined}
      />
    </div>
  );

  const renderMobile = (key: string, scale: number) => (
    <div 
      key={key}
      className="rounded-[40px] border-[12px] border-brand-card/95 bg-brand-card overflow-hidden flex flex-col shrink-0"
      style={{
        width: '418px',
        height: '852px',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#161616] border border-brand-accent/20 rounded-full z-40" />
      <div className="h-8 bg-[#141414] text-zinc-300 flex justify-between items-end pb-1 px-5 text-[9px] font-bold select-none z-30 border-b border-brand-accent/10 shrink-0" dir="ltr">
        <div className="font-mono font-bold text-[10px]">{simulatedTime}</div>
        <div className="flex items-center gap-1">
          <Signal className="w-2.5 h-2.5 text-brand-accent" />
          <Wifi className="w-2.5 h-2.5 text-brand-accent" />
          <Battery className="w-3 h-3 text-brand-accent" />
        </div>
      </div>
      <div className="flex-1 relative bg-white">
        <iframe
          title={`${key}-preview`}
          srcDoc={processedCode}
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-modals"
          onLoad={key === 'main' ? handleIframeLoad : undefined}
        />
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-brand-bg relative overflow-hidden pt-6" dir="rtl">
      {/* Toolbar */}
      <div className="shrink-0 max-w-5xl w-[calc(100%-2.5rem)] mx-auto bg-brand-card/90 backdrop-blur-md rounded-full border border-brand-accent/20 shadow-none px-4 h-[58px] flex items-center justify-between text-brand-text select-none mb-4 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setPreviewSize('desktop'); setIsSplitView(false); }}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${previewSize === 'desktop' && !isSplitView ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30' : 'text-zinc-400 hover:text-brand-accent hover:bg-[#141414]'}`}
            title="سطح المكتب"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setPreviewSize('tablet'); setIsSplitView(false); }}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${previewSize === 'tablet' && !isSplitView ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30' : 'text-zinc-400 hover:text-brand-accent hover:bg-[#141414]'}`}
            title="لوحي"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setPreviewSize('mobile'); setIsSplitView(false); }}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${previewSize === 'mobile' && !isSplitView ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30' : 'text-zinc-400 hover:text-brand-accent hover:bg-[#141414]'}`}
            title="موبايل"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Split View Toggle */}
          <div className="w-px h-4 bg-brand-accent/15 mx-0.5" />
          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${isSplitView ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30' : 'text-zinc-400 hover:text-brand-accent hover:bg-[#141414]'}`}
            title="عرض منقسم (مقارنة)"
          >
            <Columns className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Performance Monitor Toggle */}
          <button
            onClick={() => setShowPerfMonitor(!showPerfMonitor)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${showPerfMonitor ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30' : 'text-zinc-400 hover:text-brand-accent hover:bg-[#141414]'}`}
            title="لوحة الأداء"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* CSS Inspector */}
          {!isReactActive && (
            <button
              onClick={() => setInspectModeActive(!inspectModeActive)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-bold transition-all cursor-pointer select-none ${inspectModeActive ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30' : 'bg-brand-bg border-brand-accent/20 text-zinc-300 hover:text-brand-accent hover:border-brand-accent/40'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{inspectModeActive ? 'التفتيش نشط' : 'مفتش HTML'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto p-4 flex items-center justify-center bg-brand-bg/60 tech-dot-grid custom-scrollbar relative">
        
        {/* Split View Mode */}
        {isSplitView ? (
          <div className="flex items-start justify-center gap-6 w-full h-full">
            {/* Desktop side */}
            <div className="flex flex-col items-center gap-2" style={{ flex: '1 1 55%', maxWidth: '55%' }}>
              <span className="text-[10px] font-mono text-zinc-500 mb-1">Desktop</span>
              <div className="w-full h-full max-h-[600px]">
                {renderDesktop('split-desktop', splitScale)}
              </div>
            </div>
            {/* Mobile side */}
            <div className="flex flex-col items-center gap-2" style={{ flex: '0 0 auto' }}>
              <span className="text-[10px] font-mono text-zinc-500 mb-1">Mobile</span>
              {renderMobile('split-mobile', splitScale * 0.85)}
            </div>
          </div>
        ) : (
          <>
            {/* Single Desktop */}
            {previewSize === 'desktop' && (
              <div className="w-full h-full max-w-7xl mx-auto">
                {renderDesktop('main')}
              </div>
            )}
            {/* Single Tablet */}
            {previewSize === 'tablet' && (
              <div 
                className="rounded-[40px] border-[16px] border-brand-card/95 bg-brand-card shadow-none relative overflow-hidden flex flex-col shrink-0"
                style={{ width: '792px', height: '1024px', transform: `scale(${simulatedScale})`, transformOrigin: 'center center' }}
              >
                <div className="h-7 bg-[#141414] text-zinc-300 flex justify-between items-center px-6 text-[10px] font-bold select-none border-b border-brand-accent/10 shrink-0" dir="ltr">
                  <div className="font-mono text-xs">{simulatedTime}</div>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3 h-3 text-brand-accent" /><Signal className="w-3 h-3 text-brand-accent" /><Battery className="w-3.5 h-3.5 text-brand-accent" />
                  </div>
                </div>
                <div className="flex-1 relative bg-white">
                  <iframe title="Tablet Preview" srcDoc={processedCode} className="w-full h-full border-0 bg-white" sandbox="allow-scripts allow-modals" onLoad={handleIframeLoad} />
                </div>
              </div>
            )}
            {/* Single Mobile */}
            {previewSize === 'mobile' && (
              <div 
                className="rounded-[55px] border-[16px] border-brand-card/95 bg-brand-card shadow-none relative overflow-hidden flex flex-col shrink-0"
                style={{ width: '418px', height: '852px', transform: `scale(${simulatedScale})`, transformOrigin: 'center center' }}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#161616] border border-brand-accent/20 rounded-full z-40" />
                <div className="h-10 bg-[#141414] text-zinc-300 flex justify-between items-end pb-1.5 px-7 text-[10px] font-bold select-none z-30 border-b border-brand-accent/10 shrink-0" dir="ltr">
                  <div className="font-mono font-bold text-xs">{simulatedTime}</div>
                  <div className="flex items-center gap-1.5">
                    <Signal className="w-3 h-3 text-brand-accent" /><Wifi className="w-3 h-3 text-brand-accent" /><Battery className="w-3.5 h-3.5 text-brand-accent" />
                  </div>
                </div>
                <div className="flex-1 relative bg-white">
                  <iframe title="Mobile Preview" srcDoc={processedCode} className="w-full h-full border-0 bg-white" sandbox="allow-scripts allow-modals" onLoad={handleIframeLoad} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Performance Monitor HUD */}
        <AnimatePresence>
          {showPerfMonitor && (
            <motion.div
              initial={{ opacity: 0, x: 20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20, y: 20 }}
              className="absolute bottom-4 left-4 z-30"
              dir="ltr"
            >
              <div className="bg-brand-card/95 backdrop-blur-md border border-brand-accent/20 rounded-xl overflow-hidden shadow-lg w-56">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-brand-accent/10">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-brand-accent" />
                    <span className="text-[10px] font-bold text-zinc-300 font-mono">Performance</span>
                  </div>
                  <button onClick={() => setPerfCollapsed(!perfCollapsed)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                    {perfCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  </button>
                </div>
                
                {!perfCollapsed && (
                  <div className="p-3 space-y-2.5">
                    {/* Load Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] text-zinc-400">Load Time</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-zinc-200">{loadTime}ms</span>
                    </div>

                    {/* Memory Usage */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="w-3 h-3 text-brand-accent" />
                          <span className="text-[10px] text-zinc-400">Memory</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold" style={{ color: memColor }}>{memoryUsage}MB</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, (memoryUsage / 80) * 100)}%`,
                            backgroundColor: memColor
                          }}
                        />
                      </div>
                    </div>

                    {/* Code Size */}
                    <div className="flex items-center justify-between pt-1 border-t border-brand-accent/10">
                      <span className="text-[10px] text-zinc-500">Code Size</span>
                      <span className="text-[11px] font-mono font-bold text-zinc-300">{codeSizeKB}KB</span>
                    </div>

                    {/* Engine */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Engine</span>
                      <span className="text-[10px] font-mono font-bold text-brand-accent">{isReactActive ? 'React' : 'HTML5'}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
