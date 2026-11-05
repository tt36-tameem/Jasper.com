"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Lead } from "@/components/leads/leads-table";

const STORAGE_KEY = "aura-imported-leads";

interface LeadsContextValue {
  importedLeads: Lead[];
  addLead: (lead: Lead) => void;
  addLeads: (leads: Lead[]) => void;
  removeLead: (id: string) => void;
}

const LeadsContext = createContext<LeadsContextValue>({
  importedLeads: [],
  addLead:    () => {},
  addLeads:   () => {},
  removeLead: () => {},
});

export function useImportedLeads() {
  return useContext(LeadsContext);
}

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [importedLeads, setImportedLeads] = useState<Lead[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setImportedLeads(JSON.parse(raw) as Lead[]);
    } catch {}
  }, []);

  function persist(leads: Lead[]) {
    setImportedLeads(leads);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); } catch {}
  }

  const addLead = useCallback((lead: Lead) => {
    setImportedLeads((prev) => {
      if (prev.some((l) => l.id === lead.id)) return prev;
      const next = [lead, ...prev];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const addLeads = useCallback((leads: Lead[]) => {
    setImportedLeads((prev) => {
      const existingIds = new Set(prev.map((l) => l.id));
      const fresh = leads.filter((l) => !existingIds.has(l.id));
      if (fresh.length === 0) return prev;
      const next = [...fresh, ...prev];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeLead = useCallback((id: string) => {
    setImportedLeads((prev) => {
      const next = prev.filter((l) => l.id !== id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <LeadsContext.Provider value={{ importedLeads, addLead, addLeads, removeLead }}>
      {children}
    </LeadsContext.Provider>
  );
}
