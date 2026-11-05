import type { NodeType } from "./workflowStore";

export const INTEGRATION_STORAGE_KEY = "jacsper-integrations";

export type IntegrationStatus = "connected" | "disconnected" | "error";

export interface IntegrationAction {
  nodeType: NodeType;
  label: string;
  description: string;
}

export interface IntegrationMeta {
  id: string;
  name: string;
  category: string;
  logoSrc?: string;
  color: string;
  comingSoon?: boolean;
  actions: IntegrationAction[];
}

export const INTEGRATIONS_META: IntegrationMeta[] = [
  // ── Communication
  {
    id: "gmail", name: "Gmail", category: "Communication",
    logoSrc: "/logos/gmail.webp", color: "#EA4335",
    actions: [{ nodeType: "email", label: "Send Email via Gmail", description: "Send a tracked email from your Gmail account" }],
  },
  {
    id: "slack", name: "Slack", category: "Communication",
    logoSrc: "/logos/slack.png", color: "#4A154B",
    actions: [{ nodeType: "slack", label: "Post to Slack", description: "Send a message to a Slack channel" }],
  },
  {
    id: "whatsapp", name: "WhatsApp Business", category: "Communication",
    color: "#25D366",
    actions: [{ nodeType: "whatsapp", label: "Send WhatsApp Message", description: "Send a templated WhatsApp message" }],
  },

  // ── Social
  {
    id: "instagram", name: "Instagram", category: "Social",
    logoSrc: "/logos/instagram.avif", color: "#E1306C",
    actions: [
      { nodeType: "instagram",     label: "Send Instagram DM",     description: "Send a direct message on Instagram" },
      { nodeType: "ig_story",      label: "Plan Story with CTA",   description: "Script a story with a keyword DM trigger" },
      { nodeType: "ig_comment_dm", label: "Auto-DM Commenters",    description: "DM anyone who comments a keyword on your posts" },
    ],
  },
  {
    id: "facebook", name: "Facebook Pages", category: "Social",
    color: "#1877F2",
    actions: [{ nodeType: "facebook", label: "Send Facebook DM", description: "Send a Messenger message to a lead" }],
  },
  {
    id: "linkedin", name: "LinkedIn", category: "Social",
    logoSrc: "/logos/linkedin.png", color: "#0A66C2", comingSoon: true,
    actions: [{ nodeType: "linkedin_dm", label: "Send LinkedIn DM", description: "Send an outreach message on LinkedIn" }],
  },

  // ── Voice & Calling
  {
    id: "twilio", name: "Twilio", category: "Voice & Calling",
    logoSrc: "/logos/twilio.svg", color: "#F22F46",
    actions: [
      { nodeType: "sms",  label: "Send SMS via Twilio",   description: "Send an SMS from your Twilio number" },
      { nodeType: "call", label: "Make Call via Twilio",  description: "Initiate an outbound call via Twilio" },
    ],
  },
  {
    id: "vapi", name: "Vapi AI", category: "Voice & Calling",
    logoSrc: "/logos/vapi.svg", color: "#7C3AED",
    actions: [{ nodeType: "vapi_call", label: "AI Voice Call via Vapi", description: "Deploy an AI agent to call the lead" }],
  },

  // ── Productivity
  {
    id: "google-calendar", name: "Google Calendar", category: "Productivity",
    logoSrc: "/logos/google-calendar.svg", color: "#4285F4",
    actions: [{ nodeType: "calendar", label: "Create Calendar Event", description: "Book a meeting or event in Google Calendar" }],
  },
  {
    id: "notion", name: "Notion", category: "Productivity",
    logoSrc: "/logos/notion.png", color: "#000000", comingSoon: true,
    actions: [{ nodeType: "notion_page", label: "Create Notion Entry", description: "Add a row or page to a Notion database" }],
  },

  // ── Advertising
  {
    id: "google-ads", name: "Google Ads", category: "Advertising",
    logoSrc: "/logos/google-ads.png", color: "#4285F4",
    actions: [{ nodeType: "google_ads_audience", label: "Add to Google Ads Audience", description: "Add contact to a custom Google Ads audience" }],
  },
  {
    id: "meta-ads", name: "Meta Ads", category: "Advertising",
    logoSrc: "/logos/meta.avif", color: "#1877F2",
    actions: [{ nodeType: "meta_ads_audience", label: "Add to Meta Audience", description: "Add contact to a Meta custom audience" }],
  },

  // ── Automation
  {
    id: "zapier", name: "Zapier", category: "Automation",
    logoSrc: "/logos/zapier.png", color: "#FF4A00", comingSoon: true,
    actions: [{ nodeType: "zapier_trigger", label: "Trigger a Zap", description: "Fire a Zapier trigger to connect 6,000+ apps" }],
  },
  {
    id: "webhook", name: "Webhooks", category: "Automation",
    color: "#6366F1",
    actions: [{ nodeType: "webhook", label: "Send Webhook", description: "POST data to any external URL" }],
  },
];

export function getIntegrationStatuses(): Record<string, IntegrationStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(INTEGRATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
