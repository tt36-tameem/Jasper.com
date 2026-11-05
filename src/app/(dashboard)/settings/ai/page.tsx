"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useBranding } from "@/components/providers/BrandingProvider";
import { BackButton } from "@/components/layout/back-button";

const PLACEHOLDER = `e.g. We are a real estate agency based in Dubai specialising in luxury off-plan properties. Our typical client is a high-net-worth investor. We focus on speed, trust, and personalised service. Our team of 8 agents handles 50–80 leads per month across Instagram DMs, SMS, and email.`;

export default function AISettingsPage() {
  const { branding, saveBranding } = useBranding();
  const [text, setText] = useState(branding.systemPrompt ?? "");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    saveBranding({ systemPrompt: text.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="px-8 py-7 max-w-[680px]">
      <BackButton />
      <PageHeader
        title="AI & System Prompt"
        description="Tell the AI about your business so every response is personalised to you."
      />

      <div className="flex flex-col gap-5">

        {/* Info card */}
        <div className="flex gap-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
          <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          <div className="text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed space-y-1">
            <p>Your system prompt is injected into every AI feature across Aura — smart replies, the AI assistant, scripts, reports, and more.</p>
            <p className="text-zinc-400">Include your business name, industry, target customer, tone of voice, and any context that helps the AI speak like your brand.</p>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
                <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              </div>
              <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">Business System Prompt</p>
            </div>
            <span className="text-[11px] text-zinc-400 tabular-nums">{wordCount} words</span>
          </div>

          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setSaved(false); }}
            placeholder={PLACEHOLDER}
            rows={10}
            className="w-full px-5 py-4 text-[13px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 bg-transparent resize-none outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
            <p className="text-[11.5px] text-zinc-400">
              {text.trim() ? "Prompt saved — AI will use this context across the app." : "No prompt set yet. AI will use generic responses."}
            </p>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-[12.5px] font-semibold text-white transition-all active:scale-[0.97]"
              style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
              {saved
                ? <><CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> Saved</>
                : "Save prompt"}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800/60">
          <div className="px-5 py-3">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">What to include</p>
            <ul className="space-y-1.5">
              {[
                ["Business name & industry", "e.g. \"We are Luna Agency, a luxury real estate firm in Dubai\""],
                ["Your target customer", "e.g. \"Our clients are high-net-worth investors aged 35–55\""],
                ["Products or services", "e.g. \"We sell off-plan apartments and villas from AED 1M+\""],
                ["Tone & communication style", "e.g. \"Formal but warm — no slang, always professional\""],
                ["Key selling points", "e.g. \"We close deals in under 7 days with dedicated advisors\""],
              ].map(([label, example]) => (
                <li key={label} className="flex gap-2.5 text-[12px]">
                  <span className="text-zinc-300 dark:text-zinc-600 mt-0.5">·</span>
                  <span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
                    <span className="text-zinc-400 ml-1.5">{example}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
