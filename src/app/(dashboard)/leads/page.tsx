"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, Upload, Search, SlidersHorizontal,
  UserPlus, MessageCircle, CheckCircle, XCircle,
  PhoneCall, Banknote, Trophy, CircleX, CalendarX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar, type FilterOption } from "@/components/layout/filter-bar";
import { LeadsTable, MOCK_LEADS, type Lead } from "@/components/leads/leads-table";
import { LeadDetailPanel } from "@/components/leads/lead-detail-panel";
import { ImportModal } from "@/components/leads/import-modal";
import { useImportedLeads } from "@/components/providers/LeadsProvider";
import { useAIMode } from "@/components/providers/AIModeProvider";
import { useBranding } from "@/components/providers/BrandingProvider";
import { cn } from "@/lib/utils";

const FILTERS: FilterOption[] = [
  { id: "all",       label: "All Leads",  count: 292 },
  { id: "new",       label: "New",        count: 84  },
  { id: "contacted", label: "Contacted",  count: 61  },
  { id: "qualified", label: "Qualified",  count: 47  },
  { id: "proposal",  label: "Proposal",   count: 38  },
  { id: "closed",    label: "Closed",     count: 52  },
  { id: "lost",      label: "Lost",       count: 10  },
];

const STATUS_FILTERS = [
  { id: "new",         label: "New lead",    Icon: UserPlus,      iconBg: "bg-orange-500"  },
  { id: "contacted",   label: "In contact",  Icon: MessageCircle, iconBg: "bg-emerald-500" },
  { id: "qualified",   label: "Qualified",   Icon: CheckCircle,   iconBg: "bg-blue-500"    },
  { id: "unqualified", label: "Unqualified", Icon: XCircle,       iconBg: "bg-red-500"     },
  { id: "call_booked", label: "Call booked", Icon: PhoneCall,     iconBg: "bg-violet-500"  },
  { id: "deposit",     label: "Deposit",     Icon: Banknote,      iconBg: "bg-amber-500"   },
  { id: "won",         label: "Won",         Icon: Trophy,        iconBg: "bg-emerald-600" },
  { id: "lost",        label: "Lost",        Icon: CircleX,       iconBg: "bg-zinc-400"    },
  { id: "no_show",     label: "No show",     Icon: CalendarX,     iconBg: "bg-orange-400"  },
];

function FiltersDropdown({
  selected,
  onChange,
}: {
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  }

  const count = selected.size;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition-all",
          count > 0
            ? "brand-btn border-transparent"
            : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200"
        )}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filters
        {count > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/25 dark:bg-zinc-900/25 text-[10px] font-bold leading-none ml-0.5">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-full mt-1.5 z-50 w-[210px] rounded-xl",
            "border border-zinc-200 dark:border-zinc-700",
            "bg-white dark:bg-zinc-900",
            "shadow-lg shadow-black/8 dark:shadow-black/40",
            "py-1.5 overflow-hidden"
          )}
        >
          {/* Header row */}
          <div className="flex items-center justify-between px-3.5 py-1.5 mb-0.5">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
              Filter by status
            </span>
            {count > 0 && (
              <button
                onClick={() => onChange(new Set())}
                className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {STATUS_FILTERS.map(({ id, label, Icon, iconBg }) => {
            const active = selected.has(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors text-left"
              >
                {/* Colored icon box */}
                <span className={cn("w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0", iconBg)}>
                  <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                </span>

                {/* Label */}
                <span className="flex-1 text-[13px] text-zinc-700 dark:text-zinc-300 font-normal">
                  {label}
                </span>

                {/* Checkbox */}
                <span
                  className={cn(
                    "w-4 h-4 rounded flex-shrink-0 border-[1.5px] transition-all flex items-center justify-center",
                    active
                      ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100"
                      : "border-zinc-300 dark:border-zinc-600 bg-transparent"
                  )}
                >
                  {active && (
                    <svg
                      className="w-2.5 h-2.5 text-white dark:text-zinc-900"
                      viewBox="0 0 10 10"
                      fill="none"
                    >
                      <path
                        d="M1.5 5l2.5 2.5 4.5-5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const { importedLeads } = useImportedLeads();
  const { enabled } = useAIMode();
  const { branding } = useBranding();
  const [activeFilter, setActiveFilter]       = useState("all");
  const [dropdownFilters, setDropdownFilters] = useState(new Set<string>());
  const [importOpen, setImportOpen]           = useState(false);
  const [importedCount, setImportedCount]     = useState(0);
  const [selectedLead, setSelectedLead]       = useState<Lead | null>(null);

  useEffect(() => {
    const name = new URLSearchParams(window.location.search).get('open')
    if (name) {
      const lead = MOCK_LEADS.find(l => l.name.toLowerCase() === name.toLowerCase()) ?? null
      if (lead) setSelectedLead(lead)
    }
  }, [])

  return (
    <div className="px-8 py-7 max-w-[1300px]">
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={count => setImportedCount(c => c + count)}
      />
      <LeadDetailPanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onTagsChange={(id, tags) =>
          setSelectedLead((prev) => prev && prev.id === id ? { ...prev, tags } : prev)
        }
      />

      <PageHeader
        title="Leads"
        count={292 + importedCount + importedLeads.length}
        description="Manage and track all incoming leads across every channel."
      >

        <Button variant="outline" size="sm" className="gap-1.5 text-zinc-500" onClick={() => setImportOpen(true)}>
          <Upload className="w-3.5 h-3.5" />
          Import
        </Button>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add Lead
        </Button>
      </PageHeader>

      {/* Jacsper Autopilot Banner */}
      {enabled && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl mb-4 text-white"
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse flex-shrink-0" />
            <p className="text-[12px] font-medium">Jacsper Autopilot is active</p>
            <span className="text-white/50">·</span>
            <p className="text-[12px] text-white/80">Monitoring {292 + importedCount + importedLeads.length} leads</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/80">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-300" />3 stale deals</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-300" />7 need follow-up</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white/60" />12 booked this week</span>
          </div>
        </div>
      )}

      {/* Search + Filter Row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <Input
            placeholder="Search leads..."
            className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 placeholder:text-zinc-400 focus-visible:ring-zinc-300 dark:text-zinc-200"
          />
        </div>
        <FiltersDropdown selected={dropdownFilters} onChange={setDropdownFilters} />
      </div>

      {/* Pill Filter Bar */}
      <FilterBar
        filters={FILTERS}
        defaultFilter="all"
        onFilterChange={setActiveFilter}
        className="mb-5"
      />

      {/* Data Table */}
      <LeadsTable
        filterStatus={activeFilter}
        filterStatuses={[...dropdownFilters]}
        onLeadClick={setSelectedLead}
        extraLeads={importedLeads}
      />
    </div>
  );
}
