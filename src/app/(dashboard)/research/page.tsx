'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, Globe,
  Users, DollarSign, Calendar, TrendingUp, Target,
  Layers, Megaphone, Zap, Hash, BarChart2, ChevronRight, Sparkles,
  Gauge, Lock, ArrowUpRight,
  CheckCircle2, XCircle, AlertCircle, Activity, RefreshCw, ArrowRight, CheckSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLAN as USAGE_PLAN, recordUsage } from '@/lib/usageStore'

/* ─── Brand SVG logos ───────────────────────────────────────────────────── */
type SvgProps = { className?: string }

function YoutubeLogo({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function InstagramLogo({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function TwitterXLogo({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInLogo({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function TikTokLogo({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

/* ─── Credits system ────────────────────────────────────────────────────── */
// Research credits are part of the single plan — keep this in lockstep with the
// shared usage meter so the dashboard and this page show the same numbers.
const PLAN = { name: USAGE_PLAN.name, creditsPerMonth: USAGE_PLAN.limits.research }

const STORAGE_USED  = 'aura-research-credits-used'
const STORAGE_RESET = 'aura-research-credits-reset'

function getNextResetDate(): Date {
  const d = new Date()
  d.setMonth(d.getMonth() + 1, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function loadCredits(): { used: number; resetDate: Date } {
  if (typeof window === 'undefined') return { used: 0, resetDate: getNextResetDate() }
  const resetStr = localStorage.getItem(STORAGE_RESET)
  const resetDate = resetStr ? new Date(resetStr) : getNextResetDate()
  if (!resetStr || resetDate <= new Date()) {
    const next = getNextResetDate()
    localStorage.setItem(STORAGE_RESET, next.toISOString())
    localStorage.setItem(STORAGE_USED,  '0')
    return { used: 0, resetDate: next }
  }
  return { used: parseInt(localStorage.getItem(STORAGE_USED) ?? '0', 10), resetDate }
}

function useCredits() {
  const [used,      setUsed]      = useState(0)
  const [resetDate, setResetDate] = useState<Date>(getNextResetDate())

  useEffect(() => {
    const s = loadCredits()
    setUsed(s.used)
    setResetDate(s.resetDate)
  }, [])

  const spend = useCallback(() => {
    setUsed(prev => {
      const next = prev + 1
      localStorage.setItem(STORAGE_USED, String(next))
      return next
    })
    // Mirror into the shared meter so the dashboard usage widget stays in sync.
    recordUsage('research')
  }, [])

  return { used, total: PLAN.creditsPerMonth, resetDate, spend, exhausted: used >= PLAN.creditsPerMonth }
}

/* ─── Credits bar widget ─────────────────────────────────────────────────── */
function CreditsBar({ used, total }: { used: number; total: number; resetDate: Date }) {
  const remaining = Math.max(0, total - used)
  const pct       = Math.min(100, (used / total) * 100)
  const exhausted = used >= total

  const barColor =
    pct >= 90 ? 'bg-red-500' :
    pct >= 65 ? 'bg-amber-500' :
                'bg-emerald-500'

  const countColor =
    pct >= 90 ? 'text-red-500 dark:text-red-400' :
    pct >= 65 ? 'text-amber-500 dark:text-amber-400' :
                'text-emerald-500 dark:text-emerald-400'

  return (
    <div className="flex-shrink-0 flex items-center gap-2.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-3 py-2">
      <Gauge className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
            Credits
          </span>
          <span className={cn('text-[11px] font-bold tabular-nums', countColor)}>
            {remaining}<span className="font-normal text-zinc-300 dark:text-zinc-600">/{total}</span>
          </span>
        </div>
        <div className="h-[3px] w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {(exhausted || pct >= 65) && (
        <a href="/settings"
          className="flex items-center gap-0.5 text-[10px] font-semibold text-violet-500 dark:text-violet-400 hover:underline whitespace-nowrap">
          {exhausted ? 'Top up' : 'Upgrade'}<ArrowUpRight className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  )
}

/* ─── Out-of-credits gate ────────────────────────────────────────────────── */
function OutOfCredits({ resetDate }: { resetDate: Date }) {
  const reset = resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
        <Lock className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-[16px] font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">
        Monthly credits exhausted
      </h2>
      <p className="text-[13px] text-zinc-400 max-w-sm mb-6">
        You&apos;ve used all {PLAN.creditsPerMonth} research credits for this month.
        They reset on <strong className="text-zinc-600 dark:text-zinc-300">{reset}</strong>.
      </p>
      <a href="/settings"
        className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl brand-btn text-[13px] font-medium">
        Top up credits <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}

/* ─── Platform config ───────────────────────────────────────────────────── */
const FILTER_PLATFORMS = [
  { id: 'all',       label: 'All',       Logo: Globe,          activeClass: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent'                 },
  { id: 'youtube',   label: 'YouTube',   Logo: YoutubeLogo,    activeClass: 'bg-red-500 text-white border-transparent'                                                       },
  { id: 'instagram', label: 'Instagram', Logo: InstagramLogo,  activeClass: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white border-transparent'     },
  { id: 'twitter',   label: 'Twitter/X', Logo: TwitterXLogo,   activeClass: 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border-transparent'                  },
  { id: 'linkedin',  label: 'LinkedIn',  Logo: LinkedInLogo,   activeClass: 'bg-[#0077B5] text-white border-transparent'                                                     },
  { id: 'tiktok',    label: 'TikTok',    Logo: TikTokLogo,     activeClass: 'bg-zinc-900 text-white border-transparent'                                                      },
]

/* ─── Types ─────────────────────────────────────────────────────────────── */
type PlatformStat  = { platform: string; followers: string; pct: number; bar: string; Logo: React.FC<SvgProps> }
type FunnelStage   = { tag: string; label: string; description: string; tactics: string[]; bg: string; text: string }
type Offer         = { name: string; price: string; format: string; description: string }
type ContentPillar = { label: string; color: string }

interface Profile {
  name: string; handle: string; avatar: string; avatarUrl: string
  started: string; niche: string; market: string
  tagline: string; primaryPlatform: string; estRevenue: string
  platforms: PlatformStat[]
  icp: { ageRange: string; demographics: string; incomeLevel: string; painPoints: string[]; desires: string[]; awareness: string }
  funnel: FunnelStage[]
  offers: Offer[]
  positioning: { coreMessage: string; uniqueMechanism: string; tone: string[]; differentiators: string[] }
  ctas: string[]; hooks: string[]
  contentPillars: ContentPillar[]
  tags: string[]
}

/* ─── Profile photos via unavatar.io ────────────────────────────────────── */
function ProfileAvatar({ url, fallback, hue, size = 'lg' }: { url: string; fallback: string; hue: number; size?: 'sm' | 'lg' | 'xl' }) {
  const [failed, setFailed] = useState(false)
  const dim = { sm: 'w-9 h-9 text-[11px]', lg: 'w-12 h-12 text-[14px]', xl: 'w-16 h-16 text-[20px]' }[size]
  if (failed || !url) {
    return (
      <span className={cn('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0', dim)} style={{ background: `hsl(${hue} 55% 50%)` }}>
        {fallback}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={fallback} onError={() => setFailed(true)}
      className={cn('rounded-full object-cover flex-shrink-0', dim)} />
  )
}

/* ─── Mock profiles ─────────────────────────────────────────────────────── */
const PROFILES: Profile[] = [
  {
    name: 'Alex Hormozi', handle: '@AlexHormozi', avatar: 'AH',
    avatarUrl: 'https://unavatar.io/twitter/alexhormozi',
    started: '2013', niche: 'Business Acquisition & Scaling', market: 'B2B / Entrepreneurship',
    tagline: 'I help you make more money. Without the BS.',
    primaryPlatform: 'YouTube', estRevenue: '$200M+ / yr',
    platforms: [
      { platform: 'YouTube',   followers: '5.2M', pct: 45, bar: 'bg-red-500',   Logo: YoutubeLogo    },
      { platform: 'Instagram', followers: '3.8M', pct: 32, bar: 'bg-pink-500',  Logo: InstagramLogo  },
      { platform: 'LinkedIn',  followers: '1.4M', pct: 13, bar: 'bg-blue-600',  Logo: LinkedInLogo   },
      { platform: 'Twitter/X', followers: '1.2M', pct: 10, bar: 'bg-zinc-500',  Logo: TwitterXLogo   },
    ],
    icp: {
      ageRange: '25 – 45',
      demographics: 'Entrepreneurs, agency owners, gym & service business operators generating $100k–$3M/yr.',
      incomeLevel: '$100k – $3M annual revenue',
      painPoints: ['Stagnant revenue despite working more hours', 'Weak offers that rely on discounting', 'Poor lead generation or low close rate', 'No scalable, repeatable sales process'],
      desires: ['Scale to 7–8 figures without burning out', 'Build an acquisition-ready, sellable business', 'Stop trading time for money', 'Premium, high-converting offers'],
      awareness: 'Problem-aware → Solution-aware',
    },
    funnel: [
      { tag: 'TOFU', label: 'Attention', description: 'Blanket the internet with free, hyper-valuable long-form and short-form content.', tactics: ['Daily long-form YouTube videos', 'Repurposed shorts across all platforms', 'Podcast appearances & features', 'Twitter threads + LinkedIn essays'], bg: 'bg-blue-500/10 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
      { tag: 'MOFU', label: 'Education', description: 'Books positioned as free or $0.99 — massive perceived value at zero friction.', tactics: ['$100M Offers book (free + shipping)', '$100M Leads book (free + shipping)', 'Free Acquisition.com frameworks', 'Email list nurture sequences'], bg: 'bg-violet-500/10 dark:bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400' },
      { tag: 'BOFU', label: 'Conversion', description: 'Acquisition.com takes equity in businesses they help grow — the ultimate high-ticket offer.', tactics: ['Application funnel for portfolio companies', 'High-ticket strategy calls', 'Gym Launch / ALAN / Prestige Labs', 'Trust built entirely from free content'], bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
    ],
    offers: [
      { name: '$100M Offers',         price: 'Free + $9.95 S&H', format: 'Physical book',    description: 'How to craft offers so good people feel stupid saying no.'        },
      { name: '$100M Leads',          price: 'Free + $9.95 S&H', format: 'Physical book',    description: 'How to get strangers to want to buy your stuff.'                  },
      { name: 'Acquisition.com Deal', price: 'Equity stake',     format: 'Business partner', description: 'Capital + team deployed in exchange for equity in your business.' },
      { name: 'Gym Launch Secrets',   price: 'Varies',           format: 'Coaching program', description: 'Done-with-you growth system for gym & service businesses.'         },
    ],
    positioning: {
      coreMessage: 'Stop having a bad business. Here is the math that actually works.',
      uniqueMechanism: 'The Value Equation — Dream Outcome × Perceived Likelihood ÷ Time Delay × Effort.',
      tone: ['Direct', 'Data-driven', 'No-fluff', 'Brutally honest', 'Empowering'],
      differentiators: ['Shows real P&Ls and business data publicly', 'Entire frameworks given away for free', 'Positions acquisition & equity over coaching', '"Give without expectation" content model'],
    },
    ctas: ['"Get the book for free — just cover shipping"', '"Watch this if you want to 10x your close rate"', '"Apply to work with us at Acquisition.com"', '"Comment below and I\'ll send you the template"'],
    hooks: ['"Most people think X, but the truth is Y"', '"I made $0 doing this. Then I changed one thing."', '"Here\'s the exact script we use to close $5k/mo clients"', '"If your business makes under $3M, watch this first"', '"The reason your offer sucks (and how to fix it today)"'],
    contentPillars: [
      { label: 'Offer Creation',   color: 'bg-blue-100   dark:bg-blue-950/50   text-blue-600   dark:text-blue-400'   },
      { label: 'Lead Generation',  color: 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' },
      { label: 'Sales & Closing',  color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
      { label: 'Operations',       color: 'bg-amber-100  dark:bg-amber-950/50  text-amber-600  dark:text-amber-400'  },
      { label: 'Mindset',          color: 'bg-rose-100   dark:bg-rose-950/50   text-rose-600   dark:text-rose-400'   },
      { label: 'Case Studies',     color: 'bg-zinc-100   dark:bg-zinc-800      text-zinc-600   dark:text-zinc-400'   },
    ],
    tags: ['hormozi', 'alex', 'alexhormozi', 'business', 'entrepreneur', 'b2b', 'acquisition', 'offers', 'leads', 'scaling'],
  },
  {
    name: 'MrBeast', handle: '@MrBeast', avatar: 'MB',
    avatarUrl: 'https://unavatar.io/twitter/mrbeast',
    started: '2012', niche: 'Viral Entertainment & Philanthropy', market: 'B2C / Mass Entertainment',
    tagline: 'I spend millions of dollars to give it away.',
    primaryPlatform: 'YouTube', estRevenue: '$700M+ / yr',
    platforms: [
      { platform: 'YouTube',   followers: '320M', pct: 78, bar: 'bg-red-500',  Logo: YoutubeLogo   },
      { platform: 'TikTok',    followers: '38M',  pct: 10, bar: 'bg-zinc-600', Logo: TikTokLogo    },
      { platform: 'Instagram', followers: '26M',  pct: 9,  bar: 'bg-pink-500', Logo: InstagramLogo },
      { platform: 'Twitter/X', followers: '14M',  pct: 3,  bar: 'bg-zinc-400', Logo: TwitterXLogo  },
    ],
    icp: {
      ageRange: '13 – 34',
      demographics: 'Male-skewing Gen Z and Millennials globally. Entertainment-first, dopamine-driven audience seeking spectacle.',
      incomeLevel: 'All income levels — mass market',
      painPoints: ['Boredom and lack of exciting entertainment', 'Desire to witness real generosity at scale', 'FOMO on viral moments', 'Aspirational wealth and competition fantasy'],
      desires: ['Extreme spectacle and entertainment', 'See regular people win massive prizes', 'Vicarious philanthropy', 'Instantly shareable water-cooler content'],
      awareness: 'Unaware → captivated within 3 seconds',
    },
    funnel: [
      { tag: 'TOFU', label: 'Hook', description: 'Thumbnail + title engineered to be psychologically irresistible via constant A/B testing.', tactics: ['40+ thumbnail variations tested per video', 'Title formulas: "I Spent $X..." / "Last To..."', 'Cross-platform reposts of top clips', 'Celeb collab drops as launch events'], bg: 'bg-red-500/10 dark:bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
      { tag: 'MOFU', label: 'Retention', description: 'Video structure engineered for 70%+ watch time through escalation and emotional beats.', tactics: ['0–5 sec hook — pays out the premise instantly', 'Escalation every 2–3 minutes', 'Cliffhangers before mid-roll ad breaks', 'Emotional arc: joy → tension → resolution'], bg: 'bg-orange-500/10 dark:bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
      { tag: 'BOFU', label: 'Monetization', description: 'YouTube AdSense + brand integrations + wholly-owned CPG and restaurant brands.', tactics: ['Feastables chocolate (Walmart & DTC)', 'MrBeast Burger (ghost kitchen)', 'Branded merchandise drops', '$3–10M brand integration deals'], bg: 'bg-amber-500/10 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
    ],
    offers: [
      { name: 'Feastables',         price: '$2.99 – $14.99',  format: 'CPG / Retail',     description: 'Premium chocolate bars competing with mass-market brands at Walmart.'        },
      { name: 'MrBeast Merch',      price: '$25 – $80',       format: 'E-commerce',       description: 'Branded drops tied to video themes and milestones.'                          },
      { name: 'Brand Integrations', price: '$3M – $10M/deal', format: 'Sponsorship',      description: 'Full-video or segment integrations with Fortune 500 brands at premium CPMs.' },
      { name: 'Beast Philanthropy', price: 'N/A',             format: 'Non-profit brand', description: 'Separate charity channel with its own brand deals and merchandise line.'      },
    ],
    positioning: {
      coreMessage: 'The most insane things you have ever seen — completely free.',
      uniqueMechanism: 'Production budget reinvestment loop — ad revenue → bigger videos → more views → more revenue.',
      tone: ['High-energy', 'Inclusive', 'Optimistic', 'Hyperbolic', 'Authentic'],
      differentiators: ['Reinvests nearly all revenue back into content', 'Philanthropy IS the content — authentic loop', 'Obsessive A/B testing on every element', 'Localized in 12+ languages'],
    },
    ctas: ['"Subscribe — or I\'ll do something even crazier"', '"Comment your country — we\'re filming there next"', '"Try Feastables — best chocolate you\'ve ever had"', '"Share this with someone who needs to smile today"'],
    hooks: ['"Last person to leave wins $500,000"', '"I spent $1,000,000 to build the world\'s largest..."', '"Would you survive 100 days in..."', '"I gave a random stranger $100,000 and filmed it"', '"Whoever solves this puzzle wins everything inside"'],
    contentPillars: [
      { label: 'Extreme Challenges', color: 'bg-red-100    dark:bg-red-950/50    text-red-600    dark:text-red-400'    },
      { label: 'Philanthropy',       color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
      { label: 'World Records',      color: 'bg-blue-100   dark:bg-blue-950/50   text-blue-600   dark:text-blue-400'   },
      { label: 'Celebrity Collabs',  color: 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' },
      { label: 'Survival & Stunts',  color: 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400' },
      { label: 'Gaming',             color: 'bg-zinc-100   dark:bg-zinc-800      text-zinc-600   dark:text-zinc-400'   },
    ],
    tags: ['mrbeast', 'beast', 'jimmy', 'donaldson', 'youtube', 'viral', 'entertainment', 'feastables', 'creator', 'philanthropy'],
  },
  {
    name: 'Dan Koe', handle: '@thedankoe', avatar: 'DK',
    avatarUrl: 'https://unavatar.io/twitter/thedankoe',
    started: '2019', niche: 'One-Person Business & Digital Writing', market: 'B2C / Knowledge Economy',
    tagline: 'Your future is built one sentence at a time.',
    primaryPlatform: 'Twitter/X', estRevenue: '$5M+ / yr',
    platforms: [
      { platform: 'Twitter/X', followers: '820K', pct: 52, bar: 'bg-zinc-700',  Logo: TwitterXLogo  },
      { platform: 'YouTube',   followers: '420K', pct: 27, bar: 'bg-red-500',   Logo: YoutubeLogo   },
      { platform: 'Instagram', followers: '240K', pct: 15, bar: 'bg-pink-500',  Logo: InstagramLogo },
      { platform: 'LinkedIn',  followers: '95K',  pct: 6,  bar: 'bg-blue-600',  Logo: LinkedInLogo  },
    ],
    icp: {
      ageRange: '22 – 38',
      demographics: 'Knowledge workers, designers, developers, and writers who feel trapped in a 9–5 and crave autonomy.',
      incomeLevel: '$40k – $150k salary, wanting to replace it with digital income',
      painPoints: ['Feel intellectually under-stimulated in corporate jobs', 'Want to monetize knowledge but don\'t know how', 'Overwhelmed by contradictory guru advice', 'Don\'t know how to build an online audience from zero'],
      desires: ['One-person business generating $5k–$20k/mo', 'Creative and intellectual freedom', 'Location independence', 'Writing that compounds into passive income'],
      awareness: 'Solution-aware → product-aware',
    },
    funnel: [
      { tag: 'TOFU', label: 'Writing', description: 'Daily philosophical + business Twitter threads that attract ambitious creatives and builders.', tactics: ['Daily Twitter/X threads (philosophy + business)', 'Weekly long-form newsletter (The Koe Letter)', 'YouTube essays — 20–40 min deep dives', 'Instagram quote graphics for passive reach'], bg: 'bg-blue-500/10 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
      { tag: 'MOFU', label: 'Trust', description: 'Free newsletter and YouTube depth converts casual followers into superfans who buy.', tactics: ['Free email newsletter (300k+ subscribers)', 'Kortex SaaS (daily touchpoint)', 'YouTube long-form trust builders', 'Podcast features & cross-promos'], bg: 'bg-violet-500/10 dark:bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400' },
      { tag: 'BOFU', label: 'Courses', description: 'Course suite from $150–$500 with a clear before/after transformation promise.', tactics: ['2-Hour Writer ($150 intro product)', 'Digital Economics Masterclass ($500)', 'The Identity Shift ($300 mindset course)', 'Kortex annual plan ($99/yr SaaS)'], bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
    ],
    offers: [
      { name: '2-Hour Writer',               price: '$150',   format: 'Online course', description: 'Learn to write content that attracts clients in 2 hours per day.'    },
      { name: 'Digital Economics Masterclass',price: '$500',  format: 'Online course', description: 'Build a complete one-person digital business from scratch.'          },
      { name: 'The Identity Shift',          price: '$300',   format: 'Online course', description: 'Reprogram your identity and beliefs to match the life you want.'     },
      { name: 'Kortex',                      price: '$99/yr', format: 'SaaS',         description: 'Note-taking and knowledge management tool built for creators.'       },
    ],
    positioning: {
      coreMessage: 'You don\'t need a niche. You are the niche. Write daily. Sell once. Scale forever.',
      uniqueMechanism: 'The One-Person Business Model — leverage your specific knowledge, write publicly, productize the system.',
      tone: ['Philosophical', 'Minimalist', 'Contrarian', 'Calm authority', 'Anti-guru'],
      differentiators: ['Blends Stoic philosophy with modern business', 'Anti-hustle, anti-niche positioning', 'Builds transparently in public', 'Products teach his exact real system'],
    },
    ctas: ['"Read The Koe Letter — free every Sunday"', '"Get 2-Hour Writer and launch your digital career"', '"Follow for daily threads on work, life, and money"', '"Try Kortex free — it\'s how I write everything"'],
    hooks: ['"The 9-5 is the riskiest thing you can do"', '"Stop niching down. Be the niche."', '"Most people have a job. You can have a business."', '"Write one thread per day for a year. Your life changes."', '"The goal isn\'t to get rich. It\'s to stop being poor in ways that matter."'],
    contentPillars: [
      { label: 'Writing & Audience',  color: 'bg-blue-100   dark:bg-blue-950/50   text-blue-600   dark:text-blue-400'   },
      { label: 'One-Person Business', color: 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' },
      { label: 'Philosophy & Mindset',color: 'bg-amber-100  dark:bg-amber-950/50  text-amber-600  dark:text-amber-400'  },
      { label: 'Productivity',        color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
      { label: 'Digital Products',    color: 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400' },
      { label: 'Self-Development',    color: 'bg-rose-100   dark:bg-rose-950/50   text-rose-600   dark:text-rose-400'   },
    ],
    tags: ['dan', 'koe', 'dankoe', 'writing', 'creator', 'one-person', 'business', 'twitter', 'digital', 'philosophy', 'knowledge'],
  },
  {
    name: 'Gary Vaynerchuk', handle: '@garyvee', avatar: 'GV',
    avatarUrl: 'https://unavatar.io/twitter/garyvee',
    started: '2006', niche: 'Personal Branding & Entrepreneurship', market: 'B2B + B2C / Marketing',
    tagline: 'Patience + speed. Document, don\'t create.',
    primaryPlatform: 'Instagram', estRevenue: '$200M+ / yr',
    platforms: [
      { platform: 'Instagram', followers: '10M',  pct: 38, bar: 'bg-pink-500',  Logo: InstagramLogo },
      { platform: 'LinkedIn',  followers: '5.2M', pct: 23, bar: 'bg-blue-600',  Logo: LinkedInLogo  },
      { platform: 'YouTube',   followers: '4.2M', pct: 22, bar: 'bg-red-500',   Logo: YoutubeLogo   },
      { platform: 'Twitter/X', followers: '3.1M', pct: 17, bar: 'bg-zinc-600',  Logo: TwitterXLogo  },
    ],
    icp: {
      ageRange: '22 – 45',
      demographics: 'Entrepreneurs, marketers, agency owners, and corporate professionals seeking business growth and personal branding clarity.',
      incomeLevel: '$50k – $10M+ at various business stages',
      painPoints: ['Struggling to build a recognizable personal brand', 'Inconsistent content output', 'Fear of long-term thinking', 'Unsure how to leverage social media for business'],
      desires: ['Massive personal brand that generates inbound deals', 'Business built on authentic storytelling', 'Multiple income streams', 'Legacy and long-term impact over quick wins'],
      awareness: 'Problem-aware → very product-aware',
    },
    funnel: [
      { tag: 'TOFU', label: 'Omnipresence', description: '"Document, don\'t create" — repurpose one piece of content across every platform simultaneously.', tactics: ['Daily Instagram posts and stories', 'YouTube vlogs and keynotes', 'Twitter/X daily musings', 'LinkedIn thought leadership essays'], bg: 'bg-blue-500/10 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
      { tag: 'MOFU', label: 'Authority', description: 'Books, podcast, and speaking build deep authority with serious entrepreneurs and marketers.', tactics: ['#AskGaryVee podcast/show (1000+ episodes)', 'NYT Bestselling books', 'High-profile keynote speeches', 'VeeFriends NFT community'], bg: 'bg-violet-500/10 dark:bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400' },
      { tag: 'BOFU', label: 'Services', description: 'VaynerMedia agency serves the business leaders who consume his free content daily.', tactics: ['VaynerMedia (social media agency)', 'VaynerSports (athlete marketing)', 'VaynerCommerce (e-commerce agency)', 'VeeFriends (NFT & community brand)'], bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
    ],
    offers: [
      { name: 'VaynerMedia',                price: 'Enterprise retainer', format: 'Agency',          description: 'Full-service social media marketing agency for Fortune 500 brands.'      },
      { name: 'Jab, Jab, Jab, Right Hook', price: '$20',              format: 'Book',            description: 'How to give before you ask — the social media content strategy bible.'    },
      { name: '$12M Mastermind',            price: '$12M/yr',         format: 'Private group',   description: 'Exclusive annual mastermind group for top-tier entrepreneurs.'             },
      { name: 'VeeFriends',                 price: 'Varies (NFT)',    format: 'Community/brand', description: 'NFT project granting access to GaryVee\'s events and inner community.'    },
    ],
    positioning: {
      coreMessage: 'The market always wins. Go where attention is cheap before everyone else does.',
      uniqueMechanism: '"Day Trading Attention" — identify underpriced platforms early, dominate, then scale.',
      tone: ['Raw energy', 'Profanity-laced honesty', 'Motivational', 'Street-smart', 'Self-aware'],
      differentiators: ['Was early to YouTube, Instagram, TikTok — first-mover proof', 'Documents life 24/7 — radical transparency', 'Wine Library success story as core credibility', '15+ year consistent message about patience'],
    },
    ctas: ['"DM me the word HUSTLE for the free guide"', '"Subscribe to my YouTube — I drop heat daily"', '"Book a strategy call with VaynerMedia"', '"Get the book — it\'ll change how you think about content"'],
    hooks: ['"Nobody is talking about this platform yet — get in now"', '"In 5 years you\'re going to wish you started today"', '"Stop making excuses. Start making content."', '"The biggest mistake entrepreneurs make in year one"', '"TikTok is the new Instagram. Instagram was the new Facebook."'],
    contentPillars: [
      { label: 'Personal Branding', color: 'bg-blue-100   dark:bg-blue-950/50   text-blue-600   dark:text-blue-400'   },
      { label: 'Social Media',      color: 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' },
      { label: 'Entrepreneurship',  color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
      { label: 'Self-Awareness',    color: 'bg-amber-100  dark:bg-amber-950/50  text-amber-600  dark:text-amber-400'  },
      { label: 'NFTs & Web3',       color: 'bg-rose-100   dark:bg-rose-950/50   text-rose-600   dark:text-rose-400'   },
      { label: 'Sales & Marketing', color: 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400' },
    ],
    tags: ['gary', 'vee', 'garyvee', 'vaynerchuk', 'vayner', 'entrepreneur', 'marketing', 'personal brand', 'agency', 'instagram'],
  },
]

/* ─── API → Profile conversion helpers ─────────────────────────────────── */
const LOGO_MAP: Record<string, React.FC<SvgProps>> = {
  'YouTube':   YoutubeLogo,
  'Instagram': InstagramLogo,
  'Twitter/X': TwitterXLogo,
  'LinkedIn':  LinkedInLogo,
  'TikTok':    TikTokLogo,
}
const BAR_MAP: Record<string, string> = {
  'YouTube':   'bg-red-500',
  'Instagram': 'bg-pink-500',
  'Twitter/X': 'bg-zinc-700',
  'LinkedIn':  'bg-blue-600',
  'TikTok':    'bg-zinc-600',
}
const FUNNEL_COLORS: Record<string, { bg: string; text: string }> = {
  TOFU: { bg: 'bg-blue-500/10 dark:bg-blue-500/15',    text: 'text-blue-600 dark:text-blue-400'    },
  MOFU: { bg: 'bg-violet-500/10 dark:bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400' },
  BOFU: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
}
const PILLAR_COLORS = [
  'bg-blue-100   dark:bg-blue-950/50   text-blue-600   dark:text-blue-400',
  'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',
  'bg-amber-100  dark:bg-amber-950/50  text-amber-600  dark:text-amber-400',
  'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400',
  'bg-rose-100   dark:bg-rose-950/50   text-rose-600   dark:text-rose-400',
]

interface ApiProfile {
  name: string; handle: string; avatar: string; twitterHandle: string
  started: string; niche: string; market: string; tagline: string
  primaryPlatform: string; estRevenue: string
  platforms: { platform: string; followers: string; pct: number }[]
  icp: Profile['icp']
  funnel: { tag: string; label: string; description: string; tactics: string[] }[]
  offers: Offer[]
  positioning: Profile['positioning']
  ctas: string[]; hooks: string[]
  contentPillars: { label: string }[]
  tags: string[]
}

function convertApiProfile(api: ApiProfile): Profile {
  return {
    name: api.name, handle: api.handle, avatar: api.avatar,
    avatarUrl: api.twitterHandle ? `https://unavatar.io/twitter/${api.twitterHandle}` : '',
    started: api.started, niche: api.niche, market: api.market,
    tagline: api.tagline, primaryPlatform: api.primaryPlatform, estRevenue: api.estRevenue,
    platforms: api.platforms.map(p => ({
      platform: p.platform, followers: p.followers, pct: p.pct,
      bar: BAR_MAP[p.platform] ?? 'bg-zinc-400',
      Logo: LOGO_MAP[p.platform] ?? Globe,
    })),
    icp: api.icp,
    funnel: api.funnel.map(f => ({
      ...f,
      bg:   (FUNNEL_COLORS[f.tag] ?? FUNNEL_COLORS.TOFU).bg,
      text: (FUNNEL_COLORS[f.tag] ?? FUNNEL_COLORS.TOFU).text,
    })),
    offers: api.offers,
    positioning: api.positioning,
    ctas: api.ctas, hooks: api.hooks,
    contentPillars: api.contentPillars.map((p, i) => ({
      label: p.label, color: PILLAR_COLORS[i % PILLAR_COLORS.length],
    })),
    tags: api.tags,
  }
}

/* ─── Audit types & config ───────────────────────────────────────────────── */
type AuditPlatformId = 'youtube' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok'

interface AuditReport {
  handle: string
  platform: AuditPlatformId
  overallScore: number
  scoreBreakdown: Array<{ label: string; score: number; max: number }>
  strengths: string[]
  contentGaps: string[]
  audienceHealth: Array<{ label: string; value: string; status: 'good' | 'warn' | 'bad' }>
  engagement: Array<{ metric: string; value: string; benchmark: string; delta: number }>
  growthOpportunities: string[]
  actionItems: Array<{ priority: 'high' | 'medium' | 'low'; text: string }>
  contentPillars: ContentPillar[]
  postingFrequency: string
  bestPostingTime: string
}

const AUDIT_PLATFORMS = [
  { id: 'youtube'   as AuditPlatformId, label: 'YouTube',   Logo: YoutubeLogo,   iconColor: 'text-red-500',  ringColor: 'ring-red-400',  activeBg: 'bg-red-500',  activeBorder: 'border-red-500'  },
  { id: 'instagram' as AuditPlatformId, label: 'Instagram', Logo: InstagramLogo, iconColor: 'text-pink-500', ringColor: 'ring-pink-400', activeBg: 'bg-pink-500', activeBorder: 'border-pink-500' },
  { id: 'twitter'   as AuditPlatformId, label: 'Twitter/X', Logo: TwitterXLogo,  iconColor: 'text-zinc-700 dark:text-zinc-300', ringColor: 'ring-zinc-500', activeBg: 'bg-zinc-800', activeBorder: 'border-zinc-700' },
  { id: 'linkedin'  as AuditPlatformId, label: 'LinkedIn',  Logo: LinkedInLogo,  iconColor: 'text-blue-600', ringColor: 'ring-blue-400', activeBg: 'bg-blue-600', activeBorder: 'border-blue-600' },
  { id: 'tiktok'    as AuditPlatformId, label: 'TikTok',    Logo: TikTokLogo,    iconColor: 'text-zinc-800 dark:text-zinc-200', ringColor: 'ring-zinc-600', activeBg: 'bg-zinc-900', activeBorder: 'border-zinc-800' },
]

function seed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}
function pick<T>(arr: T[], s: number, offset = 0): T { return arr[(s + offset) % arr.length] }
function inRange(s: number, lo: number, hi: number): number { return lo + (s % (hi - lo + 1)) }

function generateAuditReport(handle: string, platform: AuditPlatformId): AuditReport {
  const s = seed(handle + platform)

  const strengthPool: Record<AuditPlatformId, string[]> = {
    youtube:   ['Strong long-form retention — avg. watch time above platform median', 'Consistent upload cadence builds subscriber trust', 'Thumbnail CTR in the top 30% of your niche', 'Community tab engagement shows loyal core audience', 'Effective use of chapters for SEO and navigation'],
    instagram: ['Reels reach 2–3× your follower count on average', 'Story completion rate above 60% indicates high trust', 'Carousel posts drive significant save and share actions', 'Aesthetic grid cohesion keeps profile bounce rate low', 'Strong use of keyword-rich captions boosts discoverability'],
    twitter:   ['Thread format drives disproportionate impressions per post', 'Reply engagement rate above average for your follower tier', 'Pinned tweet acts as an effective evergreen funnel entry', 'Consistent voice and niche positioning', 'Quoting and reposting drives follower growth spikes'],
    linkedin:  ['Document posts outperform text-only by 3× in your niche', 'Personal stories generate highest comment volume', 'Posting frequency keeps you in the LinkedIn algorithm loop', 'Strong network of first-degree connections in target ICP', 'Headline clearly communicates your value proposition'],
    tiktok:    ['High average video completion rate (above 70%)', 'Trending audio use boosts For You page distribution', 'Strong hook in first 2 seconds keeps scroll-stoppers watching', 'Comments section engagement signals strong community', 'Series-style content drives profile visits and follows'],
  }
  const gapPool: Record<AuditPlatformId, string[]> = {
    youtube:   ['No consistent CTA to email list or community — leaving leads on the table', 'Missing keyword-optimized descriptions limiting search traffic', 'Shorts strategy is inconsistent — not capitalizing on recommendation algorithm', 'No collaboration or cross-promotion with adjacent creators', 'Playlists underutilized — hurting session duration and suggested video exposure'],
    instagram: ['Bio link isn\'t directing to a high-converting page', 'No consistent Reels series — missing repeat-viewer loops', 'Hashtag strategy looks scattered — needs a core 10–15 niche set', 'Not cross-promoting stories content to capture different audience segments', 'No lead magnet or freebie offer visible in bio or pinned post'],
    twitter:   ['No email capture or newsletter mentioned in profile or threads', 'Tweet frequency drops sharply on weekends — missing engagement windows', 'Missing multimedia (images/video) in most posts — limiting reach', 'No clear offer or product mention — audience doesn\'t know what you sell', 'Engagement in other creators\' comments is near zero — a major growth lever untapped'],
    linkedin:  ['Profile "About" section reads like a résumé, not a client-attraction page', 'No featured section showcasing key work, results, or social proof', 'Missing consistent content series — no reason for followers to return', 'Comments on other posts are mostly one-liners — not driving profile visits', 'No newsletter to own your LinkedIn audience off-platform'],
    tiktok:    ['Bio has no clear CTA or link to a funnel', 'No duet or stitch strategy to tap into existing viral content', 'Hashtag mix too broad — algorithm can\'t categorize your content clearly', 'Missing consistent series or recurring format to drive follows', 'Not repurposing TikTok content to Instagram Reels or YouTube Shorts'],
  }
  const actionPool: Record<AuditPlatformId, Array<{ priority: 'high' | 'medium' | 'low'; text: string }>> = {
    youtube:   [
      { priority: 'high',   text: 'Add an email opt-in CTA in every video description and at the 30% mark of each video' },
      { priority: 'high',   text: 'Publish 2 Shorts per week repurposed from long-form highlights to boost algorithm reach' },
      { priority: 'medium', text: 'Rewrite all video descriptions with keyword-rich paragraphs (min 200 words each)' },
      { priority: 'medium', text: 'Organize existing videos into 3–5 playlist series to increase session duration' },
      { priority: 'low',    text: 'Reach out to 2 adjacent creators per month for collab or cross-promo' },
    ],
    instagram: [
      { priority: 'high',   text: 'Update bio link to a simple landing page with one clear CTA (email opt-in or offer)' },
      { priority: 'high',   text: 'Commit to 3 Reels per week with a consistent hook-format-CTA structure' },
      { priority: 'medium', text: 'Build a targeted 15-hashtag set split across niche, mid, and broad for each post type' },
      { priority: 'medium', text: 'Create a pinned Reel or carousel that introduces you and your value proposition' },
      { priority: 'low',    text: 'Batch-create 2 weeks of Story content to maintain daily presence without burnout' },
    ],
    twitter:   [
      { priority: 'high',   text: 'Add a link to an email newsletter or lead magnet in your pinned tweet and bio' },
      { priority: 'high',   text: 'Engage with 5 accounts in your niche daily by leaving thoughtful, visible replies' },
      { priority: 'medium', text: 'Post one thread per week with a strong hook, value body, and clear CTA at the end' },
      { priority: 'medium', text: 'Add one image or video to every other tweet to boost impressions by 40–60%' },
      { priority: 'low',    text: 'Maintain a tweet bank of evergreen content to post on weekends when engagement drops' },
    ],
    linkedin:  [
      { priority: 'high',   text: 'Rewrite your About section as a client-facing "here\'s who I help and how" narrative' },
      { priority: 'high',   text: 'Add 3 Featured items: your best-performing post, a lead magnet, and a case study' },
      { priority: 'medium', text: 'Start a LinkedIn Newsletter to own your audience outside the algorithm' },
      { priority: 'medium', text: 'Leave 3 detailed comments per day on posts from ideal clients or industry voices' },
      { priority: 'low',    text: 'Run a 30-day daily posting challenge to re-enter the LinkedIn algorithm loop' },
    ],
    tiktok:    [
      { priority: 'high',   text: 'Add a clear CTA in your bio: one sentence + link to a free resource or offer' },
      { priority: 'high',   text: 'Establish one recurring series format (e.g. "Tuesday Tips") to drive repeat follows' },
      { priority: 'medium', text: 'Narrow to 3–5 niche-specific hashtags per post + 1 trending hashtag' },
      { priority: 'medium', text: 'Repurpose top-performing TikToks as Instagram Reels and YouTube Shorts the same day' },
      { priority: 'low',    text: 'Try 3 duet or stitch collaborations with creators in your niche to tap their audiences' },
    ],
  }
  const pillarPool: Record<AuditPlatformId, ContentPillar[]> = {
    youtube: [
      { label: 'Educational Deep Dives',  color: PILLAR_COLORS[0] },
      { label: 'Behind the Scenes',       color: PILLAR_COLORS[1] },
      { label: 'Case Studies & Results',  color: PILLAR_COLORS[2] },
      { label: 'Q&A & Community',         color: PILLAR_COLORS[3] },
    ],
    instagram: [
      { label: 'Value Carousels',         color: PILLAR_COLORS[0] },
      { label: 'Personal Story Reels',    color: PILLAR_COLORS[1] },
      { label: 'Social Proof',            color: PILLAR_COLORS[2] },
      { label: 'Trending Audio Content',  color: PILLAR_COLORS[3] },
    ],
    twitter: [
      { label: 'Insight Threads',         color: PILLAR_COLORS[0] },
      { label: 'Contrarian Takes',        color: PILLAR_COLORS[1] },
      { label: 'Lessons Learned',         color: PILLAR_COLORS[2] },
      { label: 'Real-time Commentary',    color: PILLAR_COLORS[3] },
    ],
    linkedin: [
      { label: 'Client Wins & Results',   color: PILLAR_COLORS[0] },
      { label: 'Industry Insights',       color: PILLAR_COLORS[1] },
      { label: 'Personal Journey',        color: PILLAR_COLORS[2] },
      { label: 'Frameworks & Systems',    color: PILLAR_COLORS[3] },
    ],
    tiktok: [
      { label: 'Quick Tips & Hacks',      color: PILLAR_COLORS[0] },
      { label: 'Day-in-the-Life',         color: PILLAR_COLORS[1] },
      { label: 'Trending Formats',        color: PILLAR_COLORS[2] },
      { label: 'Transformation Stories',  color: PILLAR_COLORS[3] },
    ],
  }
  const freqPool = ['3–4× per week', '5× per week', 'Daily', '2× per week', '4–5× per week']
  const timePool = ['Tue–Thu, 9–11 AM (local time)', 'Mon/Wed/Fri, 6–8 PM (local time)', 'Daily 7–9 AM (local time)', 'Weekdays 12–2 PM (local time)', 'Tue/Thu/Sat, 7–9 PM (local time)']

  const allStrengths = strengthPool[platform]
  const allGaps      = gapPool[platform]
  const allActions   = actionPool[platform]

  const strengths = [allStrengths[s % allStrengths.length], allStrengths[(s + 2) % allStrengths.length], allStrengths[(s + 4) % allStrengths.length]]
  const contentGaps = [allGaps[s % allGaps.length], allGaps[(s + 1) % allGaps.length], allGaps[(s + 3) % allGaps.length]]
  const actionItems = allActions

  const overallScore = inRange(s, 52, 84)
  const scoreBreakdown = [
    { label: 'Content Quality',    score: inRange(seed(handle + 'cq'), 12, 25), max: 25 },
    { label: 'Posting Consistency',score: inRange(seed(handle + 'pc'), 10, 25), max: 25 },
    { label: 'Engagement Rate',    score: inRange(seed(handle + 'er'), 10, 25), max: 25 },
    { label: 'Growth Momentum',    score: inRange(seed(handle + 'gm'),  8, 25), max: 25 },
  ]

  const healthStatuses: Array<'good' | 'warn' | 'bad'> = ['good', 'warn', 'bad']
  const audienceHealth: AuditReport['audienceHealth'] = [
    { label: 'Follower-to-Engagement Ratio', value: `${(inRange(seed(handle + 'fe'), 18, 72) / 10).toFixed(1)}%`, status: pick(healthStatuses, s, 0) },
    { label: 'Bot / Inactive Follower Est.', value: `~${inRange(seed(handle + 'bf'), 8, 22)}%`,                   status: pick(healthStatuses, s, 1) },
    { label: 'Audience Growth (Last 30d)',   value: `+${inRange(seed(handle + 'ag'), 1, 14)}%`,                    status: pick(healthStatuses, s, 2) },
  ]

  const engagement: AuditReport['engagement'] = [
    { metric: 'Avg. Engagement Rate', value: `${(inRange(seed(handle + 'ae'), 15, 68) / 10).toFixed(1)}%`, benchmark: '3.5%', delta: inRange(seed(handle + 'd1'), -20, 40) },
    { metric: 'Avg. Comments / Post', value: String(inRange(seed(handle + 'cp'), 4, 120)),                 benchmark: '18',   delta: inRange(seed(handle + 'd2'), -30, 60) },
    { metric: 'Avg. Shares / Post',   value: String(inRange(seed(handle + 'sp'), 2, 80)),                  benchmark: '12',   delta: inRange(seed(handle + 'd3'), -15, 55) },
  ]

  const growthOpportunities = [
    `Collaborating with 2–3 accounts of similar size in adjacent niches could accelerate growth by ${inRange(seed(handle + 'go1'), 15, 45)}% in 90 days`,
    `Your top ${inRange(seed(handle + 'go2'), 10, 30)}% performing content format should be doubled down on — it drives 60%+ of your total reach`,
    `An email list or community would convert your top ${inRange(seed(handle + 'go3'), 3, 10)}% of engaged followers into a monetizable asset`,
    `Repurposing existing content to ${platform === 'youtube' ? 'Instagram Reels and TikTok' : platform === 'tiktok' ? 'YouTube Shorts and Instagram Reels' : 'a complementary platform'} could add 20–40% reach with no new content creation`,
  ]

  return {
    handle,
    platform,
    overallScore,
    scoreBreakdown,
    strengths,
    contentGaps,
    audienceHealth,
    engagement,
    growthOpportunities,
    actionItems,
    contentPillars: pillarPool[platform],
    postingFrequency: pick(freqPool, s),
    bestPostingTime: pick(timePool, s, 1),
  }
}

/* ─── Audit result UI ────────────────────────────────────────────────────── */
function ScoreArc({ score }: { score: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="rotate-[-90deg]">
      <circle cx="48" cy="48" r={r} fill="none" strokeWidth="8" className="stroke-zinc-100 dark:stroke-zinc-800" />
      <circle cx="48" cy="48" r={r} fill="none" strokeWidth="8"
        stroke={color} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`} />
    </svg>
  )
}

function AuditResult({ report: r, platform }: { report: AuditReport; platform: typeof AUDIT_PLATFORMS[number] }) {
  const scoreColor = r.overallScore >= 70 ? 'text-emerald-500' : r.overallScore >= 50 ? 'text-amber-500' : 'text-red-500'
  const scoreLabel = r.overallScore >= 70 ? 'Healthy' : r.overallScore >= 50 ? 'Needs Work' : 'At Risk'

  return (
    <div className="flex flex-col gap-4">

      {/* Score + Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-1 flex flex-col items-center justify-center p-6 gap-2">
          <div className="relative">
            <ScoreArc score={r.overallScore} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-[22px] font-bold leading-none', scoreColor)}>{r.overallScore}</span>
              <span className="text-[10px] text-zinc-400 mt-0.5">/ 100</span>
            </div>
          </div>
          <p className={cn('text-[13px] font-semibold', scoreColor)}>{scoreLabel}</p>
          <p className="text-[11px] text-zinc-400 text-center">Overall Social Health Score</p>
        </Card>

        <Card className="col-span-2 flex flex-col">
          <SectionHeader icon={Activity} iconBg="bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400" title="Score Breakdown" />
          <div className="p-5 grid grid-cols-2 gap-3">
            {r.scoreBreakdown.map(s => {
              const pct = (s.score / s.max) * 100
              const bar = pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
              return (
                <div key={s.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] text-zinc-600 dark:text-zinc-400">{s.label}</span>
                    <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{s.score}<span className="text-zinc-400 font-normal">/{s.max}</span></span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', bar)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Strengths + Gaps */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <SectionHeader icon={CheckCircle2} iconBg="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" title="What's Working" />
          <ul className="p-5 flex flex-col gap-3">
            {r.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug">{s}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionHeader icon={XCircle} iconBg="bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" title="Content Gaps" />
          <ul className="p-5 flex flex-col gap-3">
            {r.contentGaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug">{g}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Audience Health + Engagement */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="col-span-2 flex flex-col">
          <SectionHeader icon={Users} iconBg="bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" title="Audience Health" />
          <div className="p-5 flex flex-col gap-3">
            {r.audienceHealth.map((h, i) => {
              const icon = h.status === 'good'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={2} />
                : h.status === 'warn'
                  ? <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" strokeWidth={2} />
                  : <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" strokeWidth={2} />
              return (
                <div key={i} className="flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2.5">
                  <span className="text-[12px] text-zinc-600 dark:text-zinc-400">{h.label}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{h.value}</span>
                    {icon}
                  </div>
                </div>
              )
            })}
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2.5">
              <span className="text-[12px] text-zinc-600 dark:text-zinc-400">Ideal Posting Frequency</span>
              <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 ml-auto">{r.postingFrequency}</span>
            </div>
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2.5">
              <span className="text-[12px] text-zinc-600 dark:text-zinc-400">Best Time to Post</span>
              <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 ml-auto">{r.bestPostingTime}</span>
            </div>
          </div>
        </Card>

        <Card className="col-span-3 flex flex-col">
          <SectionHeader icon={BarChart2} iconBg="bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" title="Engagement Analysis" />
          <div className="p-5 flex flex-col gap-3">
            {r.engagement.map((e, i) => {
              const above = e.delta >= 0
              return (
                <div key={i} className="flex items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-4 py-3">
                  <span className="text-[12px] text-zinc-600 dark:text-zinc-400">{e.metric}</span>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Your avg.</p>
                      <p className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200">{e.value}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Benchmark</p>
                      <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{e.benchmark}</p>
                    </div>
                    <span className={cn('text-[11px] font-bold rounded-full px-2 py-0.5', above ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-500')}>
                      {above ? '+' : ''}{e.delta}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Growth Opportunities + Action Items */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <SectionHeader icon={TrendingUp} iconBg="bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400" title="Growth Opportunities" />
          <ul className="p-5 flex flex-col gap-3">
            {r.growthOpportunities.map((o, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <ArrowRight className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug">{o}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionHeader icon={CheckSquare} iconBg="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" title="Action Items" />
          <ul className="p-5 flex flex-col gap-2.5">
            {r.actionItems.map((a, i) => {
              const badge = a.priority === 'high'
                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                : a.priority === 'medium'
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              return (
                <li key={i} className="flex items-start gap-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2.5">
                  <span className={cn('text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 flex-shrink-0 mt-0.5', badge)}>{a.priority}</span>
                  <p className="text-[12px] text-zinc-700 dark:text-zinc-300 leading-snug">{a.text}</p>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      {/* Content Pillars */}
      <Card>
        <SectionHeader icon={Hash} iconBg="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" title="Recommended Content Pillars" />
        <div className="p-5 flex flex-wrap gap-2">
          {r.contentPillars.map((cp, i) => (
            <span key={i} className={cn('text-[12px] font-medium rounded-lg px-3 py-2', cp.color)}>{cp.label}</span>
          ))}
        </div>
      </Card>

    </div>
  )
}

/* ─── Audit tab ──────────────────────────────────────────────────────────── */
function AuditTab({ credits }: { credits: ReturnType<typeof useCredits> }) {
  const [chosenPlatform, setChosenPlatform] = useState<AuditPlatformId | null>(null)
  const [handle, setHandle] = useState('')
  const [report, setReport] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(false)

  const platformObj = AUDIT_PLATFORMS.find(p => p.id === chosenPlatform)

  function runAudit() {
    const h = handle.trim().replace(/^@/, '')
    if (!h || !chosenPlatform) return
    setLoading(true)
    setReport(null)
    setTimeout(() => {
      setReport(generateAuditReport(h, chosenPlatform))
      credits.spend()
      setLoading(false)
    }, 1800)
  }

  function reset() {
    setReport(null)
    setHandle('')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
          <Activity className="w-6 h-6 text-zinc-400 animate-pulse" strokeWidth={1.5} />
        </div>
        <h2 className="text-[16px] font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">Auditing @{handle.replace(/^@/, '')}</h2>
        <p className="text-[13px] text-zinc-400 max-w-sm">Analysing content gaps, engagement, audience health, and growth opportunities…</p>
        <div className="flex items-center gap-1.5 mt-5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
      </div>
    )
  }

  if (report && platformObj) {
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white', platformObj.activeBg)}>
              <platformObj.Logo className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">@{report.handle}</p>
              <p className="text-[12px] text-zinc-400">{platformObj.label} · Social Audit Report</p>
            </div>
          </div>
          <button onClick={reset}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] font-medium text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> New Audit
          </button>
        </div>
        <AuditResult report={report} platform={platformObj} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Platform picker */}
      <div>
        <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mb-3">Pick a platform to audit</p>
        <div className="grid grid-cols-5 gap-3">
          {AUDIT_PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => { setChosenPlatform(p.id); setReport(null) }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border py-4 px-2 transition-all',
                chosenPlatform === p.id
                  ? cn('border-2', p.activeBorder, 'bg-white dark:bg-zinc-900')
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600'
              )}
            >
              <p.Logo className={cn('w-6 h-6', chosenPlatform === p.id ? p.iconColor : 'text-zinc-400 dark:text-zinc-500')} />
              <span className={cn('text-[12px] font-medium', chosenPlatform === p.id ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500')}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Handle input */}
      {chosenPlatform && (
        <div>
          <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mb-3">Your {platformObj?.label} handle</p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-zinc-400 pointer-events-none select-none">@</span>
              <input
                value={handle}
                onChange={e => setHandle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runAudit() }}
                placeholder="yourhandle"
                className="w-full h-11 pl-8 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[14px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200/50 dark:focus:ring-zinc-700/50 transition-all"
              />
            </div>
            <button
              onClick={runAudit}
              disabled={!handle.trim() || credits.exhausted}
              className={cn(
                'h-11 px-5 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2',
                handle.trim() && !credits.exhausted
                  ? 'brand-btn text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              )}
            >
              Run Audit <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
          {credits.exhausted && (
            <p className="text-[12px] text-red-500 mt-2">Monthly credits exhausted. <a href="/settings" className="underline">Upgrade to continue.</a></p>
          )}
          <p className="text-[11px] text-zinc-400 mt-2">1 credit per audit · {credits.total - credits.used} remaining this month</p>
        </div>
      )}
    </div>
  )
}

/* ─── Search helper ─────────────────────────────────────────────────────── */
function findProfile(query: string, platform: string): Profile | null {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return null
  return PROFILES.find(p => {
    const matchQ = p.name.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q) || p.tags.some(t => t.includes(q))
    const matchP = platform === 'all' || p.platforms.some(pl =>
      pl.platform.toLowerCase().replace(/[\s/]/g, '').includes(platform.replace(/[\s/]/g, ''))
    )
    return matchQ && matchP
  }) ?? null
}

function hueOf(name: string) { return (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360 }

/* ─── Shared card shell ─────────────────────────────────────────────────── */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden', className)}>
      {children}
    </div>
  )
}

function SectionHeader({ icon: Icon, iconBg, title }: { icon: React.FC<{ className?: string; strokeWidth?: number }>; iconBg: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
      <span className={cn('w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
      </span>
      <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
    </div>
  )
}

/* ─── Loading / error states ────────────────────────────────────────────── */
function LoadingState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
        <Search className="w-6 h-6 text-zinc-400 animate-pulse" strokeWidth={1.5} />
      </div>
      <h2 className="text-[16px] font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">
        Researching &ldquo;{query}&rdquo;
      </h2>
      <p className="text-[13px] text-zinc-400 max-w-sm">
        Generating full breakdown — ICP, funnel, offers, positioning, hooks…
      </p>
      <div className="flex items-center gap-1.5 mt-5">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600"
            style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

function ApiKeyError() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center mb-5 text-2xl">
        🔑
      </div>
      <h2 className="text-[16px] font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">API key required</h2>
      <p className="text-[13px] text-zinc-400 max-w-sm">
        Add your <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[12px] text-zinc-600 dark:text-zinc-300">ANTHROPIC_API_KEY</code> to{' '}
        <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[12px] text-zinc-600 dark:text-zinc-300">.env.local</code>{' '}
        and restart the dev server to enable live research.
      </p>
    </div>
  )
}

/* ─── Empty state ───────────────────────────────────────────────────────── */
function EmptyState({ onSelect }: { onSelect: (name: string) => void }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
        <Search className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-[16px] font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">Research any creator or brand</h2>
      <p className="text-[13px] text-zinc-400 max-w-sm mb-8">Get a full breakdown — ICP, funnel, offers, positioning, hooks, and distribution channels.</p>
      <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl">
        {PROFILES.map(p => {
          const hue = hueOf(p.name)
          return (
            <button
              key={p.name}
              onClick={() => onSelect(p.name)}
              className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl px-4 py-3 transition-all text-left group"
            >
              <ProfileAvatar url={p.avatarUrl} fallback={p.avatar} hue={hue} size="sm" />
              <div>
                <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{p.name}</p>
                <p className="text-[11px] text-zinc-400">{p.niche.split(' & ')[0]} · {p.primaryPlatform}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 ml-auto" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
        <Search className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
      </div>
      <p className="text-[15px] font-medium text-zinc-800 dark:text-zinc-200 mb-1">No results for &ldquo;{query}&rdquo;</p>
      <p className="text-[13px] text-zinc-400">Try searching Alex Hormozi, MrBeast, Dan Koe, or Gary Vaynerchuk.</p>
    </div>
  )
}

/* ─── Profile result ────────────────────────────────────────────────────── */
function ProfileResult({ profile: p, activePlatform }: { profile: Profile; activePlatform: string }) {
  const hue = hueOf(p.name)
  const shownPlatforms = activePlatform === 'all'
    ? p.platforms
    : p.platforms.filter(pl => pl.platform.toLowerCase().replace(/[\s/]/g, '').includes(activePlatform.replace(/[\s/]/g, '')))

  return (
    <div className="flex flex-col gap-4">

      {/* Hero */}
      <Card>
        <div className="px-6 py-5 flex items-start gap-5">
          <ProfileAvatar url={p.avatarUrl} fallback={p.avatar} hue={hue} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-[20px] font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">{p.name}</h2>
                <p className="text-[13px] text-zinc-400 mt-0.5">{p.handle} · {p.niche}</p>
                <p className="text-[13px] text-zinc-600 dark:text-zinc-400 mt-2 max-w-lg italic">&ldquo;{p.tagline}&rdquo;</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {p.platforms.map(pl => (
                  <span key={pl.platform} className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full px-2.5 py-1">
                    <pl.Logo className="w-3 h-3" />
                    {pl.followers}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex divide-x divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
          {[
            { icon: Calendar,   label: 'Started',         value: p.started         },
            { icon: TrendingUp, label: 'Est. Revenue',    value: p.estRevenue      },
            { icon: Users,      label: 'Primary Channel', value: p.primaryPlatform },
            { icon: Target,     label: 'Market',          value: p.market          },
          ].map(s => (
            <div key={s.label} className="flex-1 px-5 py-3.5 flex items-center gap-3">
              <s.icon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">{s.label}</p>
                <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-4">

        {/* ICP */}
        <Card className="col-span-2 flex flex-col">
          <SectionHeader icon={Users} iconBg="bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" title="Ideal Customer Profile" />
          <div className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[{ label: 'Age Range', value: p.icp.ageRange }, { label: 'Income Level', value: p.icp.incomeLevel }].map(f => (
                <div key={f.label} className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{f.label}</p>
                  <p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 mt-1">{f.value}</p>
                </div>
              ))}
              <div className="col-span-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Awareness Stage</p>
                <p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 mt-1">{p.icp.awareness}</p>
              </div>
            </div>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{p.icp.demographics}</p>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Pain Points</p>
              <ul className="flex flex-col gap-1.5">
                {p.icp.painPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />{pt}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Desires</p>
              <ul className="flex flex-col gap-1.5">
                {p.icp.desires.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />{d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Funnel */}
        <Card className="col-span-3 flex flex-col">
          <SectionHeader icon={Layers} iconBg="bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400" title="Funnel Breakdown" />
          <div className="p-5 flex flex-col gap-3">
            {p.funnel.map((stage, i) => (
              <div key={i} className={cn('rounded-xl p-4', stage.bg)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('text-[10px] font-bold tracking-widest', stage.text)}>{stage.tag}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{stage.label}</span>
                </div>
                <p className="text-[12px] text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">{stage.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {stage.tactics.map((t, j) => (
                    <span key={j} className="inline-flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/60 rounded-full px-2.5 py-0.5 border border-white/60 dark:border-zinc-700/60">
                      <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" strokeWidth={2.5} />{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Positioning */}
        <Card className="col-span-2 flex flex-col">
          <SectionHeader icon={Megaphone} iconBg="bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400" title="Brand Positioning" />
          <div className="p-5 flex flex-col gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg p-3.5">
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-1.5">Core Message</p>
              <p className="text-[13px] text-zinc-800 dark:text-zinc-200 font-medium leading-snug">{p.positioning.coreMessage}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg p-3.5">
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-1.5">Unique Mechanism</p>
              <p className="text-[12px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{p.positioning.uniqueMechanism}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-2">Tone & Voice</p>
              <div className="flex flex-wrap gap-1.5">
                {p.positioning.tone.map(t => (
                  <span key={t} className="text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full px-2.5 py-0.5">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-2">Key Differentiators</p>
              <ul className="flex flex-col gap-1.5">
                {p.positioning.differentiators.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
                    <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />{d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Offers */}
        <Card className="col-span-3 flex flex-col">
          <SectionHeader icon={DollarSign} iconBg="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" title="Offers & Products" />
          <div className="p-5 grid grid-cols-2 gap-3">
            {p.offers.map((offer, i) => (
              <div key={i} className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-4 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">{offer.name}</p>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-full px-2 py-0.5 flex-shrink-0">{offer.price}</span>
                </div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">{offer.format}</span>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">{offer.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTAs & Hooks */}
        <Card className="col-span-2 flex flex-col">
          <SectionHeader icon={Zap} iconBg="bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" title="CTAs & Hooks" />
          <div className="p-5 flex flex-col gap-4">
            <div>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-2.5">Calls to Action</p>
              <ul className="flex flex-col gap-2">
                {p.ctas.map((cta, i) => (
                  <li key={i} className="flex items-start gap-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2">
                    <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Megaphone className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" strokeWidth={2} />
                    </span>
                    <p className="text-[12px] text-zinc-700 dark:text-zinc-300 leading-snug">{cta}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-2.5">Proven Hooks</p>
              <ul className="flex flex-col gap-2">
                {p.hooks.map((hook, i) => (
                  <li key={i} className="flex items-start gap-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2">
                    <span className="w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-2.5 h-2.5 text-violet-500 dark:text-violet-400" strokeWidth={2} />
                    </span>
                    <p className="text-[12px] text-zinc-700 dark:text-zinc-300 leading-snug">{hook}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Distribution */}
        <Card className="col-span-2 flex flex-col">
          <SectionHeader icon={BarChart2} iconBg="bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" title="Distribution" />
          <div className="p-5 flex flex-col gap-3.5">
            {(shownPlatforms.length ? shownPlatforms : p.platforms).map(pl => (
              <div key={pl.platform}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-[12px] text-zinc-600 dark:text-zinc-400">
                    <pl.Logo className="w-3.5 h-3.5" />
                    {pl.platform}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">{pl.followers}</span>
                    <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 w-8 text-right">{pl.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', pl.bar)} style={{ width: `${pl.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Content Pillars */}
        <Card className="col-span-1 flex flex-col">
          <SectionHeader icon={Hash} iconBg="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" title="Content Pillars" />
          <div className="p-4 flex flex-col gap-2">
            {p.contentPillars.map((cp, i) => (
              <span key={i} className={cn('text-[12px] font-medium rounded-lg px-3 py-2', cp.color)}>{cp.label}</span>
            ))}
          </div>
        </Card>

      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
function ResearchPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [pageTab,  setPageTab]  = useState<'research' | 'audit'>('research')
  const [query,    setQuery]    = useState(searchParams.get('q') ?? '')
  const [platform, setPlatform] = useState('all')
  const [result,   setResult]   = useState<Profile | null>(null)
  const [searched, setSearched] = useState((searchParams.get('q') ?? '').length >= 2)
  const [loading,  setLoading]  = useState(false)
  const [needsKey, setNeedsKey] = useState(false)

  const credits = useCredits()
  const { used, total, resetDate, exhausted } = credits

  /* Sync query state when URL param changes (back / forward navigation) */
  useEffect(() => {
    const paramQ = searchParams.get('q') ?? ''
    setQuery(paramQ)
    if (paramQ.length < 2) { setSearched(false); setResult(null); setLoading(false); setNeedsKey(false) }
  }, [searchParams])

  /* Debounced search — local first, then API */
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setSearched(false); setResult(null); setLoading(false); setNeedsKey(false); return }

    setSearched(true)

    const local = findProfile(q, platform)
    if (local) { setResult(local); setLoading(false); setNeedsKey(false); return }

    if (exhausted) { setLoading(false); setResult(null); return }

    setLoading(true)
    setNeedsKey(false)
    setResult(null)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (data.error?.toLowerCase().includes('key')) setNeedsKey(true)
          setResult(null)
        } else {
          setResult(convertApiProfile(data as ApiProfile))
          credits.spend()
        }
      } catch {
        setResult(null)
      } finally {
        setLoading(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [query, platform, exhausted, credits.spend])

  /* Clicking a quick-search card pushes a new history entry so Back works */
  function handleQuickSearch(name: string) {
    router.push('/research?q=' + encodeURIComponent(name))
  }

  /* Typing uses replace so each keystroke doesn't flood history */
  function handleQueryChange(value: string) {
    setQuery(value)
    if (value.trim().length >= 2) {
      router.replace('/research?q=' + encodeURIComponent(value.trim()))
    } else {
      router.replace('/research')
    }
  }

  function handlePlatform(p: string) { setPlatform(p) }

  return (
    <div className="px-8 py-7 max-w-[1300px]">

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[18px] font-medium text-zinc-900 dark:text-zinc-50 tracking-tight">
            {pageTab === 'research' ? 'Market Research' : 'My Social Audit'}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {pageTab === 'research'
              ? 'Full breakdown of any creator, brand, or business — ICP, funnel, offers, hooks, and positioning.'
              : 'Audit your own social accounts to find gaps, opportunities, and prioritised action items.'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Tab switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
            {([
              { id: 'research', label: 'Research' },
              { id: 'audit',    label: 'My Audit'  },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setPageTab(t.id)}
                className={cn(
                  'h-7 px-4 rounded-lg text-[12px] font-medium transition-all',
                  pageTab === t.id
                    ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <CreditsBar used={used} total={total} resetDate={resetDate} />
        </div>
      </div>

      {pageTab === 'audit' ? (
        <AuditTab credits={credits} />
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-7">
            {/* Search */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" strokeWidth={1.75} />
              <input
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                disabled={exhausted}
                placeholder={exhausted ? 'Monthly credits exhausted — upgrade to continue' : 'Search any creator, brand, or business… (e.g. Alex Hormozi, MrBeast, Dan Koe)'}
                className={cn(
                  'w-full h-11 pl-11 pr-4 rounded-xl border bg-white dark:bg-zinc-900 text-[14px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none transition-all',
                  exhausted
                    ? 'border-zinc-200 dark:border-zinc-700 opacity-50 cursor-not-allowed'
                    : 'border-zinc-200 dark:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-200/50 dark:focus:ring-zinc-700/50'
                )}
              />
            </div>

            {/* Platform filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {FILTER_PLATFORMS.map(({ id, label, Logo, activeClass }) => (
                <button
                  key={id}
                  onClick={() => handlePlatform(id)}
                  className={cn(
                    'flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-medium transition-all border',
                    platform === id
                      ? activeClass
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900'
                  )}
                >
                  <Logo className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {exhausted && searched
            ? <OutOfCredits resetDate={resetDate} />
            : !searched
              ? <EmptyState onSelect={handleQuickSearch} />
              : loading
                ? <LoadingState query={query} />
                : needsKey
                  ? <ApiKeyError />
                  : result
                    ? <ProfileResult profile={result} activePlatform={platform} />
                    : <NoResults query={query} />
          }
        </>
      )}

    </div>
  )
}

export default function ResearchPage() {
  return (
    <Suspense>
      <ResearchPageInner />
    </Suspense>
  )
}
