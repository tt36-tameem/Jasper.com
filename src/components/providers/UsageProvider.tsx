"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  PLAN,
  getUsage,
  getPurchased,
  checkMeter,
  recordUsage,
  addBoost,
  type MeterKey,
  type MeterResult,
} from "@/lib/usageStore";

interface UsageContextValue {
  usage: Record<MeterKey, number>;
  purchased: Record<MeterKey, number>;
  plan: typeof PLAN;
  /** Consume one unit of a meter. Returns allowed:false (without recording) when over the cap. */
  meter: (key: MeterKey, amount?: number) => MeterResult;
  /** Peek at a meter without consuming. */
  check: (key: MeterKey) => MeterResult;
  /** Apply a boost (adds usage to every meter) after a successful purchase. */
  buyBoost: (mult: number) => void;
}

const ZERO: Record<MeterKey, number> = {
  sites: 0, scrapes: 0, research: 0, voiceMinutes: 0, emails: 0,
};

const UsageContext = createContext<UsageContextValue>({
  usage: ZERO,
  purchased: ZERO,
  plan: PLAN,
  meter: () => ({ allowed: true, used: 0, limit: 0, remaining: 0 }),
  check: () => ({ allowed: true, used: 0, limit: 0, remaining: 0 }),
  buyBoost: () => {},
});

export function useUsage() {
  return useContext(UsageContext);
}

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const [usage, setUsage] = useState<Record<MeterKey, number>>(ZERO);
  const [purchased, setPurchased] = useState<Record<MeterKey, number>>(ZERO);

  // Hydrate from localStorage on mount (and pick up a monthly reset).
  useEffect(() => { setUsage(getUsage()); setPurchased(getPurchased()); }, []);

  const meter = useCallback((key: MeterKey, amount = 1): MeterResult => {
    const result = recordUsage(key, amount);
    if (result.allowed) setUsage(getUsage());
    return result;
  }, []);

  const check = useCallback((key: MeterKey) => checkMeter(key), []);

  const buyBoost = useCallback((mult: number) => {
    setPurchased(addBoost(mult));
  }, []);

  return (
    <UsageContext.Provider value={{ usage, purchased, plan: PLAN, meter, check, buyBoost }}>
      {children}
    </UsageContext.Provider>
  );
}
