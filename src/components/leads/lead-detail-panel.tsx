"use client";

import {
  X, Mail, Phone, MapPin, Building2, ExternalLink,
  Copy, Check, Send, PhoneCall, CalendarPlus, GitBranch,
  UserPlus, MessageCircle, CheckCircle, XCircle, CircleX,
  Banknote, Trophy, CalendarX, FileText, CircleCheck, Clock,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import type { Lead } from "./leads-table";
import { EmailComposeModal } from "./email-compose-modal";
import { ScheduleModal } from "./schedule-modal";

/* ─── Avatar ───────────────────────────────────────────────────────────── */
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360;
  return (
    <span
      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-[22px] font-semibold text-white flex-shrink-0"
      style={{ backgroundColor: `hsl(${hue} 55% 52%)` }}
    >
      {initials}
    </span>
  );
}

/* ─── Copy button ─────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
      title="Copy"
    >
      {copied
        ? <Check className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
        : <Copy className="w-3 h-3 text-zinc-400" strokeWidth={1.75} />}
    </button>
  );
}

/* ─── Status badge ────────────────────────────────────────────────────── */
type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal" | "Closed" | "Lost" |
  "Unqualified" | "Call Booked" | "Deposit" | "Won" | "No Show";

type IconFC = React.FC<{ className?: string; strokeWidth?: number }>;
const STATUS_CONFIG: Record<LeadStatus, { Icon: IconFC; iconBg: string; label: string }> = {
  New:           { Icon: UserPlus,      iconBg: "bg-orange-500",  label: "New lead"    },
  Contacted:     { Icon: MessageCircle, iconBg: "bg-emerald-500", label: "In contact"  },
  Qualified:     { Icon: CheckCircle,   iconBg: "bg-blue-500",    label: "Qualified"   },
  Proposal:      { Icon: FileText,      iconBg: "bg-orange-400",  label: "Proposal"    },
  Closed:        { Icon: CircleCheck,   iconBg: "bg-emerald-400", label: "Closed"      },
  Lost:          { Icon: CircleX,       iconBg: "bg-zinc-400",    label: "Lost"        },
  Unqualified:   { Icon: XCircle,       iconBg: "bg-red-500",     label: "Unqualified" },
  "Call Booked": { Icon: PhoneCall,     iconBg: "bg-violet-500",  label: "Call booked" },
  Deposit:       { Icon: Banknote,      iconBg: "bg-amber-500",   label: "Deposit"     },
  Won:           { Icon: Trophy,        iconBg: "bg-emerald-600", label: "Won"         },
  "No Show":     { Icon: CalendarX,     iconBg: "bg-orange-400",  label: "No show"     },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as LeadStatus];
  if (!cfg) return <span className="text-[12px] text-zinc-500">{status}</span>;
  const { Icon, iconBg, label } = cfg;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0", iconBg)}>
        <Icon className="w-3 h-3 text-white" strokeWidth={2} />
      </span>
      <span className="text-[13px] text-zinc-700 dark:text-zinc-300">{label}</span>
    </span>
  );
}

/* ─── Section label ───────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

/* ─── Divider ─────────────────────────────────────────────────────────── */
function Divider() {
  return <div className="border-t border-zinc-100 dark:border-zinc-800 my-4" />;
}

/* ─── Tag editor ───────────────────────────────────────────────────────── */
const PRESET_TAGS = [
  "Hot Lead", "New Lead", "Warm Lead", "Cold Lead",
  "Decision Maker", "High Value", "Enterprise", "SMB",
  "Qualified", "Unqualified", "Call Booked", "Follow-up",
  "Inbound", "Referral", "Re-engage", "Closed Won",
];

function TagEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput]     = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  const add = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput("");
  };

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag));

  const suggestions = PRESET_TAGS.filter(
    (p) => !tags.includes(p) && p.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Existing tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-full pl-2.5 pr-1.5 py-1 group"
            >
              {tag}
              <button
                onClick={() => remove(tag)}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
                title={`Remove "${tag}"`}
              >
                <X className="w-2.5 h-2.5" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors cursor-text",
          focused
            ? "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Plus className="w-3 h-3 text-zinc-400 flex-shrink-0" strokeWidth={2} />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setInput(""); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); }
            if (e.key === "Escape") { setInput(""); inputRef.current?.blur(); }
          }}
          placeholder="Add a tag…"
          className="flex-1 bg-transparent text-[12px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none min-w-0"
        />
      </div>

      {/* Suggestions */}
      {focused && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              onMouseDown={(e) => { e.preventDefault(); add(s); }}
              className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full px-2.5 py-1 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Panel ────────────────────────────────────────────────────────────── */
interface LeadDetailPanelProps {
  lead: Lead | null;
  onClose: () => void;
  onTagsChange?: (leadId: string, tags: string[]) => void;
}

export function LeadDetailPanel({ lead, onClose, onTagsChange }: LeadDetailPanelProps) {
  const [tags,           setTags]           = useState<string[]>(lead?.tags ?? []);
  const [composeEmail,   setComposeEmail]   = useState(false);
  const [showSchedule,   setShowSchedule]   = useState(false);

  useEffect(() => { setTags(lead?.tags ?? []); setComposeEmail(false); setShowSchedule(false); }, [lead]);

  const handleTagsChange = (next: string[]) => {
    setTags(next);
    if (lead) onTagsChange?.(lead.id, next);
  };

  if (!lead) return null;

  return (
    <>
      {composeEmail && (
        <EmailComposeModal
          to={lead.email}
          toName={lead.name}
          onClose={() => setComposeEmail(false)}
        />
      )}
      {showSchedule && (
        <ScheduleModal
          leadName={lead.name}
          leadEmail={lead.email}
          onClose={() => setShowSchedule(false)}
        />
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/15 dark:bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-[420px] flex flex-col",
          "bg-white dark:bg-zinc-950",
          "border-l border-zinc-200 dark:border-zinc-800",
          "shadow-2xl shadow-black/15 dark:shadow-black/50",
          "overflow-hidden",
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-start gap-4 px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <Avatar name={lead.name} />
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-50 leading-snug tracking-tight">
              {lead.name}
            </h2>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">{lead.title}</p>
            <p className="text-[12px] text-zinc-400 mt-0.5 flex items-center gap-1">
              <Building2 className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} />
              {lead.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* ── Quick Actions ── */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <ActionBtn icon={Send} label="Email" onClick={() => setComposeEmail(true)} />
          <ActionBtn icon={PhoneCall} label="Call" onClick={() => {}} />
          <ActionBtn icon={CalendarPlus} label="Schedule" onClick={() => setShowSchedule(true)} />
          <ActionBtn icon={GitBranch} label="Pipeline" onClick={() => {}} />
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Contact Info */}
          <SectionLabel>Contact</SectionLabel>
          <div className="flex flex-col gap-1.5">
            <ContactRow icon={Mail} value={lead.email} />
            <ContactRow icon={Phone} value={lead.phone} />
            <ContactRow
              icon={ExternalLink}
              value={lead.linkedin}
              isLink
              href={`https://${lead.linkedin}`}
            />
            <ContactRow icon={MapPin} value={lead.location} />
          </div>

          <Divider />

          {/* Lead stats — 2×2 grid */}
          <SectionLabel>Lead Details</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Status">
              <StatusBadge status={lead.status} />
            </StatCard>
            <StatCard label="Source">
              <span className="text-[12px] text-zinc-700 dark:text-zinc-300 font-medium">{lead.source}</span>
            </StatCard>
            <StatCard label="Deal Value">
              <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{lead.value}</span>
            </StatCard>
            <StatCard label="Last Activity">
              <span className="flex items-center gap-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                <Clock className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} />
                {lead.lastActivity}
              </span>
            </StatCard>
          </div>

          <Divider />

          {/* Company */}
          <SectionLabel>Company</SectionLabel>
          <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{lead.company}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" strokeWidth={1.75} />
                {lead.industry}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">·</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{lead.companySize}</span>
            </div>
          </div>

          <Divider />

          {/* About */}
          <SectionLabel>About</SectionLabel>
          <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{lead.about}</p>

          {/* Tags */}
          <Divider />
          <SectionLabel>Tags</SectionLabel>
          <TagEditor tags={tags} onChange={handleTagsChange} />

          <div className="h-4" />
        </div>
      </div>
    </>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────── */
function ActionBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-medium transition-all",
        "text-zinc-500 dark:text-zinc-400",
        "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800",
        "border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700",
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function ContactRow({
  icon: Icon,
  value,
  isLink,
  href,
}: {
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  value: string;
  isLink?: boolean;
  href?: string;
}) {
  return (
    <div className="group flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
      <Icon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
      {isLink && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 truncate flex-1"
        >
          {value}
        </a>
      ) : (
        <span className="text-[13px] text-zinc-600 dark:text-zinc-400 truncate flex-1">{value}</span>
      )}
      <CopyButton text={value} />
    </div>
  );
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2.5">
      <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mb-1.5">{label}</p>
      {children}
    </div>
  );
}
