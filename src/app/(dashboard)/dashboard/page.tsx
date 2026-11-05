"use client";

import { useEffect, useState } from "react";
import {
  Phone, Mail, MessageSquare, ArrowRight,
  FileText, Calendar, TrendingUp, TrendingDown,
  Brain, RefreshCw,
} from "lucide-react";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { AIModeButton } from "@/components/ai-mode/AIModeButton";
import { useAIMode } from "@/components/providers/AIModeProvider";
import { useBranding } from "@/components/providers/BrandingProvider";
import { UsageWidget } from "@/components/dashboard/usage-widget";

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Every call is a chance to change someone's life — and your numbers.",
  "Small disciplines repeated consistently lead to great achievements.",
  "Your pipeline is a reflection of your activity. Fill it daily.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't watch the clock — do what it does. Keep going.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Act as if what you do makes a difference. It does.",
  "Opportunities don't happen. You create them.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The key to success is to focus on goals, not obstacles.",
  "One more call. One more email. One more door.",
  "Revenue is a lagging indicator. Activity is the leading one.",
  "The follow-up is where the deal actually lives.",
  "Be so good they can't ignore you.",
  "You don't rise to the level of your goals — you fall to the level of your systems.",
  "Discipline is choosing what you want most over what you want now.",
  "The only way to do great work is to love what you do.",
  "Done is better than perfect.",
  "Every no gets you closer to a yes.",
  "Work hard in silence. Let success make the noise.",
  "A year from now you'll wish you had started today.",
  "The difference between ordinary and extraordinary is that little extra.",
  "You are one decision away from a completely different life.",
  "If you can dream it, you can do it.",
  "Show up every day, even when the results aren't there yet.",
  "Consistency beats intensity every single time.",
  "Your best pitch is the one that solves their real problem.",
  "The client doesn't buy your product — they buy the outcome.",
  "Speed of response is speed of trust.",
  "Build the relationship before you need it.",
  "Rejection isn't personal. It's just data.",
  "A full calendar is a healthy business.",
  "Clarity on the outcome makes every call easier.",
  "Progress, not perfection.",
  "Make today count. You won't get it back.",
  "The most valuable thing you can give anyone is your focused attention.",
  "What you track, you improve.",
  "Comfort is the enemy of growth.",
  "Your reputation is built one conversation at a time.",
  "Good things come to those who hustle while they wait.",
  "Don't count the days — make the days count.",
  "Every expert was once a beginner who refused to quit.",
  "Energy flows where focus goes.",
  "The grind is the goal.",
  "Win the morning, win the day.",
];

const STATS = [
  { label: "Total Leads",    value: "292",   delta: "+18",  up: true  },
  { label: "Calls Today",    value: "34",    delta: "+7",   up: true  },
  { label: "Booked",         value: "12",    delta: "+3",   up: true  },
  { label: "Pipeline",       value: "$284k", delta: "+$12k", up: true },
];

const ACTIVITY = [
  { icon: Phone,         color: "text-emerald-400 fill-emerald-400", strokeWidth: 0,    actor: "Houston Properties",    action: "call — no answer",        time: "2m ago"    },
  { icon: MessageSquare, color: "text-violet-400  fill-violet-400",  strokeWidth: 0,    actor: "Omar Al-Rashid",        action: "SMS delivered",            time: "18m ago"   },
  { icon: ArrowRight,    color: "text-amber-400",                    strokeWidth: 2.5,  actor: "Priya Nair",            action: "moved to Qualified",       time: "1h ago"    },
  { icon: Mail,          color: "text-blue-400",                     strokeWidth: 2.5,  actor: "52 leads",              action: "email sequence launched",  time: "2h ago"    },
  { icon: ArrowRight,    color: "text-amber-400",                    strokeWidth: 2.5,  actor: "James Thornton",        action: "proposal sent",            time: "3h ago"    },
  { icon: FileText,      color: "text-indigo-400",                   strokeWidth: 2.5,  actor: "Weekly report",         action: "generated",                time: "Yesterday" },
  { icon: Calendar,      color: "text-rose-400",                     strokeWidth: 2.5,  actor: "Laura Chen",            action: "meeting booked — Fri 3pm", time: "Yesterday" },
  { icon: Phone,         color: "text-emerald-400 fill-emerald-400", strokeWidth: 0,    actor: "Vertex Capital",        action: "call — answered · 7m 14s", time: "2d ago"    },
];

const PIPELINE = [
  { label: "New",       count: 84,  value: "$102k" },
  { label: "Contacted", count: 61,  value: "$74k"  },
  { label: "Qualified", count: 47,  value: "$58k"  },
  { label: "Proposal",  count: 38,  value: "$31k"  },
  { label: "Closed",    count: 52,  value: "$19k"  },
];

function DailyQuote() {
  const [fullQuote, setFullQuote] = useState("");
  const [displayed, setDisplayed] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setFullQuote(q);
  }, []);

  useEffect(() => {
    if (!fullQuote) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(fullQuote.slice(0, i));
      if (i >= fullQuote.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 38);
    return () => clearInterval(interval);
  }, [fullQuote]);

  // Blink cursor — stops blinking 2s after typing completes
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setCursorVisible(false), 2000);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-50 tracking-tight">
      {displayed}
      <span
        className={`inline-block w-[2px] h-[15px] bg-zinc-900 dark:bg-zinc-50 ml-[2px] align-middle transition-opacity duration-300 ${
          done && !cursorVisible ? "opacity-0" : "animate-pulse"
        }`}
      />
    </p>
  );
}

function JasperBriefingCard() {
  const { branding } = useBranding();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setText("");
    fetch("/api/jacsper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt:
          "Pipeline: $284k value, 292 leads total, 12 booked today, 84 new. Hot deals: Ryan Fitzgerald $31k in Proposal (3 days old), Omar Al-Rashid $24k in Contacted (3h ago), Priya Nair $5.2k in Qualified (1h ago). Give exactly 3 numbered action items for today. Each max 12 words. One per line.",
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

  const lines = text.split("\n").filter((l) => l.trim());

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden mb-5">
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
        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Jacsper&apos;s Briefing</p>
        <span className="text-[10px] text-zinc-400 ml-1">Today&apos;s top priorities</span>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center gap-2 text-[12px] text-zinc-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            Analyzing your pipeline…
          </div>
        ) : error ? (
          <p className="text-[12px] text-amber-500">{text || "Unable to connect to Jacsper AI. Check your ANTHROPIC_API_KEY in .env.local."}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {lines.map((line, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
                >
                  {i + 1}
                </span>
                <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug">
                  {line.replace(/^\d+[\.\)]\s*/, "")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DynamicGreeting() {
  const [greeting, setGreeting] = useState("");
  const [dateStr, setDateStr]   = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setDateStr(new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  return (
    <div className="mb-7">
      <h1 className="text-[18px] font-medium text-zinc-900 dark:text-zinc-50 tracking-tight">
        {greeting ? `${greeting}, Tameem.` : " "}
      </h1>
      <DailyQuote />
      <p className="text-xs text-zinc-400 mt-1">{dateStr}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { enabled } = useAIMode();

  return (
    <>
    <div className="px-8 py-7 max-w-[1200px]">

      <DynamicGreeting />

      {/* Jacsper Briefing — only when mode is on */}
      {enabled && <JasperBriefingCard />}

      {/* Plan usage */}
      <UsageWidget />

      {/* Stats Strip */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 flex divide-x divide-zinc-100 dark:divide-zinc-800 mb-5 overflow-hidden">
        {STATS.map((s) => (
          <div key={s.label} className="flex-1 px-6 py-4">
            <p className="text-[11px] text-zinc-400 font-medium mb-1.5">{s.label}</p>
            <p className="text-[22px] font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
              {s.value}
            </p>
            <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${s.up ? "text-emerald-500" : "text-red-400"}`}>
              {s.up
                ? <TrendingUp   className="w-3 h-3" strokeWidth={2} />
                : <TrendingDown className="w-3 h-3" strokeWidth={2} />
              }
              {s.delta} this week
            </p>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-5 gap-4">

        {/* Activity Feed */}
        <div className="col-span-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">Activity</p>
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live
            </span>
          </div>

          <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
            {ACTIVITY.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 px-5 py-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <a.icon
                  className={`w-[15px] h-[15px] flex-shrink-0 ${a.color}`}
                  strokeWidth={a.strokeWidth}
                />
                <p className="flex-1 text-[13px] text-zinc-600 dark:text-zinc-400 min-w-0 truncate">
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium">{a.actor}</span>
                  <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                  {a.action}
                </p>
                <span className="text-[11px] text-zinc-400 flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-2 flex flex-col gap-4">

          {/* Area chart */}
          <ActivityChart />

          {/* Pipeline summary */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">Pipeline</p>
              <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">$284k</span>
            </div>
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {PIPELINE.map((stage) => {
                const pct = Math.round((stage.count / 292) * 100);
                return (
                  <div key={stage.label} className="px-5 py-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] text-zinc-600 dark:text-zinc-400">{stage.label}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] text-zinc-400">{stage.count}</span>
                        <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 w-10 text-right">{stage.value}</span>
                      </div>
                    </div>
                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-300 dark:bg-zinc-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
    <AIModeButton />
    </>
  );
}
