import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resumeDueJobs } from "@/lib/automation/executor";

export const runtime = "nodejs";

// Drains due scheduled jobs and resumes their runs. Driven by a scheduler:
//   • local/dev: the in-app poller (AutomationTicker) or a curl cron
//   • production: pg_cron + pg_net hitting this endpoint every minute
// Both GET and POST are accepted so a cron can use either.
async function tick() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  try {
    const result = await resumeDueJobs(sb);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "tick failed" }, { status: 500 });
  }
}

export const GET = tick;
export const POST = tick;
