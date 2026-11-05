"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Phone, PhoneOff, PhoneMissed, PhoneCall,
  Mic, MicOff, Volume2, VolumeX, SkipForward,
  ListOrdered, Clock, Sparkles, ChevronRight,
  TrendingUp, Users, CheckCircle2, RefreshCw,
  AlertCircle, Zap, Bot, User,
  Settings, ExternalLink, Wifi, WifiOff, Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/providers/BrandingProvider";
import { useAIMode } from "@/components/providers/AIModeProvider";
import { AIAgent, getActiveAgent, toVapiAssistantConfig } from "@/lib/agentStore";
import { recordUsage } from "@/lib/usageStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type CallMode    = "human" | "ai";
type CallState   = "idle" | "connecting" | "ringing" | "active" | "ended";
type DeviceState = "unregistered" | "registering" | "registered" | "error" | "no_credentials";

interface QueueLead {
  name: string;
  company: string;
  phone: string;
  status: "calling" | "queued" | "done" | "skipped";
  tags: string[];
}

// ─── Static data ──────────────────────────────────────────────────────────────
const INITIAL_QUEUE: QueueLead[] = [
  { name: "Sarah Mitchell",  company: "Apex Realty Group",    phone: "+15552014400", status: "calling", tags: ["Hot Lead"]    },
  { name: "Omar Al-Rashid",  company: "Desert Peak Invest.",  phone: "+15555037733", status: "queued",  tags: ["High Value"]  },
  { name: "Priya Nair",      company: "Summit Consulting",    phone: "+15554106622", status: "queued",  tags: ["New Lead"]    },
  { name: "Marcus Webb",     company: "Webb & Associates",    phone: "+15557059900", status: "queued",  tags: []              },
  { name: "Aisha Okonkwo",   company: "TechBridge Solutions", phone: "+15553035544", status: "queued",  tags: ["C-Suite"]     },
  { name: "Sofia Andersen",  company: "Nordic Growth Co",     phone: "+15555051122", status: "queued",  tags: ["Call Booked"] },
];

const CALL_LOG_INITIAL = [
  { name: "James Thornton", company: "BlueSky Properties",  result: "Answered",  duration: "4:32", outcome: "good"    },
  { name: "Laura Chen",     company: "Horizon Digital",     result: "No Answer", duration: "—",    outcome: "neutral" },
  { name: "Tom Brennan",    company: "Pacific Ventures",    result: "Voicemail", duration: "0:28", outcome: "warn"    },
  { name: "Fatima Al-Amin", company: "Global Trade",        result: "Answered",  duration: "7:14", outcome: "good"    },
];

const AI_SCRIPT_LINES = [
  "Hey Sarah, this is Alex calling from Jacsper — is now a good time?",
  "I saw you were exploring CRM options for your sales team at Apex Realty.",
  "We work specifically with real estate sales teams to cut manual data entry and boost deal velocity.",
  "I'd love to show you a 10-minute demo this week — does Thursday or Friday work?",
];

const FULL_SCRIPT = `Hi [Name], this is Alex from Jacsper — do you have 30 seconds?

I'm reaching out because we work with real estate sales teams to cut down on manual data entry and help close deals faster. Apex Realty came up as a great fit for what we do.

We've helped teams like yours reduce admin time by over 60% and increase deal velocity within the first month.

I'd love to show you a quick 10-minute demo — no pressure, just want to see if there's a fit. Would Thursday or Friday work for you this week?

[If yes] → Perfect, I'll send over a calendar invite right now.
[If objection] → I totally understand. Can I ask — what's your biggest bottleneck in your current process?`;

const OUTCOME_CFG = {
  good:    { Icon: PhoneCall,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30",  border: "border-emerald-100 dark:border-emerald-900/40" },
  neutral: { Icon: PhoneMissed, color: "text-zinc-400",    bg: "bg-zinc-50 dark:bg-zinc-800/50",        border: "border-zinc-100 dark:border-zinc-700/50"       },
  warn:    { Icon: PhoneOff,    color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30",      border: "border-amber-100 dark:border-amber-900/40"     },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const hue = (name.charCodeAt(0) * 37 + (name.charCodeAt(1) || 0) * 17) % 360;
  return (
    <span className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.3, background: `hsl(${hue} 50% 50%)` }}>
      {initials}
    </span>
  );
}

function fmtSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── Device status badge ──────────────────────────────────────────────────────
function DeviceBadge({ state, mode }: { state: DeviceState; mode: CallMode }) {
  const cfg: Record<DeviceState, { icon: React.ReactNode; label: string; cls: string }> = {
    registered:    { icon: <Wifi className="w-3 h-3" />,     label: mode === "ai" ? "Vapi ready" : "Dialer ready",  cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
    registering:   { icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Connecting…", cls: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
    unregistered:  { icon: <WifiOff className="w-3 h-3" />,  label: "Offline",       cls: "text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" },
    error:         { icon: <AlertCircle className="w-3 h-3" />, label: "Error",       cls: "text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800" },
    no_credentials:{ icon: <Settings className="w-3 h-3" />, label: "Needs setup",   cls: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
  };
  const c = cfg[state];
  return (
    <span className={cn("flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border", c.cls)}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── Setup guide modal ────────────────────────────────────────────────────────
function SetupGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-2xl w-[540px] max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50 mb-1">Set up live calling</h2>
        <p className="text-[12px] text-zinc-400 mb-5">Add these keys to your <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">.env.local</code> file then restart the dev server.</p>

        <div className="space-y-5">
          {/* Telnyx — recommended for non-US users */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <User className="w-2.5 h-2.5 text-white" />
              </span>
              <p className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">Telnyx <span className="text-emerald-600 font-semibold">(recommended — works outside US)</span></p>
              <a href="https://portal.telnyx.com" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5">
                Portal <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-900/30 rounded-xl p-3 text-[11px] text-emerald-400 mb-2">
              Telnyx sells numbers in 100+ countries with no local documentation for most regions. You can still call US leads from a non-US number.
            </div>
            <div className="bg-zinc-950 rounded-xl p-3 font-mono text-[11px] text-zinc-300 space-y-0.5">
              <div><span className="text-zinc-500"># Step 1: portal.telnyx.com → SIP Connections → Add → copy username + password</span></div>
              <div>TELNYX_SIP_USER=your_sip_username</div>
              <div>TELNYX_SIP_PASSWORD=your_sip_password</div>
              <div className="mt-1"><span className="text-zinc-500"># Step 2: Buy a number in Numbers → Search (any country)</span></div>
              <div>TELNYX_PHONE_NUMBER=+447911123456</div>
              <div className="mt-1"><span className="text-zinc-500"># Step 3: TeXML App — Mission Control → TeXML Apps → set webhook to /api/dialer/telnyx</span></div>
              <div>TELNYX_APP_ID=your_texxml_app_id</div>
            </div>
            <div className="mt-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-xl p-3 text-[11px] text-zinc-500 dark:text-zinc-400">
              <p className="font-semibold text-zinc-600 dark:text-zinc-300 mb-1">TeXML webhook setup:</p>
              <p>In the TeXML App set <strong>Voice URL</strong> → <code className="bg-zinc-100 dark:bg-zinc-700 px-1 rounded">https://your-domain.com/api/dialer/telnyx</code>. For local dev: <code className="bg-zinc-100 dark:bg-zinc-700 px-1 rounded">ngrok http 3000</code></p>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

          {/* Twilio — US users only */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <User className="w-2.5 h-2.5 text-white" />
              </span>
              <p className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">Twilio <span className="text-zinc-400 font-normal">(US users only — requires US docs for US numbers)</span></p>
              <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5">
                Console <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="bg-zinc-950 rounded-xl p-3 font-mono text-[11px] text-zinc-300 space-y-0.5">
              <div>TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx</div>
              <div>TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxx</div>
              <div>TWILIO_API_SECRET=your_api_secret</div>
              <div>TWILIO_PHONE_NUMBER=+15551234567</div>
              <div>TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxx</div>
            </div>
          </div>

          {/* Vapi */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-2.5 h-2.5 text-white" />
              </span>
              <p className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">Vapi (AI calls)</p>
              <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5">
                Dashboard <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="bg-zinc-950 rounded-xl p-3 font-mono text-[11px] text-zinc-300 space-y-0.5">
              <div><span className="text-zinc-500"># Vapi API key — from dashboard.vapi.ai → API Keys</span></div>
              <div>VAPI_API_KEY=your_vapi_api_key</div>
              <div className="mt-1"><span className="text-zinc-500"># Phone number ID from Vapi dashboard (optional)</span></div>
              <div>VAPI_PHONE_NUMBER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</div>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="mt-5 w-full h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors">
          Got it
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DialerPage() {
  const { branding } = useBranding();
  const { enabled }  = useAIMode();

  // Mode
  const [callMode, setCallMode]   = useState<CallMode>("human");

  // Call state
  const [callState, setCallState]   = useState<CallState>("idle");
  const [deviceState, setDeviceState] = useState<DeviceState>("unregistered");
  const [currentLead, setCurrentLead] = useState<QueueLead>(INITIAL_QUEUE[0]);
  const [queue, setQueue]           = useState<QueueLead[]>(INITIAL_QUEUE);
  const [callLog, setCallLog]       = useState(CALL_LOG_INITIAL);
  const [callSeconds, setCallSeconds] = useState(0);
  const [muted, setMuted]           = useState(false);
  const [speaker, setSpeaker]       = useState(true);
  const [scriptIdx, setScriptIdx]   = useState(0);
  const [scriptTab, setScriptTab]   = useState<"track" | "full">("track");
  const [scriptText, setScriptText] = useState(FULL_SCRIPT);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized]   = useState(false);
  const [showSetup, setShowSetup]   = useState(false);
  const [vapiCallId, setVapiCallId]   = useState<string | null>(null);
  const [stats, setStats]             = useState({ called: 0, answered: 0, voicemail: 0 });
  const [activeNumber, setActiveNumber] = useState<string | null>(null);
  const [activeAgent, setActiveAgent]   = useState<AIAgent | null>(null);

  // Twilio refs
  const twilioDeviceRef = useRef<unknown>(null);
  const activeCallRef   = useRef<unknown>(null);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef      = useRef(0);

  // ── Timer ──────────────────────────────────────────────────────────────────
  function startTimer() {
    setCallSeconds(0);
    secondsRef.current = 0;
    timerRef.current = setInterval(() => { secondsRef.current += 1; setCallSeconds(s => s + 1); }, 1000);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    // Meter voice minutes against the plan (round partial minutes up).
    if (secondsRef.current > 0) {
      recordUsage("voiceMinutes", Math.ceil(secondsRef.current / 60));
      secondsRef.current = 0;
    }
  }

  // ── Provider-agnostic device init ─────────────────────────────────────────
  const initDevice = useCallback(async () => {
    setDeviceState("registering");
    try {
      const res  = await fetch("/api/dialer/token");
      const data = await res.json();

      if (data.error === "missing_credentials") {
        setDeviceState("no_credentials"); return;
      }

      if (data.provider === "telnyx") {
        // ── Telnyx WebRTC ────────────────────────────────────────────────
        const { TelnyxRTC } = await import("@telnyx/webrtc");
        const client = new TelnyxRTC({ login: data.sipUser, password: data.sipPass });

        client.on("telnyx.ready",      () => setDeviceState("registered"));
        client.on("telnyx.error",      () => setDeviceState("error"));
        client.on("telnyx.socket.close", () => setDeviceState("unregistered"));

        await client.connect();
        twilioDeviceRef.current = client; // reuse the ref for either provider

      } else {
        // ── Twilio Client ────────────────────────────────────────────────
        const { Device } = await import("@twilio/voice-sdk");
        const device = new Device(data.token, { logLevel: 1 });

        device.on("registered",   () => setDeviceState("registered"));
        device.on("unregistered", () => setDeviceState("unregistered"));
        device.on("error",        () => setDeviceState("error"));

        await device.register();
        twilioDeviceRef.current = device;
      }
    } catch {
      setDeviceState("error");
    }
  }, []);

  // Load active number from localStorage
  useEffect(() => {
    const n = localStorage.getItem("aura_active_number");
    if (n) setActiveNumber(n);
  }, []);

  // Load the active AI agent (used for AI Agent mode calls)
  useEffect(() => {
    setActiveAgent(getActiveAgent());
  }, []);

  useEffect(() => {
    if (callMode === "human") initDevice();
    else setDeviceState("registered");
    return () => stopTimer();
  }, [callMode, initDevice]);

  // ── Make a human call (Telnyx or Twilio, detected from token response) ─────
  async function makeHumanCall(lead: QueueLead) {
    const tokenRes  = await fetch("/api/dialer/token");
    const tokenData = await tokenRes.json();
    if (tokenData.error) return;

    setCallState("ringing");

    if (tokenData.provider === "telnyx") {
      // ── Telnyx call ──────────────────────────────────────────────────────
      try {
        const { TelnyxRTC } = await import("@telnyx/webrtc");
        const client = twilioDeviceRef.current as InstanceType<typeof TelnyxRTC> | null;
        if (!client) return;

        const call = client.newCall({
          destinationNumber: lead.phone,
          callerNumber: tokenData.from,
        });
        activeCallRef.current = call;

        // Telnyx fires telnyx.notification with call state updates
        call.on("telnyx.notification", (notification: { type: string; call?: { state: string } }) => {
          if (notification.type !== "callUpdate") return;
          const state = notification.call?.state;
          if (state === "active")   { setCallState("active"); startTimer(); setStats(s => ({ ...s, called: s.called + 1 })); }
          if (state === "hangup")   { setCallState("ended"); stopTimer(); logCallEnd("Answered"); }
          if (state === "destroy")  { setCallState("ended"); stopTimer(); }
        });
      } catch {
        setCallState("idle");
      }

    } else {
      // ── Twilio call ──────────────────────────────────────────────────────
      try {
        const { Device } = await import("@twilio/voice-sdk");
        const device = twilioDeviceRef.current as InstanceType<typeof Device> | null;
        if (!device) return;

        const call = await device.connect({ params: { To: lead.phone } });
        activeCallRef.current = call;

        call.on("accept",     () => { setCallState("active"); startTimer(); setStats(s => ({ ...s, called: s.called + 1 })); });
        call.on("disconnect", () => { setCallState("ended"); stopTimer(); logCallEnd("Answered"); });
        call.on("cancel",     () => { setCallState("ended"); stopTimer(); logCallEnd("No Answer"); });
        call.on("error",      () => { setCallState("ended"); stopTimer(); });
      } catch {
        setCallState("idle");
      }
    }
  }

  // ── Make an AI call via Vapi ───────────────────────────────────────────────
  async function makeVapiCall(lead: QueueLead) {
    setCallState("connecting");
    try {
      // Use the active AI agent's config; fall back to the on-screen script.
      const agent = activeAgent ?? getActiveAgent();
      const assistantConfig = agent
        ? toVapiAssistantConfig(agent, lead.name)
        : {
            model: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
            voice: { provider: "11labs", voiceId: "21m00Tcm4TlvDq8ikWAM" },
            firstMessage: scriptText.split("\n")[0].replace("[Name]", lead.name.split(" ")[0]),
            endCallMessage: "Thanks for your time. Have a great day!",
          };
      const res = await fetch("/api/dialer/vapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: lead.phone, assistantConfig }),
      });
      const data = await res.json();
      if (data.error === "missing_credentials") { setDeviceState("no_credentials"); setCallState("idle"); return; }
      if (data.id) {
        setVapiCallId(data.id);
        setCallState("active");
        startTimer();
        setStats(s => ({ ...s, called: s.called + 1 }));
      }
    } catch {
      setCallState("idle");
    }
  }

  // ── Dial current lead ──────────────────────────────────────────────────────
  function dialCurrent() {
    if (callState !== "idle") return;
    if (callMode === "human") makeHumanCall(currentLead);
    else makeVapiCall(currentLead);
    setQueue(q => q.map((l, i) => i === 0 ? { ...l, status: "calling" } : l));
  }

  // ── Hang up ────────────────────────────────────────────────────────────────
  async function hangUp() {
    if (callMode === "human") {
      const tokenRes  = await fetch("/api/dialer/token");
      const tokenData = await tokenRes.json();

      if (tokenData.provider === "telnyx") {
        const call = activeCallRef.current as { hangup?: () => void } | null;
        call?.hangup?.();
      } else {
        const { Device } = await import("@twilio/voice-sdk");
        const device = twilioDeviceRef.current as InstanceType<typeof Device> | null;
        device?.disconnectAll();
      }
    }
    stopTimer();
    setCallState("ended");
    logCallEnd("Answered");
  }

  // ── Mute ──────────────────────────────────────────────────────────────────
  async function toggleMute() {
    if (callMode === "human") {
      const tokenRes  = await fetch("/api/dialer/token");
      const tokenData = await tokenRes.json();

      if (tokenData.provider === "telnyx") {
        const call = activeCallRef.current as { muteAudio?: () => void; unmuteAudio?: () => void } | null;
        if (!muted) call?.muteAudio?.(); else call?.unmuteAudio?.();
      } else {
        const call = activeCallRef.current as { mute: (v: boolean) => void } | null;
        call?.mute(!muted);
      }
    }
    setMuted(v => !v);
  }

  // ── Log the completed call and advance queue ───────────────────────────────
  function logCallEnd(result: string) {
    const duration = fmtSeconds(callSeconds);
    setCallLog(log => [
      { name: currentLead.name, company: currentLead.company, result, duration, outcome: result === "Answered" ? "good" : result === "Voicemail" ? "warn" : "neutral" },
      ...log.slice(0, 9),
    ]);
    if (result === "Answered") setStats(s => ({ ...s, answered: s.answered + 1 }));
    if (result === "Voicemail") setStats(s => ({ ...s, voicemail: s.voicemail + 1 }));

    setQueue(q => {
      const updated = q.map((l, i) => i === 0 ? { ...l, status: "done" as const } : l);
      const remaining = updated.filter(l => l.status === "queued");
      if (remaining.length > 0) {
        const nextIdx = updated.findIndex(l => l.status === "queued");
        updated[nextIdx] = { ...updated[nextIdx], status: "calling" };
        setCurrentLead(updated[nextIdx]);
      }
      return updated;
    });
    setTimeout(() => setCallState("idle"), 1500);
  }

  // ── Skip ──────────────────────────────────────────────────────────────────
  function skip() {
    if (callState === "active" || callState === "ringing") hangUp();
    logCallEnd("Skipped");
  }

  // ── AI script optimize ────────────────────────────────────────────────────
  function handleOptimize() {
    if (optimizing || optimized) return;
    setOptimizing(true);
    setTimeout(() => { setScriptText(scriptText + "\n\n[AI-optimised version — edit above to customise]"); setOptimizing(false); setOptimized(true); }, 2000);
  }

  useEffect(() => { if (enabled && !optimized) handleOptimize(); }, [enabled]); // eslint-disable-line

  // ── Derived ───────────────────────────────────────────────────────────────
  const isLive    = callState === "active";
  const isBusy    = callState === "connecting" || callState === "ringing" || callState === "active";
  const queueLeft = queue.filter(l => l.status === "queued").length;

  const STATS_DISPLAY = [
    { label: "Called",    value: String(stats.called),    icon: Phone,        color: "text-zinc-800 dark:text-zinc-100" },
    { label: "Answered",  value: String(stats.answered),  icon: CheckCircle2, color: "text-emerald-500"                 },
    { label: "Voicemail", value: String(stats.voicemail), icon: PhoneOff,     color: "text-amber-500"                   },
    { label: "In Queue",  value: String(queueLeft),       icon: Users,        color: "text-blue-500"                    },
  ];

  return (
    <div className="px-8 py-7 max-w-[1300px]">
      <style>{`
        @keyframes ripple  { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes waveBar { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
      `}</style>

      {showSetup && <SetupGuide onClose={() => setShowSetup(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Power Dialer</h1>
          <p className="text-[13px] text-zinc-400 mt-1">Sequential auto-dialing with live scripts and AI call summaries.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <DeviceBadge state={deviceState} mode={callMode} />
            {(deviceState === "no_credentials" || deviceState === "error") && (
              <button onClick={() => setShowSetup(true)} className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">
                <Settings className="w-3 h-3" /> Set up
              </button>
            )}
          </div>
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
            {(["human", "ai"] as CallMode[]).map(mode => (
              <button key={mode} onClick={() => { setCallMode(mode); setCallState("idle"); }}
                className={cn("flex items-center gap-1.5 px-3 h-7 rounded-lg text-[12px] font-medium transition-all",
                  callMode === mode ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>
                {mode === "human" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                {mode === "human" ? "Human" : "AI Agent"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* No number banner */}
      {!activeNumber && (
        <div className="flex items-center gap-4 px-5 py-4 mb-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/60 dark:bg-zinc-800/30">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[18px]">📞</div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">No phone number configured</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Get a number to start making real calls — $1/month, any country</p>
          </div>
          <Link
            href="/settings/numbers"
            className="flex-shrink-0 h-9 px-4 rounded-xl text-[12px] font-semibold text-white brand-btn flex items-center gap-1.5"
          >
            Get a Number →
          </Link>
        </div>
      )}

      {/* Active number badge */}
      {activeNumber && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <p className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400 font-mono">{activeNumber}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-500">· ready to dial</span>
          <Link href="/settings/numbers" className="text-[10px] text-emerald-500 hover:underline ml-1">change</Link>
        </div>
      )}

      {/* Active AI agent badge (AI mode only) */}
      {callMode === "ai" && (
        <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 w-fit">
          {activeAgent?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeAgent.avatar} alt={activeAgent.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0 bg-zinc-100 dark:bg-zinc-800" />
          ) : (
            <Bot className="w-3.5 h-3.5 flex-shrink-0" style={{ color: branding.primaryColor }} />
          )}
          <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
            AI Agent: {activeAgent?.name ?? "Default"}
          </p>
          <Link
            href="/agents"
            title="Manage AI agents"
            className="ml-1.5 flex items-center gap-1 h-6 px-2.5 rounded-lg text-[11px] font-semibold transition-all hover:brightness-95 active:scale-95"
            style={{ color: branding.primaryColor, background: `${branding.primaryColor}14`, border: `1px solid ${branding.primaryColor}33` }}
          >
            <Settings className="w-3 h-3" strokeWidth={2.25} /> Manage
          </Link>
        </div>
      )}

      <div className="flex gap-5 items-start">

        {/* ── Left: Active Call ─────────────────────────────────────────── */}
        <div className="w-[288px] flex-shrink-0 flex flex-col gap-3">

          {/* Active Call Card */}
          <div className="rounded-2xl overflow-hidden shadow-lg border border-zinc-100 dark:border-zinc-800"
            style={{ boxShadow: `0 8px 32px ${branding.primaryColor}18` }}>

            <div className="relative flex flex-col items-center px-6 pt-8 pb-6 overflow-hidden"
              style={{ background: `linear-gradient(145deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>

              {isLive && (<>
                <span className="absolute w-32 h-32 rounded-full border border-white/15" style={{ animation: "ripple 2s ease-out infinite" }} />
                <span className="absolute w-32 h-32 rounded-full border border-white/10" style={{ animation: "ripple 2s ease-out 0.6s infinite" }} />
              </>)}

              <div className="relative z-10 mb-4">
                <div className="p-1 rounded-full bg-white/20 backdrop-blur-sm">
                  <Avatar name={currentLead.name} size={64} />
                </div>
                {isLive && <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-[0_0_0_3px_rgba(52,211,153,0.3)]" />}
              </div>

              <p className="relative z-10 text-[16px] font-semibold text-white tracking-tight">{currentLead.name}</p>
              <p className="relative z-10 text-[12px] text-white/70 mt-0.5">{currentLead.company}</p>
              <p className="relative z-10 text-[11px] text-white/50 font-mono mt-0.5">{currentLead.phone}</p>

              {/* State pill */}
              <div className="relative z-10 flex items-center gap-2 mt-4 bg-black/20 backdrop-blur-sm rounded-full px-4 py-1.5">
                {callState === "idle" && <span className="text-[13px] font-mono font-semibold text-white/60">Ready</span>}
                {callState === "connecting" && <><Loader2 className="w-3.5 h-3.5 text-white animate-spin" /><span className="text-[13px] font-mono font-semibold text-white">Connecting…</span></>}
                {callState === "ringing"    && <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /><span className="text-[13px] font-mono font-semibold text-white">Ringing…</span></>}
                {callState === "active"     && <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[14px] font-mono font-semibold text-white tabular-nums">{fmtSeconds(callSeconds)}</span></>}
                {callState === "ended"      && <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /><span className="text-[13px] font-mono font-semibold text-white">Call ended</span></>}
              </div>

              {/* Waveform — only visible when active */}
              {isLive && (
                <div className="relative z-10 flex items-end gap-[3px] h-6 mt-4">
                  {[4,7,10,6,12,8,5,11,7,9,4,8,11,6,10,7,5,9,6,8].map((h, i) => (
                    <span key={i} className="w-[3px] rounded-full bg-white/50"
                      style={{ height: `${h * 2}px`, animation: `waveBar 0.7s ease-in-out ${i * 50}ms infinite alternate` }} />
                  ))}
                </div>
              )}

              {/* AI badge for AI mode */}
              {callMode === "ai" && (
                <div className="relative z-10 mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-white/70 bg-black/20 rounded-full px-3 py-1">
                  <Bot className="w-3 h-3" /> AI Agent handling this call
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-zinc-900 px-6 py-5">
              {callState === "idle" ? (
                /* Dial button */
                <button
                  onClick={dialCurrent}
                  disabled={deviceState === "no_credentials" || deviceState === "registering"}
                  className="w-full h-12 rounded-2xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`, boxShadow: `0 4px 16px ${branding.primaryColor}35` }}
                >
                  {callMode === "ai" ? <><Bot className="w-4 h-4" /> Start AI Call</> : <><Phone className="w-4 h-4" /> Dial Now</>}
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-around mb-4">
                    <button onClick={toggleMute} disabled={callMode === "ai"} className="flex flex-col items-center gap-1.5 disabled:opacity-40">
                      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center transition-all",
                        muted ? "bg-red-100 dark:bg-red-950/40 ring-2 ring-red-200 dark:ring-red-900" : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      )}>
                        {muted ? <MicOff className="w-4 h-4 text-red-500" strokeWidth={1.75} /> : <Mic className="w-4 h-4 text-zinc-500" strokeWidth={1.75} />}
                      </div>
                      <span className={cn("text-[10px] font-medium", muted ? "text-red-500" : "text-zinc-400")}>{muted ? "Unmute" : "Mute"}</span>
                    </button>

                    <button onClick={hangUp} className="flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center transition-all"
                        style={{ boxShadow: "0 4px 14px rgba(239,68,68,0.35)" }}>
                        <PhoneOff className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                      <span className="text-[10px] text-red-400 font-medium">End Call</span>
                    </button>

                    <button onClick={() => setSpeaker(v => !v)} disabled={callMode === "ai"} className="flex flex-col items-center gap-1.5 disabled:opacity-40">
                      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center transition-all",
                        speaker ? "bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-100 dark:ring-blue-900" : "bg-zinc-100 dark:bg-zinc-800"
                      )}>
                        {speaker ? <Volume2 className="w-4 h-4 text-blue-500" strokeWidth={1.75} /> : <VolumeX className="w-4 h-4 text-zinc-500" strokeWidth={1.75} />}
                      </div>
                      <span className={cn("text-[10px] font-medium", speaker ? "text-blue-500" : "text-zinc-400")}>Speaker</span>
                    </button>
                  </div>

                  <button onClick={skip} className="w-full h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[12px] font-medium text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5">
                    <SkipForward className="w-3.5 h-3.5" strokeWidth={1.75} /> Skip to Next
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Session panel — stats + connect rate in one cohesive card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">This session</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 dark:divide-zinc-800">
              {STATS_DISPLAY.map(s => (
                <div key={s.label} className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <s.icon className={cn("w-3.5 h-3.5", s.color)} strokeWidth={1.75} />
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">{s.label}</span>
                  </div>
                  <p className={cn("text-[24px] font-bold leading-none tabular-nums", s.color)}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
                  <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400">Connect Rate</span>
                </div>
                <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">
                  {stats.called > 0 ? Math.round((stats.answered / stats.called) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${stats.called > 0 ? Math.round((stats.answered / stats.called) * 100) : 0}%`,
                  background: `linear-gradient(90deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`,
                }} />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1.5">Industry avg: 18%</p>
            </div>
          </div>
        </div>

        {/* ── Center: Script + Notes ────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Call Script — talk track + full editor in one tabbed card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
                <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Call Script</p>
                <p className="text-[10px] text-zinc-400 truncate">Personalised for {currentLead.name}</p>
              </div>

              {isLive && (
                <span className="ml-2 flex items-center gap-1.5 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-emerald-500 font-medium">Live</span>
                </span>
              )}

              {/* Tab toggle */}
              <div className="ml-auto flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
                {([["track", "Talk Track"], ["full", "Full Script"]] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setScriptTab(key)}
                    className={cn("px-3 h-7 rounded-md text-[11.5px] font-medium transition-all",
                      scriptTab === key ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {scriptTab === "track" ? (
              <div className="px-5 py-4 flex flex-col gap-2">
                {AI_SCRIPT_LINES.map((line, i) => (
                  <button key={i} onClick={() => setScriptIdx(i)}
                    className={cn(
                      "w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all text-[13px] leading-relaxed",
                      scriptIdx === i ? "border-transparent text-white" : "border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30"
                    )}
                    style={scriptIdx === i ? { background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`, boxShadow: `0 4px 16px ${branding.primaryColor}30` } : {}}>
                    <span className={cn("text-[10px] font-bold mt-0.5 flex-shrink-0 tabular-nums", scriptIdx === i ? "text-white/60" : "text-zinc-300 dark:text-zinc-600")}>{String(i + 1).padStart(2, "0")}</span>
                    <span>{line}</span>
                    {scriptIdx === i && <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0 ml-auto mt-0.5" strokeWidth={2} />}
                  </button>
                ))}

                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => setScriptIdx(i => Math.max(0, i - 1))} disabled={scriptIdx === 0}
                    className="flex-1 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[12px] font-medium text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-30">
                    ← Previous
                  </button>
                  <button onClick={() => setScriptIdx(i => Math.min(AI_SCRIPT_LINES.length - 1, i + 1))} disabled={scriptIdx === AI_SCRIPT_LINES.length - 1}
                    className="flex-1 h-8 rounded-xl text-[12px] font-semibold text-white disabled:opacity-30 brand-btn">
                    Next Line →
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-5 pt-4">
                  {/* Script quality score */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] text-zinc-400 font-medium">Script quality</span>
                    <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: optimized ? "94%" : "71%", background: optimized ? `linear-gradient(90deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` : "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
                    </div>
                    <span className={cn("text-[12px] font-bold tabular-nums", optimized ? "text-emerald-500" : "text-amber-500")}>{optimized ? "94" : "71"}</span>
                  </div>
                  <textarea value={scriptText} onChange={e => { setScriptText(e.target.value); setOptimized(false); }} rows={11}
                    className="w-full text-[12.5px] leading-relaxed text-zinc-700 dark:text-zinc-300 bg-zinc-50/60 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-700/60 px-4 py-3 resize-none font-[inherit] outline-none transition-all focus:border-zinc-300 dark:focus:border-zinc-600" />
                </div>

                <div className="flex items-center gap-3 px-5 py-4">
                  <button onClick={handleOptimize} disabled={optimizing || optimized}
                    className={cn("flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold transition-all",
                      optimized ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-900 cursor-default"
                      : optimizing ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-wait border border-zinc-200 dark:border-zinc-700"
                      : "brand-btn")}>
                    {optimizing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Optimizing…</> : optimized ? <><CheckCircle2 className="w-3.5 h-3.5" />Optimised</> : <><Zap className="w-3.5 h-3.5" />Optimise with AI</>}
                  </button>
                  {optimized && <button onClick={() => { setScriptText(FULL_SCRIPT); setOptimized(false); }} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">Revert</button>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: Queue + Log ────────────────────────────────────────── */}
        <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">

          {/* Call Queue */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <ListOrdered className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
              <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">Queue</p>
              <span className="ml-auto text-[11px] text-zinc-400">{queueLeft} left</span>
            </div>
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {queue.filter(l => l.status !== "done" && l.status !== "skipped").map((item, i) => {
                const isCalling = item.status === "calling";
                return (
                  <div key={i} className={cn("flex items-center gap-3 px-4 py-3 transition-colors", isCalling ? "bg-emerald-50/50 dark:bg-emerald-950/20" : "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30")}>
                    <div className="relative flex-shrink-0">
                      <Avatar name={item.name} size={32} />
                      {isCalling && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-900" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[12px] font-medium leading-snug truncate", isCalling ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-800 dark:text-zinc-200")}>{item.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{item.company}</p>
                    </div>
                    {isCalling
                      ? <span className="text-[10px] font-semibold text-white bg-emerald-500 rounded-full px-2 py-0.5 flex-shrink-0">Live</span>
                      : <span className="text-[11px] text-zinc-300 dark:text-zinc-600 font-mono flex-shrink-0">#{i + 1}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Call Log */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.75} />
              <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">Today's Log</p>
              <span className="ml-auto text-[11px] text-zinc-400">{callLog.length} calls</span>
            </div>
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {callLog.map((log, i) => {
                const cfg = OUTCOME_CFG[log.outcome as keyof typeof OUTCOME_CFG];
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border", cfg.bg, cfg.border)}>
                      <cfg.Icon className={cn("w-3 h-3", cfg.color)} strokeWidth={log.outcome === "neutral" ? 1.75 : 0} fill={log.outcome !== "neutral" ? "currentColor" : "none"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200 truncate leading-snug">{log.name}</p>
                      <p className="text-[10px] text-zinc-400">{log.result}</p>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono flex-shrink-0">{log.duration}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
