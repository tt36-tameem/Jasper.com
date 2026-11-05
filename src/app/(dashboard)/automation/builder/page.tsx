"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Plus, X, Zap, Mail, MessageSquare, Phone,
  GitBranch, Clock, Check, Trash2, ChevronDown,
  MessageCircle, Camera, Users, Hash, AlarmClock, Flag,
  Tag, Pencil, UserPlus, FileText, ClipboardList, Globe,
  Search, Layers, Maximize2, CalendarPlus, BookOpen, Briefcase,
  Megaphone, ExternalLink, Film, AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  type NodeType, type BuilderNode, type Workflow,
  getWorkflows, saveWorkflow, deleteWorkflow,
} from "@/lib/workflowStore";
import {
  INTEGRATIONS_META, getIntegrationStatuses,
  type IntegrationStatus,
} from "@/lib/integrationStore";

// ─── Add-target context ───────────────────────────────────────────────────────
interface AddCtx {
  parentBranchId: string | null;
  branchPath: "yes" | "no" | null;
}
interface PickerState {
  afterIndex: number;
  ctx: AddCtx;
}
const ROOT_CTX: AddCtx = { parentBranchId: null, branchPath: null };

// ─── Tree helpers ─────────────────────────────────────────────────────────────
function treeAdd(nodes: BuilderNode[], ps: PickerState, node: BuilderNode): BuilderNode[] {
  if (!ps.ctx.parentBranchId) {
    const next = [...nodes];
    next.splice(ps.afterIndex + 1, 0, node);
    return next;
  }
  return nodes.map(n => {
    if (n.id === ps.ctx.parentBranchId) {
      const path = ps.ctx.branchPath!;
      const arr = path === "yes" ? (n.yes_branch ?? []) : (n.no_branch ?? []);
      const next = [...arr];
      next.splice(ps.afterIndex + 1, 0, node);
      return path === "yes" ? { ...n, yes_branch: next } : { ...n, no_branch: next };
    }
    return {
      ...n,
      yes_branch: n.yes_branch ? treeAdd(n.yes_branch, ps, node) : undefined,
      no_branch:  n.no_branch  ? treeAdd(n.no_branch,  ps, node) : undefined,
    };
  });
}

function treeDelete(nodes: BuilderNode[], id: string): BuilderNode[] {
  return nodes.filter(n => n.id !== id).map(n => ({
    ...n,
    yes_branch: n.yes_branch ? treeDelete(n.yes_branch, id) : undefined,
    no_branch:  n.no_branch  ? treeDelete(n.no_branch,  id) : undefined,
  }));
}

function treeUpdate(nodes: BuilderNode[], id: string, config: Record<string, string>): BuilderNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, config };
    return {
      ...n,
      yes_branch: n.yes_branch ? treeUpdate(n.yes_branch, id, config) : undefined,
      no_branch:  n.no_branch  ? treeUpdate(n.no_branch,  id, config) : undefined,
    };
  });
}

function treeFind(nodes: BuilderNode[], id: string): BuilderNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const fy = n.yes_branch ? treeFind(n.yes_branch, id) : null;
    if (fy) return fy;
    const fn = n.no_branch  ? treeFind(n.no_branch,  id) : null;
    if (fn) return fn;
  }
  return null;
}

function treeHasTrigger(nodes: BuilderNode[]): boolean {
  return nodes.some(n =>
    n.type === "trigger" ||
    (n.yes_branch ? treeHasTrigger(n.yes_branch) : false) ||
    (n.no_branch  ? treeHasTrigger(n.no_branch)  : false)
  );
}

// ─── Node meta ────────────────────────────────────────────────────────────────
type NodeMeta = {
  label: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  color: string;
  bg: string;
  border: string;
  category: "comms" | "logic" | "crm" | "integrations";
  description: string;
};

const NODE_META: Record<NodeType, NodeMeta> = {
  trigger:       { label: "Trigger",          icon: Zap,           color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/30",    border: "border-amber-200 dark:border-amber-800/50",    category: "logic",        description: "Start the workflow on an event" },
  email:         { label: "Email",            icon: Mail,          color: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-950/30",       border: "border-blue-200 dark:border-blue-800/50",      category: "comms",        description: "Send a personalized email" },
  sms:           { label: "SMS",              icon: MessageSquare, color: "#8b5cf6", bg: "bg-violet-50 dark:bg-violet-950/30",   border: "border-violet-200 dark:border-violet-800/50",  category: "comms",        description: "Send a text message" },
  call:          { label: "Call",             icon: Phone,         color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800/50",category: "comms",        description: "Make an automated or manual call" },
  whatsapp:      { label: "WhatsApp",         icon: MessageCircle, color: "#25d366", bg: "bg-green-50 dark:bg-green-950/30",     border: "border-green-200 dark:border-green-800/50",    category: "comms",        description: "Send a WhatsApp message" },
  instagram:     { label: "Instagram DM",     icon: Camera,        color: "#e1306c", bg: "bg-pink-50 dark:bg-pink-950/30",       border: "border-pink-200 dark:border-pink-800/50",      category: "comms",        description: "Send an Instagram direct message" },
  facebook:      { label: "Facebook DM",      icon: Users,         color: "#1877f2", bg: "bg-blue-50 dark:bg-blue-950/30",       border: "border-blue-200 dark:border-blue-800/50",      category: "comms",        description: "Send a Facebook Messenger message" },
  message:       { label: "Direct Message",   icon: MessageSquare, color: "#ec4899", bg: "bg-rose-50 dark:bg-rose-950/30",       border: "border-rose-200 dark:border-rose-800/50",      category: "comms",        description: "Send an in-app direct message" },
  ig_story:      { label: "Story CTA",        icon: Film,          color: "#e1306c", bg: "bg-pink-50 dark:bg-pink-950/30",        border: "border-pink-200 dark:border-pink-800/50",       category: "comms",        description: "Plan a story with a keyword DM CTA" },
  ig_comment_dm: { label: "Comment → DM",     icon: AtSign,        color: "#e1306c", bg: "bg-pink-50 dark:bg-pink-950/30",        border: "border-pink-200 dark:border-pink-800/50",       category: "comms",        description: "Auto-DM anyone who comments a keyword" },
  slack:         { label: "Slack",            icon: Hash,          color: "#4a154b", bg: "bg-purple-50 dark:bg-purple-950/30",   border: "border-purple-200 dark:border-purple-800/50",  category: "integrations", description: "Post a message to a Slack channel" },
  delay:         { label: "Wait / Delay",     icon: Clock,         color: "#71717a", bg: "bg-zinc-50 dark:bg-zinc-800/50",       border: "border-zinc-200 dark:border-zinc-700",         category: "logic",        description: "Pause before the next step" },
  branch:        { label: "Branch / If",      icon: GitBranch,     color: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/30",   border: "border-orange-200 dark:border-orange-800/50",  category: "logic",        description: "Split flow based on a condition" },
  wait_condition:{ label: "Wait Until",       icon: AlarmClock,    color: "#0ea5e9", bg: "bg-sky-50 dark:bg-sky-950/30",         border: "border-sky-200 dark:border-sky-800/50",        category: "logic",        description: "Wait until a condition is met" },
  goal:          { label: "Goal",             icon: Flag,          color: "#22c55e", bg: "bg-green-50 dark:bg-green-950/30",     border: "border-green-200 dark:border-green-800/50",    category: "logic",        description: "Mark a conversion or milestone" },
  tag:           { label: "Add / Remove Tag", icon: Tag,           color: "#a855f7", bg: "bg-purple-50 dark:bg-purple-950/30",   border: "border-purple-200 dark:border-purple-800/50",  category: "crm",          description: "Apply or remove a contact tag" },
  update_field:  { label: "Update Field",     icon: Pencil,        color: "#64748b", bg: "bg-slate-50 dark:bg-slate-900/40",     border: "border-slate-200 dark:border-slate-700",       category: "crm",          description: "Change a contact field value" },
  assign:        { label: "Assign Lead",      icon: UserPlus,      color: "#0891b2", bg: "bg-cyan-50 dark:bg-cyan-950/30",       border: "border-cyan-200 dark:border-cyan-800/50",      category: "crm",          description: "Assign to a team member" },
  note:          { label: "Add Note",         icon: FileText,      color: "#d97706", bg: "bg-amber-50 dark:bg-amber-950/30",     border: "border-amber-200 dark:border-amber-800/50",    category: "crm",          description: "Log a note on the contact record" },
  task:          { label: "Create Task",      icon: ClipboardList, color: "#16a34a", bg: "bg-green-50 dark:bg-green-950/30",     border: "border-green-200 dark:border-green-800/50",    category: "crm",          description: "Create a follow-up task" },
  webhook:             { label: "Webhook",                  icon: Globe,         color: "#6366f1", bg: "bg-indigo-50 dark:bg-indigo-950/30",   border: "border-indigo-200 dark:border-indigo-800/50",   category: "integrations", description: "POST data to any external URL" },
  vapi_call:           { label: "Vapi AI Call",             icon: Phone,         color: "#7c3aed", bg: "bg-violet-50 dark:bg-violet-950/30",   border: "border-violet-200 dark:border-violet-800/50",   category: "integrations", description: "Deploy an AI voice agent to call the lead" },
  calendar:            { label: "Create Calendar Event",    icon: CalendarPlus,  color: "#4285f4", bg: "bg-blue-50 dark:bg-blue-950/30",        border: "border-blue-200 dark:border-blue-800/50",       category: "integrations", description: "Book a meeting in Google Calendar" },
  notion_page:         { label: "Create Notion Entry",      icon: BookOpen,      color: "#000000", bg: "bg-zinc-100 dark:bg-zinc-800",           border: "border-zinc-200 dark:border-zinc-700",          category: "integrations", description: "Add a row or page to a Notion database" },
  zapier_trigger:      { label: "Trigger Zapier Zap",       icon: Zap,           color: "#ff4a00", bg: "bg-orange-50 dark:bg-orange-950/30",    border: "border-orange-200 dark:border-orange-800/50",   category: "integrations", description: "Fire a Zap to connect 6,000+ apps" },
  linkedin_dm:         { label: "LinkedIn DM",              icon: Briefcase,     color: "#0a66c2", bg: "bg-blue-50 dark:bg-blue-950/30",        border: "border-blue-200 dark:border-blue-800/50",       category: "integrations", description: "Send an outreach message on LinkedIn" },
  google_ads_audience: { label: "Google Ads Audience",      icon: Megaphone,     color: "#4285f4", bg: "bg-sky-50 dark:bg-sky-950/30",          border: "border-sky-200 dark:border-sky-800/50",         category: "integrations", description: "Add contact to a Google Ads custom audience" },
  meta_ads_audience:   { label: "Meta Ads Audience",        icon: Megaphone,     color: "#1877f2", bg: "bg-blue-50 dark:bg-blue-950/30",        border: "border-blue-200 dark:border-blue-800/50",       category: "integrations", description: "Add contact to a Meta custom audience" },
};

const CATEGORIES: { id: string; label: string; types: NodeType[] }[] = [
  { id: "comms",        label: "Communication", types: ["email", "sms", "call", "whatsapp", "instagram", "ig_story", "ig_comment_dm", "facebook", "message"] },
  { id: "logic",        label: "Logic & Flow",  types: ["delay", "branch", "wait_condition", "goal"] },
  { id: "crm",          label: "CRM Actions",   types: ["tag", "update_field", "assign", "note", "task"] },
  // "integrations" tab is handled dynamically — no static types here
];

const TRIGGER_GROUPS = [
  { label: "Lead & Contact", options: [
    { value: "new_lead",            label: "New Lead Created" },
    { value: "form_submitted",      label: "Form Submitted" },
    { value: "tag_added",           label: "Tag Added" },
    { value: "tag_removed",         label: "Tag Removed" },
    { value: "field_updated",       label: "Field Updated" },
    { value: "lead_score_changed",  label: "Lead Score Changed" },
  ]},
  { label: "Pipeline", options: [
    { value: "stage_changed",    label: "Deal Stage Changed" },
    { value: "pipeline_won",     label: "Deal Won" },
    { value: "pipeline_lost",    label: "Deal Lost" },
    { value: "payment_received", label: "Payment Received" },
  ]},
  { label: "Communication", options: [
    { value: "message_received", label: "Message Received" },
    { value: "email_opened",     label: "Email Opened" },
    { value: "email_clicked",    label: "Email Link Clicked" },
    { value: "email_replied",    label: "Email Replied" },
    { value: "sms_replied",      label: "SMS Replied" },
    { value: "call_completed",   label: "Call Completed" },
    { value: "call_missed",      label: "Call Missed" },
  ]},
  { label: "Booking", options: [
    { value: "appointment_booked",      label: "Appointment Booked" },
    { value: "appointment_cancelled",   label: "Appointment Cancelled" },
    { value: "appointment_rescheduled", label: "Appointment Rescheduled" },
  ]},
  { label: "External", options: [
    { value: "webhook_received", label: "Webhook Received" },
    { value: "scheduled",        label: "Scheduled (Recurring)" },
  ]},
];
const ALL_TRIGGER_OPTIONS = TRIGGER_GROUPS.flatMap(g => g.options);

const CONDITION_OPTIONS = [
  { value: "email_opened",       label: "Email Opened" },
  { value: "email_clicked",      label: "Email Link Clicked" },
  { value: "email_replied",      label: "Email Replied" },
  { value: "sms_replied",        label: "SMS Replied" },
  { value: "call_answered",      label: "Call Answered" },
  { value: "call_voicemail",     label: "Call Went to Voicemail" },
  { value: "has_tag",            label: "Contact Has Tag" },
  { value: "no_tag",             label: "Contact Doesn't Have Tag" },
  { value: "field_equals",       label: "Field Equals" },
  { value: "lead_score_gt",      label: "Lead Score Greater Than" },
  { value: "lead_score_lt",      label: "Lead Score Less Than" },
  { value: "stage_is",           label: "Deal Stage Is" },
  { value: "appointment_booked", label: "Appointment Booked" },
  { value: "replied_within_1h",  label: "Replied Within 1 Hour" },
  { value: "replied_within_24h", label: "Replied Within 24 Hours" },
  { value: "payment_received",   label: "Payment Received" },
  { value: "is_mobile",          label: "Has Mobile Number" },
];

const FIELD_OPTIONS = [
  { value: "first_name",  label: "First Name" },
  { value: "last_name",   label: "Last Name" },
  { value: "email",       label: "Email" },
  { value: "phone",       label: "Phone" },
  { value: "company",     label: "Company" },
  { value: "title",       label: "Job Title" },
  { value: "stage",       label: "Pipeline Stage" },
  { value: "lead_source", label: "Lead Source" },
  { value: "lead_score",  label: "Lead Score" },
  { value: "address",     label: "Address" },
  { value: "website",     label: "Website" },
];

const TEAM_MEMBERS = ["Auto-assign", "Alex Johnson", "Maria Garcia", "James Lee", "Priya Sharma", "Chris Williams"];

const GOAL_TYPES = [
  { value: "converted",        label: "Lead Converted" },
  { value: "meeting_booked",   label: "Meeting Booked" },
  { value: "deal_won",         label: "Deal Won" },
  { value: "payment_received", label: "Payment Received" },
  { value: "unsubscribed",     label: "Unsubscribed" },
  { value: "churned",          label: "Churned" },
  { value: "custom",           label: "Custom Goal" },
];

function nodeLabel(node: BuilderNode): string {
  const c = node.config;
  switch (node.type) {
    case "trigger":        return ALL_TRIGGER_OPTIONS.find(e => e.value === c.event)?.label ?? "Choose trigger event";
    case "delay":          return c.amount ? `Wait ${c.amount} ${c.unit ?? "minutes"}${c.business_hours === "true" ? " (biz hrs)" : ""}` : "Set wait time";
    case "email":          return c.subject ? `Subject: ${c.subject}` : "Configure email";
    case "sms":            return c.message ? c.message.slice(0, 40) + (c.message.length > 40 ? "…" : "") : "Write SMS message";
    case "call":           return c.script  ? c.script.slice(0, 40) + "…" : "Add call script";
    case "whatsapp":       return c.message ? c.message.slice(0, 40) + (c.message.length > 40 ? "…" : "") : "Write WhatsApp message";
    case "instagram":      return c.message ? c.message.slice(0, 40) + (c.message.length > 40 ? "…" : "") : "Write Instagram DM";
    case "facebook":       return c.message ? c.message.slice(0, 40) + (c.message.length > 40 ? "…" : "") : "Write Facebook DM";
    case "message":        return c.text    ? c.text.slice(0, 40) + (c.text.length > 40 ? "…" : "")       : "Write message";
    case "ig_story":       return c.story_type ? `${({ hook:"Hook", value:"Value", proof:"Proof", tease:"Tease", cta:"CTA" } as Record<string,string>)[c.story_type] ?? c.story_type} Story${c.cta_text ? ` — "${c.cta_text.slice(0,25)}"` : ""}` : "Plan story";
    case "ig_comment_dm":  return c.keyword ? `"${c.keyword}" → auto-DM${c.message ? ": " + c.message.slice(0, 28) + "…" : ""}` : "Set keyword trigger";
    case "slack":          return c.channel ? `#${c.channel.replace(/^#/, "")} — ${(c.message ?? "").slice(0, 25)}…` : "Configure Slack message";
    case "branch":         return c.condition ? `If: ${CONDITION_OPTIONS.find(o => o.value === c.condition)?.label ?? c.condition}` : "Set condition";
    case "wait_condition": return c.condition ? `Wait until: ${CONDITION_OPTIONS.find(o => o.value === c.condition)?.label ?? c.condition}` : "Set wait condition";
    case "goal":           return c.goal_type ? GOAL_TYPES.find(g => g.value === c.goal_type)?.label ?? c.goal_type : "Set goal";
    case "tag":            return c.tag_name  ? `${c.action === "remove" ? "Remove" : "Add"} tag: ${c.tag_name}` : "Configure tag";
    case "update_field":   return c.field     ? `Set ${FIELD_OPTIONS.find(f => f.value === c.field)?.label ?? c.field} = ${c.value}` : "Configure field update";
    case "assign":         return c.assignee  ? `Assign to ${c.assignee}` : "Choose assignee";
    case "note":           return c.note_text ? c.note_text.slice(0, 45) + "…" : "Add note content";
    case "task":           return c.title     ? c.title : "Set task title";
    case "webhook":             return c.url          ? c.url.replace(/^https?:\/\//, "").slice(0, 40) : "Set webhook URL";
    case "vapi_call":           return c.assistant_id ? `Assistant: ${c.assistant_id}` : "Configure Vapi assistant";
    case "calendar":            return c.title        ? c.title : "Set event title";
    case "notion_page":         return c.database_id  ? `DB: ${c.database_id}` : "Configure Notion database";
    case "zapier_trigger":      return c.hook_url     ? c.hook_url.replace(/^https?:\/\//, "").slice(0, 40) : "Set Zapier hook URL";
    case "linkedin_dm":         return c.message      ? c.message.slice(0, 40) + "…" : "Write LinkedIn DM";
    case "google_ads_audience": return c.audience_id  ? `Audience: ${c.audience_id}` : "Set audience ID";
    case "meta_ads_audience":   return c.audience_id  ? `Audience: ${c.audience_id}` : "Set audience ID";
    default: return "";
  }
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{children}</label>;
}
function Field({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("w-full px-3 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors", className)} {...props} />;
}
function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none", className)} {...props} />;
}
function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div className="relative">
      <select className={cn("w-full px-3 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors appearance-none pr-8", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" strokeWidth={2} />
    </div>
  );
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 w-full text-left">
      <div className={cn("w-8 h-[18px] rounded-full relative transition-colors flex-shrink-0", checked ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700")}>
        <div className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-150", checked ? "translate-x-[14px]" : "translate-x-0.5")} />
      </div>
      <span className="text-[12px] text-zinc-600 dark:text-zinc-400">{label}</span>
    </button>
  );
}
function MergeTagHint() {
  return <p className="text-[10px] text-zinc-400 mt-1.5">Use <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{"{{name}}"}</code> <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{"{{email}}"}</code> <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{"{{company}}"}</code> <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{"{{booking_link}}"}</code></p>;
}
function Divider() { return <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />; }

// ─── Node type picker ─────────────────────────────────────────────────────────
const TABS = [
  { id: "all",          label: "All" },
  { id: "comms",        label: "Communication" },
  { id: "logic",        label: "Logic & Flow" },
  { id: "crm",          label: "CRM Actions" },
  { id: "integrations", label: "Integrations" },
];

function NodeTypePicker({ onSelect, onClose, hasTrigger }: { onSelect: (t: NodeType) => void; onClose: () => void; hasTrigger: boolean }) {
  const [search, setSearch]             = useState("");
  const [activeTab, setActiveTab]       = useState("all");
  const [intStatuses, setIntStatuses]   = useState<Record<string, IntegrationStatus>>({});
  const [isClosing, setIsClosing]       = useState(false);

  useEffect(() => { setIntStatuses(getIntegrationStatuses()); }, []);

  function handleClose() {
    setIsClosing(true);
    setTimeout(onClose, 160);
  }

  function handleSelect(t: NodeType) {
    setIsClosing(true);
    setTimeout(() => onSelect(t), 120);
  }

  const q = search.toLowerCase();

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    types: cat.types.filter(t => {
      const m = NODE_META[t];
      return (search === "" || m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
        && (activeTab === "all" || cat.id === activeTab);
    }),
  })).filter(c => c.types.length > 0);

  // For "all" search mode: also show integration node types that match
  const integrationTypeMatches: NodeType[] = search !== "" ? (
    (["webhook","vapi_call","calendar","notion_page","zapier_trigger","linkedin_dm","google_ads_audience","meta_ads_audience"] as NodeType[])
      .filter(t => {
        const m = NODE_META[t];
        return m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
      })
  ) : [];

  const showIntegrationsTab = activeTab === "integrations" || (activeTab === "all" && search === "");

  return (
    <div
      className={cn("fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm", isClosing ? "animate-backdrop-out" : "animate-backdrop-in")}
      onClick={handleClose}
    >
      <div
        className={cn("bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-[540px] max-h-[82vh] flex flex-col", isClosing ? "animate-picker-out" : "animate-picker-in")}
        onClick={e => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" strokeWidth={2} />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search steps…" className="w-full pl-9 pr-3 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors" />
          </div>
          <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex-shrink-0"><X className="w-4 h-4" strokeWidth={2} /></button>
        </div>

        {/* Tabs */}
        {search === "" && (
          <div className="flex gap-1 px-5 pt-3 pb-0 flex-shrink-0 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors flex-shrink-0", activeTab === tab.id ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800")}>
                {tab.label}
                {tab.id === "integrations" && (() => {
                  const n = Object.values(intStatuses).filter(s => s === "connected").length;
                  return n > 0 ? <span className="ml-1.5 text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">{n}</span> : null;
                })()}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Trigger */}
          {!hasTrigger && (activeTab === "all" || activeTab === "logic") && (search === "" || "trigger start workflow".includes(q)) && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Start</p>
              <button onClick={() => handleSelect("trigger")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all duration-150 text-left w-full active:scale-[0.98]">
                <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", NODE_META.trigger.bg)}><Zap className="w-4 h-4" style={{ color: NODE_META.trigger.color }} strokeWidth={1.75} /></span>
                <div className="min-w-0"><p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">Trigger</p><p className="text-[11px] text-zinc-400 truncate">Start the workflow on an event</p></div>
              </button>
            </div>
          )}

          {/* Regular categories */}
          {filteredCategories.map(cat => (
            <div key={cat.id}>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">{cat.label}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {cat.types.map(type => {
                  const m = NODE_META[type];
                  return (
                    <button key={type} onClick={() => handleSelect(type)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-150 text-left active:scale-[0.97]">
                      <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-110", m.bg)}><m.icon className="w-4 h-4" style={{ color: m.color }} strokeWidth={1.75} /></span>
                      <div className="min-w-0"><p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">{m.label}</p><p className="text-[10px] text-zinc-400 truncate leading-snug">{m.description}</p></div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Integration search results (when searching across all tabs) */}
          {search !== "" && integrationTypeMatches.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Integrations</p>
              <div className="grid grid-cols-2 gap-1.5">
                {integrationTypeMatches.map(type => {
                  const m = NODE_META[type];
                  return (
                    <button key={type} onClick={() => handleSelect(type)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-150 text-left active:scale-[0.97]">
                      <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", m.bg)}><m.icon className="w-4 h-4" style={{ color: m.color }} strokeWidth={1.75} /></span>
                      <div className="min-w-0"><p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">{m.label}</p><p className="text-[10px] text-zinc-400 truncate leading-snug">{m.description}</p></div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic integrations tab */}
          {showIntegrationsTab && activeTab === "integrations" && (
            <IntegrationsPickerTab statuses={intStatuses} onSelect={handleSelect} />
          )}

          {/* No results */}
          {search !== "" && filteredCategories.length === 0 && integrationTypeMatches.length === 0 && (
            <div className="text-center py-8">
              <Layers className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[13px] text-zinc-400">No steps match "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Integrations picker tab ──────────────────────────────────────────────────
function IntegrationsPickerTab({ statuses, onSelect }: {
  statuses: Record<string, IntegrationStatus>;
  onSelect: (t: NodeType) => void;
}) {
  const connected    = INTEGRATIONS_META.filter(i => statuses[i.id] === "connected");
  const disconnected = INTEGRATIONS_META.filter(i => statuses[i.id] !== "connected" && !i.comingSoon);
  const comingSoon   = INTEGRATIONS_META.filter(i => i.comingSoon);

  return (
    <div className="space-y-5">
      {/* Connected */}
      {connected.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Connected — {connected.length} active
          </p>
          <div className="flex flex-col gap-1.5">
            {connected.map(integration => (
              <div key={integration.id} className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                {/* Integration header */}
                <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-50/60 dark:bg-zinc-800/40">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {integration.logoSrc
                      ? <img src={integration.logoSrc} alt={integration.name} className="w-4 h-4 object-contain" />
                      : <div className="w-3 h-3 rounded-full" style={{ background: integration.color }} />
                    }
                  </div>
                  <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{integration.name}</p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">● Connected</span>
                </div>
                {/* Actions */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {integration.actions.map(action => (
                    <button
                      key={action.nodeType}
                      onClick={() => onSelect(action.nodeType as NodeType)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors text-left"
                    >
                      {(() => {
                        const m = NODE_META[action.nodeType as NodeType];
                        return m ? (
                          <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", m.bg)}>
                            <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} strokeWidth={1.75} />
                          </span>
                        ) : null;
                      })()}
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">{action.label}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{action.description}</p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 flex-shrink-0" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {connected.length === 0 && (
        <div className="text-center py-6 px-4">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <Globe className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
          </div>
          <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">No integrations connected</p>
          <p className="text-[11px] text-zinc-400 mb-3">Connect apps in Settings to use them in workflows</p>
          <a href="/settings/integrations" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Go to Integrations Settings <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Available to connect */}
      {disconnected.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Available to Connect</p>
            <a href="/settings/integrations" className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1">
              Manage <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {disconnected.map(integration => (
              <a
                key={integration.id}
                href="/settings/integrations"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {integration.logoSrc
                    ? <img src={integration.logoSrc} alt={integration.name} className="w-4 h-4 object-contain opacity-50" />
                    : <div className="w-3 h-3 rounded-full opacity-40" style={{ background: integration.color }} />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate">{integration.name}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors">Connect →</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Coming soon */}
      {comingSoon.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Coming Soon</p>
          <div className="grid grid-cols-2 gap-1.5">
            {comingSoon.map(integration => (
              <div key={integration.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 opacity-50 cursor-not-allowed">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {integration.logoSrc
                    ? <img src={integration.logoSrc} alt={integration.name} className="w-4 h-4 object-contain" />
                    : <div className="w-3 h-3 rounded-full" style={{ background: integration.color }} />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-zinc-500 truncate">{integration.name}</p>
                  <p className="text-[10px] text-zinc-400">Soon</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Node config panel ────────────────────────────────────────────────────────
function NodeConfigPanel({ node, onChange, onDelete, onClose }: {
  node: BuilderNode;
  onChange: (config: Record<string, string>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const meta = NODE_META[node.type];
  const c = node.config;
  const up = (patch: Record<string, string>) => onChange({ ...c, ...patch });
  const [isClosing, setIsClosing] = useState(false);

  function handleClose() {
    setIsClosing(true);
    setTimeout(onClose, 180);
  }
  function handleDelete() {
    setIsClosing(true);
    setTimeout(onDelete, 180);
  }

  return (
    <div className={cn("fixed right-0 top-0 h-full w-[380px] z-[150] bg-white dark:bg-zinc-900 border-l border-zinc-100 dark:border-zinc-800 shadow-2xl flex flex-col", isClosing ? "animate-panel-out" : "animate-panel-in")}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
        <span className={cn("animate-icon-pop w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", meta.bg)}>
          <meta.icon className="w-4 h-4" style={{ color: meta.color }} strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-50">{meta.label}</p>
          <p className="text-[11px] text-zinc-400 truncate">{meta.description}</p>
        </div>
        <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors active:scale-90"><X className="w-4 h-4" strokeWidth={2} /></button>
      </div>

      <div className="animate-content-fade flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {node.type === "trigger" && (<>
          <div><Label>Trigger Event</Label>
            <Select value={c.event ?? ""} onChange={e => up({ event: e.target.value })}>
              <option value="">Select an event…</option>
              {TRIGGER_GROUPS.map(g => <optgroup key={g.label} label={g.label}>{g.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>)}
            </Select>
          </div>
          {(c.event === "tag_added" || c.event === "tag_removed") && <div><Label>Tag Name</Label><Field value={c.tag_filter ?? ""} onChange={e => up({ tag_filter: e.target.value })} placeholder="e.g. Hot Lead" /></div>}
          {c.event === "scheduled" && <div><Label>Repeat Every</Label><div className="flex gap-2"><Field type="number" min="1" value={c.schedule_amount ?? "1"} onChange={e => up({ schedule_amount: e.target.value })} className="w-24" /><Select value={c.schedule_unit ?? "days"} onChange={e => up({ schedule_unit: e.target.value })}><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></Select></div></div>}
        </>)}

        {node.type === "email" && (<>
          <div><Label>From Name</Label><Field value={c.from_name ?? ""} onChange={e => up({ from_name: e.target.value })} placeholder="Your name or company" /></div>
          <div><Label>Reply-To Email</Label><Field type="email" value={c.reply_to ?? ""} onChange={e => up({ reply_to: e.target.value })} placeholder="reply@yourcompany.com" /></div>
          <Divider />
          <div><Label>Subject Line</Label><Field value={c.subject ?? ""} onChange={e => up({ subject: e.target.value })} placeholder="Your subject…" /></div>
          <div><Label>Preview Text</Label><Field value={c.preheader ?? ""} onChange={e => up({ preheader: e.target.value })} placeholder="Preview text shown in inbox…" /></div>
          <div><Label>Body</Label><Textarea value={c.body ?? ""} onChange={e => up({ body: e.target.value })} rows={8} placeholder={"Hi {{name}},\n\nYour message here…"} /><MergeTagHint /></div>
          <Divider />
          <div><Label>Send Timing</Label><Select value={c.send_timing ?? "immediately"} onChange={e => up({ send_timing: e.target.value })}><option value="immediately">Send immediately</option><option value="smart">Smart send (best open time)</option><option value="morning">Morning (8–10 AM local)</option><option value="afternoon">Afternoon (1–3 PM local)</option></Select></div>
        </>)}

        {node.type === "sms" && (<>
          <div><Label>Message</Label><Textarea value={c.message ?? ""} onChange={e => up({ message: e.target.value })} rows={5} placeholder={"Hi {{name}}, …"} /><div className="flex justify-between mt-1.5"><MergeTagHint /><span className={cn("text-[10px] tabular-nums ml-2 flex-shrink-0", (c.message ?? "").length > 160 ? "text-red-500" : "text-zinc-400")}>{(c.message ?? "").length} / 160</span></div></div>
          <Divider />
          <Toggle checked={c.include_opt_out === "true"} onChange={v => up({ include_opt_out: v ? "true" : "false" })} label='Include opt-out ("Reply STOP to unsubscribe")' />
        </>)}

        {node.type === "call" && (<>
          <div><Label>Caller ID</Label><Field value={c.caller_id ?? ""} onChange={e => up({ caller_id: e.target.value })} placeholder="+1 (555) 000-0000" /></div>
          <div><Label>Call Script</Label><Textarea value={c.script ?? ""} onChange={e => up({ script: e.target.value })} rows={6} placeholder={"Hi {{name}}, I'm calling because…"} /><MergeTagHint /></div>
          <Divider />
          <div><Label>Voicemail Script</Label><Textarea value={c.voicemail_script ?? ""} onChange={e => up({ voicemail_script: e.target.value })} rows={4} placeholder="Hey {{name}}, I just tried calling…" /></div>
          <Divider />
          <Toggle checked={c.recording === "true"} onChange={v => up({ recording: v ? "true" : "false" })} label="Record call" />
          <Toggle checked={c.drop_voicemail === "true"} onChange={v => up({ drop_voicemail: v ? "true" : "false" })} label="Drop pre-recorded voicemail on no-answer" />
        </>)}

        {node.type === "whatsapp" && (<>
          <div><Label>Message Type</Label><Select value={c.message_type ?? "text"} onChange={e => up({ message_type: e.target.value })}><option value="text">Text Message</option><option value="template">Approved Template</option></Select></div>
          <div><Label>Message</Label><Textarea value={c.message ?? ""} onChange={e => up({ message: e.target.value })} rows={5} placeholder={"Hi {{name}}, …"} /><MergeTagHint /></div>
          {c.message_type === "template" && <div><Label>Template Name</Label><Field value={c.template_name ?? ""} onChange={e => up({ template_name: e.target.value })} placeholder="e.g. welcome_message" /></div>}
        </>)}

        {node.type === "ig_story" && (<>
          <div><Label>Story Type</Label>
            <Select value={c.story_type ?? ""} onChange={e => up({ story_type: e.target.value })}>
              <option value="">Choose story type…</option>
              <option value="hook">🪝 Hook — grab attention, tease a problem</option>
              <option value="value">💡 Value Bomb — teach something useful</option>
              <option value="proof">⭐ Social Proof — share a result/testimonial</option>
              <option value="tease">👀 Tease — hint at what's coming</option>
              <option value="cta">🔥 CTA — drive DMs with a keyword</option>
            </Select>
          </div>
          <Divider />
          <div><Label>Voiceover / Script</Label>
            <Textarea value={c.script ?? ""} onChange={e => up({ script: e.target.value })} rows={5} placeholder={"What you'll say on camera or as a voiceover…\n\nTip: write it conversationally, like you're talking to one person."} />
          </div>
          <div><Label>On-Screen Text</Label>
            <Field value={c.on_screen_text ?? ""} onChange={e => up({ on_screen_text: e.target.value })} placeholder='e.g. "The thing nobody talks about 👇"' />
            <p className="text-[10px] text-zinc-400 mt-1.5">Keep it short — 5–8 words max</p>
          </div>
          <Divider />
          <div><Label>DM Keyword CTA</Label>
            <Field value={c.cta_text ?? ""} onChange={e => up({ cta_text: e.target.value })} placeholder='e.g. "DM me FREEBIE to get the guide!"' />
            <p className="text-[10px] text-zinc-400 mt-1.5">Use a single ALL-CAPS keyword so your DM automation can trigger on it</p>
          </div>
          <div><Label>Swipe-Up / Link (optional)</Label>
            <Field value={c.link ?? ""} onChange={e => up({ link: e.target.value })} placeholder="https://…" />
          </div>
          <Divider />
          <div><Label>Best Posting Time</Label>
            <Select value={c.posting_time ?? "morning"} onChange={e => up({ posting_time: e.target.value })}>
              <option value="morning">Morning (7–9 AM) — highest reach</option>
              <option value="lunch">Lunch (11 AM–1 PM)</option>
              <option value="afternoon">Afternoon (3–5 PM)</option>
              <option value="evening">Evening (6–8 PM) — highest engagement</option>
            </Select>
          </div>
          <div><Label>Internal Notes</Label>
            <Textarea value={c.notes ?? ""} onChange={e => up({ notes: e.target.value })} rows={3} placeholder="Props needed, B-roll ideas, energy/mood…" />
          </div>
        </>)}

        {node.type === "ig_comment_dm" && (<>
          <div className="bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/50 rounded-xl px-3 py-2.5">
            <p className="text-[11px] font-semibold text-pink-700 dark:text-pink-300 mb-0.5">How it works</p>
            <p className="text-[11px] text-pink-600 dark:text-pink-400 leading-relaxed">When someone comments your keyword on any post/reel, they automatically receive your DM — even if they don't follow you.</p>
          </div>
          <div><Label>Trigger Keyword</Label>
            <Field value={c.keyword ?? ""} onChange={e => up({ keyword: e.target.value })} placeholder='e.g. FREEBIE, INFO, GUIDE, JOIN' />
            <p className="text-[10px] text-zinc-400 mt-1.5">ALL-CAPS recommended. Match this keyword in your story/post CTA exactly.</p>
          </div>
          <div><Label>Post / Reel URL (optional)</Label>
            <Field value={c.post_url ?? ""} onChange={e => up({ post_url: e.target.value })} placeholder="https://www.instagram.com/p/…" />
            <p className="text-[10px] text-zinc-400 mt-1.5">Leave blank to trigger on any post that gets this comment</p>
          </div>
          <Divider />
          <div><Label>Auto-DM Message</Label>
            <Textarea value={c.message ?? ""} onChange={e => up({ message: e.target.value })} rows={6} placeholder={"Hey {{name}}! Thanks for commenting 🙌\n\nHere's your [THING]: [LINK]\n\nReply and let me know what you think!"} />
            <MergeTagHint />
          </div>
          <Divider />
          <div><Label>Delay Before Sending</Label>
            <Select value={c.delay_minutes ?? "1"} onChange={e => up({ delay_minutes: e.target.value })}>
              <option value="0">Instantly</option>
              <option value="1">~1 minute (recommended — looks natural)</option>
              <option value="3">~3 minutes</option>
              <option value="5">~5 minutes</option>
            </Select>
          </div>
          <Toggle checked={c.first_comment_only === "true"} onChange={v => up({ first_comment_only: v ? "true" : "false" })} label="Only DM the first time they comment (not repeats)" />
          <Toggle checked={c.non_followers_only === "false"} onChange={v => up({ non_followers_only: v ? "false" : "true" })} label="Also DM current followers (not just new people)" />
        </>)}

        {(node.type === "instagram" || node.type === "facebook" || node.type === "message") && (<>
          <div><Label>{node.type === "instagram" ? "Instagram DM" : node.type === "facebook" ? "Facebook Messenger" : "Direct Message"}</Label><Textarea value={c.message ?? c.text ?? ""} onChange={e => up({ message: e.target.value, text: e.target.value })} rows={5} placeholder={"Hi {{name}}, thanks for reaching out! …"} /><MergeTagHint /></div>
          <Divider />
          <div><Label>Auto-Reply Keyword (optional)</Label><Field value={c.keyword ?? ""} onChange={e => up({ keyword: e.target.value })} placeholder="e.g. INFO, PRICING, START" /><p className="text-[10px] text-zinc-400 mt-1.5">Only trigger if contact's last message contains this keyword</p></div>
        </>)}

        {node.type === "slack" && (<>
          <div><Label>Channel</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[13px]">#</span><Field value={c.channel?.replace(/^#/, "") ?? ""} onChange={e => up({ channel: e.target.value.replace(/^#/, "") })} className="pl-7" placeholder="general" /></div></div>
          <div><Label>Message</Label><Textarea value={c.message ?? ""} onChange={e => up({ message: e.target.value })} rows={4} placeholder={"🎉 {{name}} from {{company}} just …"} /><MergeTagHint /></div>
          <div><Label>Mention</Label><Select value={c.mention ?? "none"} onChange={e => up({ mention: e.target.value })}><option value="none">No mention</option><option value="here">@here</option><option value="channel">@channel</option></Select></div>
        </>)}

        {node.type === "delay" && (<>
          <div><Label>Wait Duration</Label><div className="flex gap-2"><Field type="number" min="1" value={c.amount ?? ""} onChange={e => up({ amount: e.target.value })} className="w-24" placeholder="5" /><Select value={c.unit ?? "minutes"} onChange={e => up({ unit: e.target.value })}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option></Select></div></div>
          <Divider />
          <Toggle checked={c.business_hours === "true"} onChange={v => up({ business_hours: v ? "true" : "false" })} label="Business hours only (Mon–Fri 9am–6pm)" />
        </>)}

        {node.type === "branch" && (<>
          <div><Label>Condition (Yes path if…)</Label><Select value={c.condition ?? ""} onChange={e => up({ condition: e.target.value })}><option value="">Select a condition…</option>{CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></div>
          {(c.condition === "has_tag" || c.condition === "no_tag") && <div><Label>Tag Name</Label><Field value={c.condition_value ?? ""} onChange={e => up({ condition_value: e.target.value })} placeholder="e.g. Hot Lead" /></div>}
          {(c.condition === "field_equals" || c.condition === "stage_is") && (<><div><Label>Field</Label><Select value={c.condition_field ?? ""} onChange={e => up({ condition_field: e.target.value })}><option value="">Select field…</option>{FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></div><div><Label>Value</Label><Field value={c.condition_value ?? ""} onChange={e => up({ condition_value: e.target.value })} placeholder="Expected value" /></div></>)}
          {(c.condition === "lead_score_gt" || c.condition === "lead_score_lt") && <div><Label>Score</Label><Field type="number" value={c.condition_value ?? ""} onChange={e => up({ condition_value: e.target.value })} placeholder="e.g. 50" /></div>}
          <Divider />
          <div><Label>If Condition Not Met (No path)</Label><Select value={c.else_action ?? "continue"} onChange={e => up({ else_action: e.target.value })}><option value="continue">Continue to next step</option><option value="end">End workflow</option></Select></div>
        </>)}

        {node.type === "wait_condition" && (<>
          <div><Label>Wait Until</Label><Select value={c.condition ?? ""} onChange={e => up({ condition: e.target.value })}><option value="">Select a condition…</option>{CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></div>
          <Divider />
          <div><Label>Timeout (give up after)</Label><div className="flex gap-2"><Field type="number" min="1" value={c.timeout_amount ?? ""} onChange={e => up({ timeout_amount: e.target.value })} className="w-24" placeholder="7" /><Select value={c.timeout_unit ?? "days"} onChange={e => up({ timeout_unit: e.target.value })}><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option></Select></div></div>
          <div><Label>On Timeout</Label><Select value={c.timeout_action ?? "continue"} onChange={e => up({ timeout_action: e.target.value })}><option value="continue">Continue anyway</option><option value="end">End workflow</option></Select></div>
        </>)}

        {node.type === "goal" && (<>
          <div><Label>Goal Type</Label><Select value={c.goal_type ?? ""} onChange={e => up({ goal_type: e.target.value })}><option value="">Select goal…</option>{GOAL_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}</Select></div>
          {c.goal_type === "custom" && <div><Label>Goal Name</Label><Field value={c.goal_name ?? ""} onChange={e => up({ goal_name: e.target.value })} placeholder="e.g. Free Trial Started" /></div>}
          <div><Label>Conversion Value ($)</Label><Field type="number" value={c.value ?? ""} onChange={e => up({ value: e.target.value })} placeholder="0.00" /></div>
          <Divider />
          <Toggle checked={c.end_on_goal === "true"} onChange={v => up({ end_on_goal: v ? "true" : "false" })} label="End workflow when goal is reached" />
        </>)}

        {node.type === "tag" && (<>
          <div><Label>Action</Label><Select value={c.action ?? "add"} onChange={e => up({ action: e.target.value })}><option value="add">Add tag</option><option value="remove">Remove tag</option></Select></div>
          <div><Label>Tag Name</Label><Field value={c.tag_name ?? ""} onChange={e => up({ tag_name: e.target.value })} placeholder="e.g. Hot Lead, VIP, Nurture" /></div>
          <Toggle checked={c.create_if_missing === "true"} onChange={v => up({ create_if_missing: v ? "true" : "false" })} label="Create tag if it doesn't exist" />
        </>)}

        {node.type === "update_field" && (<>
          <div><Label>Field to Update</Label><Select value={c.field ?? ""} onChange={e => up({ field: e.target.value })}><option value="">Select field…</option>{FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</Select></div>
          <div><Label>New Value</Label><Field value={c.value ?? ""} onChange={e => up({ value: e.target.value })} placeholder="New value (supports {{merge tags}})" /><MergeTagHint /></div>
        </>)}

        {node.type === "assign" && (<>
          <div><Label>Assign To</Label><Select value={c.assignee ?? ""} onChange={e => up({ assignee: e.target.value })}><option value="">Select team member…</option>{TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}</Select></div>
          <div><Label>Priority</Label><Select value={c.priority ?? "normal"} onChange={e => up({ priority: e.target.value })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></Select></div>
          <Divider />
          <Toggle checked={c.notify === "true"} onChange={v => up({ notify: v ? "true" : "false" })} label="Notify assignee via email" />
          <Toggle checked={c.notify_slack === "true"} onChange={v => up({ notify_slack: v ? "true" : "false" })} label="Notify assignee via Slack" />
        </>)}

        {node.type === "note" && (<>
          <div><Label>Note Type</Label><Select value={c.note_type ?? "general"} onChange={e => up({ note_type: e.target.value })}><option value="general">General Note</option><option value="follow_up">Follow-up</option><option value="meeting">Meeting</option><option value="call">Call</option><option value="internal">Internal Note</option></Select></div>
          <div><Label>Note Content</Label><Textarea value={c.note_text ?? ""} onChange={e => up({ note_text: e.target.value })} rows={5} placeholder={"Note about {{name}}…"} /><MergeTagHint /></div>
        </>)}

        {node.type === "task" && (<>
          <div><Label>Task Title</Label><Field value={c.title ?? ""} onChange={e => up({ title: e.target.value })} placeholder="e.g. Call {{name}} to follow up" /><MergeTagHint /></div>
          <div><Label>Description</Label><Textarea value={c.description ?? ""} onChange={e => up({ description: e.target.value })} rows={3} placeholder="Additional context…" /></div>
          <Divider />
          <div><Label>Due In</Label><div className="flex gap-2"><Field type="number" min="1" value={c.due_amount ?? ""} onChange={e => up({ due_amount: e.target.value })} className="w-24" placeholder="1" /><Select value={c.due_unit ?? "days"} onChange={e => up({ due_unit: e.target.value })}><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option></Select></div></div>
          <div><Label>Priority</Label><Select value={c.priority ?? "medium"} onChange={e => up({ priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></Select></div>
          <div><Label>Assign To</Label><Select value={c.assignee ?? ""} onChange={e => up({ assignee: e.target.value })}><option value="">Same as lead owner</option>{TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}</Select></div>
        </>)}

        {node.type === "webhook" && (<>
          <div><Label>URL</Label><Field value={c.url ?? ""} onChange={e => up({ url: e.target.value })} placeholder="https://hooks.example.com/…" /></div>
          <div><Label>Method</Label><Select value={c.method ?? "POST"} onChange={e => up({ method: e.target.value })}><option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="PATCH">PATCH</option><option value="DELETE">DELETE</option></Select></div>
          <Divider />
          <div><Label>Authentication</Label><Select value={c.auth_type ?? "none"} onChange={e => up({ auth_type: e.target.value })}><option value="none">None</option><option value="bearer">Bearer Token</option><option value="basic">Basic Auth</option><option value="api_key">API Key Header</option></Select></div>
          {c.auth_type === "bearer" && <div><Label>Bearer Token</Label><Field type="password" value={c.auth_token ?? ""} onChange={e => up({ auth_token: e.target.value })} placeholder="••••••••" /></div>}
          {c.auth_type === "basic" && (<><div><Label>Username</Label><Field value={c.auth_user ?? ""} onChange={e => up({ auth_user: e.target.value })} placeholder="Username" /></div><div><Label>Password</Label><Field type="password" value={c.auth_pass ?? ""} onChange={e => up({ auth_pass: e.target.value })} placeholder="••••••••" /></div></>)}
          {c.auth_type === "api_key" && (<><div><Label>Header Name</Label><Field value={c.auth_header ?? ""} onChange={e => up({ auth_header: e.target.value })} placeholder="X-API-Key" /></div><div><Label>API Key</Label><Field type="password" value={c.auth_token ?? ""} onChange={e => up({ auth_token: e.target.value })} placeholder="••••••••" /></div></>)}
          <Divider />
          <div><Label>Body Template (JSON)</Label><Textarea value={c.body_template ?? ""} onChange={e => up({ body_template: e.target.value })} rows={6} placeholder={'{\n  "name": "{{name}}",\n  "email": "{{email}}"\n}'} className="font-mono text-[12px]" /><MergeTagHint /></div>
          <Toggle checked={c.retry_on_fail === "true"} onChange={v => up({ retry_on_fail: v ? "true" : "false" })} label="Retry on failure (up to 3 times)" />
        </>)}

        {node.type === "vapi_call" && (<>
          <div><Label>Assistant ID</Label><Field value={c.assistant_id ?? ""} onChange={e => up({ assistant_id: e.target.value })} placeholder="vapi-assistant-xxxx" /><p className="text-[10px] text-zinc-400 mt-1.5">Find this in your Vapi dashboard</p></div>
          <div><Label>Phone Number</Label><Field value={c.phone_number ?? ""} onChange={e => up({ phone_number: e.target.value })} placeholder="+1 (555) 000-0000 or {{phone}}" /><MergeTagHint /></div>
          <Divider />
          <div><Label>First Message Override (optional)</Label><Textarea value={c.first_message ?? ""} onChange={e => up({ first_message: e.target.value })} rows={3} placeholder={"Hi {{name}}, I'm calling from…"} /><MergeTagHint /></div>
          <div><Label>Max Duration (minutes)</Label><Field type="number" min="1" max="60" value={c.max_duration ?? "10"} onChange={e => up({ max_duration: e.target.value })} className="w-24" /></div>
          <Divider />
          <Toggle checked={c.record === "true"} onChange={v => up({ record: v ? "true" : "false" })} label="Record call" />
          <Toggle checked={c.voicemail_drop === "true"} onChange={v => up({ voicemail_drop: v ? "true" : "false" })} label="Leave voicemail if no answer" />
        </>)}

        {node.type === "calendar" && (<>
          <div><Label>Event Title</Label><Field value={c.title ?? ""} onChange={e => up({ title: e.target.value })} placeholder="e.g. Call with {{name}}" /><MergeTagHint /></div>
          <div><Label>Description</Label><Textarea value={c.description ?? ""} onChange={e => up({ description: e.target.value })} rows={3} placeholder="Meeting details…" /></div>
          <Divider />
          <div><Label>Schedule In</Label><div className="flex gap-2"><Field type="number" min="1" value={c.offset_amount ?? "1"} onChange={e => up({ offset_amount: e.target.value })} className="w-24" /><Select value={c.offset_unit ?? "days"} onChange={e => up({ offset_unit: e.target.value })}><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option></Select></div></div>
          <div><Label>Duration (minutes)</Label><Select value={c.duration ?? "30"} onChange={e => up({ duration: e.target.value })}><option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option></Select></div>
          <Divider />
          <Toggle checked={c.send_invite === "true"} onChange={v => up({ send_invite: v ? "true" : "false" })} label="Send calendar invite to contact" />
          <Toggle checked={c.add_meet === "true"} onChange={v => up({ add_meet: v ? "true" : "false" })} label="Add Google Meet link" />
        </>)}

        {node.type === "notion_page" && (<>
          <div><Label>Database ID</Label><Field value={c.database_id ?? ""} onChange={e => up({ database_id: e.target.value })} placeholder="notion.so/…/xxxxxxxxxxxxxx" /></div>
          <div><Label>Page Title</Label><Field value={c.page_title ?? ""} onChange={e => up({ page_title: e.target.value })} placeholder="e.g. {{name}} — {{company}}" /><MergeTagHint /></div>
          <Divider />
          <div><Label>Properties (JSON)</Label><Textarea value={c.properties ?? ""} onChange={e => up({ properties: e.target.value })} rows={5} placeholder={'{\n  "Status": "Lead",\n  "Email": "{{email}}"\n}'} className="font-mono text-[12px]" /><MergeTagHint /></div>
        </>)}

        {node.type === "zapier_trigger" && (<>
          <div><Label>Zapier Webhook URL</Label><Field value={c.hook_url ?? ""} onChange={e => up({ hook_url: e.target.value })} placeholder="https://hooks.zapier.com/hooks/catch/…" /><p className="text-[10px] text-zinc-400 mt-1.5">Get this URL from the "Catch Hook" trigger in your Zap</p></div>
          <Divider />
          <div><Label>Payload (JSON)</Label><Textarea value={c.payload ?? ""} onChange={e => up({ payload: e.target.value })} rows={5} placeholder={'{\n  "name": "{{name}}",\n  "email": "{{email}}",\n  "event": "workflow_step"\n}'} className="font-mono text-[12px]" /><MergeTagHint /></div>
          <Toggle checked={c.retry_on_fail === "true"} onChange={v => up({ retry_on_fail: v ? "true" : "false" })} label="Retry on failure (up to 3 times)" />
        </>)}

        {node.type === "linkedin_dm" && (<>
          <div><Label>Message</Label><Textarea value={c.message ?? ""} onChange={e => up({ message: e.target.value })} rows={5} placeholder={"Hi {{name}}, I came across your profile and…"} /><MergeTagHint /></div>
          <div><Label>Connection Note (optional)</Label><Textarea value={c.connection_note ?? ""} onChange={e => up({ connection_note: e.target.value })} rows={3} placeholder="Add a note with the connection request…" /></div>
        </>)}

        {(node.type === "google_ads_audience" || node.type === "meta_ads_audience") && (<>
          <div><Label>Audience ID</Label><Field value={c.audience_id ?? ""} onChange={e => up({ audience_id: e.target.value })} placeholder={node.type === "google_ads_audience" ? "Google Ads customer list ID" : "Meta custom audience ID"} /></div>
          <div><Label>Action</Label><Select value={c.action ?? "add"} onChange={e => up({ action: e.target.value })}><option value="add">Add to audience</option><option value="remove">Remove from audience</option></Select></div>
          <Divider />
          <div><Label>Match Field</Label><Select value={c.match_field ?? "email"} onChange={e => up({ match_field: e.target.value })}><option value="email">Email</option><option value="phone">Phone number</option><option value="both">Email + Phone</option></Select></div>
          <Toggle checked={c.normalize === "true"} onChange={v => up({ normalize: v ? "true" : "false" })} label="Normalize data before matching" />
        </>)}
      </div>

      <div className="flex-shrink-0 px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
        <button onClick={handleDelete} className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors active:scale-90"><Trash2 className="w-4 h-4" strokeWidth={1.75} /></button>
        <button onClick={handleClose} className="flex-1 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors active:scale-[0.98]">Done</button>
      </div>
    </div>
  );
}

// ─── Builder node card ────────────────────────────────────────────────────────
function BuilderNodeCard({ node, onSelect, selected }: { node: BuilderNode; onSelect: () => void; selected: boolean }) {
  const meta = NODE_META[node.type];
  if (!meta) return null;
  return (
    <div
      data-no-pan="true"
      onClick={onSelect}
      className={cn(
        "animate-node-appear",
        "w-[300px] bg-white dark:bg-zinc-900 rounded-2xl border-2 cursor-pointer overflow-hidden select-none",
        "shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.25)]",
        "transition-all duration-150",
        "hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.38)]",
        "hover:scale-[1.015]",
        "active:scale-[0.97] active:shadow-none",
        selected
          ? "border-zinc-900 dark:border-zinc-100 scale-[1.015] shadow-[0_6px_24px_rgba(0,0,0,0.14)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.4)]"
          : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
      )}
    >
      <div className="h-0.5 w-full" style={{ background: meta.color }} />
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", meta.bg)}>
          <meta.icon className="w-4 h-4" style={{ color: meta.color }} strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider leading-none mb-0.5">{meta.label}</p>
          <p className="text-[12px] text-zinc-800 dark:text-zinc-200 truncate leading-snug">{nodeLabel(node)}</p>
        </div>
        {selected && (
          <span className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-2.5 h-2.5 text-white dark:text-zinc-900" strokeWidth={3} />
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Connector ─────────────────────────────────────────────────────────────────
function Connector({ onAdd }: { onAdd: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setPulsing(true);
    setTimeout(() => setPulsing(false), 400);
    onAdd();
  }

  return (
    <div className="flex flex-col items-center" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} data-no-pan="true">
      <div className={cn("w-px h-4 transition-colors duration-150", hovered ? "bg-zinc-400 dark:bg-zinc-500" : "bg-zinc-200 dark:bg-zinc-700")} />
      <button
        onClick={handleClick}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          pulsing && "animate-connector-ring",
          hovered
            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 scale-125"
            : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-400 hover:scale-110"
        )}
      >
        <Plus className={cn("transition-transform duration-200", hovered ? "w-3.5 h-3.5 rotate-0" : "w-3 h-3")} strokeWidth={2.5} />
      </button>
      <div className={cn("w-px h-4 transition-colors duration-150", hovered ? "bg-zinc-400 dark:bg-zinc-500" : "bg-zinc-200 dark:bg-zinc-700")} />
    </div>
  );
}

// ─── Branch block & node sequence (mutually recursive) ────────────────────────
interface SequenceProps {
  nodes: BuilderNode[];
  ctx: AddCtx;
  openPicker: (ps: PickerState) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

function BranchBlock({ node, openPicker, onSelect, selectedId }: {
  node: BuilderNode;
  openPicker: (ps: PickerState) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const yesCtx: AddCtx = { parentBranchId: node.id, branchPath: "yes" };
  const noCtx:  AddCtx = { parentBranchId: node.id, branchPath: "no"  };
  const yesNodes = node.yes_branch ?? [];
  const noNodes  = node.no_branch  ?? [];

  return (
    <div className="flex flex-col items-center animate-branch-in" data-no-pan="true">
      {/* fork stem */}
      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />

      {/* two-column panel */}
      <div className="flex rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">

        {/* YES column */}
        <div className="flex flex-col items-center px-6 pt-4 pb-5 border-r border-zinc-200 dark:border-zinc-700 min-w-[320px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-emerald-300 dark:bg-emerald-700" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              YES — if true
            </span>
            <div className="h-px w-8 bg-emerald-300 dark:bg-emerald-700" />
          </div>
          <NodeSequence nodes={yesNodes} ctx={yesCtx} openPicker={openPicker} onSelect={onSelect} selectedId={selectedId} />
          {yesNodes.length > 0 && (
            <Connector onAdd={() => openPicker({ afterIndex: yesNodes.length - 1, ctx: yesCtx })} />
          )}
        </div>

        {/* NO column */}
        <div className="flex flex-col items-center px-6 pt-4 pb-5 min-w-[320px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-red-300 dark:bg-red-700" />
            <span className="text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              NO — else path
            </span>
            <div className="h-px w-8 bg-red-300 dark:bg-red-700" />
          </div>
          <NodeSequence nodes={noNodes} ctx={noCtx} openPicker={openPicker} onSelect={onSelect} selectedId={selectedId} />
          {noNodes.length > 0 && (
            <Connector onAdd={() => openPicker({ afterIndex: noNodes.length - 1, ctx: noCtx })} />
          )}
        </div>
      </div>
    </div>
  );
}

function NodeSequence({ nodes, ctx, openPicker, onSelect, selectedId }: SequenceProps) {
  if (nodes.length === 0) {
    return (
      <button
        onClick={e => { e.stopPropagation(); openPicker({ afterIndex: -1, ctx }); }}
        className="h-9 px-4 text-[11px] text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:scale-105 transition-all duration-200 flex items-center gap-1.5 select-none active:scale-95"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Add step
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {nodes.map((node, i) => (
        <div key={node.id} className="flex flex-col items-center">
          {i > 0 && <Connector onAdd={() => openPicker({ afterIndex: i - 1, ctx })} />}
          <BuilderNodeCard node={node} selected={selectedId === node.id} onSelect={() => onSelect(node.id)} />
          {node.type === "branch" && (
            <BranchBlock node={node} openPicker={openPicker} onSelect={onSelect} selectedId={selectedId} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function BuilderContent() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { branding } = useBranding();

  const [workflow, setWorkflow]       = useState<Workflow | null>(null);
  const [name, setName]               = useState("");
  const [nodes, setNodes]             = useState<BuilderNode[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [saved, setSaved]             = useState(false);

  // Canvas pan state
  const [offset, setOffset]   = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panningRef = useRef(false);
  const panRef     = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  const isNew      = params.get("new") === "1";
  const hasTrigger = treeHasTrigger(nodes);

  // Global mouse handlers for smooth pan
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!panningRef.current) return;
      setOffset({ x: panRef.current.ox + e.clientX - panRef.current.mx, y: panRef.current.oy + e.clientY - panRef.current.my });
    }
    function onUp() {
      if (!panningRef.current) return;
      panningRef.current = false;
      setPanning(false);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []);

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-no-pan], button, input, select, textarea")) return;
    panRef.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
    panningRef.current = true;
    setPanning(true);
  }

  // Load workflow
  useEffect(() => {
    const id = params.get("id");
    if (id) {
      const wf = getWorkflows().find(w => w.id === id);
      if (wf) { setWorkflow(wf); setName(wf.name); setNodes(wf.nodes); }
    } else if (isNew) {
      const wf: Workflow = { id: Date.now().toString(), name: "Untitled Workflow", description: "", status: "paused", runs: 0, nodes: [] };
      setWorkflow(wf);
      setName("Untitled Workflow");
      setNodes([]);
      setPickerState({ afterIndex: -1, ctx: ROOT_CTX });
    }
  }, [params, isNew]);

  const selectedNode = selectedId ? treeFind(nodes, selectedId) : null;

  function addNode(type: NodeType) {
    if (!pickerState) return;
    const defaultConfig: Record<string, string> =
      type === "delay"                ? { amount: "5", unit: "minutes" } :
      type === "branch"               ? { else_action: "continue" } :
      type === "tag"                  ? { action: "add" } :
      type === "task"                 ? { due_amount: "1", due_unit: "days", priority: "medium" } :
      type === "webhook"              ? { method: "POST", auth_type: "none" } :
      type === "ig_story"             ? { story_type: "hook", posting_time: "morning" } :
      type === "ig_comment_dm"        ? { delay_minutes: "1", first_comment_only: "true" } :
      type === "vapi_call"            ? { max_duration: "10", record: "false" } :
      type === "calendar"             ? { offset_amount: "1", offset_unit: "days", duration: "30", send_invite: "true" } :
      type === "google_ads_audience"  ? { action: "add", match_field: "email" } :
      type === "meta_ads_audience"    ? { action: "add", match_field: "email" } : {};
    const newNode: BuilderNode = { id: Date.now().toString(), type, config: defaultConfig };
    setNodes(prev => treeAdd(prev, pickerState, newNode));
    setPickerState(null);
    setSelectedId(newNode.id);
  }

  function handleSave() {
    if (!workflow) return;
    saveWorkflow({ ...workflow, name: name.trim() || "Untitled Workflow", nodes });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete() {
    if (workflow) deleteWorkflow(workflow.id);
    router.push("/automation");
  }

  if (!workflow) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 flex flex-col">

      {/* Top bar */}
      <div className="flex-shrink-0 h-14 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3 px-5 shadow-sm z-10">
        <button onClick={() => router.push("/automation")} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-[13px] flex-shrink-0">
          <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Automations
        </button>
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
        <input value={name} onChange={e => setName(e.target.value)} className="flex-1 text-[15px] font-semibold text-zinc-900 dark:text-zinc-50 bg-transparent outline-none placeholder:text-zinc-400 min-w-0" placeholder="Workflow name" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-zinc-400 tabular-nums hidden sm:block">{nodes.length} step{nodes.length !== 1 ? "s" : ""}</span>
          <button onClick={() => setOffset({ x: 0, y: 0 })} title="Reset view" className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Maximize2 className="w-4 h-4" strokeWidth={1.75} />
          </button>
          {!isNew && (
            <button onClick={handleDelete} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
          <button onClick={handleSave} className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-[13px] font-medium text-white transition-all" style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
            {saved ? <><Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Saved</> : "Save"}
          </button>
        </div>
      </div>

      {/* Pannable canvas */}
      <div
        className={cn("flex-1 overflow-hidden relative", panning ? "cursor-grabbing" : "cursor-grab")}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.08) 1.2px, transparent 1.2px)",
            backgroundSize: "28px 28px",
            backgroundPosition: `${offset.x % 28}px ${offset.y % 28}px`,
          }}
        />

        {/* Floating content */}
        <div
          className="absolute"
          style={{ left: "50%", top: "60px", transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)` }}
        >
          {nodes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 pt-8 animate-canvas-in" data-no-pan="true">
              <p className="text-[13px] text-zinc-400 select-none">Start by adding your first step</p>
              <button
                onClick={() => setPickerState({ afterIndex: -1, ctx: ROOT_CTX })}
                className="animate-float flex items-center gap-2 px-5 h-10 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-[13px] text-zinc-500 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:scale-105 transition-all duration-200 active:scale-95"
              >
                <Plus className="w-4 h-4" strokeWidth={2} /> Add First Step
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center pb-32 animate-canvas-in">
              <NodeSequence
                nodes={nodes}
                ctx={ROOT_CTX}
                openPicker={setPickerState}
                onSelect={id => setSelectedId(selectedId === id ? null : id)}
                selectedId={selectedId}
              />
              {/* Add step at end of root */}
              <div data-no-pan="true">
                <Connector onAdd={() => setPickerState({ afterIndex: nodes.length - 1, ctx: ROOT_CTX })} />
              </div>
            </div>
          )}
        </div>

        {/* Pan hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-600 pointer-events-none select-none">
          <span>Drag to pan</span>
          <span>·</span>
          <span>Click a node to configure</span>
        </div>
      </div>

      {/* Node type picker */}
      {pickerState !== null && (
        <NodeTypePicker hasTrigger={hasTrigger} onSelect={addNode} onClose={() => setPickerState(null)} />
      )}

      {/* Config panel — key forces re-mount (and re-animation) when switching nodes */}
      {selectedNode && (
        <NodeConfigPanel
          key={selectedNode.id}
          node={selectedNode}
          onChange={config => setNodes(prev => treeUpdate(prev, selectedNode.id, config))}
          onDelete={() => { setNodes(prev => treeDelete(prev, selectedNode.id)); setSelectedId(null); }}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-[13px] text-zinc-400">Loading builder…</div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
