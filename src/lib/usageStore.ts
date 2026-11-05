// Usage metering for the single launch plan ("Founding" — $74/mo, everything
// included with fair-use caps) plus pay-as-you-go credit top-ups. localStorage
// based with an automatic monthly reset, following the same pattern as
// workflowStore / scheduleStore.
//
// NOTE: this is the initial client-side meter — enough to enforce fair-use
// limits, sell top-ups, and surface usage in the UI for launch. It is
// bypassable by design (no accounts yet); real enforcement + real charging
// need server-side accounts + Stripe.

export type MeterKey = "sites" | "scrapes" | "research" | "voiceMinutes" | "emails";

export interface Plan {
  name: string;
  price: number;
  limits: Record<MeterKey, number>;
}

// The single founding plan. Generous enough that ~95% of users never hit a cap,
// tight enough that an outlier can't sink the margin (see pricing rationale).
export const PLAN: Plan = {
  name: "Founding",
  price: 74,
  limits: {
    sites: 25,
    scrapes: 300,
    research: 150,
    voiceMinutes: 500,
    emails: 2000,
  },
};

export const METER_LABELS: Record<MeterKey, string> = {
  sites: "AI websites",
  scrapes: "Leads scraped",
  research: "Research queries",
  voiceMinutes: "Voice minutes",
  emails: "Emails sent",
};

// Top-up boosts — one purchase adds usage to EVERY meter at once, so users
// aren't paying per-feature. Each tier is a multiple of the $15 starter bundle;
// bigger tiers give proportionally more for better value.
export const METER_UNIT: Record<MeterKey, string> = {
  sites: "websites", scrapes: "leads", research: "queries",
  voiceMinutes: "voice min", emails: "emails",
};

// What a $15 starter boost adds to each meter.
export const BOOST_BASE: Record<MeterKey, number> = {
  sites: 10, scrapes: 150, research: 75, voiceMinutes: 200, emails: 1500,
};

export interface BoostTier {
  price: number;
  mult: number;
  label: string;
  popular?: boolean;
}

export const BOOST_TIERS: BoostTier[] = [
  { price: 15, mult: 1,   label: "Starter boost" },
  { price: 30, mult: 2.2, label: "Growth boost", popular: true },
  { price: 60, mult: 5,   label: "Scale boost" },
];

/** Credits a given boost tier adds to each meter. */
export function boostCredits(mult: number): Record<MeterKey, number> {
  return {
    sites:        Math.round(BOOST_BASE.sites * mult),
    scrapes:      Math.round(BOOST_BASE.scrapes * mult),
    research:     Math.round(BOOST_BASE.research * mult),
    voiceMinutes: Math.round(BOOST_BASE.voiceMinutes * mult),
    emails:       Math.round(BOOST_BASE.emails * mult),
  };
}

export interface MeterResult {
  allowed: boolean;
  used: number;
  limit: number;      // effective limit (plan + purchased)
  remaining: number;
}

const KEY = "aura_usage";

interface UsageData {
  period: string; // "YYYY-MM" — counters reset when this rolls over
  counts: Record<MeterKey, number>;
  purchased: Record<MeterKey, number>; // extra credits bought; persist across months
}

const ZERO: Record<MeterKey, number> = {
  sites: 0, scrapes: 0, research: 0, voiceMinutes: 0, emails: 0,
};

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function read(): UsageData {
  const period = currentPeriod();
  const fresh: UsageData = { period, counts: { ...ZERO }, purchased: { ...ZERO } };
  if (typeof window === "undefined") return fresh;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<UsageData>;
      const purchased = { ...ZERO, ...(data.purchased ?? {}) };
      if (data.period === period) {
        return { period, counts: { ...ZERO, ...(data.counts ?? {}) }, purchased };
      }
      // Month rolled over: reset monthly usage, but carry purchased credits
      // forward minus whatever overage they already covered last month.
      const carried = { ...ZERO };
      for (const k of Object.keys(ZERO) as MeterKey[]) {
        const overage = Math.max(0, (data.counts?.[k] ?? 0) - PLAN.limits[k]);
        carried[k] = Math.max(0, purchased[k] - overage);
      }
      const rolled: UsageData = { period, counts: { ...ZERO }, purchased: carried };
      write(rolled);
      return rolled;
    }
  } catch {}
  return fresh;
}

function write(data: UsageData) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

function effectiveLimit(data: UsageData, key: MeterKey): number {
  return PLAN.limits[key] + (data.purchased[key] ?? 0);
}

/** Current counts for the active billing period. */
export function getUsage(): Record<MeterKey, number> {
  return read().counts;
}

/** Extra credits the user has bought (added on top of the plan limits). */
export function getPurchased(): Record<MeterKey, number> {
  return read().purchased;
}

/** Peek at a meter without consuming. */
export function checkMeter(key: MeterKey): MeterResult {
  const data = read();
  const used = data.counts[key];
  const limit = effectiveLimit(data, key);
  return { allowed: used < limit, used, limit, remaining: Math.max(0, limit - used) };
}

/**
 * Consume `amount` of a meter. If it would exceed the effective limit (plan +
 * purchased), nothing is recorded and `allowed` is false.
 */
export function recordUsage(key: MeterKey, amount = 1): MeterResult {
  const data = read();
  const limit = effectiveLimit(data, key);
  const used = data.counts[key];
  if (used + amount > limit) {
    return { allowed: false, used, limit, remaining: Math.max(0, limit - used) };
  }
  data.counts[key] = used + amount;
  write(data);
  return { allowed: true, used: data.counts[key], limit, remaining: limit - data.counts[key] };
}

/** Grant top-up credits for a single meter. */
export function addCredits(key: MeterKey, amount: number): Record<MeterKey, number> {
  const data = read();
  data.purchased[key] = (data.purchased[key] ?? 0) + amount;
  write(data);
  return data.purchased;
}

/** Grant a boost — adds usage to every meter at once (after a purchase). */
export function addBoost(mult: number): Record<MeterKey, number> {
  const data = read();
  const credits = boostCredits(mult);
  for (const k of Object.keys(ZERO) as MeterKey[]) {
    data.purchased[k] = (data.purchased[k] ?? 0) + credits[k];
  }
  write(data);
  return data.purchased;
}
