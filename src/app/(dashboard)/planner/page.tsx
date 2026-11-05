"use client";

import { useState, useEffect, useRef, memo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAIMode } from "@/components/providers/AIModeProvider";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  Brain, RefreshCw, Plus, Flag, Calendar,
  Target, CheckCircle2, Circle, Clock, AlertCircle,
  Camera, Film, Mail, MessageSquare, Briefcase, Send,
  FileEdit, PenLine, CalendarDays, X, ChevronRight, ChevronLeft,
  Trash2, ArrowRight, StickyNote, Search, Pin, Star, MoreHorizontal,
  ImagePlus, ExternalLink, Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Priority      = "high" | "medium" | "low";
type KanbanCol     = "todo" | "inprogress" | "review" | "done";
type ContentStatus = "draft" | "scheduled" | "published";
type PlatformId    = "instagram" | "tiktok" | "linkedin" | "youtube" | "email" | "sms";
type Tab           = "content" | "planner" | "notes";

interface Task {
  id: string; title: string; description?: string;
  priority: Priority; category: string; due?: string; column: KanbanCol;
}

interface ContentItem {
  id: string; platform: PlatformId; title: string; body: string;
  status: ContentStatus; date: string; time?: string; engagement?: string;
}

interface Goal {
  id: string; title: string; progress: number; target: string; category: string; due: string;
}

/* ─── Static data ────────────────────────────────────────────────────────── */

const PLATFORMS = [
  { id: "all",       label: "All"       },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok",    label: "TikTok"    },
  { id: "linkedin",  label: "LinkedIn"  },
  { id: "youtube",   label: "YouTube"   },
  { id: "email",     label: "Email"     },
  { id: "sms",       label: "SMS"       },
];

const PLATFORM_COLORS: Record<PlatformId, string> = {
  instagram: "#E1306C", tiktok: "#010101", linkedin: "#0A66C2",
  youtube: "#FF0000", email: "#6366f1", sms: "#10b981",
};

const PLATFORM_ICONS: Record<PlatformId, React.ElementType> = {
  instagram: Camera, tiktok: Film, linkedin: Briefcase,
  youtube: Send, email: Mail, sms: MessageSquare,
};

const STATUS_CYCLE: Record<ContentStatus, ContentStatus> = {
  draft: "scheduled", scheduled: "published", published: "draft",
};

const STATUS_CONFIG: Record<ContentStatus, { label: string; icon: React.ElementType; cls: string }> = {
  draft:     { label: "Draft",     icon: FileEdit,     cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
  scheduled: { label: "Scheduled", icon: Clock,        cls: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
  published: { label: "Published", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PRIORITY_CONFIG: Record<Priority, { label: string; cls: string; dot: string }> = {
  high:   { label: "High",   cls: "text-red-500",   dot: "bg-red-400"   },
  medium: { label: "Medium", cls: "text-amber-500", dot: "bg-amber-400" },
  low:    { label: "Low",    cls: "text-zinc-400",  dot: "bg-zinc-400"  },
};

const KANBAN_COLS: { id: KanbanCol; label: string; color: string; next?: KanbanCol; prev?: KanbanCol }[] = [
  { id: "todo",       label: "To Do",       color: "text-zinc-500 dark:text-zinc-400",   next: "inprogress" },
  { id: "inprogress", label: "In Progress", color: "text-blue-500 dark:text-blue-400",   next: "review",     prev: "todo"       },
  { id: "review",     label: "Review",      color: "text-amber-500 dark:text-amber-400", next: "done",       prev: "inprogress" },
  { id: "done",       label: "Done",        color: "text-emerald-500",                   prev: "review"      },
];

const CATEGORIES = ["Marketing", "Strategy", "HR", "Content", "Tech", "Sales", "Ops"];

const CATEGORY_COLORS: Record<string, string> = {
  Marketing: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  Strategy:  "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  HR:        "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",
  Content:   "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  Tech:      "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400",
  Sales:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  Ops:       "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  Revenue:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  Growth:    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
};

const INIT_TASKS: Task[] = [
  { id: "1",  title: "Set up LinkedIn automation sequence",  description: "Configure drip campaign for new leads",      priority: "high",   category: "Marketing", due: "May 28", column: "todo"       },
  { id: "2",  title: "Review Q2 pipeline targets",           description: "Compare actuals vs forecast for all stages", priority: "high",   category: "Strategy",  due: "May 29", column: "todo"       },
  { id: "3",  title: "Onboard 3 new SDRs",                   description: "CRM training, dialer setup, scripts",        priority: "medium", category: "HR",        due: "Jun 2",  column: "todo"       },
  { id: "4",  title: "Build June content calendar",          description: "Instagram, LinkedIn, Email — full month",    priority: "medium", category: "Content",   due: "May 30", column: "todo"       },
  { id: "5",  title: "Integrate Vapi AI dialer",             description: "Connect Vapi to CRM, test call scripts",     priority: "high",   category: "Tech",      due: "May 28", column: "inprogress" },
  { id: "6",  title: "Refresh email sequences",              description: "Update 5 key sequences with new templates",  priority: "medium", category: "Marketing", due: "Jun 1",  column: "inprogress" },
  { id: "7",  title: "A/B test cold outreach subject lines", description: "Run 2-week test across 500 leads",           priority: "low",    category: "Marketing", due: "Jun 5",  column: "inprogress" },
  { id: "8",  title: "Audit CRM data quality",               description: "Remove duplicates, enrich missing fields",   priority: "medium", category: "Ops",       due: "May 27", column: "review"     },
  { id: "9",  title: "Update sales scripts for Q3",          description: "Incorporate new objection handling",         priority: "high",   category: "Sales",     due: "May 31", column: "review"     },
  { id: "10", title: "Deploy new landing pages",             description: "3 pages for PPC campaigns",                  priority: "low",    category: "Marketing", column: "done" },
  { id: "11", title: "Configure Zapier workflows",           description: "Lead import and Slack notification flows",   priority: "medium", category: "Tech",      column: "done" },
  { id: "12", title: "May newsletter sent",                  description: "38% open rate achieved",                     priority: "low",    category: "Content",   column: "done" },
];

const INIT_CONTENT: ContentItem[] = [
  { id: "1", platform: "instagram", title: "Client Win Highlight",     body: "📈 Another deal closed! Here's how we helped Ryan Fitzgerald…", status: "published", date: "Mon", time: "9:00 AM",  engagement: "847 likes" },
  { id: "2", platform: "linkedin",  title: "Thought Leadership Post",  body: "The future of AI in real estate CRM — 3 trends you need to know.", status: "published", date: "Mon", time: "11:00 AM", engagement: "1.2k views" },
  { id: "3", platform: "email",     title: "Weekly Newsletter",        body: "This week: market trends, hot leads, and your pipeline snapshot.", status: "published", date: "Tue", time: "8:00 AM",  engagement: "38% open" },
  { id: "4", platform: "instagram", title: "Behind the Scenes",        body: "A day in the life of our sales team. Swipe to see the process →",  status: "scheduled", date: "Wed", time: "10:00 AM" },
  { id: "5", platform: "tiktok",    title: "Quick Tips Video",         body: "3 cold calling mistakes that kill your connect rate. #CRM #Sales", status: "scheduled", date: "Wed", time: "6:00 PM" },
  { id: "6", platform: "linkedin",  title: "Case Study: +40% Revenue", body: "How one team grew pipeline by $120k in 30 days using automation.", status: "scheduled", date: "Thu", time: "9:30 AM" },
  { id: "7", platform: "sms",       title: "Re-engagement Blast",      body: "Hi {name}, checking in — any questions about the proposal?",      status: "draft",     date: "Fri" },
  { id: "8", platform: "email",     title: "Promo: Summer Campaign",   body: "Subject: Close more deals before Q3 — here's your playbook.",     status: "draft",     date: "Fri" },
  { id: "9", platform: "youtube",   title: "Product Demo Walkthrough", body: "Full walkthrough of the new AI dialer and smart reply features.", status: "draft",     date: "Sat" },
];

const GOALS: Goal[] = [
  { id: "g1", title: "Close $500k Pipeline",   progress: 57, target: "$284k / $500k", category: "Revenue", due: "Jun 30" },
  { id: "g2", title: "Reach 400 Active Leads", progress: 73, target: "292 / 400",     category: "Growth",  due: "Jun 30" },
  { id: "g3", title: "70% Call Connect Rate",  progress: 91, target: "64% / 70%",     category: "Ops",     due: "May 31" },
  { id: "g4", title: "Launch 5 Automations",   progress: 60, target: "3 / 5",         category: "Tech",    due: "Jun 15" },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function uid() { return Math.random().toString(36).slice(2, 9); }

function PlatformIcon({ platform, size = 12 }: { platform: PlatformId; size?: number }) {
  const Icon = PLATFORM_ICONS[platform];
  return <Icon style={{ width: size, height: size, color: PLATFORM_COLORS[platform] }} strokeWidth={2} />;
}

/* ─── Add Task Modal ─────────────────────────────────────────────────────── */

interface AddTaskModalProps {
  defaultCol: KanbanCol;
  onAdd: (t: Task) => void;
  onClose: () => void;
}

function AddTaskModal({ defaultCol, onAdd, onClose }: AddTaskModalProps) {
  const { branding } = useBranding();
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("Marketing");
  const [due, setDue]           = useState("");
  const [col, setCol]           = useState<KanbanCol>(defaultCol);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ id: uid(), title: title.trim(), description: desc.trim() || undefined, priority, category, due: due || undefined, column: col });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
        style={{ animation: "slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(24px) scale(0.97);opacity:0}to{transform:none;opacity:1}}`}</style>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">New Task</p>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3.5">
          <div>
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Title <span className="text-red-400">*</span></label>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Description</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional details…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 transition-colors">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 transition-colors">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Due date</label>
              <input value={due} onChange={(e) => setDue(e.target.value)} placeholder="e.g. Jun 5"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Column</label>
              <select value={col} onChange={(e) => setCol(e.target.value as KanbanCol)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 transition-colors">
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[13px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Add Post Modal ─────────────────────────────────────────────────────── */

interface AddPostModalProps {
  defaultDay?: string;
  onAdd: (p: ContentItem) => void;
  onClose: () => void;
}

function AddPostModal({ defaultDay, onAdd, onClose }: AddPostModalProps) {
  const { branding } = useBranding();
  const [title, setTitle]       = useState("");
  const [body, setBody]         = useState("");
  const [platform, setPlatform] = useState<PlatformId>("instagram");
  const [day, setDay]           = useState(defaultDay ?? "Mon");
  const [time, setTime]         = useState("");
  const [status, setStatus]     = useState<ContentStatus>("draft");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ id: uid(), title: title.trim(), body: body.trim(), platform, status, date: day, time: time || undefined });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
        style={{ animation: "slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">New Post</p>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3.5">
          <div>
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Title <span className="text-red-400">*</span></label>
            <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Content / Caption</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your post copy…" rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as PlatformId)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 transition-colors">
                {(Object.keys(PLATFORM_COLORS) as PlatformId[]).map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 transition-colors">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Day</label>
              <select value={day} onChange={(e) => setDay(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 transition-colors">
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Time</label>
              <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 9:00 AM"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[13px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
            Add Post
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Jacsper AI card ────────────────────────────────────────────────────── */

function JasperCard({ tab }: { tab: Tab }) {
  const { branding }          = useBranding();
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    setLoading(true); setError(false); setText("");
    const prompt = tab === "content"
      ? "You are a social media strategist for a real estate CRM. Give exactly 3 content ideas for next week across Instagram, LinkedIn, Email. Each: platform + concept + estimated impact. Max 10 words each. Plain text, one per line, no numbering."
      : "Review this team planner: 4 To Do (2 high priority), 3 In Progress, 2 Review, 3 Done. Goals 57–91% progress. Give exactly 3 prioritization recommendations. Max 12 words each. Plain text, one per line, no numbering.";
    fetch("/api/jacsper", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, systemPrompt: branding.systemPrompt }) })
      .then((r) => r.json())
      .then((d) => { if (d.error) { setError(true); setText(d.error); } else setText(d.text || ""); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [tab]);

  const lines = text.split("\n").filter((l) => l.trim());

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden mb-5">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800"
        style={{ background: `linear-gradient(135deg, ${branding.primaryColor}10 0%, transparent 100%)` }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
          <Brain className="w-3.5 h-3.5 text-white" strokeWidth={1.75} />
        </div>
        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
          {tab === "content" ? "Jacsper's Content Ideas" : "Jacsper's Priorities"}
        </p>
        <span className="text-[10px] text-zinc-400 ml-1">{tab === "content" ? "AI-generated for next week" : "AI task prioritization"}</span>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
        </div>
      </div>
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center gap-2 text-[12px] text-zinc-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            {tab === "content" ? "Generating ideas…" : "Analyzing workload…"}
          </div>
        ) : error ? (
          <p className="text-[12px] text-amber-500">{text || "Unable to connect to Jacsper AI."}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {lines.map((line, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
                  {i + 1}
                </span>
                <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug">{line}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Content Tab ────────────────────────────────────────────────────────── */

interface ContentTabProps {
  items: ContentItem[];
  onCycleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onAddPost: (day?: string) => void;
}

function ContentTab({ items, onCycleStatus, onDelete, onAddPost }: ContentTabProps) {
  const { branding }                         = useBranding();
  const { enabled }                          = useAIMode();
  const [activePlatform, setActivePlatform]  = useState("all");

  const filtered = activePlatform === "all" ? items : items.filter((c) => c.platform === activePlatform);
  const byDay    = DAYS.map((day) => ({ day, items: filtered.filter((c) => c.date === day) }));

  const stats = {
    published: items.filter((c) => c.status === "published").length,
    scheduled: items.filter((c) => c.status === "scheduled").length,
    draft:     items.filter((c) => c.status === "draft").length,
  };

  return (
    <>
      {enabled && <JasperCard tab="content" />}

      <div className="flex items-center gap-3 mb-5">
        {[
          { label: "Published", value: stats.published, cls: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-400" },
          { label: "Scheduled", value: stats.scheduled, cls: "text-amber-600 dark:text-amber-400",     dot: "bg-amber-400"  },
          { label: "Drafts",    value: stats.draft,     cls: "text-zinc-500 dark:text-zinc-400",       dot: "bg-zinc-400"   },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg px-3.5 py-2">
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", s.dot)} />
            <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{s.label}</span>
            <span className={cn("text-[13px] font-semibold", s.cls)}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {PLATFORMS.map((p) => (
          <button key={p.id} onClick={() => setActivePlatform(p.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all",
              activePlatform === p.id ? "text-white shadow-sm" : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
            )}
            style={activePlatform === p.id ? {
              background: p.id === "all"
                ? `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`
                : PLATFORM_COLORS[p.id as PlatformId],
            } : {}}
          >
            {p.id !== "all" && <PlatformIcon platform={p.id as PlatformId} size={11} />}
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {byDay.map(({ day, items: dayItems }) => (
          <div key={day} className="flex flex-col gap-2 min-h-[280px]">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-100 dark:border-zinc-800">{day}</div>

            {dayItems.map((item) => {
              const StatusIcon = STATUS_CONFIG[item.status].icon;
              return (
                <div key={item.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg p-2.5 group relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: `${PLATFORM_COLORS[item.platform]}18` }}>
                      <PlatformIcon platform={item.platform} size={10} />
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Cycle status button */}
                      <button
                        onClick={() => onCycleStatus(item.id)}
                        title={`Mark as ${STATUS_CYCLE[item.status]}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <StatusIcon
                          style={{ width: 11, height: 11 }}
                          className={cn(
                            item.status === "published" ? "text-emerald-500" :
                            item.status === "scheduled" ? "text-amber-500" : "text-zinc-400"
                          )}
                          strokeWidth={2.5}
                        />
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => onDelete(item.id)}
                        title="Delete"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 style={{ width: 10, height: 10 }} className="text-red-400" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight line-clamp-2 mb-1">{item.title}</p>
                  <p className="text-[10px] text-zinc-400 leading-snug line-clamp-2">{item.body}</p>
                  {item.time && (
                    <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center gap-1">
                      <Clock style={{ width: 9, height: 9 }} strokeWidth={2} />{item.time}
                    </p>
                  )}
                  {item.engagement && <p className="text-[10px] text-emerald-500 mt-1 font-medium">{item.engagement}</p>}
                  {/* Status badge */}
                  <div className="mt-1.5">
                    <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium", STATUS_CONFIG[item.status].cls)}>
                      <StatusIcon style={{ width: 8, height: 8 }} strokeWidth={2.5} />
                      {STATUS_CONFIG[item.status].label}
                    </span>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => onAddPost(day)}
              className="flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-400 dark:hover:text-zinc-500 transition-colors text-[10px]"
            >
              <Plus style={{ width: 10, height: 10 }} strokeWidth={2.5} />Add
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Planner Tab ────────────────────────────────────────────────────────── */

interface PlannerTabProps {
  tasks: Task[];
  onMove: (id: string, dir: "forward" | "back") => void;
  onDelete: (id: string) => void;
  onAddTask: (col: KanbanCol) => void;
}

function PlannerTab({ tasks, onMove, onDelete, onAddTask }: PlannerTabProps) {
  const { branding } = useBranding();
  const { enabled }  = useAIMode();
  const tasksByCol   = (col: KanbanCol) => tasks.filter((t) => t.column === col);
  const totalDone    = tasks.filter((t) => t.column === "done").length;

  return (
    <>
      {enabled && <JasperCard tab="planner" />}

      {/* Goals */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
          <h2 className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">Goals</h2>
          <span className="text-[11px] text-zinc-400">{GOALS.length} active</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {GOALS.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug pr-2">{goal.title}</p>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0", CATEGORY_COLORS[goal.category] ?? CATEGORY_COLORS.Ops)}>
                  {goal.category}
                </span>
              </div>
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, background: `linear-gradient(90deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{goal.target}</span>
                <span className="text-[12px] font-bold" style={{ color: branding.primaryColor }}>{goal.progress}%</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-400">
                <Calendar style={{ width: 9, height: 9 }} strokeWidth={2} />Due {goal.due}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">Tasks</h2>
          <span className="text-[11px] text-zinc-400">{totalDone}/{tasks.length} done</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[{ label: "High", dot: "bg-red-400" }, { label: "Medium", dot: "bg-amber-400" }, { label: "Low", dot: "bg-zinc-400" }].map((p) => (
            <span key={p.label} className="flex items-center gap-1 text-[11px] text-zinc-400">
              <span className={cn("w-1.5 h-1.5 rounded-full", p.dot)} />{p.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {KANBAN_COLS.map((col) => {
          const colTasks = tasksByCol(col.id);
          return (
            <div key={col.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[12px] font-semibold uppercase tracking-wide", col.color)}>{col.label}</span>
                  <span className="text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full px-1.5 py-0.5 leading-none">{colTasks.length}</span>
                </div>
                <button onClick={() => onAddTask(col.id)}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Plus style={{ width: 11, height: 11 }} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {colTasks.map((task) => {
                  const priority  = PRIORITY_CONFIG[task.priority];
                  const isDone    = task.column === "done";
                  const colDef    = KANBAN_COLS.find((c) => c.id === task.column)!;

                  return (
                    <div key={task.id}
                      className={cn(
                        "bg-white dark:bg-zinc-900 border rounded-lg p-3 transition-all group",
                        isDone ? "border-zinc-100 dark:border-zinc-800 opacity-60"
                               : "border-zinc-100 dark:border-zinc-800 hover:shadow-sm hover:border-zinc-200 dark:hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className={cn("text-[12.5px] font-semibold leading-snug flex-1",
                          isDone ? "text-zinc-400 line-through" : "text-zinc-800 dark:text-zinc-200"
                        )}>
                          {task.title}
                        </p>
                        {/* Delete */}
                        <button onClick={() => onDelete(task.id)} title="Delete"
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity">
                          <Trash2 style={{ width: 11, height: 11 }} className="text-red-400" strokeWidth={2} />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-zinc-400 leading-snug mb-2">{task.description}</p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", CATEGORY_COLORS[task.category] ?? CATEGORY_COLORS.Ops)}>
                          {task.category}
                        </span>
                        <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", priority.cls)}>
                          <Flag style={{ width: 9, height: 9 }} strokeWidth={2.5} />{priority.label}
                        </span>
                        {task.due && (
                          <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 ml-auto">
                            <Clock style={{ width: 9, height: 9 }} strokeWidth={2} />{task.due}
                          </span>
                        )}
                      </div>

                      {/* Move controls */}
                      {!isDone && (
                        <div className="mt-2 pt-2 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onMove(task.id, "back")}
                            disabled={!colDef.prev}
                            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft style={{ width: 11, height: 11 }} strokeWidth={2.5} />
                            {colDef.prev ? KANBAN_COLS.find((c) => c.id === colDef.prev)?.label : "Back"}
                          </button>
                          <button
                            onClick={() => onMove(task.id, "forward")}
                            disabled={!colDef.next}
                            className="flex items-center gap-1 text-[10px] font-medium hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                            style={{ color: colDef.next ? undefined : undefined }}
                          >
                            {colDef.next ? KANBAN_COLS.find((c) => c.id === colDef.next)?.label : "Done"}
                            <ChevronRight style={{ width: 11, height: 11 }} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {colTasks.length === 0 && (
                <button onClick={() => onAddTask(col.id)}
                  className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group/empty">
                  <AlertCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-700 mb-1.5 group-hover/empty:text-zinc-400 transition-colors" strokeWidth={1.5} />
                  <p className="text-[11px] text-zinc-400">Add a task</p>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

/* ─── Notes (Notion-style) ───────────────────────────────────────────────── */

type BlockType = "text"|"h1"|"h2"|"h3"|"bullet"|"todo"|"quote"|"divider"|"callout";

interface Block {
  id: string; type: BlockType; content: string;
  checked?: boolean; calloutIcon?: string; calloutColor?: string;
}

interface NotePage {
  id: string; title: string; icon: string;
  cover?: string; blocks: Block[];
  updatedAt: string; favorite: boolean;
}

const EMOJI_CHOICES = [
  "📄","📝","🎯","💡","🚀","⚡","🔥","🎨","📊","💬","🔧","📅","✅","🌟","💎",
  "📌","📎","🗂️","📁","🔖","📈","📉","🧠","🤝","💰","🏆","🎁","🔔","⭐","❤️",
  "😀","😎","🤔","🙌","👀","👍","🙏","🎉","✨","💪","🧩","🛠️","⚙️","🔍","🧭",
  "🌍","🌈","☀️","🌙","⚽","🏀","🎵","🎬","📷","💻","📱","☕","🍕","🐱","🐶",
];

const COVER_GRADIENTS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#ffecd2,#fcb69f)",
  "linear-gradient(135deg,#2d3436,#636e72)",
];

function mkBlock(type: BlockType = "text", content = ""): Block {
  return { id: uid(), type, content };
}

const INIT_PAGES: NotePage[] = [
  {
    id:"p1", title:"Q3 Strategy Overview", icon:"🎯", cover: COVER_GRADIENTS[0],
    updatedAt:"Just now", favorite:true,
    blocks:[
      mkBlock("h1","Q3 Growth Strategy"),
      mkBlock("text","This quarter we're doubling down on LinkedIn outreach and enterprise sales. Key priorities are below."),
      mkBlock("h2","Target Accounts"),
      { id:uid(), type:"bullet", content:"Tech companies with 50–200 employees" },
      { id:uid(), type:"bullet", content:"Decision makers: VP Sales, Head of Growth" },
      { id:uid(), type:"bullet", content:"Outreach budget: $8K/month" },
      mkBlock("h2","Key Goals"),
      { id:uid(), type:"todo", content:"Close 3 enterprise deals by end of August", checked:true },
      { id:uid(), type:"todo", content:"Hire 2 senior SDRs by July 15", checked:false },
      { id:uid(), type:"todo", content:"Launch partner program", checked:false },
      { id:uid(), type:"callout", content:"Priority: All hands on deck for the Apex deal. Deadline is July 31st.", calloutIcon:"⚡", calloutColor:"bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40" },
    ],
  },
  {
    id:"p2", title:"Follow-up Call Notes", icon:"📞", cover: COVER_GRADIENTS[3],
    updatedAt:"2h ago", favorite:false,
    blocks:[
      mkBlock("h1","Call Notes — June 4"),
      mkBlock("h2","Sarah Mitchell"),
      mkBlock("text","Very interested. Needs CFO sign-off before committing. Timeline: 2 weeks."),
      { id:uid(), type:"todo", content:"Send ROI calculator by EOD", checked:false },
      { id:uid(), type:"todo", content:"Schedule CFO intro call", checked:false },
      mkBlock("h2","Omar Al-Rashid"),
      mkBlock("text","Legal review in progress. Expected to complete by Friday."),
      { id:uid(), type:"todo", content:"Follow up Friday afternoon", checked:false },
      mkBlock("h2","James Thornton"),
      mkBlock("text","Demo booked for June 12th at 3PM EST. Very engaged."),
      { id:uid(), type:"todo", content:"Prepare custom demo with their data", checked:false },
    ],
  },
  {
    id:"p3", title:"Content Ideas — June", icon:"✍️", cover: COVER_GRADIENTS[4],
    updatedAt:"Yesterday", favorite:true,
    blocks:[
      mkBlock("h1","June Content Calendar"),
      mkBlock("h2","Instagram"),
      { id:uid(), type:"bullet", content:"Behind-the-scenes of AI tool setup" },
      { id:uid(), type:"bullet", content:"Client success story reel" },
      { id:uid(), type:"bullet", content:"Poll: What's your biggest sales challenge?" },
      mkBlock("h2","LinkedIn"),
      { id:uid(), type:"bullet", content:"5 mistakes CRM users make" },
      { id:uid(), type:"bullet", content:"How we 3×'d our close rate in 60 days" },
      mkBlock("h2","Email"),
      { id:uid(), type:"bullet", content:"Re-engagement sequence for cold leads" },
      { id:uid(), type:"bullet", content:"New feature announcement: Website Builder" },
      { id:uid(), type:"callout", content:"All content should link back to the free trial page. Use UTM tracking on every link.", calloutIcon:"💡", calloutColor:"bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40" },
    ],
  },
  {
    id:"p4", title:"Tech Stack Review", icon:"⚙️",
    updatedAt:"1 week ago", favorite:false,
    blocks:[
      mkBlock("h1","Tech Stack Audit"),
      mkBlock("text","Monthly review of all tools and subscriptions. Identifying overlap and saving opportunities."),
      mkBlock("h2","Active Tools"),
      { id:uid(), type:"bullet", content:"CRM: Jacsper ✅" },
      { id:uid(), type:"bullet", content:"Dialer: Vapi ✅" },
      { id:uid(), type:"bullet", content:"Email: Resend (migrating)" },
      { id:uid(), type:"bullet", content:"Calendar: Google Cal ✅" },
      mkBlock("h2","To Cancel"),
      { id:uid(), type:"todo", content:"Cancel Calendly ($16/mo)", checked:false },
      { id:uid(), type:"todo", content:"Cancel old email tool ($89/mo)", checked:false },
      { id:uid(), type:"callout", content:"Total potential savings: $105/month = $1,260/year", calloutIcon:"💰", calloutColor:"bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40" },
    ],
  },
];

const SLASH_COMMANDS: { type: BlockType; icon: string; label: string; desc: string }[] = [
  { type:"text",    icon:"¶",  label:"Text",          desc:"Just start writing" },
  { type:"h1",      icon:"H1", label:"Heading 1",     desc:"Large section heading" },
  { type:"h2",      icon:"H2", label:"Heading 2",     desc:"Medium section heading" },
  { type:"h3",      icon:"H3", label:"Heading 3",     desc:"Small section heading" },
  { type:"bullet",  icon:"•",  label:"Bullet List",   desc:"Unordered list" },
  { type:"todo",    icon:"☐",  label:"To-do",         desc:"Task with checkbox" },
  { type:"quote",   icon:"❝",  label:"Quote",         desc:"Blockquote" },
  { type:"divider", icon:"—",  label:"Divider",       desc:"Horizontal rule" },
  { type:"callout", icon:"💡", label:"Callout",       desc:"Highlighted callout box" },
];


/* ─── Memoized contentEditable — never re-renders from parent ────────────── */

const BlockInput = memo(
  function BlockInput({
    initialContent, className, placeholder, blockRef, onInput, onKeyDown, onFocus, onBlur,
  }: {
    initialContent: string; className: string; placeholder: string;
    blockRef: (el: HTMLDivElement | null) => void;
    onInput: (html: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    onFocus: () => void; onBlur: () => void;
  }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (ref.current) ref.current.innerHTML = initialContent;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div
        ref={el => { ref.current = el; blockRef(el); }}
        contentEditable
        suppressContentEditableWarning
        className={className}
        data-placeholder={placeholder}
        data-block-editor="true"
        onInput={e => onInput(e.currentTarget.innerHTML)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    );
  },
  () => true, // never re-render from parent — DOM is self-managed
);

/* ─── Floating rich-text toolbar ─────────────────────────────────────────── */

const HIGHLIGHT_COLORS = [
  { label: "Yellow",  bg: "#fef08a", text: "#713f12", dark: "#713f12" },
  { label: "Green",   bg: "#bbf7d0", text: "#14532d", dark: "#14532d" },
  { label: "Blue",    bg: "#bfdbfe", text: "#1e3a5f", dark: "#1e3a5f" },
  { label: "Pink",    bg: "#fbcfe8", text: "#831843", dark: "#831843" },
  { label: "Purple",  bg: "#e9d5ff", text: "#4c1d95", dark: "#4c1d95" },
  { label: "Orange",  bg: "#fed7aa", text: "#7c2d12", dark: "#7c2d12" },
  { label: "Red",     bg: "#fecaca", text: "#7f1d1d", dark: "#7f1d1d" },
  { label: "Gray",    bg: "#e4e4e7", text: "#27272a", dark: "#27272a" },
];

function FloatingToolbar() {
  const [selRect, setSelRect]       = useState<DOMRect | null>(null);
  const [active, setActive]         = useState({ bold: false, italic: false, underline: false, strike: false });
  const [showColors, setShowColors] = useState(false);
  const toolbarRef                  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onSelChange() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelRect(null);
        setShowColors(false);
        return;
      }
      const range = sel.getRangeAt(0);
      const node  = range.commonAncestorContainer;
      const el    = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
      if (!el?.closest('[data-block-editor]')) { setSelRect(null); return; }
      setSelRect(range.getBoundingClientRect());
      setActive({
        bold:      document.queryCommandState('bold'),
        italic:    document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike:    document.queryCommandState('strikeThrough'),
      });
    }
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, []);

  if (!selRect || selRect.width === 0) return null;

  function exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    setActive({
      bold:      document.queryCommandState('bold'),
      italic:    document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strike:    document.queryCommandState('strikeThrough'),
    });
  }

  function applyHighlight(color: typeof HIGHLIGHT_COLORS[0]) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    try {
      const range = sel.getRangeAt(0);
      const mark  = document.createElement('mark');
      mark.dataset.color = color.label.toLowerCase();
      mark.style.background = color.bg;
      mark.style.color = color.text;
      range.surroundContents(mark);
      sel.removeAllRanges();
    } catch {
      document.execCommand('backColor', false, color.bg);
    }
    setShowColors(false);
    setSelRect(null);
  }

  function wrapCode() {
    const text = window.getSelection()?.toString() ?? '';
    if (!text) return;
    document.execCommand('insertHTML', false, `<code>${text}</code>`);
    setSelRect(null);
  }

  const top  = selRect.top - 52;
  const left = selRect.left + selRect.width / 2;

  // Separator
  const Sep = () => <div className="w-px h-[18px] bg-white/10 mx-1 flex-shrink-0" />;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[200]"
      style={{ top, left, transform: 'translateX(-50%)' }}
      onMouseDown={e => e.preventDefault()}
    >
      {/* Main toolbar */}
      <div className="flex items-center bg-[#1c1c1e] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/8 px-2 py-1.5 gap-0.5">

        {/* Text style group */}
        <button
          title="Bold (⌘B)"
          onMouseDown={() => exec('bold')}
          className={cn(
            "relative w-8 h-8 rounded-xl flex items-center justify-center transition-all text-[13px] font-black select-none",
            active.bold
              ? "bg-white text-zinc-900"
              : "text-zinc-300 hover:bg-white/10 hover:text-white"
          )}
        >B</button>

        <button
          title="Italic (⌘I)"
          onMouseDown={() => exec('italic')}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all select-none",
            active.italic
              ? "bg-white text-zinc-900"
              : "text-zinc-300 hover:bg-white/10 hover:text-white"
          )}
        >
          <span className="italic font-serif text-[15px] leading-none">I</span>
        </button>

        <button
          title="Underline (⌘U)"
          onMouseDown={() => exec('underline')}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all select-none",
            active.underline
              ? "bg-white text-zinc-900"
              : "text-zinc-300 hover:bg-white/10 hover:text-white"
          )}
        >
          <span className="underline text-[13px] font-semibold leading-none">U</span>
        </button>

        <button
          title="Strikethrough (⌘⇧S)"
          onMouseDown={() => exec('strikeThrough')}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all select-none",
            active.strike
              ? "bg-white text-zinc-900"
              : "text-zinc-300 hover:bg-white/10 hover:text-white"
          )}
        >
          <span className="line-through text-[13px] font-semibold leading-none">S</span>
        </button>

        <Sep />

        {/* Highlight — opens color picker */}
        <div className="relative">
          <button
            title="Highlight color"
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setShowColors(v => !v); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 select-none gap-0.5"
          >
            {/* Marker icon */}
            <span className="flex flex-col items-center gap-0">
              <span className="text-[11px] font-bold text-zinc-200 leading-none">A</span>
              {/* Color bar — shows last used color */}
              <span className="w-4 h-[3px] rounded-full mt-0.5" style={{ background: '#fef08a' }} />
            </span>
          </button>

          {/* Color picker popover */}
          {showColors && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-2 w-[168px]">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-0.5">Highlight color</p>
              <div className="grid grid-cols-4 gap-1.5">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c.label}
                    title={c.label}
                    onMouseDown={e => { e.preventDefault(); applyHighlight(c); }}
                    className="group relative w-8 h-8 rounded-xl border-2 border-transparent hover:border-white/20 transition-all flex items-center justify-center"
                    style={{ background: c.bg }}
                  >
                    <span className="text-[10px] font-black" style={{ color: c.text }}>A</span>
                  </button>
                ))}
              </div>
              <button
                onMouseDown={e => { e.preventDefault(); exec('removeFormat'); setShowColors(false); setSelRect(null); }}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors text-left px-0.5 pt-0.5 border-t border-white/8 mt-0.5"
              >
                Remove color
              </button>
            </div>
          )}
        </div>

        {/* Inline code */}
        <button
          title="Inline code (⌘E)"
          onMouseDown={wrapCode}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 select-none"
        >
          <span className="font-mono text-[10px] font-bold text-amber-400 leading-none tracking-tight">&lt;/&gt;</span>
        </button>

        <Sep />

        {/* Clear formatting */}
        <button
          title="Clear formatting"
          onMouseDown={() => { exec('removeFormat'); setSelRect(null); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 select-none group"
        >
          <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors leading-none">Tx</span>
        </button>
      </div>

      {/* Arrow */}
      <div className="flex justify-center mt-0.5">
        <div className="w-2 h-2 bg-[#1c1c1e] border-r border-b border-white/8 rotate-45 -mt-1" />
      </div>
    </div>
  );
}

/* ─── Notion Setup Modal ─────────────────────────────────────────────────── */

function NotionSetupModal({ onSave, onClose }: { onSave: (token: string) => void; onClose: () => void }) {
  const [token, setToken] = useState("");
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-6 w-[440px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white dark:text-zinc-900 font-black text-[17px] leading-none" style={{ fontFamily: 'Georgia, serif' }}>N</span>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">Connect Notion</p>
            <p className="text-[11px] text-zinc-400">View your Notion pages from here</p>
          </div>
          <button onClick={onClose} className="ml-auto w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-4 mb-4 space-y-1.5 text-[12px] text-zinc-600 dark:text-zinc-400">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Quick setup (~1 min):</p>
          <p>1. Go to <span className="font-medium text-zinc-800 dark:text-zinc-200">notion.so/my-integrations</span></p>
          <p>2. Click <span className="font-medium text-zinc-800 dark:text-zinc-200">"New integration"</span> → name it anything</p>
          <p>3. Copy the <span className="font-medium text-zinc-800 dark:text-zinc-200">Internal Integration Secret</span></p>
          <p>4. On each Notion page: click <span className="font-medium text-zinc-800 dark:text-zinc-200">··· → Connections</span> → add your integration</p>
        </div>

        <div className="mb-4">
          <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Integration Secret</label>
          <input
            autoFocus
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            type="password"
            className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors font-mono"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (token.trim()) { onSave(token.trim()); onClose(); } }}
            disabled={!token.trim()}
            className="flex-1 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] font-semibold disabled:opacity-40 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Read-only Notion block renderer ────────────────────────────────────── */

function NotionBlockView({ block, branding }: { block: Block; branding: { primaryColor: string } }) {
  switch (block.type) {
    case 'h1':     return <h1 className="text-[30px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight mt-6 mb-1">{block.content}</h1>;
    case 'h2':     return <h2 className="text-[22px] font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight mt-5 mb-1">{block.content}</h2>;
    case 'h3':     return <h3 className="text-[17px] font-semibold text-zinc-700 dark:text-zinc-200 tracking-tight mt-4 mb-0.5">{block.content}</h3>;
    case 'text':   return block.content ? <p className="text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed py-0.5">{block.content}</p> : <div className="py-2" />;
    case 'bullet': return <div className="flex items-start gap-2.5 py-0.5"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" /><p className="text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{block.content}</p></div>;
    case 'todo':   return (
      <div className="flex items-start gap-2.5 py-0.5">
        <div className={cn("mt-[3px] w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0", block.checked ? "border-zinc-900 dark:border-zinc-100" : "border-zinc-300 dark:border-zinc-600")} style={{ background: block.checked ? branding.primaryColor : 'transparent', borderColor: block.checked ? branding.primaryColor : undefined }}>
          {block.checked && <span className="text-white text-[10px] font-bold">✓</span>}
        </div>
        <p className={cn("text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed", block.checked && "line-through text-zinc-400")}>{block.content}</p>
      </div>
    );
    case 'quote':   return <div className="flex gap-3 py-1"><div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: branding.primaryColor }} /><p className="text-[15px] text-zinc-500 dark:text-zinc-400 italic leading-relaxed">{block.content}</p></div>;
    case 'divider': return <hr className="border-zinc-200 dark:border-zinc-700 my-3" />;
    case 'callout': return <div className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border my-1", block.calloutColor ?? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40")}><span className="text-[18px] flex-shrink-0 mt-0.5">{block.calloutIcon ?? '💡'}</span><p className="text-[14px] text-zinc-700 dark:text-zinc-300">{block.content}</p></div>;
    default:        return null;
  }
}

/* ─── Block renderer (module scope so it never remounts while typing) ─────── */

interface BlockEditorProps {
  block: Block;
  primaryColor: string;
  slashMenu: { blockId: string; query: string } | null;
  blockRefs: React.RefObject<Record<string, HTMLDivElement | null>>;
  setSlashMenu: (v: { blockId: string; query: string } | null) => void;
  insertAfter: (afterId: string, type?: BlockType) => void;
  deleteBlock: (id: string) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  handleBlockKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, block: Block) => void;
  applySlashCommand: (type: BlockType) => void;
}

const BlockEditor = memo(function BlockEditor({
  block, primaryColor, slashMenu, blockRefs,
  setSlashMenu, insertAfter, deleteBlock, updateBlock, handleBlockKeyDown, applySlashCommand,
}: BlockEditorProps) {
  const slashVisible = slashMenu?.blockId === block.id;
  const slashFiltered = SLASH_COMMANDS.filter(c =>
    slashMenu?.query === "" || c.label.toLowerCase().includes(slashMenu?.query.toLowerCase() ?? "")
  );

  if (block.type === "divider") {
    return (
      <div className="relative group/block py-1">
        <hr className="border-zinc-200 dark:border-zinc-700" />
        <div className="absolute left-full top-1/2 -translate-y-1/2 pl-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
          <button onMouseDown={e => e.preventDefault()} onClick={() => deleteBlock(block.id)} title="Delete divider"
            className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all">
            <X className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  const baseEditable = (extraClass = "") => (
    <BlockInput
      key={`${block.id}-${block.type}`}
      initialContent={block.content}
      blockRef={el => { blockRefs.current[block.id] = el; }}
      onInput={html => updateBlock(block.id, { content: html })}
      onKeyDown={e => handleBlockKeyDown(e, block)}
      onFocus={() => setSlashMenu(null)}
      onBlur={() => {}}
      placeholder={
        block.type === "text"  ? "Type '/' for commands, or just start writing…" :
        block.type === "h1"    ? "Heading 1" :
        block.type === "h2"    ? "Heading 2" :
        block.type === "h3"    ? "Heading 3" :
        block.type === "quote" ? "Quote…" : "List item…"
      }
      className={cn(
        "outline-none w-full break-words",
        "empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-300 dark:empty:before:text-zinc-600 empty:before:pointer-events-none",
        block.type === "h1"    && "text-[30px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight mt-6 mb-1",
        block.type === "h2"    && "text-[22px] font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight mt-5 mb-1",
        block.type === "h3"    && "text-[17px] font-semibold text-zinc-700 dark:text-zinc-200 tracking-tight leading-tight mt-4 mb-0.5",
        block.type === "text"  && "text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed",
        block.type === "quote" && "text-[15px] text-zinc-500 dark:text-zinc-400 italic leading-relaxed",
        block.type === "bullet"&& "text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed",
        extraClass
      )}
    />
  );

  return (
    <div className="relative group/block">

      {/* Left handle — flush against the block (pr bridges the gap so the hover
          region stays continuous and the buttons don't vanish before a click). */}
      <div className="absolute right-full top-0.5 flex items-center gap-0.5 pr-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
        <button onMouseDown={e => e.preventDefault()} onClick={() => insertAfter(block.id)}
          title="Add block below"
          className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-[14px] font-light">+</button>
        <button onMouseDown={e => e.preventDefault()} onClick={() => deleteBlock(block.id)}
          title="Delete block"
          className="w-5 h-5 rounded flex items-center justify-center text-zinc-300 dark:text-zinc-600 hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
          <X className="w-3 h-3" strokeWidth={2} />
        </button>
      </div>

      {/* Block type renderers */}
      {block.type === "callout" ? (
        <div className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border my-1", block.calloutColor ?? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40")}>
          <span className="text-[18px] flex-shrink-0 mt-0.5">{block.calloutIcon ?? "💡"}</span>
          {baseEditable("text-[14px] text-zinc-700 dark:text-zinc-300 flex-1")}
        </div>
      ) : block.type === "todo" ? (
        <div className="flex items-start gap-2.5 py-0.5 group/todo">
          <button onClick={() => updateBlock(block.id, { checked: !block.checked })}
            className="mt-[3px] flex-shrink-0 w-4 h-4 rounded border-2 transition-all flex items-center justify-center"
            style={{ borderColor: block.checked ? primaryColor : "#d4d4d8", background: block.checked ? primaryColor : "transparent" }}>
            {block.checked && <span className="text-white text-[10px] font-bold">✓</span>}
          </button>
          <div className={cn("flex-1", block.checked && "line-through text-zinc-400 dark:text-zinc-500")}>
            {baseEditable()}
          </div>
        </div>
      ) : block.type === "bullet" ? (
        <div className="flex items-start gap-2.5 py-0.5">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
          <div className="flex-1">{baseEditable()}</div>
        </div>
      ) : block.type === "quote" ? (
        <div className="flex gap-3 py-1">
          <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: primaryColor }} />
          <div className="flex-1">{baseEditable()}</div>
        </div>
      ) : (
        baseEditable("py-0.5")
      )}

      {/* Slash command menu */}
      {slashVisible && slashFiltered.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 pt-2.5 pb-1">Blocks</p>
          {slashFiltered.map(cmd => (
            <button key={cmd.type} onClick={() => applySlashCommand(cmd.type)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left">
              <span className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[13px] font-bold text-zinc-600 dark:text-zinc-400 flex-shrink-0">{cmd.icon}</span>
              <div>
                <p className="text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200">{cmd.label}</p>
                <p className="text-[11px] text-zinc-400">{cmd.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

function NotesTab() {
  const { branding }                  = useBranding();
  const [pages, setPages]             = useState<NotePage[]>(INIT_PAGES);
  const [activeId, setActiveId]       = useState(INIT_PAGES[0].id);
  const [search, setSearch]           = useState("");
  const [slashMenu, setSlashMenu]     = useState<{ blockId: string; query: string } | null>(null);
  const blockRefs                     = useRef<Record<string, HTMLDivElement | null>>({});
  const coverInputRef                 = useRef<HTMLInputElement>(null);
  const [iconOpen, setIconOpen]       = useState(false);
  const [iconPos, setIconPos]         = useState({ x: 0, y: 0 });
  const iconPickerRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) { if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) setIconOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Notion state
  const [notionToken, setNotionToken]       = useState<string>(() => typeof window !== 'undefined' ? (localStorage.getItem('notion-token') ?? '') : '');
  const [notionPages, setNotionPages]       = useState<{ id: string; title: string; icon: string }[]>([]);
  const [notionLoading, setNotionLoading]   = useState(false);
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [notionContent, setNotionContent]   = useState<{ id: string; title: string; icon: string; blocks: Block[] } | null>(null);

  // Load Notion pages on mount if already connected
  useEffect(() => {
    if (notionToken) loadNotionPages(notionToken);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNotionPages(token: string) {
    setNotionLoading(true);
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, path: 'search', body: { filter: { property: 'object', value: 'page' }, page_size: 50 } }),
      });
      const data = await res.json();
      if (data.results) {
        setNotionPages(data.results.map((p: Record<string, unknown>) => {
          const props = p.properties as Record<string, unknown> | undefined;
          const titleProp = (props?.title ?? props?.Name ?? props?.Page) as { title?: { plain_text: string }[] } | undefined;
          const title = titleProp?.title?.[0]?.plain_text ?? 'Untitled';
          const icon = (p.icon as { emoji?: string } | undefined)?.emoji ?? '📄';
          return { id: p.id as string, title, icon };
        }));
      }
    } catch {}
    setNotionLoading(false);
  }

  function notionBlockToLocal(b: Record<string, unknown>): Block {
    const type = b.type as string;
    const rich = (arr: { plain_text: string }[] | undefined) => arr?.map(t => t.plain_text).join('') ?? '';
    const get  = (key: string) => (b[key] as { rich_text?: { plain_text: string }[]; checked?: boolean } | undefined);
    switch (type) {
      case 'heading_1':         return mkBlock('h1',     rich(get('heading_1')?.rich_text));
      case 'heading_2':         return mkBlock('h2',     rich(get('heading_2')?.rich_text));
      case 'heading_3':         return mkBlock('h3',     rich(get('heading_3')?.rich_text));
      case 'paragraph':         return mkBlock('text',   rich(get('paragraph')?.rich_text));
      case 'bulleted_list_item':return mkBlock('bullet', rich(get('bulleted_list_item')?.rich_text));
      case 'numbered_list_item':return mkBlock('bullet', rich(get('numbered_list_item')?.rich_text));
      case 'to_do':             return { ...mkBlock('todo', rich(get('to_do')?.rich_text)), checked: get('to_do')?.checked ?? false };
      case 'quote':             return mkBlock('quote',   rich(get('quote')?.rich_text));
      case 'divider':           return mkBlock('divider');
      case 'callout': {
        const co = get('callout') as { rich_text?: { plain_text: string }[]; icon?: { emoji?: string } } | undefined;
        return { ...mkBlock('callout', rich(co?.rich_text)), calloutIcon: co?.icon?.emoji ?? '💡' };
      }
      default: return mkBlock('text', '');
    }
  }

  async function openNotionPage(pageId: string, title: string, icon: string) {
    setNotionContent({ id: pageId, title, icon, blocks: [] });
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: notionToken, path: `blocks/${pageId}/children`, query: { page_size: 100 } }),
      });
      const data = await res.json();
      if (data.results) {
        const blocks = (data.results as Record<string, unknown>[])
          .filter((b) => b.type !== 'unsupported' && b.type !== 'child_page')
          .map((b) => notionBlockToLocal(b));
        setNotionContent({ id: pageId, title, icon, blocks });
      }
    } catch {}
  }

  function connectNotion(token: string) {
    localStorage.setItem('notion-token', token);
    setNotionToken(token);
    loadNotionPages(token);
  }

  function disconnectNotion() {
    localStorage.removeItem('notion-token');
    setNotionToken('');
    setNotionPages([]);
    setNotionContent(null);
  }

  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updatePage({ ...page, cover: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function openLocalPage(id: string) {
    setActiveId(id);
    setNotionContent(null);
  }

  const page = pages.find(p => p.id === activeId) ?? pages[0];

  function updatePage(updated: NotePage) {
    setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
  }

  function newPage() {
    const p: NotePage = { id: uid(), title: "Untitled", icon: "📄", updatedAt: "Just now", favorite: false, blocks: [mkBlock("text")] };
    setPages(prev => [p, ...prev]);
    setActiveId(p.id);
  }

  function deletePage(id: string) {
    setPages(prev => prev.filter(p => p.id !== id));
    if (activeId === id) setActiveId(pages.find(p => p.id !== id)?.id ?? "");
  }

  // ── Block ops ──────────────────────────────────────────────────────────
  function setBlocks(blocks: Block[]) {
    updatePage({ ...page, blocks, updatedAt: "Just now" });
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks(page.blocks.map(b => b.id === id ? { ...b, ...patch } : b));
  }

  function insertAfter(afterId: string, type: BlockType = "text") {
    const idx = page.blocks.findIndex(b => b.id === afterId);
    const nb  = mkBlock(type);
    const next = [...page.blocks];
    next.splice(idx + 1, 0, nb);
    setBlocks(next);
    setTimeout(() => { blockRefs.current[nb.id]?.focus(); }, 30);
    setSlashMenu(null);
  }

  function deleteBlock(id: string) {
    const idx = page.blocks.findIndex(b => b.id === id);
    if (page.blocks.length <= 1) { updateBlock(id, { content: "" }); return; }
    const prevId = page.blocks[idx - 1]?.id;
    setBlocks(page.blocks.filter(b => b.id !== id));
    setTimeout(() => { if (prevId) blockRefs.current[prevId]?.focus(); }, 30);
  }

  function handleBlockKeyDown(e: React.KeyboardEvent<HTMLDivElement>, block: Block) {
    const el = blockRefs.current[block.id];
    const content = el?.textContent ?? "";
    const htmlContent = el?.innerHTML ?? "";

    // ── Rich text keyboard shortcuts ──
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.shiftKey) {
      if (e.key === 'b') { e.preventDefault(); document.execCommand('bold');      return; }
      if (e.key === 'i') { e.preventDefault(); document.execCommand('italic');    return; }
      if (e.key === 'u') { e.preventDefault(); document.execCommand('underline'); return; }
      if (e.key === 'e') {
        e.preventDefault();
        const text = window.getSelection()?.toString() ?? '';
        if (text) document.execCommand('insertHTML', false, `<code>${text}</code>`);
        return;
      }
    }
    if (mod && e.shiftKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault(); document.execCommand('strikeThrough'); return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Stay in same type for lists/todos, else text
      const nextType = (block.type === "bullet" || block.type === "todo") ? block.type : "text";
      insertAfter(block.id, nextType);
      return;
    }

    if (e.key === "Backspace" && content === "") {
      e.preventDefault();
      // Downgrade heading → text, then delete
      if (block.type !== "text") { updateBlock(block.id, { type: "text" }); return; }
      deleteBlock(block.id);
      return;
    }

    if (e.key === "/" && content === "") {
      setSlashMenu({ blockId: block.id, query: "" });
      return;
    }

    if (e.key === "Escape") { setSlashMenu(null); return; }

    if (slashMenu?.blockId === block.id) {
      if (e.key === "Backspace" && slashMenu.query.length === 0) { setSlashMenu(null); return; }
      if (e.key.length === 1) setSlashMenu(m => m ? { ...m, query: m.query + e.key } : m);
    }
  }

  function applySlashCommand(type: BlockType) {
    if (!slashMenu) return;
    const id = slashMenu.blockId;
    const el = blockRefs.current[id];
    if (el) el.innerHTML = "";
    updateBlock(id, { type, content: "" });
    setSlashMenu(null);
    setTimeout(() => blockRefs.current[id]?.focus(), 30);
  }

  const filteredPages = pages.filter(p =>
    search === "" || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex -mx-2" style={{ height: "calc(100vh - 220px)" }}>
      {showNotionModal && <NotionSetupModal onSave={connectNotion} onClose={() => setShowNotionModal(false)} />}
      <FloatingToolbar />

      {/* ── Sidebar ── */}
      <div className="w-56 flex-shrink-0 flex flex-col bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5">
            <Search className="w-3 h-3 text-zinc-400 flex-shrink-0" strokeWidth={2} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages…"
              className="flex-1 bg-transparent text-[12px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none" />
          </div>
        </div>

        {/* Favorites */}
        {pages.some(p => p.favorite) && (
          <div className="px-3 mb-1">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Favorites</p>
            {pages.filter(p => p.favorite).map(p => (
              <button key={p.id} onClick={() => openLocalPage(p.id)}
                className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all group/pg",
                  activeId === p.id && !notionContent ? "bg-white dark:bg-zinc-800 shadow-sm" : "hover:bg-white/60 dark:hover:bg-zinc-800/50"
                )}>
                <span className="text-[14px] flex-shrink-0">{p.icon}</span>
                <span className="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">{p.title}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" strokeWidth={0} />
              </button>
            ))}
          </div>
        )}

        <div className="px-3 mb-1">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">All Pages</p>
        </div>

        {/* Page list */}
        <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5">
          {filteredPages.map(p => (
            <div key={p.id} className="group/pg relative">
              <button onClick={() => openLocalPage(p.id)}
                className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all pr-7",
                  activeId === p.id && !notionContent ? "bg-white dark:bg-zinc-800 shadow-sm" : "hover:bg-white/60 dark:hover:bg-zinc-800/50"
                )}>
                <span className="text-[14px] flex-shrink-0">{p.icon}</span>
                <span className="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300 truncate">{p.title}</span>
              </button>
              <button onClick={() => deletePage(p.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-zinc-300 dark:text-zinc-600 hover:text-red-400 opacity-0 group-hover/pg:opacity-100 transition-all">
                <X className="w-3 h-3" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>

        {/* Notion section */}
        {notionToken && (
          <div className="px-3 pt-2 pb-1 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-zinc-900 dark:bg-white rounded-[3px] flex items-center justify-center flex-shrink-0">
                  <span className="text-white dark:text-zinc-900 font-black text-[9px] leading-none" style={{ fontFamily: 'Georgia, serif' }}>N</span>
                </span>
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Notion</p>
              </div>
              {notionLoading
                ? <RefreshCw className="w-3 h-3 text-zinc-400 animate-spin" strokeWidth={2} />
                : <button onClick={() => loadNotionPages(notionToken)} className="text-zinc-400 hover:text-zinc-600 transition-colors"><RefreshCw className="w-3 h-3" strokeWidth={2} /></button>
              }
            </div>
            <div className="space-y-0.5">
              {notionPages.length === 0 && !notionLoading && (
                <p className="text-[10px] text-zinc-400 px-2 py-1 leading-snug">No pages found. Share pages with your integration first.</p>
              )}
              {notionPages.map(np => (
                <button
                  key={np.id}
                  onClick={() => openNotionPage(np.id, np.title, np.icon)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all group/np",
                    notionContent?.id === np.id ? "bg-white dark:bg-zinc-800 shadow-sm" : "hover:bg-white/60 dark:hover:bg-zinc-800/50"
                  )}>
                  <span className="text-[13px] flex-shrink-0">{np.icon}</span>
                  <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">{np.title}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-300 dark:text-zinc-600 flex-shrink-0 opacity-0 group-hover/np:opacity-100 transition-opacity" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 space-y-0.5">
          <button onClick={newPage}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all text-left">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="text-[12.5px] font-medium">New Page</span>
          </button>

          {notionToken ? (
            <button onClick={disconnectNotion}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-all text-left">
              <span className="w-3.5 h-3.5 bg-zinc-300 dark:bg-zinc-600 rounded-[3px] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-[9px] leading-none" style={{ fontFamily: 'Georgia, serif' }}>N</span>
              </span>
              <span className="text-[12.5px] font-medium">Disconnect Notion</span>
            </button>
          ) : (
            <button onClick={() => setShowNotionModal(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all text-left">
              <span className="w-3.5 h-3.5 bg-zinc-900 dark:bg-white rounded-[3px] flex items-center justify-center flex-shrink-0">
                <span className="text-white dark:text-zinc-900 font-black text-[9px] leading-none" style={{ fontFamily: 'Georgia, serif' }}>N</span>
              </span>
              <span className="text-[12.5px] font-medium">Connect Notion</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Editor ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">

        {/* ── Notion page view ── */}
        {notionContent && (
          <>
            <div className="flex items-center justify-between px-6 py-2 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2 text-[12px] text-zinc-400">
                <span className="w-4 h-4 bg-zinc-900 dark:bg-white rounded-[3px] flex items-center justify-center flex-shrink-0">
                  <span className="text-white dark:text-zinc-900 font-black text-[10px] leading-none" style={{ fontFamily: 'Georgia, serif' }}>N</span>
                </span>
                <span>Notion</span>
                <span>/</span>
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">{notionContent.title}</span>
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded ml-1">read-only</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newPage: NotePage = {
                      id: uid(), title: notionContent.title, icon: notionContent.icon,
                      updatedAt: 'Just now', favorite: false, blocks: notionContent.blocks,
                    };
                    setPages(prev => [newPage, ...prev]);
                    setActiveId(newPage.id);
                    setNotionContent(null);
                  }}
                  className="h-6 px-2.5 rounded-md text-[11px] font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1">
                  <Copy className="w-3 h-3" strokeWidth={2} />
                  Copy to local notes
                </button>
                <button onClick={() => setNotionContent(null)}
                  className="h-6 px-2.5 rounded-md text-[11px] font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                  ← Back
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notionContent.blocks.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-zinc-400 text-[13px]">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" strokeWidth={2} />Loading…
                </div>
              ) : (
                <div className="max-w-2xl mx-auto px-16 py-14 pb-20">
                  <div className="text-[52px] leading-none mb-3">{notionContent.icon}</div>
                  <h1 className="text-[38px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight mb-6">{notionContent.title}</h1>
                  <div className="space-y-0.5">
                    {notionContent.blocks.map(b => (
                      <NotionBlockView key={b.id} block={b} branding={branding} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-2 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0 text-[11px] text-zinc-400">
              <span>Synced from Notion · read-only</span>
              <span>{notionContent.blocks.reduce((a, b) => a + b.content.split(/\s+/).filter(Boolean).length, 0)} words</span>
            </div>
          </>
        )}

        {/* ── Local page view ── */}
        {!notionContent && <>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2 text-[12px] text-zinc-400">
            <StickyNote className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Notes</span>
            <span>/</span>
            <span className="text-zinc-600 dark:text-zinc-300 font-medium">{page.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updatePage({ ...page, favorite: !page.favorite })}
              className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800", page.favorite ? "text-amber-400" : "text-zinc-400")}>
              <Star className={cn("w-3.5 h-3.5", page.favorite && "fill-amber-400")} strokeWidth={page.favorite ? 0 : 2} />
            </button>
            {/* Hidden file input for image upload */}
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

            {/* Upload image banner */}
            <button
              onClick={() => coverInputRef.current?.click()}
              className="h-6 px-2.5 rounded-md text-[11px] font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1">
              <ImagePlus className="w-3 h-3" strokeWidth={2} />
              Upload banner
            </button>

            {/* Gradient cover cycle */}
            <button
              onClick={() => {
                if (page.cover?.startsWith('data:')) {
                  updatePage({ ...page, cover: COVER_GRADIENTS[0] });
                } else {
                  const next = COVER_GRADIENTS[(COVER_GRADIENTS.indexOf(page.cover ?? "") + 1) % COVER_GRADIENTS.length];
                  updatePage({ ...page, cover: page.cover ? next : COVER_GRADIENTS[0] });
                }
              }}
              className="h-6 px-2.5 rounded-md text-[11px] font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
              {page.cover ? (page.cover.startsWith('data:') ? "Use gradient" : "Next gradient") : "Add gradient"}
            </button>

            {page.cover && (
              <button
                onClick={() => updatePage({ ...page, cover: undefined })}
                className="h-6 px-2.5 rounded-md text-[11px] font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                Remove
              </button>
            )}
            <button onClick={() => deletePage(page.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Document */}
        <div className="flex-1 overflow-y-auto">
          {/* Cover */}
          {page.cover && (
            <div
              className="h-44 w-full flex-shrink-0"
              style={
                page.cover.startsWith('data:')
                  ? { backgroundImage: `url(${page.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: page.cover }
              }
            />
          )}

          {/* Content area */}
          <div className="max-w-2xl mx-auto px-16 pb-20">
            {/* Icon — click to open the emoji picker */}
            <div ref={iconPickerRef} className={cn("relative flex items-center gap-3 group/header", page.cover ? "-mt-8" : "mt-14")}>
              <button
                onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setIconPos({ x: r.left, y: r.bottom + 8 }); setIconOpen(v => !v); }}
                className="text-[52px] leading-none hover:scale-110 transition-transform cursor-pointer select-none rounded-xl hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 px-1"
                title="Click to change icon">
                {page.icon}
              </button>
              {iconOpen && (
                <div style={{ position: "fixed", left: iconPos.x, top: iconPos.y }}
                  className="z-50 w-72 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-black/10">
                  <div className="flex items-center gap-2 mb-2.5">
                    <input autoFocus value={page.icon}
                      onChange={e => {
                        const raw = e.target.value;
                        // Keep only the last whole emoji/grapheme so the icon stays a single glyph.
                        const segs = typeof Intl !== "undefined" && Intl.Segmenter
                          ? [...new Intl.Segmenter().segment(raw)].map(s => s.segment)
                          : [...raw];
                        const v = segs[segs.length - 1] ?? "";
                        if (v.trim()) updatePage({ ...page, icon: v });
                      }}
                      placeholder="Type or paste any emoji"
                      className="flex-1 h-8 px-2.5 text-[13px] text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-colors" />
                    <button onClick={() => { updatePage({ ...page, icon: EMOJI_CHOICES[Math.floor(Math.random()*EMOJI_CHOICES.length)] }); }}
                      title="Random" className="h-8 px-2.5 rounded-lg text-[11px] font-medium text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap">Random</button>
                  </div>
                  <div className="grid grid-cols-8 gap-0.5 max-h-44 overflow-y-auto">
                    {EMOJI_CHOICES.map(em => (
                      <button key={em} onClick={() => { updatePage({ ...page, icon: em }); setIconOpen(false); }}
                        className={cn("h-8 rounded-lg text-[20px] leading-none flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors", page.icon === em && "bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-400")}>
                        {em}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2">Tip: press <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[9px]">Ctrl/Cmd + .</kbd> in the box to open your system emoji keyboard.</p>
                </div>
              )}
            </div>

            {/* Title — keyed + uncontrolled so the caret never jumps while typing */}
            <div
              key={page.id}
              ref={el => {
                // Set the text once per page; never while the user is editing.
                if (el && document.activeElement !== el && el.textContent !== page.title) {
                  el.textContent = page.title;
                }
              }}
              contentEditable suppressContentEditableWarning
              onInput={e => updatePage({ ...page, title: e.currentTarget.textContent ?? "Untitled", updatedAt: "Just now" })}
              data-placeholder="Untitled"
              className="text-[38px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight mt-3 mb-6 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-300 dark:empty:before:text-zinc-600 empty:before:pointer-events-none break-words"
            />

            {/* Blocks */}
            <div className="relative pl-12 -ml-12">
              {page.blocks.map(block => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  primaryColor={branding.primaryColor}
                  slashMenu={slashMenu}
                  blockRefs={blockRefs}
                  setSlashMenu={setSlashMenu}
                  insertAfter={insertAfter}
                  deleteBlock={deleteBlock}
                  updateBlock={updateBlock}
                  handleBlockKeyDown={handleBlockKeyDown}
                  applySlashCommand={applySlashCommand}
                />
              ))}

              {/* Click below to add */}
              <div className="h-32 cursor-text" onClick={() => insertAfter(page.blocks[page.blocks.length - 1]?.id ?? "")} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-2 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0 text-[11px] text-zinc-400">
          <span>Last edited {page.updatedAt}</span>
          <span>{page.blocks.reduce((acc, b) => acc + b.content.split(/\s+/).filter(Boolean).length, 0)} words</span>
        </div>

        </>}
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "content", label: "Content Planner", icon: PenLine      },
  { id: "planner", label: "General Planner", icon: CalendarDays },
  { id: "notes",   label: "Notes",           icon: StickyNote   },
];

type ModalState =
  | { type: "task"; defaultCol: KanbanCol }
  | { type: "post"; defaultDay?: string }
  | null;

export default function PlannerPage() {
  const { branding }    = useBranding();
  const [tab, setTab]   = useState<Tab>("content");
  const [tasks, setTasks]           = useState<Task[]>(INIT_TASKS);
  const [contentItems, setContent]  = useState<ContentItem[]>(INIT_CONTENT);
  const [modal, setModal]           = useState<ModalState>(null);

  /* Task actions */
  function addTask(t: Task) { setTasks((prev) => [t, ...prev]); }

  function moveTask(id: string, dir: "forward" | "back") {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const col = KANBAN_COLS.find((c) => c.id === t.column)!;
      const next = dir === "forward" ? col.next : col.prev;
      return next ? { ...t, column: next } : t;
    }));
  }

  function deleteTask(id: string) { setTasks((prev) => prev.filter((t) => t.id !== id)); }

  /* Content actions */
  function addPost(p: ContentItem) { setContent((prev) => [p, ...prev]); }

  function cycleStatus(id: string) {
    setContent((prev) => prev.map((c) => c.id === id ? { ...c, status: STATUS_CYCLE[c.status] } : c));
  }

  function deleteContent(id: string) { setContent((prev) => prev.filter((c) => c.id !== id)); }

  const addLabel = tab === "content" ? "New Post" : tab === "notes" ? "New Note" : "Add Task";

  return (
    <div className="px-8 py-7 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="Planner" description="Plan content and tasks across all your channels." />
        <button
          onClick={() => tab !== "notes" && setModal(tab === "content" ? { type: "post" } : { type: "task", defaultCol: "todo" })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`, display: tab === "notes" ? "none" : undefined }}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          {addLabel}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all",
              tab === id
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={tab === id ? 2 : 1.75} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "content" ? (
        <ContentTab
          items={contentItems}
          onCycleStatus={cycleStatus}
          onDelete={deleteContent}
          onAddPost={(day) => setModal({ type: "post", defaultDay: day })}
        />
      ) : tab === "planner" ? (
        <PlannerTab
          tasks={tasks}
          onMove={moveTask}
          onDelete={deleteTask}
          onAddTask={(col) => setModal({ type: "task", defaultCol: col })}
        />
      ) : (
        <NotesTab />
      )}

      {/* Modals */}
      {modal?.type === "task" && (
        <AddTaskModal
          defaultCol={modal.defaultCol}
          onAdd={addTask}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "post" && (
        <AddPostModal
          defaultDay={modal.defaultDay}
          onAdd={addPost}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
