'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
 X, UploadCloud, FileType, FileImage, FileVideo, 
 FileText, FileArchive, Loader2,
 Settings, Trash2, Layers
} from 'lucide-react';
import JSZip from 'jszip';

// Simple Stream-safe and client-safe TAR Builder
class TarBuilder {
 private buffers: Uint8Array[] = [];

 private padLength(length: number, blockSize: number = 512): number {
 const overflow = length % blockSize;
 return overflow ? blockSize - overflow : 0;
 }

 private createHeader(name: string, size: number): Uint8Array {
 const header = new Uint8Array(512);
 const textEncoder = new TextEncoder();
 
 // name
 header.set(textEncoder.encode(name.substring(0, 100)), 0);
 // mode
 header.set(textEncoder.encode("0000664\0"), 100);
 // uid
 header.set(textEncoder.encode("0000000\0"), 108);
 // gid
 header.set(textEncoder.encode("0000000\0"), 116);
 // size (octal)
 header.set(textEncoder.encode(size.toString(8).padStart(11, '0') + " "), 124);
 // mtime (octal)
 const mtime = Math.floor(Date.now() / 1000).toString(8);
 header.set(textEncoder.encode(mtime.padStart(11, '0') + " "), 136);
 // typeflag
 header[156] = 48; // '0' for regular file
 // magic
 header.set(textEncoder.encode("ustar\0"), 257);
 header.set(textEncoder.encode("00"), 263);

 // checksum calculation
 let checksum = 0;
 for (let i = 0; i < 512; i++) {
 checksum += (i >= 148 && i < 156) ? 32 : header[i];
 }
 header.set(textEncoder.encode(checksum.toString(8).padStart(6, '0') + "\0 "), 148);
 
 return header;
 }

 public addFile(name: string, data: Uint8Array) {
 const header = this.createHeader(name, data.length);
 this.buffers.push(header);
 this.buffers.push(data);
 
 const pad = this.padLength(data.length);
 if (pad > 0) {
 this.buffers.push(new Uint8Array(pad));
 }
 }

 public build(): Blob {
 this.buffers.push(new Uint8Array(1024)); // Two empty blocks mark EOF
 return new Blob(this.buffers as unknown as BlobPart[], { type: "application/x-tar" });
 }
}

export interface LoadedFile {
 name: string;
 size: number;
 type: string;
 data: Uint8Array;
}

export function CompressModal({ onClose }: { onClose: () => void }) {
 const [files, setFiles] = useState<LoadedFile[]>([]);
 const [isDragging, setIsDragging] = useState(false);
 const [format, setFormat] = useState<'zip' | 'tar'>('zip');
 const [isProcessing, setIsProcessing] = useState(false);
 const [storeOnly, setStoreOnly] = useState(false);
 const [progress, setProgress] = useState(0);
 const [completedArchive, setCompletedArchive] = useState<{ url: string; name: string; size: number } | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const MAX_FILES = 50;

 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(true);
 };

 const handleDragLeave = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setIsDragging(false);
 
 if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
 addFiles(Array.from(e.dataTransfer.files));
 }
 };

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files.length > 0) {
 addFiles(Array.from(e.target.files));
 }
 };

 const addFiles = async (newFiles: File[]) => {
 let filesToAdd = newFiles;
 if (files.length + newFiles.length > MAX_FILES) {
 alert(`عذراً، الحد الأقصى هو ${MAX_FILES} ملفاً.`);
 filesToAdd = newFiles.slice(0, MAX_FILES - files.length);
 }
 if (filesToAdd.length === 0) return;

 const loaded: LoadedFile[] = [];
 let failedCount = 0;

 for (const file of filesToAdd) {
 try {
 const buffer = await file.arrayBuffer();
 loaded.push({
 name: file.name,
 size: file.size,
 type: file.type,
 data: new Uint8Array(buffer)
 });
 } catch (e) {
 console.warn(`Failed to read file ${file.name}:`, e);
 failedCount++;
 }
 }

 if (failedCount > 0) {
 alert(`تعذر تحميل ${failedCount} من الملفات، قد تكون مجلدات فارغة أو ملفات تالفة أو تم مسحها.`);
 }

 if (loaded.length > 0) {
 setFiles(prev => [...prev, ...loaded]);
 }
 setCompletedArchive(null);
 };

 const removeFile = (index: number) => {
 setFiles(prev => prev.filter((_, i) => i !== index));
 setCompletedArchive(null);
 };

 const triggerFileInput = () => {
 fileInputRef.current?.click();
 };

 const getFileIcon = (type: string) => {
 if (type.startsWith('image/')) return <FileImage className="w-5 h-5 text-brand-text" />;
 if (type.startsWith('video/')) return <FileVideo className="w-5 h-5 text-brand-text" />;
 if (type.startsWith('text/')) return <FileText className="w-5 h-5 text-brand-text" />;
 return <FileArchive className="w-5 h-5 text-brand-text" />;
 };

 const formatSize = (bytes: number) => {
 if (bytes === 0) return '0 B';
 const k = 1024;
 const sizes = ['B', 'KB', 'MB', 'GB'];
 const i = Math.floor(Math.log(bytes) / Math.log(k));
 return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
 };

 const handleCompress = async () => {
 if (files.length === 0) return;
 setIsProcessing(true);
 setProgress(0);
 setCompletedArchive(null);

 try {
 if (format === 'zip') {
 const zip = new JSZip();
 for (let i = 0; i < files.length; i++) {
 zip.file(files[i].name, files[i].data);
 setProgress(Math.round(((i + 1) / files.length) * 50));
 }

 const blob = await zip.generateAsync({ 
 type: "blob",
 compression: storeOnly ? "STORE" : "DEFLATE",
 compressionOptions: storeOnly ? undefined : { level: 6 },
 }, (metadata) => {
 setProgress(50 + Math.round(metadata.percent / 2));
 });

 const url = URL.createObjectURL(blob);
 setCompletedArchive({
 url,
 name: `nexus-pkg-${Date.now()}.zip`,
 size: blob.size
 });

 } else if (format === 'tar') {
 const tar = new TarBuilder();
 for (let i = 0; i < files.length; i++) {
 tar.addFile(files[i].name, files[i].data);
 setProgress(Math.round(((i + 1) / files.length) * 90));
 }
 
 const blob = tar.build();
 setProgress(100);
 const url = URL.createObjectURL(blob);
 setCompletedArchive({
 url,
 name: `nexus-pkg-${Date.now()}.tar`,
 size: blob.size
 });
 }
 } catch (error: any) {
 console.error("Compression Error:", error);
 alert(error?.message || "حدث خطأ غير متوقع أثناء ضغط الملفات. تأكد من عدم تحريك الملفات المرفوعة أثناء الضغط.");
 } finally {
 setIsProcessing(false);
 setProgress(100);
 }
 };

 const downloadArchive = () => {
 if (completedArchive) {
 const link = document.createElement('a');
 link.href = completedArchive.url;
 link.download = completedArchive.name;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }} 
 className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
 onClick={onClose} 
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="flex flex-col relative w-full border border-[#2a2a2a] max-w-2xl max-h-[85vh] bg-[#0f0f0f] rounded-2xl shadow-2xl overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
 <div className="flex items-center gap-3">
 <FileArchive className="w-5 h-5 text-brand-accent" />
 <h2 className="text-base font-bold text-brand-text">أداة ضغط الملفات</h2>
 </div>
 <button 
 onClick={onClose}
 className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-brand-text/60 hover:text-brand-text transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="p-5 overflow-y-auto flex-1 hide-scrollbar">
 {!completedArchive ? (
 <>
 <div 
 className={`relative w-full rounded-xl border border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer overflow-hidden group ${
 isDragging 
 ? 'border-brand-accent bg-brand-accent/5' 
 : 'border-[#3a3a3a] hover:border-brand-accent/50 hover:bg-[#1a1a1a] bg-[#111]'
 }`}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 onClick={triggerFileInput}
 >
 <input 
 type="file" 
 multiple 
 className="hidden" 
 ref={fileInputRef}
 onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
 onChange={handleFileSelect}
 />
 
 <motion.div 
 animate={{ y: isDragging ? -5 : 0, scale: isDragging ? 1.05 : 1 }}
 className="w-12 h-12 bg-[#1a1a1a] rounded flex items-center justify-center mb-4 border border-[#3a3a3a] text-brand-text group-hover:text-brand-accent transition-all duration-300"
 >
 <UploadCloud className="w-6 h-6" />
 </motion.div>
 
 <h3 className="text-sm font-bold text-brand-text mb-2 tracking-wide font-sans">
 {isDragging ? 'أفلت الملفات الآن' : 'قم بتحميل وإفلات الملفات هنا'}
 </h3>
 <p className="text-brand-text/50 text-xs font-mono">
 الحد الأقصى: {MAX_FILES} ملف
 </p>
 </div>

 {files.length > 0 && (
 <motion.div 
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 className="mt-6"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
 <div className="flex items-center gap-3">
 <div className="bg-[#1a1a1a] px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 border border-[#2a2a2a]">
 <FileType className="w-3.5 h-3.5 text-brand-accent" />
 <span className="text-brand-text/70">{files.length} ملف</span>
 </div>
 <div className="bg-[#1a1a1a] px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 border border-[#2a2a2a]">
 <Layers className="w-3.5 h-3.5 text-brand-accent" />
 <span className="text-brand-text/70">{formatSize(files.reduce((acc, f) => acc + f.size, 0))}</span>
 </div>
 </div>

 <div className="flex items-center gap-3">
 {format === 'zip' && (
 <label className="flex items-center gap-2 cursor-pointer group">
 <div className="relative flex items-center">
 <input 
 type="checkbox" 
 checked={storeOnly}
 onChange={(e) => setStoreOnly(e.target.checked)}
 className="w-4 h-4 rounded border-[#2a2a2a] bg-[#1a1a1a] text-brand-accent focus:ring-brand-accent focus:ring-offset-[#1a1a1a] cursor-pointer appearance-none checked:bg-brand-accent checked:border-transparent transition-all"
 />
 {storeOnly && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-black">
 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
 </div>}
 </div>
 <span className="text-xs text-brand-text/70 group-hover:text-brand-text transition-colors">
 تخزين فقط (للخطوط/الفيديو)
 </span>
 </label>
 )}

 <div className="flex items-center gap-1 p-1 border border-[#2a2a2a] bg-[#151515] rounded">
 <button
 onClick={() => setFormat('zip')}
 className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all ${format === 'zip' ? 'bg-brand-accent text-[#0f0f0f]' : 'text-brand-text hover:bg-[#2a2a2a]'}`}
 >
 ZIP
 </button>
 <button
 onClick={() => setFormat('tar')}
 className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all ${format === 'tar' ? 'bg-brand-accent text-[#0f0f0f]' : 'text-brand-text hover:bg-[#2a2a2a]'}`}
 >
 TAR
 </button>
 </div>
 </div>
 </div>

 <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-1.5 max-h-[180px] overflow-y-auto mb-5 hide-scrollbar">
 <AnimatePresence>
 {files.map((file, idx) => (
 <motion.div 
 key={`${file.name}-${idx}`}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, height: 0 }}
 className="flex items-center justify-between p-2 lg:p-2.5 border-b border-[#2a2a2a]/50 last:border-0 hover:bg-[#1a1a1a] transition-colors rounded group"
 >
 <div className="flex items-center gap-3 overflow-hidden">
 <div className="opacity-70">
 {getFileIcon(file.type)}
 </div>
 <div className="flex flex-col truncate">
 <span className="text-brand-text font-medium text-xs lg:text-sm truncate pr-1" dir="ltr">{file.name}</span>
 <span className="text-brand-text/40 text-[10px] sm:text-xs font-mono mt-0.5">{formatSize(file.size)}</span>
 </div>
 </div>
 <button 
 onClick={() => removeFile(idx)}
 className="p-1.5 text-brand-text/40 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors shrink-0"
 title="إزالة الملف"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 </motion.div>
 )}
 </>
 ) : (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="flex flex-col items-center text-center py-6"
 >
 <div className="w-14 h-14 bg-brand-accent/10 rounded-full flex items-center justify-center mb-4 border border-brand-accent/30 shadow-none">
 <FileArchive className="w-7 h-7 text-brand-accent" />
 </div>
 
 <h2 className="text-lg font-bold text-brand-text mb-2">
 تم الضغط بنجاح
 </h2>
 <p className="text-brand-text/60 text-sm mb-6 max-w-[250px]">
 تم ضغط {files.length} ملفات جاهزة للتحميل والتأمين.
 </p>
 
 <div className="flex w-full sm:flex-row flex-col justify-center gap-3">
 <button
 onClick={downloadArchive}
 className="flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-[#0f0f0f] bg-brand-accent hover:opacity-90 active:scale-95 rounded text-sm transition-all"
 >
 <FileArchive className="w-4 h-4" />
 <span>تحميل {format.toUpperCase()}</span>
 </button>
 
 <button
 onClick={() => {
 setCompletedArchive(null);
 setFiles([]);
 if (fileInputRef.current) fileInputRef.current.value = '';
 }}
 className="flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-brand-text border border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded text-sm transition-all active:scale-95"
 >
 <span>أداة جديدة</span>
 </button>
 </div>
 </motion.div>
 )}
 </div>

 {/* Footer with action */}
 {!completedArchive && (
 <div className="px-5 py-4 border-t border-[#2a2a2a] bg-[#151515] flex justify-end">
 <button
 onClick={handleCompress}
 disabled={isProcessing || files.length === 0}
 className="relative flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 font-bold text-[#0f0f0f] bg-brand-accent hover:opacity-90 active:scale-95 rounded text-sm disabled:opacity-50 disabled:bg-[#333] disabled:text-brand-text disabled:cursor-not-allowed transition-all overflow-hidden"
 >
 {isProcessing ? (
 <>
 <Loader2 className="w-4 h-4 text-[#0f0f0f] animate-spin" />
 <span>يتم الضغط ({progress}%)</span>
 </>
 ) : (
 <>
 <Settings className="w-4 h-4" />
 <span>بدء الضغط</span>
 </>
 )}
 
 {isProcessing && (
 <div 
 className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/20 transition-all duration-300"
 style={{ width: `${progress}%` }}
 />
 )}
 </button>
 </div>
 )}
 </motion.div>
 </div>
 );
}
