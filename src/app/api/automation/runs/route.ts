import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { startRun, type RunContext } from "@/lib/automation/executor";
import type { BuilderNode } from "@/lib/workflowStore";

export const runtime = "nodejs";

// Start a workflow run for a given lead/context.
export async function POST(req: NextRequest) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });

  let body: { workflowId?: string; workflowName?: string; nodes?: BuilderNode[]; context?: RunContext };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.nodes || !Array.isArray(body.nodes) || body.nodes.length === 0) {
    return NextResponse.json({ error: "Workflow has no nodes" }, { status: 400 });
  }

  try {
    const result = await startRun(sb, {
      workflowId: body.workflowId ?? "adhoc",
      workflowName: body.workflowName ?? "Workflow",
      nodes: body.nodes,
      context: body.context ?? {},
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "run failed" }, { status: 500 });
  }
}

// List recent runs (for the live run log).
export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ runs: [] });
  const { data, error } = await sb
    .from("automation_runs")
    .select("id, workflow_name, status, log, error, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ runs: data ?? [] });
}
