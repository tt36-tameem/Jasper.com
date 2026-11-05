// Voice briefing playback.
//
// Primary path: ElevenLabs TTS via /api/voice/tts (high-quality, the chosen
// voiceId comes from branding). Lines are fetched in parallel and played in
// order so captions stay in sync.
//
// Fallback: if the ElevenLabs request fails (e.g. no API key yet), we fall
// back to the browser's built-in SpeechSynthesis so nothing is fully silent.

export interface SpeakOptions {
  /** Called when a line starts being spoken (and with null when the whole sequence ends). */
  onLine?: (line: string | null) => void;
  /** Called once, the moment the very first line actually begins playing. */
  onStart?: () => void;
  /** ElevenLabs voice id chosen by the user (empty = server default). */
  voiceId?: string;
}

async function fetchClip(text: string, voiceId?: string): Promise<string> {
  const res = await fetch("/api/voice/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  });
  if (!res.ok) throw new Error(`tts ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Speak an array of lines in sequence using ElevenLabs.
 * Returns a cancel() function.
 */
export function speakLines(lines: string[], opts: SpeakOptions = {}): () => void {
  if (typeof window === "undefined") return () => {};

  let cancelled = false;
  let audioEl: HTMLAudioElement | null = null;

  (async () => {
    let urls: string[];
    try {
      urls = await Promise.all(lines.map((l) => fetchClip(l, opts.voiceId)));
    } catch (err) {
      // ElevenLabs unavailable — degrade to browser speech.
      console.warn("[voice] ElevenLabs unavailable, using browser fallback:", err);
      if (!cancelled) fallbackSpeak(lines, opts);
      return;
    }
    if (cancelled) {
      urls.forEach((u) => URL.revokeObjectURL(u));
      return;
    }

    let firstStarted = false;
    for (let i = 0; i < lines.length; i++) {
      if (cancelled) break;
      await new Promise<void>((resolve) => {
        const audio = new Audio(urls[i]);
        audioEl = audio;
        audio.onplay = () => {
          if (!firstStarted) {
            firstStarted = true;
            opts.onStart?.();
          }
          opts.onLine?.(lines[i]);
        };
        const finish = () => { URL.revokeObjectURL(urls[i]); resolve(); };
        audio.onended = finish;
        audio.onerror = finish;
        audio.play().catch(() => finish());
      });
    }
    // Revoke any clips we never got to (cancelled mid-way).
    urls.forEach((u) => URL.revokeObjectURL(u));
    if (!cancelled) opts.onLine?.(null);
  })();

  return () => {
    cancelled = true;
    if (audioEl) { audioEl.pause(); audioEl = null; }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  };
}

/* ── Browser SpeechSynthesis fallback ─────────────────────────────────── */

function pickFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const female =
    /samantha|female|zira|karen|moira|tessa|fiona|serena|victoria|jenny|aria|sonia|libby|allison|ava|susan|google uk english female|google us english/i;
  return (
    voices.find((v) => v.lang.startsWith("en") && female.test(v.name)) ||
    voices.find((v) => female.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0] ||
    null
  );
}

function fallbackSpeak(lines: string[], opts: SpeakOptions) {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const run = () => {
    const voices = synth.getVoices();
    if (!voices.length) return false;
    synth.cancel();
    const voice = pickFemaleVoice(voices);
    let firstStarted = false;
    lines.forEach((line, i) => {
      const u = new SpeechSynthesisUtterance(line);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? "en-US";
      u.rate = 0.96;
      u.pitch = 1.06;
      u.onstart = () => {
        if (!firstStarted) { firstStarted = true; opts.onStart?.(); }
        opts.onLine?.(line);
      };
      if (i === lines.length - 1) u.onend = () => opts.onLine?.(null);
      synth.speak(u);
    });
    return true;
  };
  if (!run()) {
    const handler = () => { if (run()) synth.removeEventListener("voiceschanged", handler); };
    synth.addEventListener("voiceschanged", handler);
  }
}
