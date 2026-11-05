export type AppointmentType = 'call' | 'meeting' | 'demo' | 'follow_up'
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  leadName: string
  leadEmail: string
  type: AppointmentType
  date: string   // YYYY-MM-DD
  time: string   // HH:MM  (24-hr)
  duration: number // minutes
  notes: string
  status: AppointmentStatus
}

const KEY = 'aura-appointments'

const SEEDS: Appointment[] = [
  { id: 's1', leadName: 'Sarah Mitchell',  leadEmail: 'sarah@apexrealty.com',  type: 'demo',      date: today(0), time: '10:00', duration: 30, notes: 'Walk through the CRM dashboard',       status: 'upcoming' },
  { id: 's2', leadName: 'Omar Al-Rashid',  leadEmail: 'omar@desertpeak.ae',    type: 'call',      date: today(0), time: '14:30', duration: 15, notes: 'Proposal follow-up',                   status: 'upcoming' },
  { id: 's3', leadName: 'James Thornton',  leadEmail: 'james@bluesky.io',      type: 'meeting',   date: today(1), time: '09:00', duration: 60, notes: 'Onboarding kick-off',                  status: 'upcoming' },
  { id: 's4', leadName: 'Priya Nair',      leadEmail: 'p.nair@summit.co',      type: 'follow_up', date: today(1), time: '11:00', duration: 15, notes: 'Check in after trial',                 status: 'upcoming' },
  { id: 's5', leadName: 'Laura Chen',      leadEmail: 'lchen@horizondigital.co',type: 'call',     date: today(2), time: '15:00', duration: 30, notes: 'Contract signing discussion',          status: 'upcoming' },
  { id: 's6', leadName: 'Marcus Webb',     leadEmail: 'marcus@webb.co',        type: 'demo',      date: today(3), time: '13:00', duration: 45, notes: 'Deep dive into automation features',   status: 'upcoming' },
]

function today(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export function getAppointments(): Appointment[] {
  if (typeof window === 'undefined') return SEEDS
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEEDS))
      return SEEDS
    }
    return JSON.parse(raw) as Appointment[]
  } catch { return SEEDS }
}

export function saveAppointment(appt: Appointment): void {
  const all = getAppointments()
  const idx = all.findIndex(a => a.id === appt.id)
  if (idx >= 0) all[idx] = appt
  else all.push(appt)
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch {}
}

export function deleteAppointment(id: string): void {
  const all = getAppointments().filter(a => a.id !== id)
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch {}
}

export const TYPE_META: Record<AppointmentType, { label: string; color: string; bg: string; border: string }> = {
  call:      { label: 'Call',        color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50' },
  meeting:   { label: 'Meeting',     color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-950/30',       border: 'border-blue-200 dark:border-blue-800/50'       },
  demo:      { label: 'Demo',        color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-950/30',   border: 'border-violet-200 dark:border-violet-800/50'   },
  follow_up: { label: 'Follow-up',   color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/30',     border: 'border-amber-200 dark:border-amber-800/50'     },
}
