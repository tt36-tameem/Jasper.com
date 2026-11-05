"use client";

import { useRef, useState } from "react";
import { Upload, Check, RotateCcw, Layers, Droplets, Sparkles, Square, Squircle, Circle, Type, AudioLines, Play } from "lucide-react";
import {
  useBranding,
  type ThemeStyle, type CornerRadius, type FontStyle, type ButtonStyle,
  RADIUS_MAP, FONT_MAP,
} from "@/components/providers/BrandingProvider";
import { PageHeader } from "@/components/layout/page-header";
import { speakLines } from "@/lib/voice";
import { cn } from "@/lib/utils";

const THEME_STYLES: { value: ThemeStyle; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "minimal",
    label: "Minimal",
    description: "Brand color on buttons, sidebar & accents only",
    icon: Layers,
  },
  {
    value: "tinted",
    label: "Tinted",
    description: "Brand color washes through the entire app — pages, cards, borders",
    icon: Droplets,
  },
];

const CORNER_RADII: { value: CornerRadius; label: string; icon: React.ElementType }[] = [
  { value: "sharp",   label: "Sharp",   icon: Square   },
  { value: "rounded", label: "Rounded", icon: Squircle },
  { value: "soft",    label: "Soft",    icon: Circle   },
];

const FONT_STYLES: { value: FontStyle; label: string }[] = [
  { value: "sans",   label: "Sans"   },
  { value: "system", label: "System" },
  { value: "serif",  label: "Serif"  },
  { value: "mono",   label: "Mono"   },
];

const BUTTON_STYLES: { value: ButtonStyle; label: string }[] = [
  { value: "gradient", label: "Gradient" },
  { value: "solid",    label: "Solid"    },
  { value: "outline",  label: "Outline"  },
];

const COLOR_PRESETS = [
  { primary: "#18181b", accent: "#52525b", label: "Mono"    },
  { primary: "#6366f1", accent: "#8b5cf6", label: "Indigo"  },
  { primary: "#0ea5e9", accent: "#6366f1", label: "Sky"     },
  { primary: "#10b981", accent: "#0ea5e9", label: "Emerald" },
  { primary: "#f59e0b", accent: "#ef4444", label: "Amber"   },
  { primary: "#ec4899", accent: "#8b5cf6", label: "Pink"    },
  { primary: "#1d4ed8", accent: "#0ea5e9", label: "Blue"    },
  { primary: "#dc2626", accent: "#f59e0b", label: "Red"     },
  { primary: "#7c3aed", accent: "#ec4899", label: "Violet"  },
];

export default function BrandingSettingsPage() {
  const { branding, saveBranding, resetBranding } = useBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const primaryRef   = useRef<HTMLInputElement>(null);
  const accentRef    = useRef<HTMLInputElement>(null);

  // Local text state so the inputs feel controlled while typing
  const [localName, setLocalName]       = useState(branding.companyName);
  const [localTagline, setLocalTagline] = useState(branding.tagline);
  const [localAiLabel, setLocalAiLabel] = useState(branding.aiLabel);
  const [localAddress, setLocalAddress] = useState(branding.addressAs);
  const [previewing, setPreviewing]     = useState(false);
  const [justSaved, setJustSaved]       = useState(false);

  function flash() {
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  }

  function handleName(value: string) {
    setLocalName(value);
    saveBranding({ companyName: value.trim() || "Jacsper" });
    flash();
  }

  function handleTagline(value: string) {
    setLocalTagline(value);
    saveBranding({ tagline: value });
    flash();
  }

  function handleAiLabel(value: string) {
    setLocalAiLabel(value);
    saveBranding({ aiLabel: value.trim() || "Jacsper Mode" });
    flash();
  }

  function handleLogo(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      saveBranding({ logoUrl: result });
      flash();
    };
    reader.readAsDataURL(file);
  }

  function handlePreset(primary: string, accent: string) {
    saveBranding({ primaryColor: primary, accentColor: accent });
    flash();
  }

  function handlePrimary(value: string) {
    saveBranding({ primaryColor: value });
    flash();
  }

  function handleAccent(value: string) {
    saveBranding({ accentColor: value });
    flash();
  }

  function handleAddress(value: string) {
    setLocalAddress(value);
    saveBranding({ addressAs: value });
    flash();
  }

  function handlePreviewVoice() {
    const addr = localAddress.trim();
    const honorific = addr ? `, ${addr}` : "";
    const hour = new Date().getHours();
    const partOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    setPreviewing(true);
    speakLines(
      [
        `Good ${partOfDay}${honorific}. Welcome back.`,
        `Please check your inbox.`,
        `Please review your latest reports.`,
        `You completed 34 outreaches today.`,
      ],
      { voiceId: branding.elevenVoiceId, onLine: (line) => { if (line === null) setPreviewing(false); } }
    );
  }

  function handleReset() {
    resetBranding();
    setLocalName("Jacsper");
    setLocalTagline("");
    setLocalAiLabel("Jacsper Mode");
    setLocalAddress("");
  }

  const { primaryColor, accentColor, logoUrl } = branding;
  const initials = localName.trim().slice(0, 2).toUpperCase() || "J";

  return (
    <div className="px-8 py-7 max-w-[720px]">
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Branding"
          description="Customize your workspace logo, company name, and colors."
        />
        {justSaved && (
          <div className="flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5" />
            Saved
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">

        {/* Company Name */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
            Company Name
          </label>
          <input
            type="text"
            value={localName}
            onChange={(e) => handleName(e.target.value)}
            placeholder="Acme Inc."
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[14px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all"
          />

          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3 mt-5">
            Tagline
          </label>
          <input
            type="text"
            value={localTagline}
            onChange={(e) => handleTagline(e.target.value)}
            placeholder="Your autonomous sales OS"
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[14px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all"
          />
          <p className="text-[11px] text-zinc-400 mt-1.5">A short subtitle shown alongside your company name.</p>
        </div>

        {/* Logo */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
            Logo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span
                  className="text-lg font-bold text-white w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
                >
                  {initials}
                </span>
              )}
            </div>
            <div className="flex-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
                Upload new logo
              </button>
              <p className="text-[11px] text-zinc-400 mt-1.5">PNG, SVG, or JPG · Transparent background recommended</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogo(f); }}
            />
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
            Brand Colors
          </label>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {COLOR_PRESETS.map((preset) => {
              const active = preset.primary === primaryColor && preset.accent === accentColor;
              return (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset.primary, preset.accent)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all",
                    active
                      ? "border-transparent shadow-sm"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                  )}
                  style={active ? { background: `${preset.primary}12`, color: preset.primary, borderColor: `${preset.primary}30` } : {}}
                >
                  <span className="w-3 h-3 rounded-full" style={{ background: preset.primary }} />
                  <span className="w-3 h-3 rounded-full -ml-1.5" style={{ background: preset.accent }} />
                  {preset.label}
                  {active && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Custom pickers */}
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[11px] text-zinc-400 mb-1.5">Primary color</p>
              <button
                onClick={() => primaryRef.current?.click()}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 transition-colors"
              >
                <span className="w-5 h-5 rounded-md flex-shrink-0 ring-1 ring-black/10" style={{ background: primaryColor }} />
                <span className="text-[12px] font-mono text-zinc-600 dark:text-zinc-400">{primaryColor}</span>
              </button>
              <input
                ref={primaryRef}
                type="color"
                value={primaryColor}
                onChange={(e) => handlePrimary(e.target.value)}
                className="sr-only"
              />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-zinc-400 mb-1.5">Accent color</p>
              <button
                onClick={() => accentRef.current?.click()}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 transition-colors"
              >
                <span className="w-5 h-5 rounded-md flex-shrink-0 ring-1 ring-black/10" style={{ background: accentColor }} />
                <span className="text-[12px] font-mono text-zinc-600 dark:text-zinc-400">{accentColor}</span>
              </button>
              <input
                ref={accentRef}
                type="color"
                value={accentColor}
                onChange={(e) => handleAccent(e.target.value)}
                className="sr-only"
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
            Preview
          </label>
          <div className="flex rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 h-40">
            <div
              className="w-12 flex flex-col items-center py-3 gap-2"
              style={{ background: `linear-gradient(180deg, ${primaryColor}18 0%, ${primaryColor}08 100%)`, borderRight: `1px solid ${primaryColor}20` }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white mb-1 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="w-full h-full object-contain" />
                ) : initials}
              </div>
              {/* Active nav item */}
              <div className="w-6 h-5 rounded-md" style={{ background: `${primaryColor}25` }} />
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-6 h-5 rounded-md bg-zinc-200/60 dark:bg-zinc-700/40" />
              ))}
            </div>
            <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <div className="h-2.5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div
                  className="h-5 w-10 rounded-lg text-[8px] font-semibold text-white flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
                >
                  + New
                </div>
              </div>
              {[1, 0.7, 0.5].map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ background: `${primaryColor}${Math.round(o * 60).toString(16).padStart(2,"0")}` }} />
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-1" style={{ opacity: 0.4 + o * 0.4 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Theme Style */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
            Theme Style
          </label>
          <div className="grid grid-cols-2 gap-3">
            {THEME_STYLES.map(({ value, label, description, icon: Icon }) => {
              const active = branding.themeStyle === value;
              return (
                <button
                  key={value}
                  onClick={() => { saveBranding({ themeStyle: value }); flash(); }}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all",
                    active
                      ? "border-transparent shadow-sm"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  )}
                  style={active ? { background: `${branding.primaryColor}10`, borderColor: `${branding.primaryColor}35` } : {}}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: active ? `${branding.primaryColor}20` : undefined }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: active ? branding.primaryColor : undefined }}
                      />
                    </div>
                    {active && (
                      <Check className="w-3.5 h-3.5" style={{ color: branding.primaryColor }} />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{label}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Corner Radius */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
            Corner Style
          </label>
          <div className="grid grid-cols-3 gap-3">
            {CORNER_RADII.map(({ value, label, icon: Icon }) => {
              const active = branding.cornerRadius === value;
              return (
                <button
                  key={value}
                  onClick={() => { saveBranding({ cornerRadius: value }); flash(); }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 border text-center transition-all",
                    active
                      ? "border-transparent shadow-sm"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  )}
                  style={{
                    borderRadius: RADIUS_MAP[value],
                    ...(active ? { background: `${primaryColor}10`, borderColor: `${primaryColor}35` } : {}),
                  }}
                >
                  <div
                    className="w-8 h-8 border-2 flex items-center justify-center"
                    style={{ borderRadius: RADIUS_MAP[value], borderColor: active ? primaryColor : undefined }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: active ? primaryColor : undefined }} />
                  </div>
                  <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
            Typography
          </label>
          <div className="grid grid-cols-2 gap-3">
            {FONT_STYLES.map(({ value, label }) => {
              const active = branding.fontStyle === value;
              return (
                <button
                  key={value}
                  onClick={() => { saveBranding({ fontStyle: value }); flash(); }}
                  className={cn(
                    "flex items-center justify-between gap-2 px-4 py-3 rounded-lg border text-left transition-all",
                    active
                      ? "border-transparent shadow-sm"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  )}
                  style={active ? { background: `${primaryColor}10`, borderColor: `${primaryColor}35` } : {}}
                >
                  <div className="flex items-center gap-2.5">
                    <Type className="w-3.5 h-3.5 flex-shrink-0" style={{ color: active ? primaryColor : undefined }} />
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{label}</p>
                      <p className="text-[15px] leading-none mt-1 text-zinc-500 dark:text-zinc-400" style={{ fontFamily: FONT_MAP[value] }}>Ag</p>
                    </div>
                  </div>
                  {active && <Check className="w-3.5 h-3.5" style={{ color: primaryColor }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Button Style */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
            Button Style
          </label>
          <div className="grid grid-cols-3 gap-3">
            {BUTTON_STYLES.map(({ value, label }) => {
              const active = branding.buttonStyle === value;
              const fill =
                value === "solid"
                  ? { background: primaryColor, color: "#fff" }
                  : value === "outline"
                    ? { background: "transparent", color: primaryColor, boxShadow: `inset 0 0 0 1.5px ${primaryColor}` }
                    : { background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`, color: "#fff" };
              return (
                <button
                  key={value}
                  onClick={() => { saveBranding({ buttonStyle: value }); flash(); }}
                  className={cn(
                    "flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all",
                    active
                      ? "border-transparent shadow-sm"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  )}
                  style={active ? { background: `${primaryColor}10`, borderColor: `${primaryColor}35` } : {}}
                >
                  <span
                    className="px-4 py-1.5 rounded-lg text-[11px] font-semibold"
                    style={fill}
                  >
                    Button
                  </span>
                  <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                    {label}
                    {active && <Check className="w-3 h-3" style={{ color: primaryColor }} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Assistant Label */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            AI Assistant Name
          </label>
          <input
            type="text"
            value={localAiLabel}
            onChange={(e) => handleAiLabel(e.target.value)}
            placeholder="Jacsper Mode"
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[14px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all"
          />
          <p className="text-[11px] text-zinc-400 mt-1.5">Rename the floating AI assistant to match your brand.</p>
        </div>

        {/* Voice Briefing */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <AudioLines className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                Daily Voice Briefing
              </label>
              <p className="text-[11px] text-zinc-400 mt-1">
                Once every 24h on login, a voice greets the user and points them to their inbox, reports & outreach count.
              </p>
            </div>

            {/* Enable toggle */}
            <button
              onClick={() => { saveBranding({ voiceGreeting: !branding.voiceGreeting }); flash(); }}
              role="switch"
              aria-checked={branding.voiceGreeting}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 mt-0.5",
                branding.voiceGreeting ? "" : "bg-zinc-200 dark:bg-zinc-700"
              )}
              style={branding.voiceGreeting ? { background: primaryColor } : {}}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300"
                style={{ transform: branding.voiceGreeting ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </div>

          <div className={cn("transition-opacity", branding.voiceGreeting ? "opacity-100" : "opacity-40 pointer-events-none")}>
            <label className="text-[11px] text-zinc-400 block mb-1.5">What should the assistant call the user?</label>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={localAddress}
                onChange={(e) => handleAddress(e.target.value)}
                placeholder="e.g. sir, boss, Mr. Wayne"
                className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[14px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all"
              />
              <button
                onClick={handlePreviewVoice}
                disabled={previewing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium text-white whitespace-nowrap transition-opacity disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
              >
                {previewing
                  ? <><AudioLines className="w-3.5 h-3.5 animate-pulse" /> Playing…</>
                  : <><Play className="w-3.5 h-3.5 fill-current" /> Test voice</>}
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 mt-1.5">
              Preview: <span className="italic">&ldquo;Good morning{localAddress.trim() ? `, ${localAddress.trim()}` : ""}. Welcome back. Please check your inbox…&rdquo;</span>
            </p>
          </div>
        </div>

        {/* Reset */}
        <div className="flex justify-start">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            Reset to defaults
          </button>
        </div>

      </div>
    </div>
  );
}
