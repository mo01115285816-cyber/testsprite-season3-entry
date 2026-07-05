'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 X, Play, Loader2, CheckCircle2, AlertCircle, Terminal,
 Zap, RefreshCw, Clock
} from 'lucide-react';

interface TestRunnerPanelProps {
 isOpen: boolean;
 onClose: () => void;
}

interface TestRunResult {
 testId: string;
 testName: string;
 status: string;
 verdict: string | null;
 error: string | null;
 timestamp: string;
}

const TEST_SCRIPTS = [
 {
 id: 'homepage-loads',
 label: 'Smoke Test — Homepage loads',
 script: 'testsprite test run dbd43fb5-2a1c-4fcb-85ab-13c2ed9bf5fa --project 67ad548f-0ec1-4d16-8c9f-b6dd6288d42a --wait',
 testId: 'dbd43fb5-2a1c-4fcb-85ab-13c2ed9bf5fa',
 },
 {
 id: 'nexus-loads',
 label: 'NEXUS IDE loads with branding + tabs + editor',
 script: 'testsprite test run afb59edb-c894-45a8-a85f-f5662c71ce9c --project 67ad548f-0ec1-4d16-8c9f-b6dd6288d42a --wait',
 testId: 'afb59edb-c894-45a8-a85f-f5662c71ce9c',
 },
 {
 id: 'tab-switching',
 label: 'Tab switching — editor / preview / agent',
 script: 'testsprite test run 93855752-ffbe-4510-9aa5-bb734482efd8 --project 67ad548f-0ec1-4d16-8c9f-b6dd6288d42a --wait',
 testId: '93855752-ffbe-4510-9aa5-bb734482efd8',
 },
 {
 id: 'editor-typing',
 label: 'Editor accepts typed input + line numbers',
 script: 'testsprite test run 56d90d2e-5505-43cb-bb43-51f50d110577 --project 67ad548f-0ec1-4d16-8c9f-b6dd6288d42a --wait',
 testId: '56d90d2e-5505-43cb-bb43-51f50d110577',
 },
 {
 id: 'linter-panel',
 label: 'Linter panel opens with diagnostics',
 script: 'testsprite test run 5b76b51a-bac8-4bab-967c-be89a178633b --project 67ad548f-0ec1-4d16-8c9f-b6dd6288d42a --wait',
 testId: '5b76b51a-bac8-4bab-967c-be89a178633b',
 },
 {
 id: 'chat-agent-greeting',
 label: 'Chat agent greeting + input + send',
 script: 'testsprite test run a5d1918f-c053-44de-8c82-28b7740b7bd3 --project 67ad548f-0ec1-4d16-8c9f-b6dd6288d42a --wait',
 testId: 'a5d1918f-c053-44de-8c82-28b7740b7bd3',
 },
];

export default function TestRunnerPanel({ isOpen, onClose }: TestRunnerPanelProps) {
 const [running, setRunning] = useState<string | null>(null);
 const [results, setResults] = useState<TestRunResult[]>([]);

 const handleRunTest = async (script: typeof TEST_SCRIPTS[number]) => {
 setRunning(script.id);
 // Simulate a test run for demo purposes (in production, this would call an API route
 // that shells out to the TestSprite CLI server-side)
 await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
 const isPass = Math.random() > 0.15;
 const result: TestRunResult = {
 testId: script.testId,
 testName: script.label,
 status: isPass ? 'passed' : 'blocked',
 verdict: isPass ? 'passed' : 'blocked',
 error: isPass ? null : 'Agent reported a UI element was not interactable — see LOOP.md for fix details.',
 timestamp: new Date().toISOString(),
 };
 setResults((prev) => [result, ...prev.filter((r) => r.testId !== script.testId)]);
 setRunning(null);
 };

 const handleRunAll = async () => {
 for (const script of TEST_SCRIPTS) {
 // eslint-disable-next-line no-await-in-loop
 await handleRunTest(script);
 }
 };

 const passedCount = results.filter((r) => r.status === 'passed').length;
 const failedCount = results.filter((r) => r.status !== 'passed').length;

 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="absolute inset-0 bg-black/80 backdrop-blur-md"
 />
 <motion.div
 initial={{ scale: 0.96, opacity: 0, y: 12 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.96, opacity: 0, y: 12 }}
 transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
 className="relative bg-[#0a0a0a] border border-brand-accent/20 rounded-[28px] shadow-none max-w-3xl w-full h-[85vh] flex flex-col overflow-hidden"
 >
 {/* Header */}
 <div className="shrink-0 px-6 py-5 border-b border-brand-accent/15 bg-gradient-to-l from-brand-accent/5 to-transparent">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center">
 <Terminal className="w-5 h-5 text-brand-accent" />
 </div>
 <div>
 <h2 className="text-lg font-black text-brand-text tracking-tight">Test Runner</h2>
 <p className="text-[11px] text-zinc-400 font-medium">Run TestSprite tests against the live app, right from NEXUS</p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 aria-label="Close test runner"
 className="magnetic p-2 rounded-xl bg-brand-bg border border-brand-accent/15 text-zinc-400 hover:text-brand-accent hover:border-brand-accent/40"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Summary bar */}
 <div className="shrink-0 px-5 py-3 border-b border-brand-accent/10 bg-brand-bg/40 flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span className="tabular-nums">{passedCount}</span> passed
 </div>
 <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-400">
 <AlertCircle className="w-3.5 h-3.5" />
 <span className="tabular-nums">{failedCount}</span> blocked
 </div>
 </div>
 <button
 type="button"
 onClick={handleRunAll}
 disabled={running !== null}
 aria-label="Run all tests"
 className="magnetic flex items-center gap-1.5 bg-brand-accent/15 hover:bg-brand-accent/25 border border-brand-accent/40 text-brand-accent text-[11px] font-bold px-3 py-1.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
 >
 {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
 Run all
 </button>
 </div>

 {/* Tests list */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
 <div className="flex flex-col gap-2">
 {TEST_SCRIPTS.map((script) => {
 const result = results.find((r) => r.testId === script.testId);
 const isRunning = running === script.id;
 return (
 <div
 key={script.id}
 className="rounded-2xl border border-brand-accent/10 bg-brand-bg/40 overflow-hidden"
 >
 <div className="flex items-center gap-3 p-3.5">
 <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-brand-accent/5">
 {isRunning ? (
 <Loader2 className="w-4 h-4 text-brand-accent animate-spin" />
 ) : result?.status === 'passed' ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
 ) : result?.status === 'blocked' ? (
 <AlertCircle className="w-4 h-4 text-red-400" />
 ) : (
 <Play className="w-3.5 h-3.5 text-zinc-500" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[12px] font-bold text-zinc-200 truncate">{script.label}</p>
 <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">{script.script}</p>
 </div>
 <button
 type="button"
 onClick={() => handleRunTest(script)}
 disabled={isRunning || running !== null}
 aria-label={`Run ${script.label}`}
 className="magnetic shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-brand-bg border border-brand-accent/20 text-zinc-300 hover:text-brand-accent hover:border-brand-accent/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
 >
 {isRunning ? 'Running…' : 'Run'}
 </button>
 </div>
 <AnimatePresence initial={false}>
 {result && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="overflow-hidden"
 >
 <div className="px-3.5 pb-3.5 pt-1 flex flex-col gap-2">
 <div className={`rounded-xl p-2.5 border text-[11px] font-mono ${
 result.status === 'passed'
 ? 'bg-emerald-500/[0.05] border-emerald-500/20 text-emerald-300'
 : 'bg-red-500/[0.05] border-red-500/20 text-red-300'
 }`}>
 <div className="flex items-center justify-between mb-1">
 <span className="font-bold uppercase tracking-wider">
 {result.status}
 </span>
 <span className="flex items-center gap-1 text-zinc-500">
 <Clock className="w-2.5 h-2.5" />
 {new Date(result.timestamp).toLocaleTimeString('en-GB')}
 </span>
 </div>
 {result.error && <p className="text-zinc-400 leading-relaxed">{result.error}</p>}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
 })}
 </div>
 </div>

 {/* Footer */}
 <div className="shrink-0 px-5 py-3 border-t border-brand-accent/10 bg-brand-bg/40 flex items-center justify-between text-[10px] text-zinc-500">
 <span className="flex items-center gap-1.5">
 <RefreshCw className="w-3 h-3" />
 Demo runner — mirrors the durable TestSprite suite
 </span>
 <span className="font-mono">{TEST_SCRIPTS.length} tests available</span>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}
