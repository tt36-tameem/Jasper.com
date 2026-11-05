"use client";

import { useState } from "react";
import { X, CalendarPlus, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/providers/BrandingProvider";
import { saveAppointment, TYPE_META, type AppointmentType } from "@/lib/scheduleStore";

interface Props {
  leadName: string;
  leadEmail: string;
  onClose: () => void;
  onSaved?: () => void;
}

const TYPES: { value: AppointmentType; label: string; emoji: string }[] = [
  { value: "call",      label: "Phone Call",  emoji: "📞" },
  { value: "meeting",   label: "Meeting",     emoji: "🤝" },
  { value: "demo",      label: "Demo",        emoji: "💻" },
  { value: "follow_up", label: "Follow-up",   emoji: "🔁" },
];

const DURATIONS = [15, 30, 45, 60, 90];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function nowTime() {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return d.toTimeString().slice(0, 5);
}

export function ScheduleModal({ leadName, leadEmail, onClose, onSaved }: Props) {
  const { branding } = useBranding();
  const gradient = `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`;

  const [type,     setType]     = useState<AppointmentType>("call");
  const [date,     setDate]     = useState(todayStr());
  const [time,     setTime]     = useState(nowTime());
  const [duration, setDuration] = useState(30);
  const [notes,    setNotes]    = useState("");
  const [saved,    setSaved]    = useState(false);

  function handleSave() {
    saveAppointment({
      id: Date.now().toString(),
      leadName, leadEmail, type, date, time, duration,
      notes: notes.trim(),
      status: "upcoming",
    });
    setSaved(true);
    setTimeout(() => { onSaved?.(); onClose(); }, 1400);
  }

  const meta = TYPE_META[type];
  const canSave = date && time && !saved;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-[420px] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gradient }}>
            <CalendarPlus className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-50">Schedule with {leadName.split(" ")[0]}</p>
            <p className="text-[11px] text-zinc-400 truncate">{leadEmail}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Type */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Type</p>
            <div className="grid grid-cols-4 gap-1.5">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-medium transition-all",
                    type === t.value
                      ? `${TYPE_META[t.value].bg} ${TYPE_META[t.value].border} shadow-sm`
                      : "border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  )}
                  style={type === t.value ? { color: TYPE_META[t.value].color } : {}}
                >
                  <span className="text-[16px] leading-none">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Date</p>
              <input
                type="date"
                value={date}
                min={todayStr()}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Time</p>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Duration</p>
            <div className="flex gap-1.5">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    "flex items-center gap-1 h-8 px-3 rounded-lg border text-[11.5px] font-medium transition-all flex-1 justify-center",
                    duration === d
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
                  )}
                >
                  <Clock className="w-3 h-3" strokeWidth={1.75} />
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Notes <span className="font-normal normal-case tracking-normal">(optional)</span></p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Agenda, prep notes, or topics to cover…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-b-2xl">
          <button onClick={onClose} className="h-8 px-4 rounded-lg text-[12.5px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "flex items-center gap-1.5 h-8 px-5 rounded-xl text-[12.5px] font-semibold text-white transition-all",
              canSave ? "active:scale-[0.97]" : "opacity-40 cursor-not-allowed"
            )}
            style={{ background: saved ? "#10b981" : gradient }}
          >
            {saved
              ? <><Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Scheduled!</>
              : <><CalendarPlus className="w-3.5 h-3.5" strokeWidth={2} /> Schedule</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
