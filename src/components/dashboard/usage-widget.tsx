"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { useUsage } from "@/components/providers/UsageProvider";
import { METER_LABELS, type MeterKey } from "@/lib/usageStore";
import { BuyCreditsModal } from "@/components/dashboard/buy-credits";

const ORDER: MeterKey[] = ["sites", "scrapes", "research", "voiceMinutes", "emails"];

export function UsageWidget() {
  const { usage, purchased, plan } = useUsage();
  const [buyOpen, setBuyOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">Plan usage</p>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-zinc-400 hidden sm:inline">
            {plan.name} · ${plan.price}/mo · resets monthly
          </span>
          <button
            onClick={() => setBuyOpen(true)}
            className="group h-7 px-2.5 rounded-lg flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-[11px] font-semibold transition-all active:scale-95 hover:shadow-md hover:shadow-violet-500/20"
          >
            <Zap className="w-3 h-3 transition-transform group-hover:scale-110 group-hover:rotate-[-8deg]" strokeWidth={2.5} /> Add usage
          </button>
        </div>
      </div>
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-5 gap-5">
        {ORDER.map((key) => {
          const used = usage[key] ?? 0;
          const bought = purchased[key] ?? 0;
          const limit = plan.limits[key] + bought;
          const pct = Math.min(100, Math.round((used / limit) * 100));
          const near = pct >= 80;
          const full = used >= limit;
          const bar = full ? "#ef4444" : near ? "#f59e0b" : "#7c3aed";
          return (
            <div key={key}>
              <p className="text-[11px] text-zinc-400 font-medium mb-1.5">{METER_LABELS[key]}</p>
              <p className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none mb-2">
                {used.toLocaleString()}
                <span className="text-[12px] font-normal text-zinc-400">/{limit.toLocaleString()}</span>
              </p>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bar }} />
              </div>
              {full && (
                <button onClick={() => setBuyOpen(true)} className="mt-1.5 text-[10.5px] font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                  Add usage →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {buyOpen && <BuyCreditsModal onClose={() => setBuyOpen(false)} />}
    </div>
  );
}
