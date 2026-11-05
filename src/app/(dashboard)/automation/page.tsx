"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { useAIMode } from "@/components/providers/AIModeProvider";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  Play, Pause, Plus, Sparkles,
  Zap, Mail, MessageSquare, Phone, GitBranch, Clock,
  ChevronRight, MessageCircle, Camera, Users, Hash,
  AlarmClock, Flag, Tag, Pencil, UserPlus, FileText,
  ClipboardList, Globe, CalendarPlus, BookOpen, Briefcase,
  Megaphone, Film, AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Workflow, type NodeType,
  getWorkflows, INSTAGRAM_TEMPLATES, createWorkflowFromTemplate,
} from "@/lib/workflowStore";
import { RunModal, RunsLog } from "@/components/automation/automation-live";

const NODE_ICON: Record<NodeType, {
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  bg: string; color: string;
}> = {
  trigger:       { icon: Zap,           bg: "bg-amber-50   dark:bg-amber-950/40",    color: "#f59e0b" },
  delay:         { icon: Clock,         bg: "bg-zinc-100   dark:bg-zinc-800",         color: "#71717a" },
  call:          { icon: Phone,         bg: "bg-emerald-50 dark:bg-emerald-950/40",   color: "#10b981" },
  sms:           { icon: MessageSquare, bg: "bg-violet-50  dark:bg-violet-950/40",    color: "#8b5cf6" },
  email:         { icon: Mail,          bg: "bg-blue-50    dark:bg-blue-950/40",      color: "#3b82f6" },
  branch:        { icon: GitBranch,     bg: "bg-orange-50  dark:bg-orange-950/40",    color: "#f97316" },
  message:       { icon: MessageSquare, bg: "bg-rose-50    dark:bg-rose-950/40",      color: "#ec4899" },
  whatsapp:      { icon: MessageCircle, bg: "bg-green-50   dark:bg-green-950/40",     color: "#25d366" },
  instagram:     { icon: Camera,        bg: "bg-pink-50    dark:bg-pink-950/40",      color: "#e1306c" },
  facebook:      { icon: Users,         bg: "bg-blue-50    dark:bg-blue-950/40",      color: "#1877f2" },
  slack:         { icon: Hash,          bg: "bg-purple-50  dark:bg-purple-950/40",    color: "#4a154b" },
  wait_condition:{ icon: AlarmClock,    bg: "bg-sky-50     dark:bg-sky-950/40",       color: "#0ea5e9" },
  goal:          { icon: Flag,          bg: "bg-green-50   dark:bg-green-950/40",     color: "#22c55e" },
  tag:           { icon: Tag,           bg: "bg-purple-50  dark:bg-purple-950/40",    color: "#a855f7" },
  update_field:  { icon: Pencil,        bg: "bg-slate-50   dark:bg-slate-900/40",     color: "#64748b" },
  assign:        { icon: UserPlus,      bg: "bg-cyan-50    dark:bg-cyan-950/40",      color: "#0891b2" },
  note:          { icon: FileText,      bg: "bg-amber-50   dark:bg-amber-950/40",     color: "#d97706" },
  task:          { icon: ClipboardList, bg: "bg-green-50   dark:bg-green-950/40",     color: "#16a34a" },
  ig_story:            { icon: Film,          bg: "bg-pink-50    dark:bg-pink-950/40",      color: "#e1306c" },
  ig_comment_dm:       { icon: AtSign,        bg: "bg-pink-50    dark:bg-pink-950/40",      color: "#e1306c" },
  webhook:             { icon: Globe,         bg: "bg-indigo-50  dark:bg-indigo-950/40",    color: "#6366f1" },
  vapi_call:           { icon: Phone,         bg: "bg-violet-50  dark:bg-violet-950/40",    color: "#7c3aed" },
  calendar:            { icon: CalendarPlus,  bg: "bg-blue-50    dark:bg-blue-950/40",       color: "#4285f4" },
  notion_page:         { icon: BookOpen,      bg: "bg-zinc-100   dark:bg-zinc-800",           color: "#000000" },
  zapier_trigger:      { icon: Zap,           bg: "bg-orange-50  dark:bg-orange-950/40",    color: "#ff4a00" },
  linkedin_dm:         { icon: Briefcase,     bg: "bg-blue-50    dark:bg-blue-950/40",       color: "#0a66c2" },
  google_ads_audience: { icon: Megaphone,     bg: "bg-blue-50    dark:bg-blue-950/40",       color: "#4285f4" },
  meta_ads_audience:   { icon: Megaphone,     bg: "bg-blue-50    dark:bg-blue-950/40",       color: "#1877f2" },
};

function NodeFlow({ nodes }: { nodes: { type: NodeType }[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {nodes.map((node, i) => {
        const cfg = NODE_ICON[node.type];
        if (!cfg) return null;
        return (
          <div key={i} className="flex items-center gap-1">
            <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", cfg.bg)}>
              <cfg.icon className="w-3.5 h-3.5" style={{ color: cfg.color }} strokeWidth={1.75} />
            </span>
            {i < nodes.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 flex-shrink-0" strokeWidth={2} />}
          </div>
        );
      })}
    </div>
  );
}

function WorkflowRow({ wf, onClick, onRun }: { wf: Workflow; onClick: () => void; onRun: (wf: Workflow) => void }) {
  const [status, setStatus]      = useState<"active" | "paused">(wf.status);
  const [runs, setRuns]          = useState(wf.runs);
  const [justActivated, setJust] = useState(false);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (status === "paused") {
      setStatus("active"); setRuns(r => r + 1);
      setJust(true); setTimeout(() => setJust(false), 2000);
    } else {
      setStatus("paused");
    }
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-zinc-900 rounded-xl border px-5 py-4 cursor-pointer",
        "hover:shadow-[0_1px_8px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_1px_8px_rgba(0,0,0,0.3)] transition-all",
        wf.aiSuggested
          ? "border-violet-200 dark:border-violet-800/60"
          : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300",
          wf.aiSuggested && status === "paused"
            ? "bg-violet-400"
            : status === "active"
              ? "bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.2)] animate-pulse"
              : "bg-zinc-300 dark:bg-zinc-600"
        )} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{wf.name}</p>
            {wf.aiSuggested && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/40 rounded-full px-2 py-0.5">
                <Sparkles className="w-2.5 h-2.5" strokeWidth={2} /> AI Suggested
              </span>
            )}
            {justActivated && <span className="text-[10px] font-medium text-emerald-500 animate-pulse">● Running</span>}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">{wf.description}</p>
        </div>

        <span className="text-[11px] text-zinc-400 flex-shrink-0 tabular-nums">
          {runs > 0 ? `${runs.toLocaleString()} runs` : "Not started"}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onRun(wf); }}
          title="Run now (live)"
          className="flex-shrink-0 h-7 px-2.5 rounded-lg flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-[11px] font-medium transition-colors"
        >
          <Play className="w-3 h-3" strokeWidth={2.5} /> Run
        </button>

        <button
          onClick={toggle}
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
            wf.aiSuggested && status === "paused"
              ? "bg-violet-50 dark:bg-violet-950/40 text-violet-500 hover:bg-violet-100"
              : status === "active"
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 hover:bg-emerald-100"
          )}
        >
          {status === "active"
            ? <Pause className="w-3 h-3" strokeWidth={2} />
            : <Play  className="w-3 h-3" strokeWidth={2} />
          }
        </button>
      </div>

      <div className="pl-4">
        <NodeFlow nodes={wf.nodes} />
      </div>
    </div>
  );
}

const AI_WORKFLOW: Workflow = {
  id: "99",
  name: "Win-Back Re-engagement",
  description: "AI detected 3 deals stale 14+ days — auto SMS + email sequence to re-engage",
  status: "paused", runs: 0, aiSuggested: true,
  nodes: [
    { id: "a1", type: "trigger",      config: { event: "stage_changed" } },
    { id: "a2", type: "delay",        config: { amount: "14", unit: "days" } },
    { id: "a3", type: "sms",         config: { message: "Hey {{name}}, just checking in…" } },
    { id: "a4", type: "email",        config: { subject: "Still interested?", body: "Hi {{name}},\n\nWanted to follow up…" } },
    { id: "a5", type: "branch",       config: { condition: "email_opened", else_action: "end" } },
    { id: "a6", type: "call",         config: { script: "Hi, just following up on my email…" } },
  ],
};

// ─── Template card ────────────────────────────────────────────────────────────
function TemplateCard({ template, onUse }: { template: typeof INSTAGRAM_TEMPLATES[number]; onUse: () => void }) {
  const { branding } = useBranding();
  const gradient = `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`;
  return (
    <div className="flex-shrink-0 w-[248px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-zinc-200 dark:hover:border-zinc-700">
      {/* colour bar */}
      <div className="h-1 w-full" style={{ background: gradient }} />
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[18px] leading-none">{template.emoji}</span>
            <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">{template.name}</p>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">{template.description}</p>
        </div>
        {/* tag chips */}
        <div className="flex gap-1 flex-wrap">
          {template.tags.map(t => (
            <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/50">
              {t}
            </span>
          ))}
        </div>
        {/* node flow preview */}
        <NodeFlow nodes={template.nodes.slice(0, 6)} />
        {template.nodes.length > 6 && (
          <p className="text-[10px] text-zinc-400">+{template.nodes.length - 6} more steps</p>
        )}
        {/* CTA */}
        <button
          onClick={onUse}
          className="mt-auto w-full h-8 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: gradient }}
        >
          Use Template →
        </button>
      </div>
    </div>
  );
}

export default function AutomationPage() {
  const { enabled }  = useAIMode();
  const { branding } = useBranding();
  const router       = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runTarget, setRunTarget] = useState<Workflow | null>(null);
  const [logKey, setLogKey] = useState(0);

  useEffect(() => { setWorkflows(getWorkflows()); }, []);

  function handleUseTemplate(template: typeof INSTAGRAM_TEMPLATES[number]) {
    const wf = createWorkflowFromTemplate(template);
    router.push(`/automation/builder?id=${wf.id}`);
  }

  return (
    <div className="px-8 py-7 max-w-[1100px]">
      <PageHeader
        title="Automation"
        count={workflows.length + (enabled ? 1 : 0)}
        description="Build and manage multi-channel workflows."
      />

      {/* ── Instagram Funnel Templates ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[14px]">📱</span>
          <p className="text-[12px] font-semibold text-zinc-600 dark:text-zinc-400">Instagram Funnels</p>
          <span className="text-[10px] text-zinc-400 ml-1">— click any template to start building</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-0.5 px-0.5">
          {INSTAGRAM_TEMPLATES.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={() => handleUseTemplate(template)}
            />
          ))}
        </div>
      </div>

      {enabled && (
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl mb-4 text-[12px] font-medium text-white"
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
        >
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
          Jacsper detected 3 stale deals — a re-engagement workflow has been queued below
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {enabled && (
          <WorkflowRow wf={AI_WORKFLOW} onClick={() => router.push(`/automation/builder?id=${AI_WORKFLOW.id}`)} onRun={setRunTarget} />
        )}

        {workflows.map(wf => (
          <WorkflowRow key={wf.id} wf={wf} onClick={() => router.push(`/automation/builder?id=${wf.id}`)} onRun={setRunTarget} />
        ))}

        <button
          onClick={() => router.push("/automation/builder?new=1")}
          className="w-full h-11 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-[12px] text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          New Workflow
        </button>
      </div>

      <RunsLog refreshKey={logKey} />

      {runTarget && (
        <RunModal
          workflow={runTarget}
          onClose={() => setRunTarget(null)}
          onStarted={() => setLogKey(k => k + 1)}
        />
      )}
    </div>
  );
}
