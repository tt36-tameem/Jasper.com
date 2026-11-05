"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Play, RefreshCw, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import type { Workflow } from "@/lib/workflowStore";

interface LogEntry { at: string; node: string; type: string; status: string; detail: string }
interface Run {
  id: string;
  workflow_name: string;
  status: "running" | "waiting" | "completed" | "failed";
  log: LogEntry[];
  error?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Background ticker — resumes delayed runs while the app is open ───────────
// (Production also uses pg_cron hitting /api/automation/tick every minute.)
export function AutomationTicker() {
  useEffect(() => {
    const tick = () => { fetch("/api/automation/tick", { method: "POST" }).catch(() => {}); };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return null;
}

// ── "Run now" modal — collects a test lead context and starts a run ──────────
export function RunModal({ workflow, onClose, onStarted }: {
  workflow: Workflow;
  onClose: () => void;
  onStarted: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/automation/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: workflow.id,
          workflowName: workflow.name,
          nodes: workflow.nodes,
          context: { name, email, company, booking_link: "https://cal.com/your-link" },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Failed to start run"); setBusy(false); return; }
      onStarted();
      onClose();
    } catch {
      setErr("Network error"); setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md mx-4 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">Run “{workflow.name}”</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-4">Runs the workflow live against this contact. Email steps send for real; delays resume automatically.</p>
        <div className="flex flex-col gap-2.5">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Contact name"
            className="w-full px-3 py-2 text-[13px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-violet-400" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (for live email steps)"
            className="w-full px-3 py-2 text-[13px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-violet-400" />
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company"
            className="w-full px-3 py-2 text-[13px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-violet-400" />
        </div>
        {err && <p className="mt-3 text-[12px] text-red-500">{err}</p>}
        <button onClick={run} disabled={busy}
          className="mt-4 w-full h-9 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {busy ? "Starting…" : "Run now"}
        </button>
      </div>
    </div>
  );
}

const STATUS_META: Record<Run["status"], { icon: React.FC<{ className?: string; style?: React.CSSProperties }>; color: string; label: string }> = {
  running:   { icon: Loader2,      color: "#3b82f6", label: "Running" },
  waiting:   { icon: Clock,        color: "#f59e0b", label: "Waiting (delay)" },
  completed: { icon: CheckCircle2, color: "#10b981", label: "Completed" },
  failed:    { icon: AlertCircle,  color: "#ef4444", label: "Failed" },
};

// ── Live run log — polls recent runs so you can watch execution ──────────────
export function RunsLog({ refreshKey }: { refreshKey: number }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/automation/runs");
      const data = await res.json();
      setRuns(data.runs ?? []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => {
    timer.current = setInterval(load, 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [load]);

  if (runs.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="w-3.5 h-3.5 text-zinc-400" strokeWidth={2} />
        <p className="text-[12px] font-semibold text-zinc-600 dark:text-zinc-400">Live runs</p>
        <span className="text-[10px] text-zinc-400">— updates every few seconds</span>
      </div>
      <div className="flex flex-col gap-2">
        {runs.map(run => {
          const meta = STATUS_META[run.status];
          const Icon = meta.icon;
          const last = run.log?.[run.log.length - 1];
          const isOpen = open === run.id;
          return (
            <div key={run.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setOpen(isOpen ? null : run.id)}>
                <Icon className={cnSpin(run.status)} style={{ color: meta.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200 truncate">{run.workflow_name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{last ? `${last.type}: ${last.detail}` : "starting…"}</p>
                </div>
                <span className="text-[10.5px] font-medium flex-shrink-0" style={{ color: meta.color }}>{meta.label}</span>
              </div>
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5">
                  {(run.log ?? []).map((l, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span className="text-zinc-300 dark:text-zinc-600 tabular-nums flex-shrink-0">{new Date(l.at).toLocaleTimeString()}</span>
                      <span className={
                        l.status === "error" ? "text-red-500" :
                        l.status === "skipped" ? "text-amber-500" :
                        l.status === "scheduled" ? "text-blue-500" : "text-zinc-500 dark:text-zinc-400"
                      }>
                        <b className="text-zinc-700 dark:text-zinc-300">{l.type}</b> — {l.detail}
                      </span>
                    </div>
                  ))}
                  {run.error && <p className="text-[11px] text-red-500">Error: {run.error}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cnSpin(status: Run["status"]) {
  return status === "running" ? "w-4 h-4 flex-shrink-0 animate-spin" : "w-4 h-4 flex-shrink-0";
}
