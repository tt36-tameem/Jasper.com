"use client";

import { useState } from "react";
import {
  Star,
  UserPlus, MessageCircle, CheckCircle, XCircle,
  PhoneCall, Banknote, Trophy, CircleX, CalendarX,
  FileText, CircleCheck,
} from "lucide-react";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type LeadStatus =
  | "New" | "Contacted" | "Qualified" | "Proposal" | "Closed"
  | "Lost" | "Unqualified" | "Call Booked" | "Deposit" | "Won" | "No Show";

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  companySize: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  source: string;
  status: LeadStatus;
  value: string;
  lastActivity: string;
  about: string;
  tags: string[];
  messages?: number;
}

type StatusIconFC = React.FC<{ className?: string; strokeWidth?: number }>;

const STATUS_CONFIG: Record<LeadStatus, { Icon: StatusIconFC; iconBg: string; label: string }> = {
  New:           { Icon: UserPlus,      iconBg: "bg-orange-500",  label: "New lead"    },
  Contacted:     { Icon: MessageCircle, iconBg: "bg-emerald-500", label: "In contact"  },
  Qualified:     { Icon: CheckCircle,   iconBg: "bg-blue-500",    label: "Qualified"   },
  Proposal:      { Icon: FileText,      iconBg: "bg-orange-400",  label: "Proposal"    },
  Closed:        { Icon: CircleCheck,   iconBg: "bg-emerald-400", label: "Closed"      },
  Lost:          { Icon: CircleX,       iconBg: "bg-zinc-400",    label: "Lost"        },
  Unqualified:   { Icon: XCircle,       iconBg: "bg-red-500",     label: "Unqualified" },
  "Call Booked": { Icon: PhoneCall,     iconBg: "bg-violet-500",  label: "Call booked" },
  Deposit:       { Icon: Banknote,      iconBg: "bg-amber-500",   label: "Deposit"     },
  Won:           { Icon: Trophy,        iconBg: "bg-emerald-600", label: "Won"         },
  "No Show":     { Icon: CalendarX,     iconBg: "bg-orange-400",  label: "No show"     },
};

const DROPDOWN_TO_STATUS: Record<string, string> = {
  new:         "New",
  contacted:   "Contacted",
  qualified:   "Qualified",
  unqualified: "Unqualified",
  call_booked: "Call Booked",
  deposit:     "Deposit",
  won:         "Won",
  lost:        "Lost",
  no_show:     "No Show",
};

export const MOCK_LEADS: Lead[] = [
  {
    id: "1", name: "Sarah Mitchell", title: "VP of Sales",
    company: "Apex Realty Group", industry: "Real Estate", companySize: "51–200 employees",
    location: "Miami, FL", email: "sarah@apexrealty.com", phone: "+1 (555) 201-4400",
    linkedin: "linkedin.com/in/sarahmitchell", source: "Meta Ads", status: "Qualified", value: "$12,000", lastActivity: "2 min ago",
    about: "Sarah leads a 24-person sales team at Apex and has overseen $40M+ in closed deals. She's actively evaluating CRM platforms to replace their fragmented toolset and reduce manual data entry.",
    tags: ["Decision Maker", "Hot Lead"], messages: 12,
  },
  {
    id: "2", name: "James Thornton", title: "Director of Acquisitions",
    company: "BlueSky Properties", industry: "PropTech", companySize: "11–50 employees",
    location: "Austin, TX", email: "james@bluesky.io", phone: "+1 (555) 302-5511",
    linkedin: "linkedin.com/in/jamesthornton", source: "Referral", status: "Proposal", value: "$8,500", lastActivity: "14 min ago",
    about: "James oversees property acquisition strategy at BlueSky. Referred by a mutual contact, he's expressed strong interest in automating their outreach pipeline and reducing deal cycle time.",
    tags: ["Referral", "Warm Lead"], messages: 4,
  },
  {
    id: "3", name: "Priya Nair", title: "Managing Partner",
    company: "Summit Consulting LLC", industry: "Management Consulting", companySize: "11–50 employees",
    location: "New York, NY", email: "p.nair@summit.co", phone: "+1 (555) 410-6622",
    linkedin: "linkedin.com/in/priyanair", source: "Organic", status: "New", value: "$5,200", lastActivity: "1 hr ago",
    about: "Priya co-founded Summit Consulting in 2018 and serves mid-market B2B clients. She discovered Aura via organic search and is evaluating tools to streamline her team's lead qualification process.",
    tags: ["New Lead", "Inbound"], messages: 1,
  },
  {
    id: "4", name: "Omar Al-Rashid", title: "CEO",
    company: "Desert Peak Investments", industry: "Investment Management", companySize: "11–50 employees",
    location: "Dubai, UAE", email: "omar@desertpeak.ae", phone: "+1 (555) 503-7733",
    linkedin: "linkedin.com/in/omaralrashid", source: "LinkedIn", status: "Contacted", value: "$24,000", lastActivity: "3 hr ago",
    about: "Omar runs a boutique investment firm focused on MENA real estate and tech ventures. He was engaged via LinkedIn and is exploring CRM solutions to manage a growing portfolio of investor relationships.",
    tags: ["High Value", "Enterprise", "C-Suite"], messages: 9,
  },
  {
    id: "5", name: "Laura Chen", title: "Head of Growth",
    company: "Horizon Digital", industry: "Digital Agency", companySize: "11–50 employees",
    location: "San Francisco, CA", email: "lchen@horizondigital.co", phone: "+1 (555) 614-8844",
    linkedin: "linkedin.com/in/laurachen", source: "Google Ads", status: "Closed", value: "$6,800", lastActivity: "Yesterday",
    about: "Laura drives growth strategy at Horizon Digital and has scaled agency revenue 3× in two years. She closed with Aura after a short 2-week evaluation cycle.",
    tags: ["Closed Won", "Agency"], messages: 23,
  },
  {
    id: "6", name: "Marcus Webb", title: "Founder & Managing Attorney",
    company: "Webb & Associates", industry: "Legal Services", companySize: "2–10 employees",
    location: "Chicago, IL", email: "m.webb@webba.com", phone: "+1 (555) 705-9900",
    linkedin: "linkedin.com/in/marcuswebb", source: "Cold Email", status: "New", value: "$3,400", lastActivity: "Yesterday",
    about: "Marcus founded a boutique corporate law firm in 2020. He responded to a cold email campaign and is in early conversations about managing client intake and follow-up workflows.",
    tags: ["Cold Outreach", "SMB"], messages: 3,
  },
  {
    id: "7", name: "Fatima Al-Amin", title: "Chief Operations Officer",
    company: "Global Trade Partners", industry: "International Trade", companySize: "201–500 employees",
    location: "London, UK", email: "famin@gtp.org", phone: "+1 (555) 812-1100",
    linkedin: "linkedin.com/in/fatimaalamin", source: "Meta Ads", status: "Qualified", value: "$18,500", lastActivity: "2 days ago",
    about: "Fatima oversees operations across 12 countries for Global Trade Partners. She's leading a tech stack modernization initiative and is shortlisting CRM solutions for a Q3 rollout.",
    tags: ["Decision Maker", "High Value", "Enterprise"], messages: 7,
  },
  {
    id: "8", name: "Daniel Kowalski", title: "Senior Project Manager",
    company: "EuroBuild GmbH", industry: "Construction & Engineering", companySize: "201–500 employees",
    location: "Berlin, Germany", email: "d.kowalski@eurobuild.de", phone: "+1 (555) 901-2211",
    linkedin: "linkedin.com/in/danielkowalski", source: "Referral", status: "Lost", value: "$9,000", lastActivity: "2 days ago",
    about: "Daniel manages large-scale infrastructure projects at EuroBuild. The deal was ultimately lost to a competitor after a lengthy procurement process; re-engagement is planned for Q4.",
    tags: ["Lost", "Re-engage Q4"], messages: 0,
  },
  {
    id: "9", name: "Isabella Torres", title: "Marketing Director",
    company: "Sun Coast Media", industry: "Media & Publishing", companySize: "51–200 employees",
    location: "Mexico City, Mexico", email: "itarres@suncoast.mx", phone: "+1 (555) 100-3322",
    linkedin: "linkedin.com/in/isabellatorres", source: "Organic", status: "Contacted", value: "$4,700", lastActivity: "3 days ago",
    about: "Isabella oversees digital marketing for Sun Coast's portfolio of Spanish-language properties. She reached out via the website and is evaluating CRM options to manage influencer and media partner relationships.",
    tags: ["Inbound", "Marketing"], messages: 5,
  },
  {
    id: "10", name: "Ryan Fitzgerald", title: "General Partner",
    company: "Vertex Capital", industry: "Venture Capital", companySize: "2–10 employees",
    location: "Boston, MA", email: "rfitz@vertexcap.com", phone: "+1 (555) 200-4433",
    linkedin: "linkedin.com/in/ryanfitzgerald", source: "LinkedIn", status: "Proposal", value: "$31,000", lastActivity: "3 days ago",
    about: "Ryan leads deal sourcing and portfolio management at Vertex Capital. He's evaluating Aura as the firm's primary relationship management platform across ~60 active portfolio companies.",
    tags: ["High Value", "C-Suite", "VC"], messages: 18,
  },
  {
    id: "11", name: "Aisha Okonkwo", title: "Chief Technology Officer",
    company: "TechBridge Solutions", industry: "SaaS / Technology", companySize: "51–200 employees",
    location: "Lagos, Nigeria", email: "aokonkwo@techbridge.ng", phone: "+1 (555) 303-5544",
    linkedin: "linkedin.com/in/aishaokonkwo", source: "Cold Email", status: "New", value: "$7,200", lastActivity: "4 days ago",
    about: "Aisha leads product and engineering at TechBridge, a B2B SaaS company serving African SMEs. She's exploring CRM tooling for their sales expansion into West African enterprise accounts.",
    tags: ["C-Suite", "Tech", "Emerging Market"], messages: 2,
  },
  {
    id: "12", name: "Tom Brennan", title: "CEO & Co-Founder",
    company: "Pacific Ventures", industry: "Venture Studio", companySize: "11–50 employees",
    location: "Sydney, Australia", email: "tom@pacificv.com", phone: "+1 (555) 404-6655",
    linkedin: "linkedin.com/in/tombrennan", source: "Google Ads", status: "Closed", value: "$11,400", lastActivity: "4 days ago",
    about: "Tom co-founded Pacific Ventures, a venture studio that has launched 9 startups since 2017. He closed with Aura for portfolio-wide CRM management after a 3-week pilot.",
    tags: ["Closed Won", "Founder"], messages: 31,
  },
  {
    id: "13", name: "Sofia Andersen", title: "Head of Partnerships",
    company: "Nordic Growth Co", industry: "Growth Consulting", companySize: "2–10 employees",
    location: "Copenhagen, Denmark", email: "sofia@nordicgrowth.dk", phone: "+1 (555) 505-1122",
    linkedin: "linkedin.com/in/sofiaandersen", source: "LinkedIn", status: "Call Booked", value: "$15,000", lastActivity: "5 min ago",
    about: "Sofia leads strategic partnerships for Nordic Growth Co, working with mid-market SaaS companies across Scandinavia. Discovery call booked for this week; she's a strong fit for the growth plan.",
    tags: ["Hot Lead", "Call Booked"], messages: 6,
  },
  {
    id: "14", name: "Chen Wei", title: "General Partner",
    company: "Dragon Ventures", industry: "Venture Capital", companySize: "2–10 employees",
    location: "Shanghai, China", email: "chen@dragonv.cn", phone: "+1 (555) 606-2233",
    linkedin: "linkedin.com/in/chenwei", source: "Referral", status: "Won", value: "$42,000", lastActivity: "30 min ago",
    about: "Chen manages a $200M fund focused on Southeast Asian tech investments. He was referred by a portfolio founder and closed on our enterprise plan to manage LP relationships and deal flow.",
    tags: ["Won", "Enterprise", "High Value"], messages: 44,
  },
  {
    id: "15", name: "Emma Johansson", title: "Director of Sales",
    company: "Scandinavian Exports AB", industry: "International Trade", companySize: "51–200 employees",
    location: "Stockholm, Sweden", email: "emma@sca-exports.se", phone: "+1 (555) 707-3344",
    linkedin: "linkedin.com/in/emmajohansson", source: "Cold Email", status: "Deposit", value: "$9,500", lastActivity: "2 hr ago",
    about: "Emma oversees B2B sales across 8 European markets for Scandinavian Exports. She's placed a deposit while finalising procurement approval; contract expected this week.",
    tags: ["Deposit Paid", "Europe"], messages: 11,
  },
  {
    id: "16", name: "Hassan Al-Farsi", title: "Regional Sales Manager",
    company: "Gulf Bridge Trading", industry: "Wholesale / Distribution", companySize: "51–200 employees",
    location: "Abu Dhabi, UAE", email: "hassan@gulfbridge.ae", phone: "+1 (555) 808-4455",
    linkedin: "linkedin.com/in/hassanalfarsi", source: "Meta Ads", status: "Unqualified", value: "$2,800", lastActivity: "4 hr ago",
    about: "Hassan manages regional accounts at Gulf Bridge but has limited budget authority. The account was marked unqualified after discovery — recommend revisiting if a C-level champion emerges.",
    tags: ["Unqualified", "Revisit"], messages: 0,
  },
  {
    id: "17", name: "Mia Kowalczyk", title: "Digital Marketing Manager",
    company: "Warsaw Digital", industry: "Digital Agency", companySize: "11–50 employees",
    location: "Warsaw, Poland", email: "mia@warsawdigital.pl", phone: "+1 (555) 909-5566",
    linkedin: "linkedin.com/in/miakowalczyk", source: "Google Ads", status: "No Show", value: "$6,200", lastActivity: "Yesterday",
    about: "Mia manages paid acquisition and CRM operations at Warsaw Digital. She missed the scheduled demo — a follow-up has been sent and a second call is being arranged for next week.",
    tags: ["No Show", "Follow-up Needed"], messages: 3,
  },
];

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360;
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold text-white flex-shrink-0"
      style={{ backgroundColor: `hsl(${hue} 55% 52%)` }}
    >
      {initials}
    </span>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const { Icon, iconBg, label } = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0", iconBg)}>
        <Icon className="w-3 h-3 text-white" strokeWidth={2} />
      </span>
      <span className="text-[13px] text-zinc-600 dark:text-zinc-400">{label}</span>
    </span>
  );
}

interface LeadsTableProps {
  filterStatus?: string;
  filterStatuses?: string[];
  onLeadClick?: (lead: Lead) => void;
  extraLeads?: Lead[];
}

export function LeadsTable({
  filterStatus = "all",
  filterStatuses = [],
  onLeadClick,
  extraLeads = [],
}: LeadsTableProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const { branding } = useBranding();
  const TOTAL_PAGES = 24;

  function toggleFavorite(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allLeads = [...MOCK_LEADS, ...extraLeads];
  const dropdownStatuses = filterStatuses.map(f => DROPDOWN_TO_STATUS[f]).filter(Boolean);

  const filtered = allLeads.filter(lead => {
    if (dropdownStatuses.length > 0) return dropdownStatuses.includes(lead.status);
    return filterStatus === "all" || lead.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 px-3" />
            <TableHead className="w-[220px]">Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">Messages</TableHead>
            <TableHead className="text-right">Last Activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((lead) => {
            const starred = favorites.has(lead.id);
            return (
              <TableRow
                key={lead.id}
                className="group cursor-pointer"
                onClick={() => onLeadClick?.(lead)}
              >
                {/* Star */}
                <TableCell className="px-3">
                  <button
                    onClick={(e) => toggleFavorite(lead.id, e)}
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded transition-all duration-150",
                      starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    title={starred ? "Remove from favourites" : "Add to favourites"}
                  >
                    <Star
                      className={cn(
                        "w-[14px] h-[14px] transition-all duration-150",
                        starred
                          ? "fill-amber-400 text-amber-400 scale-110"
                          : "text-zinc-300 hover:text-amber-400"
                      )}
                      strokeWidth={starred ? 0 : 1.5}
                    />
                  </button>
                </TableCell>

                {/* Name */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={lead.name} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                        {lead.name}
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-snug truncate">{lead.email}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-[13px] text-zinc-600 dark:text-zinc-400">{lead.company}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[12px] text-zinc-400">{lead.source}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{lead.value}</span>
                </TableCell>
                <TableCell className="text-right">
                  {lead.messages != null && lead.messages > 0 ? (
                    <span
                      className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-bold text-white px-1.5 tabular-nums"
                      style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` }}
                    >
                      {lead.messages > 99 ? "99+" : lead.messages > 9 ? `${lead.messages}` : lead.messages}
                    </span>
                  ) : (
                    <span className="text-[12px] text-zinc-300 dark:text-zinc-700">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-[12px] text-zinc-400">{lead.lastActivity}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[12px] text-zinc-400 flex items-center gap-2">
          Showing {filtered.length} of {292 + extraLeads.length} leads
          {favorites.size > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
              <Star className="w-3 h-3 fill-amber-400" strokeWidth={0} />
              {favorites.size} starred
            </span>
          )}
        </p>

        <Pagination className="w-auto mx-0">
          <PaginationContent className="gap-0.5">
            <PaginationItem>
              <PaginationPrevious
                text=""
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)); }}
                className={cn(
                  "h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors",
                  currentPage === 1 && "pointer-events-none opacity-40"
                )}
              />
            </PaginationItem>

            {[1, 2, 3].map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === page}
                  onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                  className={cn(
                    "h-8 w-8 rounded-lg text-[12px] font-medium transition-colors",
                    currentPage === page
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                      : "border-transparent text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationEllipsis className="text-zinc-400 w-8 h-8" />
            </PaginationItem>

            <PaginationItem>
              <PaginationLink
                href="#"
                isActive={currentPage === TOTAL_PAGES}
                onClick={(e) => { e.preventDefault(); setCurrentPage(TOTAL_PAGES); }}
                className={cn(
                  "h-8 w-8 rounded-lg text-[12px] font-medium transition-colors",
                  currentPage === TOTAL_PAGES
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                    : "border-transparent text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                {TOTAL_PAGES}
              </PaginationLink>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext
                text=""
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1)); }}
                className={cn(
                  "h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors",
                  currentPage === TOTAL_PAGES && "pointer-events-none opacity-40"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
