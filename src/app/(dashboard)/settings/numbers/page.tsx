"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Search, Phone, Plus, Trash2, RefreshCw, CheckCircle2,
  Globe, Loader2, AlertCircle, Zap, MessageSquare, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/providers/BrandingProvider";

const STORAGE_KEY = "aura_owned_numbers";
const COUNTRIES = [
  { code: "US", label: "🇺🇸 United States" },
  { code: "GB", label: "🇬🇧 United Kingdom" },
  { code: "CA", label: "🇨🇦 Canada" },
  { code: "AU", label: "🇦🇺 Australia" },
  { code: "DE", label: "🇩🇪 Germany" },
  { code: "FR", label: "🇫🇷 France" },
  { code: "NL", label: "🇳🇱 Netherlands" },
  { code: "SE", label: "🇸🇪 Sweden" },
  { code: "AE", label: "🇦🇪 UAE" },
];

interface AvailableNumber {
  phone_number: string;
  region_information: { region_type: string; region_name: string }[];
  cost_information: { monthly_cost: string; currency: string };
  phone_number_type: string;
  features: { name: string }[];
  quickship: boolean;
}

interface OwnedNumber {
  id: string;
  phone_number: string;
  country: string;
  monthly_cost: string;
  purchased_at: string;
  active: boolean;
}

function flag(code: string) {
  return COUNTRIES.find(c => c.code === code)?.label.split(" ")[0] ?? "🌐";
}

function regionLabel(r: AvailableNumber["region_information"]) {
  const city  = r.find(x => x.region_type === "rate_center" || x.region_type === "city")?.region_name ?? "";
  const state = r.find(x => x.region_type === "state")?.region_name ?? "";
  const country = r.find(x => x.region_type === "country_code")?.region_name ?? "";
  if (city && state) return `${city}, ${state}`;
  if (state)         return state;
  return country;
}

export default function NumbersPage() {
  const { branding } = useBranding();

  const [country,    setCountry]    = useState("US");
  const [areaCode,   setAreaCode]   = useState("");
  const [results,    setResults]    = useState<AvailableNumber[]>([]);
  const [searching,  setSearching]  = useState(false);
  const [buying,     setBuying]     = useState<string | null>(null);
  const [owned,      setOwned]      = useState<OwnedNumber[]>([]);
  const [releasing,  setReleasing]  = useState<string | null>(null);
  const [error,      setError]      = useState("");
  const [noKey,      setNoKey]      = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOwned(JSON.parse(raw));
    } catch {}
  }, []);

  function saveOwned(next: OwnedNumber[]) {
    setOwned(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // Also persist the active number for the dialer
    const active = next.find(n => n.active);
    if (active) localStorage.setItem("aura_active_number", active.phone_number);
    else localStorage.removeItem("aura_active_number");
  }

  const search = useCallback(async () => {
    setSearching(true);
    setError("");
    try {
      const params = new URLSearchParams({ country, limit: "12" });
      if (areaCode.trim()) params.set("search", areaCode.trim());
      const res  = await fetch(`/api/dialer/numbers?${params}`);
      const data = await res.json();
      if (data.error === "missing_telnyx_key") { setNoKey(true); return; }
      setResults(data.data ?? []);
      if ((data.data ?? []).length === 0) setError("No numbers found for that area code. Try a different one.");
    } catch {
      setError("Search failed — check your internet connection.");
    } finally {
      setSearching(false);
    }
  }, [country, areaCode]);

  // Auto-search on load
  useEffect(() => { search(); }, []); // eslint-disable-line

  async function buyNumber(num: AvailableNumber) {
    setBuying(num.phone_number);
    setError("");
    try {
      const appUrl = window.location.origin;
      const res    = await fetch("/api/dialer/numbers", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone_number: num.phone_number, app_url: appUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.errors?.[0]?.detail ?? "Purchase failed."); return; }

      const countryCode = num.region_information.find(r => r.region_type === "country_code")?.region_name ?? country;
      const newOwned: OwnedNumber = {
        id:           data.data?.id ?? num.phone_number,
        phone_number: num.phone_number,
        country:      countryCode,
        monthly_cost: num.cost_information.monthly_cost,
        purchased_at: new Date().toISOString(),
        active: true,
      };
      // Deactivate others, set this one as active
      saveOwned([...owned.map(o => ({ ...o, active: false })), newOwned]);
      setResults(r => r.filter(r => r.phone_number !== num.phone_number));
    } catch {
      setError("Purchase failed — try again.");
    } finally {
      setBuying(null);
    }
  }

  async function releaseNumber(num: OwnedNumber) {
    if (!confirm(`Release ${num.phone_number}? This cannot be undone.`)) return;
    setReleasing(num.id);
    try {
      await fetch(`/api/dialer/numbers?id=${encodeURIComponent(num.id)}`, { method: "DELETE" });
      saveOwned(owned.filter(o => o.id !== num.id));
    } catch {
      setError("Release failed.");
    } finally {
      setReleasing(null);
    }
  }

  function setActive(id: string) {
    saveOwned(owned.map(o => ({ ...o, active: o.id === id })));
  }

  if (noKey) {
    return (
      <div className="px-8 py-7 max-w-[700px]">
        <PageHeader title="Phone Numbers" description="Buy and manage numbers for your dialer." />
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300 mb-1">Telnyx API key not configured</p>
            <p className="text-[12px] text-amber-700 dark:text-amber-400">Add <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">TELNYX_API_KEY</code> to your <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env.local</code> file and restart the server.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-7 max-w-[860px]">
      <PageHeader title="Phone Numbers" description="Buy numbers for your dialer — $1/month each." />

      {/* Owned numbers */}
      {owned.length > 0 && (
        <div className="mb-7">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Your Numbers</p>
          <div className="flex flex-col gap-2">
            {owned.map(num => (
              <div key={num.id} className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all",
                num.active
                  ? "bg-white dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm"
                  : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-[18px]",
                  num.active ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-100 dark:bg-zinc-800"
                )}>
                  {flag(num.country)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-wide">{num.phone_number}</p>
                    {num.active && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active in dialer
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">${num.monthly_cost}/month · {num.country} · since {new Date(num.purchased_at).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!num.active && (
                    <button onClick={() => setActive(num.id)} className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[12px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                      Set active
                    </button>
                  )}
                  <button
                    onClick={() => releaseNumber(num)}
                    disabled={!!releasing}
                    className="w-8 h-8 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center"
                  >
                    {releasing === num.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 mb-3">Get a Number</p>
          <div className="flex gap-2">
            {/* Country */}
            <div className="relative">
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 outline-none appearance-none focus:border-zinc-400 transition-colors"
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>

            {/* Area code */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" strokeWidth={2} />
              <input
                value={areaCode}
                onChange={e => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                onKeyDown={e => e.key === "Enter" && search()}
                placeholder="Area code (e.g. 415, 212)"
                className="w-full pl-9 pr-3 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors"
              />
            </div>

            <button
              onClick={search}
              disabled={searching}
              className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white brand-btn flex items-center gap-2 disabled:opacity-60"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" strokeWidth={2} />}
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="p-5">
          {error && (
            <div className="flex items-center gap-2 text-[12px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />{error}
            </div>
          )}

          {searching ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                <p className="text-[12px] text-zinc-400">Finding available numbers…</p>
              </div>
            </div>
          ) : results.length === 0 && !error ? (
            <div className="text-center py-10">
              <Globe className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[13px] text-zinc-400">Search for a number above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {results.map(num => {
                const isBuying  = buying === num.phone_number;
                const location  = regionLabel(num.region_information);
                const hasVoice  = num.features.some(f => f.name === "voice");
                const hasSms    = num.features.some(f => f.name === "sms");
                const alreadyOwned = owned.some(o => o.phone_number === num.phone_number);

                return (
                  <div key={num.phone_number} className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all">
                    {/* Number */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-wide">{num.phone_number}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-zinc-400">{location}</p>
                        <span className="text-zinc-300 dark:text-zinc-600">·</span>
                        <div className="flex items-center gap-1">
                          {hasVoice && <span className="flex items-center gap-0.5 text-[10px] text-zinc-400"><Phone className="w-2.5 h-2.5" strokeWidth={1.75} /> Voice</span>}
                          {hasSms   && <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 ml-1.5"><MessageSquare className="w-2.5 h-2.5" strokeWidth={1.75} /> SMS</span>}
                        </div>
                        {num.quickship && (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 ml-1">
                            <Zap className="w-2.5 h-2.5" strokeWidth={2} /> Instant
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-50">${num.cost_information.monthly_cost}</p>
                      <p className="text-[10px] text-zinc-400">/ month</p>
                    </div>

                    {/* Buy button */}
                    <button
                      onClick={() => buyNumber(num)}
                      disabled={isBuying || alreadyOwned || !!buying}
                      className={cn(
                        "flex-shrink-0 h-9 px-4 rounded-xl text-[12px] font-semibold transition-all flex items-center gap-1.5",
                        alreadyOwned
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default"
                          : isBuying
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-wait"
                          : "brand-btn text-white active:scale-[0.97]"
                      )}
                    >
                      {alreadyOwned ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> Owned</>
                      ) : isBuying ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buying…</>
                      ) : (
                        <><Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Get Number</>
                      )}
                    </button>
                  </div>
                );
              })}

              <button onClick={search} className="flex items-center justify-center gap-2 h-10 mt-1 text-[12px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} /> Load more numbers
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info footer */}
      <div className="mt-4 flex items-start gap-2 text-[11px] text-zinc-400">
        <Star className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-zinc-300" strokeWidth={1.75} />
        <p>Numbers are billed monthly through your Telnyx account. You can release any number at any time — billing stops the next month. Calls cost ~$0.01/min outbound.</p>
      </div>
    </div>
  );
}
