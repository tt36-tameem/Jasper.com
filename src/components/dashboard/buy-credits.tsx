"use client";

import { useState } from "react";
import { X, Check, Zap } from "lucide-react";
import { useUsage } from "@/components/providers/UsageProvider";
import { BOOST_TIERS, boostCredits, METER_UNIT, type MeterKey } from "@/lib/usageStore";

const ORDER: MeterKey[] = ["sites", "scrapes", "research", "voiceMinutes", "emails"];

export function BuyCreditsModal({ onClose }: { onClose: () => void }) {
  const { plan, buyBoost } = useUsage();
  const [bought, setBought] = useState<number | null>(null);

  function buy(mult: number, price: number) {
    // Demo top-up: grants the boost instantly. Real card charging is wired to
    // Stripe Checkout as the next step.
    buyBoost(mult);
    setBought(price);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-backdrop-in" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-picker-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-500 animate-icon-pop" strokeWidth={2.5} /> Add more usage
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-transform active:scale-90"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-5 animate-content-fade">
          One top-up boosts <b>every</b> feature at once on your {plan.name} plan. Credits stack on your monthly allowance and carry over.
        </p>

        <div className="flex flex-col gap-3">
          {BOOST_TIERS.map((tier, i) => {
            const credits = boostCredits(tier.mult);
            const done = bought === tier.price;
            return (
              <div key={tier.price}
                style={{ animationDelay: `${120 + i * 80}ms` }}
                className={[
                "rounded-xl border px-4 py-3.5 transition-all duration-300 animate-content-fade",
                done ? "scale-[1.015] border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : tier.popular ? "border-violet-300 dark:border-violet-700 bg-violet-50/40 dark:bg-violet-950/20"
                             : "border-zinc-100 dark:border-zinc-800",
              ].join(" ")}>
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100">{tier.label}</p>
                      {tier.popular && <span className="text-[9.5px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 rounded-full px-2 py-0.5">Best value</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => buy(tier.mult, tier.price)}
                    disabled={done}
                    className={[
                      "flex-shrink-0 h-9 px-4 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-all active:scale-95",
                      done ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                           : "bg-violet-600 hover:bg-violet-700 text-white hover:shadow-lg hover:shadow-violet-600/25",
                    ].join(" ")}
                  >
                    {done ? <><Check className="w-3.5 h-3.5 animate-icon-pop" /> Added</> : `$${tier.price}`}
                  </button>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {ORDER.map((key) => (
                    <span key={key} className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      <b className="text-zinc-700 dark:text-zinc-300">+{credits[key].toLocaleString()}</b> {METER_UNIT[key]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10.5px] text-zinc-400 mt-4 text-center">
          Demo top-up — credits are granted instantly. Live card payments (Stripe) are the next step.
        </p>
      </div>
    </div>
  );
}
