"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAIMode } from "@/components/providers/AIModeProvider";
import { useBranding } from "@/components/providers/BrandingProvider";
import { cn } from "@/lib/utils";
import { Plus, DollarSign } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Card {
  id: string;
  name: string;
  company: string;
  value: string;
  time: string;
}

interface Stage {
  id: string;
  label: string;
  color: string;
  dotColor: string;
  cards: Card[];
}

// ─── Initial data ─────────────────────────────────────────────────────────────

const INITIAL_STAGES: Stage[] = [
  {
    id: "new", label: "New Lead", color: "bg-blue-500", dotColor: "#3b82f6",
    cards: [
      { id: "c1", name: "Sarah Mitchell",  company: "Apex Realty",     value: "$12,000", time: "2 hr ago"   },
      { id: "c2", name: "Marcus Webb",     company: "Webb & Assoc.",   value: "$3,400",  time: "Yesterday"  },
      { id: "c3", name: "Aisha Okonkwo",   company: "TechBridge",      value: "$7,200",  time: "4 days ago" },
    ],
  },
  {
    id: "contacted", label: "Contacted", color: "bg-amber-500", dotColor: "#f59e0b",
    cards: [
      { id: "c4", name: "Omar Al-Rashid",  company: "Desert Peak",     value: "$24,000", time: "3 hr ago"   },
      { id: "c5", name: "Isabella Torres", company: "Sun Coast Media", value: "$4,700",  time: "3 days ago" },
    ],
  },
  {
    id: "qualified", label: "Qualified", color: "bg-violet-500", dotColor: "#8b5cf6",
    cards: [
      { id: "c6", name: "Fatima Al-Amin",  company: "Global Trade",    value: "$18,500", time: "2 days ago" },
      { id: "c7", name: "Priya Nair",      company: "Summit LLC",      value: "$5,200",  time: "1 hr ago"   },
    ],
  },
  {
    id: "proposal", label: "Proposal", color: "bg-orange-500", dotColor: "#f97316",
    cards: [
      { id: "c8", name: "James Thornton",  company: "BlueSky Props.",  value: "$8,500",  time: "14 min ago" },
      { id: "c9", name: "Ryan Fitzgerald", company: "Vertex Capital",  value: "$31,000", time: "3 days ago" },
    ],
  },
  {
    id: "closed", label: "Closed Won", color: "bg-emerald-500", dotColor: "#10b981",
    cards: [
      { id: "c10", name: "Laura Chen",     company: "Horizon Digital", value: "$6,800",  time: "Yesterday"  },
      { id: "c11", name: "Tom Brennan",    company: "Pacific Ventures",value: "$11,400", time: "4 days ago" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stageTotal(cards: Card[]): string {
  const total = cards.reduce((sum, c) => {
    const n = parseFloat(c.value.replace(/[$,k]/g, "")) * (c.value.includes("k") ? 1000 : 1);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  if (total >= 1000) return `$${(total / 1000).toFixed(0)}k`;
  return `$${total}`;
}

function getAiNudge(time: string, value: string): { text: string; cls: string } | null {
  const raw = value.replace(/[$,k]/g, "");
  const num = parseFloat(raw) * (value.includes("k") ? 1000 : 1);
  if (time.includes("min"))  return { text: "Active now",           cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" };
  if (time.includes("hr"))   return num >= 20000
    ? { text: "Priority: high value", cls: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40" }
    : { text: "Follow up soon",       cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40" };
  if (time === "Yesterday")  return { text: "Needs attention",      cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40" };
  if (time.includes("days")) return { text: "Stale — re-engage",   cls: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40" };
  return null;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function avatarHue(name: string) {
  return (name.charCodeAt(0) * 37 + (name.charCodeAt(1) ?? 0) * 17) % 360;
}

// ─── Add card modal ───────────────────────────────────────────────────────────

function AddCardModal({ stageLabel, onAdd, onClose }: {
  stageLabel: string;
  onAdd: (card: Omit<Card, "id">) => void;
  onClose: () => void;
}) {
  const [name, setName]       = useState("");
  const [company, setCompany] = useState("");
  const [value, setValue]     = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), company: company.trim(), value: value.trim() || "$0", time: "Just now" });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xl p-6 w-80 flex flex-col gap-4"
      >
        <div>
          <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">Add to {stageLabel}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Fill in the deal details</p>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mb-1 block">Name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mb-1 block">Company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
              className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mb-1 block">Deal value</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. $5,000"
              className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex-1 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[12px] font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors">
            Add Deal
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const { enabled }  = useAIMode();
  const { branding } = useBranding();

  const [stages, setStages]           = useState<Stage[]>(INITIAL_STAGES);
  const [addingTo, setAddingTo]       = useState<string | null>(null);

  // drag state
  const dragging = useRef<{ cardId: string; fromStage: string } | null>(null);
  const [dragOver, setDragOver]       = useState<string | null>(null);
  const [draggingId, setDraggingId]   = useState<string | null>(null);

  function onDragStart(cardId: string, fromStage: string) {
    dragging.current = { cardId, fromStage };
    setDraggingId(cardId);
  }

  function onDragEnd() {
    dragging.current = null;
    setDraggingId(null);
    setDragOver(null);
  }

  function onDrop(toStageId: string) {
    if (!dragging.current) return;
    const { cardId, fromStage } = dragging.current;
    if (fromStage === toStageId) { onDragEnd(); return; }

    setStages((prev) => {
      const next = prev.map((s) => ({ ...s, cards: [...s.cards] }));
      const from = next.find((s) => s.id === fromStage)!;
      const to   = next.find((s) => s.id === toStageId)!;
      const idx  = from.cards.findIndex((c) => c.id === cardId);
      if (idx === -1) return prev;
      const [card] = from.cards.splice(idx, 1);
      to.cards.push(card);
      return next;
    });
    onDragEnd();
  }

  function addCard(stageId: string, card: Omit<Card, "id">) {
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId
          ? { ...s, cards: [...s.cards, { ...card, id: `c-${Date.now()}` }] }
          : s
      )
    );
  }

  const totalPipeline = stages.flatMap((s) => s.cards).reduce((sum, c) => {
    const n = parseFloat(c.value.replace(/[$,k]/g, "")) * (c.value.includes("k") ? 1000 : 1);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="px-8 py-7 h-full flex flex-col">
      {addingTo && (
        <AddCardModal
          stageLabel={stages.find((s) => s.id === addingTo)?.label ?? ""}
          onAdd={(card) => addCard(addingTo, card)}
          onClose={() => setAddingTo(null)}
        />
      )}

      <PageHeader
        title="Pipeline"
        description="Drag leads through your sales stages."
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
          <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
            ${(totalPipeline / 1000).toFixed(0)}k
          </span>
          <span className="text-[11px] text-zinc-400">total pipeline</span>
        </div>
      </PageHeader>

      {/* Jacsper banner */}
      {enabled && (
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl mb-4 text-[12px] font-medium text-white"
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse flex-shrink-0" />
          Jacsper is monitoring your pipeline — AI nudges shown on each deal
        </div>
      )}

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 flex-1 min-h-0">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-[256px] flex flex-col"
            onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
            }}
            onDrop={() => onDrop(stage.id)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stage.color}`} />
              <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">{stage.label}</span>
              <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full ml-0.5">
                {stage.cards.length}
              </span>
              <span className="ml-auto text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {stageTotal(stage.cards)}
              </span>
            </div>

            {/* Drop zone */}
            <div
              className={cn(
                "flex flex-col gap-2 flex-1 rounded-xl p-1.5 transition-colors min-h-[120px]",
                dragOver === stage.id && dragging.current?.fromStage !== stage.id
                  ? "bg-zinc-100 dark:bg-zinc-800/60 ring-1 ring-inset ring-zinc-300 dark:ring-zinc-600"
                  : "bg-transparent"
              )}
            >
              {stage.cards.map((card) => {
                const nudge = enabled ? getAiNudge(card.time, card.value) : null;
                const hue   = avatarHue(card.name);
                const isDragging = draggingId === card.id;

                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => onDragStart(card.id, stage.id)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      "bg-white dark:bg-zinc-900 rounded-xl border px-4 py-3 cursor-grab active:cursor-grabbing select-none transition-all",
                      isDragging
                        ? "opacity-40 border-zinc-300 dark:border-zinc-600 shadow-none scale-[0.98]"
                        : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-sm"
                    )}
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: `hsl(${hue} 55% 50%)` }}
                      >
                        {initials(card.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200 leading-snug truncate">{card.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{card.company}</p>
                      </div>
                    </div>

                    {/* Value + time */}
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{card.value}</span>
                      <span className="text-[10px] text-zinc-400">{card.time}</span>
                    </div>

                    {/* AI nudge */}
                    {nudge && (
                      <div className={cn("mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex", nudge.cls)}>
                        {nudge.text}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add button */}
              <button
                onClick={() => setAddingTo(stage.id)}
                className="w-full h-9 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-[12px] text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center justify-center gap-1 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
