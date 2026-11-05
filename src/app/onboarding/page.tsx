"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check, ArrowRight, Palette, Layers, Droplets } from "lucide-react";
import { useBranding, type ThemeStyle } from "@/components/providers/BrandingProvider";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { primary: "#18181b", accent: "#52525b", label: "Mono"   },
  { primary: "#6366f1", accent: "#8b5cf6", label: "Indigo" },
  { primary: "#0ea5e9", accent: "#6366f1", label: "Sky"    },
  { primary: "#10b981", accent: "#0ea5e9", label: "Emerald"},
  { primary: "#f59e0b", accent: "#ef4444", label: "Amber"  },
  { primary: "#ec4899", accent: "#8b5cf6", label: "Pink"   },
  { primary: "#1d4ed8", accent: "#0ea5e9", label: "Blue"   },
  { primary: "#dc2626", accent: "#f59e0b", label: "Red"    },
  { primary: "#7c3aed", accent: "#ec4899", label: "Violet" },
];

const THEME_STYLES: { value: ThemeStyle; label: string; hint: string; icon: React.ElementType }[] = [
  { value: "minimal",  label: "Minimal", hint: "Sidebar & buttons only",        icon: Layers   },
  { value: "tinted",   label: "Tinted",  hint: "Whole app tinted by brand color", icon: Droplets },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { branding, saveBranding } = useBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const primaryRef   = useRef<HTMLInputElement>(null);
  const accentRef    = useRef<HTMLInputElement>(null);

  const [companyName,   setCompanyName]   = useState(branding.companyName === "Jacsper" ? "" : branding.companyName);
  const [logoUrl,       setLogoUrl]       = useState(branding.logoUrl === "/jacsper-logo.png" ? "" : branding.logoUrl);
  const [primaryColor,  setPrimaryColor]  = useState(branding.primaryColor);
  const [accentColor,   setAccentColor]   = useState(branding.accentColor);
  const [themeStyle,    setThemeStyle]    = useState<ThemeStyle>(branding.themeStyle);
  const [logoPreview,   setLogoPreview]   = useState(logoUrl);
  const [dragging,      setDragging]      = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoUrl(result);
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleLaunch() {
    saveBranding({
      companyName: companyName.trim() || "Jacsper",
      logoUrl:     logoUrl || "/jacsper-logo.png",
      primaryColor,
      accentColor,
      themeStyle,
      configured:  true,
    });
    router.push("/dashboard");
  }

  const initials = (companyName.trim() || "J").slice(0, 2).toUpperCase();
  const displayName = companyName.trim() || "Your Company";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">

      {/* Header */}
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium mb-5 border"
          style={{
            background: `${primaryColor}14`,
            borderColor: `${primaryColor}30`,
            color: primaryColor,
          }}
        >
          <Palette className="w-3 h-3" />
          Brand Setup
        </div>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Make it yours
        </h1>
        <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
          Customize your workspace with your brand. You can always change this later in Settings.
        </p>
      </div>

      <div className="w-full max-w-4xl flex gap-6 items-start">

        {/* ── LEFT: Form ── */}
        <div className="flex-1 flex flex-col gap-5">

          {/* Company name */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
            <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[14px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all"
              style={{ focusRingColor: primaryColor } as React.CSSProperties}
            />
          </div>

          {/* Logo upload */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
            <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
              Logo
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2 py-8",
                dragging
                  ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              )}
            >
              {logoPreview ? (
                <div className="flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg" />
                  <p className="text-[12px] text-zinc-500">Click to replace</p>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
                  </div>
                  <p className="text-[13px] text-zinc-600 dark:text-zinc-400 font-medium">Drop your logo here</p>
                  <p className="text-[11px] text-zinc-400">PNG, SVG, or JPG · Transparent background recommended</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
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
                    onClick={() => { setPrimaryColor(preset.primary); setAccentColor(preset.accent); }}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all",
                      active
                        ? "border-transparent ring-2 ring-offset-1 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400"
                    )}
                    style={active ? { background: `${preset.primary}12`, color: preset.primary, outline: `2px solid ${preset.primary}`, outlineOffset: "1px" } : {}}
                    title={preset.label}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: preset.primary }} />
                    <span className="w-3 h-3 rounded-full flex-shrink-0 -ml-1.5" style={{ background: preset.accent }} />
                    {preset.label}
                    {active && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Custom pickers */}
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-[11px] text-zinc-400 mb-1.5">Primary</p>
                <button
                  onClick={() => primaryRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 transition-colors hover:border-zinc-300"
                >
                  <span className="w-5 h-5 rounded-md flex-shrink-0 ring-1 ring-black/10" style={{ background: primaryColor }} />
                  <span className="text-[12px] font-mono text-zinc-600 dark:text-zinc-400">{primaryColor}</span>
                </button>
                <input ref={primaryRef} type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="sr-only" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-zinc-400 mb-1.5">Accent</p>
                <button
                  onClick={() => accentRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 transition-colors hover:border-zinc-300"
                >
                  <span className="w-5 h-5 rounded-md flex-shrink-0 ring-1 ring-black/10" style={{ background: accentColor }} />
                  <span className="text-[12px] font-mono text-zinc-600 dark:text-zinc-400">{accentColor}</span>
                </button>
                <input ref={accentRef} type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="sr-only" />
              </div>
            </div>
          </div>
        </div>

        {/* Theme Style */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
          <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
            Theme Style
          </label>
          <div className="grid grid-cols-2 gap-3">
            {THEME_STYLES.map(({ value, label, hint, icon: Icon }) => {
              const active = themeStyle === value;
              return (
                <button
                  key={value}
                  onClick={() => setThemeStyle(value)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all",
                    active ? "border-transparent shadow-sm" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                  )}
                  style={active ? { background: `${primaryColor}10`, borderColor: `${primaryColor}35` } : {}}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: active ? `${primaryColor}20` : "#f4f4f5" }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: active ? primaryColor : "#71717a" }} />
                    </div>
                    {active && <Check className="w-3.5 h-3.5" style={{ color: primaryColor }} />}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{label}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{hint}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Preview ── */}
        <div className="w-72 flex-shrink-0 sticky top-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm mb-4">
            <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">
              Preview
            </p>

            {/* Mini sidebar mockup */}
            <div className="flex rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 h-52 shadow-inner">
              {/* Sidebar */}
              <div
                className="w-12 flex flex-col items-center py-3 gap-2"
                style={{
                  background: `linear-gradient(180deg, ${primaryColor}18 0%, ${primaryColor}08 100%)`,
                  borderRight: `1px solid ${primaryColor}20`,
                }}
              >
                {/* Logo */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white mb-1 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
                  ) : (
                    initials
                  )}
                </div>
                {/* Nav dots */}
                {[0.9, 0.4, 0.4, 0.4, 0.4].map((opacity, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-md"
                    style={{ background: i === 0 ? `${primaryColor}30` : `${primaryColor}${Math.round(opacity * 16).toString(16)}` }}
                  />
                ))}
              </div>
              {/* Content */}
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 p-3 flex flex-col gap-2">
                {/* Header bar */}
                <div className="flex items-center justify-between mb-1">
                  <div className="h-3 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  <div
                    className="h-6 w-12 rounded-lg text-[9px] font-semibold text-white flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
                  >
                    + New
                  </div>
                </div>
                {/* Rows */}
                {[1, 0.7, 0.5, 0.4].map((opacity, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: `${primaryColor}${Math.round(opacity * 60).toString(16).padStart(2, "0")}` }} />
                    <div className="h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-1" style={{ opacity: 0.4 + opacity * 0.4 }} />
                    <div className="h-2 w-8 rounded-full" style={{ background: `${primaryColor}30` }} />
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-[12px] font-medium text-zinc-600 dark:text-zinc-400 mt-3">
              {displayName}
            </p>
          </div>

          {/* Launch button */}
          <button
            onClick={handleLaunch}
            className="w-full py-3.5 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
              boxShadow: `0 8px 24px ${primaryColor}40`,
            }}
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-[11px] text-zinc-400 mt-2">
            You can change this any time in Settings → Branding
          </p>
        </div>

      </div>
    </div>
  );
}
