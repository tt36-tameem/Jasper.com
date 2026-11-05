"use client";

import { useEffect, useState } from "react";
import { AudioLines } from "lucide-react";
import { useBranding } from "@/components/providers/BrandingProvider";
import { useImportedLeads } from "@/components/providers/LeadsProvider";
import { speakLines } from "@/lib/voice";

const GREET_KEY = "jacsper-last-greeting";
const DAY_MS = 24 * 60 * 60 * 1000;

// Module-level guard so React strict-mode double-invokes (and layout
// re-renders) can't trigger the briefing twice in one session.
let triggeredThisSession = false;

export function VoiceGreeting() {
  const { branding, brandingReady } = useBranding();
  const { importedLeads } = useImportedLeads();
  const [caption, setCaption] = useState<string | null>(null);

  useEffect(() => {
    // Wait until branding has loaded from localStorage so addressAs / the
    // toggle reflect the user's real settings.
    if (!brandingReady || !branding.voiceGreeting) return;
    if (triggeredThisSession) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const last = Number(localStorage.getItem(GREET_KEY) || 0);
    if (last && Date.now() - last < DAY_MS) return;

    triggeredThisSession = true;

    const hour = new Date().getHours();
    const partOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const addr = branding.addressAs.trim();
    const honorific = addr ? `, ${addr}` : "";
    const outreaches = importedLeads.length || 34;

    const lines = [
      `Good ${partOfDay}${honorific}. Welcome back.`,
      `Please check your inbox.`,
      `Please review your latest reports.`,
      `You completed ${outreaches} outreaches today.`,
    ];

    let started = false;
    let cancelPrev: (() => void) | null = null;
    const removeGesture = () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
    };
    function go() {
      if (started) return;
      // A blocked first attempt left clips queued — cancel it before retrying.
      cancelPrev?.();
      cancelPrev = speakLines(lines, {
        voiceId: branding.elevenVoiceId,
        onLine: setCaption,
        onStart: () => {
          started = true;
          // Only record the timestamp once audio actually begins, so a
          // blocked autoplay doesn't silence the briefing for 24h.
          localStorage.setItem(GREET_KEY, String(Date.now()));
          removeGesture();
        },
      });
    }

    // Try immediately (works in Chrome); fall back to the first user gesture
    // if the browser blocks autoplay (Safari).
    go();
    window.addEventListener("pointerdown", go);
    window.addEventListener("keydown", go);

    return removeGesture;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandingReady, branding.voiceGreeting]);

  if (!caption) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] pointer-events-none">
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-2xl shadow-black/40 border border-white/10"
        style={{ animation: "jmCaptionIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <span className="flex items-center gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-0.5 rounded-full"
              style={{
                height: 14,
                background: branding.primaryColor,
                animation: `jmVoiceBar 0.8s ease-in-out ${i * 0.12}s infinite`,
              }}
            />
          ))}
        </span>
        <AudioLines className="w-3.5 h-3.5 text-white/70" />
        <span className="text-[13px] font-medium text-white">{caption}</span>
      </div>
      <style>{`
        @keyframes jmVoiceBar {
          0%, 100% { transform: scaleY(0.4); }
          50%      { transform: scaleY(1);   }
        }
        @keyframes jmCaptionIn {
          0%   { transform: translateY(20px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0)    scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
