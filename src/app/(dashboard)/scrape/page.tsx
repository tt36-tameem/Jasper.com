"use client";

import { useCallback, useRef, useState } from "react";
import {
  Search, MapPin, Building2, Briefcase, Users,
  Plus, Check, ExternalLink, ChevronDown, Loader2,
  Download, Globe, ShieldCheck, ShieldAlert, Zap,
  AlertCircle, Copy, CheckCheck, SlidersHorizontal,
  X, LayoutList, ScanSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { useImportedLeads } from "@/components/providers/LeadsProvider";
import { useUsage } from "@/components/providers/UsageProvider";
import type { Lead } from "@/components/leads/leads-table";

/* ─── Types ───────────────────────────────────────────────────────────── */
interface ScrapedLead {
  id: string;
  name: string;
  title: string;
  company: string;
  domain: string;
  industry: string;
  companySize: string;
  location: string;
  email: string;
  emailPermutations?: string[];
  phone: string;
  linkedin: string;
  source: string;
  confidence: "high" | "medium" | "low";
  domainVerified?: boolean;
  isLive?: boolean;
  added?: boolean;
  hue?: number;
}

/* ─── Convert ScrapedLead → CRM Lead ─────────────────────────────────── */
function toLead(s: ScrapedLead): Lead {
  return {
    id: s.id, name: s.name, title: s.title || "Unknown Role",
    company: s.company || "", industry: s.industry || "Unknown",
    companySize: s.companySize || "Unknown", location: s.location || "Unknown",
    email: s.email || "", phone: s.phone || "", linkedin: s.linkedin || "",
    source: s.source || "Web Scrape", status: "New", value: "$0",
    lastActivity: "Just now", about: "", tags: ["Scraped"],
  };
}


/* ─── Tiny helpers ────────────────────────────────────────────────────── */
function Avatar({ name, hue, live }: { name: string; hue?: number; live?: boolean }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const h = hue ?? (name.charCodeAt(0) * 37 + (name.charCodeAt(1) ?? 0) * 17) % 360;
  return (
    <div className="relative flex-shrink-0">
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-semibold text-white"
        style={{ backgroundColor: `hsl(${h} 55% 50%)` }}
      >
        {initials}
      </span>
      {live && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-900" />
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
    >
      {copied
        ? <CheckCheck className="w-3 h-3 text-emerald-500" strokeWidth={2} />
        : <Copy className="w-3 h-3" strokeWidth={1.75} />}
    </button>
  );
}

function ConfBadge({ level }: { level: "high" | "medium" | "low" }) {
  const cfg = {
    high:   { dot: "bg-emerald-500", label: "High",   text: "text-emerald-600 dark:text-emerald-400" },
    medium: { dot: "bg-amber-400",   label: "Medium", text: "text-amber-600 dark:text-amber-400"   },
    low:    { dot: "bg-zinc-400",    label: "Low",    text: "text-zinc-400"                        },
  }[level];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", cfg.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

/* ─── Email cell with permutations dropdown ───────────────────────────── */
function EmailCell({ lead }: { lead: ScrapedLead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative flex items-center gap-1.5 group min-w-0">
      {lead.domainVerified !== undefined && (
        lead.domainVerified
          ? <ShieldCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" strokeWidth={1.75} />
          : <ShieldAlert className="w-3 h-3 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
      )}
      <span className="text-[12px] text-zinc-600 dark:text-zinc-400 font-mono truncate max-w-[160px]">
        {lead.email || "—"}
      </span>
      {lead.email && <CopyButton text={lead.email} />}
      {lead.emailPermutations && lead.emailPermutations.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all flex-shrink-0"
          >
            +{lead.emailPermutations.length - 1}
            <ChevronDown className={cn("w-2.5 h-2.5 transition-transform", open && "rotate-180")} strokeWidth={2} />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1.5 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-2 min-w-[220px]">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium px-1.5 mb-1.5">Email variants</p>
              {lead.emailPermutations.map((p, i) => (
                <div key={i} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate flex-1">{p}</span>
                  {i === 0 && <span className="text-[9px] bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Primary</span>}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p).catch(() => {}); }}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex-shrink-0"
                  >
                    <Copy className="w-2.5 h-2.5" strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Table row ───────────────────────────────────────────────────────── */
function LeadRow({
  lead, selected, onSelect, onAdd,
}: {
  lead: ScrapedLead;
  selected: boolean;
  onSelect: (id: string) => void;
  onAdd: (id: string) => void;
}) {
  return (
    <tr
      className={cn(
        "group border-b border-zinc-100 dark:border-zinc-800 transition-colors",
        selected
          ? "bg-blue-50/40 dark:bg-blue-950/10"
          : "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30",
      )}
    >
      {/* Checkbox */}
      <td className="w-10 px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(lead.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
        />
      </td>

      {/* Name + Title */}
      <td className="px-3 py-3 min-w-[180px]">
        <div className="flex items-center gap-2.5">
          <Avatar name={lead.name} hue={lead.hue} live={lead.isLive} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 leading-snug truncate">{lead.name}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate leading-snug">{lead.title}</p>
          </div>
        </div>
      </td>

      {/* Company */}
      <td className="px-3 py-3 min-w-[140px]">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 truncate flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
            {lead.company}
          </p>
          {lead.industry !== "Unknown" && (
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">{lead.industry}</p>
          )}
        </div>
      </td>

      {/* Email */}
      <td className="px-3 py-3 min-w-[180px]">
        <EmailCell lead={lead} />
      </td>

      {/* Phone */}
      <td className="px-3 py-3 w-[100px]">
        <span className="text-[12px] text-zinc-400">—</span>
      </td>

      {/* Location */}
      <td className="px-3 py-3 min-w-[120px]">
        {lead.location !== "Unknown" ? (
          <span className="flex items-center gap-1 text-[12px] text-zinc-500 dark:text-zinc-400">
            <MapPin className="w-3 h-3 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
            <span className="truncate max-w-[100px]">{lead.location}</span>
          </span>
        ) : (
          <span className="text-[12px] text-zinc-400">—</span>
        )}
      </td>

      {/* LinkedIn */}
      <td className="px-3 py-3 w-[80px]">
        <a
          href={`https://${lead.linkedin}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors"
        >
          <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
          View
        </a>
      </td>

      {/* Confidence */}
      <td className="px-3 py-3 w-[80px]">
        <ConfBadge level={lead.confidence} />
      </td>

      {/* Add */}
      <td className="px-3 py-3 w-[100px]">
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(lead.id); }}
          disabled={lead.added}
          className={cn(
            "flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-medium transition-all",
            lead.added
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 cursor-default"
              : "brand-btn",
          )}
        >
          {lead.added
            ? <><Check className="w-3 h-3" strokeWidth={2.5} />Added</>
            : <><Plus className="w-3 h-3" strokeWidth={2} />Add</>}
        </button>
      </td>
    </tr>
  );
}

/* ─── Filter panel ────────────────────────────────────────────────────── */
function FilterPanel({
  domains, setDomains,
  title, setTitle,
  location, setLocation,
  industry, setIndustry,
  countPerDomain, setCountPerDomain,
  loading, isLive,
  onSubmit,
}: {
  domains: string; setDomains: (v: string) => void;
  title: string;   setTitle: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  industry: string; setIndustry: (v: string) => void;
  countPerDomain: string; setCountPerDomain: (v: string) => void;
  loading: boolean; isLive: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const domainCount = domains.split(/[\n,]+/).map(d => d.trim()).filter(d => d.length > 3 && d.includes(".")).length;

  return (
    <form
      onSubmit={onSubmit}
      className="w-64 flex-shrink-0 flex flex-col gap-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 h-fit sticky top-6"
    >
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
        <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Filters</span>
      </div>

      {/* Domains */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-3 h-3" strokeWidth={1.75} />
          Domains
          {domainCount > 0 && (
            <span className="ml-auto text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-full font-medium">
              {domainCount}
            </span>
          )}
        </label>
        <textarea
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          placeholder={"stripe.com\nnotion.so\nlinear.app"}
          rows={4}
          className={cn(
            "w-full rounded-lg text-[12px] px-3 py-2 outline-none transition-all resize-none font-mono",
            "border border-zinc-200 dark:border-zinc-700",
            "bg-zinc-50 dark:bg-zinc-950",
            "text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400",
            "focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200/50 dark:focus:ring-zinc-700/50",
          )}
        />
        <p className="text-[10px] text-zinc-400">One per line or comma-separated</p>
        {domainCount > 0 && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" strokeWidth={2} />
            Will scrape {domainCount} {domainCount === 1 ? "company" : "companies"}
          </p>
        )}
      </div>

      <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Job Title */}
      <FilterInput label="Job Title" placeholder="VP of Sales, CTO…" value={title} onChange={setTitle} icon={Briefcase} />

      {/* Location */}
      <FilterInput label="Location" placeholder="New York, London…" value={location} onChange={setLocation} icon={MapPin} />

      {/* Industry */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3 h-3" strokeWidth={1.75} />
          Industry
        </label>
        <div className="relative">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className={cn(
              "w-full h-8 pl-3 pr-7 rounded-lg appearance-none text-[12px] outline-none transition-all",
              "border border-zinc-200 dark:border-zinc-700",
              "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300",
              "focus:border-zinc-400 dark:focus:border-zinc-600",
            )}
          >
            <option value="any">Any industry</option>
            <option value="saas">SaaS / Software</option>
            <option value="fintech">Fintech</option>
            <option value="agency">Agency</option>
            <option value="consulting">Consulting</option>
            <option value="e-commerce">E-commerce</option>
            <option value="real estate">Real Estate</option>
            <option value="technology">Technology</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" strokeWidth={1.75} />
        </div>
      </div>

      {/* Per-company count */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3 h-3" strokeWidth={1.75} />
          Per company
        </label>
        <div className="relative">
          <select
            value={countPerDomain}
            onChange={(e) => setCountPerDomain(e.target.value)}
            className={cn(
              "w-full h-8 pl-3 pr-7 rounded-lg appearance-none text-[12px] outline-none transition-all",
              "border border-zinc-200 dark:border-zinc-700",
              "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300",
              "focus:border-zinc-400 dark:focus:border-zinc-600",
            )}
          >
            <option value="5">5 per company</option>
            <option value="10">10 per company</option>
            <option value="25">25 per company</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" strokeWidth={1.75} />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-center gap-2 h-9 rounded-xl text-[13px] font-medium transition-all",
          loading
            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            : "brand-btn",
        )}
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <ScanSearch className="w-4 h-4" strokeWidth={1.75} />
        }
        {loading ? "Scraping…" : "Scrape Leads"}
      </button>
    </form>
  );
}

function FilterInput({
  label, placeholder, value, onChange, icon: Icon,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
        <Icon className="w-3 h-3" strokeWidth={1.75} />
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-8 rounded-lg text-[12px] px-3 outline-none transition-all",
          "border border-zinc-200 dark:border-zinc-700",
          "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400",
          "focus:border-zinc-400 dark:focus:border-zinc-600",
        )}
      />
    </div>
  );
}

/* ─── Why scrape fails explainer ─────────────────────────────────────── */
function WhyScrapeFailsCard() {
  return (
    <div className="max-w-md w-full text-left rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-5 space-y-4">
      <div>
        <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Works best with</p>
        <ul className="space-y-1">
          {[
            "Agencies & consultancies with a /team page",
            "WordPress, Webflow, or Squarespace sites",
            "Small–mid size companies with a public about page",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2 text-[12px] text-zinc-500 dark:text-zinc-400">
              <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Won&apos;t work for</p>
        <ul className="space-y-1">
          {[
            "Large SaaS apps (Notion, Stripe, Linear) — JavaScript-only pages",
            "Companies with no public team page",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2 text-[12px] text-zinc-500 dark:text-zinc-400">
              <X className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Try these instead</p>
        <div className="flex flex-wrap gap-1.5">
          {["thoughtbot.com", "basecamp.com", "37signals.com", "draftbit.com", "balsamiq.com"].map((d) => (
            <code key={d} className="text-[11px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-md">
              {d}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
        <ScanSearch className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Scrape real contacts from any company</h2>
      <p className="text-[13px] text-zinc-400 max-w-xs mb-8">
        Paste one or more company domains on the left and hit <strong className="text-zinc-600 dark:text-zinc-300">Scrape Leads</strong> to pull real employees from their team pages.
      </p>

      <div className="grid grid-cols-3 gap-3 max-w-lg w-full text-left mb-8">
        {[
          { icon: Globe,       title: "Batch domains",   desc: "Scrape multiple companies at once, one per line" },
          { icon: Users,       title: "Real contacts",   desc: "Names, titles, and generated email permutations" },
          { icon: ShieldCheck, title: "MX verified",     desc: "Domain email verification on every result" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <Icon className="w-4 h-4 text-zinc-400 mb-2" strokeWidth={1.5} />
            <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{title}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="max-w-lg w-full text-left rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-5">
        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Good domains to start with</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {["thoughtbot.com", "basecamp.com", "37signals.com", "balsamiq.com", "draftbit.com", "semaphore.co"].map((d) => (
            <code key={d} className="text-[11px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-md">
              {d}
            </code>
          ))}
        </div>
        <p className="text-[11px] text-zinc-400">
          Works with agencies, consultancies, and companies with public team pages. Big SaaS apps (Notion, Stripe) use JavaScript-only rendering so can&apos;t be scraped without a headless browser.
        </p>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function ScrapePage() {
  const { addLead, addLeads } = useImportedLeads();
  const { meter } = useUsage();

  const [domains,        setDomains]        = useState("");
  const [title,          setTitle]          = useState("");
  const [location,       setLocation]       = useState("");
  const [industry,       setIndustry]       = useState("any");
  const [countPerDomain, setCountPerDomain] = useState("10");
  const [loading,  setLoading]  = useState(false);
  const [results,  setResults]  = useState<ScrapedLead[]>([]);
  const [searched, setSearched] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search,         setSearch]         = useState("");

  const parsedDomains = domains
    .split(/[\n,]+/)
    .map((d) => d.trim())
    .filter((d) => d.length > 3 && d.includes("."));

  const isLive = parsedDomains.length > 0;

  const notAddedCount  = results.filter((l) => !l.added).length;
  const selectedLeads  = results.filter((l) => selected.has(l.id));
  const notAddedSelected = selectedLeads.filter((l) => !l.added);

  const filtered = search.trim()
    ? results.filter((l) =>
        [l.name, l.title, l.company, l.email, l.location].some((f) =>
          f.toLowerCase().includes(search.toLowerCase())
        )
      )
    : results;

  const handleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  }, [selected.size, filtered]);

  const handleAdd = useCallback((id: string) => {
    setResults((prev) => {
      const lead = prev.find((l) => l.id === id);
      if (lead && !lead.added) addLead(toLead(lead));
      return prev.map((l) => (l.id === id ? { ...l, added: true } : l));
    });
  }, [addLead]);

  const handleAddSelected = useCallback(() => {
    const toAdd = notAddedSelected;
    if (toAdd.length > 0) addLeads(toAdd.map(toLead));
    setResults((prev) =>
      prev.map((l) => selected.has(l.id) ? { ...l, added: true } : l)
    );
  }, [notAddedSelected, addLeads, selected]);

  const handleAddAll = useCallback(() => {
    const toAdd = results.filter((l) => !l.added);
    if (toAdd.length > 0) addLeads(toAdd.map(toLead));
    setResults((prev) => prev.map((l) => ({ ...l, added: true })));
  }, [results, addLeads]);

  const handleExport = useCallback(() => {
    const rows = [
      ["Name", "Title", "Company", "Email", "LinkedIn", "Location", "Industry", "Confidence"],
      ...results.map((l) => [l.name, l.title, l.company, l.email, l.linkedin, l.location, l.industry, l.confidence]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "leads.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setError(null);
    setResults([]);
    setSelected(new Set());

    if (!isLive) {
      setError("Enter at least one company domain to scrape.");
      setLoading(false);
      return;
    }

    const gate = meter("scrapes", parsedDomains.length);
    if (!gate.allowed) {
      setError(`Scrape limit reached — ${gate.remaining} of ${gate.limit} domains left this month. Reduce the number of domains or upgrade.`);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domains:        parsedDomains,
          title:          title.trim() || undefined,
          location:       location.trim() || undefined,
          industry:       industry !== "any" ? industry : undefined,
          countPerDomain: parseInt(countPerDomain, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Unknown error");
      else setResults(data.leads ?? []);
    } catch {
      setError("Network error — check your connection and try again.");
    }
    setLoading(false);
  }

  return (
    <div className="px-8 py-7 max-w-[1500px]">
      <PageHeader
        title="Lead Scraper"
        description="Extract real contacts from company websites with public team or about pages."
      >
        {results.length > 0 && (
          <>
            {selected.size > 0 && notAddedSelected.length > 0 && (
              <button
                onClick={handleAddSelected}
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-medium brand-btn"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Add Selected ({notAddedSelected.length})
              </button>
            )}
            {notAddedCount > 0 && selected.size === 0 && (
              <button
                onClick={handleAddAll}
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-medium brand-btn"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Add All ({notAddedCount})
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              Export CSV
            </button>
          </>
        )}
      </PageHeader>

      <div className="flex gap-5 items-start">
        {/* ── Left filter panel ── */}
        <FilterPanel
          domains={domains} setDomains={setDomains}
          title={title}     setTitle={setTitle}
          location={location} setLocation={setLocation}
          industry={industry} setIndustry={setIndustry}
          countPerDomain={countPerDomain} setCountPerDomain={setCountPerDomain}
          loading={loading} isLive={isLive}
          onSubmit={handleSubmit}
        />

        {/* ── Right results area ── */}
        <div className="flex-1 min-w-0">
          {!searched ? (
            <EmptyState />
          ) : loading ? (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" strokeWidth={1.5} />
              </div>
              <h2 className="text-[15px] font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">
                {`Scraping ${parsedDomains.length} ${parsedDomains.length === 1 ? "company" : "companies"}…`}
              </h2>
              <p className="text-[13px] text-zinc-400 max-w-xs">
                Fetching team pages, finding contacts, and generating email permutations.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800/40 flex items-center justify-center mb-5">
                <AlertCircle className="w-6 h-6 text-red-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-[15px] font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">No contacts found</h2>
              <p className="text-[13px] text-zinc-400 max-w-sm mb-5">{error}</p>
              <WhyScrapeFailsCard />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <Search className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
              </div>
              <p className="text-[15px] font-medium text-zinc-800 dark:text-zinc-200 mb-1">No contacts found</p>
              <p className="text-[13px] text-zinc-400 max-w-sm mb-5">
                This site doesn&apos;t have a public team page, or its content loads via JavaScript.
              </p>
              <WhyScrapeFailsCard />
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
              {/* Table toolbar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Users className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
                  <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{results.length}</span>
                  <span className="text-[13px] text-zinc-400">leads</span>
                </div>
                {selected.size > 0 && (
                  <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
                    {selected.size} selected
                  </span>
                )}
                <div className="flex-1" />
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" strokeWidth={1.75} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter results…"
                    className="h-7 pl-7 pr-3 rounded-lg text-[12px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 w-48"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                      <X className="w-3 h-3" strokeWidth={2} />
                    </button>
                  )}
                </div>
                {/* Confidence legend */}
                <div className="flex items-center gap-2.5">
                  {([["bg-emerald-500","High"],["bg-amber-400","Med"],["bg-zinc-400","Low"]] as const).map(([dot, label]) => (
                    <span key={label} className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />{label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                      <th className="w-10 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={filtered.length > 0 && selected.size === filtered.length}
                          onChange={handleSelectAll}
                          className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-600 accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
                        />
                      </th>
                      {["Name", "Company", "Email", "Phone", "Location", "LinkedIn", "Match", ""].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead) => (
                      <LeadRow
                        key={lead.id}
                        lead={lead}
                        selected={selected.has(lead.id)}
                        onSelect={handleSelect}
                        onAdd={handleAdd}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && search && (
                <div className="py-10 text-center text-[13px] text-zinc-400">
                  No leads match &quot;{search}&quot;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
