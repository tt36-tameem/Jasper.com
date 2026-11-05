"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTheme } from "@/components/providers/ThemeProvider";

const DATA = [
  { day: "Mon", calls: 72,  emails: 45, sms: 38 },
  { day: "Tue", calls: 88,  emails: 52, sms: 44 },
  { day: "Wed", calls: 61,  emails: 39, sms: 51 },
  { day: "Thu", calls: 94,  emails: 67, sms: 58 },
  { day: "Fri", calls: 105, emails: 71, sms: 62 },
  { day: "Sat", calls: 43,  emails: 22, sms: 19 },
  { day: "Sun", calls: 28,  emails: 14, sms: 11 },
];

function CustomTooltip({ active, payload, label, dark }: {
  active?: boolean;
  payload?: { dataKey: string; name: string; value: number; color: string }[];
  label?: string;
  dark?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-xl shadow-sm px-3.5 py-3 text-[12px] border ${dark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-100"}`}>
      <p className="text-zinc-500 font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-5">
          <span style={{ color: p.color }} className="capitalize">{p.name}</span>
          <span className={`font-semibold ${dark ? "text-zinc-200" : "text-zinc-800"}`}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ActivityChart() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const gridColor  = dark ? "#27272a" : "#f4f4f5";
  const tickColor  = dark ? "#52525b" : "#a1a1aa";
  const cursorColor = dark ? "#3f3f46" : "#e4e4e7";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">Outreach this week</p>
        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Calls
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Emails
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            SMS
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={DATA} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#34d399" stopOpacity={dark ? 0.25 : 0.15} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gEmails" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#60a5fa" stopOpacity={dark ? 0.25 : 0.15} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gSms" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#a78bfa" stopOpacity={dark ? 0.25 : 0.15} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="0"
              vertical={false}
              stroke={gridColor}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
              tickCount={4}
            />
            <Tooltip
              content={<CustomTooltip dark={dark} />}
              cursor={{ stroke: cursorColor, strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="calls"
              name="Calls"
              stroke="#34d399"
              strokeWidth={1.5}
              fill="url(#gCalls)"
              dot={false}
              activeDot={{ r: 3, fill: "#34d399", stroke: dark ? "#18181b" : "white", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="emails"
              name="Emails"
              stroke="#60a5fa"
              strokeWidth={1.5}
              fill="url(#gEmails)"
              dot={false}
              activeDot={{ r: 3, fill: "#60a5fa", stroke: dark ? "#18181b" : "white", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="sms"
              name="SMS"
              stroke="#a78bfa"
              strokeWidth={1.5}
              fill="url(#gSms)"
              dot={false}
              activeDot={{ r: 3, fill: "#a78bfa", stroke: dark ? "#18181b" : "white", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Totals row */}
      <div className="flex divide-x divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
        {[
          { label: "Calls",  value: "491", color: "text-emerald-500" },
          { label: "Emails", value: "310", color: "text-blue-500"    },
          { label: "SMS",    value: "283", color: "text-violet-500"  },
        ].map((t) => (
          <div key={t.label} className="flex-1 px-5 py-3 text-center">
            <p className={`text-[15px] font-semibold ${t.color}`}>{t.value}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
