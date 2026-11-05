"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, ExternalLink, Zap, RefreshCw, AlertCircle
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { INTEGRATION_STORAGE_KEY } from "@/lib/integrationStore";

/* ─── Integration registry ──────────────────────────────────────────── */
type Status = "connected" | "disconnected" | "error";

interface Integration {
  id:          string;
  name:        string;
  description: string;
  category:    string;
  authType:    "oauth" | "apikey" | "webhook";
  docsUrl:     string;
  /** SVG path data or emoji fallback */
  logo:        React.ReactNode;
  comingSoon?: boolean;
}

const INTEGRATIONS: Integration[] = [
  // ── Communication
  {
    id: "gmail", name: "Gmail", category: "Communication",
    description: "Send and receive emails, track opens, and log conversations to leads.",
    authType: "oauth", docsUrl: "https://developers.google.com/gmail/api",
    logo: <GmailLogo />,
  },
  {
    id: "slack", name: "Slack", category: "Communication",
    description: "Get deal alerts, assign tasks, and push CRM updates to Slack channels.",
    authType: "oauth", docsUrl: "https://api.slack.com/",
    logo: <SlackLogo />,
  },
  {
    id: "whatsapp", name: "WhatsApp Business", category: "Communication",
    description: "Send templated messages and manage WhatsApp threads directly in Inbox.",
    authType: "apikey", docsUrl: "https://developers.facebook.com/docs/whatsapp",
    logo: <WhatsAppLogo />,
  },

  // ── Social
  {
    id: "instagram", name: "Instagram", category: "Social",
    description: "Manage DMs, respond to comments, and capture leads from Instagram.",
    authType: "oauth", docsUrl: "https://developers.facebook.com/docs/instagram-api",
    logo: <InstagramLogo />,
  },
  {
    id: "facebook", name: "Facebook Pages", category: "Social",
    description: "Sync Facebook lead forms and manage page DMs and comments.",
    authType: "oauth", docsUrl: "https://developers.facebook.com/docs/pages-api",
    logo: <FacebookLogo />,
  },
  {
    id: "linkedin", name: "LinkedIn", category: "Social",
    description: "Import connections, track engagement, and manage LinkedIn outreach.",
    authType: "oauth", docsUrl: "https://learn.microsoft.com/en-us/linkedin/",
    logo: <LinkedInLogo />,
    comingSoon: true,
  },

  // ── Voice & Calling
  {
    id: "twilio", name: "Twilio", category: "Voice & Calling",
    description: "Power the dialer with inbound/outbound calls, SMS, and voicemail drops.",
    authType: "apikey", docsUrl: "https://www.twilio.com/docs",
    logo: <TwilioLogo />,
  },
  {
    id: "vapi", name: "Vapi", category: "Voice & Calling",
    description: "Deploy AI voice agents for outbound sales calls and appointment booking.",
    authType: "apikey", docsUrl: "https://docs.vapi.ai/",
    logo: <VapiLogo />,
  },

  // ── Productivity
  {
    id: "google-calendar", name: "Google Calendar", category: "Productivity",
    description: "Sync call bookings, follow-ups, and meetings with your calendar.",
    authType: "oauth", docsUrl: "https://developers.google.com/calendar",
    logo: <CalendarLogo />,
  },
  {
    id: "notion", name: "Notion", category: "Productivity",
    description: "Push deal notes, client briefs, and meeting summaries to Notion pages.",
    authType: "oauth", docsUrl: "https://developers.notion.com/",
    logo: <NotionLogo />,
    comingSoon: true,
  },

  // ── Advertising
  {
    id: "google-ads", name: "Google Ads", category: "Advertising",
    description: "Import leads from Google lead forms and track ad-to-close attribution.",
    authType: "oauth", docsUrl: "https://developers.google.com/google-ads/api",
    logo: <GoogleAdsLogo />,
  },
  {
    id: "meta-ads", name: "Meta Ads", category: "Advertising",
    description: "Pull leads from Meta lead gen campaigns directly into the pipeline.",
    authType: "oauth", docsUrl: "https://developers.facebook.com/docs/marketing-api",
    logo: <MetaAdsLogo />,
  },
  {
    id: "tiktok-ads", name: "TikTok Ads", category: "Advertising",
    description: "Sync TikTok campaign performance and pull leads from TikTok lead gen forms.",
    authType: "oauth", docsUrl: "https://ads.tiktok.com/marketing_api/docs",
    logo: <TikTokAdsLogo />,
  },
  {
    id: "linkedin-ads", name: "LinkedIn Ads", category: "Advertising",
    description: "Import LinkedIn lead gen form submissions and track B2B campaign ROI.",
    authType: "oauth", docsUrl: "https://learn.microsoft.com/en-us/linkedin/marketing",
    logo: <LinkedInLogo />,
  },

  // ── Automation
  {
    id: "zapier", name: "Zapier", category: "Automation",
    description: "Connect Jacsper to 6,000+ apps with no-code triggers and actions.",
    authType: "apikey", docsUrl: "https://zapier.com/apps",
    logo: <ZapierLogo />,
    comingSoon: true,
  },
  {
    id: "webhook", name: "Webhooks", category: "Automation",
    description: "Send real-time event payloads to any URL when deals move or leads are added.",
    authType: "webhook", docsUrl: "#",
    logo: <WebhookLogo />,
  },
];

const CATEGORIES = Array.from(new Set(INTEGRATIONS.map((i) => i.category)));

const STORAGE_KEY = INTEGRATION_STORAGE_KEY;

/* ─── Main page ─────────────────────────────────────────────────────── */
export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [apiKeyModal, setApiKeyModal] = useState<Integration | null>(null);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStatuses(JSON.parse(raw));
    } catch {}
  }, []);

  function saveStatuses(next: Record<string, Status>) {
    setStatuses(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function handleConnect(integration: Integration) {
    if (integration.comingSoon) return;
    if (integration.authType === "oauth") {
      // In production: redirect to /api/auth/connect/[id] which starts the OAuth flow
      // For now, simulate a successful connection after a short delay
      setConnecting(integration.id);
      setTimeout(() => {
        saveStatuses({ ...statuses, [integration.id]: "connected" });
        setConnecting(null);
      }, 1800);
    } else if (integration.authType === "apikey" || integration.authType === "webhook") {
      setApiKeyModal(integration);
      setApiKey("");
    }
  }

  function handleApiKeySave() {
    if (!apiKeyModal || !apiKey.trim()) return;
    saveStatuses({ ...statuses, [apiKeyModal.id]: "connected" });
    setApiKeyModal(null);
    setApiKey("");
  }

  function handleDisconnect(id: string) {
    const next = { ...statuses };
    delete next[id];
    saveStatuses(next);
  }

  const connectedCount = Object.values(statuses).filter((s) => s === "connected").length;

  return (
    <div className="px-8 py-7 max-w-[800px]">
      <PageHeader
        title="Integrations"
        count={connectedCount || undefined}
        description="Connect your tools to automate workflows and keep everything in sync."
      />

      <div className="flex flex-col gap-8">
        {CATEGORIES.map((cat) => {
          const items = INTEGRATIONS.filter((i) => i.category === cat);
          return (
            <div key={cat}>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                {cat}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {items.map((integration) => {
                  const status = statuses[integration.id] ?? "disconnected";
                  const isConnecting = connecting === integration.id;
                  return (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      status={status}
                      isConnecting={isConnecting}
                      onConnect={() => handleConnect(integration)}
                      onDisconnect={() => handleDisconnect(integration.id)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* API key / webhook modal */}
      {apiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApiKeyModal(null)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                {apiKeyModal.logo}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
                  Connect {apiKeyModal.name}
                </p>
                <p className="text-[11px] text-zinc-400 capitalize">{apiKeyModal.authType}</p>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {apiKeyModal.authType === "webhook"
                  ? "Enter the URL to send event payloads to. We'll POST JSON on every trigger."
                  : `Enter your ${apiKeyModal.name} API key. Find it in your ${apiKeyModal.name} developer settings.`}
              </p>
            </div>

            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
              {apiKeyModal.authType === "webhook" ? "Webhook URL" : "API Key"}
            </label>
            <input
              type={apiKeyModal.authType === "webhook" ? "url" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleApiKeySave(); }}
              placeholder={apiKeyModal.authType === "webhook" ? "https://your-server.com/webhook" : "sk_live_••••••••••••••••"}
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 mb-4"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => setApiKeyModal(null)}
                className="flex-1 py-2 rounded-xl text-[13px] text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApiKeySave}
                disabled={!apiKey.trim()}
                className="flex-1 py-2 rounded-xl text-[13px] font-semibold brand-btn disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save & Connect
              </button>
            </div>

            <a
              href={apiKeyModal.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 mt-3 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {apiKeyModal.name} documentation
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Integration card ───────────────────────────────────────────────── */
function IntegrationCard({
  integration, status, isConnecting, onConnect, onDisconnect,
}: {
  integration:  Integration;
  status:       Status;
  isConnecting: boolean;
  onConnect:    () => void;
  onDisconnect: () => void;
}) {
  const connected = status === "connected";
  const errored   = status === "error";

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl border bg-white dark:bg-zinc-900 transition-all",
      connected
        ? "border-zinc-100 dark:border-zinc-800"
        : "border-zinc-100 dark:border-zinc-800",
    )}>
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {integration.logo}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">
            {integration.name}
          </p>
          {integration.comingSoon && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
              Soon
            </span>
          )}
          {connected && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
              Connected
            </span>
          )}
          {errored && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
              <XCircle className="w-3 h-3" strokeWidth={2} />
              Error — reconnect
            </span>
          )}
        </div>
        <p className="text-[12px] text-zinc-400 leading-relaxed">{integration.description}</p>
      </div>

      {/* Auth type badge */}
      <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:block capitalize">
        {integration.authType === "oauth" ? "OAuth" : integration.authType === "apikey" ? "API Key" : "Webhook"}
      </span>

      {/* Action */}
      {connected ? (
        <button
          onClick={onDisconnect}
          className="flex-shrink-0 h-8 px-3.5 rounded-lg text-[12px] font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800/40 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
        >
          Disconnect
        </button>
      ) : integration.comingSoon ? (
        <button
          disabled
          className="flex-shrink-0 h-8 px-3.5 rounded-lg text-[12px] font-medium border border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
        >
          Soon
        </button>
      ) : (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="flex-shrink-0 h-8 px-3.5 rounded-lg text-[12px] font-semibold brand-btn flex items-center gap-1.5 disabled:opacity-70"
        >
          {isConnecting
            ? <><RefreshCw className="w-3 h-3 animate-spin" /> Connecting…</>
            : integration.authType === "oauth" ? "Connect" : "Configure"
          }
        </button>
      )}
    </div>
  );
}

/* ─── Logos ──────────────────────────────────────────────────────────── */
function ImgLogo({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-6 h-6 object-contain"/>;
}

function GmailLogo()    { return <ImgLogo src="/logos/gmail.webp"           alt="Gmail"/>; }
function SlackLogo()    { return <ImgLogo src="/logos/slack.png"            alt="Slack"/>; }
function InstagramLogo(){ return <ImgLogo src="/logos/instagram.avif"       alt="Instagram"/>; }
function TwilioLogo()   { return <ImgLogo src="/logos/twilio.svg"           alt="Twilio"/>; }
function VapiLogo()     { return <ImgLogo src="/logos/vapi.svg"             alt="Vapi"/>; }
function CalendarLogo() { return <ImgLogo src="/logos/google-calendar.svg"  alt="Google Calendar"/>; }
function GoogleAdsLogo(){ return <ImgLogo src="/logos/google-ads.png"       alt="Google Ads"/>; }
function MetaAdsLogo()  { return <ImgLogo src="/logos/meta.avif"            alt="Meta"/>; }
function TikTokAdsLogo(){ return <ImgLogo src="/logos/tiktok.svg" alt="TikTok Ads" />; }
function ZapierLogo()   { return <ImgLogo src="/logos/zapier.png"           alt="Zapier"/>; }
function LinkedInLogo() { return <ImgLogo src="/logos/linkedin.png"         alt="LinkedIn"/>; }

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" fill="#25D366"/>
    </svg>
  );
}
function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
    </svg>
  );
}
function NotionLogo() { return <ImgLogo src="/logos/notion.png" alt="Notion"/>; }
function WebhookLogo() {
  return (
    <div className="w-6 h-6 flex items-center justify-center">
      <Zap className="w-4 h-4 text-zinc-600 dark:text-zinc-400" strokeWidth={2} />
    </div>
  );
}
