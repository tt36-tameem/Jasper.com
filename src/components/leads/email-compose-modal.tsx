"use client";

import { useState } from "react";
import { X, Send, ChevronDown, CheckCircle2, AlertCircle, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/providers/BrandingProvider";
import { useUsage } from "@/components/providers/UsageProvider";

interface Props {
  to: string;
  toName: string;
  onClose: () => void;
}

const MERGE_TAGS = ["{{name}}", "{{company}}", "{{email}}", "{{booking_link}}"];

type SendState = "idle" | "sending" | "sent" | "error" | "no_key";

export function EmailComposeModal({ to, toName, onClose }: Props) {
  const { branding } = useBranding();
  const { meter } = useUsage();
  const [subject,   setSubject]   = useState("");
  const [body,      setBody]      = useState(`Hi ${toName.split(" ")[0]},\n\n`);
  const [replyTo,   setReplyTo]   = useState("");
  const [fromName,  setFromName]  = useState(branding.companyName);
  const [showFrom,  setShowFrom]  = useState(false);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [errorMsg,  setErrorMsg]  = useState("");

  const gradient = `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`;

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;

    const gate = meter("emails");
    if (!gate.allowed) {
      setSendState("error");
      setErrorMsg(`Monthly email limit reached (${gate.limit}). Upgrade to send more.`);
      return;
    }

    setSendState("sending");

    const res = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, from_name: fromName, reply_to: replyTo, subject, body }),
    });
    const data = await res.json();

    if (data.error === "no_key") {
      setSendState("no_key");
    } else if (!res.ok || data.error) {
      setSendState("error");
      setErrorMsg(data.error ?? "Something went wrong");
    } else {
      setSendState("sent");
      setTimeout(onClose, 2200);
    }
  }

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && sendState === "idle";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-[600px] max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gradient }}>
            <Send className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">New Email</p>
            <p className="text-[11px] text-zinc-400 truncate">To: {toName} &lt;{to}&gt;</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* From row */}
          <div className="border-b border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setShowFrom(v => !v)}
              className="w-full flex items-center gap-2 px-5 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <span className="text-[11px] font-semibold text-zinc-400 w-14 flex-shrink-0">FROM</span>
              <span className="flex-1 text-[13px] text-zinc-600 dark:text-zinc-400 truncate">{fromName}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform", showFrom && "rotate-180")} strokeWidth={2} />
            </button>
            {showFrom && (
              <div className="px-5 pb-3 space-y-2 bg-zinc-50/50 dark:bg-zinc-800/20">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Sender name</p>
                    <input
                      value={fromName}
                      onChange={e => setFromName(e.target.value)}
                      placeholder="Your name or company"
                      className="w-full px-3 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[12.5px] text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Reply-to email</p>
                    <input
                      value={replyTo}
                      onChange={e => setReplyTo(e.target.value)}
                      placeholder="reply@yourcompany.com"
                      type="email"
                      className="w-full px-3 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[12.5px] text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 w-14 flex-shrink-0">SUBJECT</span>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject line…"
              className="flex-1 bg-transparent text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none"
            />
          </div>

          {/* Body */}
          <div className="px-5 pt-3 pb-2">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={10}
              placeholder="Write your message…"
              className="w-full bg-transparent text-[13.5px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Merge tags */}
          <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
              <Sparkles className="w-3 h-3" strokeWidth={2} /> Merge tags
            </span>
            {MERGE_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setBody(b => b + tag)}
                className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2 py-0.5 rounded transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Status messages */}
          {sendState === "no_key" && (
            <div className="mx-5 mb-4 flex gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="text-[12px] leading-relaxed">
                <p className="font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Resend API key not configured</p>
                <p className="text-amber-600 dark:text-amber-500">
                  Add <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-mono">RESEND_API_KEY=re_...</code> to your <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-mono">.env.local</code> to enable sending.{" "}
                  <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline font-medium">
                    Get a free key <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          )}

          {sendState === "error" && (
            <div className="mx-5 mb-4 flex gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-[12px] text-red-600 dark:text-red-400">{errorMsg}</p>
            </div>
          )}

          {sendState === "sent" && (
            <div className="mx-5 mb-4 flex gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">Email sent to {toName}!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex-shrink-0 rounded-b-2xl">
          <p className="text-[11px] text-zinc-400 tabular-nums">{body.length} chars</p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-8 px-4 rounded-lg text-[12.5px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "flex items-center gap-1.5 h-8 px-4 rounded-lg text-[12.5px] font-semibold text-white transition-all",
                canSend ? "active:scale-[0.97]" : "opacity-40 cursor-not-allowed"
              )}
              style={canSend ? { background: gradient } : { background: "#a1a1aa" }}
            >
              {sendState === "sending"
                ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                : <><Send className="w-3 h-3" strokeWidth={2} /> Send</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
