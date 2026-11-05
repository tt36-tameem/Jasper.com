"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemeStyle   = "minimal" | "tinted";
export type CornerRadius = "sharp" | "rounded" | "soft";
export type FontStyle    = "sans" | "system" | "serif" | "mono";
export type ButtonStyle  = "gradient" | "solid" | "outline";

export interface BrandingConfig {
  companyName:  string;
  tagline:      string;
  logoUrl:      string;
  primaryColor: string;
  accentColor:  string;
  themeStyle:   ThemeStyle;
  cornerRadius: CornerRadius;
  fontStyle:    FontStyle;
  buttonStyle:  ButtonStyle;
  aiLabel:      string;
  addressAs:    string;   // what the voice assistant calls the user, e.g. "sir"
  voiceGreeting:boolean;  // play the daily voice briefing on login
  elevenVoiceId:string;   // ElevenLabs voice id (empty = server default)
  configured:   boolean;
  systemPrompt: string;
}

const DEFAULTS: BrandingConfig = {
  companyName:  "Jacsper",
  tagline:      "",
  logoUrl:      "/jacsper-logo.png",
  primaryColor: "#18181b",
  accentColor:  "#52525b",
  themeStyle:   "tinted",
  cornerRadius: "rounded",
  fontStyle:    "sans",
  buttonStyle:  "gradient",
  aiLabel:      "Jacsper Mode",
  addressAs:    "",
  voiceGreeting:true,
  elevenVoiceId:"",
  configured:   false,
  systemPrompt: "",
};

export const RADIUS_MAP: Record<CornerRadius, string> = {
  sharp:   "0.25rem",
  rounded: "0.5rem",
  soft:    "0.9rem",
};

export const FONT_MAP: Record<FontStyle, string> = {
  sans:   "var(--font-inter), system-ui, sans-serif",
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  serif:  "Georgia, Cambria, 'Times New Roman', serif",
  mono:   "var(--font-geist-mono), ui-monospace, monospace",
};

const STORAGE_KEY = "jacsper-branding";

interface BrandingContextValue {
  branding:      BrandingConfig;
  brandingReady: boolean;
  saveBranding:  (patch: Partial<BrandingConfig>) => void;
  resetBranding: () => void;
}

const BrandingContext = createContext<BrandingContextValue>({
  branding:      DEFAULTS,
  brandingReady: false,
  saveBranding:  () => {},
  resetBranding: () => {},
});

export function useBranding() {
  return useContext(BrandingContext);
}


function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function BrandStyles({
  primary, accent, themeStyle, cornerRadius, fontStyle, buttonStyle,
}: {
  primary:      string;
  accent:       string;
  themeStyle:   ThemeStyle;
  cornerRadius: CornerRadius;
  fontStyle:    FontStyle;
  buttonStyle:  ButtonStyle;
}) {
  const rgb    = hexToRgb(primary);
  const radius = RADIUS_MAP[cornerRadius];
  const font   = FONT_MAP[fontStyle];

  /* Button fill varies by buttonStyle */
  const buttonFill =
    buttonStyle === "solid"
      ? `background: ${primary} !important; color: #fff !important;`
      : buttonStyle === "outline"
        ? `background: transparent !important; color: ${primary} !important; box-shadow: inset 0 0 0 1.5px ${primary} !important;`
        : `background: linear-gradient(135deg, ${primary} 0%, ${accent} 100%) !important; color: #fff !important;`;

  /* Rules applied regardless of themeStyle */
  const base = `
    :root, html.dark {
      --brand-primary:     ${primary};
      --brand-accent:      ${accent};
      --brand-primary-rgb: ${rgb};
      --primary:           ${primary};
      --primary-foreground:#ffffff;
      --ring:              ${primary};
      --radius:            ${radius};
      --font-sans:         ${font};
    }

    body { font-family: ${font}; }

    /* buttons */
    .brand-btn {
      ${buttonFill}
    }
    .brand-btn:hover  { opacity: 0.88; }
    .brand-btn:active { transform: scale(0.98); }

    /* icon / text accent */
    .brand-icon-active { color: ${primary} !important; }

    /* active pill (sidebar) */
    .brand-pill-active {
      background: ${primary}22 !important;
      box-shadow: inset 0 0 0 1.5px ${primary}40 !important;
    }

    /* focus rings */
    *:focus-visible {
      outline: 2px solid ${primary}80 !important;
      outline-offset: 2px !important;
    }
    input:focus, textarea:focus, select:focus {
      border-color: ${primary}90 !important;
      box-shadow: 0 0 0 3px ${primary}20 !important;
      outline: none !important;
    }

    /* native checkboxes / radios */
    input[type="checkbox"], input[type="radio"] { accent-color: ${primary}; }

    /* text selection */
    ::selection { background: ${primary}35; }

    /* scrollbar */
    ::-webkit-scrollbar-thumb       { background: ${primary}35 !important; }
    ::-webkit-scrollbar-thumb:hover { background: ${primary}65 !important; }

    /* sidebar background + border */
    [data-sidebar] {
      background-image: linear-gradient(
        180deg,
        ${primary}20 0%,
        ${primary}0e 60%,
        ${primary}08 100%
      ) !important;
      border-right-color: ${primary}45 !important;
    }
  `;

  /* Extra rules that make the WHOLE page feel branded */
  const tinted = themeStyle === "tinted" ? `

    /* ═══════════════════════════════════════════════════
       LIGHT MODE
       ═══════════════════════════════════════════════════ */

    body {
      background-color: color-mix(in srgb, ${primary} 6%, #f9fafb) !important;
    }
    [data-brand-page] {
      background-color: color-mix(in srgb, ${primary} 5%, #f9fafb) !important;
    }
    [data-brand-page] .bg-white {
      background-color: color-mix(in srgb, ${primary} 4%, #ffffff) !important;
    }
    [data-brand-page] .bg-zinc-50 {
      background-color: color-mix(in srgb, ${primary} 6%, #fafafa) !important;
    }
    [data-brand-page] .bg-zinc-100 {
      background-color: color-mix(in srgb, ${primary} 9%, #f4f4f5) !important;
    }
    [data-brand-page] input,
    [data-brand-page] textarea,
    [data-brand-page] select {
      background-color: color-mix(in srgb, ${primary} 3%, #ffffff) !important;
    }
    [data-brand-page] .border-zinc-100 { border-color: color-mix(in srgb, ${primary} 15%, #f4f4f5) !important; }
    [data-brand-page] .border-zinc-200 { border-color: color-mix(in srgb, ${primary} 12%, #e4e4e7) !important; }
    [data-brand-page] .hover\\:bg-zinc-50\\/60:hover {
      background-color: color-mix(in srgb, ${primary} 6%, rgba(250,250,250,0.6)) !important;
    }

    /* ═══════════════════════════════════════════════════
       DARK MODE — CSS custom property overrides
       These feed every element that uses Tailwind semantic
       tokens (bg-background, bg-card, bg-muted, etc.).
       html.dark specificity (0-1-1) beats globals.css
       .dark (0-1-0) so these always win.
       ═══════════════════════════════════════════════════ */

    html.dark {
      --background: color-mix(in srgb, ${primary} 18%, oklch(0.09 0.003 286));
      --card:       color-mix(in srgb, ${primary} 20%, oklch(0.13 0.003 286));
      --popover:    color-mix(in srgb, ${primary} 20%, oklch(0.13 0.003 286));
      --muted:      color-mix(in srgb, ${primary} 24%, oklch(0.19 0.003 286));
      --secondary:  color-mix(in srgb, ${primary} 24%, oklch(0.19 0.003 286));
      --accent:     color-mix(in srgb, ${primary} 24%, oklch(0.19 0.003 286));
      --border:     color-mix(in srgb, ${primary} 28%, oklch(0.24 0.003 286));
      --input:      color-mix(in srgb, ${primary} 28%, oklch(0.24 0.003 286));
      --sidebar:    color-mix(in srgb, ${primary} 20%, oklch(0.11 0.003 286));
      --sidebar-accent: color-mix(in srgb, ${primary} 26%, oklch(0.19 0.003 286));
      --sidebar-border: color-mix(in srgb, ${primary} 26%, oklch(0.19 0.003 286));
    }

    /* ── Dark page shell ──────────────────────────────── */
    html.dark body {
      background-color: color-mix(in srgb, ${primary} 18%, #09090b) !important;
    }
    html.dark [data-brand-page] {
      background-color: color-mix(in srgb, ${primary} 16%, #09090b) !important;
    }

    /* ── Dark cards / panels ──────────────────────────── */
    /* Targets bg-white (light) and dark:bg-zinc-900 (dark companion) */
    html.dark [data-brand-page] .bg-white {
      background-color: color-mix(in srgb, ${primary} 22%, #18181b) !important;
    }
    /* Targets elements that only use dark:bg-zinc-900 (no bg-white) */
    html.dark [data-brand-page] .dark\\:bg-zinc-900 {
      background-color: color-mix(in srgb, ${primary} 22%, #18181b) !important;
    }
    /* Deepest background surfaces */
    html.dark [data-brand-page] .dark\\:bg-zinc-950 {
      background-color: color-mix(in srgb, ${primary} 16%, #09090b) !important;
    }
    /* Medium surfaces — inputs, hover trays, thread list bg */
    html.dark [data-brand-page] .bg-zinc-50,
    html.dark [data-brand-page] .dark\\:bg-zinc-800 {
      background-color: color-mix(in srgb, ${primary} 28%, #27272a) !important;
    }
    html.dark [data-brand-page] .bg-zinc-100 {
      background-color: color-mix(in srgb, ${primary} 32%, #3f3f46) !important;
    }
    /* Semi-transparent panel variants (backdrop-blur cards etc.) */
    html.dark [data-brand-page] .dark\\:bg-zinc-900\\/80 {
      background-color: color-mix(in srgb, ${primary} 22%, rgba(24,24,27,0.8)) !important;
    }
    html.dark [data-brand-page] .dark\\:bg-zinc-800\\/40 {
      background-color: color-mix(in srgb, ${primary} 28%, rgba(39,39,42,0.4)) !important;
    }
    html.dark [data-brand-page] .dark\\:bg-zinc-800\\/60 {
      background-color: color-mix(in srgb, ${primary} 28%, rgba(39,39,42,0.6)) !important;
    }

    /* ── Dark inputs / fields ─────────────────────────── */
    html.dark [data-brand-page] input,
    html.dark [data-brand-page] textarea,
    html.dark [data-brand-page] select {
      background-color: color-mix(in srgb, ${primary} 20%, #18181b) !important;
    }

    /* ── Dark borders ─────────────────────────────────── */
    html.dark [data-brand-page] .border-zinc-800,
    html.dark [data-brand-page] .dark\\:border-zinc-800 {
      border-color: color-mix(in srgb, ${primary} 30%, #27272a) !important;
    }
    html.dark [data-brand-page] .dark\\:border-zinc-700 {
      border-color: color-mix(in srgb, ${primary} 26%, #3f3f46) !important;
    }

    /* ── Dark sidebar ─────────────────────────────────── */
    html.dark [data-sidebar] {
      background-color: color-mix(in srgb, ${primary} 20%, rgba(17,17,19,0.85)) !important;
    }

  ` : "";

  return <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: base + tinted }} />;
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  // Always start from DEFAULTS so the first client render matches the
  // server-rendered HTML. The persisted value is loaded from localStorage in
  // the effect below, *after* hydration, to avoid a hydration mismatch.
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULTS);
  const [brandingReady, setBrandingReady] = useState(false);

  useEffect(() => {
    let loaded = DEFAULTS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = { ...DEFAULTS, ...JSON.parse(raw) } as BrandingConfig;
    } catch {}
    setBranding(loaded);
    setBrandingReady(true);
    if (loaded.companyName) document.title = loaded.companyName;
  }, []);

  const saveBranding = useCallback((patch: Partial<BrandingConfig>) => {
    setBranding((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      if (next.companyName) document.title = next.companyName;
      return next;
    });
  }, []);

  const resetBranding = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setBranding(DEFAULTS);
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, brandingReady, saveBranding, resetBranding }}>
      <BrandStyles
        primary={branding.primaryColor}
        accent={branding.accentColor}
        themeStyle={branding.themeStyle}
        cornerRadius={branding.cornerRadius}
        fontStyle={branding.fontStyle}
        buttonStyle={branding.buttonStyle}
      />
      {children}
    </BrandingContext.Provider>
  );
}
