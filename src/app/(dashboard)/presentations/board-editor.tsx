"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MousePointer2, StickyNote, Type, Square, Circle as CircleIcon,
  Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  ZoomIn, ZoomOut, RotateCcw, Grid3x3, Minus, Diamond,
  Frame, Move, Copy, Image as ImageIcon, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type ElType  = "sticky" | "text" | "rect" | "circle" | "diamond" | "frame" | "image";
export type BoardBg = "dots" | "grid" | "lines" | "plain";

export interface BoardEl {
  id: string; type: ElType;
  x: number; y: number; w: number; h: number;
  text: string; color: string; bg: string;
  fontSize: number; bold: boolean; italic: boolean;
  align: "left" | "center" | "right";
  imageUrl?: string;
}

interface Props {
  elements: BoardEl[];
  bg: BoardBg;
  onChange: (els: BoardEl[], bg: BoardBg) => void;
  branding: { primaryColor: string; accentColor: string };
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const CW = 3200;
const CH = 2200;
const MIN_Z = 0.15;
const MAX_Z = 4;

const STICKY_PALETTES = [
  { bg: "#fef9c3", color: "#78350f" },
  { bg: "#dcfce7", color: "#14532d" },
  { bg: "#dbeafe", color: "#1e3a5f" },
  { bg: "#fce7f3", color: "#701a75" },
  { bg: "#ede9fe", color: "#4c1d95" },
  { bg: "#fee2e2", color: "#7f1d1d" },
  { bg: "#ffedd5", color: "#7c2d12" },
  { bg: "#e0f2fe", color: "#0c4a6e" },
];

const SHAPE_FILLS = [
  "#6366f1","#3b82f6","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#ec4899","#14b8a6","#f97316","#64748b",
];

const EL_DEFAULTS: Record<ElType, Partial<BoardEl>> = {
  sticky:  { w: 180, h: 160, bg: "#fef9c3", color: "#78350f", fontSize: 14, bold: false, italic: false, align: "left"   },
  text:    { w: 220, h: 80,  bg: "transparent", color: "#1e293b", fontSize: 18, bold: false, italic: false, align: "left" },
  rect:    { w: 200, h: 130, bg: "#6366f1", color: "#ffffff", fontSize: 14, bold: false, italic: false, align: "center" },
  circle:  { w: 160, h: 160, bg: "#10b981", color: "#ffffff", fontSize: 14, bold: false, italic: false, align: "center" },
  diamond: { w: 180, h: 140, bg: "#f59e0b", color: "#ffffff", fontSize: 13, bold: false, italic: false, align: "center" },
  frame:   { w: 380, h: 280, bg: "transparent", color: "#6366f1", fontSize: 13, bold: true,  italic: false, align: "left"   },
  image:   { w: 320, h: 240, bg: "transparent", color: "#1e293b", fontSize: 12, bold: false, italic: false, align: "center" },
};

function uid() { return Math.random().toString(36).slice(2, 9); }
function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }

/* ─── Background SVG ─────────────────────────────────────────────────────── */

function BgPattern({ bg }: { bg: BoardBg }) {
  if (bg === "plain") return <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-900" />;
  if (bg === "dots") return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1.2" fill="currentColor" className="text-zinc-300 dark:text-zinc-600" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" className="fill-zinc-50 dark:fill-zinc-900" />
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
  if (bg === "grid") return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-zinc-200 dark:text-zinc-700" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#f8fafc" className="dark:fill-zinc-900" />
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
  if (bg === "lines") return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="lines" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <line x1="0" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="0.5" className="text-zinc-200 dark:text-zinc-700" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#f8fafc" className="dark:fill-zinc-900" />
      <rect width="100%" height="100%" fill="url(#lines)" />
    </svg>
  );
  return null;
}

/* ─── Element Renderer ───────────────────────────────────────────────────── */

function ElShape({ el, selected, editing, onStartEdit, onTextChange }: {
  el: BoardEl; selected: boolean; editing: boolean;
  onStartEdit: () => void; onTextChange: (t: string) => void;
}) {
  const textStyle: React.CSSProperties = {
    fontSize: el.fontSize, fontWeight: el.bold ? 700 : 400,
    fontStyle: el.italic ? "italic" : "normal",
    textAlign: el.align, color: el.color, lineHeight: 1.4,
  };

  const inner = (
    <div className="w-full h-full flex items-center justify-center p-3 overflow-hidden" style={textStyle}>
      {editing
        ? <textarea autoFocus value={el.text} onChange={e => onTextChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") e.currentTarget.blur(); }}
            onPointerDown={e => e.stopPropagation()}
            className="w-full h-full bg-transparent border-none outline-none resize-none text-center select-text selection:bg-sky-500 selection:text-white"
            style={{ ...textStyle, textAlign: el.align }}
          />
        : <span className="break-words w-full" style={{ textAlign: el.align }}
            onDoubleClick={e => { e.stopPropagation(); onStartEdit(); }}
          >{el.text || <span className="opacity-30 text-sm">Double-click to edit</span>}</span>
      }
    </div>
  );

  const selRing = selected ? "ring-2 ring-[#8b3dff]" : "";

  if (el.type === "sticky") return (
    <div className={cn("w-full h-full rounded-xl shadow-md flex flex-col", selRing)}
      style={{ background: el.bg, boxShadow: selected ? undefined : "2px 4px 12px rgba(0,0,0,0.12)" }}>
      <div className="h-5 flex-shrink-0 rounded-t-xl opacity-30" style={{ background: el.color }} />
      <div className="flex-1 overflow-hidden p-2.5">
        {editing
          ? <textarea autoFocus value={el.text} onChange={e => onTextChange(e.target.value)}
              onPointerDown={e => e.stopPropagation()}
              className="w-full h-full bg-transparent border-none outline-none resize-none select-text selection:bg-sky-500 selection:text-white"
              style={textStyle}
            />
          : <p className="break-words" style={textStyle} onDoubleClick={e => { e.stopPropagation(); onStartEdit(); }}>
              {el.text || <span className="opacity-30 text-sm">Click to edit…</span>}
            </p>
        }
      </div>
    </div>
  );

  if (el.type === "text") return (
    <div className={cn("w-full h-full", selRing, selected ? "bg-violet-50/30 dark:bg-violet-950/20 rounded" : "")}>
      {editing
        ? <textarea autoFocus value={el.text} onChange={e => onTextChange(e.target.value)}
            onPointerDown={e => e.stopPropagation()}
            className="w-full h-full bg-transparent border-none outline-none resize-none p-1 select-text selection:bg-sky-500 selection:text-white"
            style={textStyle}
          />
        : <p className="w-full h-full break-words p-1" style={textStyle}
            onDoubleClick={e => { e.stopPropagation(); onStartEdit(); }}>
            {el.text || <span style={{ color: el.color, opacity: 0.3 }}>Text</span>}
          </p>
      }
    </div>
  );

  if (el.type === "rect") return (
    <div className={cn("w-full h-full rounded-xl", selRing)} style={{ background: el.bg }}>
      {inner}
    </div>
  );

  if (el.type === "circle") return (
    <div className={cn("w-full h-full rounded-full", selRing)} style={{ background: el.bg }}>
      {inner}
    </div>
  );

  if (el.type === "diamond") {
    const s = Math.min(el.w, el.h);
    return (
      <div className={cn("w-full h-full flex items-center justify-center", selRing)}>
        <div style={{ width: s * 0.78, height: s * 0.78, background: el.bg, transform: "rotate(45deg)", flexShrink: 0 }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={textStyle}>
          <span>{el.text}</span>
        </div>
      </div>
    );
  }

  if (el.type === "image") return (
    <div className={cn("w-full h-full rounded-xl overflow-hidden relative", selRing)}
      style={{ background: el.imageUrl ? undefined : "#e2e8f0" }}>
      {el.imageUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={el.imageUrl} alt={el.text||""} draggable={false}
            className="w-full h-full object-cover pointer-events-none select-none" />
        : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
            <ImageIcon className="w-8 h-8" strokeWidth={1.5}/>
            <span className="text-xs">No image</span>
          </div>
      }
      {el.text && !editing && (
        <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-center px-2 py-1"
          style={{ fontSize: el.fontSize }} onDoubleClick={e=>{e.stopPropagation();onStartEdit();}}>
          {el.text}
        </div>
      )}
      {editing && (
        <div className="absolute inset-x-0 bottom-0 bg-black/60">
          <textarea autoFocus value={el.text} onChange={e=>onTextChange(e.target.value)}
            onPointerDown={e => e.stopPropagation()}
            className="w-full bg-transparent border-none outline-none resize-none text-white text-center p-1 select-text selection:bg-sky-500 selection:text-white"
            style={{ fontSize: el.fontSize }} rows={1}/>
        </div>
      )}
    </div>
  );

  if (el.type === "frame") return (
    <div className={cn("w-full h-full rounded-xl", selRing)}
      style={{ border: `2px dashed ${el.color}`, background: `${el.bg === "transparent" ? el.color + "08" : el.bg}` }}>
      <div className="px-3 py-1.5 border-b" style={{ borderColor: el.color + "40" }}>
        {editing
          ? <input autoFocus value={el.text} onChange={e => onTextChange(e.target.value)}
              onPointerDown={e => e.stopPropagation()}
              className="bg-transparent border-none outline-none text-sm font-semibold w-full select-text selection:bg-sky-500 selection:text-white"
              style={{ color: el.color }} onKeyDown={e => { if (e.key === "Escape") e.currentTarget.blur(); }}
            />
          : <span className="text-sm font-semibold" style={{ color: el.color }}
              onDoubleClick={e => { e.stopPropagation(); onStartEdit(); }}>
              {el.text || "Frame"}
            </span>
        }
      </div>
    </div>
  );

  return null;
}

/* ─── Resize Handle ──────────────────────────────────────────────────────── */

const HANDLES = [
  { id: "nw", cursor: "nw-resize", x: 0,   y: 0   },
  { id: "n",  cursor: "n-resize",  x: 0.5, y: 0   },
  { id: "ne", cursor: "ne-resize", x: 1,   y: 0   },
  { id: "e",  cursor: "e-resize",  x: 1,   y: 0.5 },
  { id: "se", cursor: "se-resize", x: 1,   y: 1   },
  { id: "s",  cursor: "s-resize",  x: 0.5, y: 1   },
  { id: "sw", cursor: "sw-resize", x: 0,   y: 1   },
  { id: "w",  cursor: "w-resize",  x: 0,   y: 0.5 },
];

/* ─── Board Editor ───────────────────────────────────────────────────────── */

export function BoardEditor({ elements: initEls, bg: initBg, onChange, branding }: Props) {
  const [els, setEls]           = useState<BoardEl[]>(initEls);
  const [bg, setBg]             = useState<BoardBg>(initBg);
  const [tool, setTool]         = useState<ElType | "select">("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [zoom, setZoom]         = useState(0.6);
  const [pan, setPan]           = useState({ x: 60, y: 40 });
  const [dragging, setDragging] = useState<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: string; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number } | null>(null);
  const [panning, setPanning]   = useState<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const viewportRef   = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLDivElement>(null);
  const boardImgRef   = useRef<HTMLInputElement>(null);
  const pendingImgPos = useRef<{x:number;y:number}|null>(null);
  const replacingId   = useRef<string|null>(null);

  const selected = els.find(e => e.id === selectedId);

  /* Sync out */
  useEffect(() => { onChange(els, bg); }, [els, bg]);

  /* Keyboard */
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault(); setSpaceDown(true);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setEls(p => p.filter(x => x.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === "Escape") { setEditingId(null); setSelectedId(null); }
    }
    function up(e: KeyboardEvent) { if (e.code === "Space") setSpaceDown(false); }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [selectedId]);

  /* Scroll to zoom */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = vp!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      // ~12% per mouse notch; trackpad fires many small events so it stays smooth.
      const factor = 1 - clamp(e.deltaY / 800, -0.3, 0.3);
      setZoom(z => {
        const nz = clamp(z * factor, MIN_Z, MAX_Z);
        setPan(p => ({ x: mx - (mx - p.x) * (nz / z), y: my - (my - p.y) * (nz / z) }));
        return nz;
      });
    }
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, []);

  function screenToCanvas(sx: number, sy: number) {
    const rect = viewportRef.current!.getBoundingClientRect();
    return { x: (sx - rect.left - pan.x) / zoom, y: (sy - rect.top - pan.y) / zoom };
  }

  /* Canvas pointer down — place new element or start panning */
  function onCanvasPointerDown(e: React.PointerEvent) {
    // Elements call stopPropagation, so reaching here always means a background click.
    // Skip only if the pointer came from outside the viewport entirely (shouldn't happen but guard).
    if (!viewportRef.current?.contains(e.target as Node)) return;
    setEditingId(null);

    if (spaceDown || e.button === 1) {
      e.preventDefault();
      setPanning({ sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y });
      return;
    }

    // Select tool: click background deselects; drag background pans canvas
    if (tool === "select") {
      setSelectedId(null);
      setPanning({ sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y });
      return;
    }

    /* Place new element */
    const pos = screenToCanvas(e.clientX, e.clientY);
    const def = EL_DEFAULTS[tool as ElType];
    const elType = tool as ElType;
    const el: BoardEl = {
      id: uid(), type: elType,
      x: pos.x - (def.w ?? 160) / 2,
      y: pos.y - (def.h ?? 140) / 2,
      w: def.w ?? 160, h: def.h ?? 140,
      text: "", color: def.color!, bg: def.bg!,
      fontSize: def.fontSize ?? 14, bold: def.bold ?? false,
      italic: def.italic ?? false, align: def.align ?? "left",
    };
    // Image tool: record position and open file picker — element placed after upload
    if (elType === "image") {
      pendingImgPos.current = { x: pos.x - (EL_DEFAULTS.image.w??320)/2, y: pos.y - (EL_DEFAULTS.image.h??240)/2 };
      replacingId.current = null;
      boardImgRef.current?.click();
      setTool("select");
      return;
    }

    setEls(p => [...p, el]);
    setSelectedId(el.id);
    setTool("select");
    // Auto-edit only for text-focused elements; shapes are placed and stay selected
    if (elType === "sticky" || elType === "text") {
      setTimeout(() => setEditingId(el.id), 50);
    }
  }

  function handleBoardImg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (replacingId.current) {
        update(replacingId.current, { imageUrl: url });
        replacingId.current = null;
      } else if (pendingImgPos.current) {
        const pos = pendingImgPos.current;
        const el: BoardEl = {
          id: uid(), type: "image",
          x: pos.x, y: pos.y,
          w: EL_DEFAULTS.image.w!, h: EL_DEFAULTS.image.h!,
          text: "", color: "#1e293b", bg: "transparent", imageUrl: url,
          fontSize: 12, bold: false, italic: false, align: "center",
        };
        setEls(p => [...p, el]);
        setSelectedId(el.id);
        pendingImgPos.current = null;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  /* Global pointer move */
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (panning) {
        setPan({ x: panning.ox + e.clientX - panning.sx, y: panning.oy + e.clientY - panning.sy });
      }
      if (dragging) {
        const dx = (e.clientX - dragging.sx) / zoom;
        const dy = (e.clientY - dragging.sy) / zoom;
        setEls(p => p.map(el => el.id === dragging.id ? { ...el, x: dragging.ox + dx, y: dragging.oy + dy } : el));
      }
      if (resizing) {
        const dx = (e.clientX - resizing.sx) / zoom;
        const dy = (e.clientY - resizing.sy) / zoom;
        const h = resizing.handle;
        setEls(p => p.map(el => {
          if (el.id !== resizing.id) return el;
          let { x, y, w, h: oh } = { x: resizing.ox, y: resizing.oy, w: resizing.ow, h: resizing.oh };
          if (h.includes("e")) w = Math.max(60, resizing.ow + dx);
          if (h.includes("s")) oh = Math.max(40, resizing.oh + dy);
          if (h.includes("w")) { w = Math.max(60, resizing.ow - dx); x = resizing.ox + resizing.ow - w; }
          if (h.includes("n")) { oh = Math.max(40, resizing.oh - dy); y = resizing.oy + resizing.oh - oh; }
          return { ...el, x, y, w, h: oh };
        }));
      }
    }
    function onUp() { setDragging(null); setResizing(null); setPanning(null); }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [dragging, resizing, panning, zoom]);

  function update(id: string, patch: Partial<BoardEl>) {
    setEls(p => p.map(e => e.id === id ? { ...e, ...patch } : e));
  }

  function duplicate() {
    if (!selected) return;
    const copy: BoardEl = { ...JSON.parse(JSON.stringify(selected)), id: uid(), x: selected.x + 20, y: selected.y + 20 };
    setEls(p => [...p, copy]);
    setSelectedId(copy.id);
  }

  function resetView() { setZoom(0.6); setPan({ x: 60, y: 40 }); }

  const BG_OPTIONS: { id: BoardBg; label: string }[] = [
    { id: "dots", label: "Dots" }, { id: "grid", label: "Grid" },
    { id: "lines", label: "Lines" }, { id: "plain", label: "Plain" },
  ];

  const TOOLS: { id: ElType | "select"; icon: React.ElementType; label: string }[] = [
    { id: "select",  icon: MousePointer2, label: "Select"      },
    { id: "sticky",  icon: StickyNote,    label: "Sticky Note" },
    { id: "text",    icon: Type,          label: "Text"        },
    { id: "rect",    icon: Square,        label: "Rectangle"   },
    { id: "circle",  icon: CircleIcon,    label: "Circle"      },
    { id: "diamond", icon: Diamond,       label: "Diamond"     },
    { id: "frame",   icon: Frame,         label: "Frame"       },
    { id: "image",   icon: ImageIcon,     label: "Image"       },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950">

      {/* Hidden image file input */}
      <input ref={boardImgRef} type="file" accept="image/*" className="hidden" onChange={handleBoardImg}/>

      {/* ── Top toolbar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 z-10">

        {/* Tools */}
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button key={id} title={label}
              onClick={() => {
                if (id === "image") {
                  // Open file picker immediately, place at visible canvas center
                  const vp = viewportRef.current;
                  const cx = vp ? (vp.offsetWidth  / 2 - pan.x) / zoom - (EL_DEFAULTS.image.w! / 2) : 400;
                  const cy = vp ? (vp.offsetHeight / 2 - pan.y) / zoom - (EL_DEFAULTS.image.h! / 2) : 300;
                  pendingImgPos.current = { x: cx, y: cy };
                  replacingId.current = null;
                  boardImgRef.current?.click();
                } else {
                  setTool(id);
                }
              }}
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                tool === id
                  ? "text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
              style={tool === id ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor})` } : {}}>
              <Icon className="w-3.5 h-3.5" strokeWidth={tool === id ? 2 : 1.75} />
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Background */}
        <div className="flex items-center gap-1">
          {BG_OPTIONS.map(b => (
            <button key={b.id} onClick={() => setBg(b.id)}
              className={cn("px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors",
                bg === b.id ? "text-white" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
              style={bg === b.id ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor})` } : {}}>
              {b.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => clamp(z * 0.8, MIN_Z, MAX_Z))} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><ZoomOut className="w-3.5 h-3.5" strokeWidth={2} /></button>
          <span className="text-[12px] text-zinc-500 w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => clamp(z * 1.25, MIN_Z, MAX_Z))} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><ZoomIn className="w-3.5 h-3.5" strokeWidth={2} /></button>
          <button onClick={resetView} title="Reset view" className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><RotateCcw className="w-3.5 h-3.5" strokeWidth={2} /></button>
        </div>

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Element count */}
        <span className="text-[11px] text-zinc-400">{els.length} elements</span>

        {/* Selected element actions */}
        {selected && (
          <>
            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700 ml-auto" />
            <div className="flex items-center gap-1">
              <button onClick={duplicate} title="Duplicate" className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><Copy className="w-3.5 h-3.5" strokeWidth={2} /></button>
              <button onClick={() => { setEls(p => p.filter(e => e.id !== selectedId)); setSelectedId(null); }} title="Delete" className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"><Trash2 className="w-3.5 h-3.5" strokeWidth={2} /></button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Canvas viewport ────────────────────────────────────────── */}
        <div
          ref={viewportRef}
          className="flex-1 overflow-hidden relative select-none"
          style={{ cursor: panning ? "grabbing" : tool === "select" ? "grab" : "crosshair" }}
          onPointerDown={onCanvasPointerDown}
        >
          <BgPattern bg={bg} />

          {/* Canvas */}
          <div
            ref={canvasRef}
            style={{
              position: "absolute",
              left: pan.x, top: pan.y,
              width: CW, height: CH,
              transform: `scale(${zoom})`,
              transformOrigin: "0 0",
              transition: "transform 40ms ease-out",
              willChange: "transform",
            }}
          >
            {/* Elements */}
            {els.map(el => {
              const isSel = el.id === selectedId;
              const isEd  = el.id === editingId;

              return (
                <div key={el.id}
                  style={{ position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h, zIndex: isSel ? 10 : 1, cursor: isEd ? "text" : "move" }}
                  onPointerDown={e => {
                    e.stopPropagation();
                    if (spaceDown) return;
                    setSelectedId(el.id);
                    if (!isEd) {
                      setDragging({ id: el.id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y });
                    }
                  }}
                  onDoubleClick={e => { e.stopPropagation(); setEditingId(el.id); }}
                >
                  <ElShape
                    el={el} selected={isSel} editing={isEd}
                    onStartEdit={() => setEditingId(el.id)}
                    onTextChange={t => update(el.id, { text: t })}
                  />

                  {/* Resize handles */}
                  {isSel && !isEd && HANDLES.map(h => (
                    <div key={h.id}
                      style={{
                        position: "absolute",
                        left: `calc(${h.x * 100}% - 5px)`,
                        top: `calc(${h.y * 100}% - 5px)`,
                        width: 11, height: 11,
                        background: "#ffffff",
                        border: "2px solid #8b3dff",
                        borderRadius: "50%",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                        cursor: h.cursor,
                        zIndex: 20,
                      }}
                      onPointerDown={e => {
                        e.stopPropagation();
                        setResizing({ id: el.id, handle: h.id, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, ow: el.w, oh: el.h });
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Zoom hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400 pointer-events-none">
            Scroll to zoom · Drag canvas to pan · Double-click to edit text
          </div>
        </div>

        {/* ── Right properties panel ─────────────────────────────────── */}
        <div className="w-52 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto">
          {selected ? (
            <div className="p-3 flex flex-col gap-4">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide capitalize">{selected.type}</p>

              {/* Position & size */}
              <div>
                <p className="text-[10px] text-zinc-400 mb-1.5 font-medium">Position & Size</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[["X", "x"], ["Y", "y"], ["W", "w"], ["H", "h"]].map(([label, key]) => (
                    <label key={key} className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-2 py-1.5 border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[10px] text-zinc-400 w-3">{label}</span>
                      <input type="number" value={Math.round(selected[key as keyof BoardEl] as number)}
                        onChange={e => update(selected.id, { [key]: Number(e.target.value) })}
                        className="flex-1 bg-transparent border-none outline-none text-[12px] text-zinc-700 dark:text-zinc-300 w-0 min-w-0"/>
                    </label>
                  ))}
                </div>
              </div>

              {/* Colors */}
              {selected.type === "sticky" ? (
                <div>
                  <p className="text-[10px] text-zinc-400 mb-1.5 font-medium">Color</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {STICKY_PALETTES.map(p => (
                      <button key={p.bg} onClick={() => update(selected.id, { bg: p.bg, color: p.color })}
                        className={cn("h-8 rounded-lg border-2 transition-all", selected.bg === p.bg ? "border-blue-500 scale-110" : "border-transparent hover:scale-105")}
                        style={{ background: p.bg }} />
                    ))}
                  </div>
                </div>
              ) : selected.type === "image" ? (
                <div>
                  <p className="text-[10px] text-zinc-400 mb-1.5 font-medium">Image</p>
                  <button onClick={() => { replacingId.current = selected.id; pendingImgPos.current = null; boardImgRef.current?.click(); }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-[11px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors">
                    <Upload className="w-3.5 h-3.5" strokeWidth={2}/>{selected.imageUrl ? "Replace Image" : "Upload Image"}
                  </button>
                  {selected.imageUrl && (
                    <button onClick={() => update(selected.id, { imageUrl: undefined })}
                      className="w-full mt-1.5 flex items-center justify-center gap-1 text-[11px] text-red-400 hover:text-red-500 py-1 transition-colors">
                      Remove Image
                    </button>
                  )}
                </div>
              ) : selected.type !== "text" && selected.type !== "frame" ? (
                <div>
                  <p className="text-[10px] text-zinc-400 mb-1.5 font-medium">Fill Color</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {SHAPE_FILLS.map(c => (
                      <button key={c} onClick={() => update(selected.id, { bg: c })}
                        className={cn("h-6 w-6 rounded-full border-2 transition-all", selected.bg === c ? "border-blue-500 scale-110" : "border-white dark:border-zinc-700 hover:scale-105")}
                        style={{ background: c }} />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-[10px] text-zinc-400">Custom</label>
                    <input type="color" value={selected.bg.startsWith("#") ? selected.bg : "#6366f1"}
                      onChange={e => update(selected.id, { bg: e.target.value })}
                      className="w-8 h-6 rounded cursor-pointer border-0 p-0" />
                  </div>
                </div>
              ) : null}

              {/* Text color */}
              {selected.type !== "sticky" && selected.type !== "image" && (
                <div>
                  <p className="text-[10px] text-zinc-400 mb-1.5 font-medium">Text Color</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={selected.color.startsWith("#") ? selected.color : "#000000"}
                      onChange={e => update(selected.id, { color: e.target.value })}
                      className="w-8 h-7 rounded cursor-pointer border border-zinc-200 dark:border-zinc-700 p-0" />
                    <div className="flex flex-wrap gap-1">
                      {["#ffffff","#1e293b","#6366f1","#10b981","#f59e0b","#ef4444"].map(c => (
                        <button key={c} onClick={() => update(selected.id, { color: c })}
                          className={cn("w-5 h-5 rounded-full border-2 transition-all", selected.color === c ? "border-blue-500" : "border-white dark:border-zinc-700")}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Typography — not shown for image elements */}
              {selected.type !== "image" && <div>
                <p className="text-[10px] text-zinc-400 mb-1.5 font-medium">Typography</p>
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-[10px] text-zinc-400">Size</label>
                  <input type="number" value={selected.fontSize} min={8} max={72}
                    onChange={e => update(selected.id, { fontSize: Number(e.target.value) })}
                    className="w-14 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[12px] text-zinc-700 dark:text-zinc-300 outline-none ml-auto" />
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { icon: Bold,        key: "bold",   val: !selected.bold,   active: selected.bold   },
                    { icon: Italic,      key: "italic", val: !selected.italic, active: selected.italic },
                  ].map(({ icon: Icon, key, val, active }) => (
                    <button key={key} onClick={() => update(selected.id, { [key]: val })}
                      className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                        active ? "text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                      style={active ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor})` } : {}}>
                      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  ))}
                  <div className="flex items-center gap-0.5 ml-1">
                    {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as [string, React.ElementType][]).map(([a, Icon]) => (
                      <button key={a} onClick={() => update(selected.id, { align: a as "left"|"center"|"right" })}
                        className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                          selected.align === a ? "text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                        style={selected.align === a ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor})` } : {}}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>}

              {/* Quick actions */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button onClick={duplicate} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <Copy className="w-3.5 h-3.5" strokeWidth={2} />Duplicate
                </button>
                <button onClick={() => { setEls(p => p.filter(e => e.id !== selectedId)); setSelectedId(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 flex flex-col gap-3">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Board</p>
              <div className="flex flex-col gap-2 text-[11px] text-zinc-400">
                <div className="flex items-start gap-2"><MousePointer2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/><span>Click elements to select & move</span></div>
                <div className="flex items-start gap-2"><StickyNote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/><span>Pick a tool then click to place</span></div>
                <div className="flex items-start gap-2"><Move className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/><span>Space + drag to pan canvas</span></div>
                <div className="flex items-start gap-2"><ZoomIn className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/><span>Scroll wheel to zoom</span></div>
                <div className="flex items-start gap-2"><Type className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/><span>Double-click to edit text</span></div>
              </div>
              <div className="mt-2">
                <p className="text-[10px] text-zinc-400 mb-2 font-medium">Add Element</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {TOOLS.filter(t => t.id !== "select").map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setTool(id as ElType)}
                      className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] transition-colors border",
                        tool === id
                          ? "text-white border-transparent"
                          : "text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                      style={tool === id ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.accentColor})` } : {}}>
                      <Icon className="w-3 h-3 flex-shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
