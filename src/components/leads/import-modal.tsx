"use client";

import { useState, useRef, useCallback } from "react";
import { CloudUpload, FileSpreadsheet, X, ChevronRight, CheckCircle2, AlertCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── CSV parser ─────────────────────────────────────────────────────────── */
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const row: string[] = [];
    let cell = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === "," && !inQ) { row.push(cell.trim()); cell = ""; }
      else { cell += line[i]; }
    }
    row.push(cell.trim());
    return row;
  });
}

/* ─── Auto-detect column → field mapping ────────────────────────────────── */
const FIELD_HINTS: { field: string; label: string; pattern: RegExp }[] = [
  { field: "name",    label: "Full Name",   pattern: /^(full.?)?name$/i         },
  { field: "email",   label: "Email",       pattern: /^e.?mail$/i               },
  { field: "phone",   label: "Phone",       pattern: /^(phone|tel|mobile|cell)$/i },
  { field: "company", label: "Company",     pattern: /^(company|org|business)$/i },
  { field: "source",  label: "Lead Source", pattern: /^(source|channel|origin)$/i },
  { field: "status",  label: "Status",      pattern: /^(status|stage)$/i         },
];

function autoMap(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { field, pattern } of FIELD_HINTS) {
    const match = headers.find(h => pattern.test(h.trim()));
    if (match) map[field] = match;
  }
  return map;
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}

type Step = 1 | 2 | 3;

/* ─── Step indicators ────────────────────────────────────────────────────── */
const STEPS = ["Upload file", "Map columns", "Import"];

function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((label, i) => {
        const n = (i + 1) as Step;
        const done   = current > n;
        const active = current === n;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all",
                done   ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" :
                active ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" :
                         "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
              )}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} /> : n}
              </span>
              <span className={cn(
                "text-[10px] font-medium whitespace-nowrap",
                active ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"
              )}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-16 mx-2 mb-4 transition-colors",
                current > n ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
export function ImportModal({ open, onClose, onImported }: ImportModalProps) {
  const [step,      setStep]      = useState<Step>(1);
  const [file,      setFile]      = useState<File | null>(null);
  const [rows,      setRows]      = useState<string[][]>([]);
  const [headers,   setHeaders]   = useState<string[]>([]);
  const [colMap,    setColMap]    = useState<Record<string, string>>({});
  const [dragging,  setDragging]  = useState(false);
  const [importing, setImporting] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── file processing ── */
  const processFile = useCallback((f: File) => {
    setError(null);
    if (!f.name.endsWith(".csv") && !f.name.endsWith(".txt")) {
      setError("Only .csv files are supported. Please export your spreadsheet as CSV first.");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const all  = parseCSV(text);
      if (all.length < 2) { setError("File appears to be empty or has only headers."); return; }
      const hdrs = all[0];
      const data = all.slice(1);
      setFile(f);
      setHeaders(hdrs);
      setRows(data);
      setColMap(autoMap(hdrs));
      setStep(2);
    };
    reader.readAsText(f);
  }, []);

  /* ── drag & drop ── */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  /* ── import ── */
  async function runImport() {
    setImporting(true);
    await new Promise(r => setTimeout(r, 900));   // simulate processing
    const validRows = rows.filter(r => r.some(c => c.trim()));
    setImporting(false);
    setStep(3);
    onImported(validRows.length);
  }

  /* ── reset ── */
  function reset() {
    setStep(1); setFile(null); setRows([]); setHeaders([]);
    setColMap({}); setError(null); setImporting(false);
  }

  function close() { reset(); onClose(); }

  const PREVIEW_ROWS = rows.slice(0, 4);
  const mappedCount  = Object.values(colMap).filter(Boolean).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm" onClick={close} />

      {/* Panel */}
      <div className={cn(
        "relative z-10 w-full max-w-[600px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl",
        "border border-zinc-200 dark:border-zinc-700 flex flex-col max-h-[90vh] overflow-hidden"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">Import Leads</h2>
            <p className="text-[12px] text-zinc-400 mt-0.5">
              {step === 1 && "Upload a CSV file to bulk-import leads"}
              {step === 2 && `${rows.length} rows detected — map your columns below`}
              {step === 3 && "Import complete"}
            </p>
          </div>
          <button onClick={close} className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <StepBar current={step} />

          {/* ── Step 1: Upload ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-all",
                  dragging
                    ? "border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800/40"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                )}
              >
                <span className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <CloudUpload className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                </span>
                <div className="text-center">
                  <p className="text-[14px] font-medium text-zinc-700 dark:text-zinc-300">
                    Drop your CSV file here
                  </p>
                  <p className="text-[12px] text-zinc-400 mt-0.5">or <span className="underline underline-offset-2">click to browse</span></p>
                </div>
                <span className="text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1">
                  .csv files only
                </span>
                <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-800/40 rounded-lg px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                  <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Template hint */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-4 py-3">
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Expected columns
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Name", "Email", "Phone", "Company", "Source", "Status"].map(col => (
                    <span key={col} className="text-[11px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 rounded px-2 py-0.5 font-mono">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Map columns ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              {/* Preview */}
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Preview — first {PREVIEW_ROWS.length} rows
                </p>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-x-auto">
                  <table className="text-[11px] w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60">
                        {headers.map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {PREVIEW_ROWS.map((row, ri) => (
                        <tr key={ri} className="bg-white dark:bg-zinc-900">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap max-w-[140px] truncate">
                              {cell || <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Column mapping */}
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                  Map columns to lead fields
                </p>
                <div className="flex flex-col gap-2">
                  {FIELD_HINTS.map(({ field, label }) => (
                    <div key={field} className="flex items-center gap-3">
                      <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 w-28 flex-shrink-0">
                        {label}
                      </span>
                      <select
                        value={colMap[field] ?? ""}
                        onChange={e => setColMap(m => ({ ...m, [field]: e.target.value }))}
                        className="flex-1 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[12px] text-zinc-700 dark:text-zinc-300 px-3 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors appearance-none"
                      >
                        <option value="">— skip —</option>
                        {headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {file && (
                <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-zinc-400 flex-shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 truncate">{file.name}</p>
                    <p className="text-[10px] text-zinc-400">
                      {rows.length} data rows · {mappedCount} of {FIELD_HINTS.length} fields mapped
                    </p>
                  </div>
                  <button onClick={reset} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors underline">
                    Change file
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div className="flex flex-col items-center py-8 text-center gap-4">
              <span className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {rows.length} leads imported
                </h3>
                <p className="text-[13px] text-zinc-400 mt-1 max-w-xs">
                  All leads have been added to your pipeline and are ready to work.
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                {["New", "Contacted", "Qualified"].map((s, i) => (
                  <span key={s} className="text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full px-3 py-1">
                    {[Math.ceil(rows.length * 0.6), Math.ceil(rows.length * 0.25), Math.floor(rows.length * 0.15)][i]} {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 3 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
            <button
              onClick={step === 1 ? close : () => setStep((step - 1) as Step)}
              className="text-[13px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              {step === 1 ? "Cancel" : "← Back"}
            </button>

            {step === 1 && (
              <button
                disabled
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 text-[13px] font-medium cursor-not-allowed"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={runImport}
                disabled={importing || mappedCount === 0}
                className={cn(
                  "flex items-center gap-1.5 h-8 px-4 rounded-lg text-[13px] font-medium transition-all",
                  importing || mappedCount === 0
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                    : "bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-white dark:text-zinc-900"
                )}
              >
                {importing
                  ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Importing…</>
                  : <>Import {rows.length} leads</>
                }
              </button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex justify-center px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
            <button
              onClick={close}
              className="h-8 px-6 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 text-[13px] font-medium transition-all"
            >
              Done — view leads
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
