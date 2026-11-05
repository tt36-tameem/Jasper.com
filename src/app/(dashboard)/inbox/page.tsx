'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Mail, MessageSquare, Mic, Play, Send, Wand2, X, Square, Trash2,
  Search, Phone, Info, Check, CheckCheck, MoreHorizontal,
  AtSign, MapPin, Briefcase, Star, Sparkles, RefreshCw,
  AlertCircle, CheckCircle2, BookOpen, Calendar, ChevronRight,
  FileText, Plus, Clock, Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { useBranding } from '@/components/providers/BrandingProvider'
import { useAIMode } from '@/components/providers/AIModeProvider'
import { cn } from '@/lib/utils'
import { EmailComposeModal } from '@/components/leads/email-compose-modal'

type Channel     = 'instagram' | 'sms' | 'email'
type MsgType     = 'text' | 'voice'
type RecordState = 'idle' | 'recording' | 'preview'

interface Thread  { id: number; name: string; preview: string; time: string; channel: Channel; unread: boolean; handle?: string; role?: string; location?: string }
interface Message { id: number; from: 'them' | 'me'; type: MsgType; text?: string; duration?: string; time: string; read?: boolean }

function InstagramIcon({ size = 14 }: { size?: number }) {
  return <img src="/logos/instagram.avif" alt="Instagram" style={{ width: size, height: size }} className="object-contain rounded-[3px] flex-shrink-0" />
}

function ChannelIcon({ channel, size = 12 }: { channel: Channel; size?: number }) {
  if (channel === 'instagram') return <InstagramIcon size={size} />
  if (channel === 'sms')       return <MessageSquare className="text-white flex-shrink-0" strokeWidth={2} style={{ width: size, height: size }} />
  return <Mail className="text-white flex-shrink-0" strokeWidth={2} style={{ width: size, height: size }} />
}

const CH_CFG: Record<Channel, { label: string; bg: string; dot: string; tag: string; accent: string }> = {
  instagram: { label: 'Instagram', bg: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]', dot: '#E1306C', tag: 'Instagram DM', accent: '#E1306C' },
  sms:       { label: 'SMS',       bg: 'bg-emerald-500',  dot: '#10b981', tag: 'SMS',  accent: '#10b981' },
  email:     { label: 'Email',     bg: 'bg-blue-500',     dot: '#3b82f6', tag: 'Email', accent: '#3b82f6' },
}

const THREADS: Thread[] = [
  { id: 1, name: 'Sarah Mitchell',  preview: "Hey, I saw your ad on Instagram…",           time: '2m',   channel: 'instagram', unread: true,  handle: '@sarah.m',      role: 'Marketing Manager',   location: 'New York, NY'  },
  { id: 2, name: 'Omar Al-Rashid',  preview: 'Following up on the proposal you sent…',    time: '18m',  channel: 'email',     unread: true,  handle: 'omar@acme.io',  role: 'CEO, Acme Corp',       location: 'Dubai, UAE'    },
  { id: 3, name: 'James Thornton',  preview: 'Can we schedule a call this week?',          time: '1h',   channel: 'sms',       unread: false, handle: '+1 555 0192',   role: 'Freelance Designer',   location: 'London, UK'    },
  { id: 4, name: 'Priya Nair',      preview: 'Thanks for getting back to me so quickly',   time: '3h',   channel: 'email',     unread: false, handle: 'priya@nair.co', role: 'Head of Growth',       location: 'Bangalore, IN' },
  { id: 5, name: 'Laura Chen',      preview: "The contract looks good. I'll sign today.",  time: 'Yday', channel: 'sms',       unread: false, handle: '+1 555 0381',   role: 'Founder, Studio Chen', location: 'San Francisco' },
  { id: 6, name: 'Marcus Webb',     preview: 'Do you have any case studies I can review?', time: 'Yday', channel: 'instagram', unread: false, handle: '@marcuswebb',   role: 'Product Lead',         location: 'Austin, TX'    },
  { id: 7, name: 'Fatima Al-Amin',  preview: 'Sounds great, send me the details',          time: '2d',   channel: 'email',     unread: false, handle: 'fatima@faa.ae', role: 'Operations Director',  location: 'Riyadh, SA'    },
  { id: 8, name: 'Ryan Fitzgerald', preview: 'Left you a voice note 🎙',                   time: '3d',   channel: 'instagram', unread: false, handle: '@ryanfitz',     role: 'Sales Executive',      location: 'Chicago, IL'   },
]

const INIT_MESSAGES: Message[] = [
  { id: 1, from: 'them', type: 'text',  text: "Hey, I saw your ad on Instagram and I'm really interested in learning more about what you offer.", time: '10:24 AM', read: true },
  { id: 2, from: 'me',   type: 'text',  text: "Hi Sarah! Thanks for reaching out. I'd love to chat. What's a good time for a quick call?",     time: '10:26 AM', read: true  },
  { id: 3, from: 'them', type: 'text',  text: 'Tomorrow afternoon works for me — around 3pm?',                                                   time: '10:29 AM', read: true  },
  { id: 4, from: 'me',   type: 'voice', duration: '0:12',                                                                                         time: '10:31 AM', read: true  },
  { id: 5, from: 'them', type: 'text',  text: 'Sounds perfect! Talk then 👋',                                                                     time: '10:33 AM', read: false },
]

const SMART_REPLIES: Record<number, string[]> = {
  1: ["See you tomorrow at 3! I'll send a calendar invite 📅", "Can't wait! I'll prep some case studies for you 🔥", "Perfect — talk then! Feel free to bring any questions."],
  2: ["Thanks Omar! I'll get the revised proposal to you by end of day.", "Happy to jump on a call and walk you through the updates.", "Let me know if you have any questions — available all week!"],
  3: ["Absolutely! Here's my calendar link 📅", "Works for me — I'll send you a confirmation shortly.", "Let's do it. What time zone are you in?"],
  4: ["You're so welcome! Happy to help anytime 😊", "Great, let's keep the momentum going!", "Glad we connected — excited to work together!"],
  5: ["Fantastic news! Let's get that signed today 🎉", "Amazing — I'll send the final docs now!", "Love to hear it! I'll be in touch shortly."],
  6: ["Of course! Sending our best ones over now 📎", "I'll drop a few relevant ones in your inbox today.", "Sure thing — what industry are you most interested in?"],
  7: ["Great! Sending everything over now 🚀", "On it — you'll have all the details within the hour.", "Perfect — I'll package everything up for you now!"],
  8: ["Just listened — great question! Here's my take:", "Thanks for the voice note! Let me reply the same way 🎙", "Got it! Give me a sec to put together a proper answer."],
}

interface ScriptInsight { type: 'good' | 'warn'; text: string }
const THREAD_SCRIPTS: Record<number, { score: number; insights: ScriptInsight[] }> = {
  1: { score: 89, insights: [{ type: 'good', text: 'Tone is warm and conversational' }, { type: 'warn', text: 'Strengthen your call-to-action' }] },
  2: { score: 72, insights: [{ type: 'warn', text: 'Opening feels too formal' }, { type: 'warn', text: 'Missing a clear next step' }] },
  3: { score: 84, insights: [{ type: 'good', text: 'Direct and respectful of their time' }, { type: 'warn', text: 'Add a quick value hook upfront' }] },
  4: { score: 91, insights: [{ type: 'good', text: 'Personalization is on point' }, { type: 'good', text: 'Tone matches the channel perfectly' }] },
  5: { score: 77, insights: [{ type: 'good', text: 'Closing energy is confident' }, { type: 'warn', text: 'Acknowledge their decision more warmly' }] },
  6: { score: 68, insights: [{ type: 'warn', text: 'No personalization to their profile' }, { type: 'warn', text: 'Missing social proof' }] },
  7: { score: 82, insights: [{ type: 'good', text: 'Follow-through is fast and reliable' }, { type: 'warn', text: 'Add one specific company detail' }] },
  8: { score: 79, insights: [{ type: 'good', text: 'Voice note builds rapport' }, { type: 'warn', text: 'Follow up with a text summary' }] },
}

const DEFAULT_SCRIPT  = `Hey {name}! 👋 I noticed you reached out — really appreciate it.\n\nWe help {role}s like you get [specific outcome] in 90 days or less.\n\nWould you be open to a quick 15-min call this week?`
const OPTIMIZED_SCRIPT = `Hey {name}! 👋 Loved seeing your message — great timing.\n\nWe've helped {role}s achieve [outcome] typically within 60–90 days.\n\nI only have a couple of spots open this week. Would a 15-min call work? 🚀`

const SCRIPT_LIBRARY = [
  { name: 'Warm DM',       tag: 'Engaged leads',    score: 92, text: `Hey {name}! 👋 Noticed you've been engaging with our content — love that!\n\nOpen to a quick 15-min call this week?` },
  { name: 'Cold Outreach', tag: 'No prior contact',  score: 78, text: `Hi {name}, came across {company} and was genuinely impressed.\n\nWould it make sense to connect for 10 minutes?` },
  { name: 'Follow-up',     tag: 'No reply yet',      score: 85, text: `Hey {name}! Just bumping this up in case it got buried 😊\n\nEven 10 minutes would be worth it. What does your week look like?` },
  { name: 'Re-engage',     tag: '30+ days cold',     score: 71, text: `Hey {name}! It's been a while — hope things are going well 🙌\n\nWanted to reconnect — worth a quick catch-up?` },
]

function fmt(secs: number) { return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` }

function Waveform({ light = false, animate = false }: { light?: boolean; animate?: boolean }) {
  const bars = [3, 7, 11, 9, 13, 9, 7, 11, 8, 5, 8, 11, 7, 4, 9, 6, 11, 8, 5, 10]
  return (
    <svg width="80" height="16" viewBox="0 0 80 16" fill="none" aria-hidden>
      {bars.map((h, i) => (
        <rect key={i} x={i * 4} y={(16 - h) / 2} width="2.5" height={h} rx="1.25"
          fill={light ? 'rgba(255,255,255,0.7)' : 'currentColor'}
          style={animate ? { animation: `waveBar 0.8s ease-in-out ${i * 0.04}s infinite alternate` } : undefined} />
      ))}
    </svg>
  )
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('')
  const hue = (name.charCodeAt(0) * 37 + (name.charCodeAt(1) || 0) * 17) % 360
  return (
    <span className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white select-none"
      style={{ width: size, height: size, fontSize: size * 0.32, background: `hsl(${hue} 55% 52%)` }}>
      {initials}
    </span>
  )
}

export default function InboxPage() {
  const { branding } = useBranding()
  const { enabled }  = useAIMode()

  const [channelFilter,  setChannelFilter]  = useState<Channel | 'all'>('all')
  const [activeThread,   setActiveThread]   = useState<Thread>(THREADS[0])
  const [threadMessages, setThreadMessages] = useState<Record<number, Message[]>>({ [THREADS[0].id]: INIT_MESSAGES })
  const [input,          setInput]          = useState('')
  const [aiVoice,       setAiVoice]       = useState(false)
  const [showInfo,      setShowInfo]      = useState(true)
  const [showScript,    setShowScript]    = useState(false)
  const [search,        setSearch]        = useState('')
  const [recState,      setRecState]      = useState<RecordState>('idle')
  const [recSecs,       setRecSecs]       = useState(0)
  const [optimizing,    setOptimizing]    = useState(false)
  const [optimized,     setOptimized]     = useState(false)
  const [scriptText,    setScriptText]    = useState(DEFAULT_SCRIPT)
  const [activeLib,     setActiveLib]     = useState<number | null>(null)
  const [aiReplies,     setAiReplies]     = useState<string[]>([])
  const [loadingReplies,setLoadingReplies]= useState(false)
  const [composeEmail,  setComposeEmail]  = useState(false)
  const [threadNotes,   setThreadNotes]   = useState<Record<number, { id: number; text: string; time: string }[]>>({})
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteText,      setNoteText]      = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editNoteText,  setEditNoteText]  = useState('')

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Per-thread messages — falls back to empty array for threads with no history yet
  const messages = threadMessages[activeThread.id] ?? []

  function setMessages(updater: (prev: Message[]) => Message[]) {
    setThreadMessages(prev => ({
      ...prev,
      [activeThread.id]: updater(prev[activeThread.id] ?? []),
    }))
  }

  function startRecording()   { setRecState('recording'); setRecSecs(0); timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000) }
  function stopRecording()    { if (timerRef.current) clearInterval(timerRef.current); setRecState('preview') }
  function discardRecording() { if (timerRef.current) clearInterval(timerRef.current); setRecState('idle'); setRecSecs(0) }
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { setOptimized(false); setScriptText(DEFAULT_SCRIPT); setActiveLib(null); setShowNoteInput(false); setNoteText(''); setEditingNoteId(null); setEditNoteText('') }, [activeThread.id])

  useEffect(() => {
    if (!enabled) { setAiReplies([]); return }
    const msgs = threadMessages[activeThread.id] ?? []
    const lastMsg = msgs[msgs.length - 1]
    if (!lastMsg || lastMsg.from !== 'them' || lastMsg.type !== 'text') return
    setLoadingReplies(true); setAiReplies([])
    fetch('/api/jacsper', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `Generate 3 short CRM reply options. Contact: ${activeThread.name}${activeThread.role ? ', ' + activeThread.role : ''}. Their message: "${lastMsg.text}". Each reply max 12 words. Output only 3 lines, no numbers or bullets.`, systemPrompt: branding.systemPrompt }),
    }).then(r => r.json()).then(d => {
      if (d.text) setAiReplies(d.text.split('\n').map((l: string) => l.trim()).filter(Boolean).slice(0, 3))
      setLoadingReplies(false)
    }).catch(() => setLoadingReplies(false))
  }, [enabled, activeThread.id]) // eslint-disable-line

  function sendMessage() {
    const text = input.trim()
    if (!text && recState !== 'preview') return
    const isVoice = recState === 'preview' || aiVoice
    setMessages(m => [...m, { id: m.length + 1, from: 'me', type: isVoice ? 'voice' : 'text', ...(isVoice ? { duration: recState === 'preview' ? fmt(recSecs) : fmt(Math.max(4, Math.floor(text.length / 6))) } : { text }), time: 'Just now', read: false }])
    setInput(''); setAiVoice(false); setRecState('idle'); setRecSecs(0)
  }

  function handleOptimize() {
    setOptimizing(true)
    setTimeout(() => { setOptimizing(false); setOptimized(true); setScriptText(OPTIMIZED_SCRIPT) }, 2000)
  }

  const filtered      = THREADS.filter(t => (channelFilter === 'all' || t.channel === channelFilter) && (search === '' || t.name.toLowerCase().includes(search.toLowerCase())))
  const activeCfg     = CH_CFG[activeThread.channel]
  const canSend       = recState === 'preview' || input.trim().length > 0
  const unreadCnt     = THREADS.filter(t => t.unread).length
  const lastMsg       = messages[messages.length - 1]
  const showReplies   = lastMsg?.from === 'them' && lastMsg?.type === 'text' && recState === 'idle'
  const staticReplies = SMART_REPLIES[activeThread.id] ?? ["Thanks for the message!", "Let me get back to you on that.", "Happy to help — what do you need?"]
  const smartReplies  = (enabled && aiReplies.length > 0) ? aiReplies : staticReplies
  const threadScript  = THREAD_SCRIPTS[activeThread.id] ?? { score: 80, insights: [{ type: 'good' as const, text: 'Solid approach overall' }] }
  const scoreColor    = threadScript.score >= 85 ? '#10b981' : threadScript.score >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <div className="px-6 py-6 max-w-[1400px] flex flex-col h-full">
      {composeEmail && (
        <EmailComposeModal
          to={activeThread.handle?.includes('@') ? activeThread.handle : `${activeThread.name.toLowerCase().replace(/\s+/g, '.')}@example.com`}
          toName={activeThread.name}
          onClose={() => setComposeEmail(false)}
        />
      )}
      <style>{`
        @keyframes waveBar    { from { transform: scaleY(0.4); } to { transform: scaleY(1.2); } }
        @keyframes pulse-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); } }
        .no-ring:focus { outline: none !important; box-shadow: none !important; }
      `}</style>

      <PageHeader title="Inbox" count={unreadCnt} description="Instagram DMs, SMS, and email — all in one place." />

      <div className="flex gap-3 flex-1 min-h-0" style={{ height: 'calc(100vh - 152px)' }}>

        {/* ─── Thread list ─────────────────────────────────────────────────── */}
        <div className="w-[296px] flex-shrink-0 flex flex-col overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
          style={{ background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)' }}>

          {/* Search */}
          <div className="px-3 pt-3.5 pb-2">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/50 rounded-xl px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all focus-within:shadow-[0_1px_6px_rgba(0,0,0,0.1)] focus-within:border-zinc-300">
              <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="flex-1 bg-transparent text-[12.5px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none no-ring" />
            </div>
          </div>

          {/* Channel pills */}
          <div className="px-3 pb-3 flex items-center gap-1.5">
            {(['all', 'instagram', 'sms', 'email'] as const).map(id => {
              const active = channelFilter === id
              return (
                <button key={id} onClick={() => setChannelFilter(id)}
                  className={cn(
                    'flex items-center gap-1 h-6 px-2.5 rounded-full text-[10.5px] font-semibold border transition-all',
                    active
                      ? id === 'all'
                        ? 'text-white border-transparent shadow-sm'
                        : id === 'instagram'
                          ? 'border-transparent text-white bg-gradient-to-r from-[#833AB4] to-[#FD1D1D] shadow-sm'
                          : id === 'sms' ? 'bg-emerald-500 text-white border-transparent shadow-sm' : 'bg-blue-500 text-white border-transparent shadow-sm'
                      : 'border-zinc-200 text-zinc-400 bg-white hover:text-zinc-600 hover:border-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  )}
                  style={active && id === 'all' ? { background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`, borderColor: 'transparent' } : {}}>
                  {id === 'all' ? 'All' : id === 'instagram' ? <><InstagramIcon size={10} /> IG</> : id === 'sms' ? 'SMS' : 'Email'}
                </button>
              )
            })}
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto px-2.5 pb-2.5 space-y-1.5">
            {filtered.length === 0
              ? <div className="flex items-center justify-center h-20 text-[12px] text-zinc-400">No conversations</div>
              : filtered.map(t => {
                  const isActive = activeThread.id === t.id
                  return (
                    <button key={t.id} onClick={() => setActiveThread(t)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all duration-150 text-left',
                        isActive
                          ? 'bg-zinc-900 border-zinc-900 shadow-[0_6px_24px_rgba(0,0,0,0.18)]'
                          : 'bg-white border-zinc-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_3px_12px_rgba(0,0,0,0.10)] hover:border-zinc-200 hover:-translate-y-px'
                      )}>

                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar name={t.name} size={40} />
                        <span className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-sm',
                          isActive ? 'border-2 border-zinc-900' : 'border-2 border-white',
                          CH_CFG[t.channel].bg
                        )}>
                          <ChannelIcon channel={t.channel} size={8} />
                        </span>
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-[3px]">
                          <p className={cn(
                            'text-[13px] truncate leading-tight',
                            isActive
                              ? 'font-semibold text-white'
                              : t.unread ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-400'
                          )}>
                            {t.name}
                          </p>
                          <span className={cn('text-[10px] flex-shrink-0 tabular-nums font-medium', isActive ? 'text-zinc-400' : 'text-zinc-400')}>{t.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={cn('text-[11.5px] truncate leading-snug flex-1 min-w-0',
                            isActive ? 'text-zinc-400' : t.unread ? 'text-zinc-500' : 'text-zinc-400')}>
                            {t.preview}
                          </p>
                          {t.unread && !isActive && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-zinc-900" />
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
            }
          </div>
        </div>

        {/* ─── Chat pane ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm min-w-0">

          {/* Header */}
          <div className="flex items-center gap-3.5 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm">
            <div className="relative flex-shrink-0">
              <Avatar name={activeThread.name} size={40} />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-zinc-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-50 leading-tight truncate">{activeThread.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('flex items-center justify-center rounded-[3px]', activeCfg.bg)} style={{ width: 13, height: 13 }}>
                  <ChannelIcon channel={activeThread.channel} size={8} />
                </span>
                <span className="text-[11px] text-zinc-400">{activeCfg.tag}</span>
                {activeThread.role && <><span className="text-zinc-300 dark:text-zinc-700">·</span><span className="text-[11px] text-zinc-400 truncate">{activeThread.role}</span></>}
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                <Phone className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button
                onClick={() => setComposeEmail(true)}
                title="Compose email"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                <Mail className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button onClick={() => { setShowScript(v => !v); setShowInfo(false) }}
                className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all', showScript ? 'text-white' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800')}
                style={showScript ? { background: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)' } : {}}>
                <Sparkles className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button onClick={() => { setShowInfo(v => !v); setShowScript(false) }}
                className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all', showInfo ? 'text-white' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800')}
                style={showInfo ? { background: branding.primaryColor } : {}}>
                <Info className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-1"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,0,0,0.018) 0%, transparent 70%)' }}>

            {/* Date chip */}
            <div className="flex items-center justify-center mb-3">
              <span className="text-[11px] font-medium text-zinc-400 bg-zinc-100/80 dark:bg-zinc-800 px-3 py-1 rounded-full">
                Today
              </span>
            </div>

            {messages.map((msg, idx) => {
              const isMe          = msg.from === 'me'
              const prevSame      = idx > 0 && messages[idx - 1].from === msg.from
              const nextSame      = idx < messages.length - 1 && messages[idx + 1].from === msg.from

              return (
                <div key={msg.id} className={cn('flex items-end gap-2.5', isMe ? 'justify-end' : 'justify-start', prevSame ? 'mt-0.5' : 'mt-4')}>

                  {/* Their avatar — only on last message in group */}
                  {!isMe && (
                    <div className="flex-shrink-0 mb-0.5">
                      {!nextSame ? <Avatar name={activeThread.name} size={28} /> : <div className="w-7" />}
                    </div>
                  )}

                  <div className={cn('flex flex-col', isMe ? 'items-end' : 'items-start', 'max-w-[72%]')}>
                    {msg.type === 'voice' ? (
                      <div className={cn(
                        'flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm',
                        isMe
                          ? 'text-white rounded-br-[6px]'
                          : 'bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-bl-[6px]'
                      )}
                        style={isMe ? { background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`, boxShadow: `0 2px 12px ${branding.primaryColor}35` } : {}}>
                        <button className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                          isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                        )}>
                          <Play className={cn('w-3.5 h-3.5', isMe ? 'text-white' : 'text-zinc-600 dark:text-zinc-300')} fill="currentColor" strokeWidth={0} />
                        </button>
                        <div className="flex flex-col gap-1">
                          <Waveform light={isMe} />
                          <span className={cn('text-[10px]', isMe ? 'text-white/60' : 'text-zinc-400')}>{msg.duration} · {msg.time}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={cn(
                        'rounded-2xl px-4 py-2.5 shadow-sm',
                        isMe
                          ? 'text-white rounded-br-[6px]'
                          : 'bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/80 rounded-bl-[6px]'
                      )}
                        style={isMe ? { background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`, boxShadow: `0 2px 12px ${branding.primaryColor}35` } : { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <p className={cn('text-[13.5px] leading-relaxed', isMe ? 'text-white' : 'text-zinc-800 dark:text-zinc-200')}>{msg.text}</p>
                      </div>
                    )}
                    {/* Time + read receipt */}
                    {!nextSame && (
                      <div className={cn('flex items-center gap-1 mt-1 px-1', isMe ? 'flex-row-reverse' : '')}>
                        <span className="text-[10px] text-zinc-400">{msg.time}</span>
                        {isMe && (msg.read
                          ? <CheckCheck className="w-3 h-3 text-zinc-400" strokeWidth={2} />
                          : <Check className="w-3 h-3 text-zinc-300 dark:text-zinc-600" strokeWidth={2} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <div className="px-4 pt-3 pb-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0 flex flex-col gap-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm">

            {/* Smart replies */}
            {showReplies && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                <div className="flex items-center gap-1 flex-shrink-0 mr-1">
                  <Sparkles className="w-3 h-3 text-violet-500" strokeWidth={2} />
                  <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide whitespace-nowrap">
                    {enabled ? 'Jacsper' : 'Quick replies'}
                  </span>
                  {enabled && loadingReplies && <RefreshCw className="w-2.5 h-2.5 text-violet-400 animate-spin" strokeWidth={2} />}
                </div>
                {loadingReplies && enabled
                  ? <span className="text-[11px] text-zinc-400 italic">Generating…</span>
                  : smartReplies.map((r, i) => (
                    <button key={i} onClick={() => setInput(r)}
                      className="flex-shrink-0 text-[11.5px] text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1.5 transition-all whitespace-nowrap hover:border-zinc-300 dark:hover:border-zinc-600">
                      {r}
                    </button>
                  ))
                }
              </div>
            )}

            {/* Recording state */}
            {recState === 'recording' && (
              <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl px-4 py-3">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" style={{ animation: 'pulse-ring 1.2s ease-in-out infinite' }} />
                <span className="text-[13px] font-semibold text-red-600 dark:text-red-400 tabular-nums w-10 flex-shrink-0">{fmt(recSecs)}</span>
                <div className="flex-1 text-red-400"><Waveform animate /></div>
                <button onClick={stopRecording} className="flex items-center gap-1.5 h-7 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold flex-shrink-0">
                  <Square className="w-2.5 h-2.5" fill="currentColor" strokeWidth={0} /> Stop
                </button>
                <button onClick={discardRecording} className="w-7 h-7 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Voice preview */}
            {recState === 'preview' && (
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3">
                <button className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 hover:bg-zinc-300 dark:hover:bg-zinc-600">
                  <Play className="w-3 h-3 text-zinc-600 dark:text-zinc-300" fill="currentColor" strokeWidth={0} />
                </button>
                <div className="flex-1 text-zinc-500 dark:text-zinc-400"><Waveform /></div>
                <span className="text-[11px] text-zinc-400 tabular-nums">{fmt(recSecs)}</span>
                <button onClick={discardRecording} className="flex items-center gap-1 h-7 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-red-200 hover:text-red-500 text-[12px] font-medium transition-all">
                  <Trash2 className="w-3 h-3" strokeWidth={1.75} /> Discard
                </button>
                <button onClick={sendMessage} className="flex items-center gap-1.5 h-7 px-3 rounded-xl brand-btn text-[12px] font-semibold flex-shrink-0">
                  <Send className="w-3 h-3" strokeWidth={2} /> Send
                </button>
              </div>
            )}

            {/* Text input */}
            {recState === 'idle' && (
              <div className={cn(
                'flex items-center gap-2 border rounded-2xl px-3.5 py-2.5 transition-all',
                'bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700',
                'focus-within:border-zinc-300 dark:focus-within:border-zinc-600 focus-within:bg-white dark:focus-within:bg-zinc-800/60',
                aiVoice ? 'border-opacity-60' : ''
              )}
                style={aiVoice ? { borderColor: `${branding.primaryColor}50`, background: `${branding.primaryColor}06` } : {}}>

                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={aiVoice ? 'Type what to say as a voice note…' : `Message ${activeThread.name.split(' ')[0]}…`}
                  className="flex-1 bg-transparent text-[13.5px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none no-ring" />

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setAiVoice(v => !v)} title="Send as AI voice"
                    className={cn('w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                      aiVoice ? 'text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    )}
                    style={aiVoice ? { background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` } : {}}>
                    <Wand2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>

                  <button onClick={startRecording} title="Record voice note"
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                    <Mic className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>

                  <button onClick={sendMessage} disabled={!canSend}
                    className={cn(
                      'flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[12.5px] font-semibold transition-all flex-shrink-0',
                      canSend ? 'text-white shadow-sm active:scale-[0.97]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                    )}
                    style={canSend ? { background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`, boxShadow: `0 2px 8px ${branding.primaryColor}35` } : {}}>
                    {aiVoice ? <><Mic className="w-3 h-3" strokeWidth={2} /> Voice</> : <><Send className="w-3 h-3" strokeWidth={2} /> Send</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Contact info panel ──────────────────────────────────────────── */}
        {showInfo && (
          <div className="w-[248px] flex-shrink-0 flex flex-col overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">

            {/* Avatar header */}
            <div className="flex flex-col items-center pt-7 pb-5 px-4 text-center relative overflow-hidden">
              {/* Subtle gradient bg */}
              <div className="absolute inset-0 opacity-[0.07]"
                style={{ background: `radial-gradient(ellipse 120% 100% at 50% -10%, ${activeCfg.accent} 0%, transparent 70%)` }} />
              <div className="relative z-10">
                <div className="relative inline-block mb-3">
                  <Avatar name={activeThread.name} size={60} />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900"
                    style={{ background: activeCfg.dot === '#E1306C' ? 'linear-gradient(135deg,#833AB4,#FD1D1D)' : activeCfg.dot }}>
                    <ChannelIcon channel={activeThread.channel} size={10} />
                  </span>
                </div>
                <p className="text-[14px] font-bold text-zinc-900 dark:text-zinc-50 leading-tight">{activeThread.name}</p>
                {activeThread.role && <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{activeThread.role}</p>}
              </div>
            </div>

            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">Contact</p>
                <div className="space-y-2">
                  {activeThread.handle && (
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <AtSign className="w-3 h-3 text-zinc-500" strokeWidth={1.75} />
                      </span>
                      <span className="text-[12px] text-zinc-700 dark:text-zinc-300 truncate">{activeThread.handle}</span>
                    </div>
                  )}
                  {activeThread.location && (
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-3 h-3 text-zinc-500" strokeWidth={1.75} />
                      </span>
                      <span className="text-[12px] text-zinc-700 dark:text-zinc-300 truncate">{activeThread.location}</span>
                    </div>
                  )}
                  {activeThread.role && (
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-3 h-3 text-zinc-500" strokeWidth={1.75} />
                      </span>
                      <span className="text-[12px] text-zinc-700 dark:text-zinc-300 truncate">{activeThread.role}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 font-medium">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" strokeWidth={0} /> New Lead
                  </span>
                  <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/40 font-medium">
                    🔥 Hot
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">Source</p>
                <div className="flex items-center gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
                  {activeThread.channel === 'instagram' ? <InstagramIcon size={13} /> : activeThread.channel === 'sms' ? <MessageSquare className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.75} /> : <Mail className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.75} />}
                  <span>{activeCfg.tag} · Organic</span>
                </div>
              </div>
            </div>

            {/* Notes section */}
            {(() => {
              const notes = threadNotes[activeThread.id] ?? []
              return (
                <div className="px-4 pb-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes</p>
                    {notes.length > 0 && (
                      <span className="text-[10px] text-zinc-400 tabular-nums">{notes.length}</span>
                    )}
                  </div>

                  {/* Existing notes */}
                  {notes.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {notes.map(note => (
                        <div key={note.id} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl overflow-hidden group">
                          {editingNoteId === note.id ? (
                            <>
                              <textarea
                                autoFocus
                                value={editNoteText}
                                onChange={e => setEditNoteText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    e.preventDefault()
                                    if (!editNoteText.trim()) return
                                    setThreadNotes(prev => ({
                                      ...prev,
                                      [activeThread.id]: (prev[activeThread.id] ?? []).map(n =>
                                        n.id === note.id ? { ...n, text: editNoteText.trim() } : n
                                      )
                                    }))
                                    setEditingNoteId(null)
                                  }
                                  if (e.key === 'Escape') { setEditingNoteId(null); setEditNoteText('') }
                                }}
                                rows={3}
                                className="w-full px-3 py-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 bg-transparent outline-none resize-none leading-relaxed"
                              />
                              <div className="flex items-center justify-between px-3 py-2 border-t border-amber-100 dark:border-amber-900/30 bg-amber-50/80 dark:bg-amber-950/30">
                                <button onClick={() => { setEditingNoteId(null); setEditNoteText('') }} className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors">Cancel</button>
                                <button
                                  disabled={!editNoteText.trim()}
                                  onClick={() => {
                                    if (!editNoteText.trim()) return
                                    setThreadNotes(prev => ({
                                      ...prev,
                                      [activeThread.id]: (prev[activeThread.id] ?? []).map(n =>
                                        n.id === note.id ? { ...n, text: editNoteText.trim() } : n
                                      )
                                    }))
                                    setEditingNoteId(null)
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-white px-2.5 py-1 rounded-lg disabled:opacity-40 transition-all"
                                  style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
                                >
                                  <Check className="w-3 h-3" strokeWidth={2.5} /> Save
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="px-3 py-2.5">
                              <p className="text-[12px] text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                                  <Clock className="w-2.5 h-2.5" strokeWidth={1.75} />{note.time}
                                </span>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => { setEditingNoteId(note.id); setEditNoteText(note.text) }}
                                    className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                                  >
                                    <Pencil className="w-3 h-3" strokeWidth={1.75} />
                                  </button>
                                  <button
                                    onClick={() => setThreadNotes(prev => ({
                                      ...prev,
                                      [activeThread.id]: (prev[activeThread.id] ?? []).filter(n => n.id !== note.id)
                                    }))}
                                    className="text-zinc-400 hover:text-red-400 dark:text-zinc-500 dark:hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" strokeWidth={1.75} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note composer */}
                  {showNoteInput ? (
                    <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden mb-2">
                      <textarea
                        autoFocus
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault()
                            if (!noteText.trim()) return
                            const now = new Date()
                            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            setThreadNotes(prev => ({
                              ...prev,
                              [activeThread.id]: [...(prev[activeThread.id] ?? []), { id: Date.now(), text: noteText.trim(), time }]
                            }))
                            setNoteText('')
                            setShowNoteInput(false)
                          }
                          if (e.key === 'Escape') { setShowNoteInput(false); setNoteText('') }
                        }}
                        placeholder="Type a note… (⌘↵ to save, Esc to cancel)"
                        rows={3}
                        className="w-full px-3 py-2.5 text-[12px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 bg-transparent outline-none resize-none leading-relaxed"
                      />
                      <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-700">
                        <button onClick={() => { setShowNoteInput(false); setNoteText('') }} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Cancel</button>
                        <button
                          disabled={!noteText.trim()}
                          onClick={() => {
                            if (!noteText.trim()) return
                            const now = new Date()
                            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            setThreadNotes(prev => ({
                              ...prev,
                              [activeThread.id]: [...(prev[activeThread.id] ?? []), { id: Date.now(), text: noteText.trim(), time }]
                            }))
                            setNoteText('')
                            setShowNoteInput(false)
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-white px-2.5 py-1 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
                        >
                          <Check className="w-3 h-3" strokeWidth={2.5} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNoteInput(true)}
                      className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm transition-all mb-2"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Log a Note
                    </button>
                  )}
                </div>
              )
            })()}

            <div className="px-4 pb-4 pt-1">
              <Link
                href={`/leads?open=${encodeURIComponent(activeThread.name)}`}
                className="w-full h-8 rounded-xl brand-btn text-[12px] font-semibold flex items-center justify-center"
              >
                View Lead Profile
              </Link>
            </div>
          </div>
        )}

        {/* ─── AI Script panel ─────────────────────────────────────────────── */}
        {showScript && (
          <div className="w-[268px] flex-shrink-0 flex flex-col overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">

            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)' }}>
                <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">AI Script</p>
                <p className="text-[10px] text-zinc-400">{activeThread.name.split(' ')[0]}'s thread</p>
              </div>
              <button onClick={() => setShowScript(false)} className="w-6 h-6 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Score */}
              <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Script health</span>
                  <span className="text-[14px] font-bold tabular-nums" style={{ color: scoreColor }}>{threadScript.score}</span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${threadScript.score}%`, background: scoreColor }} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: scoreColor }}>
                  {threadScript.score >= 85 ? 'Excellent' : threadScript.score >= 75 ? 'Good' : threadScript.score >= 60 ? 'Needs work' : 'Poor'}
                </span>
              </div>

              {/* Script editor */}
              <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Script</p>
                  {optimized && <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-1.5 py-0.5 rounded-full">✓ Optimized</span>}
                </div>
                <textarea value={scriptText} onChange={e => setScriptText(e.target.value)} rows={6}
                  className="w-full text-[12px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 resize-none outline-none focus:border-violet-300 dark:focus:border-violet-700 transition-colors leading-relaxed" />
                <button onClick={handleOptimize} disabled={optimizing}
                  className="w-full h-8 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 text-white transition-all disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)' }}>
                  {optimizing ? <><RefreshCw className="w-3 h-3 animate-spin" /> Optimizing…</> : <><Sparkles className="w-3 h-3" strokeWidth={2} /> {optimized ? 'Re-optimize' : 'Optimize'}</>}
                </button>
              </div>

              {/* Insights */}
              <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Insights</p>
                {threadScript.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {ins.type === 'good'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      : <AlertCircle  className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"  strokeWidth={2} />
                    }
                    <span className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-snug">{ins.text}</span>
                  </div>
                ))}
              </div>

              {/* Library */}
              <div className="px-4 py-4 space-y-2">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-zinc-400" strokeWidth={1.75} />
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Library</p>
                </div>
                {SCRIPT_LIBRARY.map((s, i) => {
                  const isActive  = activeLib === i
                  const sc        = s.score >= 85 ? '#10b981' : s.score >= 70 ? '#f59e0b' : '#ef4444'
                  return (
                    <button key={i} onClick={() => { setActiveLib(i); setScriptText(s.text); setOptimized(false) }}
                      className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all',
                        isActive ? 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30 hover:border-zinc-200 dark:hover:border-zinc-700'
                      )}>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[12px] font-semibold', isActive ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-700 dark:text-zinc-300')}>{s.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{s.tag}</p>
                      </div>
                      <span className="text-[11px] font-bold tabular-nums flex-shrink-0" style={{ color: sc }}>{s.score}</span>
                      <ChevronRight className={cn('w-3 h-3 flex-shrink-0', isActive ? 'text-violet-500' : 'text-zinc-300 dark:text-zinc-600')} strokeWidth={2} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
