"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAIMode } from "@/components/providers/AIModeProvider";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Brain, RefreshCw,
  Download, Copy, X, Check, Wand2, FolderOpen, Folder, Upload,
  MoreHorizontal, Search, Grid3x3, List, Clock, Star,
  ArrowLeft, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Type, BarChart2, Quote, Layers, Layout, Minus, ZoomIn,
  ChevronRight, ChevronLeft, Monitor, PenLine, StickyNote,
  Circle, Square, Triangle, Image, Palette, Sliders, Move,
  ChevronDown as Caret, Check as CheckIcon, Maximize2, RotateCcw,
  Strikethrough, Highlighter, Superscript, Subscript,
  ListOrdered, IndentDecrease, IndentIncrease, RemoveFormatting,
  ArrowRight, ArrowDown, ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BoardEditor, BoardEl, BoardBg } from "./board-editor";

/* ═══════════════════════════════ TYPES ══════════════════════════════════ */

type SlideType  = "title" | "content" | "stats" | "quote" | "twoCol" | "image" | "blank" | "board";
type Theme      = "brand" | "dark" | "light" | "slate" | "rose" | "ocean";
type View       = "library" | "editor";
type PresentationType = "sales" | "investor" | "product" | "report" | "campaign" | "team" | "proposal" | "board" | "blank";

interface StatItem   { label: string; value: string; delta?: string; up?: boolean }
interface BoardCard  { id: string; text: string; color: string; x: number; y: number }

interface Slide {
  id: string; type: SlideType; title: string; subtitle?: string;
  bullets?: string[]; quote?: string; author?: string;
  stats?: StatItem[]; leftTitle?: string; leftBody?: string;
  rightTitle?: string; rightBody?: string; bgOverride?: string;
  cards?: BoardCard[]; imageLabel?: string; imageUrl?: string;
  textAlign?: "left" | "center" | "right";
  titleSize?: "sm" | "md" | "lg";
  fontFamily?: FontKey;
  fontScale?: number;       // overall text size multiplier
  textColor?: string;       // custom text color override
  bold?: boolean; italic?: boolean; underline?: boolean;
  boardElements?: BoardEl[];
  boardBg?: BoardBg;
}

type FontKey = "sans" | "serif" | "mono" | "rounded" | "condensed";

interface Presentation {
  id: string; title: string; type: PresentationType; folderId: string | null;
  theme: Theme; slides: Slide[]; createdAt: string; updatedAt: string; starred: boolean;
}

interface Folder { id: string; name: string; color: string }

/* ═══════════════════════════════ CONSTANTS ══════════════════════════════ */

const TEMPLATE_TYPES: { id: PresentationType; label: string; desc: string; emoji: string; slides: Omit<Slide,"id">[] }[] = [
  { id: "sales", label: "Sales Pitch", desc: "Close deals with a compelling pitch deck", emoji: "🎯",
    slides: [
      { type: "title",   title: "Sales Pitch", subtitle: "Company Name · Q2 2026" },
      { type: "stats",   title: "Why Now", stats: [{ label: "Market Size", value: "$4.2B", delta: "+24% YoY" }, { label: "Our Share", value: "2.8%", delta: "+0.6%" }, { label: "Pipeline", value: "$284k", delta: "+18%" }, { label: "Win Rate", value: "38%", delta: "+5%" }] },
      { type: "content", title: "The Problem", bullets: ["Pain point one — describe the customer struggle", "Pain point two — quantify the impact", "Pain point three — why existing solutions fall short"] },
      { type: "twoCol",  title: "Our Solution", leftTitle: "What We Do", leftBody: "Describe your product or service here in clear terms.", rightTitle: "Why It Works", rightBody: "Evidence, testimonials, or key differentiators." },
      { type: "content", title: "Next Steps", bullets: ["Schedule a follow-up demo", "Send proposal by Friday", "30-day pilot agreement"] },
    ],
  },
  { id: "investor", label: "Investor Deck", desc: "Raise funding with a compelling narrative", emoji: "📈",
    slides: [
      { type: "title",   title: "Investor Update", subtitle: "Series A · May 2026" },
      { type: "stats",   title: "Traction", stats: [{ label: "ARR", value: "$1.2M", delta: "+84% YoY" }, { label: "Customers", value: "47", delta: "+12" }, { label: "NPS", value: "72", delta: "+8" }, { label: "Churn", value: "2.1%", delta: "-0.4%" }] },
      { type: "content", title: "The Opportunity", bullets: ["$8.4B total addressable market", "Only 12% of SMBs use AI-powered CRM today", "First-mover advantage in the real estate vertical"] },
      { type: "twoCol",  title: "The Ask", leftTitle: "Raising", leftBody: "$3.5M Series A\nLead investor: TBD\nClose date: Q3 2026", rightTitle: "Use of Funds", rightBody: "40% Product & Eng\n35% Sales & Marketing\n25% Operations" },
      { type: "quote",   title: "", quote: "The best investment is in the tools of one's own trade.", author: "— Benjamin Franklin" },
    ],
  },
  { id: "product", label: "Product Launch", desc: "Announce and excite about a new product", emoji: "🚀",
    slides: [
      { type: "title",   title: "Introducing Jacsper 2.0", subtitle: "The AI CRM that works for you" },
      { type: "content", title: "What's New", bullets: ["AI Dialer — auto-qualify leads before you pick up", "Smart Inbox — drafts replies in your voice", "Pipeline AI — predicts deal health in real-time", "Content Planner — schedules posts across all channels"] },
      { type: "stats",   title: "Early Results", stats: [{ label: "Time Saved/Day", value: "2.4h", delta: "+65%" }, { label: "Connect Rate", value: "64%", delta: "+18%" }, { label: "Revenue/Rep", value: "+$8k", delta: "per month" }, { label: "Beta Users", value: "120", delta: "across 14 teams" }] },
      { type: "twoCol",  title: "Pricing", leftTitle: "Pro — $99/mo", leftBody: "Up to 5 users\nAll AI features\nPriority support\n30-day free trial", rightTitle: "Enterprise", rightBody: "Unlimited users\nCustom AI training\nDedicated CSM\nCustom pricing" },
      { type: "quote",   title: "", quote: "We didn't just build a CRM. We built the first AI that actually works the pipeline for you.", author: "— Jacsper Team" },
    ],
  },
  { id: "report", label: "Performance Report", desc: "Share results and insights with your team", emoji: "📊",
    slides: [
      { type: "title",   title: "Monthly Performance Report", subtitle: "May 2026 · Sales & Marketing" },
      { type: "stats",   title: "Key Metrics", stats: [{ label: "Revenue Closed", value: "$31,200", delta: "+18%" }, { label: "Calls Connected", value: "64%", delta: "+4%" }, { label: "Email Open Rate", value: "38%", delta: "-2%" }, { label: "SMS Reply Rate", value: "71%", delta: "+9%" }] },
      { type: "content", title: "Highlights", bullets: ["Friday was peak activity — 105 calls, 71 emails, 62 SMS", "Ryan Fitzgerald deal ($31k) moved to proposal stage", "LinkedIn sequence delivered 1.2k impressions", "3 new SDRs onboarded and ramped"] },
      { type: "twoCol",  title: "Wins vs. Opportunities", leftTitle: "✅ What Worked", leftBody: "AI dialer connect rate up\nSMS sequences outperforming\nContent calendar on track", rightTitle: "🎯 Focus Areas", rightBody: "Email open rate needs work\n3 stale deals need follow-up\nDialer utilisation at 68%" },
      { type: "content", title: "June Goals", bullets: ["Hit $400k total pipeline value", "Increase email open rate to 42%+", "Launch 2 new automation workflows", "Onboard 3 additional enterprise leads"] },
    ],
  },
  { id: "campaign", label: "Campaign Brief", desc: "Plan and align on marketing campaigns", emoji: "📣",
    slides: [
      { type: "title",   title: "Q3 Campaign Brief", subtitle: "Real Estate CRM · Summer Push" },
      { type: "content", title: "Campaign Goals", bullets: ["Generate 150 new qualified leads", "Achieve 45%+ email open rate", "Drive 30% increase in demo bookings", "Build brand authority on LinkedIn"] },
      { type: "twoCol",  title: "Channels & Tactics", leftTitle: "Paid", leftBody: "Google Ads — $4k/mo\nMeta Retargeting — $2k/mo\nLinkedIn Sponsored — $3k/mo", rightTitle: "Organic", rightBody: "3x LinkedIn posts/week\nWeekly email newsletter\n2x Instagram reels/week" },
      { type: "stats",   title: "Budget Overview", stats: [{ label: "Total Budget", value: "$18k", delta: "Q3" }, { label: "Paid Ads", value: "$12k", delta: "67%" }, { label: "Content", value: "$4k", delta: "22%" }, { label: "Tools", value: "$2k", delta: "11%" }] },
      { type: "content", title: "Timeline", bullets: ["Week 1-2: Creative production & approvals", "Week 3: Campaign launch — all channels", "Week 5: Mid-campaign review & optimisation", "Week 8: Final report & Q4 planning"] },
    ],
  },
  { id: "team", label: "Team Update", desc: "Keep your team aligned and informed", emoji: "👥",
    slides: [
      { type: "title",   title: "Team Weekly Update", subtitle: "Week of May 27, 2026" },
      { type: "content", title: "This Week's Wins", bullets: ["12 meetings booked — best week this quarter", "Vapi dialer integration deployed to production", "May newsletter achieved 38% open rate", "SDR onboarding program completed ahead of schedule"] },
      { type: "stats",   title: "Team Scoreboard", stats: [{ label: "Calls Made", value: "411", delta: "+23%" }, { label: "Emails Sent", value: "856", delta: "+11%" }, { label: "Deals Moved", value: "18", delta: "+6" }, { label: "Revenue", value: "$31k", delta: "this week" }] },
      { type: "twoCol",  title: "Focus Next Week", leftTitle: "Priority Tasks", leftBody: "Follow up Ryan Fitzgerald deal\nLaunch LinkedIn sequence\nQ3 budget planning call\nRefresh email templates", rightTitle: "In Progress", rightBody: "CRM data audit (Ops)\nNew landing pages (Marketing)\nSales script update (Sales)" },
      { type: "quote",   title: "", quote: "Individually we are one drop. Together we are an ocean.", author: "— Team Jacsper" },
    ],
  },
  { id: "board", label: "Strategy Board", desc: "Visual brainstorm and planning — Miro-style", emoji: "🗂️",
    slides: [
      { type: "board", title: "Strategy Board",
        boardBg: "dots" as BoardBg,
        cards: [
          { id: "bc1", text: "🎯 Goal: $500k pipeline by Q3",  color: "#6366f1", x: 0, y: 0 },
          { id: "bc2", text: "📞 Improve connect rate to 70%", color: "#10b981", x: 1, y: 0 },
          { id: "bc3", text: "🤖 Deploy AI dialer v2",         color: "#f59e0b", x: 2, y: 0 },
          { id: "bc4", text: "👥 Hire 3 new SDRs",             color: "#ec4899", x: 0, y: 1 },
          { id: "bc5", text: "📧 Revamp email sequences",      color: "#3b82f6", x: 1, y: 1 },
          { id: "bc6", text: "📊 Weekly pipeline reviews",     color: "#8b5cf6", x: 2, y: 1 },
        ],
        boardElements: [
          { id: "c1", type: "sticky" as const, x: 400, y: 250, w: 200, h: 170, text: "🎯 Goal: $500k pipeline by Q3",   bg: "#ede9fe", color: "#4c1d95", fontSize: 14, bold: false, italic: false, align: "left" as const },
          { id: "c2", type: "sticky" as const, x: 660, y: 250, w: 200, h: 170, text: "📞 Improve connect rate to 70%",  bg: "#dcfce7", color: "#14532d", fontSize: 14, bold: false, italic: false, align: "left" as const },
          { id: "c3", type: "sticky" as const, x: 920, y: 250, w: 200, h: 170, text: "🤖 Deploy AI dialer v2",          bg: "#fef9c3", color: "#78350f", fontSize: 14, bold: false, italic: false, align: "left" as const },
          { id: "c4", type: "sticky" as const, x: 400, y: 480, w: 200, h: 170, text: "👥 Hire 3 new SDRs",              bg: "#fce7f3", color: "#701a75", fontSize: 14, bold: false, italic: false, align: "left" as const },
          { id: "c5", type: "sticky" as const, x: 660, y: 480, w: 200, h: 170, text: "📧 Revamp email sequences",       bg: "#dbeafe", color: "#1e3a5f", fontSize: 14, bold: false, italic: false, align: "left" as const },
          { id: "c6", type: "sticky" as const, x: 920, y: 480, w: 200, h: 170, text: "📊 Weekly pipeline reviews",      bg: "#ede9fe", color: "#4c1d95", fontSize: 14, bold: false, italic: false, align: "left" as const },
        ] as BoardEl[],
      },
    ],
  },
  { id: "blank", label: "Blank", desc: "Start from scratch with a clean slate", emoji: "⬜",
    slides: [{ type: "title", title: "Untitled Presentation", subtitle: "Click to edit" }],
  },
];

const THEMES: { id: Theme; label: string; bg: string; text: string; body: string; card: string; isBrand?: boolean }[] = [
  { id: "brand", label: "Brand",  bg: "",             text: "text-white", body: "text-white/75", card: "bg-white/15 border-white/20", isBrand: true },
  { id: "dark",  label: "Dark",   bg: "bg-zinc-950",  text: "text-white", body: "text-zinc-300", card: "bg-zinc-800/80 border-zinc-700" },
  { id: "light", label: "Light",  bg: "bg-white",     text: "text-zinc-900", body: "text-zinc-500", card: "bg-zinc-50 border-zinc-200" },
  { id: "slate", label: "Slate",  bg: "bg-gradient-to-br from-slate-800 to-slate-950", text: "text-white", body: "text-slate-300", card: "bg-slate-700/50 border-slate-600" },
  { id: "rose",  label: "Rose",   bg: "bg-gradient-to-br from-rose-600 to-pink-700",   text: "text-white", body: "text-white/75", card: "bg-white/15 border-white/20" },
  { id: "ocean", label: "Ocean",  bg: "bg-gradient-to-br from-cyan-700 to-blue-900",   text: "text-white", body: "text-white/75", card: "bg-white/15 border-white/20" },
];

const BOARD_COLORS = ["#6366f1","#10b981","#f59e0b","#ec4899","#3b82f6","#8b5cf6","#f97316","#14b8a6"];

// Per-slide background overrides (deep tones designed for white text).
const SLIDE_BG_COLORS = ["#0f172a","#1e1b4b","#082f49","#3b0764","#7c2d12","#064e3b","#831843","#0c4a6e","#ffffff","#f1f5f9"];
const SLIDE_BG_GRADIENTS = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #0ea5e9, #2563eb)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #f97316, #db2777)",
  "linear-gradient(135deg, #10b981, #0ea5e9)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(160deg, #0f172a, #4c1d95)",
  "linear-gradient(160deg, #042f2e, #0f766e)",
];

// Fonts (system stacks — no web-font loading needed).
const FONT_STACKS: Record<FontKey,string> = {
  sans:      "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif:     "ui-serif, Georgia, 'Times New Roman', serif",
  mono:      "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  rounded:   "'SF Pro Rounded', ui-rounded, 'Hiragino Maru Gothic ProN', system-ui, sans-serif",
  condensed: "'Arial Narrow', 'Helvetica Neue', 'Roboto Condensed', sans-serif",
};
const FONT_OPTIONS: { key: FontKey; label: string }[] = [
  { key:"sans", label:"Sans" }, { key:"serif", label:"Serif" }, { key:"mono", label:"Mono" },
  { key:"rounded", label:"Rounded" }, { key:"condensed", label:"Condensed" },
];

// Text color swatches.
const TEXT_COLORS = ["#ffffff","#0f172a","#64748b","#ef4444","#f97316","#f59e0b","#10b981","#06b6d4","#3b82f6","#8b5cf6","#ec4899","#a16207"];
const HIGHLIGHT_COLORS = ["#fef08a","#fde047","#bbf7d0","#86efac","#bae6fd","#93c5fd","#fbcfe8","#f9a8d4","#ddd6fe","#fdba74","#e2e8f0","#1e293b"];

// A curated theme per template so the picker previews look varied & aesthetic
// (and the created deck matches what was previewed).
const PREVIEW_THEME: Record<PresentationType, Theme> = {
  sales: "brand", investor: "dark", product: "brand", report: "ocean",
  campaign: "rose", team: "slate", board: "light", proposal: "slate", blank: "light",
};

const INIT_FOLDERS: Folder[] = [
  { id: "f1", name: "Sales Decks",   color: "#6366f1" },
  { id: "f2", name: "Reports",       color: "#10b981" },
  { id: "f3", name: "Marketing",     color: "#f59e0b" },
];

const INIT_PRESENTATIONS: Presentation[] = [
  { id: "p1", title: "Q2 Sales Review",       type: "report",   folderId: "f1", theme: "brand",  starred: true,  createdAt: "May 20", updatedAt: "May 26", slides: TEMPLATE_TYPES.find(t=>t.id==="report")!.slides.map((s,i)=>({...s,id:`p1s${i}`})) },
  { id: "p2", title: "Series A Pitch Deck",   type: "investor", folderId: "f1", theme: "dark",   starred: true,  createdAt: "May 15", updatedAt: "May 24", slides: TEMPLATE_TYPES.find(t=>t.id==="investor")!.slides.map((s,i)=>({...s,id:`p2s${i}`})) },
  { id: "p3", title: "Jacsper 2.0 Launch",    type: "product",  folderId: null, theme: "brand",  starred: false, createdAt: "May 22", updatedAt: "May 25", slides: TEMPLATE_TYPES.find(t=>t.id==="product")!.slides.map((s,i)=>({...s,id:`p3s${i}`})) },
  { id: "p4", title: "Q3 Campaign Brief",     type: "campaign", folderId: "f3", theme: "rose",   starred: false, createdAt: "May 18", updatedAt: "May 22", slides: TEMPLATE_TYPES.find(t=>t.id==="campaign")!.slides.map((s,i)=>({...s,id:`p4s${i}`})) },
  { id: "p5", title: "Team Week 22 Update",   type: "team",     folderId: null, theme: "slate",  starred: false, createdAt: "May 27", updatedAt: "May 27", slides: TEMPLATE_TYPES.find(t=>t.id==="team")!.slides.map((s,i)=>({...s,id:`p5s${i}`})) },
  { id: "p6", title: "Strategy Board Q3",     type: "board",    folderId: "f3", theme: "light",  starred: false, createdAt: "May 25", updatedAt: "May 25", slides: TEMPLATE_TYPES.find(t=>t.id==="board")!.slides.map((s,i)=>({...s,id:`p6s${i}`})) },
];

const TYPE_META: Record<PresentationType,{label:string;emoji:string;color:string}> = {
  sales:    { label: "Sales",    emoji: "🎯", color: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" },
  investor: { label: "Investor", emoji: "📈", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  product:  { label: "Product",  emoji: "🚀", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  report:   { label: "Report",   emoji: "📊", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  campaign: { label: "Campaign", emoji: "📣", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" },
  team:     { label: "Team",     emoji: "👥", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400" },
  proposal: { label: "Proposal", emoji: "📋", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400" },
  board:    { label: "Board",    emoji: "🗂️", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  blank:    { label: "Blank",    emoji: "⬜", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
};

function uid() { return Math.random().toString(36).slice(2,9); }

/* ═══════════════════════════════ SLIDE RENDERER ══════════════════════════ */

function getTheme(theme: Theme, branding: {primaryColor:string;accentColor:string}) {
  const t = THEMES.find(x=>x.id===theme)!;
  return { ...t, gradientStyle: t.isBrand
    ? { background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }
    : {} };
}

// Inline rich-text editor (contentEditable) — supports per-selection formatting
// via the toolbar's execCommand calls. Stores HTML. Uncontrolled while focused
// to avoid caret jumps.
function RichText({ html, onChange, placeholder, className, style, multiline }:{
  html:string; onChange:(html:string)=>void; placeholder?:string;
  className?:string; style?:React.CSSProperties; multiline?:boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    if (document.activeElement !== el && el.innerHTML !== (html||"")) el.innerHTML = html || "";
  });
  return (
    <div ref={ref} contentEditable suppressContentEditableWarning data-ph={placeholder} data-slide-edit
      onInput={()=>onChange(ref.current?.innerHTML ?? "")}
      onBlur={()=>onChange(ref.current?.innerHTML ?? "")}
      onKeyDown={multiline?undefined:(e)=>{ if(e.key==="Enter") e.preventDefault(); }}
      className={cn("whitespace-pre-wrap", className)} style={style} />
  );
}

function SlideCanvas({ slide, theme, branding, editable, onChange }:{
  slide: Slide; theme: Theme; branding:{primaryColor:string;accentColor:string};
  editable?: boolean; onChange?: (s:Slide)=>void;
}) {
  const t = getTheme(theme, branding);
  // Per-slide background override (uses white text for contrast).
  const hasBg = !!slide.bgOverride;
  const customColor = slide.textColor;
  // When a custom text color is set, drop the theme color class so text inherits it.
  const text   = customColor ? "" : (hasBg ? "text-white" : t.text);
  const body   = customColor ? "opacity-75" : (hasBg ? "text-white/75" : t.body);
  const card   = hasBg ? "bg-white/15 border-white/25" : t.card;
  const dotCls = hasBg ? "bg-white" : (t.isBrand ? "bg-white" : "bg-zinc-400");
  // Text alignment + title size controls.
  const align: React.CSSProperties = slide.textAlign ? { textAlign: slide.textAlign } : {};
  const titleMul = slide.titleSize === "sm" ? 0.8 : slide.titleSize === "lg" ? 1.3 : 1;
  const fontScale = slide.fontScale ?? 1;

  // The OUTER box is the query container. We use `inline-size` (not `size`):
  // `size` needs a definite height, which the padding-bottom thumbnail boxes
  // don't reliably provide, so cqw collapsed to 0 and text rendered invisible.
  // `inline-size` only needs a definite width (always true) → cqw = % of slide
  // width, so every font/gap below scales perfectly at any slide size.
  const outerStyle: React.CSSProperties = {
    width:"100%", height:"100%", overflow:"hidden", containerType:"inline-size",
    fontFamily: FONT_STACKS[slide.fontFamily ?? "sans"],
  };
  if (hasBg) outerStyle.background = slide.bgOverride;
  else if (t.isBrand) outerStyle.background = (t.gradientStyle as React.CSSProperties).background;
  if (customColor) outerStyle.color = customColor;
  if (slide.bold) outerStyle.fontWeight = 700;
  if (slide.italic) outerStyle.fontStyle = "italic";
  if (slide.underline) outerStyle.textDecoration = "underline";
  const outerCls = cn("w-full h-full overflow-hidden", !t.isBrand && !hasBg && t.bg);

  // sizes are in cqw (% of slide width), scaled by the slide's font size control
  const fs = (cqw:number): React.CSSProperties => ({ fontSize: `${cqw*fontScale}cqw` });

  // Wrap every slide's content in the query container so child cqw units resolve.
  const wrap = (inner: React.ReactNode) => <div className={outerCls} style={outerStyle}>{inner}</div>;

  function edt<K extends keyof Slide>(key: K, placeholder: string, cls: string, size: number, multi?: boolean) {
    const val = (slide[key] as string) ?? "";
    if (!editable) return <span className={cn(cls, "block")} style={{...fs(size), whiteSpace:"pre-wrap"}}
      dangerouslySetInnerHTML={{__html: val || `<span style="opacity:.3">${placeholder}</span>`}} />;
    return <RichText html={val} onChange={h=>onChange?.({...slide,[key]:h})} placeholder={placeholder} multiline={multi}
      className={cn("w-full", cls)} style={fs(size)} />;
  }

  /* TITLE */
  if (slide.type==="title") return wrap(
    <div className="w-full h-full flex flex-col items-center justify-center text-center" style={{padding:"9cqw",...align}}>
      <div className={cn("rounded-full opacity-50", dotCls)} style={{width:"9cqw",height:"0.6cqw",marginBottom:"4cqw"}} />
      {edt("title","Presentation Title",cn("font-bold leading-[1.1] tracking-tight",text),7*titleMul)}
      <div style={{height:"2.5cqw"}} />
      {edt("subtitle","Subtitle…",cn("opacity-70 font-medium",body),2.8)}
      <div className={cn("rounded-full opacity-50", dotCls)} style={{width:"5cqw",height:"0.6cqw",marginTop:"4cqw"}} />
    </div>
  );

  /* CONTENT */
  if (slide.type==="content") return wrap(
    <div className="w-full h-full flex flex-col" style={{padding:"7cqw 8cqw",...align}}>
      <div style={{marginBottom:"4cqw"}}>{edt("title","Slide Title",cn("font-bold tracking-tight block",text),5*titleMul)}</div>
      <div className="flex flex-col flex-1" style={{gap:"2.2cqw"}}>
        {(slide.bullets??[]).map((b,i)=>(
          <div key={i} className="flex items-start group/b" style={{gap:"2cqw"}}>
            <span className={cn("rounded-full flex-shrink-0 opacity-60", dotCls)} style={{width:"1.2cqw",height:"1.2cqw",marginTop:"1.3cqw"}} />
            {editable
              ? <RichText html={b} onChange={h=>{const n=[...(slide.bullets??[])];n[i]=h;onChange?.({...slide,bullets:n});}}
                  placeholder="Bullet point…" className={cn("flex-1",body)} style={fs(2.6)} />
              : <span className={cn("flex-1",body)} style={{...fs(2.6),lineHeight:1.4}} dangerouslySetInnerHTML={{__html:b}} />}
            {editable&&<button onClick={()=>onChange?.({...slide,bullets:(slide.bullets??[]).filter((_,j)=>j!==i)})} className="opacity-0 group-hover/b:opacity-60 hover:!opacity-100 transition-opacity flex-shrink-0"><X className={cn("w-3 h-3",body)} /></button>}
          </div>
        ))}
        {editable&&<button onClick={()=>onChange?.({...slide,bullets:[...(slide.bullets??[]),""]})
          } className={cn("flex items-center gap-1.5 opacity-30 hover:opacity-60 transition-opacity mt-1",body)} style={fs(2)}>
          <Plus className="w-3 h-3"/>Add bullet
        </button>}
      </div>
    </div>
  );

  /* STATS */
  if (slide.type==="stats") return wrap(
    <div className="w-full h-full flex flex-col" style={{padding:"7cqw 8cqw",...align}}>
      <div style={{marginBottom:"4cqw"}}>{edt("title","Section Title",cn("font-bold tracking-tight block",text),5*titleMul)}</div>
      <div className="grid grid-cols-2 flex-1" style={{gap:"2.5cqw"}}>
        {(slide.stats??[]).map((s,i)=>(
          <div key={i} className={cn("rounded-2xl border flex flex-col justify-center",card)} style={{padding:"3.5cqw",gap:"0.6cqw"}}>
            {editable
              ?<><RichText html={s.label} onChange={h=>{const n=[...(slide.stats??[])];n[i]={...n[i],label:h};onChange?.({...slide,stats:n});}} placeholder="Label" className={cn("opacity-70",body)} style={fs(2)}/>
                <RichText html={s.value} onChange={h=>{const n=[...(slide.stats??[])];n[i]={...n[i],value:h};onChange?.({...slide,stats:n});}} placeholder="Value" className={cn("font-bold tracking-tight",text)} style={fs(5)}/>
                <RichText html={s.delta??""} onChange={h=>{const n=[...(slide.stats??[])];n[i]={...n[i],delta:h};onChange?.({...slide,stats:n});}} placeholder="Delta" className="text-emerald-400 font-semibold" style={fs(2)}/></>
              :<><p className={cn("opacity-70 font-medium",body)} style={fs(2)} dangerouslySetInnerHTML={{__html:s.label}}/>
                <p className={cn("font-bold tracking-tight",text)} style={fs(5)} dangerouslySetInnerHTML={{__html:s.value}}/>
                {s.delta&&<p className="text-emerald-400 font-semibold" style={fs(2)} dangerouslySetInnerHTML={{__html:s.delta}}/>}</>}
          </div>
        ))}
      </div>
    </div>
  );

  /* QUOTE */
  if (slide.type==="quote") return wrap(
    <div className="w-full h-full flex flex-col items-center justify-center text-center" style={{padding:"9cqw 12cqw"}}>
      <div className={cn("font-serif opacity-20 leading-none",text)} style={{...fs(16),marginBottom:"1cqw"}}>&ldquo;</div>
      {edt("quote","Your quote here…",cn("font-medium leading-snug italic text-center",text),4)}
      <div style={{height:"3cqw"}} />
      {edt("author","— Author",cn("opacity-60 text-center font-medium",body),2.2)}
    </div>
  );

  /* TWO COLUMN */
  if (slide.type==="twoCol") return wrap(
    <div className="w-full h-full flex flex-col" style={{padding:"7cqw 8cqw",...align}}>
      <div style={{marginBottom:"4cqw"}}>{edt("title","Slide Title",cn("font-bold tracking-tight block",text),5*titleMul)}</div>
      <div className="grid grid-cols-2 flex-1" style={{gap:"2.5cqw"}}>
        {([["leftTitle","leftBody","Left Title","Left content…"],["rightTitle","rightBody","Right Title","Right content…"]] as const).map(([tk,bk,tp,bp])=>(
          <div key={tk} className={cn("rounded-2xl border flex flex-col",card)} style={{padding:"3.5cqw"}}>
            <div style={{marginBottom:"1.8cqw"}}>{edt(tk,tp,cn("font-semibold block",text),2.9)}</div>
            {edt(bk,bp,cn("leading-relaxed opacity-80",body),2.1,true)}
          </div>
        ))}
      </div>
    </div>
  );

  /* BOARD (Miro-style) */
  if (slide.type==="board") return wrap(
    <div className="w-full h-full flex flex-col" style={{padding:"5cqw"}}>
      {slide.title && <p className={cn("font-bold opacity-80",text)} style={{...fs(3.2),marginBottom:"3cqw"}}>{slide.title}</p>}
      <div className="grid grid-cols-3 flex-1" style={{gap:"2cqw"}}>
        {(slide.cards??[]).map((card)=>(
          <div key={card.id} className="rounded-xl flex items-start justify-between" style={{background:`${card.color}22`,border:`0.2cqw solid ${card.color}55`,padding:"2.5cqw"}}>
            {editable
              ?<textarea value={card.text} onChange={e=>onChange?.({...slide,cards:(slide.cards??[]).map(c=>c.id===card.id?{...c,text:e.target.value}:c)})}
                  className="bg-transparent border-none outline-none resize-none w-full text-zinc-800 dark:text-zinc-100 font-medium placeholder-opacity-30" style={{...fs(2),color:card.color}} rows={2}/>
              :<p style={{...fs(2),color:card.color,fontWeight:600,lineHeight:1.3}}>{card.text}</p>}
            {editable&&<button onClick={()=>onChange?.({...slide,cards:(slide.cards??[]).filter(c=>c.id!==card.id)})} className="opacity-30 hover:opacity-70 flex-shrink-0 ml-1 transition-opacity"><X className="w-3 h-3 text-zinc-500"/></button>}
          </div>
        ))}
        {editable&&<button onClick={()=>{const idx=(slide.cards??[]).length;onChange?.({...slide,cards:[...(slide.cards??[]),{id:uid(),text:"New card",color:BOARD_COLORS[idx%BOARD_COLORS.length],x:idx%3,y:Math.floor(idx/3)}]})}}
          className="rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors" style={{minHeight:"10cqw",fontSize:"2cqw"}}>
          <Plus className="w-3 h-3 mr-1"/>Add card
        </button>}
      </div>
    </div>
  );

  /* IMAGE */
  if (slide.type==="image") return wrap(
    <div className="relative w-full h-full overflow-hidden">
      {slide.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {(editable || slide.title) && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent" style={{padding:"5cqw"}}>
              {edt("title","Add a caption…",cn("font-medium text-white text-center block w-full"),2.8)}
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center opacity-40" style={{gap:"2cqw"}}>
          <Image style={{width:"10cqw",height:"10cqw"}} className={text} strokeWidth={1}/>
          {editable && <p className={cn("text-center",body)} style={fs(2)}>Upload a photo from the panel →</p>}
        </div>
      )}
    </div>
  );

  /* BLANK */
  if (slide.type==="blank") return wrap(
    <div className="w-full h-full flex items-center justify-center">
      {editable&&<p className={cn("opacity-20",body)} style={fs(2.2)}>Blank slide — add content from toolbar</p>}
    </div>
  );

  return null;
}

/* ═══════════════════════════════ THUMBNAIL ══════════════════════════════ */

function SlideThumbnail({ slide, theme, branding, index, active, onClick }:{
  slide:Slide;theme:Theme;branding:{primaryColor:string;accentColor:string};
  index:number;active:boolean;onClick:()=>void;
}) {
  return (
    <button onClick={onClick} className={cn("w-full rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
      active?"shadow-md":"border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
    )} style={active?{borderColor:branding.primaryColor}:{}}>
      <div className="relative w-full bg-zinc-200 dark:bg-zinc-800" style={{paddingBottom:"56.25%"}}>
        <div className="absolute inset-0 pointer-events-none">
          <SlideCanvas slide={slide} theme={theme} branding={branding}/>
        </div>
      </div>
      <div className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{index+1}</div>
    </button>
  );
}

/* ═══════════════════════════════ EDITOR ════════════════════════════════ */

function Editor({ pres, branding, aiEnabled, onBack, onSave }:{
  pres:Presentation; branding:{primaryColor:string;accentColor:string;systemPrompt?:string};
  aiEnabled:boolean; onBack:()=>void; onSave:(p:Presentation)=>void;
}) {
  const [p, setP]               = useState<Presentation>(pres);
  const [activeId, setActiveId] = useState(p.slides[0]?.id ?? "");
  const [addMenu, setAddMenu]   = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [aiOpen, setAiOpen]     = useState(false);
  const [aiTopic, setAiTopic]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [colorPos, setColorPos]   = useState({x:0,y:0});
  const [textColor, setTextColor] = useState(branding.primaryColor);
  const [hiOpen, setHiOpen]       = useState(false);
  const [hiPos, setHiPos]         = useState({x:0,y:0});
  const [hiColor, setHiColor]     = useState("#fde047");
  const [gradA, setGradA]         = useState("#6366f1");
  const [gradB, setGradB]         = useState("#8b5cf6");
  const [gradAngle, setGradAngle] = useState(135);
  const addRef    = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef  = useRef<HTMLInputElement>(null);
  const colorRef  = useRef<HTMLDivElement>(null);
  const hiRef     = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range|null>(null);

  const active = p.slides.find(s=>s.id===activeId) ?? p.slides[0];
  const activeIdx = p.slides.findIndex(s=>s.id===activeId);
  const t = getTheme(p.theme, branding);

  // Remember the text selection before a color picker steals focus, so the
  // color still applies to what the user had highlighted.
  function saveSelection(){ const s=window.getSelection(); if(s&&s.rangeCount) savedRange.current=s.getRangeAt(0).cloneRange(); }
  function restoreSelection(){
    const r=savedRange.current; if(!r) return;
    const host=(r.startContainer.nodeType===1?r.startContainer:r.startContainer.parentElement) as HTMLElement|null;
    host?.closest<HTMLElement>("[contenteditable]")?.focus();
    const sel=window.getSelection(); sel?.removeAllRanges(); sel?.addRange(r);
  }
  function applyTextColor(c:string){
    restoreSelection();
    document.execCommand("styleWithCSS",false,"true");
    document.execCommand("foreColor",false,c);
    setTextColor(c);
  }
  function applyHighlight(c:string|null){
    restoreSelection();
    document.execCommand("styleWithCSS",false,"true");
    document.execCommand("hiliteColor",false,c??"transparent");
    if(c) setHiColor(c);
  }
  // Rich-text command on the highlighted selection (kept alive via mousedown preventDefault).
  function exec(cmd:string){ document.execCommand("styleWithCSS",false,"true"); document.execCommand(cmd); }
  // Compose & apply a custom gradient as the active slide's background.
  function applyGradient(a=gradA, b=gradB, ang=gradAngle){
    setGradA(a); setGradB(b); setGradAngle(ang);
    updateSlide({...active, bgOverride:`linear-gradient(${ang}deg, ${a}, ${b})`});
  }

  useEffect(()=>{ function c(e:MouseEvent){if(addRef.current&&!addRef.current.contains(e.target as Node))setAddMenu(false);if(colorRef.current&&!colorRef.current.contains(e.target as Node))setColorOpen(false);if(hiRef.current&&!hiRef.current.contains(e.target as Node))setHiOpen(false);} document.addEventListener("mousedown",c); return()=>document.removeEventListener("mousedown",c); },[]);

  function update(updates:Partial<Presentation>){setP(prev=>({...prev,...updates,updatedAt:"Just now"}));}
  function updateSlide(s:Slide){update({slides:p.slides.map(x=>x.id===s.id?s:x)});}

  function addSlide(type:SlideType){
    const defaults:Record<SlideType,Partial<Slide>>={
      title:{title:"New Slide",subtitle:""},content:{title:"New Slide",bullets:["Point one","Point two"]},
      stats:{title:"Key Metrics",stats:[{label:"Metric 1",value:"0",delta:""},{label:"Metric 2",value:"0",delta:""},{label:"Metric 3",value:"0",delta:""},{label:"Metric 4",value:"0",delta:""}]},
      quote:{quote:"Your quote here",author:"— Author"},twoCol:{title:"New Slide",leftTitle:"Left",leftBody:"",rightTitle:"Right",rightBody:""},
      board:{title:"Board",boardElements:[] as BoardEl[],boardBg:"dots" as BoardBg},
      image:{title:"",imageLabel:"Image placeholder"},blank:{title:""},
    };
    const s:Slide={id:uid(),type,...defaults[type]} as Slide;
    const next=[...p.slides]; next.splice(activeIdx+1,0,s);
    update({slides:next}); setActiveId(s.id); setAddMenu(false);
  }

  function deleteSlide(id:string){if(p.slides.length<=1)return;const idx=p.slides.findIndex(s=>s.id===id);const next=p.slides.filter(s=>s.id!==id);update({slides:next});setActiveId(next[Math.min(idx,next.length-1)].id);}
  function duplicateSlide(id:string){const s=p.slides.find(x=>x.id===id);if(!s)return;const copy={...JSON.parse(JSON.stringify(s)),id:uid()};const idx=p.slides.findIndex(x=>x.id===id);const next=[...p.slides];next.splice(idx+1,0,copy);update({slides:next});setActiveId(copy.id);}
  function moveSlide(id:string,dir:-1|1){const idx=p.slides.findIndex(s=>s.id===id);const to=idx+dir;if(to<0||to>=p.slides.length)return;const next=[...p.slides];[next[idx],next[to]]=[next[to],next[idx]];update({slides:next});}
  function go(dir:-1|1){const i=p.slides.findIndex(s=>s.id===activeId);const ni=i+dir;if(ni>=0&&ni<p.slides.length)setActiveId(p.slides[ni].id);}

  // Keyboard navigation while presenting (arrows / Esc).
  useEffect(()=>{
    if(!presenting) return;
    function onKey(e:KeyboardEvent){
      if(e.key==="ArrowRight"||e.key===" "||e.key==="ArrowDown"){e.preventDefault();go(1);}
      else if(e.key==="ArrowLeft"||e.key==="ArrowUp"){e.preventDefault();go(-1);}
      else if(e.key==="Escape"){setPresenting(false);}
    }
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[presenting,activeId,p.slides]);

  function handleImgInput(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      const url=reader.result as string;
      const cur=p.slides.find(s=>s.id===activeId)??p.slides[0];
      if(cur?.type==="image"){
        updateSlide({...cur,imageUrl:url});
      } else {
        const s:Slide={id:uid(),type:"image",title:"",imageUrl:url};
        const next=[...p.slides]; next.splice(activeIdx+1,0,s);
        update({slides:next}); setActiveId(s.id);
      }
    };
    reader.readAsDataURL(file);
    e.target.value="";
  }
  // Upload an image as the active slide's background (with a dark scrim for text legibility).
  function handleBgUpload(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      const url=reader.result as string;
      updateSlide({...active, bgOverride:`linear-gradient(rgba(0,0,0,0.32), rgba(0,0,0,0.32)), url("${url}") center / cover no-repeat`});
    };
    reader.readAsDataURL(file);
    e.target.value="";
  }

  async function generateAI(){
    setAiLoading(true);
    try{
      const r=await fetch("/api/jacsper",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:`Create a 5-slide presentation about: "${aiTopic}". Return ONLY a JSON array. Each slide: {type,title,subtitle?,bullets?,quote?,author?,stats:[{label,value,delta}]?,leftTitle?,leftBody?,rightTitle?,rightBody?}. Types: title|content|stats|quote|twoCol. Plain JSON only.`, systemPrompt: branding.systemPrompt})});
      const d=await r.json(); const raw=(d.text??"").trim();
      const str=raw.startsWith("[")?raw:raw.slice(raw.indexOf("["),raw.lastIndexOf("]")+1);
      const parsed=JSON.parse(str);
      const slides=parsed.map((s:Partial<Slide>)=>({...s,id:uid()}));
      update({slides,title:aiTopic}); setActiveId(slides[0]?.id??"");
    }catch{}
    setAiLoading(false); setAiOpen(false); setAiTopic("");
  }

  const SLIDE_TYPES:[SlideType,React.ElementType,string][] = [
    ["title",Type,"Title"],["content",List,"Content"],["stats",BarChart2,"Stats"],
    ["quote",Quote,"Quote"],["twoCol",Layers,"Two Col"],["image",Image,"Photo"],
    ["board",StickyNote,"Board"],["blank",Square,"Blank"],
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 h-12">
        <button onClick={()=>{onSave(p);onBack();}} className="flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2}/>Back
        </button>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700"/>
        <input value={p.title} onChange={e=>update({title:e.target.value})}
          className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 bg-transparent border-none outline-none min-w-0 flex-1 max-w-xs"/>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700"/>
        {/* Hidden file input for photo uploads */}
        <input ref={imgInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImgInput}/>
        <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload}/>
        <div className="flex items-center gap-1">
          {SLIDE_TYPES.map(([type,Icon,label])=>(
            type==="image"
              ? <button key={type} title="Add Photo slide" onClick={()=>imgInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Icon className="w-3 h-3" strokeWidth={1.75}/>
                  <span className="hidden lg:block">{label}</span>
                </button>
              : <button key={type} title={`Add ${label} slide`} onClick={()=>addSlide(type)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Icon className="w-3 h-3" strokeWidth={1.75}/>
                  <span className="hidden lg:block">{label}</span>
                </button>
          ))}
        </div>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 ml-auto"/>
        <button onClick={()=>setPresenting(true)} title="Present (fullscreen)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <Monitor className="w-3.5 h-3.5" strokeWidth={2}/>Present
        </button>
        {aiEnabled&&<button onClick={()=>setAiOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
          style={{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`}}>
          <Wand2 className="w-3.5 h-3.5" strokeWidth={2}/>AI Generate
        </button>}
        <button onClick={()=>{onSave(p);}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <Check className="w-3.5 h-3.5" strokeWidth={2}/>Save
        </button>
      </div>

      {/* Formatting ribbon (PowerPoint-style) */}
      {active && active.type!=="board" && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 flex-shrink-0 overflow-x-auto">
          {/* Font family */}
          <select value={active.fontFamily??"sans"} onChange={e=>updateSlide({...active,fontFamily:e.target.value as FontKey})}
            title="Font" style={{fontFamily:FONT_STACKS[active.fontFamily??"sans"]}}
            className="h-7 px-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[12px] text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer flex-shrink-0">
            {FONT_OPTIONS.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}
          </select>

          {/* Font size stepper */}
          <div className="flex items-center h-7 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex-shrink-0">
            <button title="Smaller" onMouseDown={e=>e.preventDefault()} onClick={()=>updateSlide({...active,fontScale:Math.max(0.7,Math.round(((active.fontScale??1)-0.05)*100)/100)})} className="w-7 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"><Minus className="w-3 h-3"/></button>
            <span className="w-11 text-center text-[11px] tabular-nums text-zinc-600 dark:text-zinc-300">{Math.round((active.fontScale??1)*100)}%</span>
            <button title="Larger" onMouseDown={e=>e.preventDefault()} onClick={()=>updateSlide({...active,fontScale:Math.min(1.6,Math.round(((active.fontScale??1)+0.05)*100)/100)})} className="w-7 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"><Plus className="w-3 h-3"/></button>
          </div>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5 flex-shrink-0"/>

          {/* Bold / Italic / Underline / Strikethrough — applied to the highlighted text */}
          {([["bold",Bold,"Bold"],["italic",Italic,"Italic"],["underline",Underline,"Underline"],["strikeThrough",Strikethrough,"Strikethrough"]] as [string,React.ElementType,string][]).map(([cmd,Icon,lab])=>(
            <button key={cmd} title={lab}
              onMouseDown={e=>e.preventDefault()} onClick={()=>exec(cmd)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex-shrink-0">
              <Icon className="w-3.5 h-3.5"/>
            </button>
          ))}

          {/* Text color — applied to the highlighted text */}
          <div ref={colorRef} className="relative flex-shrink-0">
            <button title="Text color" onMouseDown={e=>e.preventDefault()}
              onClick={e=>{ if(!colorOpen){ saveSelection(); const r=e.currentTarget.getBoundingClientRect(); setColorPos({x:r.left,y:r.bottom+6}); } setColorOpen(v=>!v); }}
              className={cn("flex flex-col items-center justify-center w-7 h-7 rounded-md text-zinc-700 dark:text-zinc-200 transition-colors",
                colorOpen?"bg-zinc-100 dark:bg-zinc-800":"hover:bg-zinc-100 dark:hover:bg-zinc-800")}>
              <span className="text-[12px] font-bold leading-none">A</span>
              <span className="w-4 h-[3px] rounded-full mt-[1px]" style={{background:textColor}}/>
            </button>
            {colorOpen&&(
              <div style={{position:"fixed",left:colorPos.x,top:colorPos.y}}
                className="z-50 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl shadow-black/10 w-56">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Text color</p>

                {/* Current color + custom picker */}
                <div className="flex items-center gap-2 mb-3">
                  <label className="relative w-9 h-9 rounded-xl border border-black/10 dark:border-white/15 cursor-pointer overflow-hidden flex-shrink-0 shadow-inner"
                    style={{background:textColor}} title="Custom color">
                    <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(textColor)?textColor:"#000000"}
                      onChange={e=>applyTextColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"/>
                  </label>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">Custom</p>
                    <p className="text-[10px] text-zinc-400 font-mono uppercase truncate">{textColor}</p>
                  </div>
                </div>

                {/* Swatches */}
                <div className="grid grid-cols-6 gap-1.5">
                  {TEXT_COLORS.map(c=>{
                    const sel=c.toLowerCase()===textColor.toLowerCase();
                    return (
                      <button key={c} title={c} onMouseDown={e=>e.preventDefault()}
                        onClick={()=>{applyTextColor(c);setColorOpen(false);}}
                        className={cn("w-6 h-6 rounded-full transition-transform hover:scale-110",
                          sel?"ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-800 ring-[#8b3dff] scale-105":"border border-black/10 dark:border-white/15")}
                        style={{background:c}}/>
                    );
                  })}
                </div>

                <button onMouseDown={e=>e.preventDefault()}
                  onClick={()=>{applyTextColor(p.theme==="light"?"#18181b":"#ffffff");setColorOpen(false);}}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                  <RotateCcw className="w-3 h-3"/>Reset to default
                </button>
              </div>
            )}
          </div>

          {/* Highlight color — applied to the highlighted text */}
          <div ref={hiRef} className="relative flex-shrink-0">
            <button title="Highlight color" onMouseDown={e=>e.preventDefault()}
              onClick={e=>{ if(!hiOpen){ saveSelection(); const r=e.currentTarget.getBoundingClientRect(); setHiPos({x:r.left,y:r.bottom+6}); } setHiOpen(v=>!v); }}
              className={cn("flex flex-col items-center justify-center w-7 h-7 rounded-md text-zinc-700 dark:text-zinc-200 transition-colors",
                hiOpen?"bg-zinc-100 dark:bg-zinc-800":"hover:bg-zinc-100 dark:hover:bg-zinc-800")}>
              <Highlighter className="w-3.5 h-3.5"/>
              <span className="w-4 h-[3px] rounded-full mt-[1px]" style={{background:hiColor}}/>
            </button>
            {hiOpen&&(
              <div style={{position:"fixed",left:hiPos.x,top:hiPos.y}}
                className="z-50 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl shadow-black/10 w-56">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Highlight</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {HIGHLIGHT_COLORS.map(c=>{
                    const sel=c.toLowerCase()===hiColor.toLowerCase();
                    return (
                      <button key={c} title={c} onMouseDown={e=>e.preventDefault()}
                        onClick={()=>{applyHighlight(c);setHiOpen(false);}}
                        className={cn("w-6 h-6 rounded-md transition-transform hover:scale-110",
                          sel?"ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-800 ring-[#8b3dff] scale-105":"border border-black/10 dark:border-white/15")}
                        style={{background:c}}/>
                    );
                  })}
                </div>
                <button onMouseDown={e=>e.preventDefault()}
                  onClick={()=>{applyHighlight(null);setHiOpen(false);}}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                  <RotateCcw className="w-3 h-3"/>No highlight
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5 flex-shrink-0"/>

          {/* Lists & indent */}
          {([["insertUnorderedList",List,"Bulleted list"],["insertOrderedList",ListOrdered,"Numbered list"],["outdent",IndentDecrease,"Decrease indent"],["indent",IndentIncrease,"Increase indent"]] as [string,React.ElementType,string][]).map(([cmd,Icon,lab])=>(
            <button key={cmd} title={lab} onMouseDown={e=>e.preventDefault()} onClick={()=>exec(cmd)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex-shrink-0">
              <Icon className="w-3.5 h-3.5"/>
            </button>
          ))}

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5 flex-shrink-0"/>

          {/* Superscript / Subscript / Clear formatting */}
          {([["superscript",Superscript,"Superscript"],["subscript",Subscript,"Subscript"],["removeFormat",RemoveFormatting,"Clear formatting"]] as [string,React.ElementType,string][]).map(([cmd,Icon,lab])=>(
            <button key={cmd} title={lab} onMouseDown={e=>e.preventDefault()} onClick={()=>exec(cmd)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex-shrink-0">
              <Icon className="w-3.5 h-3.5"/>
            </button>
          ))}

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5 flex-shrink-0"/>

          {/* Alignment (whole slide) */}
          {([["left",AlignLeft],["center",AlignCenter],["right",AlignRight]] as [("left"|"center"|"right"),React.ElementType][]).map(([val,Icon])=>(
            <button key={val} title={`Align ${val}`} onMouseDown={e=>e.preventDefault()} onClick={()=>updateSlide({...active,textAlign:val})}
              className={cn("w-7 h-7 flex items-center justify-center rounded-md transition-all flex-shrink-0",
                (active.textAlign??"left")===val?"text-white":"text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800")}
              style={(active.textAlign??"left")===val?{background:branding.primaryColor}:{}}>
              <Icon className="w-3.5 h-3.5"/>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left: slide panel */}
        <div className="w-44 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            {p.slides.map((s,i)=>(
              <div key={s.id} className="relative group/th">
                <SlideThumbnail slide={s} theme={p.theme} branding={branding} index={i} active={s.id===activeId} onClick={()=>setActiveId(s.id)}/>
                <div className="absolute top-0.5 right-0.5 flex-col gap-0.5 hidden group-hover/th:flex">
                  {([[-1,ChevronUp,"Up"],[1,ChevronDown,"Down"]] as [number, React.ElementType, string][]).map(([d,Icon,l])=>(
                    <button key={l} onClick={()=>moveSlide(s.id,d as -1|1)} title={l} className="w-5 h-5 rounded bg-black/50 flex items-center justify-center text-white hover:bg-black/70"><Icon className="w-3 h-3" strokeWidth={2.5}/></button>
                  ))}
                  <button onClick={()=>duplicateSlide(s.id)} title="Duplicate" className="w-5 h-5 rounded bg-black/50 flex items-center justify-center text-white hover:bg-black/70"><Copy className="w-2.5 h-2.5" strokeWidth={2}/></button>
                  <button onClick={()=>deleteSlide(s.id)} disabled={p.slides.length<=1} title="Delete" className="w-5 h-5 rounded bg-black/50 flex items-center justify-center text-white hover:bg-red-500 disabled:opacity-20"><Trash2 className="w-2.5 h-2.5" strokeWidth={2}/></button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-zinc-100 dark:border-zinc-800" ref={addRef}>
            <button onClick={()=>setAddMenu(v=>!v)} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-[11px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors">
              <Plus className="w-3 h-3" strokeWidth={2.5}/>Add slide
            </button>
            {addMenu&&(
              <div className="absolute bottom-12 left-2 w-40 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden z-20">
                {SLIDE_TYPES.map(([type,Icon,label])=>(
                  <button key={type} onClick={()=>addSlide(type)} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75}/>{label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {active?.type === "board" ? (
          /* Board slide: full Miro-style editor with its own toolbar + right panel */
          <div className="flex-1 overflow-hidden">
            {active && (
              <BoardEditor
                elements={active.boardElements ?? []}
                bg={active.boardBg ?? "dots"}
                onChange={(els, bg) => updateSlide({ ...active, boardElements: els, boardBg: bg })}
                branding={branding}
              />
            )}
          </div>
        ) : (
          <>
            {/* Center: canvas */}
            <div className="flex-1 flex flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
              <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                <div className="w-full max-w-4xl">
                  <div className="relative w-full rounded-xl overflow-hidden shadow-2xl" style={{paddingBottom:"56.25%"}}>
                    <div className="absolute inset-0">
                      {active&&<SlideCanvas slide={active} theme={p.theme} branding={branding} editable onChange={updateSlide}/>}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <button onClick={()=>{const i=p.slides.findIndex(s=>s.id===activeId);if(i>0)setActiveId(p.slides[i-1].id);}} disabled={activeIdx===0} className="w-7 h-7 rounded-lg border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5"/></button>
                    <p className="text-[11px] text-zinc-400">{activeIdx+1} / {p.slides.length}</p>
                    <button onClick={()=>{const i=p.slides.findIndex(s=>s.id===activeId);if(i<p.slides.length-1)setActiveId(p.slides[i+1].id);}} disabled={activeIdx===p.slides.length-1} className="w-7 h-7 rounded-lg border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: properties */}
            <div className="w-64 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
              {active&&(()=>{
                const lbl = "text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2";
                const curAlign = active.textAlign ?? "left";
                const curSize  = active.titleSize ?? "md";
                return (
                  <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-5">

                    {/* Slide actions */}
                    <div>
                      <p className={lbl}>Slide {activeIdx+1} of {p.slides.length}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={()=>duplicateSlide(active.id)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11.5px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <Copy className="w-3.5 h-3.5"/>Duplicate
                        </button>
                        <button onClick={()=>deleteSlide(active.id)} disabled={p.slides.length<=1}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11.5px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                          <Trash2 className="w-3.5 h-3.5"/>Delete
                        </button>
                      </div>
                    </div>

                    {/* Layout */}
                    <div>
                      <p className={lbl}>Layout</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {SLIDE_TYPES.map(([type,Icon,label])=>(
                          <button key={type} title={label} onClick={()=>updateSlide({...active,type})}
                            className={cn("flex flex-col items-center gap-1 py-2 rounded-lg border text-[9px] font-medium transition-all",
                              active.type===type?"text-white border-transparent":"text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800")}
                            style={active.type===type?{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`}:{}}>
                            <Icon className="w-3.5 h-3.5" strokeWidth={1.75}/>{label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme */}
                    <div>
                      <p className={lbl}>Theme</p>
                      <div className="grid grid-cols-3 gap-2">
                        {THEMES.map(th=>(
                          <button key={th.id} onClick={()=>update({theme:th.id})}
                            className={cn("rounded-lg overflow-hidden border-2 transition-all",p.theme===th.id?"shadow-md":"border-transparent hover:border-zinc-300")}
                            style={p.theme===th.id?{borderColor:branding.primaryColor}:{}}>
                            <div className={cn("h-7 w-full",!th.isBrand&&th.bg)} style={th.isBrand?{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`}:{}}/>
                            <p className="text-[9px] text-zinc-500 py-0.5 text-center bg-zinc-50 dark:bg-zinc-800">{th.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Background (per slide) */}
                    {(()=>{
                      const bg = active.bgOverride;
                      const isImage = !!bg && bg.includes("url(");
                      const isGrad = !!bg && bg.includes("gradient") && !isImage;
                      const sel = (v:string)=> bg===v;
                      return (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <p className={cn(lbl,"mb-0")}>Background</p>
                        <button onClick={()=>updateSlide({...active,bgOverride:undefined})} title="Use theme default"
                          className={cn("flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md transition-colors",
                            !bg?"text-white":"text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                          style={!bg?{background:branding.primaryColor}:{}}>
                          <X className="w-2.5 h-2.5"/>Theme
                        </button>
                      </div>

                      {/* Solid colors */}
                      <div>
                        <p className="text-[9.5px] text-zinc-400 mb-1">Solid</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SLIDE_BG_COLORS.map(c=>(
                            <button key={c} onClick={()=>updateSlide({...active,bgOverride:c})}
                              className={cn("w-6 h-6 rounded-lg border-2 transition-transform hover:scale-105", sel(c)?"":"border-black/10 dark:border-white/15")}
                              style={{background:c, ...(sel(c)?{borderColor:branding.primaryColor, boxShadow:`0 0 0 2px ${branding.primaryColor}`}:{})}}/>
                          ))}
                          {/* Custom solid color */}
                          <label className="relative w-6 h-6 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 cursor-pointer overflow-hidden flex items-center justify-center" title="Custom color">
                            <Palette className="w-3 h-3 text-zinc-400"/>
                            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(bg||"")?bg!:"#0f172a"}
                              onChange={e=>updateSlide({...active,bgOverride:e.target.value})}
                              className="absolute inset-0 opacity-0 cursor-pointer"/>
                          </label>
                        </div>
                      </div>

                      {/* Gradient presets */}
                      <div>
                        <p className="text-[9.5px] text-zinc-400 mb-1">Gradient</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SLIDE_BG_GRADIENTS.map(g=>(
                            <button key={g} onClick={()=>updateSlide({...active,bgOverride:g})}
                              className={cn("w-6 h-6 rounded-lg border-2 transition-transform hover:scale-105", sel(g)?"":"border-black/10 dark:border-white/15")}
                              style={{background:g, ...(sel(g)?{borderColor:branding.primaryColor, boxShadow:`0 0 0 2px ${branding.primaryColor}`}:{})}}/>
                          ))}
                        </div>
                      </div>

                      {/* Image background */}
                      <div>
                        <p className="text-[9.5px] text-zinc-400 mb-1">Image</p>
                        {isImage ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-8 rounded-lg border border-black/10 dark:border-white/15 flex-shrink-0" style={{background:bg, backgroundSize:"cover", backgroundPosition:"center"}}/>
                            <button onClick={()=>bgInputRef.current?.click()}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                              <Upload className="w-3 h-3"/>Replace
                            </button>
                            <button onClick={()=>updateSlide({...active,bgOverride:undefined})} title="Remove image"
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900 transition-colors flex-shrink-0">
                              <Trash2 className="w-3 h-3"/>
                            </button>
                          </div>
                        ) : (
                          <button onClick={()=>bgInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-[11.5px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                            <Upload className="w-3.5 h-3.5" strokeWidth={2}/>Upload image
                          </button>
                        )}
                      </div>

                      {/* Custom gradient builder */}
                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-2 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9.5px] text-zinc-400">Custom gradient</p>
                          <div className="h-4 w-16 rounded-md border border-black/10 dark:border-white/15" style={{background:`linear-gradient(${gradAngle}deg, ${gradA}, ${gradB})`}}/>
                        </div>
                        <div className="flex items-center gap-2">
                          {([["From",gradA,(v:string)=>applyGradient(v,gradB,gradAngle)],["To",gradB,(v:string)=>applyGradient(gradA,v,gradAngle)]] as [string,string,(v:string)=>void][]).map(([lab,val,fn])=>(
                            <label key={lab} className="flex items-center gap-1.5 flex-1 cursor-pointer">
                              <span className="relative w-6 h-6 rounded-md border border-black/10 dark:border-white/15 overflow-hidden flex-shrink-0" style={{background:val}}>
                                <input type="color" value={val} onChange={e=>fn(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer"/>
                              </span>
                              <span className="text-[10px] text-zinc-500">{lab}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-zinc-400 mr-auto">Direction</span>
                          {([[90,ArrowRight],[135,ArrowDownRight],[180,ArrowDown]] as [number,React.ElementType][]).map(([ang,Icon])=>(
                            <button key={ang} onClick={()=>applyGradient(gradA,gradB,ang)}
                              className={cn("w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                                isGrad&&gradAngle===ang?"text-white":"text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                              style={isGrad&&gradAngle===ang?{background:branding.primaryColor}:{}}>
                              <Icon className="w-3 h-3"/>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                      );
                    })()}

                    {/* Text controls */}
                    <div>
                      <p className={lbl}>Text alignment</p>
                      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-1">
                        {([["left",AlignLeft],["center",AlignCenter],["right",AlignRight]] as [("left"|"center"|"right"),React.ElementType][]).map(([val,Icon])=>(
                          <button key={val} onClick={()=>updateSlide({...active,textAlign:val})}
                            className={cn("flex-1 h-7 flex items-center justify-center rounded-md transition-all",
                              curAlign===val?"bg-white dark:bg-zinc-700 shadow-sm text-zinc-800 dark:text-zinc-100":"text-zinc-400 hover:text-zinc-600")}>
                            <Icon className="w-3.5 h-3.5"/>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className={lbl}>Title size</p>
                      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-1">
                        {(["sm","md","lg"] as const).map(sz=>(
                          <button key={sz} onClick={()=>updateSlide({...active,titleSize:sz})}
                            className={cn("flex-1 h-7 flex items-center justify-center rounded-md text-[11px] font-semibold uppercase transition-all",
                              curSize===sz?"bg-white dark:bg-zinc-700 shadow-sm text-zinc-800 dark:text-zinc-100":"text-zinc-400 hover:text-zinc-600")}>
                            {sz==="sm"?"S":sz==="md"?"M":"L"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Per-type content controls */}
                    {active.type==="content"&&(
                      <div>
                        <p className={lbl}>Bullets</p>
                        <button onClick={()=>updateSlide({...active,bullets:[...(active.bullets??[]),"New point"]})}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-[11.5px] text-zinc-500 hover:border-zinc-400 transition-colors">
                          <Plus className="w-3 h-3" strokeWidth={2.5}/>Add bullet
                        </button>
                      </div>
                    )}
                    {active.type==="stats"&&(
                      <div>
                        <p className={lbl}>Stats</p>
                        <button onClick={()=>updateSlide({...active,stats:[...(active.stats??[]),{label:"New Metric",value:"0",delta:""}]})}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-[11.5px] text-zinc-500 hover:border-zinc-400 transition-colors">
                          <Plus className="w-3 h-3" strokeWidth={2.5}/>Add metric
                        </button>
                      </div>
                    )}
                    {active.type==="image"&&(
                      <div>
                        <p className={lbl}>Photo</p>
                        <button onClick={()=>imgInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-[11.5px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                          <Upload className="w-3.5 h-3.5" strokeWidth={2}/>
                          {active.imageUrl?"Replace photo":"Upload photo"}
                        </button>
                        {active.imageUrl&&(
                          <button onClick={()=>updateSlide({...active,imageUrl:undefined})}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1.5 rounded-lg text-[11px] text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                            <X className="w-3 h-3" strokeWidth={2}/>Remove photo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* Present (fullscreen) mode */}
      {presenting&&active&&(
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none">
          <div className="relative rounded-lg overflow-hidden shadow-2xl" style={{width:"min(100vw, 177.78vh)", aspectRatio:"16 / 9"}}>
            <SlideCanvas slide={active} theme={p.theme} branding={branding}/>
          </div>
          {/* Prev / Next */}
          <button onClick={()=>go(-1)} disabled={activeIdx===0}
            className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-0">
            <ChevronLeft className="w-5 h-5"/>
          </button>
          <button onClick={()=>go(1)} disabled={activeIdx===p.slides.length-1}
            className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-0">
            <ChevronRight className="w-5 h-5"/>
          </button>
          {/* Top bar */}
          <div className="absolute top-5 right-5 flex items-center gap-3">
            <span className="text-white/50 text-[12px] tabular-nums">{activeIdx+1} / {p.slides.length}</span>
            <button onClick={()=>setPresenting(false)} title="Exit (Esc)"
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium transition-colors">
              <X className="w-3.5 h-3.5"/>Exit
            </button>
          </div>
          {/* Progress dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {p.slides.map((s,i)=>(
              <button key={s.id} onClick={()=>setActiveId(s.id)}
                className={cn("h-1.5 rounded-full transition-all", i===activeIdx?"w-6 bg-white":"w-1.5 bg-white/30 hover:bg-white/60")}/>
            ))}
          </div>
        </div>
      )}

      {/* AI Modal */}
      {aiOpen&&(
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={()=>setAiOpen(false)}/>
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`}}>
                  <Brain className="w-3.5 h-3.5 text-white" strokeWidth={1.75}/>
                </div>
                <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">Generate with Jacsper</p>
              </div>
              <button onClick={()=>setAiOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-3.5 h-3.5" strokeWidth={2.5}/></button>
            </div>
            <div className="px-5 py-4">
              <p className="text-[12px] text-zinc-500 mb-3">Describe what this presentation is about — Jacsper will build a full 5-slide deck instantly.</p>
              <input value={aiTopic} onChange={e=>setAiTopic(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&aiTopic.trim())generateAI();}}
                placeholder="e.g. Q3 sales strategy, investor update, product launch…"
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[13px] focus:outline-none focus:border-zinc-400 transition-colors"/>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={()=>setAiOpen(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[13px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 transition-colors">Cancel</button>
              <button onClick={generateAI} disabled={!aiTopic.trim()||aiLoading}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`}}>
                {aiLoading?<><RefreshCw className="w-3.5 h-3.5 animate-spin"/>Generating…</>:<><Wand2 className="w-3.5 h-3.5"/>Generate</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════ LIBRARY ════════════════════════════════ */

function PresentationCard({ pres, branding, folders, layout = "grid", onClick, onDelete, onToggleStar, onRename, onMove }:{
  pres:Presentation; branding:{primaryColor:string;accentColor:string}; folders:Folder[]; layout?:"grid"|"list";
  onClick:()=>void; onDelete:()=>void; onToggleStar:()=>void; onRename:(t:string)=>void; onMove:(folderId:string|null)=>void;
}) {
  const [menu, setMenu]           = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [editing, setEditing]     = useState(false);
  const [title, setTitle]         = useState(pres.title);
  const meta                      = TYPE_META[pres.type];
  const firstSlide                = pres.slides[0];
  const menuRef                   = useRef<HTMLDivElement>(null);
  const currentFolder             = folders.find(f=>f.id===pres.folderId);
  const slideCount                = pres.slides.length;

  useEffect(()=>{
    function c(e:MouseEvent){if(menuRef.current&&!menuRef.current.contains(e.target as Node)){setMenu(false);setFolderOpen(false);}}
    document.addEventListener("mousedown",c); return()=>document.removeEventListener("mousedown",c);
  },[]);

  const thumbInner = (
    <>
      <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 pointer-events-none">
        {firstSlide && <SlideCanvas slide={firstSlide} theme={pres.theme} branding={branding}/>}
      </div>
      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-[inherit]" />
    </>
  );

  const typeChip = <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium",meta.color)}>{meta.emoji} {meta.label}</span>;
  const folderChip = currentFolder && (
    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
      <Folder className="w-2.5 h-2.5 flex-shrink-0" style={{color:currentFolder.color}}/>{currentFolder.name}
    </span>
  );

  const kebab = (
    <div className="relative flex-shrink-0" ref={menuRef}>
      <button onClick={e=>{e.stopPropagation();setMenu(v=>!v);}} className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all", !menu && "opacity-0 group-hover:opacity-100")}>
        <MoreHorizontal className="w-4 h-4" strokeWidth={2}/>
      </button>
      {menu&&(
        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl shadow-black/10 z-30 overflow-hidden py-1">
          <button onClick={e=>{e.stopPropagation();setEditing(true);setMenu(false);}} className="w-full text-left px-3 py-2 text-[12px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"><PenLine className="w-3 h-3 text-zinc-400"/>Rename</button>
          <button onClick={e=>{e.stopPropagation();setFolderOpen(v=>!v);}} className="w-full text-left px-3 py-2 text-[12px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between">
            <span className="flex items-center gap-2"><Folder className="w-3 h-3 text-zinc-400"/>Move to folder</span>
            <Caret className={cn("w-3 h-3 text-zinc-400 transition-transform", folderOpen && "rotate-180")}/>
          </button>
          {folderOpen&&(
            <div className="border-y border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 my-1">
              {pres.folderId&&(
                <button onClick={e=>{e.stopPropagation();onMove(null);setMenu(false);setFolderOpen(false);}} className="w-full text-left px-4 py-2 text-[11px] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
                  <X className="w-3 h-3 flex-shrink-0"/>Remove from folder
                </button>
              )}
              {folders.map(f=>(
                <button key={f.id} onClick={e=>{e.stopPropagation();onMove(f.id);setMenu(false);setFolderOpen(false);}}
                  className="w-full text-left px-4 py-2 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
                  <Folder className="w-3 h-3 flex-shrink-0" style={{color:f.color}}/>
                  <span className="truncate flex-1">{f.name}</span>
                  {pres.folderId===f.id&&<Check className="w-3 h-3 text-emerald-500 flex-shrink-0"/>}
                </button>
              ))}
              {folders.length===0&&<p className="px-4 py-2 text-[11px] text-zinc-400 italic">No folders yet</p>}
            </div>
          )}
          <button onClick={e=>{e.stopPropagation();onToggleStar();setMenu(false);}} className="w-full text-left px-3 py-2 text-[12px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2">
            <Star className={cn("w-3 h-3", pres.starred?"fill-amber-400 text-amber-400":"text-zinc-400")}/>{pres.starred?"Unstar":"Star"}
          </button>
          <button onClick={e=>{e.stopPropagation();onDelete();setMenu(false);}} className="w-full text-left px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2"><Trash2 className="w-3 h-3"/>Delete</button>
        </div>
      )}
    </div>
  );

  /* ── LIST ROW ── */
  if (layout === "list") {
    return (
      <div onClick={onClick}
        className="group relative flex items-center gap-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/70 dark:border-zinc-800 p-2.5 pr-3 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all cursor-pointer">
        <div className="relative flex-shrink-0 rounded-lg overflow-hidden shadow-sm" style={{width:"7rem",height:"3.94rem"}}>
          {thumbInner}
          {pres.starred && <Star className="absolute top-1 left-1 w-3 h-3 fill-amber-400 text-amber-400 drop-shadow" strokeWidth={2}/>}
        </div>
        <div className="flex-1 min-w-0">
          {editing
            ?<input value={title} onClick={e=>e.stopPropagation()} onChange={e=>setTitle(e.target.value)} onBlur={()=>{onRename(title);setEditing(false);}} onKeyDown={e=>{if(e.key==="Enter"){onRename(title);setEditing(false);}}}
                autoFocus className="text-[13.5px] font-semibold bg-transparent border-b border-zinc-300 outline-none text-zinc-800 dark:text-zinc-200 w-full max-w-xs"/>
            :<p className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 truncate" onClick={e=>e.stopPropagation()} onDoubleClick={()=>setEditing(true)}>{pres.title}</p>}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {typeChip}{folderChip}
            <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Layers className="w-2.5 h-2.5"/>{slideCount} slides</span>
          </div>
        </div>
        <span className="text-[11px] text-zinc-400 flex items-center gap-1 flex-shrink-0 mr-1"><Clock className="w-3 h-3"/>{pres.updatedAt}</span>
        <button onClick={e=>{e.stopPropagation();onToggleStar();}} className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0", pres.starred?"text-amber-400":"text-zinc-300 hover:text-zinc-500 opacity-0 group-hover:opacity-100")}>
          <Star className={cn("w-3.5 h-3.5",pres.starred&&"fill-amber-400")} strokeWidth={2}/>
        </button>
        {kebab}
      </div>
    );
  }

  /* ── GRID CARD ── */
  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 overflow-hidden transition-all duration-200 hover:-translate-y-1 cursor-pointer">
      {/* brand glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity z-10"
        style={{boxShadow:`0 0 0 1.5px ${branding.primaryColor}66, 0 20px 40px -14px ${branding.primaryColor}55`}}/>

      {/* Thumbnail */}
      <div className="relative w-full overflow-hidden" style={{paddingBottom:"56.25%"}} onClick={onClick}>
        {thumbInner}
        {/* hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex items-center gap-1.5 text-white text-[12px] font-semibold bg-black/55 backdrop-blur-sm px-3.5 py-1.5 rounded-full translate-y-1.5 group-hover:translate-y-0 transition-transform">
            <Maximize2 className="w-3 h-3" strokeWidth={2.5}/> Open
          </span>
        </div>
        {/* star */}
        <button onClick={e=>{e.stopPropagation();onToggleStar();}}
          className={cn("absolute top-2.5 left-2.5 w-7 h-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-all bg-black/35 hover:bg-black/55 z-10", pres.starred?"opacity-100":"opacity-0 group-hover:opacity-100")}>
          <Star className={cn("w-3.5 h-3.5",pres.starred?"fill-amber-400 text-amber-400":"text-white")} strokeWidth={2}/>
        </button>
        {/* slide count */}
        <span className="absolute bottom-2.5 right-2.5 text-[10px] font-medium text-white bg-black/45 backdrop-blur-sm px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
          <Layers className="w-2.5 h-2.5"/>{slideCount}
        </span>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          {editing
            ?<input value={title} onChange={e=>setTitle(e.target.value)} onBlur={()=>{onRename(title);setEditing(false);}} onKeyDown={e=>{if(e.key==="Enter"){onRename(title);setEditing(false);}}}
                autoFocus className="flex-1 text-[13.5px] font-semibold bg-transparent border-b border-zinc-300 outline-none text-zinc-800 dark:text-zinc-200"/>
            :<p className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 truncate flex-1 cursor-text leading-snug" onDoubleClick={()=>setEditing(true)}>{pres.title}</p>}
          {kebab}
        </div>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {typeChip}{folderChip}
          <span className="text-[10px] text-zinc-400 ml-auto flex items-center gap-1"><Clock className="w-2.5 h-2.5"/>{pres.updatedAt}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ TEMPLATE PICKER ════════════════════════ */

function TemplatePicker({ branding, onSelect, onClose }:{
  branding:{primaryColor:string;accentColor:string}; onSelect:(t:PresentationType)=>void; onClose:()=>void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-zinc-950/55 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-5xl max-h-[88vh] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`}}>
              <Layout className="w-[18px] h-[18px]" strokeWidth={2}/>
            </div>
            <div>
              <p className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Start a new presentation</p>
              <p className="text-[12px] text-zinc-400 mt-0.5">Pick a template — every slide is fully editable.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" strokeWidth={2}/></button>
        </div>

        {/* Template gallery */}
        <div className="p-7 grid grid-cols-2 sm:grid-cols-3 gap-5 overflow-y-auto bg-zinc-50/60 dark:bg-zinc-950/40">
          {TEMPLATE_TYPES.map(tmpl=>{
            const previewTheme = PREVIEW_THEME[tmpl.id] ?? "brand";
            const first = tmpl.slides[0];
            return (
              <button key={tmpl.id} onClick={()=>onSelect(tmpl.id)}
                className="group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 overflow-hidden text-left transition-all duration-200 hover:-translate-y-1">
                {/* brand glow on hover */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  style={{boxShadow:`0 0 0 1.5px ${branding.primaryColor}77, 0 18px 36px -12px ${branding.primaryColor}66`}}/>
                {/* live slide preview */}
                <div className="relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800" style={{paddingBottom:"56.25%"}}>
                  <div className="absolute inset-0 pointer-events-none">
                    {first && <SlideCanvas slide={{...first,id:"preview"} as Slide} theme={previewTheme} branding={branding}/>}
                  </div>
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5"/>
                  {/* hover CTA */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/45 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1.5 text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-full translate-y-1.5 group-hover:translate-y-0 transition-transform"
                      style={{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`}}>
                      <Plus className="w-3.5 h-3.5" strokeWidth={2.5}/>Use template
                    </span>
                  </div>
                  {/* slide count */}
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-medium text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5"/>{tmpl.slides.length}
                  </span>
                </div>
                {/* meta */}
                <div className="px-3.5 py-3">
                  <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5"><span className="text-[15px]">{tmpl.emoji}</span>{tmpl.label}</p>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-snug line-clamp-2">{tmpl.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ MAIN PAGE ══════════════════════════════ */

export default function PresentationsPage() {
  const { branding }    = useBranding();
  const { enabled }     = useAIMode();
  const [view, setView] = useState<View>("library");
  const [editId, setEditId]           = useState<string|null>(null);
  const [presentations, setPresentations] = useState<Presentation[]>(INIT_PRESENTATIONS);
  const [folders, setFolders]         = useState<Folder[]>(INIT_FOLDERS);
  const [activeFolder, setActiveFolder] = useState<string|null>(null);
  const [search, setSearch]           = useState("");
  const [showPicker, setShowPicker]   = useState(false);
  const [gridView, setGridView]       = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [addingFolder, setAddingFolder]   = useState(false);

  const editingPres = presentations.find(p=>p.id===editId);

  function createPresentation(type: PresentationType) {
    const tmpl = TEMPLATE_TYPES.find(t=>t.id===type)!;
    const pres: Presentation = {
      id: uid(), title: tmpl.label, type,
      folderId: activeFolder === "starred" ? null : activeFolder,
      theme: PREVIEW_THEME[type] ?? "brand",
      slides: tmpl.slides.map((s,i)=>({...s,id:`new${i}`})),
      createdAt: "Just now", updatedAt: "Just now", starred: false,
    };
    setPresentations(prev=>[pres,...prev]);
    setShowPicker(false);
    setEditId(pres.id);
    setView("editor");
  }

  const filtered = presentations.filter(p=>{
    if (activeFolder === "starred") { if (!p.starred) return false; }
    else if (activeFolder && p.folderId !== activeFolder) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (view==="editor" && editingPres) {
    return <Editor pres={editingPres} branding={branding} aiEnabled={enabled}
      onBack={()=>setView("library")}
      onSave={(updated)=>setPresentations(prev=>prev.map(p=>p.id===updated.id?updated:p))}/>;
  }

  const ordered = [...filtered].sort((a,b)=>Number(b.starred)-Number(a.starred));

  const chips: { id: string|null; label: string; count: number; star?: boolean; color?: string }[] = [
    { id: null,        label: "All",     count: presentations.length },
    { id: "starred",   label: "Starred", count: presentations.filter(p=>p.starred).length, star: true },
    ...folders.map(f=>({ id: f.id, label: f.name, count: presentations.filter(p=>p.folderId===f.id).length, color: f.color })),
  ];

  return (
    <div className="px-8 py-7 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Presentations</h1>
          <p className="text-[12.5px] text-zinc-400 mt-1">Create, organise and present beautiful decks — built with your brand.</p>
        </div>
        <button onClick={()=>setShowPicker(true)}
          className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-[13px] font-semibold text-white transition-all hover:brightness-105 active:scale-95 flex-shrink-0"
          style={{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`, boxShadow:`0 8px 20px -6px ${branding.primaryColor}80`}}>
          <Plus className="w-4 h-4" strokeWidth={2.5}/>New Presentation
        </button>
      </div>

      {/* Filter chips + search + view toggle */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {chips.map(c=>{
            const isActive = activeFolder===c.id;
            return (
              <button key={String(c.id)} onClick={()=>setActiveFolder(c.id)}
                className={cn("flex items-center gap-1.5 h-8 pl-3 pr-2.5 rounded-full text-[12px] font-medium border transition-all",
                  isActive?"text-white border-transparent shadow-sm":"text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600")}
                style={isActive?{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`}:{}}>
                {c.star && <Star className={cn("w-3 h-3", isActive?"fill-white text-white":"fill-amber-400 text-amber-400")}/>}
                {c.color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:isActive?"#fff":c.color}}/>}
                {c.label}
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center", isActive?"bg-white/25":"bg-zinc-100 dark:bg-zinc-800 text-zinc-400")}>{c.count}</span>
              </button>
            );
          })}
          {addingFolder?(
            <form onSubmit={e=>{e.preventDefault();if(newFolderName.trim()){const id=uid();setFolders(prev=>[...prev,{id,name:newFolderName.trim(),color:branding.primaryColor}]);setNewFolderName("");setAddingFolder(false);setActiveFolder(id);}}}>
              <input autoFocus value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} placeholder="Folder name…"
                onBlur={()=>{if(!newFolderName.trim())setAddingFolder(false);}}
                className="h-8 px-3 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-[12px] w-36 focus:outline-none focus:ring-2"
                style={{"--tw-ring-color":`${branding.primaryColor}55`} as React.CSSProperties}/>
            </form>
          ):(
            <button onClick={()=>setAddingFolder(true)} title="New folder"
              className="flex items-center gap-1 h-8 px-2.5 rounded-full text-[12px] font-medium text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 hover:text-zinc-600 hover:border-zinc-400 transition-all">
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5}/>Folder
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 w-56 px-3 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:ring-2 focus-within:border-transparent transition-all"
            style={{"--tw-ring-color":`${branding.primaryColor}55`} as React.CSSProperties}>
            <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" strokeWidth={2}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="flex-1 min-w-0 text-[12.5px] bg-transparent border-none outline-none text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"/>
            {search&&<button onClick={()=>setSearch("")} className="text-zinc-400 hover:text-zinc-600 flex-shrink-0"><X className="w-3.5 h-3.5"/></button>}
          </div>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            {([[true,Grid3x3],[false,List]] as [boolean, React.ElementType][]).map(([isGrid,Icon])=>(
              <button key={String(isGrid)} onClick={()=>setGridView(isGrid)} title={isGrid?"Grid view":"List view"}
                className={cn("w-7 h-7 flex items-center justify-center rounded-md transition-all",
                  gridView===isGrid?"bg-white dark:bg-zinc-700 shadow-sm text-zinc-700 dark:text-zinc-200":"text-zinc-400 hover:text-zinc-600")}>
                <Icon className="w-3.5 h-3.5" strokeWidth={1.75}/>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {ordered.length===0?(
        <div className="flex flex-col items-center justify-center gap-4 text-center py-24 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white" style={{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`}}>
            <Monitor className="w-7 h-7" strokeWidth={1.5}/>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-zinc-700 dark:text-zinc-200">{search?"No matches":"No presentations here yet"}</p>
            <p className="text-[12.5px] text-zinc-400 mt-1">{search?"Try a different search term.":"Create your first deck to get started."}</p>
          </div>
          {!search&&(
            <button onClick={()=>setShowPicker(true)}
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold text-white"
              style={{background:`linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})`}}>
              <Plus className="w-4 h-4" strokeWidth={2.5}/>Create Presentation
            </button>
          )}
        </div>
      ):(
        <div className={cn(gridView?"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4":"flex flex-col gap-2.5")}>
          {ordered.map(p=>(
            <PresentationCard key={p.id} pres={p} branding={branding} folders={folders} layout={gridView?"grid":"list"}
              onClick={()=>{setEditId(p.id);setView("editor");}}
              onDelete={()=>setPresentations(prev=>prev.filter(x=>x.id!==p.id))}
              onToggleStar={()=>setPresentations(prev=>prev.map(x=>x.id===p.id?{...x,starred:!x.starred}:x))}
              onRename={(t)=>setPresentations(prev=>prev.map(x=>x.id===p.id?{...x,title:t}:x))}
              onMove={(fid)=>setPresentations(prev=>prev.map(x=>x.id===p.id?{...x,folderId:fid}:x))}/>
          ))}
        </div>
      )}

      {showPicker&&<TemplatePicker branding={branding} onSelect={createPresentation} onClose={()=>setShowPicker(false)}/>}
    </div>
  );
}
