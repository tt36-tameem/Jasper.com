"use client";

import { useState } from "react";
import {
  Brain, Zap, MessageSquare, BarChart2,
  X, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/providers/BrandingProvider";
import { useAIMode } from "@/components/providers/AIModeProvider";

const FEATURES = [
  {
    icon: Brain,
    title: "Autonomous Decision Making",
    description: "AI reads your pipeline and prioritises the highest-value actions — calls, follow-ups, and replies — without you lifting a finger.",
  },
  {
    icon: MessageSquare,
    title: "Smart Reply & Script Generation",
    description: "Every message and call script is personalised in real-time based on lead data, conversation history, and deal stage.",
  },
  {
    icon: Zap,
    title: "Auto-Workflow Triggers",
    description: "AI detects intent signals and automatically moves leads through your pipeline, books meetings, and queues dialer sessions.",
  },
  {
    icon: BarChart2,
    title: "Live Performance Coaching",
    description: "Real-time feedback on your calls and messages, weekly script optimisation, and deal health scoring — always improving.",
  },
];

export function AIModeButton() {
  const { branding }             = useBranding();
  const { enabled, setEnabled }  = useAIMode();
  const [open, setOpen]          = useState(false);
  const [isPressed, setIsPressed]= useState(false);
  const [burstKey, setBurstKey]  = useState(0);

  const logo    = branding.logoUrl || "/jacsper-logo.png";
  const aiLabel = branding.aiLabel || "Jacsper Mode";

  function handleClick() {
    setBurstKey(k => k + 1);
    setOpen(true);
  }

  return (
    <>
      {/* ── Keyframes ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes jmBurstRing {
          0%   { transform: scale(1);   opacity: 0.75; }
          100% { transform: scale(4.2); opacity: 0;    }
        }
        @keyframes jmClickFlash {
          0%   { opacity: 0.45; transform: scale(0.92); }
          100% { opacity: 0;    transform: scale(1.15); }
        }
        @keyframes jmLogoPop {
          0%   { transform: scale(0.75) rotate(-8deg); }
          55%  { transform: scale(1.25) rotate(4deg);  }
          80%  { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1)   rotate(0deg);   }
        }
        @keyframes jmWiggle {
          0%,100% { transform: rotate(-3deg) scale(1);    }
          25%      { transform: rotate(3deg)  scale(1.04); }
          75%      { transform: rotate(-2deg) scale(0.97); }
        }
        @keyframes jmFloat {
          0%,100% { transform: translateY(0);   }
          50%      { transform: translateY(-5px); }
        }
        @keyframes jmRing1 {
          0%   { box-shadow: 0 0 0 0px currentColor;  opacity: 1; }
          100% { box-shadow: 0 0 0 12px currentColor; opacity: 0; }
        }
        @keyframes jmSlideUp {
          0%   { transform: translateY(20px) scale(0.96); opacity: 0; }
          60%  { transform: translateY(-4px) scale(1.01); opacity: 1; }
          100% { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        @keyframes jmBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .jm-logo-idle:hover {
            animation: jmLogoPop 0.45s cubic-bezier(0.34,1.56,0.64,1) !important;
          }
        }
      `}</style>

      {/* ── Floating button ───────────────────────────────────────────── */}
      <button
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onClick={handleClick}
        aria-label={`Open ${aiLabel}`}
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full focus:outline-none"
        style={{
          background: "transparent",
          animation: !isPressed && enabled ? "jmFloat 3s ease-in-out infinite" : undefined,
        }}
      >
        {/* ── Inner scale wrapper (handles press spring) ──────────────── */}
        <span
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            transform: isPressed ? "scale(0.84)" : "scale(1)",
            transition: isPressed
              ? "transform 0.08s ease-in"
              : "transform 0.55s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Background pill */}
          <span
            className="absolute inset-0 rounded-full bg-white dark:bg-zinc-900 transition-colors"
            style={{
              border: enabled ? `1.5px solid ${branding.primaryColor}55` : "1.5px solid rgba(0,0,0,0.08)",
              boxShadow: enabled
                ? `0 4px 20px ${branding.primaryColor}35, 0 2px 8px rgba(0,0,0,0.10)`
                : "0 2px 12px rgba(0,0,0,0.13)",
            }}
          />

          {/* Pulse rings — enabled state */}
          {enabled && (
            <>
              <span className="absolute inset-0 rounded-full" style={{ animation: "jmRing1 2.4s ease-out infinite",        boxShadow: `0 0 0 0 ${branding.primaryColor}60` }} />
              <span className="absolute inset-0 rounded-full" style={{ animation: "jmRing1 2.4s ease-out 1.2s infinite",   boxShadow: `0 0 0 0 ${branding.primaryColor}40` }} />
            </>
          )}

          {/* Burst rings — play on every click via burstKey */}
          {[0, 1, 2].map(i => (
            <span
              key={`burst-${burstKey}-${i}`}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: `2px solid ${branding.primaryColor}`,
                animation: burstKey > 0
                  ? `jmBurstRing 0.55s cubic-bezier(0,0.5,0.5,1) ${i * 85}ms forwards`
                  : "none",
                opacity: 0,
              }}
            />
          ))}

          {/* White flash on click */}
          {burstKey > 0 && (
            <span
              key={`flash-${burstKey}`}
              className="absolute inset-0 rounded-full bg-white pointer-events-none"
              style={{ animation: "jmClickFlash 0.28s ease-out forwards" }}
            />
          )}

          {/* Logo */}
          <span className="relative z-10 w-[26px] h-[26px] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={burstKey}
              src={logo}
              alt="Jacsper Mode"
              width={26}
              height={26}
              className="jm-logo-idle object-contain w-[26px] h-[26px]"
              style={{
                animation: burstKey > 0
                  ? "jmLogoPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards"
                  : enabled
                    ? "jmWiggle 3s ease-in-out infinite"
                    : undefined,
              }}
            />
          </span>
        </span>
      </button>

      {/* ── Backdrop + Panel ──────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-end justify-end p-5"
          style={{ animation: "jmBackdropIn 0.2s ease-out both" }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Panel */}
          <div
            className="w-[380px] rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 shadow-2xl shadow-black/25 dark:shadow-black/60"
            style={{ animation: "jmSlideUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >

            {/* ── Gradient header ───────────────────────────────────── */}
            <div
              className="relative px-5 pt-5 pb-4 overflow-hidden"
              style={{ background: `linear-gradient(145deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
            >
              {/* Decorative rings */}
              <span className="absolute -right-6 -top-6 w-28 h-28 rounded-full border-2 border-white/10 pointer-events-none" />
              <span className="absolute -right-2 -top-2 w-16 h-16 rounded-full border border-white/10 pointer-events-none" />

              {/* Title row */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo}
                      alt="Jacsper"
                      width={28}
                      height={28}
                      className="object-contain w-[28px] h-[28px] drop-shadow-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-white leading-tight">{aiLabel}</p>
                    <p className="text-[11px] text-white/65 mt-0.5">Full autonomous control</p>
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </button>
              </div>

              {/* Toggle row */}
              <div className="relative z-10 flex items-center justify-between mt-4 bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-[12px] font-semibold text-white leading-tight">
                    {enabled ? `${aiLabel} is Active` : `${aiLabel} is Off`}
                  </p>
                  <p className="text-[10px] text-white/55 mt-0.5">
                    {enabled ? "Running autonomously" : "Enable to let AI take the wheel"}
                  </p>
                </div>

                <button
                  onClick={() => setEnabled(v => !v)}
                  role="switch"
                  aria-checked={enabled}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 focus:outline-none",
                    enabled ? "bg-white/90" : "bg-white/25 hover:bg-white/35"
                  )}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-transform duration-300 ease-in-out"
                    style={{
                      transform: enabled ? "translateX(20px)" : "translateX(0)",
                      background: enabled
                        ? `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`
                        : "#ffffff",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* ── Features list ─────────────────────────────────────── */}
            <div className="px-5 py-4 flex flex-col gap-3.5">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">What {aiLabel} does</p>

              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${branding.primaryColor}18` }}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: branding.primaryColor }} />
                  </div>
                  <div>
                    <p className="text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">{title}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Status footer ─────────────────────────────────────── */}
            <div className={cn(
              "mx-4 mb-4 px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-all duration-300",
              enabled
                ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40"
                : "bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50"
            )}>
              <CheckCircle2
                className={cn("w-4 h-4 flex-shrink-0 transition-colors duration-300",
                  enabled ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600"
                )}
                strokeWidth={2}
              />
              <p className={cn(
                "text-[11.5px] font-medium transition-colors duration-300",
                enabled ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-400"
              )}>
                {enabled
                  ? "AI is actively managing your pipeline, scripts, and inbox"
                  : `${aiLabel} is off — all actions are manual`}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
