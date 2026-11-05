"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User, Bell, CreditCard, Plug, Shield, Palette, ChevronRight, Phone, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useBranding } from "@/components/providers/BrandingProvider";

export default function SettingsPage() {
  const { branding } = useBranding();
  const [connectedCount, setConnectedCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("jacsper-integrations");
      if (raw) {
        const statuses = JSON.parse(raw) as Record<string, string>;
        setConnectedCount(Object.values(statuses).filter((s) => s === "connected").length);
      }
    } catch {}
  }, []);

  const integrationsBadge = connectedCount > 0 ? `${connectedCount} connected` : null;

  const SECTIONS = [
    {
      title: "Account",
      items: [
        { icon: User,    label: "Profile",       description: "Name, email, timezone",           href: null,                    badge: null              },
        { icon: Bell,    label: "Notifications",  description: "Email, SMS, and push alerts",     href: null,                    badge: null              },
        { icon: Shield,  label: "Security",       description: "Password, 2FA, sessions",         href: null,                    badge: null              },
      ],
    },
    {
      title: "Workspace",
      items: [
        { icon: Palette,    label: "Branding",       description: "Logo, company name, colors",      href: "/settings/branding",      badge: branding.configured ? null : "Set up"  },
        { icon: CreditCard, label: "Billing & Plan",  description: "Current plan, invoices, usage",   href: null,                    badge: "Pro"                                  },
        { icon: Plug,       label: "Integrations",    description: "Connect Gmail, Slack, Twilio, and more", href: "/settings/integrations", badge: integrationsBadge },
        { icon: Phone,      label: "Phone Numbers",   description: "Buy and manage dialer numbers — $1/mo", href: "/settings/numbers",       badge: null              },
      ],
    },
    {
      title: "AI",
      items: [
        { icon: Sparkles, label: "System Prompt", description: "Tell the AI about your business for personalised responses", href: "/settings/ai", badge: branding.systemPrompt ? "Configured" : "Set up" },
      ],
    },
  ];

  return (
    <div className="px-8 py-7 max-w-[680px]">
      <PageHeader
        title="Settings"
        description="Manage your account, workspace, and integrations."
      />

      <div className="flex flex-col gap-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
              {section.title}
            </p>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800/60 overflow-hidden">
              {section.items.map((item) => {
                const Inner = (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-zinc-500" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{item.label}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{item.description}</p>
                    </div>
                    {item.badge && (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
                  </>
                );

                const cls = "w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors text-left";

                return item.href ? (
                  <Link key={item.label} href={item.href} className={cls}>
                    {Inner}
                  </Link>
                ) : (
                  <button key={item.label} className={cls}>
                    {Inner}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
