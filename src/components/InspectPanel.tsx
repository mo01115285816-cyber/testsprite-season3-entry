'use client';

import React from 'react';
import { Sliders, Type, Check, Copy, Eye } from 'lucide-react';
import { parseInlineStyles, serializeInlineStyles } from '../lib/styles';

export const CSS_FIELDS = [
  { id: 'color', label: 'اللون (Color)', placeholder: 'red, #000' },
  { id: 'background-color', label: 'الخلفية (Background)', placeholder: '#ffffff, transparent' },
  { id: 'padding', label: 'التباعد الداخلي (Padding)', placeholder: '10px, 1rem' },
  { id: 'margin', label: 'الهامش الخارجي (Margin)', placeholder: '5px, auto' },
  { id: 'font-size', label: 'حجم الخط (Size)', placeholder: '14px, 1.25rem' },
  { id: 'text-align', label: 'محاذاة النص (Align)', placeholder: 'center, right' },
  { id: 'border-radius', label: 'انحناء الحواف (Radius)', placeholder: '8px, 50%' },
  { id: 'border', label: 'الإطار (Border)', placeholder: '1px solid #ccc' },
];

export interface SelectedElement {
  tagName: string;
  id: string;
  classes: string;
  styleAttr: string;
  innerText: string;
  styles: Record<string, string>;
  path: number[];
}

interface InspectPanelProps {
  selectedElement: SelectedElement | null;
  updateSelectedElementInOriginalCode: (updates: {
    styleAttr?: string;
    id?: string;
    classes?: string;
    innerText?: string;
  }) => void;
  handleCopyCSS: () => void;
  isCSSCopied: boolean;
  inspectModeActive: boolean;
}

export default function InspectPanel({
  selectedElement,
  updateSelectedElementInOriginalCode,
  handleCopyCSS,
  isCSSCopied,
  inspectModeActive,
}: InspectPanelProps) {
  if (!inspectModeActive) return null;

  return (
    <>
      {/* Desktop view Panel: Sidebar layout */}
      <div className="hidden md:flex w-96 border-l border-white/5 bg-[#121215] backdrop-blur-sm flex-col shrink-0 overflow-y-auto h-full shadow-lg z-10 p-5 gap-4">
        {selectedElement ? (
          <div className="flex flex-col gap-4 font-sans text-right" dir="rtl">
            {/* Header details */}
            <div className="bg-[#09090b] border border-white/5 text-white rounded-2xl p-4 shadow-inner flex flex-col gap-1.5 select-text">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400">العنصر المحدَّد</span>
                <span className="bg-zinc-500 text-[9px] font-extrabold px-2 py-0.5 rounded-md text-white uppercase font-mono">
                  {selectedElement.tagName}
                </span>
              </div>
              <div className="text-[12px] font-mono text-white mt-1 truncate" style={{ direction: 'ltr' }}>
                &lt;{selectedElement.tagName}
                {selectedElement.id && <span className="text-amber-400"> id="{selectedElement.id}"</span>}
              </div>
            </div>

            {/* Direct CSS actions block */}
            <button
              onClick={handleCopyCSS}
              className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer select-none ${
                isCSSCopied
                  ? 'bg-zinc-500/10 border-zinc-500/20 text-white font-bold'
                  : 'bg-zinc-500 hover:bg-zinc-600 text-black border-zinc-500/20 shadow-sm font-black'
              }`}
            >
              {isCSSCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{isCSSCopied ? 'تم نسخ التنسيق!' : 'نسخ كود CSS المعدَّل'}</span>
            </button>

            {/* Style inputs list mapped dynamically */}
            <div className="bg-[#09090b] p-3.5 rounded-2xl border border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 mb-1">
                <Sliders className="w-4 h-4 text-white animate-pulse" />
                <h4 className="text-xs font-extrabold text-[#f1f5f9]">التنسيقات المباشرة (CSS Property)</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CSS_FIELDS.map((f) => {
                  const currentStyles = parseInlineStyles(selectedElement.styleAttr || '');
                  const val = currentStyles[f.id] || '';
                  const handleChange = (newVal: string) => {
                    const updatedStyles = { ...currentStyles };
                    if (!newVal.trim()) delete updatedStyles[f.id];
                    else updatedStyles[f.id] = newVal;
                    updateSelectedElementInOriginalCode({ styleAttr: serializeInlineStyles(updatedStyles) });
                  };
                  return (
                    <div key={f.id} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-400">{f.label}</label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full bg-[#09090b] border border-white/5 focus:border-zinc-500 rounded-xl py-1 px-2.5 text-xs text-zinc-200 outline-none transition-all font-mono"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inline styles script textarea */}
            <div className="bg-[#09090b] border border-white/5 p-3.5 rounded-2xl flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400">التنسيق المضمن الشامل (Raw CSS Inline)</label>
              <textarea
                value={selectedElement.styleAttr}
                onChange={(e) => updateSelectedElementInOriginalCode({ styleAttr: e.target.value })}
                placeholder="color: red; padding: 5px;"
                className="w-full bg-[#09090b] border border-white/5 text-xs py-1.5 px-2.5 rounded-xl outline-none focus:border-zinc-500 font-mono"
                rows={2}
                style={{ direction: 'ltr' }}
              />
            </div>

            {/* ID, Class inputs */}
            <div className="bg-[#09090b] border border-white/5 p-3.5 rounded-2xl grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-400">مُعرف العنصر (ID)</label>
                <input
                  type="text"
                  value={selectedElement.id}
                  onChange={(e) => updateSelectedElementInOriginalCode({ id: e.target.value })}
                  className="w-full bg-[#09090b] border border-white/5 rounded-xl text-xs py-1.5 px-2 font-mono text-zinc-200 outline-none focus:border-zinc-500/50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-400">الكلاسات (Classes)</label>
                <input
                  type="text"
                  value={selectedElement.classes}
                  onChange={(e) => updateSelectedElementInOriginalCode({ classes: e.target.value })}
                  className="w-full bg-[#09090b] border border-white/5 rounded-xl text-xs py-1.5 px-2 font-mono text-zinc-200 outline-none focus:border-zinc-500/50"
                />
              </div>
            </div>

            {/* Text values */}
            <div className="bg-[#09090b] border border-white/5 p-3.5 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                <Type className="w-3.5 h-3.5 text-white" />
                <label className="text-xs font-bold text-zinc-300">تعديل النص (Text Content)</label>
              </div>
              <textarea
                value={selectedElement.innerText}
                onChange={(e) => updateSelectedElementInOriginalCode({ innerText: e.target.value })}
                className="w-full bg-[#09090b] border border-white/5 font-medium text-xs p-2.5 rounded-xl outline-none focus:border-zinc-500/50 text-zinc-200"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="my-auto text-center flex flex-col items-center justify-center gap-2 py-10 selection:bg-transparent">
            <Eye className="w-10 h-10 text-white opacity-20 animate-pulse" />
            <h5 className="text-xs font-extrabold text-[#f1f5f9]">لم يتم تحديد عنصر</h5>
            <p className="text-[11px] text-zinc-400 max-w-[200px]">انقر فوق أي عنصر في شاشة المحاكاة لتعديله بالبث الحي!</p>
          </div>
        )}
      </div>

      {/* Mobile view Panel: Sheet Drawer layout floating bottom */}
      <div className="md:hidden fixed bottom-24 inset-x-4 max-h-[420px] bg-[#121215] border border-white/5 rounded-3xl overflow-y-auto shadow-2xl z-40 p-4 shrink-0 flex flex-col gap-4 font-sans text-right" dir="rtl">
        {selectedElement ? (
          <div className="flex flex-col gap-3.5">
            <div className="bg-[#09090b] text-white rounded-xl p-3 flex flex-col gap-1 select-text">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-zinc-400 font-bold">العنصر المحدَّد</span>
                <span className="bg-zinc-500 text-[9px] font-black px-1.5 py-0.5 rounded text-white uppercase">
                  {selectedElement.tagName}
                </span>
              </div>
              <div className="text-[11px] font-mono text-white truncate" style={{ direction: 'ltr' }}>
                &lt;{selectedElement.tagName}
                {selectedElement.id && <span className="text-amber-400"> id="{selectedElement.id}"</span>}
              </div>
            </div>

            <button
              onClick={handleCopyCSS}
              className="w-full py-2 bg-zinc-500 hover:bg-zinc-600 font-black text-black rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>نسخ كود CSS المعدَّل</span>
            </button>

            <div className="bg-[#09090b] p-3 rounded-xl border border-white/5 flex flex-col gap-2">
              <span className="text-[10px] font-black text-zinc-400 flex items-center gap-1.5 pb-1 border-b border-white/5">
                <Sliders className="w-3.5 h-3.5 text-white" />
                <span>القيم المباشرة</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                {CSS_FIELDS.slice(0, 4).map((f) => {
                  const currentStyles = parseInlineStyles(selectedElement.styleAttr || '');
                  const val = currentStyles[f.id] || '';
                  const handleChange = (newVal: string) => {
                    const updatedStyles = { ...currentStyles };
                    if (!newVal.trim()) delete updatedStyles[f.id];
                    else updatedStyles[f.id] = newVal;
                    updateSelectedElementInOriginalCode({ styleAttr: serializeInlineStyles(updatedStyles) });
                  };
                  return (
                    <div key={f.id} className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-semibold text-zinc-400">{f.label}</label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full bg-[#09090b] border border-white/5 rounded-lg py-1 px-2.5 text-[11px] text-zinc-200 outline-none font-mono focus:border-zinc-500/50"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center justify-center gap-1 py-12">
            <Eye className="w-8 h-8 text-white opacity-20" />
            <h5 className="text-[11px] font-extrabold text-zinc-300">لم يتم تحديد عنصر لبدء تخصيص التنسيق</h5>
            <p className="text-[9px] text-zinc-400">انقر فوق أي جزء في شاشة المحاكاة بالأسفل للمعالجة بالبث المباشر.</p>
          </div>
        )}
      </div>
    </>
  );
}
