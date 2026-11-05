"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, Check,
  Phone, Users, Monitor, RefreshCw, Clock, CalendarDays,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useBranding } from "@/components/providers/BrandingProvider";
import { cn } from "@/lib/utils";
import {
  getAppointments, saveAppointment, deleteAppointment,
  TYPE_META, type Appointment, type AppointmentType,
} from "@/lib/scheduleStore";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS  = Array.from({ length: 13 }, (_, i) => i + 7); // 7am–7pm
const TYPES: { value: AppointmentType; label: string; icon: typeof Phone }[] = [
  { value: "call",      label: "Call",      icon: Phone    },
  { value: "meeting",   label: "Meeting",   icon: Users    },
  { value: "demo",      label: "Demo",      icon: Monitor  },
  { value: "follow_up", label: "Follow-up", icon: RefreshCw },
];
const DURATIONS = [15, 30, 45, 60, 90];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function fmt12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function startOfWeek(d: Date) {
  const r = new Date(d); r.setDate(r.getDate() - r.getDay()); return r;
}
function minutesFromMidnight(time: string) {
  const [h, m] = time.split(":").map(Number); return h * 60 + m;
}
function todayStr() { return isoDate(new Date()); }
function nowTimeStr() {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return d.toTimeString().slice(0, 5);
}

// ─── Appointment card (calendar) ──────────────────────────────────────────────
function ApptCard({ appt, onClick }: { appt: Appointment; onClick: () => void }) {
  const meta = TYPE_META[appt.type];
  const top  = ((minutesFromMidnight(appt.time) - 7 * 60) / 60) * 56; // 56px per hour
  const h    = (appt.duration / 60) * 56;
  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute left-0.5 right-0.5 rounded-lg border px-2 py-1 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md overflow-hidden group",
        meta.bg, meta.border,
        appt.status === "cancelled" && "opacity-40 line-through"
      )}
      style={{ top, height: Math.max(h, 28) }}
    >
      <p className="text-[11px] font-semibold truncate" style={{ color: meta.color }}>{appt.leadName}</p>
      {h >= 36 && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{fmt12(appt.time)} · {meta.label}</p>}
    </div>
  );
}

// ─── New appointment form ──────────────────────────────────────────────────────
interface FormState { leadName: string; leadEmail: string; type: AppointmentType; date: string; time: string; duration: number; notes: string }

function AppointmentForm({ initial, onSave, onCancel }: {
  initial?: Partial<FormState>;
  onSave: (f: FormState) => void;
  onCancel: () => void;
}) {
  const { branding } = useBranding();
  const [f, setF] = useState<FormState>({
    leadName: "", leadEmail: "", type: "call",
    date: todayStr(), time: nowTimeStr(), duration: 30, notes: "",
    ...initial,
  });
  const up = (patch: Partial<FormState>) => setF(p => ({ ...p, ...patch }));
  const ok = f.leadName.trim() && f.date && f.time;

  return (
    <div className="space-y-4 p-5">
      {/* Lead */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Contact name</label>
          <input value={f.leadName} onChange={e => up({ leadName: e.target.value })} placeholder="Sarah Mitchell"
            className="w-full px-3 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Email</label>
          <input value={f.leadEmail} onChange={e => up({ leadEmail: e.target.value })} placeholder="sarah@company.com" type="email"
            className="w-full px-3 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors" />
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Type</label>
        <div className="grid grid-cols-4 gap-1.5">
          {TYPES.map(t => (
            <button key={t.value} onClick={() => up({ type: t.value })}
              className={cn("flex items-center justify-center gap-1.5 h-8 rounded-lg border text-[11.5px] font-medium transition-all",
                f.type === t.value
                  ? `${TYPE_META[t.value].bg} ${TYPE_META[t.value].border} shadow-sm`
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
              )}
              style={f.type === t.value ? { color: TYPE_META[t.value].color } : {}}>
              <t.icon className="w-3 h-3" strokeWidth={1.75} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Date</label>
          <input type="date" value={f.date} min={todayStr()} onChange={e => up({ date: e.target.value })}
            className="w-full px-3 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Time</label>
          <input type="time" value={f.time} onChange={e => up({ time: e.target.value })}
            className="w-full px-3 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors" />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Duration</label>
        <div className="flex gap-1.5">
          {DURATIONS.map(d => (
            <button key={d} onClick={() => up({ duration: d })}
              className={cn("flex-1 h-8 rounded-lg border text-[11.5px] font-medium transition-all",
                f.duration === d
                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
              )}>
              {d}m
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Notes</label>
        <textarea value={f.notes} onChange={e => up({ notes: e.target.value })} rows={2}
          placeholder="Agenda, prep notes…"
          className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 text-[13px] text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          Cancel
        </button>
        <button onClick={() => ok && onSave(f)} disabled={!ok}
          className={cn("flex-1 h-9 rounded-xl text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-1.5", ok ? "active:scale-[0.97]" : "opacity-40 cursor-not-allowed")}
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}>
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Save
        </button>
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ appt, onClose, onDelete, onStatusChange }: {
  appt: Appointment; onClose: () => void;
  onDelete: () => void; onStatusChange: (s: Appointment["status"]) => void;
}) {
  const { branding } = useBranding();
  const meta = TYPE_META[appt.type];
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", meta.bg)}>
            {appt.type === "call" ? <Phone className="w-4 h-4" style={{ color: meta.color }} strokeWidth={1.75} />
              : appt.type === "meeting" ? <Users className="w-4 h-4" style={{ color: meta.color }} strokeWidth={1.75} />
              : appt.type === "demo" ? <Monitor className="w-4 h-4" style={{ color: meta.color }} strokeWidth={1.75} />
              : <RefreshCw className="w-4 h-4" style={{ color: meta.color }} strokeWidth={1.75} />}
          </span>
          <div>
            <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{appt.leadName}</p>
            <p className="text-[11px] text-zinc-400">{meta.label}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Date</p>
            <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{new Date(appt.date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Time</p>
            <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{fmt12(appt.time)} · {appt.duration}m</p>
          </div>
        </div>

        {appt.leadEmail && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Email</p>
            <p className="text-[13px] text-zinc-700 dark:text-zinc-300 truncate">{appt.leadEmail}</p>
          </div>
        )}

        {appt.notes && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{appt.notes}</p>
          </div>
        )}

        {/* Status */}
        <div>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Status</p>
          <div className="flex gap-2">
            {(["upcoming", "completed", "cancelled"] as const).map(s => (
              <button key={s} onClick={() => onStatusChange(s)}
                className={cn("flex-1 h-7 rounded-lg border text-[11px] font-medium capitalize transition-all",
                  appt.status === s
                    ? s === "completed" ? "bg-emerald-500 border-emerald-500 text-white"
                      : s === "cancelled" ? "bg-zinc-400 border-zinc-400 text-white"
                      : "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                )}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border border-red-200 dark:border-red-800/50 text-[12.5px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} /> Delete appointment
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SchedulerPage() {
  const { branding } = useBranding();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weekStart,    setWeekStart]    = useState(() => startOfWeek(new Date()));
  const [selected,     setSelected]     = useState<Appointment | null>(null);
  const [showForm,     setShowForm]     = useState(false);

  useEffect(() => { setAppointments(getAppointments()); }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = todayStr();

  function reload() { setAppointments(getAppointments()); }

  function handleSave(f: { leadName: string; leadEmail: string; type: AppointmentType; date: string; time: string; duration: number; notes: string }) {
    saveAppointment({ id: Date.now().toString(), ...f, status: "upcoming" });
    reload();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    deleteAppointment(id);
    reload();
    setSelected(null);
  }

  function handleStatusChange(appt: Appointment, status: Appointment["status"]) {
    const updated = { ...appt, status };
    saveAppointment(updated);
    reload();
    setSelected(updated);
  }

  const upcomingToday    = appointments.filter(a => a.date === today && a.status === "upcoming");
  const upcomingThisWeek = appointments.filter(a => a.date >= isoDate(weekStart) && a.date <= isoDate(addDays(weekStart, 6)) && a.status === "upcoming");

  const gradient = `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5 flex-shrink-0">
          <PageHeader title="Scheduler" count={upcomingThisWeek.length} description="Book and manage appointments with your leads." />
          <button
            onClick={() => { setShowForm(true); setSelected(null); }}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white flex-shrink-0 mt-1 transition-all active:scale-[0.97]"
            style={{ background: gradient }}>
            <Plus className="w-4 h-4" strokeWidth={2} /> New Appointment
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-4 flex-shrink-0">
          {[
            { label: "Today", value: upcomingToday.length, sub: "appointments" },
            { label: "This week", value: upcomingThisWeek.length, sub: "upcoming" },
            { label: "Total", value: appointments.length, sub: "all time" },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3 flex-1">
              <p className="text-[11px] text-zinc-400 font-medium mb-0.5">{s.label}</p>
              <p className="text-[22px] font-bold text-zinc-900 dark:text-zinc-50 leading-tight tabular-nums">{s.value}</p>
              <p className="text-[11px] text-zinc-400">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Week nav */}
        <div className="flex items-center gap-3 mb-3 flex-shrink-0">
          <button onClick={() => setWeekStart(d => addDays(d, -7))} className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <p className="text-[14px] font-semibold text-zinc-800 dark:text-zinc-200 flex-1 text-center">
            {weekStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          <button onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            Today
          </button>
          <button onClick={() => setWeekStart(d => addDays(d, 7))} className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="flex min-w-[700px]">

            {/* Time gutter */}
            <div className="w-14 flex-shrink-0 border-r border-zinc-100 dark:border-zinc-800">
              <div className="h-10 border-b border-zinc-100 dark:border-zinc-800" />
              {HOURS.map(h => (
                <div key={h} className="h-14 border-b border-zinc-50 dark:border-zinc-800/50 flex items-start justify-end pr-2 pt-1">
                  <span className="text-[10px] text-zinc-400 tabular-nums">{h % 12 || 12}{h < 12 ? "a" : "p"}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, di) => {
              const dateStr = isoDate(day);
              const isToday = dateStr === today;
              const dayAppts = appointments.filter(a => a.date === dateStr);
              return (
                <div key={di} className={cn("flex-1 min-w-[80px] border-r border-zinc-100 dark:border-zinc-800 last:border-r-0", isToday && "bg-zinc-50/60 dark:bg-zinc-800/20")}>
                  {/* Day header */}
                  <div className={cn("h-10 flex flex-col items-center justify-center border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-10 bg-white dark:bg-zinc-900", isToday && "bg-zinc-50/80 dark:bg-zinc-800/40")}>
                    <span className="text-[10px] text-zinc-400">{DAYS[day.getDay()]}</span>
                    <span className={cn("text-[13px] font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                      isToday ? "text-white" : "text-zinc-800 dark:text-zinc-200"
                    )}
                      style={isToday ? { background: branding.primaryColor } : {}}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Hour cells + appointments */}
                  <div className="relative">
                    {HOURS.map(h => (
                      <div key={h} className="h-14 border-b border-zinc-50 dark:border-zinc-800/40" />
                    ))}
                    {dayAppts.map(appt => (
                      <ApptCard key={appt.id} appt={appt} onClick={() => { setSelected(appt); setShowForm(false); }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      {(showForm || selected) && (
        <div className="w-[340px] flex-shrink-0 border-l border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">

          {showForm && (
            <>
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: gradient }}>
                    <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">New Appointment</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AppointmentForm onSave={handleSave} onCancel={() => setShowForm(false)} />
              </div>
            </>
          )}

          {selected && !showForm && (
            <DetailPanel
              appt={selected}
              onClose={() => setSelected(null)}
              onDelete={() => handleDelete(selected.id)}
              onStatusChange={s => handleStatusChange(selected, s)}
            />
          )}
        </div>
      )}

      {/* Upcoming list — bottom strip when no panel open */}
      {!showForm && !selected && upcomingToday.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 max-w-xl pointer-events-none px-6">
          {upcomingToday.slice(0, 3).map(a => {
            const meta = TYPE_META[a.type];
            return (
              <button key={a.id} onClick={() => setSelected(a)}
                className={cn("pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl border shadow-lg text-left transition-all hover:-translate-y-0.5", meta.bg, meta.border)}>
                <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: meta.color }} strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold truncate" style={{ color: meta.color }}>{a.leadName}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{fmt12(a.time)} · {meta.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
