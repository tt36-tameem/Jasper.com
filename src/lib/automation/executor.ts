import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuilderNode } from "@/lib/workflowStore";

// ── Types ─────────────────────────────────────────────────────────────────
export type RunContext = Record<string, string | boolean | number>;

interface Frame { idx: number; branch: "yes" | "no" | null }
interface SerializedFrame { idx: number; branch: "yes" | "no" | null }

interface LogEntry {
  at: string;
  node: string;          // node id
  type: string;          // node type
  status: "done" | "skipped" | "error" | "scheduled";
  detail: string;
}

interface RunRow {
  id: string;
  nodes: BuilderNode[];
  context: RunContext;
  cursor: SerializedFrame[];
  log: LogEntry[];
}

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ── Merge tags: {{name}} → context.name ─────────────────────────────────────
function merge(text: string, ctx: RunContext): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = ctx[k];
    return v === undefined ? `{{${k}}}` : String(v);
  });
}

// ── Rebuild the live frame stack (with real node-array refs) from the cursor ─
function resolveStack(root: BuilderNode[], cursor: SerializedFrame[]): (Frame & { list: BuilderNode[] })[] {
  // Returns frames carrying the actual list each frame iterates.
  const frames: (Frame & { list: BuilderNode[] })[] = [];
  let list = root;
  for (let k = 0; k < cursor.length; k++) {
    const f = cursor[k];
    frames.push({ idx: f.idx, branch: f.branch, list });
    // Descend for the next frame: the branch node was the one we last advanced
    // past in this frame (idx - 1), and the next frame entered its yes/no list.
    const next = cursor[k + 1];
    if (next) {
      const parentNode = list[f.idx - 1];
      list = (next.branch === "yes" ? parentNode?.yes_branch : parentNode?.no_branch) ?? [];
    }
  }
  return frames;
}

function serialize(stack: (Frame & { list: BuilderNode[] })[]): SerializedFrame[] {
  return stack.map((f) => ({ idx: f.idx, branch: f.branch }));
}

// ── Real side-effect dispatch for a single action node ──────────────────────
async function runAction(node: BuilderNode, ctx: RunContext): Promise<LogEntry> {
  const base = { at: new Date().toISOString(), node: node.id, type: node.type };
  const cfg = node.config ?? {};
  try {
    switch (node.type) {
      case "email": {
        const to = String(ctx.email ?? "");
        if (!to) return { ...base, status: "skipped", detail: "no recipient email in context" };
        const res = await fetch(`${APP_URL}/api/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to,
            from_name: ctx.from_name ?? ctx.company ?? "",
            subject: merge(cfg.subject ?? "", ctx),
            body: merge(cfg.body ?? "", ctx),
          }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await res.json().catch(() => ({}));
        if (data.error === "no_key") return { ...base, status: "skipped", detail: "email provider not configured (RESEND_API_KEY)" };
        if (!res.ok || data.error) return { ...base, status: "error", detail: String(data.error ?? res.status) };
        return { ...base, status: "done", detail: `email sent to ${to}` };
      }
      case "webhook": {
        const url = cfg.url;
        if (!url) return { ...base, status: "skipped", detail: "no webhook url" };
        const res = await fetch(url, {
          method: cfg.method || "POST",
          headers: { "Content-Type": "application/json" },
          body: cfg.method === "GET" ? undefined : merge(cfg.body_template ?? "{}", ctx),
          signal: AbortSignal.timeout(15000),
        });
        return { ...base, status: res.ok ? "done" : "error", detail: `${cfg.method || "POST"} ${url} → ${res.status}` };
      }
      // Outbound channels & CRM mutations: recorded in the run log. Wiring these
      // to live providers / DB contacts is the next phase.
      case "sms": case "call": case "whatsapp": case "instagram":
      case "facebook": case "message": case "slack": case "vapi_call":
      case "ig_story": case "ig_comment_dm": case "linkedin_dm":
        return { ...base, status: "done", detail: `${node.type}: "${merge(cfg.message ?? cfg.script ?? "", ctx).slice(0, 60)}" (logged)` };
      case "tag": case "update_field": case "assign": case "note": case "task":
        return { ...base, status: "done", detail: `${node.type} ${JSON.stringify(cfg)} (logged — applies to CRM once contacts are in DB)` };
      case "goal": case "wait_condition":
        return { ...base, status: "done", detail: `${node.type} (no-op in phase 1)` };
      default:
        return { ...base, status: "done", detail: `${node.type} (logged)` };
    }
  } catch (err) {
    return { ...base, status: "error", detail: err instanceof Error ? err.message : String(err) };
  }
}

// ── Branch evaluation ───────────────────────────────────────────────────────
// We can't yet observe email opens / replies, so a condition is true only if
// the run context explicitly carries it as a flag; otherwise we take the
// else / no_branch path. (Open/reply tracking is a later phase.)
function evalCondition(node: BuilderNode, ctx: RunContext): "yes" | "no" {
  const cond = node.config?.condition;
  return cond && ctx[cond] === true ? "yes" : "no";
}

function parseDelayMs(cfg: Record<string, string>): number {
  const amount = parseFloat(cfg.amount ?? cfg.delay_minutes ?? "0") || 0;
  const unit = cfg.unit ?? (cfg.delay_minutes ? "minutes" : "minutes");
  const mult = unit === "days" ? 86400000 : unit === "hours" ? 3600000 : unit === "seconds" ? 1000 : 60000;
  return amount * mult;
}

// ── Execute (or resume) a run until it completes or hits a delay ────────────
export async function executeRun(sb: SupabaseClient, run: RunRow): Promise<"completed" | "waiting" | "failed"> {
  const root = run.nodes;
  const log = [...(run.log ?? [])];

  // Build the live stack from the saved cursor, or start fresh at the root.
  let stack: (Frame & { list: BuilderNode[] })[];
  if (run.cursor && run.cursor.length) {
    stack = resolveStack(root, run.cursor);
  } else {
    stack = [{ idx: 0, branch: null, list: root }];
  }

  // Safety bound so a malformed tree can't spin forever in one tick.
  for (let steps = 0; steps < 500; steps++) {
    const top = stack[stack.length - 1];
    if (!top) {
      await sb.from("automation_runs").update({ status: "completed", cursor: [], log, updated_at: new Date().toISOString() }).eq("id", run.id);
      return "completed";
    }
    if (top.idx >= top.list.length) { stack.pop(); continue; }

    const node = top.list[top.idx];
    top.idx++; // advance past this node before processing

    if (node.type === "delay" || (node.type === "wait_condition" && node.config?.amount)) {
      const ms = parseDelayMs(node.config ?? {});
      const runAt = new Date(Date.now() + ms).toISOString();
      log.push({ at: new Date().toISOString(), node: node.id, type: "delay", status: "scheduled", detail: `resume at ${runAt}` });
      await sb.from("automation_runs").update({ status: "waiting", cursor: serialize(stack), log, updated_at: new Date().toISOString() }).eq("id", run.id);
      await sb.from("automation_jobs").insert({ run_id: run.id, run_at: runAt });
      return "waiting";
    }

    if (node.type === "branch") {
      const dir = evalCondition(node, run.context);
      log.push({ at: new Date().toISOString(), node: node.id, type: "branch", status: "done", detail: `condition "${node.config?.condition ?? ""}" → ${dir}` });
      const chosen = dir === "yes" ? node.yes_branch : node.no_branch;
      if (chosen && chosen.length) stack.push({ idx: 0, branch: dir, list: chosen });
      continue;
    }

    log.push(await runAction(node, run.context));
    // Persist incrementally so progress is visible live.
    await sb.from("automation_runs").update({ log, updated_at: new Date().toISOString() }).eq("id", run.id);
  }

  await sb.from("automation_runs").update({ status: "failed", error: "step limit exceeded", log }).eq("id", run.id);
  return "failed";
}

// ── Start a brand-new run ────────────────────────────────────────────────────
export async function startRun(
  sb: SupabaseClient,
  input: { workflowId: string; workflowName: string; nodes: BuilderNode[]; context: RunContext },
): Promise<{ id: string; status: string }> {
  const { data, error } = await sb
    .from("automation_runs")
    .insert({
      workflow_id: input.workflowId,
      workflow_name: input.workflowName,
      nodes: input.nodes,
      context: input.context,
      status: "running",
      cursor: [],
      log: [],
    })
    .select("id, nodes, context, cursor, log")
    .single();
  if (error || !data) throw new Error(error?.message ?? "failed to create run");
  const status = await executeRun(sb, data as RunRow);
  return { id: (data as RunRow).id, status };
}

// ── Resume all jobs whose time has come (called by the tick route) ───────────
export async function resumeDueJobs(sb: SupabaseClient): Promise<{ resumed: number }> {
  const now = new Date().toISOString();
  const { data: jobs } = await sb
    .from("automation_jobs")
    .select("id, run_id")
    .eq("status", "pending")
    .lte("run_at", now)
    .limit(25);
  if (!jobs || jobs.length === 0) return { resumed: 0 };

  let resumed = 0;
  for (const job of jobs) {
    // Claim the job (best-effort optimistic lock).
    const { data: claimed } = await sb
      .from("automation_jobs")
      .update({ status: "claimed", claimed_at: now })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id")
      .single();
    if (!claimed) continue;

    const { data: run } = await sb
      .from("automation_runs")
      .select("id, nodes, context, cursor, log")
      .eq("id", job.run_id)
      .single();
    if (run) { await executeRun(sb, run as RunRow); resumed++; }
    await sb.from("automation_jobs").update({ status: "done" }).eq("id", job.id);
  }
  return { resumed };
}
