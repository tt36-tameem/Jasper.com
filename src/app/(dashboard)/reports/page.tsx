"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAIMode } from "@/components/providers/AIModeProvider";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  TrendingUp, TrendingDown, Phone, Mail, MessageSquare,
  DollarSign, Brain, RefreshCw, Users, Trophy, Download,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// ─── Static data ─────────────────────────────────────────────────────────────

const KPI = [
  { label: "Revenue Closed",  value: "$31,200", delta: "+18%",  up: true,  icon: DollarSign,    sub: "vs last week" },
  { label: "Total Leads",     value: "292",     delta: "+24",   up: true,  icon: Users,         sub: "vs last week" },
  { label: "Deals Won",       value: "52",      delta: "+7",    up: true,  icon: Trophy,        sub: "vs last week" },
  { label: "Calls Connected", value: "64%",     delta: "+4%",   up: true,  icon: Phone,         sub: "connect rate" },
  { label: "Email Open Rate", value: "38%",     delta: "-2%",   up: false, icon: Mail,          sub: "vs last week" },
  { label: "SMS Reply Rate",  value: "71%",     delta: "+9%",   up: true,  icon: MessageSquare, sub: "vs last week" },
];

const ACTIVITY_BY_DAY = [
  { day: "Mon", calls: 72,  emails: 45, sms: 38 },
  { day: "Tue", calls: 88,  emails: 52, sms: 44 },
  { day: "Wed", calls: 61,  emails: 39, sms: 51 },
  { day: "Thu", calls: 94,  emails: 67, sms: 58 },
  { day: "Fri", calls: 105, emails: 71, sms: 62 },
  { day: "Sat", calls: 43,  emails: 22, sms: 19 },
  { day: "Sun", calls: 28,  emails: 14, sms: 11 },
];

const REVENUE_TREND = [
  { week: "Wk 1", revenue: 18400, deals: 31 },
  { week: "Wk 2", revenue: 22100, deals: 38 },
  { week: "Wk 3", revenue: 19600, deals: 34 },
  { week: "Wk 4", revenue: 26400, deals: 44 },
  { week: "Wk 5", revenue: 31200, deals: 52 },
];

const FUNNEL = [
  { stage: "New Leads",  count: 292, pct: 100 },
  { stage: "Contacted",  count: 187, pct: 64  },
  { stage: "Qualified",  count: 119, pct: 41  },
  { stage: "Proposal",   count: 74,  pct: 25  },
  { stage: "Closed Won", count: 52,  pct: 18  },
];

const LEAD_SOURCES = [
  { name: "Instagram DM",   value: 38, color: "#E1306C" },
  { name: "Web Scrape",     value: 24, color: "#6366f1" },
  { name: "Email Outreach", value: 19, color: "#3b82f6" },
  { name: "Referral",       value: 11, color: "#10b981" },
  { name: "Other",          value: 8,  color: "#a1a1aa" },
];

const REPS = [
  { name: "Alex Torres",   calls: 214, booked: 28, revenue: "$12,400", rate: "68%" },
  { name: "Maya Singh",    calls: 188, booked: 24, revenue: "$10,800", rate: "72%" },
  { name: "Jordan Banks",  calls: 163, booked: 19, revenue: "$8,000",  rate: "61%" },
  { name: "Sam Powell",    calls: 141, booked: 15, revenue: "$6,200",  rate: "57%" },
];

const DATE_RANGES = ["This Week", "This Month", "Last 30 Days", "This Quarter"] as const;
type DateRange = typeof DATE_RANGES[number];

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-lg px-3.5 py-2.5 text-[12px]">
      {label && <p className="text-zinc-500 dark:text-zinc-400 mb-1.5 font-medium">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-zinc-500 dark:text-zinc-400 capitalize">{p.name}</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 ml-auto pl-3">
            {typeof p.value === "number" && p.name === "revenue" ? `$${p.value.toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Jacsper insights ─────────────────────────────────────────────────────────

function JasperInsightsCard() {
  const { branding } = useBranding();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch("/api/jacsper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt:
          "CRM weekly report: Revenue closed $31,200 (+18% vs last week), Call connect rate 64% (+4%), Email open rate 38% (-2%), SMS reply rate 71% (+9%). Peak day: Friday with 105 calls, 71 emails, 62 SMS. Write exactly 2 sentences of executive insight followed by 1 specific recommendation. Be direct, no padding.",
        systemPrompt: branding.systemPrompt,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(true); setText(d.error); }
        else setText(d.text || "");
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden mb-6">
      <div
        className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800"
        style={{ background: `linear-gradient(135deg, ${branding.primaryColor}10 0%, transparent 100%)` }}
      >
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
        >
          <Brain className="w-3.5 h-3.5 text-white" strokeWidth={1.75} />
        </div>
        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Jacsper&apos;s Analysis</p>
        <span className="text-[10px] text-zinc-400 ml-1">AI-generated weekly insight</span>
        {loading && <RefreshCw className="w-3 h-3 text-zinc-400 animate-spin ml-auto" strokeWidth={2} />}
      </div>
      <div className="px-5 py-4">
        {loading ? (
          <p className="text-[12px] text-zinc-400 italic">Analyzing your weekly data…</p>
        ) : error ? (
          <p className="text-[12px] text-amber-500">{text || "Check ANTHROPIC_API_KEY in .env.local."}</p>
        ) : (
          <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{text}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { enabled } = useAIMode();
  const [dateRange, setDateRange] = useState<DateRange>("This Week");

  return (
    <div className="px-8 py-7 max-w-[1300px]">
      <PageHeader
        title="Reports"
        description="Performance analytics across all channels."
      >
        {/* Date range tabs */}
        <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium transition-colors border-r last:border-r-0 border-zinc-200 dark:border-zinc-700",
                dateRange === r
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </PageHeader>

      {/* Jacsper AI insights */}
      {enabled && <JasperInsightsCard />}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {KPI.map((k) => (
          <div key={k.label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 px-4 py-3.5">
            <div className="flex items-start justify-between mb-2.5">
              <span className="text-[11px] text-zinc-400 font-medium leading-tight">{k.label}</span>
              <k.icon className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 flex-shrink-0" strokeWidth={1.75} />
            </div>
            <p className="text-[22px] font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
              {k.value}
            </p>
            <p className={cn("text-[11px] mt-1.5 flex items-center gap-1", k.up ? "text-emerald-500" : "text-red-400")}>
              {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {k.delta}
              <span className="text-zinc-400 ml-0.5">{k.sub}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Trend + Activity Charts */}
      <div className="grid grid-cols-5 gap-4 mb-4">

        {/* Revenue Trend — 3 cols */}
        <div className="col-span-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">Revenue Trend</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Closed revenue over last 5 weeks</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-violet-400/30" />
                Revenue
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={REVENUE_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: "currentColor" }}
                className="text-zinc-400"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "currentColor" }}
                className="text-zinc-400"
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={{ fill: "#8b5cf6", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity By Day — 2 cols */}
        <div className="col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">Weekly Activity</p>
            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-400" />Calls</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Email</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />SMS</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={ACTIVITY_BY_DAY} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={5} barGap={1}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: "currentColor" }}
                className="text-zinc-400"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "currentColor" }}
                className="text-zinc-400"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="calls"  fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="emails" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="sms"    fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: Funnel + Lead Sources + Reps */}
      <div className="grid grid-cols-5 gap-4">

        {/* Conversion Funnel — 2 cols */}
        <div className="col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 mb-4">Conversion Funnel</p>
          <div className="flex flex-col gap-2.5">
            {FUNNEL.map((stage, i) => {
              const colors = ["bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-orange-500", "bg-emerald-500"];
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">{stage.count}</span>
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 w-7 text-right">{stage.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", colors[i])}
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Overall conversion</span>
            <span className="text-[13px] font-semibold text-emerald-500">17.8%</span>
          </div>
        </div>

        {/* Lead Sources — 1.5 cols (use col-span-2 at this layout) */}
        <div className="col-span-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5 flex flex-col">
          <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 mb-2">Lead Sources</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie
                  data={LEAD_SOURCES}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {LEAD_SOURCES.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0];
                    return (
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg shadow-md px-3 py-2 text-[11px]">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{p.name}</p>
                        <p className="text-zinc-400">{p.value}%</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            {LEAD_SOURCES.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex-1 truncate">{s.name}</span>
                <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Reps — 2 cols */}
        <div className="col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">Top Reps</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">This week&apos;s performance</p>
          </div>
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
            <div className="grid grid-cols-4 px-5 py-2 text-[10px] text-zinc-400 font-medium uppercase tracking-wide">
              <span>Rep</span>
              <span className="text-right">Calls</span>
              <span className="text-right">Booked</span>
              <span className="text-right">Revenue</span>
            </div>
            {REPS.map((rep, i) => (
              <div
                key={rep.name}
                className="grid grid-cols-4 px-5 py-2.5 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors items-center"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-zinc-400 w-3">{i + 1}</span>
                  <span className="text-[12px] text-zinc-700 dark:text-zinc-300 font-medium truncate">{rep.name.split(" ")[0]}</span>
                </div>
                <span className="text-[12px] text-zinc-600 dark:text-zinc-400 text-right">{rep.calls}</span>
                <span className="text-[12px] text-zinc-600 dark:text-zinc-400 text-right">{rep.booked}</span>
                <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 text-right">{rep.revenue}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Avg connect rate</span>
            <span className="text-[12px] font-semibold text-emerald-500">64.5%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
