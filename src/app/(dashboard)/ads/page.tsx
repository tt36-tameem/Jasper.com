"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { useBranding } from "@/components/providers/BrandingProvider";
import { cn } from "@/lib/utils";
import { getIntegrationStatuses } from "@/lib/integrationStore";
import {
  TrendingUp, TrendingDown, DollarSign, Eye, MousePointer2,
  ShoppingCart, Play, Pause, Plus, MoreHorizontal, ArrowUpRight,
  Zap, AlertCircle, CheckCircle2, BarChart2, RefreshCw, Plug,
} from "lucide-react";

type Platform = "all" | "meta" | "google" | "tiktok" | "linkedin";
type Status   = "active" | "paused" | "draft" | "ended";

interface Campaign {
  id: number;
  name: string;
  platform: Exclude<Platform, "all">;
  status: Status;
  objective: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
}

const CAMPAIGNS: Campaign[] = [
  { id: 1, name: "Summer Sale — Retargeting",   platform: "meta",     status: "active", objective: "Conversions",   budget: 5000,  spent: 3241,  impressions: 184200, clicks: 4820, conversions: 143, roas: 4.2 },
  { id: 2, name: "Brand Awareness Q2",          platform: "google",   status: "active", objective: "Awareness",     budget: 8000,  spent: 6108,  impressions: 512000, clicks: 9340, conversions: 201, roas: 3.1 },
  { id: 3, name: "Lead Gen — Free Trial",       platform: "meta",     status: "active", objective: "Lead Gen",      budget: 3000,  spent: 1876,  impressions: 97400,  clicks: 2610, conversions: 87,  roas: 5.8 },
  { id: 4, name: "Product Launch TikTok",       platform: "tiktok",   status: "active", objective: "Traffic",       budget: 2500,  spent: 2499,  impressions: 341000, clicks: 7820, conversions: 54,  roas: 2.4 },
  { id: 5, name: "Competitor Keywords",         platform: "google",   status: "paused", objective: "Conversions",   budget: 4000,  spent: 1200,  impressions: 43100,  clicks: 1840, conversions: 38,  roas: 3.7 },
  { id: 6, name: "LinkedIn B2B Outreach",       platform: "linkedin", status: "active", objective: "Lead Gen",      budget: 6000,  spent: 4320,  impressions: 28400,  clicks: 890,  conversions: 62,  roas: 6.1 },
  { id: 7, name: "Lookalike Audience — US",     platform: "meta",     status: "paused", objective: "Conversions",   budget: 3500,  spent: 890,   impressions: 51200,  clicks: 1340, conversions: 29,  roas: 2.9 },
  { id: 8, name: "Holiday Promo Draft",         platform: "meta",     status: "draft",  objective: "Sales",         budget: 7000,  spent: 0,     impressions: 0,      clicks: 0,    conversions: 0,   roas: 0   },
];

const PLATFORM_CFG: Record<Exclude<Platform, "all">, { label: string; color: string; bg: string; integrationId: string }> = {
  meta:     { label: "Meta",     color: "#1877F2", bg: "bg-blue-500",    integrationId: "meta-ads"    },
  google:   { label: "Google",   color: "#34A853", bg: "bg-emerald-500", integrationId: "google-ads"  },
  tiktok:   { label: "TikTok",   color: "#010101", bg: "bg-zinc-800",    integrationId: "tiktok-ads"  },
  linkedin: { label: "LinkedIn", color: "#0A66C2", bg: "bg-sky-600",     integrationId: "linkedin-ads"},
};

const STATUS_CFG: Record<Status, { label: string; dot: string; text: string }> = {
  active:  { label: "Active",  dot: "bg-emerald-400", text: "text-emerald-600 dark:text-emerald-400" },
  paused:  { label: "Paused",  dot: "bg-amber-400",   text: "text-amber-600 dark:text-amber-400"     },
  draft:   { label: "Draft",   dot: "bg-zinc-400",    text: "text-zinc-500 dark:text-zinc-400"       },
  ended:   { label: "Ended",   dot: "bg-red-400",     text: "text-red-500 dark:text-red-400"         },
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const PLATFORM_LOGOS: Record<Exclude<Platform, "all">, string> = {
  meta:     "/logos/meta.avif",
  google:   "/logos/google-ads.png",
  tiktok:   "/logos/tiktok.svg",
  linkedin: "/logos/linkedin.png",
};

function PlatformIcon({ platform, size = 16 }: { platform: Exclude<Platform, "all">; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={PLATFORM_LOGOS[platform]}
      alt={PLATFORM_CFG[platform].label}
      className="object-contain flex-shrink-0 rounded"
      style={{ width: size, height: size }}
    />
  );
}

const OVERVIEW = [
  { label: "Total Spend",   value: "$19,134", delta: "+12%",  up: true,  icon: DollarSign,    sub: "vs last month"    },
  { label: "Impressions",   value: "1.26M",   delta: "+24%",  up: true,  icon: Eye,           sub: "vs last month"    },
  { label: "Clicks",        value: "28.6K",   delta: "+9%",   up: true,  icon: MousePointer2, sub: "vs last month"    },
  { label: "Conversions",   value: "614",     delta: "+31%",  up: true,  icon: ShoppingCart,  sub: "vs last month"    },
  { label: "Avg. ROAS",     value: "4.05×",   delta: "+0.4×", up: true,  icon: TrendingUp,    sub: "return on ad spend"},
  { label: "Avg. CTR",      value: "2.27%",   delta: "-0.1%", up: false, icon: BarChart2,     sub: "click-through rate"},
];

const SPEND_BARS = [
  { day: "Mon", meta: 620,  google: 880,  tiktok: 310, linkedin: 490 },
  { day: "Tue", meta: 740,  google: 920,  tiktok: 280, linkedin: 510 },
  { day: "Wed", meta: 580,  google: 760,  tiktok: 420, linkedin: 440 },
  { day: "Thu", meta: 910,  google: 1040, tiktok: 350, linkedin: 620 },
  { day: "Fri", meta: 1020, google: 1180, tiktok: 390, linkedin: 700 },
  { day: "Sat", meta: 480,  google: 560,  tiktok: 510, linkedin: 280 },
  { day: "Sun", meta: 390,  google: 420,  tiktok: 240, linkedin: 200 },
];

const TOP_ADS = [
  { id: 1, name: "Free Trial CTA",       platform: "meta"    as const, ctr: "3.8%", cpc: "$1.24", conversions: 87,  status: "active" as const },
  { id: 2, name: "B2B Decision Maker",   platform: "linkedin"as const, ctr: "2.1%", cpc: "$3.80", conversions: 62,  status: "active" as const },
  { id: 3, name: "Summer Sale Video",    platform: "tiktok"  as const, ctr: "4.2%", cpc: "$0.98", conversions: 54,  status: "active" as const },
  { id: 4, name: "Brand Search — Exact", platform: "google"  as const, ctr: "6.1%", cpc: "$2.10", conversions: 201, status: "active" as const },
];

const AI_INSIGHTS = [
  { type: "good" as const,  text: "LinkedIn B2B campaign has the highest ROAS at 6.1× — consider increasing budget by 30%." },
  { type: "warn" as const,  text: "TikTok Product Launch has nearly exhausted its budget with below-average ROAS (2.4×)." },
  { type: "good" as const,  text: "Meta Lead Gen is outperforming benchmarks — duplicate and test a new audience." },
  { type: "warn" as const,  text: "2 campaigns paused — review and restart or reallocate budget to active performers." },
];

export default function AdsPage() {
  const { branding }            = useBranding();
  const [platform, setPlatform] = useState<Platform>("all");
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<Exclude<Platform, "all">>>(new Set());

  useEffect(() => {
    const statuses = getIntegrationStatuses();
    const connected = new Set<Exclude<Platform, "all">>();
    (Object.entries(PLATFORM_CFG) as [Exclude<Platform, "all">, typeof PLATFORM_CFG[keyof typeof PLATFORM_CFG]][]).forEach(([key, cfg]) => {
      if (statuses[cfg.integrationId] === "connected") connected.add(key);
    });
    setConnectedPlatforms(connected);
  }, []);

  const anyConnected  = connectedPlatforms.size > 0;
  const allPlatforms  = ["meta", "google", "tiktok", "linkedin"] as Exclude<Platform, "all">[];
  const disconnected  = allPlatforms.filter(p => !connectedPlatforms.has(p));

  const filtered = platform === "all" ? campaigns : campaigns.filter(c => c.platform === platform);

  const totalSpend    = campaigns.reduce((s, c) => s + c.spent, 0);
  const maxDayTotal   = Math.max(...SPEND_BARS.map(d => d.meta + d.google + d.tiktok + d.linkedin));

  function toggleStatus(id: number) {
    setCampaigns(prev => prev.map(c =>
      c.id === id ? { ...c, status: c.status === "active" ? "paused" : "active" } : c
    ));
  }

  // ── Full empty state ──────────────────────────────────────────────────
  if (!anyConnected) {
    return (
      <div className="px-8 py-7 max-w-[1400px]">
        <PageHeader title="Advertising" description="Manage campaigns across Meta, Google, TikTok, and LinkedIn." />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
            <Plug className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-[16px] font-semibold text-zinc-800 dark:text-zinc-100 mb-2">No ad accounts connected</h2>
          <p className="text-[13px] text-zinc-400 max-w-sm leading-relaxed mb-6">
            Connect Meta Ads, Google Ads, TikTok, or LinkedIn to start pulling in your real campaign data.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {allPlatforms.map(p => (
              <div key={p} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                <PlatformIcon platform={p} size={12} />
                <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{PLATFORM_CFG[p].label}</span>
              </div>
            ))}
          </div>
          <Link
            href="/settings/integrations"
            className="flex items-center gap-2 h-9 px-5 rounded-xl text-[13px] font-semibold text-white shadow-sm transition-all active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
          >
            <Plug className="w-3.5 h-3.5" strokeWidth={2} /> Connect Ad Accounts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-7 max-w-[1400px]">
      <PageHeader
        title="Advertising"
        description="Manage campaigns across Meta, Google, TikTok, and LinkedIn."
      >
        <button
          className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.97]"
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Campaign
        </button>
      </PageHeader>

      {/* Disconnected platform banners */}
      {disconnected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {disconnected.map(p => (
            <Link
              key={p}
              href="/settings/integrations"
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all group"
            >
              <PlatformIcon platform={p} size={10} />
              <span className="text-[11.5px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                Connect {PLATFORM_CFG[p].label}
              </span>
              <ArrowUpRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 transition-colors" strokeWidth={2} />
            </Link>
          ))}
        </div>
      )}

      {/* Overview KPIs */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {OVERVIEW.map(({ label, value, delta, up, icon: Icon, sub }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 px-4 py-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-zinc-400 truncate">{label}</span>
              <span className={cn(
                "flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                up ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400"
                   : "text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400"
              )}>
                {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {delta}
              </span>
            </div>
            <p className="text-[22px] font-bold text-zinc-900 dark:text-zinc-50 leading-none mb-1">{value}</p>
            <p className="text-[10px] text-zinc-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* AI Insights */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div
              className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800"
              style={{ background: `linear-gradient(135deg, ${branding.primaryColor}0d 0%, transparent 100%)` }}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
                <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              </div>
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Jacsper's Ad Insights</p>
              <span className="text-[10px] text-zinc-400 ml-1">AI-generated recommendations</span>
            </div>
            <div className="px-5 py-3.5 grid grid-cols-2 gap-2.5">
              {AI_INSIGHTS.map((ins, i) => (
                <div key={i} className="flex items-start gap-2">
                  {ins.type === "good"
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    : <AlertCircle  className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"  strokeWidth={2} />
                  }
                  <span className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-snug">{ins.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spend chart */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm px-5 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Daily Spend</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">This week · ${totalSpend.toLocaleString()} total</p>
              </div>
              <div className="flex items-center gap-3">
                {(["meta","google","tiktok","linkedin"] as const).map(p => (
                  <div key={p} className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", PLATFORM_CFG[p].bg)} />
                    <span className="text-[11px] text-zinc-400">{PLATFORM_CFG[p].label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-2 h-28">
              {SPEND_BARS.map(d => {
                const total = d.meta + d.google + d.tiktok + d.linkedin;
                const pct   = total / maxDayTotal;
                const segs  = [
                  { h: d.meta     / total, cls: "bg-blue-500"    },
                  { h: d.google   / total, cls: "bg-emerald-500" },
                  { h: d.tiktok   / total, cls: "bg-zinc-700"    },
                  { h: d.linkedin / total, cls: "bg-sky-600"     },
                ];
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end rounded-t-sm overflow-hidden" style={{ height: `${pct * 100}%` }}>
                      {segs.map((s, i) => (
                        <div key={i} className={cn("w-full", s.cls)} style={{ height: `${s.h * 100}%` }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campaigns table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Campaigns</p>
              <div className="flex items-center gap-1.5">
                {(["all","meta","google","tiktok","linkedin"] as Platform[]).map(p => (
                  <button key={p} onClick={() => setPlatform(p)}
                    className={cn(
                      "h-6 px-2.5 rounded-full text-[11px] font-medium transition-all",
                      platform === p
                        ? "text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                    )}
                    style={platform === p ? { background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` } : {}}
                  >
                    {p === "all" ? "All" : PLATFORM_CFG[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-5 py-2 border-b border-zinc-50 dark:border-zinc-800/50">
              {["Campaign","Status","Budget","Spent","Impressions","Clicks","ROAS",""].map((h, i) => (
                <span key={i} className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider truncate">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {filtered.map(c => {
                const spentPct = c.budget > 0 ? Math.min(c.spent / c.budget, 1) : 0;
                const cfg      = STATUS_CFG[c.status];
                return (
                  <div key={c.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-5 py-3 items-center hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20 transition-colors group">

                    {/* Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PlatformIcon platform={c.platform} size={12} />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200 truncate">{c.name}</p>
                        <p className="text-[10px] text-zinc-400">{c.objective}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
                      <span className={cn("text-[11px] font-medium", cfg.text)}>{cfg.label}</span>
                    </div>

                    {/* Budget */}
                    <span className="text-[12px] text-zinc-600 dark:text-zinc-400">${c.budget.toLocaleString()}</span>

                    {/* Spent with progress */}
                    <div className="min-w-0">
                      <span className="text-[12px] text-zinc-700 dark:text-zinc-300">${c.spent.toLocaleString()}</span>
                      <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${spentPct * 100}%`,
                            background: spentPct > 0.9
                              ? "#ef4444"
                              : `linear-gradient(90deg, ${branding.primaryColor}, ${branding.accentColor})`,
                          }} />
                      </div>
                    </div>

                    {/* Impressions */}
                    <span className="text-[12px] text-zinc-600 dark:text-zinc-400">{fmt(c.impressions)}</span>

                    {/* Clicks */}
                    <span className="text-[12px] text-zinc-600 dark:text-zinc-400">{fmt(c.clicks)}</span>

                    {/* ROAS */}
                    <span className={cn(
                      "text-[12px] font-semibold",
                      c.roas >= 4 ? "text-emerald-600 dark:text-emerald-400"
                        : c.roas >= 2.5 ? "text-amber-600 dark:text-amber-400"
                        : c.roas === 0 ? "text-zinc-400"
                        : "text-red-500 dark:text-red-400"
                    )}>
                      {c.roas > 0 ? `${c.roas}×` : "—"}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {c.status !== "draft" && (
                        <button onClick={() => toggleStatus(c.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                          {c.status === "active"
                            ? <Pause  className="w-3 h-3" strokeWidth={2} />
                            : <Play   className="w-3 h-3" strokeWidth={2} />}
                        </button>
                      )}
                      <button className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                        <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                      </button>
                      <button className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                        <MoreHorizontal className="w-3 h-3" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="w-[240px] flex-shrink-0 space-y-4">

          {/* Platform breakdown */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm px-4 py-4">
            <p className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Spend by Platform</p>
            <div className="space-y-3">
              {(["meta","google","tiktok","linkedin"] as const).map(p => {
                const spend  = campaigns.filter(c => c.platform === p).reduce((s, c) => s + c.spent, 0);
                const pct    = totalSpend > 0 ? spend / totalSpend : 0;
                return (
                  <div key={p}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <PlatformIcon platform={p} size={10} />
                        <span className="text-[11.5px] text-zinc-600 dark:text-zinc-400">{PLATFORM_CFG[p].label}</span>
                      </div>
                      <span className="text-[11.5px] font-medium text-zinc-700 dark:text-zinc-300">${spend.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", PLATFORM_CFG[p].bg)} style={{ width: `${pct * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top performing ads */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">Top Ads</p>
            </div>
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {TOP_ADS.map(ad => (
                <div key={ad.id} className="px-4 py-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <PlatformIcon platform={ad.platform} size={10} />
                    <p className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200 truncate flex-1">{ad.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px] text-zinc-400">CTR</p>
                      <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{ad.ctr}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400">CPC</p>
                      <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{ad.cpc}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400">Conv.</p>
                      <p className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">{ad.conversions}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm px-4 py-4 space-y-2.5">
            <p className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Overview</p>
            {[
              { label: "Active campaigns",  value: String(campaigns.filter(c => c.status === "active").length)  },
              { label: "Paused campaigns",  value: String(campaigns.filter(c => c.status === "paused").length)  },
              { label: "Draft campaigns",   value: String(campaigns.filter(c => c.status === "draft").length)   },
              { label: "Avg. CPC",          value: "$1.84"  },
              { label: "Avg. CPM",          value: "$12.40" },
              { label: "Total conversions", value: String(campaigns.reduce((s, c) => s + c.conversions, 0))     },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11.5px] text-zinc-500 dark:text-zinc-400">{label}</span>
                <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
