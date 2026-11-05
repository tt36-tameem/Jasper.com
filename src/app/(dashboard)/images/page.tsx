'use client'

import { useState, useCallback } from 'react'
import {
  Download, Copy, RotateCcw, Sparkles,
  Camera, Film, Palette, Minus, Moon, Briefcase,
  AlertCircle, CheckCircle2, Clock, ImageIcon, VideoIcon,
  Wind, Zap, Feather,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'

/* ─── Types ──────────────────────────────────────────────────────── */
type Mode = 'image' | 'video'

interface GeneratedImage {
  id: string; mode: 'image'
  imageData: string; mimeType: string
  enhancedPrompt: string; prompt: string
  style: string; aspectRatio: string; createdAt: Date
}

interface GeneratedVideo {
  id: string; mode: 'video'
  videoData: string; mimeType: string
  enhancedPrompt: string; prompt: string
  style: string; motion: string; createdAt: Date
}

type GeneratedAsset = GeneratedImage | GeneratedVideo

/* ─── Image config ───────────────────────────────────────────────── */
const IMAGE_STYLES = [
  { id: 'photorealistic', label: 'Photorealistic', icon: Camera,    desc: 'Ultra-detailed photo'    },
  { id: 'cinematic',      label: 'Cinematic',      icon: Film,      desc: 'Movie-quality lighting'  },
  { id: 'illustration',   label: 'Illustration',   icon: Palette,   desc: 'Vibrant digital art'     },
  { id: 'minimalist',     label: 'Minimalist',     icon: Minus,     desc: 'Clean & modern'          },
  { id: 'dark-moody',     label: 'Dark & Moody',   icon: Moon,      desc: 'Atmospheric shadows'     },
  { id: 'corporate',      label: 'Corporate',      icon: Briefcase, desc: 'Professional & polished' },
] as const

const ASPECT_RATIOS = [
  { id: '1:1',  label: '1:1',  sub: 'Square',   w: 1,  h: 1  },
  { id: '16:9', label: '16:9', sub: 'Landscape', w: 16, h: 9  },
  { id: '9:16', label: '9:16', sub: 'Portrait',  w: 9,  h: 16 },
  { id: '4:3',  label: '4:3',  sub: 'Standard',  w: 4,  h: 3  },
] as const

/* ─── Video config ───────────────────────────────────────────────── */
const VIDEO_STYLES = [
  { id: 'cinematic',   label: 'Cinematic',    icon: Film,      desc: 'Dramatic film look'     },
  { id: 'documentary', label: 'Documentary',  icon: Camera,    desc: 'Natural & observational' },
  { id: 'animation',   label: 'Animation',    icon: Palette,   desc: 'Stylized & vibrant'     },
  { id: 'aerial',      label: 'Aerial',       icon: Wind,      desc: 'Drone-style sweeping'   },
  { id: 'slowmo',      label: 'Slow Motion',  icon: Feather,   desc: 'Fluid & ethereal'       },
  { id: 'dynamic',     label: 'Dynamic',      icon: Zap,       desc: 'Fast & energetic'       },
] as const

const MOTION_OPTIONS = [
  { id: 'subtle',  label: 'Subtle',  desc: 'Gentle movement' },
  { id: 'natural', label: 'Natural', desc: 'Balanced flow'   },
  { id: 'dynamic', label: 'Dynamic', desc: 'Bold motion'     },
] as const

/* ─── Presets per mode ───────────────────────────────────────────── */
const IMAGE_PRESETS = [
  'Professional headshot for LinkedIn, confident business person',
  'Modern SaaS dashboard, clean UI with data visualisations',
  'Team collaboration in a bright modern office',
  'Abstract technology concept with flowing data streams',
]

const VIDEO_PRESETS = [
  'Product reveal animation, sleek tech device rotating slowly',
  'Timelapse of a busy city street at golden hour',
  'Abstract data particles forming a glowing network graph',
  'Team brainstorming session in a sunlit conference room',
]

/* ─── Shared helpers ─────────────────────────────────────────────── */
function AspectBox({ ratio, className }: { ratio: string; className?: string }) {
  const map: Record<string, string> = {
    '1:1': 'aspect-square', '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]', '4:3': 'aspect-[4/3]',
  }
  return <div className={cn(map[ratio] ?? 'aspect-video', className)} />
}

function StyleGrid<T extends { id: string; label: string; desc: string; icon: React.FC<{ className?: string; strokeWidth?: number }> }>({
  options, value, onChange,
}: { options: readonly T[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(s => {
        const Icon   = s.icon
        const active = value === s.id
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all border',
              active
                ? 'brand-btn border-transparent'
                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600',
            )}
          >
            <Icon
              className={cn('w-3.5 h-3.5 flex-shrink-0', active ? 'text-white' : 'text-zinc-400')}
              strokeWidth={1.75}
            />
            <div>
              <p className={cn('text-[12px] font-medium leading-none', active ? 'text-white' : 'text-zinc-700 dark:text-zinc-300')}>
                {s.label}
              </p>
              <p className={cn('text-[10px] leading-none mt-0.5', active ? 'text-white/70' : 'text-zinc-400')}>
                {s.desc}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Loading skeleton ───────────────────────────────────────────── */
function LoadingSkeleton({ mode, aspectRatio, isVideo }: { mode: Mode; aspectRatio: string; isVideo?: boolean }) {
  const narrow = !isVideo && aspectRatio === '9:16'
  return (
    <div className={cn('w-full rounded-xl overflow-hidden relative', narrow && 'max-w-[340px] mx-auto')}>
      {isVideo
        ? <div className="aspect-video w-full" />
        : <AspectBox ratio={aspectRatio} className="w-full" />
      }
      <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>
        <p className="text-[12px] text-zinc-400 text-center px-4">
          {mode === 'video'
            ? 'Generating your video… this can take 30–90 seconds'
            : 'Generating your image…'
          }
        </p>
      </div>
    </div>
  )
}

/* ─── Empty state ────────────────────────────────────────────────── */
function EmptyOutput({ mode, aspectRatio }: { mode: Mode; aspectRatio: string }) {
  const narrow = mode === 'image' && aspectRatio === '9:16'
  return (
    <div className={cn('relative w-full', narrow && 'max-w-[340px] mx-auto')}>
      <div className={cn(
        'w-full rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800',
        'bg-zinc-50/50 dark:bg-zinc-900/50 relative overflow-hidden',
      )}>
        {mode === 'video'
          ? <div className="aspect-video w-full" />
          : <AspectBox ratio={aspectRatio} className="w-full" />
        }
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            {mode === 'video'
              ? <VideoIcon className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
              : <ImageIcon className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
            }
          </div>
          <p className="text-[13px] text-zinc-400">
            Your {mode} will appear here
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function StudioPage() {
  // Shared
  const [mode, setMode]     = useState<Mode>('image')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)

  // Image state
  const [imgStyle, setImgStyle]     = useState('photorealistic')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [currentImg, setCurrentImg]   = useState<GeneratedImage | null>(null)
  const [imgHistory, setImgHistory]   = useState<GeneratedImage[]>([])

  // Video state
  const [vidStyle, setVidStyle] = useState('cinematic')
  const [motion, setMotion]     = useState('natural')
  const [currentVid, setCurrentVid] = useState<GeneratedVideo | null>(null)
  const [vidHistory, setVidHistory] = useState<GeneratedVideo[]>([])

  const presets = mode === 'image' ? IMAGE_PRESETS : VIDEO_PRESETS

  /* Switch mode — clear error so stale messages don't confuse */
  const switchMode = (m: Mode) => { setMode(m); setError(null) }

  /* Generate */
  const generate = useCallback(async () => {
    const trimmed = prompt.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError(null)

    try {
      if (mode === 'image') {
        const res  = await fetch('/api/images', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ prompt: trimmed, style: imgStyle, aspectRatio }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Generation failed.'); return }

        const asset: GeneratedImage = {
          id: Math.random().toString(36).slice(2), mode: 'image',
          imageData: data.imageData, mimeType: data.mimeType ?? 'image/jpeg',
          enhancedPrompt: data.enhancedPrompt, prompt: trimmed,
          style: imgStyle, aspectRatio, createdAt: new Date(),
        }
        setCurrentImg(asset)
        setImgHistory(prev => [asset, ...prev].slice(0, 8))

      } else {
        const res  = await fetch('/api/videos', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ prompt: trimmed, style: vidStyle, motion }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Generation failed.'); return }

        const asset: GeneratedVideo = {
          id: Math.random().toString(36).slice(2), mode: 'video',
          videoData: data.videoData, mimeType: data.mimeType ?? 'video/mp4',
          enhancedPrompt: data.enhancedPrompt, prompt: trimmed,
          style: vidStyle, motion, createdAt: new Date(),
        }
        setCurrentVid(asset)
        setVidHistory(prev => [asset, ...prev].slice(0, 6))
      }
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [prompt, mode, imgStyle, aspectRatio, vidStyle, motion, loading])

  /* Download */
  const downloadAsset = useCallback((asset: GeneratedAsset) => {
    const isImg = asset.mode === 'image'
    const data  = isImg ? (asset as GeneratedImage).imageData : (asset as GeneratedVideo).videoData
    const mime  = asset.mimeType
    const ext   = mime.split('/')[1] ?? (isImg ? 'jpg' : 'mp4')
    const a     = Object.assign(document.createElement('a'), {
      href:     `data:${mime};base64,${data}`,
      download: `aura-${asset.mode}-${asset.id}.${ext}`,
    })
    a.click()
  }, [])

  /* Copy prompt */
  const copyPrompt = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  /* Derived display state */
  const currentAsset: GeneratedAsset | null = mode === 'image' ? currentImg : currentVid
  const history      = mode === 'image' ? imgHistory : vidHistory

  return (
    <div className="flex flex-col h-full min-h-0 px-6 py-5">
      <PageHeader
        title="AI Studio"
        description="Generate images and videos from text — powered by FLUX and Claude"
      />

      <div className="flex gap-5 flex-1 min-h-0">

        {/* ── LEFT: Controls ──────────────────────────────────── */}
        <div className="w-[340px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pb-4">

          {/* Mode toggle */}
          <div className="flex gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
            {([
              { id: 'image' as Mode, Icon: ImageIcon, label: 'Image' },
              { id: 'video' as Mode, Icon: VideoIcon, label: 'Video' },
            ]).map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => switchMode(id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-[13px] font-medium transition-all',
                  mode === id
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>

          {/* Prompt */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 flex flex-col gap-3">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Prompt</p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate() }}
              placeholder={mode === 'image'
                ? 'Describe the image you want to create…'
                : 'Describe the video scene you want to generate…'
              }
              rows={4}
              className={cn(
                'w-full resize-none rounded-lg border border-zinc-200 dark:border-zinc-700',
                'bg-zinc-50 dark:bg-zinc-800/50 text-[13px] text-zinc-800 dark:text-zinc-200',
                'placeholder:text-zinc-400 px-3 py-2.5 outline-none leading-relaxed',
                'focus:border-zinc-400 dark:focus:border-zinc-600 transition-all',
              )}
            />
            {/* Presets */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Quick presets</p>
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  className="text-left text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 leading-snug px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Image-specific settings */}
          {mode === 'image' && (
            <>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-3">Style</p>
                <StyleGrid options={IMAGE_STYLES} value={imgStyle} onChange={setImgStyle} />
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-3">Aspect Ratio</p>
                <div className="grid grid-cols-4 gap-2">
                  {ASPECT_RATIOS.map(r => {
                    const active = aspectRatio === r.id
                    const boxW   = r.w >= r.h ? 18 : Math.round((r.w / r.h) * 18)
                    const boxH   = r.h >= r.w ? 18 : Math.round((r.h / r.w) * 18)
                    return (
                      <button
                        key={r.id}
                        onClick={() => setAspectRatio(r.id)}
                        className={cn(
                          'flex flex-col items-center gap-2 py-3 rounded-lg border transition-all',
                          active
                            ? 'brand-btn border-transparent'
                            : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600',
                        )}
                      >
                        <div
                          className={cn('rounded-sm border flex-shrink-0', active ? 'border-white/60 bg-white/20' : 'border-zinc-400 dark:border-zinc-500')}
                          style={{ width: boxW, height: boxH }}
                        />
                        <div className="text-center">
                          <p className={cn('text-[11px] font-semibold leading-none', active ? 'text-white' : 'text-zinc-700 dark:text-zinc-300')}>{r.label}</p>
                          <p className={cn('text-[9px] leading-none mt-0.5', active ? 'text-white/70' : 'text-zinc-400')}>{r.sub}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Video-specific settings */}
          {mode === 'video' && (
            <>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-3">Style</p>
                <StyleGrid options={VIDEO_STYLES} value={vidStyle} onChange={setVidStyle} />
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-3">Motion</p>
                <div className="flex gap-2">
                  {MOTION_OPTIONS.map(m => {
                    const active = motion === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMotion(m.id)}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-lg border text-center transition-all',
                          active
                            ? 'brand-btn border-transparent'
                            : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600',
                        )}
                      >
                        <p className={cn('text-[12px] font-medium leading-none', active ? 'text-white' : 'text-zinc-700 dark:text-zinc-300')}>{m.label}</p>
                        <p className={cn('text-[10px] leading-none', active ? 'text-white/70' : 'text-zinc-400')}>{m.desc}</p>
                      </button>
                    )
                  })}
                </div>

                {/* Video generation time note */}
                <p className="text-[11px] text-zinc-400 mt-3 leading-snug">
                  ⏱ Video generation takes 30–90 seconds on the free tier.
                </p>
              </div>
            </>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={!prompt.trim() || loading}
            className={cn(
              'w-full h-11 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-all',
              prompt.trim() && !loading
                ? 'brand-btn'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed',
            )}
          >
            {loading
              ? <><RotateCcw className="w-4 h-4 animate-spin" /> {mode === 'video' ? 'Generating video…' : 'Generating…'}</>
              : <><Sparkles className="w-4 h-4" /> Generate {mode === 'image' ? 'Image' : 'Video'}</>
            }
          </button>

          <p className="text-[11px] text-zinc-400 text-center -mt-1">
            ⌘ + Enter · Powered by {mode === 'image' ? 'FLUX.1' : 'ModelScope T2V'} + Claude
          </p>
        </div>

        {/* ── RIGHT: Output ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto pb-4">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <p className="text-[13px] font-medium text-red-700 dark:text-red-400">{error}</p>
                {(error.includes('HUGGINGFACE') || error.includes('ANTHROPIC')) && (
                  <p className="text-[12px] text-red-500 mt-0.5">
                    Check your API keys in <code className="font-mono bg-red-100 dark:bg-red-900/30 px-1 rounded">.env.local</code> and restart the dev server.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Output card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5 flex flex-col gap-4">

            {/* Media display */}
            {loading ? (
              <LoadingSkeleton mode={mode} aspectRatio={aspectRatio} isVideo={mode === 'video'} />
            ) : mode === 'image' && currentImg ? (
              <div className={cn('relative w-full', aspectRatio === '9:16' && 'max-w-[360px] mx-auto')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${currentImg.mimeType};base64,${currentImg.imageData}`}
                  alt={currentImg.prompt}
                  className="w-full rounded-xl object-cover shadow-sm"
                />
              </div>
            ) : mode === 'video' && currentVid ? (
              <video
                key={currentVid.id}
                src={`data:${currentVid.mimeType};base64,${currentVid.videoData}`}
                controls
                autoPlay
                muted
                loop
                className="w-full rounded-xl shadow-sm bg-zinc-100 dark:bg-zinc-800"
              />
            ) : (
              <EmptyOutput mode={mode} aspectRatio={aspectRatio} />
            )}

            {/* Enhanced prompt + actions */}
            {currentAsset && !loading && (
              <div className="flex flex-col gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Enhanced prompt</p>
                  <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {currentAsset.enhancedPrompt}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => downloadAsset(currentAsset)}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-lg brand-btn text-[12px] font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button
                    onClick={() => copyPrompt(currentAsset.enhancedPrompt)}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600 text-[12px] font-medium text-zinc-600 dark:text-zinc-400 transition-all"
                  >
                    {copied
                      ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
                      : <><Copy className="w-3.5 h-3.5" /> Copy Prompt</>
                    }
                  </button>
                  <div className="ml-auto flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    {currentAsset.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{currentAsset.style}
                    {currentAsset.mode === 'image' && ` · ${(currentAsset as GeneratedImage).aspectRatio}`}
                    {currentAsset.mode === 'video' && ` · ${(currentAsset as GeneratedVideo).motion}`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History strip */}
          {history.length > 1 && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Recent {mode === 'image' ? 'images' : 'videos'}
                </p>
                <button
                  onClick={() => mode === 'image' ? setImgHistory([]) : setVidHistory([])}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-start gap-2.5 overflow-x-auto pb-1">
                {mode === 'image'
                  ? imgHistory.map(img => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImg(img)}
                      className={cn(
                        'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                        currentImg?.id === img.id
                          ? 'border-zinc-800 dark:border-zinc-200 shadow-md scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-600',
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`data:${img.mimeType};base64,${img.imageData}`} alt={img.prompt} className="w-full h-full object-cover" />
                    </button>
                  ))
                  : vidHistory.map(vid => (
                    <button
                      key={vid.id}
                      onClick={() => setCurrentVid(vid)}
                      className={cn(
                        'flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all relative',
                        currentVid?.id === vid.id
                          ? 'border-zinc-800 dark:border-zinc-200 shadow-md scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-600',
                      )}
                    >
                      <video
                        src={`data:${vid.mimeType};base64,${vid.videoData}`}
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <VideoIcon className="w-4 h-4 text-white drop-shadow" strokeWidth={1.75} />
                      </div>
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* Setup guide (only when no output yet and no error) */}
          {!currentAsset && !loading && !error && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-5">
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-3">Setup</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { step: '1', text: 'Get a free HuggingFace token at huggingface.co/settings/tokens' },
                  { step: '2', text: 'Add HUGGINGFACE_API_KEY=hf_... to your .env.local file' },
                  { step: '3', text: 'Ensure ANTHROPIC_API_KEY is set (used for prompt enhancement)' },
                  { step: '4', text: 'Restart the dev server, write a prompt, and generate' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 flex-shrink-0 mt-0.5">
                      {step}
                    </span>
                    <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
