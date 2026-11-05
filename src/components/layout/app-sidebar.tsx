"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  UserRound,
  Columns2,
  Inbox,
  Workflow,
  PhoneCall,
  TrendingUp,
  Sun,
  Moon,
  Search as SearchIcon,
  ArrowLeft,
  ScanSearch,
  CalendarDays, CalendarCheck,
  Presentation,
  Wand2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  Plus,
  Building2,
  Megaphone,
  LayoutTemplate,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useBranding } from "@/components/providers/BrandingProvider";
import { useSidebar } from "@/components/providers/SidebarProvider";

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

type NavItem =
  | { divider: true }
  | { icon: React.ElementType; label: string; href: string; divider?: false };

const NAV_ITEMS: NavItem[] = [
  { icon: Home,         label: "Dashboard",    href: "/dashboard"    },
  { icon: UserRound,    label: "Leads",        href: "/leads"        },
  { icon: ScanSearch,   label: "Scrape",       href: "/scrape"       },
  { icon: Columns2,     label: "Pipeline",     href: "/pipeline"     },
  { divider: true },
  { icon: Inbox,        label: "Inbox",        href: "/inbox"        },
  { icon: Workflow,     label: "Automation",   href: "/automation"   },
  { icon: PhoneCall,    label: "Dialer",       href: "/dialer"       },
  { icon: Bot,          label: "AI Agents",    href: "/agents"       },
  { divider: true },
  { icon: TrendingUp,   label: "Reports",      href: "/reports"      },
  { icon: Megaphone,      label: "Advertising",  href: "/ads"      },
  { icon: LayoutTemplate, label: "Websites",   href: "/websites" },
  { icon: SearchIcon,     label: "Research",   href: "/research" },
  { divider: true },
  { icon: CalendarCheck,label: "Scheduler",    href: "/scheduler"    },
  { icon: CalendarDays, label: "Planner",      href: "/planner"      },
  { icon: Presentation, label: "Presentations",href: "/presentations"},
  { icon: Wand2,        label: "AI Studio",    href: "/images"       },
];

const ACCOUNTS = [
  { id: 1, name: "Jacsper",        role: "Owner",   color: "#7c3aed" },
  { id: 2, name: "Acme Agency",    role: "Admin",   color: "#0ea5e9" },
  { id: 3, name: "Studio Chen",    role: "Manager", color: "#10b981" },
]

export function AppSidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const navRef    = useRef<HTMLElement>(null);
  const itemRefs  = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill]               = useState({ top: 0, height: 36, opacity: 0 });
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState(ACCOUNTS[0]);
  const accountRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();
  const { branding, brandingReady } = useBranding();
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  const titleRef = useRef<HTMLParagraphElement>(null);
  const glowRef  = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!brandingReady || !titleRef.current || !glowRef.current) return;
    const el   = titleRef.current;
    const glow = glowRef.current;
    const h = branding.primaryColor.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const isMonoChrome = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) < 30;

    // Bounce in
    const bounce = el.animate([
      { opacity: 0, transform: 'translateY(8px) scale(0.93)' },
      { opacity: 1, transform: 'translateY(-2px) scale(1.04)' },
      { opacity: 1, transform: 'translateY(0px) scale(1)' },
    ], { duration: 550, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'none' });

    // Glow sweep left → right (colored only)
    let sweep: Animation | null = null;
    if (!isMonoChrome) {
      sweep = glow.animate([
        { clipPath: 'inset(0 100% 0 0)', opacity: 1, offset: 0    },
        { clipPath: 'inset(0 0% 0 0)',   opacity: 1, offset: 0.6  },
        { clipPath: 'inset(0 0% 0 0)',   opacity: 0, offset: 1    },
      ], { duration: 1200, delay: 450, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'none' });
    }

    return () => { bounce.cancel(); sweep?.cancel(); };
  }, [brandingReady, branding.primaryColor]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const brandIsDark = hexLuminance(branding.primaryColor) < 0.35;
  const isDarkMode  = theme === "dark";

  const activeIconColor = isDarkMode && brandIsDark ? "#e4e4e7" : branding.primaryColor;
  const pillBg          = isDarkMode && brandIsDark ? "rgba(63,63,70,0.9)" : undefined;
  const pillBorder      = isDarkMode && brandIsDark ? "rgba(161,161,170,0.25)" : `${branding.primaryColor}30`;

  const activeIndex = NAV_ITEMS.findIndex(
    (item) => !item.divider && (pathname === item.href || pathname.startsWith(item.href + "/"))
  );

  useEffect(() => {
    const nav  = navRef.current;
    const item = itemRefs.current[activeIndex];
    if (!nav || !item) { setPill((p) => ({ ...p, opacity: 0 })); return; }

    const navTop  = nav.getBoundingClientRect().top;
    const itemTop = item.getBoundingClientRect().top;

    setPill({
      top:     itemTop - navTop,
      height:  item.offsetHeight,
      opacity: 1,
    });
  }, [activeIndex, pathname, collapsed]);

  return (
    <aside
      data-sidebar
      className={cn(
        "fixed left-0 top-0 h-full flex flex-col z-50 py-4 transition-all duration-300",
        collapsed ? "w-14 items-center" : "w-44",
        "bg-white/70 dark:bg-zinc-900/80 backdrop-blur-2xl",
        "border-r border-zinc-200/60 dark:border-zinc-800",
        "shadow-[1px_0_24px_rgba(0,0,0,0.07)] dark:shadow-[1px_0_24px_rgba(0,0,0,0.35)]",
      )}
    >
      {/* Gloss highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent dark:from-white/4 dark:via-transparent" />

      {/* Collapse toggle — right edge */}
      <button
        onClick={toggleSidebar}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-5 h-5 rounded-full flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all hover:scale-110"
      >
        {collapsed
          ? <ChevronRight className="w-2.5 h-2.5" strokeWidth={2.5} />
          : <ChevronLeft  className="w-2.5 h-2.5" strokeWidth={2.5} />
        }
      </button>

      {/* Account switcher */}
      <div ref={accountRef} className={cn("relative z-[60] flex-shrink-0", collapsed ? "mb-4 px-1.5 w-full" : "mb-1.5 px-2")}>
        <button
          onClick={() => setAccountOpen(v => !v)}
          title={collapsed ? activeAccount.name : undefined}
          className={cn(
            "w-full rounded-xl transition-all duration-200 group",
            collapsed ? "flex justify-center h-9 px-0" : "flex flex-col items-center px-2.5 pt-2 pb-2.5 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50",
            accountOpen && !collapsed && "bg-zinc-100/70 dark:bg-zinc-800/50"
          )}
        >
          {/* Logo / avatar */}
          {branding.logoUrl && branding.logoUrl !== "" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt={branding.companyName} className="w-16 h-16 object-contain drop-shadow-sm flex-shrink-0 rounded-xl" />
          ) : (
            <span
              className="w-16 h-16 rounded-xl flex items-center justify-center text-[14px] font-bold text-white drop-shadow-sm flex-shrink-0"
              style={{ backgroundImage: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
            >
              {activeAccount.name.slice(0, 2).toUpperCase()}
            </span>
          )}

          {!collapsed && (
            <div className="flex items-center justify-center w-full mt-1.5 min-w-0 gap-1">
              <div className="min-w-0 text-center">
                <p
                  ref={titleRef}
                  className="text-[15px] font-medium tracking-tight leading-tight relative inline-block overflow-hidden"
                  style={!brandingReady ? {
                    backgroundImage: 'none',
                    WebkitBackgroundClip: 'unset',
                    backgroundClip: 'unset',
                    WebkitTextFillColor: 'unset',
                    color: 'transparent',
                  } : isDarkMode ? {
                    backgroundImage: 'none',
                    WebkitBackgroundClip: 'unset',
                    backgroundClip: 'unset',
                    WebkitTextFillColor: 'unset',
                    color: '#f4f4f5',
                  } : {
                    backgroundImage: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }}
                >
                  {activeAccount.name}
                  <span
                    ref={glowRef}
                    aria-hidden
                    className="absolute inset-0 pointer-events-none whitespace-nowrap"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                      filter: `drop-shadow(0 0 6px ${branding.primaryColor}cc) brightness(1.5)`,
                      opacity: 0,
                      clipPath: 'inset(0 100% 0 0)',
                    }}
                  >
                    {activeAccount.name}
                  </span>
                </p>
                <p className="text-[10px] text-zinc-400 truncate leading-tight">{activeAccount.role}</p>
              </div>
              <ChevronsUpDown className="w-3 h-3 text-zinc-400 flex-shrink-0 ml-1" strokeWidth={2} />
            </div>
          )}
        </button>

        {/* Dropdown */}
        {accountOpen && (
          <div className={cn(
            "absolute top-full mt-1.5 z-[100] w-56 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden",
            collapsed ? "left-full ml-2 top-0 mt-0" : "left-0"
          )}>
            {/* Header */}
            <div className="px-3 pt-3 pb-2">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Accounts</p>
            </div>

            {/* Account list */}
            <div className="px-1.5 pb-1.5 space-y-0.5">
              {ACCOUNTS.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => { setActiveAccount(acc); setAccountOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all group"
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ background: acc.color }}
                  >
                    {acc.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[12.5px] font-medium text-zinc-800 dark:text-zinc-100 truncate leading-tight">{acc.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate leading-tight">{acc.role}</p>
                  </div>
                  {activeAccount.id === acc.id && (
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-3" />

            {/* Add account */}
            <div className="px-1.5 py-1.5">
              <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2} />
                </span>
                <span className="text-[12.5px] font-medium text-zinc-600 dark:text-zinc-300">Add account</span>
              </button>
              <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
                </span>
                <span className="text-[12.5px] font-medium text-zinc-600 dark:text-zinc-300">Manage accounts</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Back button — hidden on dashboard */}
      {pathname !== '/dashboard' && (
        <button
          onClick={() => router.back()}
          title="Go back"
          className={cn(
            "relative z-10 w-full h-8 flex items-center rounded-lg mb-3 transition-all duration-200 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40",
            collapsed ? "justify-center px-0" : "gap-2 px-4"
          )}
        >
          <ArrowLeft className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={1.75} />
          {!collapsed && <span className="text-[12px]">Back</span>}
        </button>
      )}

      {/* Nav */}
      <nav ref={navRef} className={cn("relative flex-1 flex flex-col gap-0.5 w-full overflow-y-auto", collapsed ? "px-1.5" : "px-2")}>

        {/* Sliding active pill */}
        <span
          aria-hidden
          className="absolute left-0 right-0 mx-2 rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          style={{
            top:             pill.top,
            height:          pill.height,
            opacity:         pill.opacity,
            backgroundColor: pillBg ?? (isDarkMode ? "rgb(39,39,42)" : "#ffffff"),
            boxShadow:       `0 1px 4px rgba(0,0,0,0.10), inset 0 0 0 1px ${pillBorder}`,
          }}
        />

        {NAV_ITEMS.map((item, i) => {
          if (item.divider) {
            return (
              <div key={`divider-${i}`} className="mx-3 my-1.5 h-px bg-zinc-200 dark:bg-zinc-700/60" />
            );
          }
          const { icon: Icon, label, href } = item;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              ref={(el) => { itemRefs.current[i] = el; }}
              className={cn(
                "relative z-10 w-full h-9 flex items-center rounded-lg transition-all duration-200 group",
                collapsed ? "justify-center px-0" : "gap-2.5 px-3"
              )}
            >
              <Icon
                className={cn(
                  "w-[16px] h-[16px] flex-shrink-0 transition-all duration-200 active:scale-90",
                  !active && "text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                )}
                style={active ? { color: activeIconColor } : undefined}
                strokeWidth={active ? 2 : 1.5}
              />
              {!collapsed && (
                <span
                  className={cn(
                    "text-[12.5px] font-medium transition-colors duration-200 truncate",
                    active
                      ? "font-semibold"
                      : "text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200"
                  )}
                  style={active ? { color: activeIconColor } : undefined}
                >
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className={cn(
        "relative z-10 w-full pb-2 flex flex-col gap-0.5 border-t border-zinc-100/80 dark:border-zinc-800/60 pt-2 mt-1",
        collapsed ? "px-1.5 items-center" : "px-2"
      )}>

        {/* Theme toggle */}
        <button
          onClick={e => toggle({ x: e.clientX, y: e.clientY })}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={cn(
            "w-full h-9 flex items-center rounded-lg transition-all duration-200 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 group",
            collapsed ? "justify-center px-0" : "gap-2.5 px-3"
          )}
        >
          {theme === 'dark'
            ? <Sun  className="w-[16px] h-[16px] flex-shrink-0" strokeWidth={1.5} />
            : <Moon className="w-[16px] h-[16px] flex-shrink-0" strokeWidth={1.5} />
          }
          {!collapsed && (
            <span className="text-[12.5px] font-medium text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200 transition-colors">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          )}
        </button>

        {/* User avatar */}
        <Link
          href="/settings"
          title={collapsed ? "My Account" : undefined}
          className={cn(
            "w-full h-10 flex items-center rounded-lg transition-all duration-200",
            collapsed ? "justify-center px-0" : "gap-2.5 px-3",
            pathname === "/settings" ? "opacity-100" : "opacity-80 hover:opacity-100"
          )}
        >
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 ring-2 ring-white/30 dark:ring-zinc-700/60"
            style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
          >
            M
          </span>
          {!collapsed && (
            <span className="text-[12.5px] font-medium text-zinc-500 dark:text-zinc-400 truncate">My Account</span>
          )}
        </Link>

      </div>

    </aside>
  );
}
