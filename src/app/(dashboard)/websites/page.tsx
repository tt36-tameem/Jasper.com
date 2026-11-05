"use client";

import { useState, useRef, useEffect, isValidElement, cloneElement } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useBranding } from "@/components/providers/BrandingProvider";
import { useUsage } from "@/components/providers/UsageProvider";
import { cn } from "@/lib/utils";
import {
  Plus, Eye, Copy, Trash2, Pencil, ExternalLink, CheckCircle2,
  Clock, TrendingUp, Users, X, ArrowUpRight, Smartphone,
  Monitor, Tablet, ChevronRight, Search, ChevronUp, ChevronDown, Globe,
  AlignLeft, AlignCenter, AlignRight, Type,
  Sparkles, RefreshCw, Upload,
  Bold, Italic, Underline, Strikethrough, Link2,
  Mic, ArrowUp, Calendar, Image as ImageIcon, Layers,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Device  = "desktop" | "tablet" | "mobile";
type Tab     = "sites" | "templates";
type SiteSt  = "published" | "draft";
type TplCat  = "All" | "Landing Page" | "Funnel" | "Website" | "Event";

interface Theme {
  pageBg: string; navBg: string; navBorder: string;
  heroBg: string; heroOrb: string;
  sectionBg: string; altBg: string;
  cardBg: string; cardBorder: string;
  text: string; muted: string; subtle: string;
  accent: string; accentText: string; accentGlow: string; accentMuted: string;
}

type SectionType = "nav"|"hero"|"logobar"|"features"|"testimonials"|"pricing"|"cta"|"form";

interface NavData     { logo:string; links:string[]; cta:string }
interface HeroData    { badge:string; headline:string; sub:string; cta1:string; cta2:string; mockup:boolean; image?:string }
interface LogoData    { headline:string; logos:string[] }
interface FeatData    { headline:string; sub:string; items:{icon:string;title:string;desc:string}[] }
interface TestimData  { items:{quote:string;name:string;role:string;initials:string;color:string}[] }
interface PriceData   { headline:string; sub:string; tiers:{name:string;price:string;period:string;desc:string;features:string[];cta:string;featured?:boolean}[] }
interface CTAData     { headline:string; sub:string; cta:string; note:string }
interface FormData    { headline:string; sub:string; fields:{label:string;ph:string}[]; cta:string; note:string }

type SectionData = NavData|HeroData|LogoData|FeatData|TestimData|PriceData|CTAData|FormData;

interface ElStyle { color?:string; scale?:number; font?:string }

function normalizeUrl(u: string): string {
  const t = u.trim();
  if (!t) return "";
  if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(t)) return t;
  return "https://" + t;
}

// Purple gradient used for the AI website builder accents.
const AI_GRAD = { from: "#7c3aed", to: "#c026d3" };

const WEB_FONTS: { label:string; stack:string }[] = [
  { label:"Default",   stack:"" },
  { label:"Sans",      stack:"ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  { label:"Serif",     stack:"ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" },
  { label:"Mono",      stack:"ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, monospace" },
  { label:"Rounded",   stack:"ui-rounded, 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', 'Quicksand', sans-serif" },
  { label:"Georgia",   stack:"Georgia, 'Times New Roman', serif" },
  { label:"Courier",   stack:"'Courier New', Courier, monospace" },
];
interface Sec { id:string; type:SectionType; data:SectionData; bg?:string; styles?:Record<string,ElStyle>; links?:Record<string,string> }
interface Template { id:number; name:string; cat:Exclude<TplCat,"All">; desc:string; badge:string; accent:string; theme:Theme; sections:Sec[] }
interface Site { id:number; name:string; slug:string; status:SiteSt; visits:number; leads:number; conv:string; updated:string; tplId:number; sections:Sec[]; theme:Theme }

// ─── Themes ───────────────────────────────────────────────────────────────────

const DARK_VIOLET: Theme = {
  pageBg:"#0a0a12", navBg:"#0a0a12", navBorder:"#ffffff0d",
  heroBg:"radial-gradient(ellipse 80% 60% at 50% -10%, #2e1065 0%, #0a0a12 70%)", heroOrb:"#7c3aed",
  sectionBg:"#0a0a12", altBg:"#0f0f1a",
  cardBg:"#13131f", cardBorder:"#ffffff0f",
  text:"#f4f4f6", muted:"#9090a8", subtle:"#525270",
  accent:"#7c3aed", accentText:"#fff", accentGlow:"#7c3aed40", accentMuted:"#7c3aed18",
};
const LIGHT_GREEN: Theme = {
  pageBg:"#f0fdf4", navBg:"#ffffff", navBorder:"#e2e8f0",
  heroBg:"radial-gradient(ellipse 80% 60% at 50% -10%, #bbf7d0 0%, #f0fdf4 70%)", heroOrb:"#059669",
  sectionBg:"#f0fdf4", altBg:"#ffffff",
  cardBg:"#ffffff", cardBorder:"#d1fae5",
  text:"#064e3b", muted:"#6b7280", subtle:"#9ca3af",
  accent:"#059669", accentText:"#fff", accentGlow:"#05966940", accentMuted:"#05966914",
};
const DARK_ZINC: Theme = {
  pageBg:"#09090b", navBg:"#09090b", navBorder:"#ffffff08",
  heroBg:"radial-gradient(ellipse 80% 50% at 50% -5%, #27272a 0%, #09090b 65%)", heroOrb:"#d4d4d8",
  sectionBg:"#09090b", altBg:"#111113",
  cardBg:"#18181b", cardBorder:"#ffffff0a",
  text:"#fafafa", muted:"#a1a1aa", subtle:"#52525b",
  accent:"#e4e4e7", accentText:"#09090b", accentGlow:"#e4e4e740", accentMuted:"#e4e4e714",
};
const LIGHT_BLUE: Theme = {
  pageBg:"#eff6ff", navBg:"#ffffff", navBorder:"#bfdbfe",
  heroBg:"radial-gradient(ellipse 80% 60% at 50% -10%, #bfdbfe 0%, #eff6ff 70%)", heroOrb:"#2563eb",
  sectionBg:"#eff6ff", altBg:"#ffffff",
  cardBg:"#ffffff", cardBorder:"#bfdbfe",
  text:"#1e3a8a", muted:"#6b7280", subtle:"#93c5fd",
  accent:"#2563eb", accentText:"#fff", accentGlow:"#2563eb40", accentMuted:"#2563eb14",
};
const LIGHT_RED: Theme = {
  pageBg:"#fff1f2", navBg:"#ffffff", navBorder:"#fecdd3",
  heroBg:"radial-gradient(ellipse 80% 60% at 50% -10%, #fecdd3 0%, #fff1f2 70%)", heroOrb:"#e11d48",
  sectionBg:"#fff1f2", altBg:"#ffffff",
  cardBg:"#ffffff", cardBorder:"#fecdd3",
  text:"#881337", muted:"#6b7280", subtle:"#fda4af",
  accent:"#e11d48", accentText:"#fff", accentGlow:"#e11d4840", accentMuted:"#e11d4814",
};
const LIGHT_ORANGE: Theme = {
  pageBg:"#fff7ed", navBg:"#ffffff", navBorder:"#fed7aa",
  heroBg:"radial-gradient(ellipse 80% 60% at 50% -10%, #fed7aa 0%, #fff7ed 70%)", heroOrb:"#ea580c",
  sectionBg:"#fff7ed", altBg:"#ffffff",
  cardBg:"#ffffff", cardBorder:"#fed7aa",
  text:"#431407", muted:"#78716c", subtle:"#fb923c",
  accent:"#ea580c", accentText:"#fff", accentGlow:"#ea580c40", accentMuted:"#ea580c14",
};
const LIGHT_PURPLE: Theme = {
  pageBg:"#fdf4ff", navBg:"#ffffff", navBorder:"#e9d5ff",
  heroBg:"radial-gradient(ellipse 80% 60% at 50% -10%, #e9d5ff 0%, #fdf4ff 70%)", heroOrb:"#9333ea",
  sectionBg:"#fdf4ff", altBg:"#ffffff",
  cardBg:"#ffffff", cardBorder:"#e9d5ff",
  text:"#3b0764", muted:"#6b7280", subtle:"#c084fc",
  accent:"#9333ea", accentText:"#fff", accentGlow:"#9333ea40", accentMuted:"#9333ea14",
};
const DARK_NAVY: Theme = {
  pageBg:"#020617", navBg:"#020617", navBorder:"#ffffff08",
  heroBg:"radial-gradient(ellipse 80% 60% at 50% -10%, #0c1445 0%, #020617 70%)", heroOrb:"#38bdf8",
  sectionBg:"#020617", altBg:"#0a0f2e",
  cardBg:"#0f172a", cardBorder:"#ffffff0a",
  text:"#f1f5f9", muted:"#94a3b8", subtle:"#334155",
  accent:"#38bdf8", accentText:"#0f172a", accentGlow:"#38bdf840", accentMuted:"#38bdf818",
};

// ─── Section renderers ────────────────────────────────────────────────────────

const s = (obj: Record<string,unknown>) => obj as React.CSSProperties;

interface EditCtx {
  secId: string;
  selPath: string | null;
  onSel: (path: string, value: string) => void;
  styles?: Record<string, ElStyle>;
  links?: Record<string, string>;
  readOnly?: boolean;
}

// Apply a per-element style override (color + size scale) to the rendered child.
function applyOverride(children: React.ReactNode, ov?: ElStyle): React.ReactNode {
  if (!ov || !isValidElement(children)) return children;
  const el = children as React.ReactElement<{ style?: React.CSSProperties }>;
  const base = el.props.style ?? {};
  const next: React.CSSProperties = { ...base };
  if (ov.color) next.color = ov.color;
  if (ov.font) next.fontFamily = ov.font;
  if (ov.scale && base.fontSize != null) {
    const fs = typeof base.fontSize === "number" ? base.fontSize : parseFloat(String(base.fontSize));
    if (!isNaN(fs)) next.fontSize = Math.round(fs * ov.scale);
  }
  return cloneElement(el, { style: next });
}

function SelWrap({ path, value, ctx, children, block = false, plain = false }: {
  path: string; value: string; ctx?: EditCtx;
  children: React.ReactNode; block?: boolean; plain?: boolean;
}) {
  const [hov, setHov] = useState(false);
  // Pure-text elements render their value as rich HTML (so bold/italic/links show);
  // `plain` elements (buttons, the badge pill) keep their composite markup.
  let base: React.ReactNode = children;
  if (!plain && isValidElement(children)) {
    base = cloneElement(children as React.ReactElement<{ children?: React.ReactNode }>,
      { dangerouslySetInnerHTML: { __html: value }, children: undefined } as Record<string, unknown>);
  }
  let kid = applyOverride(base, ctx?.styles?.[path]);
  const href = ctx?.links?.[path];
  if (href && (ctx?.readOnly || !ctx)) {
    kid = <a href={normalizeUrl(href)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>{kid}</a>;
  }
  if (!ctx || ctx.readOnly) return <>{kid}</>;
  const sel = ctx.selPath === path;
  return (
    <span
      onClick={e => { e.stopPropagation(); ctx.onSel(path, value); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: block ? "block" : "inline",
        cursor: "pointer",
        borderRadius: 4,
        boxShadow: sel ? "0 0 0 2px #3b82f6, 0 0 0 6px #3b82f622" : hov ? "0 0 0 2px #3b82f655" : "none",
        transition: "box-shadow 0.12s",
        position: "relative",
      }}
    >
      {sel && (
        <span style={{ position:"absolute", top:-20, left:0, background:"#3b82f6", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:"4px 4px 0 0", whiteSpace:"nowrap", zIndex:100, pointerEvents:"none", fontFamily:"system-ui" }}>
          ✏ Editing in panel →
        </span>
      )}
      {kid}
    </span>
  );
}

// Rich-text field for the properties panel — stores HTML, supports B/I/U/S on
// the highlighted text via execCommand.
function RichField({ value, onChange, multi }: { value: string; onChange: (html: string) => void; multi?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (document.activeElement !== el && el.innerHTML !== (value || "")) el.innerHTML = value || "";
  });
  const exec = (cmd: string) => { document.execCommand("styleWithCSS", false, "true"); document.execCommand(cmd); onChange(ref.current?.innerHTML ?? ""); };
  const tools: [string, React.ElementType, string][] = [["bold",Bold,"Bold"],["italic",Italic,"Italic"],["underline",Underline,"Underline"],["strikeThrough",Strikethrough,"Strikethrough"]];
  return (
    <div>
      <div className="flex items-center gap-0.5 mb-1.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-fit">
        {tools.map(([cmd, Icon, label]) => (
          <button key={cmd} title={label} onMouseDown={e => e.preventDefault()} onClick={() => exec(cmd)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors">
            <Icon className="w-3 h-3" strokeWidth={2.2} />
          </button>
        ))}
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        onBlur={() => onChange(ref.current?.innerHTML ?? "")}
        onKeyDown={multi ? undefined : e => { if (e.key === "Enter") e.preventDefault(); }}
        className={cn("w-full px-2.5 py-2 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-zinc-700 transition-all whitespace-pre-wrap", multi ? "min-h-[80px]" : "min-h-[36px]")} />
    </div>
  );
}

function NavRenderer({ data, theme, ctx }: { data: NavData; theme: Theme; ctx?: EditCtx }) {
  return (
    <div style={s({ background: theme.navBg, borderBottom: `1px solid ${theme.navBorder}`, padding: "0 48px", height: 64, display: "flex", alignItems: "center", gap: 40, position: "relative", zIndex: 10 })}>
      <SelWrap path="logo" value={data.logo} ctx={ctx}>
        <span style={s({ fontSize: 20, fontWeight: 800, color: theme.text, letterSpacing: "-0.04em", whiteSpace: "nowrap" })}>{data.logo}</span>
      </SelWrap>
      <div style={s({ flex: 1, display: "flex", justifyContent: "center", gap: 32 })}>
        {data.links.map((l, i) => (
          <SelWrap key={i} path={`links.${i}`} value={l} ctx={ctx}>
            <span style={s({ fontSize: 13, color: theme.muted, fontWeight: 500, whiteSpace: "nowrap" })}>{l}</span>
          </SelWrap>
        ))}
      </div>
      <SelWrap path="cta" value={data.cta} ctx={ctx} plain>
        <div style={s({ background: theme.accent, color: theme.accentText, padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" })}>{data.cta}</div>
      </SelWrap>
    </div>
  );
}

function HeroRenderer({ data, theme, ctx }: { data: HeroData; theme: Theme; ctx?: EditCtx }) {
  return (
    <div style={s({ background: theme.heroBg, padding: "96px 48px 80px", textAlign: "center", position: "relative", overflow: "hidden" })}>
      <div style={s({ position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)", width: 800, height: 800, background: `radial-gradient(circle, ${theme.heroOrb}25 0%, transparent 65%)`, pointerEvents: "none" })} />
      <div style={s({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(${theme.subtle}15 1px, transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" })} />
      <div style={s({ position: "relative", zIndex: 1 })}>
        {data.badge && (
          <SelWrap path="badge" value={data.badge} ctx={ctx} plain>
            <div style={s({ display: "inline-flex", alignItems: "center", gap: 8, background: theme.accentMuted, border: `1px solid ${theme.accent}35`, borderRadius: 100, padding: "5px 16px 5px 8px", marginBottom: 28 })}>
              <span style={s({ background: theme.accent, color: theme.accentText, borderRadius: 100, fontSize: 10, fontWeight: 800, padding: "2px 10px", whiteSpace: "nowrap" })}>NEW</span>
              <span style={s({ fontSize: 12, color: theme.accent, fontWeight: 600 })}>{data.badge}</span>
            </div>
          </SelWrap>
        )}
        <SelWrap path="headline" value={data.headline} ctx={ctx} block>
          <h1 style={s({ fontSize: 58, fontWeight: 900, color: theme.text, lineHeight: 1.06, letterSpacing: "-0.05em", marginBottom: 22, maxWidth: 800, marginLeft: "auto", marginRight: "auto" })}>{data.headline}</h1>
        </SelWrap>
        <SelWrap path="sub" value={data.sub} ctx={ctx} block>
          <p style={s({ fontSize: 18, color: theme.muted, lineHeight: 1.75, maxWidth: 560, margin: "0 auto 40px" })}>{data.sub}</p>
        </SelWrap>
        <div style={s({ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" })}>
          <SelWrap path="cta1" value={data.cta1} ctx={ctx} plain>
            <div style={s({ background: theme.accent, color: theme.accentText, padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, boxShadow: `0 8px 24px ${theme.accentGlow}` })}>{data.cta1} →</div>
          </SelWrap>
          {data.cta2 && (
            <SelWrap path="cta2" value={data.cta2} ctx={ctx} plain>
              <div style={s({ background: "transparent", color: theme.text, padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 600, border: `1px solid ${theme.cardBorder}` })}>{data.cta2}</div>
            </SelWrap>
          )}
        </div>
        {data.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.image} alt=""
            onError={e => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = `https://picsum.photos/seed/${encodeURIComponent((data.headline || "site").slice(0,20))}/1280/760`; } }}
            style={s({ maxWidth: 720, width: "100%", margin: "56px auto 0", display: "block", borderRadius: 16, border: `1px solid ${theme.cardBorder}`, boxShadow: `0 32px 64px ${theme.pageBg}80`, minHeight: 200, background: theme.cardBg })} />
        )}
        {data.mockup && !data.image && (
          <div style={s({ maxWidth: 720, margin: "56px auto 0", background: theme.cardBg, borderRadius: 16, border: `1px solid ${theme.cardBorder}`, overflow: "hidden", boxShadow: `0 32px 64px ${theme.pageBg}80, 0 0 0 1px ${theme.cardBorder}` })}>
            <div style={s({ background: theme.navBg, padding: "12px 18px", borderBottom: `1px solid ${theme.navBorder}`, display: "flex", alignItems: "center", gap: 8 })}>
              {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={s({ width: 11, height: 11, borderRadius: "50%", background: c })} />)}
              <div style={s({ flex: 1, background: theme.cardBorder, borderRadius: 5, height: 22, maxWidth: 320, margin: "0 auto" })} />
            </div>
            <div style={s({ padding: "24px", background: theme.cardBg })}>
              <div style={s({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 })}>
                {[theme.accent+"22",theme.accent+"16",theme.accent+"12",theme.accent+"0a"].map((bg,i) => (
                  <div key={i} style={s({ background: bg, border: `1px solid ${theme.cardBorder}`, borderRadius: 12, padding: "16px" })}>
                    <div style={s({ fontSize: 9, color: theme.muted, marginBottom: 6 })}>Metric {i+1}</div>
                    <div style={s({ fontSize: 20, fontWeight: 800, color: theme.text })}>—</div>
                  </div>
                ))}
              </div>
              <div style={s({ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 })}>
                <div style={s({ background: theme.accent+"0a", border: `1px solid ${theme.cardBorder}`, borderRadius: 12, height: 90 })} />
                <div style={s({ display: "flex", flexDirection: "column", gap: 8 })}>
                  {[0,1,2].map(i => <div key={i} style={s({ background: theme.cardBorder, borderRadius: 8, flex: 1 })} />)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LogoBarRenderer({ data, theme, ctx }: { data: LogoData; theme: Theme; ctx?: EditCtx }) {
  return (
    <div style={s({ background: theme.altBg, borderTop: `1px solid ${theme.navBorder}`, borderBottom: `1px solid ${theme.navBorder}`, padding: "24px 48px" })}>
      <SelWrap path="headline" value={data.headline} ctx={ctx} block>
        <p style={s({ textAlign: "center", fontSize: 12, color: theme.subtle, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 })}>{data.headline}</p>
      </SelWrap>
      <div style={s({ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, flexWrap: "wrap" })}>
        {data.logos.map((l, i) => (
          <SelWrap key={i} path={`logos.${i}`} value={l} ctx={ctx}>
            <span style={s({ fontSize: 16, fontWeight: 800, color: theme.subtle, letterSpacing: "-0.02em" })}>{l}</span>
          </SelWrap>
        ))}
      </div>
    </div>
  );
}

function FeaturesRenderer({ data, theme, ctx }: { data: FeatData; theme: Theme; ctx?: EditCtx }) {
  return (
    <div style={s({ background: theme.sectionBg, padding: "80px 48px" })}>
      <div style={s({ maxWidth: 900, margin: "0 auto" })}>
        <div style={s({ textAlign: "center", marginBottom: 56 })}>
          <SelWrap path="headline" value={data.headline} ctx={ctx} block>
            <h2 style={s({ fontSize: 40, fontWeight: 800, color: theme.text, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 14 })}>{data.headline}</h2>
          </SelWrap>
          <SelWrap path="sub" value={data.sub} ctx={ctx} block>
            <p style={s({ fontSize: 17, color: theme.muted, lineHeight: 1.7, maxWidth: 520, margin: "0 auto" })}>{data.sub}</p>
          </SelWrap>
        </div>
        <div style={s({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 })}>
          {data.items.map((item, i) => (
            <div key={i} style={s({ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 16, padding: "28px 24px", position: "relative", overflow: "hidden" })}>
              <div style={s({ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${theme.accent}18 0%, transparent 70%)` })} />
              <SelWrap path={`items.${i}.icon`} value={item.icon} ctx={ctx}>
                <div style={s({ width: 44, height: 44, background: theme.accentMuted, border: `1px solid ${theme.accent}25`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 18 })}>{item.icon}</div>
              </SelWrap>
              <SelWrap path={`items.${i}.title`} value={item.title} ctx={ctx} block>
                <h3 style={s({ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 8, letterSpacing: "-0.02em" })}>{item.title}</h3>
              </SelWrap>
              <SelWrap path={`items.${i}.desc`} value={item.desc} ctx={ctx} block>
                <p style={s({ fontSize: 13, color: theme.muted, lineHeight: 1.65 })}>{item.desc}</p>
              </SelWrap>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsRenderer({ data, theme, ctx }: { data: TestimData; theme: Theme; ctx?: EditCtx }) {
  return (
    <div style={s({ background: theme.altBg, padding: "80px 48px" })}>
      <div style={s({ maxWidth: 900, margin: "0 auto" })}>
        <div style={s({ display: "grid", gridTemplateColumns: data.items.length > 1 ? "1fr 1fr" : "1fr", gap: 20, maxWidth: data.items.length === 1 ? 560 : 900, margin: "0 auto" })}>
          {data.items.map((item, i) => (
            <div key={i} style={s({ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 20, padding: "32px 28px" })}>
              <div style={s({ display: "flex", gap: 3, marginBottom: 20 })}>
                {[0,1,2,3,4].map(s2 => <span key={s2} style={s({ fontSize: 16, color: "#f59e0b" })}>★</span>)}
              </div>
              <SelWrap path={`items.${i}.quote`} value={item.quote} ctx={ctx} block>
                <p style={s({ fontSize: 16, color: theme.text, lineHeight: 1.75, marginBottom: 24, fontStyle: "italic" })}>"{item.quote}"</p>
              </SelWrap>
              <div style={s({ display: "flex", alignItems: "center", gap: 12 })}>
                <div style={s({ width: 40, height: 40, borderRadius: "50%", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 })}>{item.initials}</div>
                <div>
                  <SelWrap path={`items.${i}.name`} value={item.name} ctx={ctx} block>
                    <div style={s({ fontSize: 14, fontWeight: 700, color: theme.text })}>{item.name}</div>
                  </SelWrap>
                  <SelWrap path={`items.${i}.role`} value={item.role} ctx={ctx} block>
                    <div style={s({ fontSize: 12, color: theme.muted })}>{item.role}</div>
                  </SelWrap>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingRenderer({ data, theme, ctx }: { data: PriceData; theme: Theme; ctx?: EditCtx }) {
  return (
    <div style={s({ background: theme.sectionBg, padding: "80px 48px" })}>
      <div style={s({ maxWidth: 960, margin: "0 auto" })}>
        <div style={s({ textAlign: "center", marginBottom: 52 })}>
          <SelWrap path="headline" value={data.headline} ctx={ctx} block>
            <h2 style={s({ fontSize: 40, fontWeight: 800, color: theme.text, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 14 })}>{data.headline}</h2>
          </SelWrap>
          <SelWrap path="sub" value={data.sub} ctx={ctx} block>
            <p style={s({ fontSize: 17, color: theme.muted, lineHeight: 1.7 })}>{data.sub}</p>
          </SelWrap>
        </div>
        <div style={s({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 })}>
          {data.tiers.map((tier, i) => (
            <div key={i} style={s({ background: tier.featured ? theme.accent : theme.cardBg, border: `2px solid ${tier.featured ? theme.accent : theme.cardBorder}`, borderRadius: 20, padding: "32px 24px", position: "relative", boxShadow: tier.featured ? `0 20px 40px ${theme.accentGlow}` : "none" })}>
              {tier.featured && <div style={s({ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: theme.text, color: theme.pageBg, fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 100, whiteSpace: "nowrap" })}>Most Popular</div>}
              <SelWrap path={`tiers.${i}.name`} value={tier.name} ctx={ctx} block>
                <div style={s({ fontSize: 13, fontWeight: 700, color: tier.featured ? `${theme.accentText}99` : theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 })}>{tier.name}</div>
              </SelWrap>
              <div style={s({ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 8 })}>
                <SelWrap path={`tiers.${i}.price`} value={tier.price} ctx={ctx}>
                  <span style={s({ fontSize: 44, fontWeight: 900, color: tier.featured ? theme.accentText : theme.text, letterSpacing: "-0.04em", lineHeight: 1 })}>{tier.price}</span>
                </SelWrap>
                <SelWrap path={`tiers.${i}.period`} value={tier.period} ctx={ctx}>
                  <span style={s({ fontSize: 14, color: tier.featured ? `${theme.accentText}80` : theme.muted, paddingBottom: 6 })}>{tier.period}</span>
                </SelWrap>
              </div>
              <SelWrap path={`tiers.${i}.desc`} value={tier.desc} ctx={ctx} block>
                <p style={s({ fontSize: 13, color: tier.featured ? `${theme.accentText}90` : theme.muted, marginBottom: 24, lineHeight: 1.6 })}>{tier.desc}</p>
              </SelWrap>
              <div style={s({ marginBottom: 28 })}>
                {tier.features.map(f => (
                  <div key={f} style={s({ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 })}>
                    <span style={s({ fontSize: 13, color: tier.featured ? theme.accentText : theme.accent, flexShrink: 0, marginTop: 1 })}>✓</span>
                    <span style={s({ fontSize: 13, color: tier.featured ? `${theme.accentText}95` : theme.text, lineHeight: 1.5 })}>{f}</span>
                  </div>
                ))}
              </div>
              <SelWrap path={`tiers.${i}.cta`} value={tier.cta} ctx={ctx} plain block>
                <div style={s({ background: tier.featured ? `${theme.accentText}20` : theme.accent, color: tier.featured ? theme.accentText : theme.accentText, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, textAlign: "center", border: tier.featured ? `1px solid ${theme.accentText}30` : "none" })}>{tier.cta}</div>
              </SelWrap>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CTARenderer({ data, theme, ctx }: { data: CTAData; theme: Theme; ctx?: EditCtx }) {
  return (
    <div style={s({ background: theme.heroBg, padding: "88px 48px", textAlign: "center", position: "relative", overflow: "hidden" })}>
      <div style={s({ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: `radial-gradient(circle, ${theme.heroOrb}30 0%, transparent 70%)`, pointerEvents: "none" })} />
      <div style={s({ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" })}>
        <SelWrap path="headline" value={data.headline} ctx={ctx} block>
          <h2 style={s({ fontSize: 44, fontWeight: 900, color: theme.text, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 18 })}>{data.headline}</h2>
        </SelWrap>
        <SelWrap path="sub" value={data.sub} ctx={ctx} block>
          <p style={s({ fontSize: 17, color: theme.muted, lineHeight: 1.7, marginBottom: 40 })}>{data.sub}</p>
        </SelWrap>
        <SelWrap path="cta" value={data.cta} ctx={ctx} plain>
          <div style={s({ display: "inline-block", background: theme.accent, color: theme.accentText, padding: "15px 40px", borderRadius: 12, fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", boxShadow: `0 12px 32px ${theme.accentGlow}` })}>{data.cta}</div>
        </SelWrap>
        {data.note && (
          <SelWrap path="note" value={data.note} ctx={ctx} block>
            <p style={s({ fontSize: 12, color: theme.subtle, marginTop: 16 })}>{data.note}</p>
          </SelWrap>
        )}
      </div>
    </div>
  );
}

function FormRenderer({ data, theme, ctx }: { data: FormData; theme: Theme; ctx?: EditCtx }) {
  return (
    <div style={s({ background: theme.altBg, padding: "80px 48px" })}>
      <div style={s({ maxWidth: 520, margin: "0 auto", background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 24, padding: "48px 40px", boxShadow: `0 20px 60px ${theme.pageBg}60` })}>
        <SelWrap path="headline" value={data.headline} ctx={ctx} block>
          <h2 style={s({ fontSize: 30, fontWeight: 800, color: theme.text, letterSpacing: "-0.04em", lineHeight: 1.15, marginBottom: 10, textAlign: "center" })}>{data.headline}</h2>
        </SelWrap>
        <SelWrap path="sub" value={data.sub} ctx={ctx} block>
          <p style={s({ fontSize: 14, color: theme.muted, lineHeight: 1.65, marginBottom: 32, textAlign: "center" })}>{data.sub}</p>
        </SelWrap>
        <div style={s({ display: "flex", flexDirection: "column", gap: 12 })}>
          {data.fields.map((f, i) => (
            <div key={i}>
              <SelWrap path={`fields.${i}.label`} value={f.label} ctx={ctx} block>
                <label style={s({ fontSize: 12, fontWeight: 600, color: theme.muted, display: "block", marginBottom: 6 })}>{f.label}</label>
              </SelWrap>
              <SelWrap path={`fields.${i}.ph`} value={f.ph} ctx={ctx} block>
                <div style={s({ background: theme.pageBg, border: `1px solid ${theme.cardBorder}`, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: theme.subtle })}>{f.ph}</div>
              </SelWrap>
            </div>
          ))}
          <SelWrap path="cta" value={data.cta} ctx={ctx} plain block>
            <div style={s({ background: theme.accent, color: theme.accentText, padding: "14px 20px", borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: "center", marginTop: 8, boxShadow: `0 8px 20px ${theme.accentGlow}` })}>{data.cta}</div>
          </SelWrap>
        </div>
        {data.note && (
          <SelWrap path="note" value={data.note} ctx={ctx} block>
            <p style={s({ fontSize: 11, color: theme.subtle, marginTop: 16, textAlign: "center" })}>{data.note}</p>
          </SelWrap>
        )}
      </div>
    </div>
  );
}

function FooterRenderer({ theme }: { theme: Theme }) {
  return (
    <div style={s({ background: theme.navBg, borderTop: `1px solid ${theme.navBorder}`, padding: "32px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" })}>
      <span style={s({ fontSize: 13, fontWeight: 700, color: theme.muted })}>© 2025 Company Inc.</span>
      <div style={s({ display: "flex", gap: 24 })}>
        {["Privacy","Terms","Contact"].map(l => <span key={l} style={s({ fontSize: 12, color: theme.subtle })}>{l}</span>)}
      </div>
    </div>
  );
}

function renderSectionInner(sec: Sec, theme: Theme, ctx?: EditCtx) {
  switch (sec.type) {
    case "nav":           return <NavRenderer          data={sec.data as NavData}    theme={theme} ctx={ctx} />;
    case "hero":          return <HeroRenderer         data={sec.data as HeroData}   theme={theme} ctx={ctx} />;
    case "logobar":       return <LogoBarRenderer      data={sec.data as LogoData}   theme={theme} ctx={ctx} />;
    case "features":      return <FeaturesRenderer     data={sec.data as FeatData}   theme={theme} ctx={ctx} />;
    case "testimonials":  return <TestimonialsRenderer  data={sec.data as TestimData} theme={theme} ctx={ctx} />;
    case "pricing":       return <PricingRenderer      data={sec.data as PriceData}  theme={theme} ctx={ctx} />;
    case "cta":           return <CTARenderer          data={sec.data as CTAData}    theme={theme} ctx={ctx} />;
    case "form":          return <FormRenderer         data={sec.data as FormData}   theme={theme} ctx={ctx} />;
    default:              return null;
  }
}

function SectionRenderer({ sec, theme, ctx }: { sec: Sec; theme: Theme; ctx?: EditCtx }) {
  if (!sec.bg) return renderSectionInner(sec, theme, ctx);
  // Custom background image: make the section's own backgrounds transparent so the
  // image shows through, force light text for legibility over the dark scrim.
  const t: Theme = { ...theme, heroBg:"transparent", navBg:"transparent", sectionBg:"transparent", altBg:"transparent",
    text:"#ffffff", muted:"#e5e7eb", subtle:"#cbd5e1" };
  return (
    <div style={{ background:`linear-gradient(rgba(8,8,16,0.58), rgba(8,8,16,0.58)), url("${sec.bg}") center / cover no-repeat` }}>
      {renderSectionInner(sec, t, ctx)}
    </div>
  );
}

function PagePreview({ sections, theme }: { sections: Sec[]; theme: Theme }) {
  return (
    <div style={{ background: theme.pageBg }}>
      {sections.map(sec => <SectionRenderer key={sec.id} sec={sec} theme={theme} ctx={{ secId: sec.id, selPath: null, onSel: () => {}, styles: sec.styles, links: sec.links, readOnly: true }} />)}
      <FooterRenderer theme={theme} />
    </div>
  );
}

// ─── Template data ────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id:1, name:"SaaS Launch", cat:"Landing Page", badge:"Avg 4.2% conv.",
    desc:"Dark hero with dashboard mockup, feature grid, testimonials, pricing, and bold CTA.", accent:"#7c3aed", theme:DARK_VIOLET,
    sections:[
      { id:"nav", type:"nav", data:{ logo:"YourBrand", links:["Features","Pricing","Docs","Blog"], cta:"Start Free Trial" } },
      { id:"hero", type:"hero", data:{ badge:"AI-Powered CRM → Now with autopilot mode", headline:"The Only CRM That Closes Deals While You Sleep", sub:"Automate your entire sales process — from first contact to signed contract — with AI that actually works.", cta1:"Start Free Trial", cta2:"Watch Demo", mockup:true } },
      { id:"logos", type:"logobar", data:{ headline:"Trusted by 2,400+ growing businesses", logos:["Acme Corp","TechBridge","Apex Realty","GlobalTrade","SunCoast"] } },
      { id:"feat", type:"features", data:{ headline:"Everything you need to close more deals", sub:"One platform for your entire revenue operation.", items:[{ icon:"🤖", title:"AI-Powered Outreach", desc:"Personalised messages sent automatically across email, SMS, and Instagram — without lifting a finger." },{ icon:"📊", title:"Live Pipeline Intelligence", desc:"See exactly where every deal stands with AI-generated health scores and next-action recommendations." },{ icon:"📥", title:"Unified Inbox", desc:"Every DM, email, and text in one clean inbox. Never miss a lead or drop a follow-up again." },{ icon:"⚡", title:"One-Click Automations", desc:"Build powerful workflows in minutes. Set triggers, delays, and actions without writing a single line of code." },{ icon:"📞", title:"Built-in Dialer", desc:"Call leads directly from the CRM with local presence, auto-scripts, and post-call logging." },{ icon:"🎯", title:"Conversion Tracking", desc:"See which campaigns, channels, and scripts are actually driving revenue — down to the last dollar." }] } },
      { id:"testim", type:"testimonials", data:{ items:[{ quote:"We replaced five tools with this platform and our close rate went from 12% to 31% in 90 days. The AI replies alone save us 20 hours a week.", name:"Sarah Mitchell", role:"CEO, Apex Digital", initials:"SM", color:"#7c3aed" },{ quote:"The pipeline intelligence feature is insane. It told us a deal was going cold 3 days before the client ghosted us — gave us enough time to save it.", name:"Omar Al-Rashid", role:"Head of Sales, GlobalTrade", initials:"OR", color:"#4f46e5" }] } },
      { id:"price", type:"pricing", data:{ headline:"Simple, honest pricing", sub:"No hidden fees. Cancel any time.", tiers:[{ name:"Starter", price:"Free", period:"forever", desc:"Perfect for solopreneurs just getting started.", features:["Up to 250 leads","Basic pipeline view","Email + SMS outreach","1 automation workflow","Community support"], cta:"Get Started Free" },{ name:"Pro", price:"$49", period:"/month", desc:"For teams that are serious about growth.", features:["Unlimited leads","Full AI suite","All channels (IG, WhatsApp, email, SMS)","Unlimited automations","Website builder","Priority support"], cta:"Start Free Trial", featured:true },{ name:"Agency", price:"$149", period:"/month", desc:"White-label for agencies and teams.", features:["Everything in Pro","Sub-accounts","White-label branding","API access","Dedicated onboarding","SLA support"], cta:"Talk to Sales" }] } },
      { id:"cta", type:"cta", data:{ headline:"Ready to 10× your close rate?", sub:"Join 2,400+ businesses already using our AI to close more deals with less effort.", cta:"Start Free — No Credit Card", note:"14-day free trial. Cancel any time." } },
    ],
  },
  {
    id:2, name:"Lead Capture", cat:"Funnel", badge:"Avg 7.8% conv.",
    desc:"High-converting opt-in page with a strong single promise and trust signals.", accent:"#059669", theme:LIGHT_GREEN,
    sections:[
      { id:"nav", type:"nav", data:{ logo:"GrowthAudit", links:["How It Works","Results","FAQ"], cta:"Get Free Audit" } },
      { id:"hero", type:"hero", data:{ badge:"Free for a limited time → No catch", headline:"Get Your Free 47-Point Marketing Audit", sub:"Enter your details below and we'll send a personalised report showing exactly where your business is leaking revenue — and how to fix it.", cta1:"Get My Free Audit →", cta2:"See Sample Report", mockup:false } },
      { id:"feat", type:"features", data:{ headline:"What's inside your free audit", sub:"Delivered to your inbox in under 60 seconds.", items:[{ icon:"🔍", title:"Traffic Analysis", desc:"We'll identify where your best leads are coming from — and where you're wasting budget." },{ icon:"💸", title:"Revenue Leak Report", desc:"Find the exact gaps in your funnel that are costing you customers every single day." },{ icon:"🗺️", title:"Custom Action Plan", desc:"Get a step-by-step roadmap tailored to your specific business, industry, and goals." }] } },
      { id:"form", type:"form", data:{ headline:"Where should we send your report?", sub:"Takes 30 seconds. Completely free.", fields:[{ label:"First Name", ph:"Enter your first name" },{ label:"Business Email", ph:"you@company.com" },{ label:"Company Website", ph:"https://yoursite.com" }], cta:"Send My Free Audit →", note:"🔒 We respect your privacy. No spam, ever." } },
      { id:"testim", type:"testimonials", data:{ items:[{ quote:"The audit found a €14,000/month leak in our Google Ads spend that we'd completely missed for 6 months. It paid for itself a hundred times over.", name:"Omar Al-Rashid", role:"Founder, PeakMedia", initials:"OR", color:"#059669" },{ quote:"I was sceptical — how could a free audit be any good? But the recommendations were more specific than what our paid consultant gave us.", name:"Priya Nair", role:"Head of Growth, Nair & Co.", initials:"PN", color:"#0284c7" }] } },
      { id:"cta", type:"cta", data:{ headline:"Stop guessing. Start growing.", sub:"Over 14,000 businesses have used this audit to find and fix their biggest growth leaks.", cta:"Get My Free Audit Now", note:"100% free. No credit card. No strings attached." } },
    ],
  },
  {
    id:3, name:"Agency Pro", cat:"Website", badge:"5-page site",
    desc:"Premium dark agency site with services, social proof, and contact.", accent:"#e4e4e7", theme:DARK_ZINC,
    sections:[
      { id:"nav", type:"nav", data:{ logo:"Studio™", links:["Work","Services","About","Journal"], cta:"Start a Project" } },
      { id:"hero", type:"hero", data:{ badge:"Now taking clients for Q3 2025", headline:"We Build Digital Experiences That Convert", sub:"Strategy, design, and development for ambitious brands. We turn complex problems into elegant, revenue-generating solutions.", cta1:"View Our Work", cta2:"See Pricing", mockup:true } },
      { id:"logos", type:"logobar", data:{ headline:"Clients who've trusted us", logos:["Stripe","Linear","Vercel","Supabase","Figma","Anthropic"] } },
      { id:"feat", type:"features", data:{ headline:"What we do best", sub:"End-to-end digital execution, from brand to revenue.", items:[{ icon:"🎨", title:"Brand & Identity", desc:"Positioning, messaging frameworks, and visual identities that make you the obvious choice in a crowded market." },{ icon:"🌐", title:"Web & Funnel Design", desc:"Conversion-focused websites and landing pages built with Webflow, Next.js, or our custom stack." },{ icon:"📈", title:"Paid Acquisition", desc:"Meta, Google, and TikTok campaigns managed by former agency performance leads with proven track records." }] } },
      { id:"testim", type:"testimonials", data:{ items:[{ quote:"They redesigned our site and our inbound leads tripled within 90 days. The attention to detail was extraordinary — worth every penny and more.", name:"James Thornton", role:"Head of Growth, BlueSky Properties", initials:"JT", color:"#71717a" }] } },
      { id:"price", type:"pricing", data:{ headline:"Investment", sub:"Clear scope. Fixed price. No surprises.", tiers:[{ name:"Sprint", price:"$5K", period:"one-time", desc:"Perfect for startups needing to launch fast.", features:["Brand identity system","5-page marketing site","1 landing page","Basic SEO setup","30-day support"], cta:"Get Started" },{ name:"Growth", price:"$15K", period:"one-time", desc:"Full-stack digital presence build-out.", features:["Full brand strategy","10-page website","3 conversion funnels","Paid ads setup","Analytics & tracking","90-day support"], cta:"Book a Call", featured:true },{ name:"Retainer", price:"$8K", period:"/month", desc:"Ongoing partnership for scaling brands.", features:["Everything in Growth","Monthly campaigns","Weekly reporting","CRO testing","Dedicated team","Priority response"], cta:"Apply Now" }] } },
      { id:"form", type:"form", data:{ headline:"Let's talk about your project", sub:"Tell us what you're building and we'll put together a custom proposal within 48 hours.", fields:[{ label:"Your Name", ph:"Full name" },{ label:"Email", ph:"your@email.com" },{ label:"Project Brief", ph:"What are you looking to build?" }], cta:"Send My Brief →", note:"We respond to every enquiry within 24 hours." } },
    ],
  },
  {
    id:4, name:"Webinar Signup", cat:"Event", badge:"Avg 6.1% conv.",
    desc:"Urgency-driven event page with speaker section and countdown.", accent:"#2563eb", theme:LIGHT_BLUE,
    sections:[
      { id:"nav", type:"nav", data:{ logo:"WebinarPro", links:["What You'll Learn","Speakers","FAQ"], cta:"Save My Seat" } },
      { id:"hero", type:"hero", data:{ badge:"Thursday, June 12 · 2PM EST · Free Live Training", headline:"How to Generate 50 Qualified Leads Per Day With AI", sub:"Join 1,400+ marketers for this free live masterclass. We'll show you the exact AI system we use — step by step, no fluff.", cta1:"Reserve My Free Seat →", cta2:"See the Agenda", mockup:false } },
      { id:"feat", type:"features", data:{ headline:"In 90 minutes, you'll learn exactly how to:", sub:"This is not a theory session. We're showing live results.", items:[{ icon:"🤖", title:"The AI Lead Machine Setup", desc:"The exact prompt sequences and tools we use to generate 50+ warm, qualified leads every single day." },{ icon:"⚙️", title:"Automate Your Follow-Up", desc:"How to set up a fully automated follow-up sequence that turns cold leads hot — without hiring anyone." },{ icon:"📊", title:"Track What Actually Works", desc:"The 3 metrics that separate 7-figure businesses from struggling ones — and how to optimise for them." }] } },
      { id:"testim", type:"testimonials", data:{ items:[{ quote:"I attended last month's session and implemented one tactic that same afternoon. By the next morning I had 18 new leads in my inbox. This stuff is real.", name:"Priya Nair", role:"Founder, Nair & Co", initials:"PN", color:"#2563eb" },{ quote:"Best free training I've ever attended. No fluff, no pitch — just pure, actionable content that I could use immediately.", name:"Ryan Fitzgerald", role:"Marketing Director, Vertex", initials:"RF", color:"#1d4ed8" }] } },
      { id:"form", type:"form", data:{ headline:"Save your free seat now", sub:"Only 200 spots available. This fills up fast every month.", fields:[{ label:"Full Name", ph:"Your name" },{ label:"Work Email", ph:"you@company.com" }], cta:"Yes, Save My Seat! →", note:"⚡ 143 people registered in the last 24 hours" } },
      { id:"cta", type:"cta", data:{ headline:"Only 57 seats left.", sub:"This webinar sells out every single month. Register now so you don't miss out again.", cta:"Claim My Free Seat", note:"Free to attend. Replay available for 48 hours after." } },
    ],
  },
  {
    id:5, name:"Free Consultation", cat:"Funnel", badge:"Avg 9.2% conv.",
    desc:"Book-a-call funnel with value props, objection handling, and inline booking.", accent:"#e11d48", theme:LIGHT_RED,
    sections:[
      { id:"nav", type:"nav", data:{ logo:"GrowthCall", links:["What to Expect","Results","FAQs"], cta:"Book Your Call" } },
      { id:"hero", type:"hero", data:{ badge:"Limited slots this week → 3 remaining", headline:"Book Your Free 30-Minute Revenue Growth Call", sub:"We'll audit your current strategy, identify your three biggest growth levers, and hand you a custom 90-day action plan — completely free.", cta1:"Book My Free Call →", cta2:"See What Others Say", mockup:false } },
      { id:"feat", type:"features", data:{ headline:"What happens on the call", sub:"No sales pressure. Just real, actionable insights.", items:[{ icon:"🔍", title:"Deep-Dive Audit", desc:"We'll analyse your current marketing, sales process, and pipeline to find exactly where you're leaving money on the table." },{ icon:"🗺️", title:"Custom 90-Day Roadmap", desc:"You'll walk away with a tailored action plan built specifically for your business, team, and goals." },{ icon:"🚫", title:"Zero Obligation", desc:"This is a genuine strategy session, not a disguised sales call. You'll get real value regardless of whether we work together." }] } },
      { id:"testim", type:"testimonials", data:{ items:[{ quote:"I went in sceptical — I've been burned by 'free strategy calls' before. But 20 minutes in I was taking frantic notes. I hired them on the spot.", name:"Laura Chen", role:"Founder, Studio Chen", initials:"LC", color:"#e11d48" },{ quote:"The action plan they built on our call generated $40K in new revenue over the next 60 days. And it was free. I still can't believe it.", name:"Marcus Webb", role:"CEO, Webb & Associates", initials:"MW", color:"#be185d" }] } },
      { id:"form", type:"form", data:{ headline:"Claim your free strategy call", sub:"Pick a time and tell us a little about your business.", fields:[{ label:"Full Name", ph:"Your name" },{ label:"Email", ph:"you@company.com" },{ label:"Monthly Revenue", ph:"e.g. $10K–$50K/month" }], cta:"Book My Free Call →", note:"🗓️ You'll get a calendar invite within 5 minutes of submitting." } },
      { id:"cta", type:"cta", data:{ headline:"Only 3 call slots left this week.", sub:"We cap free calls at 10 per week to ensure quality. Once they're gone, they're gone.", cta:"Claim My Free Slot Now", note:"No commitment. No credit card. Just real strategic advice." } },
    ],
  },
  {
    id:6, name:"Product Launch", cat:"Landing Page", badge:"Avg 3.9% conv.",
    desc:"Bold product reveal with feature highlights, pricing, and waitlist form.", accent:"#ea580c", theme:LIGHT_ORANGE,
    sections:[
      { id:"nav", type:"nav", data:{ logo:"ProductCo", links:["Features","Pricing","Changelog","Blog"], cta:"Join Waitlist" } },
      { id:"hero", type:"hero", data:{ badge:"Launching Q3 2025 → Join 4,200 on the waitlist", headline:"The Tool That Replaces Your Entire Marketing Stack", sub:"One platform for CRM, automation, ads, websites, AI outreach, and analytics. Replace 6 tools. Save $800/month. Double your results.", cta1:"Join Waitlist — It's Free →", cta2:"See Full Feature List", mockup:true } },
      { id:"logos", type:"logobar", data:{ headline:"Replaces tools like", logos:["HubSpot","Mailchimp","Calendly","ClickFunnels","ActiveCampaign","Hootsuite"] } },
      { id:"feat", type:"features", data:{ headline:"Six tools. One platform.", sub:"Everything talks to everything. No more data silos.", items:[{ icon:"🎯", title:"Smart CRM", desc:"AI-powered pipeline management that tells you which deals to focus on and when to follow up — automatically." },{ icon:"📧", title:"Omni-Channel Outreach", desc:"Email, SMS, Instagram DMs, WhatsApp, LinkedIn — all from one unified inbox with AI-generated replies." },{ icon:"🌐", title:"Website Builder", desc:"Build high-converting landing pages, funnels, and full websites with our drag-and-drop editor. No code required." },{ icon:"📣", title:"Ad Manager", desc:"Run and optimise Meta, Google, and TikTok campaigns from inside the platform. See ROAS by channel instantly." },{ icon:"⚡", title:"Workflow Automation", desc:"Powerful, visual workflow builder with 100+ triggers, conditions, and actions. Build once, run forever." },{ icon:"📊", title:"Revenue Analytics", desc:"A single source of truth for your entire business. Track every dollar from first touch to closed deal." }] } },
      { id:"price", type:"pricing", data:{ headline:"Early bird pricing", sub:"Lock in 40% off before our public launch.", tiers:[{ name:"Starter", price:"$27", period:"/mo", desc:"For solopreneurs and small teams.", features:["Up to 1,000 contacts","All core features","2 team members","5 automation workflows","Email support"], cta:"Join Waitlist" },{ name:"Growth", price:"$67", period:"/mo", desc:"For scaling businesses.", features:["Unlimited contacts","All features + AI","10 team members","Unlimited automations","Priority support","White-label option"], cta:"Join Waitlist", featured:true },{ name:"Agency", price:"$197", period:"/mo", desc:"For agencies managing clients.", features:["Everything in Growth","Unlimited sub-accounts","Agency dashboard","Client reporting","API access","Dedicated CSM"], cta:"Join Waitlist" }] } },
      { id:"cta", type:"cta", data:{ headline:"The waitlist closes Friday.", sub:"Early access members get 40% off forever. This offer ends when we launch.", cta:"Join Waitlist — Lock In 40% Off", note:"4,200 people already on the list. Spots are limited." } },
    ],
  },
  {
    id:7, name:"Coaching Program", cat:"Landing Page", badge:"Avg 5.4% conv.",
    desc:"Authority-building page for coaches with curriculum and enroll CTA.", accent:"#9333ea", theme:LIGHT_PURPLE,
    sections:[
      { id:"nav", type:"nav", data:{ logo:"CoachPro", links:["Program","Results","About","Apply"], cta:"Apply Now" } },
      { id:"hero", type:"hero", data:{ badge:"New cohort starting July 1st → 6 spots remaining", headline:"Go From $5K to $30K Months in 90 Days", sub:"The proven 12-week coaching program that's helped 800+ entrepreneurs build profitable, sustainable online businesses — without burnout.", cta1:"Apply for a Spot →", cta2:"Watch Client Results", mockup:false } },
      { id:"feat", type:"features", data:{ headline:"Everything inside the program", sub:"12 weeks of intensive, personalised coaching.", items:[{ icon:"📚", title:"12-Week Curriculum", desc:"Step-by-step video modules covering mindset, offer creation, marketing, sales, and operations." },{ icon:"📞", title:"Weekly 1:1 Coaching Calls", desc:"60-minute private Zoom sessions with me every week to work through your specific challenges." },{ icon:"👥", title:"Private Community", desc:"Lifetime access to our members-only community with 800+ entrepreneurs at every stage of growth." }] } },
      { id:"testim", type:"testimonials", data:{ items:[{ quote:"I joined at $4K/month and hit $28K in month 10 of the program. The frameworks are brutally practical and the weekly calls alone are worth 10× the investment.", name:"Fatima Al-Amin", role:"E-commerce founder, Dubai", initials:"FA", color:"#9333ea" },{ quote:"I'd tried 3 other coaching programs before this one. None of them even came close. This is the real deal — results-focused, no fluff, no BS.", name:"Marcus Webb", role:"Agency owner, Austin TX", initials:"MW", color:"#7e22ce" }] } },
      { id:"price", type:"pricing", data:{ headline:"Investment", sub:"Pay in full or split across 3 months.", tiers:[{ name:"Self-Study", price:"$997", period:"one-time", desc:"All curriculum. No live coaching.", features:["12-week video curriculum","Templates & frameworks","Private community access","Lifetime updates","Email support"], cta:"Enroll Now" },{ name:"Full Program", price:"$4,997", period:"one-time", desc:"The full 12-week coaching experience.", features:["Everything in Self-Study","12 weekly 1:1 calls","Direct Slack access","Custom 90-day plan","Quarterly check-ins","Alumni network"], cta:"Apply Now", featured:true },{ name:"VIP", price:"$12,000", period:"6 months", desc:"Deep-dive intensive mentorship.", features:["Everything in Full Program","Unlimited calls","Done-with-you implementation","Revenue share option","Introductions & referrals","Lifetime ongoing access"], cta:"Apply for VIP" }] } },
      { id:"cta", type:"cta", data:{ headline:"Applications close July 1st.", sub:"I only accept 10 students per cohort to guarantee results. Once the spots are filled, the next opening is October.", cta:"Apply for a Spot Now →", note:"Application takes 3 minutes. You'll hear back within 24 hours." } },
    ],
  },
  {
    id:8, name:"Coming Soon", cat:"Landing Page", badge:"Email capture",
    desc:"Minimal dark teaser with email capture to build a pre-launch list.", accent:"#38bdf8", theme:DARK_NAVY,
    sections:[
      { id:"nav", type:"nav", data:{ logo:"LaunchSoon", links:["About","FAQ"], cta:"Notify Me" } },
      { id:"hero", type:"hero", data:{ badge:"Coming Q3 2025 → Be the first to know", headline:"Something Big Is Coming.", sub:"We're putting the finishing touches on something that will completely change how you do business online. Join the early access list to get in first.", cta1:"Notify Me on Launch →", cta2:"", mockup:false } },
      { id:"feat", type:"features", data:{ headline:"Why get on the list?", sub:"Early subscribers get exclusive perks.", items:[{ icon:"💰", title:"30% Early Bird Discount", desc:"Lock in 30% off the launch price — forever. This discount expires the moment we go public." },{ icon:"🧪", title:"Private Beta Access", desc:"Get access 2 weeks before the public launch to test the product and shape its direction." },{ icon:"🎁", title:"Founder's Bonus Pack", desc:"The first 100 subscribers receive $500 worth of exclusive bonus content and templates." }] } },
      { id:"form", type:"form", data:{ headline:"Join the early access list", sub:"432 people have already signed up. Don't miss out.", fields:[{ label:"First Name", ph:"Your name" },{ label:"Email Address", ph:"you@email.com" }], cta:"Count Me In → Get Early Access", note:"No spam. Unsubscribe any time. We'll only email you about the launch." } },
      { id:"cta", type:"cta", data:{ headline:"Don't miss the launch.", sub:"The early bird discount is only available to subscribers. Once we launch, it's gone.", cta:"Join the List — It's Free", note:"We're launching in approximately 47 days." } },
    ],
  },
];

// ─── Default data for newly-added sections ──────────────────────────────────────
const DEFAULT_SECTION_DATA: Record<SectionType, () => SectionData> = {
  nav: () => ({ logo:"YourBrand", links:["Features","Pricing","About"], cta:"Get Started" }),
  hero: () => ({ badge:"New → Add your announcement here", headline:"A bold headline that sells", sub:"Describe your offer in one or two clear sentences that make visitors want to keep reading.", cta1:"Get Started", cta2:"Learn More", mockup:true }),
  logobar: () => ({ headline:"Trusted by teams everywhere", logos:["Acme","TechBridge","Apex","GlobalTrade","SunCoast"] }),
  features: () => ({ headline:"Everything you need", sub:"A short subheading describing your features.", items:[
    { icon:"⚡", title:"Fast & Reliable", desc:"Describe a key benefit your customers care about most." },
    { icon:"🎯", title:"Built to Convert", desc:"Explain how this feature helps the visitor reach their goal." },
    { icon:"🔒", title:"Secure by Default", desc:"Reassure visitors with a trust-building detail here." },
  ] }),
  testimonials: () => ({ items:[
    { quote:"Add a glowing customer quote here — specific results work best.", name:"Jane Doe", role:"CEO, Company", initials:"JD", color:"#6366f1" },
    { quote:"A second testimonial adds extra social proof and credibility.", name:"John Smith", role:"Founder, Startup", initials:"JS", color:"#8b5cf6" },
  ] }),
  pricing: () => ({ headline:"Simple, honest pricing", sub:"No hidden fees. Cancel any time.", tiers:[
    { name:"Starter", price:"Free", period:"forever", desc:"For individuals getting started.", features:["Core features","Up to 250 leads","Community support"], cta:"Get Started" },
    { name:"Pro", price:"$49", period:"/month", desc:"For growing teams.", features:["Everything in Starter","Unlimited leads","Automations","Priority support"], cta:"Start Free Trial", featured:true },
    { name:"Business", price:"$149", period:"/month", desc:"For larger organisations.", features:["Everything in Pro","White-label","API access","Dedicated onboarding"], cta:"Talk to Sales" },
  ] }),
  cta: () => ({ headline:"Ready to get started?", sub:"Join thousands of happy customers already using our product.", cta:"Get Started Free", note:"No credit card required." }),
  form: () => ({ headline:"Get in touch", sub:"Fill out the form and we'll get back to you shortly.", fields:[{ label:"Name", ph:"Your name" },{ label:"Email", ph:"you@company.com" }], cta:"Submit", note:"🔒 We respect your privacy." }),
};

// Sections offered in the "Add Section" menu (nav is structural, excluded).
const ADDABLE_SECTIONS: { type: SectionType; label: string; icon: string }[] = [
  { type:"hero",         label:"Hero",         icon:"🚀" },
  { type:"features",     label:"Features",     icon:"⚡" },
  { type:"logobar",      label:"Logo Bar",     icon:"🏷️" },
  { type:"testimonials", label:"Testimonials", icon:"💬" },
  { type:"pricing",      label:"Pricing",      icon:"💳" },
  { type:"cta",          label:"Call to Action", icon:"📣" },
  { type:"form",         label:"Form",         icon:"📝" },
];

// ─── Site data ────────────────────────────────────────────────────────────────

const INIT_SITES: Site[] = TEMPLATES.slice(0,5).map((tpl, i) => ({
  id: i+1, name: tpl.name, slug: `jacsper.com/${tpl.name.toLowerCase().replace(/\s+/g,"-")}`,
  status: i < 3 ? "published" : "draft",
  visits: [8420,5180,2940,0,3610][i], leads: [312,441,198,0,289][i],
  conv: ["3.7%","8.5%","6.7%","—","8.0%"][i], updated: ["2h ago","Yesterday","3d ago","1w ago","5d ago"][i],
  tplId: tpl.id, sections: JSON.parse(JSON.stringify(tpl.sections)), theme: tpl.theme,
}));

const OVERVIEW = [
  { label:"Total Sites",    value:"5",     icon:Globe,        color:"#7c3aed" },
  { label:"Published",      value:"4",     icon:CheckCircle2, color:"#10b981" },
  { label:"Total Visits",   value:"20.1K", icon:Eye,          color:"#3b82f6" },
  { label:"Leads Captured", value:"1,240", icon:Users,        color:"#f59e0b" },
  { label:"Avg Conv. Rate", value:"6.7%",  icon:TrendingUp,   color:"#10b981" },
];

// ─── Field update helpers ─────────────────────────────────────────────────────

function setNested(obj: unknown, keys: string[], value: string | string[]): unknown {
  if (keys.length === 0) return value;
  const [head, ...tail] = keys;
  const idx = Number(head);
  if (!isNaN(idx) && Array.isArray(obj)) {
    const arr = [...obj];
    arr[idx] = setNested(arr[idx], tail, value);
    return arr;
  }
  const o = obj as Record<string, unknown>;
  return { ...o, [head]: setNested(o[head], tail, value) };
}

// Deterministic thousands separator — identical on server and client (avoids
// toLocaleString hydration mismatches that break Fast Refresh).
function fmtNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getNested(obj: unknown, keys: string[]): string {
  if (keys.length === 0) return String(obj ?? "");
  const [head, ...tail] = keys;
  const idx = Number(head);
  if (!isNaN(idx) && Array.isArray(obj)) return getNested(obj[idx], tail);
  return getNested((obj as Record<string, unknown>)[head], tail);
}

// ─── Section editor (right panel form) ───────────────────────────────────────

function F({ label, value, onChange, multi = false }: { label: string; value: string; onChange: (v: string) => void; multi?: boolean }) {
  const cls = "w-full px-2.5 py-2 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-zinc-700 transition-all resize-none";
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
      {multi
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={cls} />
        : <input value={value} onChange={e => onChange(e.target.value)} className={cls + " h-8"} />
      }
    </div>
  );
}

function SectionEditor({ sec, onUpdate }: { sec: Sec; onUpdate: (path: string, val: string) => void }) {
  const d = sec.data;

  switch (sec.type) {
    case "nav": {
      const n = d as NavData;
      return (
        <div className="space-y-3">
          <F label="Logo Text"  value={n.logo} onChange={v => onUpdate("logo", v)} />
          <F label="CTA Button" value={n.cta}  onChange={v => onUpdate("cta", v)} />
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">Nav Links</p>
            {n.links.map((lnk, i) => (
              <input key={i} value={lnk} onChange={e => onUpdate(`links.${i}`, e.target.value)}
                className="w-full h-8 px-2.5 mb-1.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all" />
            ))}
          </div>
        </div>
      );
    }
    case "hero": {
      const h = d as HeroData;
      return (
        <div className="space-y-3">
          <F label="Badge"         value={h.badge}    onChange={v => onUpdate("badge", v)} />
          <F label="Headline"      value={h.headline} onChange={v => onUpdate("headline", v)} multi />
          <F label="Subheading"    value={h.sub}      onChange={v => onUpdate("sub", v)} multi />
          <F label="Primary CTA"   value={h.cta1}     onChange={v => onUpdate("cta1", v)} />
          <F label="Secondary CTA" value={h.cta2}     onChange={v => onUpdate("cta2", v)} />
        </div>
      );
    }
    case "logobar": {
      const l = d as LogoData;
      return (
        <div className="space-y-3">
          <F label="Headline" value={l.headline} onChange={v => onUpdate("headline", v)} />
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">Logo Names</p>
            {l.logos.map((logo, i) => (
              <input key={i} value={logo} onChange={e => onUpdate(`logos.${i}`, e.target.value)}
                className="w-full h-8 px-2.5 mb-1.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all" />
            ))}
          </div>
        </div>
      );
    }
    case "features": {
      const f = d as FeatData;
      return (
        <div className="space-y-3">
          <F label="Section Headline" value={f.headline} onChange={v => onUpdate("headline", v)} />
          <F label="Section Sub"      value={f.sub}      onChange={v => onUpdate("sub", v)} multi />
          {f.items.map((item, i) => (
            <div key={i} className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-400 mb-2">Feature {i + 1}</p>
              <div className="space-y-1.5">
                <input value={item.icon} onChange={e => onUpdate(`items.${i}.icon`, e.target.value)}
                  className="w-full h-8 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all"
                  placeholder="Emoji icon" />
                <input value={item.title} onChange={e => onUpdate(`items.${i}.title`, e.target.value)}
                  className="w-full h-8 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all"
                  placeholder="Title" />
                <textarea value={item.desc} onChange={e => onUpdate(`items.${i}.desc`, e.target.value)} rows={2}
                  className="w-full px-2.5 py-2 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all resize-none"
                  placeholder="Description" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "testimonials": {
      const t = d as TestimData;
      return (
        <div className="space-y-3">
          {t.items.map((item, i) => (
            <div key={i} className={cn("space-y-1.5", i > 0 ? "pt-2 border-t border-zinc-100 dark:border-zinc-800" : "")}>
              {i > 0 && <p className="text-[10px] font-bold text-zinc-400 mb-1">Testimonial {i + 1}</p>}
              <F label="Quote"    value={item.quote} onChange={v => onUpdate(`items.${i}.quote`, v)} multi />
              <F label="Name"     value={item.name}  onChange={v => onUpdate(`items.${i}.name`, v)} />
              <F label="Role"     value={item.role}  onChange={v => onUpdate(`items.${i}.role`, v)} />
              <F label="Initials" value={item.initials} onChange={v => onUpdate(`items.${i}.initials`, v)} />
            </div>
          ))}
        </div>
      );
    }
    case "pricing": {
      const p = d as PriceData;
      return (
        <div className="space-y-3">
          <F label="Section Headline" value={p.headline} onChange={v => onUpdate("headline", v)} />
          <F label="Section Sub"      value={p.sub}      onChange={v => onUpdate("sub", v)} />
          {p.tiers.map((tier, i) => (
            <div key={i} className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-400 mb-2">Tier {i + 1}{tier.featured ? " ⭐" : ""}</p>
              <div className="space-y-1.5">
                <input value={tier.name}   onChange={e => onUpdate(`tiers.${i}.name`, e.target.value)}   className="w-full h-8 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all" placeholder="Tier name" />
                <div className="flex gap-1.5">
                  <input value={tier.price}  onChange={e => onUpdate(`tiers.${i}.price`, e.target.value)}  className="flex-1 h-8 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all" placeholder="Price" />
                  <input value={tier.period} onChange={e => onUpdate(`tiers.${i}.period`, e.target.value)} className="flex-1 h-8 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all" placeholder="/mo" />
                </div>
                <textarea value={tier.desc} onChange={e => onUpdate(`tiers.${i}.desc`, e.target.value)} rows={2}
                  className="w-full px-2.5 py-2 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all resize-none" placeholder="Description" />
                <input value={tier.cta} onChange={e => onUpdate(`tiers.${i}.cta`, e.target.value)} className="w-full h-8 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all" placeholder="CTA button text" />
                <div>
                  <p className="text-[10px] text-zinc-400 mb-1">Features (one per line)</p>
                  <textarea value={tier.features.join("\n")} onChange={e => onUpdate(`tiers.${i}.features`, e.target.value)}
                    rows={4} className="w-full px-2.5 py-2 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all resize-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "cta": {
      const c = d as CTAData;
      return (
        <div className="space-y-3">
          <F label="Headline" value={c.headline} onChange={v => onUpdate("headline", v)} multi />
          <F label="Sub text" value={c.sub}      onChange={v => onUpdate("sub", v)} multi />
          <F label="Button"   value={c.cta}      onChange={v => onUpdate("cta", v)} />
          <F label="Note"     value={c.note}     onChange={v => onUpdate("note", v)} />
        </div>
      );
    }
    case "form": {
      const fm = d as FormData;
      return (
        <div className="space-y-3">
          <F label="Headline"   value={fm.headline} onChange={v => onUpdate("headline", v)} multi />
          <F label="Sub text"   value={fm.sub}      onChange={v => onUpdate("sub", v)} multi />
          <F label="CTA Button" value={fm.cta}      onChange={v => onUpdate("cta", v)} />
          <F label="Privacy note" value={fm.note}   onChange={v => onUpdate("note", v)} />
          <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-bold text-zinc-400 mb-2">Form Fields</p>
            {fm.fields.map((field, i) => (
              <div key={i} className="space-y-1 mb-2">
                <input value={field.label} onChange={e => onUpdate(`fields.${i}.label`, e.target.value)}
                  className="w-full h-8 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all" placeholder="Label" />
                <input value={field.ph} onChange={e => onUpdate(`fields.${i}.ph`, e.target.value)}
                  className="w-full h-8 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-all" placeholder="Placeholder text" />
              </div>
            ))}
          </div>
        </div>
      );
    }
    default: return null;
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WebsitesPage() {
  const { branding }           = useBranding();
  const { meter }              = useUsage();
  const [tab, setTab]          = useState<Tab>("sites");
  const [sites, setSites]      = useState<Site[]>(INIT_SITES);
  const [editing, setEditing]  = useState<Site | null>(null);
  const [device, setDevice]    = useState<Device>("desktop");
  const [selectedSec, setSelectedSec]   = useState<string | null>(null);
  const [selectedEl,  setSelectedEl]    = useState<{ secId: string; path: string; value: string } | null>(null);
  const [previewTpl,  setPreviewTpl]    = useState<Template | null>(null);
  const [showNewModal,setShowNewModal]  = useState(false);
  const [showLibrary, setShowLibrary]   = useState(false);
  const [aiPrompt, setAiPrompt]         = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStatus, setAiStatus]         = useState("");
  const [catFilter,   setCatFilter]     = useState<TplCat>("All");
  const [search,      setSearch]        = useState("");
  const [addSecOpen,  setAddSecOpen]    = useState(false);
  const [aiSecPrompt, setAiSecPrompt]   = useState("");
  const [aiSecLoading,setAiSecLoading]  = useState(false);
  const addSecRef = useRef<HTMLDivElement>(null);
  const secBgInputRef = useRef<HTMLInputElement>(null);
  const heroImgInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) { if (addSecRef.current && !addSecRef.current.contains(e.target as Node)) setAddSecOpen(false); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filteredTpls = TEMPLATES.filter(t =>
    (catFilter === "All" || t.cat === catFilter) &&
    (search === "" || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  function updateSectionField(secId: string, path: string, value: string) {
    const update = (site: Site): Site => ({
      ...site,
      sections: site.sections.map(sec => {
        if (sec.id !== secId) return sec;
        // pricing features field: split by newline back into array
        if (path.match(/^tiers\.\d+\.features$/)) {
          const keys = path.split(".");
          const newData = setNested(sec.data, keys, value.split("\n").filter(Boolean)) as SectionData;
          return { ...sec, data: newData };
        }
        const newData = setNested(sec.data, path.split("."), value) as SectionData;
        return { ...sec, data: newData };
      }),
    });
    setEditing(prev => prev ? update(prev) : prev);
    setSites(prev => prev.map(s => s.id === editing?.id ? update(s) : s));
  }

  function moveSection(idx: number, dir: -1|1) {
    if (!editing) return;
    const secs = [...editing.sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= secs.length) return;
    [secs[idx], secs[swap]] = [secs[swap], secs[idx]];
    const u = { ...editing, sections: secs };
    setEditing(u); setSites(prev => prev.map(s => s.id === u.id ? u : s));
  }
  function deleteSection(idx: number) {
    if (!editing) return;
    const u = { ...editing, sections: editing.sections.filter((_,i) => i !== idx) };
    setEditing(u); setSites(prev => prev.map(s => s.id === u.id ? u : s));
  }
  function addSection(type: SectionType) {
    if (!editing) return;
    const newSec: Sec = { id: `sec-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, type, data: DEFAULT_SECTION_DATA[type]() };
    // Insert just below the currently selected section, else append before the footer.
    const idx = editing.sections.findIndex(s => s.id === selectedSec);
    const secs = [...editing.sections];
    secs.splice(idx >= 0 ? idx + 1 : secs.length, 0, newSec);
    const u = { ...editing, sections: secs };
    setEditing(u); setSites(prev => prev.map(s => s.id === u.id ? u : s));
    setSelectedSec(newSec.id); setSelectedEl(null); setAddSecOpen(false);
  }
  function setAccent(color: string) {
    if (!editing) return;
    const theme = { ...editing.theme, accent: color, accentGlow: color+"40", accentMuted: color+"18" };
    const u = { ...editing, theme };
    setEditing(u); setSites(prev => prev.map(s => s.id === u.id ? u : s));
  }
  // Replace a whole section (data and/or bg) on the active site.
  function patchSection(secId: string, patch: Partial<Sec>) {
    setEditing(prev => prev ? { ...prev, sections: prev.sections.map(s => s.id === secId ? { ...s, ...patch } : s) } : prev);
    setSites(prev => prev.map(site => site.id === editing?.id
      ? { ...site, sections: site.sections.map(s => s.id === secId ? { ...s, ...patch } : s) } : site));
  }
  // Ask the AI to rewrite the selected section's content from a plain-language instruction.
  async function aiEditSection(sec: Sec, instruction: string) {
    setAiSecLoading(true);
    try {
      const prompt = `You are editing one section of a marketing landing page. The section type is "${sec.type}". `
        + `Here is its current content as JSON:\n${JSON.stringify(sec.data)}\n\n`
        + `Apply this instruction: "${instruction}".\n`
        + `Return ONLY the updated JSON object with the EXACT same keys and structure (no new or removed keys, keep arrays the same length unless the instruction clearly asks otherwise). No code fences, no commentary — raw JSON only.`;
      const r = await fetch("/api/jacsper", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ prompt, systemPrompt: (branding as { systemPrompt?: string }).systemPrompt, maxTokens: 1500 }) });
      const d = await r.json();
      const raw = (d.text ?? "").trim();
      const str = raw.startsWith("{") ? raw : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      const parsed = JSON.parse(str);
      patchSection(sec.id, { data: { ...(sec.data as object), ...parsed } as SectionData });
      setAiSecPrompt("");
    } catch { /* ignore parse/network errors, leave section unchanged */ }
    setAiSecLoading(false);
  }
  // Per-element style override (text colour + size scale) at a given data path.
  function setElStyle(secId: string, path: string, patch: Partial<ElStyle>) {
    setEditing(prev => prev ? { ...prev, sections: prev.sections.map(s => {
      if (s.id !== secId) return s;
      const styles = { ...(s.styles ?? {}) };
      const next = { ...(styles[path] ?? {}), ...patch };
      if (next.color === undefined && next.scale === undefined && next.font === undefined) delete styles[path];
      else styles[path] = next;
      return { ...s, styles };
    }) } : prev);
    setSites(prev => prev.map(site => site.id === editing?.id ? { ...site, sections: site.sections.map(s => {
      if (s.id !== secId) return s;
      const styles = { ...(s.styles ?? {}) };
      const next = { ...(styles[path] ?? {}), ...patch };
      if (next.color === undefined && next.scale === undefined && next.font === undefined) delete styles[path];
      else styles[path] = next;
      return { ...s, styles };
    }) } : site));
  }
  function readImage(file: File, cb: (url: string) => void) {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result as string);
    reader.readAsDataURL(file);
  }
  // Hyperlink for a button/text element at a given path.
  function setElLink(secId: string, path: string, url: string) {
    const apply = (s: Sec): Sec => {
      if (s.id !== secId) return s;
      const links = { ...(s.links ?? {}) };
      if (url.trim()) links[path] = url.trim(); else delete links[path];
      return { ...s, links };
    };
    setEditing(prev => prev ? { ...prev, sections: prev.sections.map(apply) } : prev);
    setSites(prev => prev.map(site => site.id === editing?.id ? { ...site, sections: site.sections.map(apply) } : site));
  }
  function handleSecBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; const secId = uploadTargetRef.current;
    if (file && secId) readImage(file, url => patchSection(secId, { bg: url }));
    e.target.value = "";
  }
  function handleHeroImgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; const secId = uploadTargetRef.current;
    if (file && secId) {
      const sec = editing?.sections.find(s => s.id === secId);
      if (sec) readImage(file, url => patchSection(secId, { data: { ...(sec.data as HeroData), image: url } }));
    }
    e.target.value = "";
  }

  // Section-level tools (AI rewrite + background/photo uploads). Shown whenever a
  // section is active — even while editing a specific text element inside it.
  function sectionTools(sec: Sec) {
    return (
      <>
        {/* AI section editor */}
        <div className="mb-3 p-2.5 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3 h-3 text-violet-500" strokeWidth={2.2} />
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Edit with AI</p>
          </div>
          <textarea value={aiSecPrompt} onChange={e => setAiSecPrompt(e.target.value)}
            placeholder={`e.g. "Rewrite for a dental clinic" or "make it punchier"`}
            rows={2} disabled={aiSecLoading}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && aiSecPrompt.trim()) { e.preventDefault(); aiEditSection(sec, aiSecPrompt.trim()); } }}
            className="w-full px-2.5 py-2 text-[12px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-violet-200 dark:border-violet-900/40 rounded-lg outline-none focus:border-violet-400 transition-all resize-none disabled:opacity-60" />
          <button onClick={() => aiSecPrompt.trim() && aiEditSection(sec, aiSecPrompt.trim())}
            disabled={!aiSecPrompt.trim() || aiSecLoading}
            className="mt-1.5 w-full h-8 rounded-lg text-[12px] font-semibold text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: `linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})` }}>
            {aiSecLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Rewriting…</> : <><Sparkles className="w-3.5 h-3.5" />Rewrite Section</>}
          </button>
        </div>

        {/* Background image upload */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Background Image</p>
          {sec.bg ? (
            <div className="flex items-center gap-2">
              <div className="w-12 h-8 rounded-lg border border-black/10 dark:border-white/15 flex-shrink-0 bg-center bg-cover" style={{ backgroundImage:`url("${sec.bg}")` }} />
              <button onClick={() => { uploadTargetRef.current = sec.id; secBgInputRef.current?.click(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <Upload className="w-3 h-3" />Replace
              </button>
              <button onClick={() => patchSection(sec.id, { bg: undefined })} title="Remove background"
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button onClick={() => { uploadTargetRef.current = sec.id; secBgInputRef.current?.click(); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-[11px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
              <Upload className="w-3.5 h-3.5" strokeWidth={2} />Upload background
            </button>
          )}
        </div>

        {/* Hero photo upload */}
        {sec.type === "hero" && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Hero Photo</p>
            {(sec.data as HeroData).image ? (
              <div className="flex items-center gap-2">
                <div className="w-12 h-8 rounded-lg border border-black/10 dark:border-white/15 flex-shrink-0 bg-center bg-cover" style={{ backgroundImage:`url("${(sec.data as HeroData).image}")` }} />
                <button onClick={() => { uploadTargetRef.current = sec.id; heroImgInputRef.current?.click(); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <Upload className="w-3 h-3" />Replace
                </button>
                <button onClick={() => patchSection(sec.id, { data: { ...(sec.data as HeroData), image: undefined } })} title="Remove photo"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button onClick={() => { uploadTargetRef.current = sec.id; heroImgInputRef.current?.click(); }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-[11px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                <Upload className="w-3.5 h-3.5" strokeWidth={2} />Upload photo (replaces mockup)
              </button>
            )}
          </div>
        )}
      </>
    );
  }
  function duplicate(site: Site) {
    setSites(prev => [...prev, { ...site, id: Date.now(), name: site.name+" (Copy)", status:"draft", visits:0, leads:0, conv:"—", updated:"Just now", sections: JSON.parse(JSON.stringify(site.sections)) }]);
  }
  function removeSite(id: number) { setSites(prev => prev.filter(s => s.id !== id)); }
  function toggleStatus(id: number) {
    setSites(prev => prev.map(s => s.id === id ? { ...s, status: s.status === "published" ? "draft" : "published" } : s));
    setEditing(prev => prev?.id === id ? { ...prev, status: prev.status === "published" ? "draft" : "published" } : prev);
  }
  function createFromTemplate(tpl: Template) {
    const site: Site = { id: Date.now(), name: tpl.name, tplId: tpl.id, slug: `jacsper.com/${tpl.name.toLowerCase().replace(/\s+/g,"-")}`, status:"draft", visits:0, leads:0, conv:"—", updated:"Just now", sections: JSON.parse(JSON.stringify(tpl.sections)), theme: tpl.theme };
    setSites(prev => [...prev, site]);
    setPreviewTpl(null); setShowLibrary(false); setShowNewModal(false); setEditing(site);
  }
  function createBlank() {
    const site: Site = { id: Date.now(), name: "Untitled Site", tplId: 1, slug: "jacsper.com/untitled", status:"draft", visits:0, leads:0, conv:"—", updated:"Just now", sections: JSON.parse(JSON.stringify(TEMPLATES[0].sections)), theme: TEMPLATES[0].theme };
    setSites(prev => [...prev, site]);
    setShowNewModal(false); setEditing(site);
  }

  // ── AI site generation ────────────────────────────────────────────────
  function uidSec() { return `sec-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }
  function buildSection(type: SectionType, patch: Record<string, unknown> | undefined): Sec {
    return { id: uidSec(), type, data: { ...DEFAULT_SECTION_DATA[type](), ...(patch ?? {}) } as SectionData };
  }
  // Free AI image generation (Pollinations) — turns a text prompt into a real image, no key needed.
  function aiImage(q: string, w = 1280, h = 760) {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}?width=${w}&height=${h}&nologo=true&seed=${Math.floor(Math.random()*99999)}`;
  }
  function titleCase(s: string) { return s.replace(/[^a-zA-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0,3).map(w => w[0].toUpperCase()+w.slice(1)).join(" ") || "New Site"; }

  // Assemble a rich, image-filled site from an AI (or heuristic) spec.
  function assembleSite(brief: string, spec: Record<string, unknown>): Site {
    const theme = JSON.parse(JSON.stringify(TEMPLATES[0].theme)) as Theme;
    const accent = typeof spec.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(spec.accent as string) ? spec.accent as string : theme.accent;
    theme.accent = accent; theme.accentGlow = accent + "40"; theme.accentMuted = accent + "18"; theme.heroOrb = accent;

    const imgQuery = (spec.imageQuery as string) || brief;
    const hero = buildSection("hero", { ...(spec.hero as object), image: aiImage(`${imgQuery}, professional hero product photography, cinematic lighting, high detail`) });
    const ctaSec = buildSection("cta", spec.cta as Record<string, unknown>);
    ctaSec.bg = aiImage(`${imgQuery}, abstract atmospheric background, soft gradient, premium`, 1600, 700);

    const sections: Sec[] = [ buildSection("nav", spec.nav as Record<string, unknown>), hero ];
    if (spec.logobar) sections.push(buildSection("logobar", spec.logobar as Record<string, unknown>));
    sections.push(buildSection("features", spec.features as Record<string, unknown>));
    if (spec.testimonials) sections.push(buildSection("testimonials", spec.testimonials as Record<string, unknown>));
    if (spec.pricing) sections.push(buildSection("pricing", spec.pricing as Record<string, unknown>));
    sections.push(ctaSec);

    const name = (spec.name as string) || titleCase(brief);
    return { id: Date.now(), name, tplId: 1, slug: `jacsper.com/${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`, status:"draft", visits:0, leads:0, conv:"—", updated:"Just now", sections, theme };
  }

  // Heuristic spec when no AI key is configured — still produces a polished site.
  function fallbackSpec(brief: string): Record<string, unknown> {
    const name = titleCase(brief);
    const base = TEMPLATES[0]; // professional copy as a starting point
    const get = (t: SectionType) => JSON.parse(JSON.stringify(base.sections.find(s => s.type === t)?.data ?? {}));
    const hero = get("hero"); hero.headline = brief.length < 60 ? brief.replace(/^./, c => c.toUpperCase()) : hero.headline;
    return { name, accent: base.theme.accent, imageQuery: brief, nav: { ...get("nav"), logo: name }, hero, logobar: get("logobar"), features: get("features"), testimonials: get("testimonials"), pricing: get("pricing"), cta: get("cta") };
  }

  async function generateSite() {
    const brief = aiPrompt.trim(); if (!brief || aiGenerating) return;
    const gate = meter("sites");
    if (!gate.allowed) {
      setAiStatus(`You've used all ${gate.limit} AI websites on your plan this month.`);
      return;
    }
    setAiGenerating(true);
    const steps = ["Understanding your business…", "Designing the layout…", "Writing the copy…", "Generating images…", "Choosing a palette…", "Assembling sections…"];
    let si = 0; setAiStatus(steps[0]);
    const ticker = setInterval(() => { si = (si + 1) % steps.length; setAiStatus(steps[si]); }, 1000);
    let spec: Record<string, unknown> | null = null;
    try {
      const prompt = `Create landing-page copy for this business: "${brief}".\n`
        + `Return ONLY raw JSON (no code fences) with this exact shape:\n`
        + `{"name":"Site name","accent":"#hexcolor matching the brand vibe","imageQuery":"3-6 words describing an ideal hero photo",`
        + `"nav":{"logo":"Brand","links":["Features","Pricing","About"],"cta":"Get Started"},`
        + `"hero":{"badge":"short badge","headline":"big bold headline","sub":"1-2 sentence subheading","cta1":"primary button","cta2":"secondary button"},`
        + `"logobar":{"headline":"Trusted by line","logos":["Brand","Brand","Brand","Brand","Brand"]},`
        + `"features":{"headline":"section title","sub":"subtitle","items":[{"icon":"emoji","title":"Feature","desc":"one sentence"},{"icon":"emoji","title":"Feature","desc":"one sentence"},{"icon":"emoji","title":"Feature","desc":"one sentence"}]},`
        + `"testimonials":{"items":[{"quote":"happy customer quote","name":"Full Name","role":"Title, Company","initials":"FN","color":"${accentDefault()}"}]},`
        + `"pricing":{"headline":"Pricing title","sub":"subtitle","tiers":[{"name":"Starter","price":"Free","period":"forever","desc":"line","features":["a","b","c"],"cta":"Start"},{"name":"Pro","price":"$49","period":"/mo","desc":"line","features":["a","b","c","d"],"cta":"Try Pro","featured":true},{"name":"Business","price":"$149","period":"/mo","desc":"line","features":["a","b","c"],"cta":"Contact"}]},`
        + `"cta":{"headline":"final call to action","sub":"persuasive line","cta":"button text","note":"reassurance line"}}`;
      const r = await fetch("/api/jacsper", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ prompt, systemPrompt: (branding as { systemPrompt?: string }).systemPrompt, maxTokens: 1800 }) });
      const d = await r.json();
      if (d.text) { const raw = String(d.text).trim(); spec = JSON.parse(raw.startsWith("{") ? raw : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)); }
    } catch { /* fall through to heuristic */ }

    if (!spec) { setAiStatus("Designing your site…"); spec = fallbackSpec(brief); }
    const site = assembleSite(brief, spec);
    setSites(prev => [...prev, site]);
    clearInterval(ticker);
    setAiStatus("Done ✨");
    setTimeout(() => { setAiGenerating(false); setShowNewModal(false); setAiPrompt(""); setEditing(site); }, 600);
  }
  function accentDefault() { return "#6366f1"; }

  // ── Template preview modal ────────────────────────────────────────────
  if (previewTpl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-w-6xl" style={{ height: "90vh" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{previewTpl.name}</p>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{previewTpl.cat}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-medium">{previewTpl.badge}</span>
              </div>
              <p className="text-[12px] text-zinc-400">{previewTpl.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => createFromTemplate(previewTpl)}
                className="h-8 px-4 rounded-xl text-[12.5px] font-semibold text-white transition-all active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})` }}>
                Use This Template
              </button>
              <button onClick={() => setPreviewTpl(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 p-6">
            <div className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-700">
              <PagePreview sections={previewTpl.sections} theme={previewTpl.theme} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Builder ───────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-100 dark:bg-zinc-950">
        {/* Hidden file inputs for section background & hero photo uploads */}
        <input ref={secBgInputRef} type="file" accept="image/*" className="hidden" onChange={handleSecBgUpload} />
        <input ref={heroImgInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroImgUpload} />
        {/* Topbar */}
        <div className="h-12 flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 gap-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => { setEditing(null); setSelectedSec(null); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex-shrink-0">
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 truncate">{editing.name}</p>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
              editing.status === "published" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            )}>{editing.status === "published" ? "Live" : "Draft"}</span>
          </div>
          <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            {([["desktop",Monitor],["tablet",Tablet],["mobile",Smartphone]] as [Device,React.ElementType][]).map(([d,Icon]) => (
              <button key={d} onClick={() => setDevice(d)} className={cn("w-7 h-7 rounded-md flex items-center justify-center transition-all",
                device === d ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-700 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              )}><Icon className="w-3.5 h-3.5" strokeWidth={1.75} /></button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="h-7 px-3 rounded-lg text-[12px] font-medium text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5">
              <Eye className="w-3 h-3" strokeWidth={1.75} /> Preview
            </button>
            <button onClick={() => toggleStatus(editing.id)}
              className="h-7 px-4 rounded-lg text-[12px] font-semibold text-white transition-all active:scale-[0.97]"
              style={{ background: `linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})` }}>
              {editing.status === "published" ? "Unpublish" : "Publish"}
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left — sections */}
          <div className="w-52 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-y-auto">
            <div className="px-3 pt-3 pb-3">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Page Sections</p>
              <div className="space-y-1">
                {editing.sections.map((sec, idx) => (
                  <button key={sec.id} onClick={() => setSelectedSec(sec.id)}
                    className={cn("w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all group",
                      selectedSec === sec.id ? "text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-300"
                    )}
                    style={selectedSec === sec.id ? { background: `linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})` } : {}}>
                    <div className="w-4 h-4 rounded-md flex-shrink-0 border overflow-hidden" style={{ borderColor: selectedSec === sec.id ? "rgba(255,255,255,0.3)" : "#e4e4e7" }}>
                      <div className="w-full h-full" style={{ background: typeof editing.theme[sec.type === "hero" ? "heroBg" : sec.type === "nav" ? "navBg" : "sectionBg"] === "string" ? (editing.theme[sec.type === "hero" ? "heroBg" : sec.type === "nav" ? "navBg" : "sectionBg"] as string).split(",")[0].replace("radial-gradient(ellipse 80% 60% at 50% -10%","").replace("linear-gradient(135deg","").replace("(","").trim() : editing.theme.accent }} />
                    </div>
                    <span className="text-[12px] font-medium truncate flex-1 capitalize">{sec.type}</span>
                    <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span onClick={e => { e.stopPropagation(); moveSection(idx,-1); }} className="p-0.5 hover:bg-white/20 rounded"><ChevronUp className="w-3 h-3" strokeWidth={2.5} /></span>
                      <span onClick={e => { e.stopPropagation(); moveSection(idx,1); }} className="p-0.5 hover:bg-white/20 rounded"><ChevronDown className="w-3 h-3" strokeWidth={2.5} /></span>
                      <span onClick={e => { e.stopPropagation(); deleteSection(idx); }} className="p-0.5 hover:bg-red-400 rounded"><Trash2 className="w-3 h-3" strokeWidth={2} /></span>
                    </div>
                  </button>
                ))}
              </div>
              <div ref={addSecRef} className="relative mt-2">
                <button onClick={() => setAddSecOpen(v => !v)}
                  className={cn("w-full flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all border border-dashed",
                    addSecOpen ? "text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300")}>
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  <span className="text-[12px] font-medium">Add Section</span>
                </button>
                {addSecOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl shadow-black/10">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-1.5 py-1">Add a section</p>
                    {ADDABLE_SECTIONS.map(({ type, label, icon }) => (
                      <button key={type} onClick={() => addSection(type)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                        <span className="text-[13px] w-4 text-center flex-shrink-0">{icon}</span>
                        <span className="text-[12px] font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Centre — canvas */}
          <div className="flex-1 overflow-auto flex items-start justify-center py-8 px-6" style={{ background: "#e2e8f0" }}
            onClick={() => { setSelectedSec(null); setSelectedEl(null); }}>
            <div onClick={e => e.stopPropagation()}
              className={cn("rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ring-1 ring-black/10",
                device === "desktop" ? "w-full max-w-4xl" : device === "tablet" ? "w-[768px]" : "w-[390px]"
              )}>
              {editing.sections.map((sec, idx) => {
                const isSelected = selectedSec === sec.id;
                return (
                  <div
                    key={sec.id}
                    onClick={() => setSelectedSec(sec.id)}
                    className="relative group/sec cursor-pointer"
                    style={{
                      boxShadow: isSelected ? "inset 0 0 0 2px #3b82f6" : "none",
                      transition: "box-shadow 0.15s",
                    }}
                  >
                    {/* Hover overlay — shows when not selected */}
                    {!isSelected && (
                      <div className="absolute inset-0 bg-blue-500/0 group-hover/sec:bg-blue-500/5 transition-colors duration-150 z-10 pointer-events-none" />
                    )}

                    {/* Hover label */}
                    <div className={cn(
                      "absolute top-0 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-b-lg text-[11px] font-semibold shadow-md transition-all duration-150 pointer-events-none capitalize",
                      isSelected
                        ? "bg-blue-500 text-white opacity-100 translate-y-0"
                        : "bg-zinc-800/80 text-white opacity-0 group-hover/sec:opacity-100 -translate-y-1 group-hover/sec:translate-y-0"
                    )}>
                      {isSelected ? "✏️ Editing: " : ""}{sec.type}
                    </div>

                    {/* Selected: action toolbar */}
                    {isSelected && (
                      <div className="absolute top-0 right-2 z-20 flex items-center gap-0.5 bg-blue-500 text-white rounded-b-lg px-1.5 py-1 shadow-lg">
                        <button onClick={e => { e.stopPropagation(); moveSection(idx, -1); }} title="Move up"
                          className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded transition-all">
                          <ChevronUp className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); moveSection(idx, 1); }} title="Move down"
                          className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded transition-all">
                          <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                        <div className="w-px h-3 bg-white/30 mx-0.5" />
                        <button onClick={e => { e.stopPropagation(); deleteSection(idx); }} title="Delete section"
                          className="w-5 h-5 flex items-center justify-center hover:bg-red-400 rounded transition-all">
                          <Trash2 className="w-3 h-3" strokeWidth={2} />
                        </button>
                      </div>
                    )}

                    <SectionRenderer sec={sec} theme={editing.theme} ctx={{
                    secId: sec.id,
                    selPath: selectedEl?.secId === sec.id ? selectedEl.path : null,
                    styles: sec.styles,
                    links: sec.links,
                    onSel: (path, value) => {
                      setSelectedSec(sec.id);
                      setSelectedEl({ secId: sec.id, path, value });
                    },
                  }} />
                  </div>
                );
              })}
              <FooterRenderer theme={editing.theme} />
            </div>
          </div>

          {/* Right — properties */}
          <div className="w-60 flex-shrink-0 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto px-4 py-4"
            key={(selectedEl?.secId ?? "") + (selectedEl?.path ?? "") + (selectedSec ?? "page")}>
            {selectedEl ? (() => {
              const label = selectedEl.path.split(".").pop() ?? selectedEl.path;
              const isMultiline = ["headline","sub","quote","desc","note"].some(k => selectedEl.path.endsWith(k));
              const elSec = editing.sections.find(s => s.id === selectedEl.secId);
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Editing Element</p>
                      <p className="text-[11px] text-zinc-400 capitalize mt-0.5">{label.replace(/\./g," › ")}</p>
                    </div>
                    <button onClick={() => setSelectedEl(null)} className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                      <X className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </div>
                  {(() => {
                    const isButton = /(^|\.)cta\d?$/.test(selectedEl.path);
                    return (
                      <>
                        <div className="mb-3">
                          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">{isButton ? "Button Label" : "Content"}</p>
                          {isButton ? (
                            <input
                              autoFocus
                              value={selectedEl.value}
                              onChange={e => {
                                const v = e.target.value;
                                setSelectedEl(prev => prev ? { ...prev, value: v } : prev);
                                updateSectionField(selectedEl.secId, selectedEl.path, v);
                              }}
                              className="w-full h-9 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-zinc-700 transition-all"
                            />
                          ) : (
                            <RichField value={selectedEl.value} multi={isMultiline}
                              onChange={v => { setSelectedEl(prev => prev ? { ...prev, value: v } : prev); updateSectionField(selectedEl.secId, selectedEl.path, v); }} />
                          )}
                        </div>

                        {/* Hyperlink — for buttons (and any element if desired) */}
                        {isButton && (
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5 flex items-center gap-1"><Link2 className="w-3 h-3" />Link URL</p>
                            <input
                              value={elSec?.links?.[selectedEl.path] ?? ""}
                              placeholder="https://example.com"
                              onChange={e => setElLink(selectedEl.secId, selectedEl.path, e.target.value)}
                              className="w-full h-9 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-zinc-700 transition-all" />
                            <p className="text-[10px] text-zinc-400 mt-1">Opens in a new tab on the live site.</p>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Text colour + font size for this element */}
                  {(() => {
                    const ov = elSec?.styles?.[selectedEl.path] ?? {};
                    const scalePct = Math.round((ov.scale ?? 1) * 100);
                    const setScale = (d: number) => setElStyle(selectedEl.secId, selectedEl.path, { scale: Math.min(2, Math.max(0.6, Math.round(((ov.scale ?? 1) + d) * 100) / 100)) });
                    return (
                      <>
                        <div className="mb-3">
                          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Text Color</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {["#ffffff","#0f172a","#64748b","#ef4444","#f97316","#f59e0b","#10b981","#06b6d4","#3b82f6","#8b5cf6","#ec4899"].map(c => (
                              <button key={c} onClick={() => setElStyle(selectedEl.secId, selectedEl.path, { color: c })}
                                className={cn("w-5 h-5 rounded-full border-2 transition-transform hover:scale-110", ov.color?.toLowerCase()===c.toLowerCase() ? "" : "border-black/10 dark:border-white/15")}
                                style={{ background:c, ...(ov.color?.toLowerCase()===c.toLowerCase() ? { borderColor: branding.primaryColor, boxShadow:`0 0 0 2px ${branding.primaryColor}` } : {}) }} />
                            ))}
                            <label className="relative w-5 h-5 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 cursor-pointer overflow-hidden flex-shrink-0" title="Custom color" style={{ background: ov.color ?? "transparent" }}>
                              <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(ov.color ?? "") ? ov.color! : "#000000"} onChange={e => setElStyle(selectedEl.secId, selectedEl.path, { color: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </label>
                            {ov.color && (
                              <button onClick={() => setElStyle(selectedEl.secId, selectedEl.path, { color: undefined })} title="Reset color"
                                className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                                <X className="w-3 h-3" strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Font Size</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                              <button onClick={() => setScale(-0.1)} className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100">−</button>
                              <span className="w-12 text-center text-[12px] tabular-nums text-zinc-600 dark:text-zinc-300">{scalePct}%</span>
                              <button onClick={() => setScale(0.1)} className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100">+</button>
                            </div>
                            {ov.scale && (
                              <button onClick={() => setElStyle(selectedEl.secId, selectedEl.path, { scale: undefined })}
                                className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">Reset</button>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Font</p>
                          <select value={ov.font ?? ""}
                            onChange={e => setElStyle(selectedEl.secId, selectedEl.path, { font: e.target.value || undefined })}
                            className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[12px] text-zinc-700 dark:text-zinc-200 outline-none focus:border-blue-400 cursor-pointer">
                            {WEB_FONTS.map(f => <option key={f.label} value={f.stack} style={{ fontFamily: f.stack || undefined }}>{f.label}</option>)}
                          </select>
                        </div>
                      </>
                    );
                  })()}

                  {/* Section-level tools also available while editing an element */}
                  {elSec && (
                    <div className="pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800">
                      {sectionTools(elSec)}
                    </div>
                  )}
                </>
              );
            })() : selectedSec ? (() => {
              const sec = editing.sections.find(s => s.id === selectedSec);
              if (!sec) return null;
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest capitalize">{sec.type} Section</p>
                    <button onClick={() => setSelectedSec(null)} className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                      <X className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </div>
                  {sectionTools(sec)}

                  <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">Click any text or button on the canvas to select and edit it.</p>
                  <SectionEditor
                    sec={sec}
                    onUpdate={(path, val) => updateSectionField(sec.id, path, val)}
                  />
                </>
              );
            })() : (
              <>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Page Settings</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 mb-1.5">Page Name</p>
                    <input value={editing.name} onChange={e => setEditing(p => p ? { ...p, name: e.target.value } : p)}
                      className="w-full h-8 px-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 mb-1.5">URL</p>
                    <input value={editing.slug} onChange={e => setEditing(p => p ? { ...p, slug: e.target.value } : p)}
                      className="w-full h-8 px-2.5 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-blue-400 transition-colors font-mono" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 mb-1.5">Accent Color</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["#7c3aed","#2563eb","#059669","#e11d48","#f97316","#0ea5e9","#8b5cf6","#e4e4e7"].map(c => (
                        <button key={c} onClick={() => setAccent(c)}
                          className={cn("w-6 h-6 rounded-lg border-2 transition-transform hover:scale-110", editing.theme.accent.toLowerCase()===c.toLowerCase() ? "" : "border-black/10 dark:border-white/15")}
                          style={{ background:c, ...(editing.theme.accent.toLowerCase()===c.toLowerCase() ? { borderColor: branding.primaryColor, boxShadow:`0 0 0 2px ${branding.primaryColor}` } : {}) }} />
                      ))}
                      <label className="relative w-6 h-6 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 cursor-pointer overflow-hidden flex items-center justify-center" title="Custom accent" style={{ background: editing.theme.accent }}>
                        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(editing.theme.accent)?editing.theme.accent:"#7c3aed"} onChange={e => setAccent(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </label>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 mb-1.5">Status</p>
                    <button onClick={() => toggleStatus(editing.id)}
                      className={cn("w-full h-8 rounded-lg text-[12px] font-semibold transition-all",
                        editing.status === "published" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700"
                      )}>
                      {editing.status === "published" ? "● Live" : "○ Draft — Click to Publish"}
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 mb-1.5">Sections ({editing.sections.length})</p>
                    <div className="space-y-1">
                      {editing.sections.map(s => (
                        <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
                          onClick={() => setSelectedSec(s.id)}>
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: editing.theme.accent }} />
                          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 flex-1 truncate capitalize">{s.type}</span>
                          <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600" strokeWidth={2} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────
  return (
    <div className="px-8 py-7 max-w-[1400px]">
      {/* New Site Modal — AI generator */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => !aiGenerating && setShowNewModal(false)}>
          <style>{`
            @property --aura { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
            @keyframes auraSpin { to { --aura: 360deg; } }
            @keyframes aiOrb { 0%,100% { transform: scale(1); filter: blur(14px); opacity:.85 } 50% { transform: scale(1.18); filter: blur(22px); opacity:1 } }
            @keyframes aiRing { 0% { transform: scale(0.8); opacity:.7 } 100% { transform: scale(2.1); opacity:0 } }
            @keyframes aiFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
            @keyframes aiShimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
            @keyframes aiText { 0% { opacity:0; transform: translateY(4px) } 100% { opacity:1; transform: translateY(0) } }
            /* flowing purple glow that continuously orbits the card border */
            .ai-aura { background: conic-gradient(from var(--aura), ${AI_GRAD.from}, ${AI_GRAD.to}, #22d3ee, ${AI_GRAD.from}); animation: auraSpin 5s linear infinite; }
            .ai-glow-border::before { content:""; position:absolute; inset:-2px; border-radius:inherit; padding:2px;
              background: conic-gradient(from var(--aura), ${AI_GRAD.from}, ${AI_GRAD.to}, #22d3ee, ${AI_GRAD.from});
              -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
              -webkit-mask-composite: xor; mask-composite: exclude; animation: auraSpin 5s linear infinite; }
          `}</style>
          <div className="relative w-full max-w-xl mx-4 flex flex-col items-center animate-[modalPop_0.25s_cubic-bezier(0.34,1.56,0.64,1)_both]"
            onClick={e => e.stopPropagation()}>
            {/* AI card (solid) with flowing glow wrapping only the white block */}
            <div className="relative w-full">
            {/* flowing purple aura behind the solid card */}
            <div className="ai-aura pointer-events-none absolute -inset-3 rounded-[36px] blur-2xl opacity-45" />
            {/* crisp animated border ring hugging the card edge */}
            <div className="ai-glow-border pointer-events-none absolute inset-0 rounded-[28px]" />

            <div className="relative w-full rounded-[28px] p-9 overflow-hidden shadow-2xl bg-white dark:bg-zinc-900">

            {/* Close */}
            {!aiGenerating && (
              <button onClick={() => setShowNewModal(false)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" strokeWidth={2.2} />
              </button>
            )}

            <div className="relative z-10">
            {aiGenerating ? (
              /* ── Generating animation ───────────────────────────── */
              <div className="relative flex flex-col items-center justify-center py-10">
                <div className="relative w-28 h-28 flex items-center justify-center mb-7">
                  <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${AI_GRAD.from}, ${AI_GRAD.to})`, animation: "aiOrb 2.4s ease-in-out infinite" }} />
                  <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${AI_GRAD.to}80`, animation: "aiRing 2s ease-out infinite" }} />
                  <div className="absolute inset-0 rounded-full border" style={{ borderColor: `${AI_GRAD.from}80`, animation: "aiRing 2s ease-out infinite", animationDelay: "1s" }} />
                  <Sparkles className="relative w-9 h-9 text-white" style={{ animation: "aiFloat 2.4s ease-in-out infinite" }} strokeWidth={2} />
                </div>
                <p className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50 mb-1">Building your site</p>
                <p key={aiStatus} className="text-[13px] text-zinc-500 dark:text-zinc-400" style={{ animation: "aiText 0.4s ease both" }}>{aiStatus}</p>
                <div className="mt-6 h-1 w-48 rounded-full overflow-hidden bg-zinc-200/70 dark:bg-zinc-800">
                  <div className="h-full w-full rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${AI_GRAD.from}, ${AI_GRAD.to}, transparent)`, backgroundSize: "200% 100%", animation: "aiShimmer 1.3s linear infinite" }} />
                </div>
              </div>
            ) : (
              /* ── Prompt entry (Jacsper style) ───────────────────── */
              <>
                {/* Header */}
                <div className="flex items-center justify-center gap-3 mb-1.5">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shadow-md flex-shrink-0" style={{ background: `linear-gradient(135deg, ${AI_GRAD.from}, ${AI_GRAD.to})`, boxShadow: `0 6px 20px ${AI_GRAD.from}55` }}>
                    <Sparkles className="w-5 h-5 text-white" strokeWidth={2.2} />
                  </div>
                  <h2 className="text-[26px] font-bold tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${AI_GRAD.from}, ${AI_GRAD.to})` }}>What do you want to build?</h2>
                  <span className="text-[10px] font-bold tracking-wide self-start mt-1" style={{ color: AI_GRAD.from }}>BETA</span>
                </div>
                <p className="text-center text-[14px] text-zinc-500 dark:text-zinc-400 mb-6">Describe your site and Jacsper builds it for free</p>

                {/* Input box */}
                <div className="relative rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-500/15">
                  <textarea autoFocus value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && aiPrompt.trim()) { e.preventDefault(); generateSite(); } }}
                    rows={4}
                    placeholder="A landing page for a premium dog-grooming studio with online booking…"
                    className="w-full resize-none rounded-2xl bg-transparent px-4 pt-4 pb-12 text-[14px] text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none" />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button title="Voice input (coming soon)" className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
                      <Mic className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <button onClick={generateSite} disabled={!aiPrompt.trim()} title="Generate"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                      style={{ background: `linear-gradient(135deg, ${AI_GRAD.from}, ${AI_GRAD.to})`, boxShadow: `0 4px 14px ${AI_GRAD.from}66` }}>
                      <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                {aiStatus && !aiGenerating && (
                  <p className="mt-3 text-center text-[12.5px] font-medium text-amber-600 dark:text-amber-400">{aiStatus}</p>
                )}

                {/* Suggestion chips */}
                <div className="flex items-center justify-center flex-wrap gap-2.5 mt-5">
                  {([
                    ["SaaS landing page", Globe, "#3b82f6", "SaaS landing"],
                    ["Booking page for a local business", Calendar, "#10b981", "Booking page"],
                    ["Creative portfolio website", ImageIcon, "#ec4899", "Portfolio"],
                    ["Product waitlist page", Layers, "#f59e0b", "Waitlist"],
                  ] as [string, React.ElementType, string, string][]).map(([prompt, Icon, color, label]) => (
                    <button key={label} onClick={() => setAiPrompt(prompt)}
                      className="flex items-center gap-2 px-3.5 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 shadow-sm text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow transition-all">
                      <Icon className="w-4 h-4" style={{ color }} strokeWidth={2} />{label}
                    </button>
                  ))}
                  <button onClick={() => { setShowNewModal(false); setShowLibrary(true); }}
                    className="px-3.5 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 shadow-sm text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all">
                    more
                  </button>
                </div>
              </>
            )}
            </div>
            </div>
            </div>

            {/* Secondary options — separate from the AI card */}
            {!aiGenerating && (
              <div className="flex items-center justify-center gap-2.5 mt-4">
                <button onClick={createBlank}
                  className="px-4 h-9 rounded-full bg-white/95 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-[12.5px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-all">
                  Start from scratch
                </button>
                <button onClick={() => { setShowNewModal(false); setShowLibrary(true); }}
                  className="px-4 h-9 rounded-full bg-white/95 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-[12.5px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-all">
                  Browse {TEMPLATES.length} templates
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Library */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50 dark:bg-zinc-950 animate-[librarySlide_0.32s_cubic-bezier(0.22,1,0.36,1)_both]">
          <style>{`
            @keyframes modalPop    { from { opacity:0; transform:scale(0.92) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
            @keyframes librarySlide{ from { opacity:0; transform:scale(0.97) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
          `}</style>

          {/* Library header */}
          <div className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 shadow-sm">
            <h2 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Template Library</h2>
            <div className="flex-1 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 h-9 max-w-sm">
              <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
                className="flex-1 bg-transparent text-[13px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <select className="h-9 px-3 text-[12.5px] text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none">
                <option>Default</option><option>Newest</option><option>Popular</option>
              </select>
              <button onClick={() => setShowLibrary(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                <X className="w-4.5 h-4.5" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <div className="w-56 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto py-4 px-3">
              {[
                { label:"All Templates", icon:"▦" },
                { label:"My Templates",  icon:"👤" },
                { label:"Shared with Me",icon:"🔗" },
                { label:"Favorites",     icon:"♡" },
              ].map(item => (
                <button key={item.label}
                  onClick={() => { if (item.label === "All Templates") setCatFilter("All"); }}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[13px] font-medium transition-all mb-0.5",
                    (item.label === "All Templates" && catFilter === "All") ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  )}>
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}

              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3" />

              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">Browse Categories</p>
                <ChevronUp className="w-3 h-3 text-zinc-400" strokeWidth={2} />
              </div>

              {([
                ["All",          null],
                ["Landing Page", 48],
                ["Funnel",       35],
                ["Website",      22],
                ["Event",        14],
              ] as [TplCat, number | null][]).map(([cat, count]) => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  className={cn("w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all mb-0.5",
                    catFilter === cat ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  )}>
                  <span className={cn("text-[12.5px] font-medium", catFilter === cat ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400")}>
                    {cat === "All" ? "All Types" : cat}
                  </span>
                  {count && <span className="text-[11px] text-zinc-400">{count}</span>}
                </button>
              ))}

              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3" />
              {["Tags","Colors"].map(s => (
                <button key={s} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-[12.5px] font-medium mb-0.5">
                  {s} <ChevronDown className="w-3 h-3 text-zinc-400" strokeWidth={2} />
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Recently added */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-100">
                  {catFilter === "All" ? "Recently added" : catFilter}
                </h3>
                {catFilter === "All" && <button className="text-[12.5px] font-semibold text-blue-500 hover:text-blue-600 transition-colors">See All</button>}
              </div>

              <div className="grid grid-cols-3 gap-6 mb-10">
                {filteredTpls.map(tpl => (
                  <div key={tpl.id}
                    className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                    onClick={() => setPreviewTpl(tpl)}>
                    {/* Tall full-page preview */}
                    <div className="relative overflow-hidden rounded-t-2xl" style={{ height: 420, background: tpl.theme.pageBg }}>
                      <div style={{ transform:"scale(0.33)", transformOrigin:"top left", width:"303%", height:"303%", pointerEvents:"none" }}>
                        <PagePreview sections={tpl.sections} theme={tpl.theme} />
                      </div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-3"
                        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }}>
                        <button onClick={e => { e.stopPropagation(); setPreviewTpl(tpl); }}
                          className="flex items-center gap-2 h-10 px-6 rounded-xl bg-white text-zinc-800 text-[13px] font-semibold shadow-xl active:scale-95 transition-all hover:bg-zinc-50">
                          <Eye className="w-4 h-4" strokeWidth={2} /> Preview
                        </button>
                        <button onClick={e => { e.stopPropagation(); createFromTemplate(tpl); }}
                          className="flex items-center gap-2 h-10 px-6 rounded-xl text-[13px] font-semibold shadow-xl active:scale-95 transition-all text-white"
                          style={{ background: `linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})` }}>
                          <Plus className="w-4 h-4" strokeWidth={2.5} /> Use Template
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-3.5">
                      <p className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-100">{tpl.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-zinc-400">{tpl.cat}</span>
                        <span className="text-zinc-200 dark:text-zinc-700">·</span>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{tpl.badge}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Blank card */}
                <div onClick={createBlank}
                  className="group rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg transition-all duration-200"
                  style={{ minHeight: 468 }}>
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 flex items-center justify-center transition-all group-hover:scale-105">
                    <Plus className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-semibold text-zinc-500 dark:text-zinc-400">Blank Page</p>
                    <p className="text-[12px] text-zinc-400 mt-1">Start from scratch</p>
                  </div>
                </div>
              </div>

              {/* Top trending */}
              {catFilter === "All" && search === "" && (
                <>
                  <div className="flex items-center gap-2 mb-5">
                    <h3 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-100">Top trending this week</h3>
                    <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-400 text-[10px] font-semibold">i</div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {[...TEMPLATES].reverse().slice(0, 3).map(tpl => (
                      <div key={`tr-${tpl.id}`}
                        className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                        onClick={() => setPreviewTpl(tpl)}>
                        <div className="relative overflow-hidden rounded-t-2xl" style={{ height: 420, background: tpl.theme.pageBg }}>
                          <div style={{ transform:"scale(0.33)", transformOrigin:"top left", width:"303%", height:"303%", pointerEvents:"none" }}>
                            <PagePreview sections={tpl.sections} theme={tpl.theme} />
                          </div>
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-3"
                            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }}>
                            <button onClick={e => { e.stopPropagation(); setPreviewTpl(tpl); }}
                              className="flex items-center gap-2 h-10 px-6 rounded-xl bg-white text-zinc-800 text-[13px] font-semibold shadow-xl active:scale-95 transition-all">
                              <Eye className="w-4 h-4" strokeWidth={2} /> Preview
                            </button>
                            <button onClick={e => { e.stopPropagation(); createFromTemplate(tpl); }}
                              className="flex items-center gap-2 h-10 px-6 rounded-xl text-[13px] font-semibold shadow-xl active:scale-95 transition-all text-white"
                              style={{ background: `linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})` }}>
                              <Plus className="w-4 h-4" strokeWidth={2.5} /> Use Template
                            </button>
                          </div>
                        </div>
                        <div className="px-4 py-3.5">
                          <p className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-100">{tpl.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-zinc-400">{tpl.cat}</span>
                            <span className="text-zinc-200 dark:text-zinc-700">·</span>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{tpl.badge}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <PageHeader title="Website Builder" description="Build landing pages, funnels, and full websites.">
        <button onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.97]"
          style={{ background: `linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})` }}>
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Site
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {OVERVIEW.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-sm">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color+"18" }}>
              <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[19px] font-bold text-zinc-900 dark:text-zinc-50 leading-none">{value}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sites */}
      <div className="grid grid-cols-3 gap-5">
          {sites.map(site => {
            const tpl = TEMPLATES.find(t => t.id === site.tplId) ?? TEMPLATES[0];
            return (
              <div key={site.id} className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                <div className="h-48 relative overflow-hidden bg-white" style={{ background: tpl.theme.pageBg }}>
                  <div style={{ transform:"scale(0.36)", transformOrigin:"top left", width:"278%", height:"278%", pointerEvents:"none" }}>
                    <PagePreview sections={tpl.sections} theme={tpl.theme} />
                  </div>
                  <div className={cn("absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    site.status === "published" ? "bg-emerald-500 text-white" : "bg-white/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 border border-zinc-200"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", site.status === "published" ? "bg-white" : "bg-zinc-400")} />
                    {site.status === "published" ? "Live" : "Draft"}
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => { setEditing(site); setSelectedSec(null); }}
                      className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-white text-zinc-800 text-[12px] font-semibold shadow-lg transition-all hover:bg-zinc-50 active:scale-95">
                      <Pencil className="w-3 h-3" strokeWidth={2} /> Edit
                    </button>
                    <button className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-white/20 text-white text-[12px] font-semibold border border-white/30 backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95">
                      <ExternalLink className="w-3 h-3" strokeWidth={2} /> View
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 truncate">{site.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{site.slug}</p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => duplicate(site)} className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                        <Copy className="w-3 h-3" strokeWidth={1.75} />
                      </button>
                      <button onClick={() => removeSite(site.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                        <Trash2 className="w-3 h-3" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                  {site.status === "published" ? (
                    <div className="flex items-center gap-3 pt-2 border-t border-zinc-50 dark:border-zinc-800">
                      <div className="flex items-center gap-1"><Eye className="w-3 h-3 text-zinc-400" strokeWidth={1.75} /><span className="text-[11.5px] text-zinc-500">{fmtNum(site.visits)}</span></div>
                      <div className="flex items-center gap-1"><Users className="w-3 h-3 text-zinc-400" strokeWidth={1.75} /><span className="text-[11.5px] text-zinc-500">{fmtNum(site.leads)}</span></div>
                      <div className="flex items-center gap-1 ml-auto"><ArrowUpRight className="w-3 h-3 text-emerald-500" strokeWidth={2} /><span className="text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">{site.conv}</span></div>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" strokeWidth={1.75} />{site.updated}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-50 dark:border-zinc-800">
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" strokeWidth={1.75} />{site.updated}</span>
                      <button onClick={() => { setEditing(site); setSelectedSec(null); }} className="text-[11px] font-semibold flex items-center gap-0.5" style={{ color: branding.primaryColor }}>
                        Continue <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowNewModal(true)}
            className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-2.5 min-h-[288px] hover:border-zinc-300 dark:hover:border-zinc-600 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 flex items-center justify-center transition-all">
              <Plus className="w-5 h-5 text-zinc-400" strokeWidth={1.75} />
            </div>
            <span className="text-[12.5px] font-medium text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">New Site</span>
          </button>
        </div>

      {/* old template tab — removed, replaced by showLibrary modal above */}
      {false && (
        <div className="-mx-8 flex" style={{ height: "calc(100vh - 220px)" }}>

          {/* Left sidebar */}
          <div className="w-52 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto px-4 py-4 bg-white dark:bg-zinc-900">
            {[
              { label: "All Templates", icon: "▦", active: catFilter === "All" },
              { label: "My Templates",  icon: "👤", active: false },
              { label: "Shared with Me",icon: "🔗", active: false },
              { label: "Favorites",     icon: "♡", active: false },
            ].map(item => (
              <button key={item.label} onClick={() => { if (item.label === "All Templates") setCatFilter("All"); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[12.5px] font-medium transition-all mb-0.5",
                  item.active ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}>
                <span className="text-[14px]">{item.icon}</span>
                {item.label}
              </button>
            ))}

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3" />

            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Browse Categories</p>
              <ChevronUp className="w-3 h-3 text-zinc-400" strokeWidth={2} />
            </div>
            {[
              { label: "Landing Page",          count: 48 },
              { label: "Funnel",                count: 35 },
              { label: "Website",               count: 22 },
              { label: "Event",                 count: 14 },
              { label: "Business & Corporate",  count: 41 },
              { label: "Agency & Creative",     count: 28 },
              { label: "SaaS & Tech",           count: 19 },
              { label: "Ecommerce",             count: 33 },
            ].map(cat => (
              <button key={cat.label}
                onClick={() => setCatFilter(cat.label as TplCat)}
                className={cn("w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-all mb-0.5",
                  catFilter === cat.label ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}>
                <span className={cn("text-[12px] font-medium", catFilter === cat.label ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400")}>{cat.label}</span>
                <span className="text-[11px] text-zinc-400">{cat.count}</span>
              </button>
            ))}

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3" />

            {["Types","Tags","Colors"].map(section => (
              <button key={section} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all mb-0.5">
                <span className="text-[12.5px] font-medium">{section}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" strokeWidth={2} />
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950">

            {/* Top bar */}
            <div className="flex items-center gap-3 px-6 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <h2 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-100 mr-2">Websites</h2>
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                Filters ⚙
              </button>
              <div className="flex-1 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 h-8 max-w-xs">
                <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
                  className="flex-1 bg-transparent text-[12px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none" />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <select className="h-8 px-2.5 text-[12px] text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none">
                  <option>Default</option>
                  <option>Newest</option>
                  <option>Popular</option>
                </select>
                <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                  <button className="w-7 h-7 rounded-md flex items-center justify-center bg-white dark:bg-zinc-700 shadow-sm text-zinc-600 dark:text-zinc-300 text-[13px]">⊞</button>
                  <button className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 text-[13px]">≡</button>
                </div>
              </div>
            </div>

            {/* Scrollable template grid */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* Recently added */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold text-zinc-800 dark:text-zinc-100">
                  {catFilter === "All" ? "Recently added" : catFilter}
                </h3>
                {catFilter === "All" && <button className="text-[12px] font-semibold text-blue-500 hover:text-blue-600 transition-colors">See All</button>}
              </div>

              <div className="grid grid-cols-3 gap-5 mb-8">
                {filteredTpls.map(tpl => (
                  <div key={tpl.id}
                    className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                    onClick={() => setPreviewTpl(tpl)}>
                    {/* Tall thumbnail showing full page */}
                    <div className="relative overflow-hidden" style={{ height: 380, background: tpl.theme.pageBg }}>
                      <div style={{ transform:"scale(0.34)", transformOrigin:"top left", width:"294%", height:"294%", pointerEvents:"none" }}>
                        <PagePreview sections={tpl.sections} theme={tpl.theme} />
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button onClick={e => { e.stopPropagation(); setPreviewTpl(tpl); }}
                          className="flex items-center gap-1.5 h-9 px-5 rounded-xl bg-white text-zinc-800 text-[12.5px] font-semibold shadow-xl active:scale-95 transition-all hover:bg-zinc-50">
                          <Eye className="w-3.5 h-3.5" strokeWidth={2} /> Preview
                        </button>
                        <button onClick={e => { e.stopPropagation(); createFromTemplate(tpl); }}
                          className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-[12.5px] font-semibold shadow-xl active:scale-95 transition-all text-white"
                          style={{ background: `linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})` }}>
                          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Use Template
                        </button>
                      </div>
                    </div>
                    {/* Card footer */}
                    <div className="px-3.5 py-3 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100">{tpl.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-zinc-400">{tpl.cat}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{tpl.badge}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Blank page card */}
                <div onClick={() => createFromTemplate(TEMPLATES[0])}
                  className="group rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                  style={{ height: 420 }}>
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 flex items-center justify-center transition-all">
                    <Plus className="w-6 h-6 text-zinc-400" strokeWidth={1.75} />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">Blank Page</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Start from scratch</p>
                  </div>
                </div>
              </div>

              {/* Top trending */}
              {catFilter === "All" && search === "" && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-[14px] font-semibold text-zinc-800 dark:text-zinc-100">Top trending this week</h3>
                    <span className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-400 text-[10px]">i</span>
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    {[...TEMPLATES].reverse().slice(0, 3).map(tpl => (
                      <div key={`trend-${tpl.id}`}
                        className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                        onClick={() => setPreviewTpl(tpl)}>
                        <div className="relative overflow-hidden" style={{ height: 380, background: tpl.theme.pageBg }}>
                          <div style={{ transform:"scale(0.34)", transformOrigin:"top left", width:"294%", height:"294%", pointerEvents:"none" }}>
                            <PagePreview sections={tpl.sections} theme={tpl.theme} />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={e => { e.stopPropagation(); setPreviewTpl(tpl); }}
                              className="flex items-center gap-1.5 h-9 px-5 rounded-xl bg-white text-zinc-800 text-[12.5px] font-semibold shadow-xl active:scale-95 transition-all">
                              <Eye className="w-3.5 h-3.5" strokeWidth={2} /> Preview
                            </button>
                            <button onClick={e => { e.stopPropagation(); createFromTemplate(tpl); }}
                              className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-[12.5px] font-semibold shadow-xl active:scale-95 transition-all text-white"
                              style={{ background: `linear-gradient(135deg,${branding.primaryColor},${branding.accentColor})` }}>
                              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Use Template
                            </button>
                          </div>
                        </div>
                        <div className="px-3.5 py-3 border-t border-zinc-100 dark:border-zinc-800">
                          <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100">{tpl.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-zinc-400">{tpl.cat}</span>
                            <span className="text-zinc-300 dark:text-zinc-700">·</span>
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{tpl.badge}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
