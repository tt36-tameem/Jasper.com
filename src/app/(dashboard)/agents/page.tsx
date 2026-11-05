"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, CheckCircle2, Phone, Mic, Cpu,
  MessageSquare, Sparkles, X, PhoneCall, Shuffle, Upload,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useBranding } from "@/components/providers/BrandingProvider";
import { cn } from "@/lib/utils";
import {
  AIAgent, Gender, AGENT_MODELS, AGENT_VOICES, AGENT_TEMPLATES, AgentTemplate,
  getAgents, saveAgent, deleteAgent, createAgent, agentFromTemplate, portrait, isUploadedAvatar,
  getActiveAgentId, setActiveAgentId,
} from "@/lib/agentStore";

// Read an uploaded image, center-crop to a square, downscale, and return a
// compact data URL (keeps localStorage small).
function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas ctx"));
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function modelLabel(id: string) {
  return AGENT_MODELS.find(m => m.id === id)?.label.split(" — ")[0] ?? id;
}
function voiceLabel(id: string) {
  return AGENT_VOICES.find(v => v.id === id)?.label.split(" — ")[0] ?? id;
}
function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

// Real human head; falls back to initials if the photo fails to load.
function AgentAvatar({ name, avatar, size = 40 }: { name: string; avatar: string; size?: number }) {
  const { branding } = useBranding();
  const [err, setErr] = useState(false);
  if (err || !avatar) {
    return (
      <span
        className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 select-none"
        style={{ width: size, height: size, fontSize: size * 0.34, background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar}
      alt={name}
      onError={() => setErr(true)}
      className="rounded-full object-cover flex-shrink-0 bg-zinc-100 dark:bg-zinc-800"
      style={{ width: size, height: size }}
    />
  );
}

export default function AgentsPage() {
  const { branding } = useBranding();
  const [agents, setAgents]       = useState<AIAgent[]>([]);
  const [activeId, setActiveId]   = useState("");
  const [editing, setEditing]     = useState<AIAgent | null>(null);
  const [picking, setPicking]     = useState(false);

  // Load from store on mount (localStorage is client-only).
  useEffect(() => {
    setAgents(getAgents());
    setActiveId(getActiveAgentId());
  }, []);

  function refresh() {
    setAgents(getAgents());
    setActiveId(getActiveAgentId());
  }

  function handleSetActive(id: string) {
    setActiveAgentId(id);
    setActiveId(id);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this agent? This can't be undone.")) return;
    deleteAgent(id);
    refresh();
  }

  function handleSave(agent: AIAgent) {
    saveAgent(agent);
    if (getAgents().length === 1) setActiveAgentId(agent.id);
    setEditing(null);
    refresh();
  }

  function pickTemplate(t: AgentTemplate) {
    setPicking(false);
    setEditing(agentFromTemplate(t));
  }

  function startBlank() {
    setPicking(false);
    setEditing(createAgent());
  }

  return (
    <div className="px-8 py-7 max-w-[920px]">
      <PageHeader
        title="AI Agents"
        count={agents.length}
        description="Reusable AI voice agents for your Power Dialer. Pick which one runs your AI calls."
      >
        <button
          onClick={() => setPicking(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12.5px] font-semibold text-white transition-all active:scale-[0.97]"
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.25} /> New Agent
        </button>
      </PageHeader>

      {/* Dialer link banner */}
      <Link
        href="/dialer"
        className="group flex items-center gap-3.5 mb-6 px-5 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
          <PhoneCall className="w-[18px] h-[18px]" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">Used in the Power Dialer</p>
          <p className="text-[11.5px] text-zinc-400 mt-0.5">
            Your active agent handles every call placed in <span className="font-medium text-zinc-500 dark:text-zinc-400">AI Agent</span> mode. Open the dialer to start calling →
          </p>
        </div>
      </Link>

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {agents.map(agent => {
          const isActive = agent.id === activeId;
          return (
            <div
              key={agent.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white dark:bg-zinc-900 p-5 transition-all",
                isActive
                  ? "border-transparent shadow-md"
                  : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
              )}
              style={isActive ? { boxShadow: `0 0 0 1.5px ${branding.primaryColor}, 0 8px 24px ${branding.primaryColor}1a` } : undefined}
            >
              {/* Header row */}
              <div className="flex items-start gap-3">
                <AgentAvatar name={agent.name} avatar={agent.avatar} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{agent.name}</p>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                        style={{ background: branding.primaryColor }}>
                        <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.5} /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {agent.description || "No description"}
                  </p>
                </div>
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-4">
                <span className="flex items-center gap-1 text-[10.5px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                  <Cpu className="w-3 h-3" /> {modelLabel(agent.model)}
                </span>
                <span className="flex items-center gap-1 text-[10.5px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                  <Mic className="w-3 h-3" /> {voiceLabel(agent.voiceId)}
                </span>
              </div>

              {/* First message preview */}
              <div className="mt-3 flex gap-2 text-[11.5px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 leading-relaxed">
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-zinc-300 dark:text-zinc-600" />
                <span className="italic line-clamp-2">&ldquo;{agent.firstMessage}&rdquo;</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800/60">
                {isActive ? (
                  <span className="flex-1 flex items-center justify-center gap-1.5 h-8 text-[12px] font-semibold text-zinc-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active agent
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetActive(agent.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" /> Set active
                  </button>
                )}
                <button
                  onClick={() => setEditing(agent)}
                  title="Edit"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(agent.id)}
                  title="Delete"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {agents.length === 0 && (
          <button
            onClick={() => setPicking(true)}
            className="col-span-full flex flex-col items-center justify-center gap-2 py-16 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
          >
            <Plus className="w-8 h-8" strokeWidth={1.5} />
            <p className="text-[13px] font-medium">No agents yet</p>
            <p className="text-[11.5px]">Create your first AI voice agent</p>
          </button>
        )}
      </div>

      {picking && (
        <TemplatePicker
          onClose={() => setPicking(false)}
          onPick={pickTemplate}
          onBlank={startBlank}
        />
      )}

      {editing && (
        <AgentEditor
          agent={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ─── Template picker ──────────────────────────────────────────────────────────
function TemplatePicker({
  onClose, onPick, onBlank,
}: {
  onClose: () => void;
  onPick: (t: AgentTemplate) => void;
  onBlank: () => void;
}) {
  const { branding } = useBranding();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-[720px] max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">Choose a template</p>
            <p className="text-[12px] text-zinc-400 mt-0.5">Start from a ready-made agent, then customise it.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates */}
        <div className="overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGENT_TEMPLATES.map(t => (
              <button
                key={t.key}
                onClick={() => onPick(t)}
                className="flex items-start gap-3 text-left p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-all"
              >
                <AgentAvatar name={t.name} avatar={t.avatar} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white" style={{ background: branding.primaryColor }}>
                      {t.role}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate mt-1">{t.name}</p>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mt-0.5">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer — blank */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
          <p className="text-[11.5px] text-zinc-400">Prefer to build your own?</p>
          <button
            onClick={onBlank}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-[12.5px] font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Start from scratch
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Editor drawer ──────────────────────────────────────────────────────────
function AgentEditor({
  agent, onClose, onSave,
}: {
  agent: AIAgent;
  onClose: () => void;
  onSave: (a: AIAgent) => void;
}) {
  const { branding } = useBranding();
  const [draft, setDraft] = useState<AIAgent>(agent);
  const [uploadErr, setUploadErr] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof AIAgent>(key: K, value: AIAgent[K]) {
    setDraft(d => ({ ...d, [key]: value }));
  }

  // Switching gender picks a matching default voice, and regenerates the
  // illustrated avatar — unless the user uploaded their own photo.
  function setGender(gender: Gender) {
    const voice = AGENT_VOICES.find(v => v.gender === gender)?.id ?? draft.voiceId;
    setDraft(d => ({
      ...d,
      gender,
      voiceId: voice,
      avatar: isUploadedAvatar(d.avatar) ? d.avatar : portrait(gender, d.name + Date.now()),
    }));
  }

  function shuffleAvatar() {
    set("avatar", portrait(draft.gender, draft.name + Math.random()));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setUploadErr(false);
    try {
      const url = await fileToAvatarDataUrl(file);
      set("avatar", url);
    } catch {
      setUploadErr(true);
    }
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all";
  const labelCls = "text-[11px] font-medium text-zinc-400 block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-[480px] bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
              <Sparkles className="w-4 h-4" strokeWidth={2} />
            </div>
            <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
              {agent.name === "New Agent" ? "New Agent" : "Edit Agent"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Avatar + gender */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <AgentAvatar name={draft.name} avatar={draft.avatar} size={64} />
              <button
                onClick={shuffleAvatar}
                title="Shuffle illustrated avatar"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white dark:border-zinc-900"
                style={{ background: branding.primaryColor }}
              >
                <Shuffle className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <label className={labelCls}>Gender (sets voice &amp; default avatar)</label>
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-1 w-fit">
                  {(["female", "male"] as Gender[]).map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        "px-4 h-7 rounded-md text-[12px] font-medium capitalize transition-all",
                        draft.gender === g ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11.5px] font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  <Upload className="w-3 h-3" /> Upload photo
                </button>
                {isUploadedAvatar(draft.avatar) && (
                  <button
                    onClick={() => set("avatar", portrait(draft.gender, draft.name + Math.random()))}
                    className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              {uploadErr && <p className="text-[11px] text-red-500">Couldn&apos;t read that image — try another file.</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={draft.name}
              onChange={e => set("name", e.target.value)} placeholder="e.g. Outbound Sales — Alex" />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <input className={inputCls} value={draft.description}
              onChange={e => set("description", e.target.value)} placeholder="What this agent is for" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Model</label>
              <select className={inputCls} value={draft.model} onChange={e => set("model", e.target.value)}>
                {AGENT_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Voice</label>
              <select className={inputCls} value={draft.voiceId} onChange={e => set("voiceId", e.target.value)}>
                {AGENT_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>First message <span className="text-zinc-300 dark:text-zinc-600">— use [Name] for the lead&apos;s name</span></label>
            <textarea className={cn(inputCls, "resize-none leading-relaxed")} rows={2} value={draft.firstMessage}
              onChange={e => set("firstMessage", e.target.value)} placeholder="Hey [Name], this is Alex from..." />
          </div>

          <div>
            <label className={labelCls}>Instructions (system prompt)</label>
            <textarea className={cn(inputCls, "resize-none leading-relaxed font-mono text-[12px]")} rows={6} value={draft.systemPrompt}
              onChange={e => set("systemPrompt", e.target.value)} placeholder="You are a friendly sales rep. Goal: book a demo. Keep replies short..." />
          </div>

          <div>
            <label className={labelCls}>End-call message</label>
            <textarea className={cn(inputCls, "resize-none leading-relaxed")} rows={2} value={draft.endCallMessage}
              onChange={e => set("endCallMessage", e.target.value)} placeholder="Thanks for your time. Have a great day!" />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur">
          <button onClick={onClose}
            className="h-9 px-4 rounded-lg text-[12.5px] font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...draft, name: draft.name.trim() || "Untitled Agent" })}
            className="h-9 px-5 rounded-lg text-[12.5px] font-semibold text-white transition-all active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
            Save agent
          </button>
        </div>
      </div>
    </div>
  );
}
