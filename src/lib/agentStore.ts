// AI voice-agent presets. Each agent is a reusable Vapi assistant config the
// Power Dialer uses when running calls in "AI Agent" mode. One agent is marked
// active — that's the one the dialer picks up. Persisted in localStorage,
// following the same pattern as workflowStore / scheduleStore.

export type Gender = "male" | "female";

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  gender: Gender;
  avatar: string;        // portrait url (real human head)
  model: string;          // Anthropic model id (Vapi `model.model`)
  voiceId: string;        // ElevenLabs (11labs) voice id
  firstMessage: string;   // what the agent says first
  systemPrompt: string;   // instructions / persona for the agent
  endCallMessage: string; // closing line before hangup
}

const KEY        = "aura_agents";
const ACTIVE_KEY = "aura_active_agent";

// Model choices. Haiku 4.5 is the proven default (used elsewhere in the app);
// Sonnet is the smarter, slower option.
export const AGENT_MODELS: { id: string; label: string }[] = [
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 — fast & low-cost" },
  { id: "claude-sonnet-4-5",         label: "Claude Sonnet 4.5 — smartest" },
];

// ElevenLabs premade voices (work on the free plan), grouped by gender so we
// can match a voice to the agent.
export const AGENT_VOICES: { id: string; label: string; gender: Gender }[] = [
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah — warm, professional", gender: "female" },
  { id: "FGY2WhTYpPnrIDTdsKH5", label: "Laura — friendly, upbeat",   gender: "female" },
  { id: "pFZP5JQG7iQjIQuC4Bku", label: "Lily — calm, clear",         gender: "female" },
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel — confident, classic", gender: "female" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam — deep, steady",        gender: "male"   },
  { id: "TxGEqnHWrfWFTfGW9XjX", label: "Josh — friendly, natural",   gender: "male"   },
];

export const DEFAULT_MODEL = AGENT_MODELS[0].id;
export const DEFAULT_VOICE = AGENT_VOICES[0].id;

// Deterministic, openly-licensed illustrated avatar for a given gender + seed.
// We use DiceBear (CC0/MIT) rather than photos of real people, so there's no
// likeness/publicity issue. Users can upload a real photo of their own instead.
export function portrait(gender: Gender, seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(`${gender}-${seed}`)}`;
}

// True for an uploaded photo (data: URL) — used to avoid overwriting uploads
// when the gender toggle regenerates the illustrated avatar.
export function isUploadedAvatar(url: string): boolean {
  return url.startsWith("data:");
}

// ─── Role-based templates (shown when creating a new agent) ────────────────────
export interface AgentTemplate {
  key: string;
  role: string;          // short category chip, e.g. "Sales"
  name: string;
  description: string;
  gender: Gender;
  avatar: string;
  model: string;
  voiceId: string;
  firstMessage: string;
  systemPrompt: string;
  endCallMessage: string;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    key: "sales", role: "Sales", name: "Outbound Sales Rep — Alex",
    description: "Books demos with inbound leads. Friendly, concise, handles objections.",
    gender: "male", avatar: portrait("male", "sales"),
    model: DEFAULT_MODEL, voiceId: "pNInz6obpgDQGcFmaJgB",
    firstMessage: "Hey [Name], this is Alex from Jacsper — do you have 30 seconds?",
    systemPrompt: "You are Alex, a friendly outbound sales rep for Jacsper, a CRM for sales teams. Goal: book a 10-minute demo. Keep replies short and conversational. Acknowledge objections, never argue. If interested, offer Thursday or Friday. If it's a bad time, offer to call back.",
    endCallMessage: "Thanks so much for your time. Have a great day!",
  },
  {
    key: "booking", role: "Booking", name: "Appointment Setter — Mia",
    description: "Confirms and reschedules booked appointments. Polite and efficient.",
    gender: "female", avatar: portrait("female", "booking"),
    model: DEFAULT_MODEL, voiceId: "EXAVITQu4vr4xnSDxMaL",
    firstMessage: "Hi [Name], this is Mia calling to confirm your upcoming appointment.",
    systemPrompt: "You are Mia, an appointment-setting assistant. Goal: confirm the appointment, or reschedule if needed. Be warm, brief, and clear. Read back the date and time to confirm.",
    endCallMessage: "Perfect, you're all set. We'll see you then!",
  },
  {
    key: "qualify", role: "Qualifying", name: "Lead Qualifier — Noah",
    description: "Screens new leads with a few quick questions before handing off to sales.",
    gender: "male", avatar: portrait("male", "qualify"),
    model: DEFAULT_MODEL, voiceId: "TxGEqnHWrfWFTfGW9XjX",
    firstMessage: "Hi [Name], this is Noah — I just have a couple of quick questions for you.",
    systemPrompt: "You are Noah, a lead-qualification assistant. Goal: find out budget, timeline, and need in under 2 minutes. Ask one question at a time. Be friendly and efficient. If they qualify, offer to connect them with a specialist.",
    endCallMessage: "Great, thanks — someone from the team will follow up shortly!",
  },
  {
    key: "support", role: "Support", name: "Customer Support — Emma",
    description: "Handles common customer questions and routes complex issues to a human.",
    gender: "female", avatar: portrait("female", "support"),
    model: DEFAULT_MODEL, voiceId: "FGY2WhTYpPnrIDTdsKH5",
    firstMessage: "Hi [Name], thanks for calling support — how can I help you today?",
    systemPrompt: "You are Emma, a calm and helpful customer support agent. Goal: resolve the caller's issue or gather details for the team. Be patient and empathetic. If you can't solve it, reassure them and take a message.",
    endCallMessage: "Happy to help — have a wonderful day!",
  },
  {
    key: "realestate", role: "Real Estate", name: "Real Estate Advisor — Olivia",
    description: "Follows up with property enquiries and books viewings.",
    gender: "female", avatar: portrait("female", "realestate"),
    model: DEFAULT_MODEL, voiceId: "pFZP5JQG7iQjIQuC4Bku",
    firstMessage: "Hi [Name], this is Olivia — I saw you were interested in one of our listings.",
    systemPrompt: "You are Olivia, a warm real estate advisor. Goal: understand what the buyer is looking for and book a viewing. Ask about budget, area, and timeline. Be knowledgeable and reassuring.",
    endCallMessage: "Lovely speaking with you — I'll send over the details right away!",
  },
  {
    key: "reception", role: "Reception", name: "Virtual Receptionist — Sophia",
    description: "Greets callers, answers basics, and directs them to the right place.",
    gender: "female", avatar: portrait("female", "reception"),
    model: DEFAULT_MODEL, voiceId: "EXAVITQu4vr4xnSDxMaL",
    firstMessage: "Hello, thanks for calling — this is Sophia, how may I direct your call?",
    systemPrompt: "You are Sophia, a professional virtual receptionist. Goal: greet the caller, answer simple questions, and route or take a message. Be polite, clear, and efficient.",
    endCallMessage: "Thank you for calling — have a great day!",
  },
  {
    key: "reactivation", role: "Reactivation", name: "Win-Back Specialist — Liam",
    description: "Re-engages cold or lapsed leads with a low-pressure check-in.",
    gender: "male", avatar: portrait("male", "reactivation"),
    model: DEFAULT_MODEL, voiceId: "pNInz6obpgDQGcFmaJgB",
    firstMessage: "Hey [Name], it's Liam — it's been a while, so I wanted to check in.",
    systemPrompt: "You are Liam, a friendly win-back specialist. Goal: reconnect with a lapsed lead and find out if there's renewed interest. Be casual and low-pressure. If they're interested, offer a quick next step. If not, thank them warmly.",
    endCallMessage: "No worries at all — great catching up. Take care!",
  },
  {
    key: "payments", role: "Payments", name: "Payment Reminder — Ava",
    description: "Politely reminds customers of due or overdue payments.",
    gender: "female", avatar: portrait("female", "payments"),
    model: DEFAULT_MODEL, voiceId: "FGY2WhTYpPnrIDTdsKH5",
    firstMessage: "Hi [Name], this is Ava calling with a quick reminder about your account.",
    systemPrompt: "You are Ava, a courteous payment-reminder assistant. Goal: remind the customer of an outstanding balance and offer to help them pay or set up a plan. Be respectful and never aggressive.",
    endCallMessage: "Thank you so much — appreciate your time today!",
  },
  {
    key: "feedback", role: "Feedback", name: "Survey Caller — Ethan",
    description: "Collects quick feedback or satisfaction ratings after a purchase.",
    gender: "male", avatar: portrait("male", "feedback"),
    model: DEFAULT_MODEL, voiceId: "TxGEqnHWrfWFTfGW9XjX",
    firstMessage: "Hi [Name], this is Ethan — do you have a minute to share quick feedback?",
    systemPrompt: "You are Ethan, a friendly survey caller. Goal: collect a satisfaction rating (1–10) and one piece of feedback. Keep it short and upbeat. Thank them sincerely.",
    endCallMessage: "Thanks for the feedback — it really helps. Have a great day!",
  },
];

export function agentFromTemplate(t: AgentTemplate): AIAgent {
  return {
    id: Date.now().toString(),
    name: t.name,
    description: t.description,
    gender: t.gender,
    avatar: t.avatar,
    model: t.model,
    voiceId: t.voiceId,
    firstMessage: t.firstMessage,
    systemPrompt: t.systemPrompt,
    endCallMessage: t.endCallMessage,
  };
}

const DEFAULTS: AIAgent[] = [
  agentFromTemplate({ ...AGENT_TEMPLATES[0] }),
  agentFromTemplate({ ...AGENT_TEMPLATES[1] }),
].map((a, i) => ({ ...a, id: String(i + 1) }));

export function getAgents(): AIAgent[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? (JSON.parse(stored) as AIAgent[]) : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveAgent(agent: AIAgent): void {
  const all = getAgents();
  const idx = all.findIndex(a => a.id === agent.id);
  if (idx >= 0) all[idx] = agent;
  else all.push(agent);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteAgent(id: string): void {
  const all = getAgents().filter(a => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
  // If we deleted the active agent, fall back to the first remaining one.
  if (getActiveAgentId() === id) {
    setActiveAgentId(all[0]?.id ?? "");
  }
}

export function createAgent(): AIAgent {
  return {
    id: Date.now().toString(),
    name: "New Agent",
    description: "",
    gender: "female",
    avatar: portrait("female", Date.now().toString()),
    model: DEFAULT_MODEL,
    voiceId: DEFAULT_VOICE,
    firstMessage: "Hi [Name], thanks for taking my call.",
    systemPrompt: "You are a helpful, concise voice assistant. Keep replies short and natural.",
    endCallMessage: "Thanks for your time. Have a great day!",
  };
}

export function getActiveAgentId(): string {
  if (typeof window === "undefined") return DEFAULTS[0].id;
  try {
    return localStorage.getItem(ACTIVE_KEY) || DEFAULTS[0].id;
  } catch {
    return DEFAULTS[0].id;
  }
}

export function setActiveAgentId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function getActiveAgent(): AIAgent | null {
  const all = getAgents();
  if (all.length === 0) return null;
  return all.find(a => a.id === getActiveAgentId()) ?? all[0];
}

// Map an agent into the inline assistant config Vapi expects (see
// /api/dialer/vapi). `leadName` personalises the [Name] placeholder.
export function toVapiAssistantConfig(agent: AIAgent, leadName?: string) {
  const firstName = leadName?.split(" ")[0] ?? "there";
  const firstMessage = agent.firstMessage.replace(/\[Name\]/g, firstName);
  return {
    model: {
      provider: "anthropic",
      model: agent.model,
      ...(agent.systemPrompt.trim()
        ? { messages: [{ role: "system", content: agent.systemPrompt.trim() }] }
        : {}),
    },
    voice: { provider: "11labs", voiceId: agent.voiceId },
    firstMessage,
    endCallMessage: agent.endCallMessage,
  };
}
