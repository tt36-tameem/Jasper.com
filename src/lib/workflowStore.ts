export type NodeType =
  | "trigger"
  // Communication
  | "email" | "sms" | "call" | "whatsapp" | "instagram" | "facebook" | "message" | "slack"
  // Instagram funnel
  | "ig_story" | "ig_comment_dm"
  // Logic
  | "delay" | "branch" | "wait_condition" | "goal"
  // CRM
  | "tag" | "update_field" | "assign" | "note" | "task"
  // Integration actions
  | "webhook" | "vapi_call" | "calendar" | "notion_page"
  | "zapier_trigger" | "linkedin_dm"
  | "google_ads_audience" | "meta_ads_audience";

export interface BuilderNode {
  id: string;
  type: NodeType;
  config: Record<string, string>;
  yes_branch?: BuilderNode[];
  no_branch?: BuilderNode[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused";
  runs: number;
  nodes: BuilderNode[];
  aiSuggested?: boolean;
}

const KEY = "aura_workflows";

const DEFAULTS: Workflow[] = [
  {
    id: "1", name: "Speed-to-Lead Dialer", description: "Call new leads within 5 min of opt-in",
    status: "active", runs: 847,
    nodes: [
      { id: "n1", type: "trigger",      config: { event: "new_lead" } },
      { id: "n2", type: "delay",        config: { amount: "5", unit: "minutes" } },
      { id: "n3", type: "call",         config: { script: "Hi, I saw you just signed up...", recording: "true" } },
      { id: "n4", type: "branch",       config: { condition: "call_answered", else_action: "continue" } },
      { id: "n5", type: "sms",         config: { message: "Hey! Just tried calling you. Book a time here: {{booking_link}}" } },
    ],
  },
  {
    id: "2", name: "Cold Email Nurture Sequence", description: "7-day email drip for unresponsive leads",
    status: "active", runs: 312,
    nodes: [
      { id: "n1", type: "trigger",      config: { event: "tag_added" } },
      { id: "n2", type: "email",        config: { subject: "Quick question for you", body: "Hi {{name}},\n\nI wanted to reach out..." } },
      { id: "n3", type: "delay",        config: { amount: "3", unit: "days" } },
      { id: "n4", type: "email",        config: { subject: "Following up", body: "Just checking in..." } },
      { id: "n5", type: "branch",       config: { condition: "email_opened", else_action: "continue" } },
      { id: "n6", type: "tag",          config: { action: "add", tag_name: "Engaged" } },
    ],
  },
  {
    id: "3", name: "Instagram DM Auto-Reply", description: "Reply to DMs with booking link instantly",
    status: "paused", runs: 94,
    nodes: [
      { id: "n1", type: "trigger",  config: { event: "message_received" } },
      { id: "n2", type: "instagram",config: { message: "Hey! Thanks for reaching out. Book a call here: {{booking_link}}" } },
      { id: "n3", type: "branch",   config: { condition: "replied_within_1h", else_action: "continue" } },
      { id: "n4", type: "assign",   config: { assignee: "Auto-assign", notify: "true" } },
    ],
  },
  {
    id: "4", name: "Proposal Follow-Up", description: "SMS + email 48h after proposal sent",
    status: "active", runs: 56,
    nodes: [
      { id: "n1", type: "trigger",      config: { event: "stage_changed" } },
      { id: "n2", type: "delay",        config: { amount: "48", unit: "hours" } },
      { id: "n3", type: "sms",         config: { message: "Hi {{name}}, just checking if you had a chance to review the proposal?" } },
      { id: "n4", type: "email",        config: { subject: "Following up on the proposal", body: "Hi {{name}},\n\nI wanted to follow up..." } },
      { id: "n5", type: "branch",       config: { condition: "email_opened", else_action: "end" } },
      { id: "n6", type: "task",         config: { title: "Call {{name}} re: proposal", due_amount: "1", due_unit: "days", priority: "high" } },
    ],
  },
  {
    id: "5", name: "New Client Onboarding", description: "Welcome sequence + task creation on deal won",
    status: "active", runs: 23,
    nodes: [
      { id: "n1", type: "trigger",      config: { event: "pipeline_won" } },
      { id: "n2", type: "tag",          config: { action: "add", tag_name: "Client" } },
      { id: "n3", type: "update_field", config: { field: "stage", value: "Onboarding" } },
      { id: "n4", type: "email",        config: { subject: "Welcome aboard, {{name}}! 🎉", body: "Hi {{name}},\n\nWe're thrilled to have you..." } },
      { id: "n5", type: "slack",        config: { channel: "#new-clients", message: "🎉 {{name}} from {{company}} just signed!" } },
      { id: "n6", type: "task",         config: { title: "Kickoff call with {{name}}", due_amount: "2", due_unit: "days", priority: "high" } },
    ],
  },
  {
    id: "6", name: "Webhook Lead Sync", description: "Push new leads to external CRM via webhook",
    status: "paused", runs: 188,
    nodes: [
      { id: "n1", type: "trigger", config: { event: "new_lead" } },
      { id: "n2", type: "webhook", config: { url: "https://hooks.example.com/leads", method: "POST", body_template: '{"name":"{{name}}","email":"{{email}}"}' } },
      { id: "n3", type: "note",   config: { note_text: "Lead synced to external CRM", note_type: "internal" } },
    ],
  },
];

export function getWorkflows(): Workflow[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : DEFAULTS;
  } catch { return DEFAULTS; }
}

export function saveWorkflow(wf: Workflow): void {
  const all = getWorkflows();
  const idx = all.findIndex(w => w.id === wf.id);
  if (idx >= 0) all[idx] = wf; else all.push(wf);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteWorkflow(id: string): void {
  const all = getWorkflows().filter(w => w.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

// ─── Instagram Funnel Templates ───────────────────────────────────────────────
export interface WorkflowTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tags: string[];
  nodes: BuilderNode[];
}

export const INSTAGRAM_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "ig-lead-magnet",
    name: "Lead Magnet Funnel",
    emoji: "🎁",
    description: "Someone DMs a keyword → auto-deliver your freebie → nurture → close",
    tags: ["DM", "Freebie", "Nurture"],
    nodes: [
      { id: "t1", type: "trigger",   config: { event: "message_received" } },
      { id: "t2", type: "ig_comment_dm", config: { keyword: "FREEBIE", message: "Hey {{name}}! 🎉 Here's your free guide: [LINK]\n\nTake 10 minutes to go through it and let me know what resonated most with you 👇", delay_minutes: "1" } },
      { id: "t3", type: "delay",     config: { amount: "2", unit: "hours" } },
      { id: "t4", type: "instagram", config: { message: "Hey! Did you get a chance to check out the guide? What was your biggest takeaway? 👇" } },
      { id: "t5", type: "delay",     config: { amount: "1", unit: "days" } },
      { id: "t6", type: "branch",    config: { condition: "replied_within_24h", else_action: "continue" },
        yes_branch: [
          { id: "t6y1", type: "instagram", config: { message: "Love that! Based on what you shared, my [PROGRAM NAME] was literally built for people in your situation.\n\nIt's a [X-week] program where you [RESULT].\n\nWant me to send you the details? Just reply 'YES' 🙌" } },
          { id: "t6y2", type: "tag",       config: { action: "add", tag_name: "IG Engaged" } },
        ],
        no_branch: [
          { id: "t6n1", type: "instagram", config: { message: "Hey, just making sure this came through! Did the guide land okay? Sometimes DMs get buried 😅" } },
          { id: "t6n2", type: "delay",     config: { amount: "2", unit: "days" } },
          { id: "t6n3", type: "instagram", config: { message: "No worries if now isn't the right time! Whenever you're ready to [DESIRED OUTCOME], just reply and I'll be here 🙏" } },
        ],
      },
    ],
  },
  {
    id: "ig-story-sequence",
    name: "5-Day Story Sequence",
    emoji: "📱",
    description: "Plan a 5-day story arc that builds trust and drives DMs to your offer",
    tags: ["Stories", "Launch", "Authority"],
    nodes: [
      { id: "s1", type: "ig_story",  config: { story_type: "hook",  script: "I used to [RELATABLE STRUGGLE] until I discovered this one thing...", on_screen_text: "The thing nobody talks about 👇", cta_text: "DM me 'INFO' for details", posting_time: "morning" } },
      { id: "s2", type: "delay",     config: { amount: "1", unit: "days" } },
      { id: "s3", type: "ig_story",  config: { story_type: "value", script: "Here are the 3 reasons most people struggle with [TOPIC]... [share value]", on_screen_text: "Save this 🔖", cta_text: "DM me if this resonated", posting_time: "morning" } },
      { id: "s4", type: "delay",     config: { amount: "1", unit: "days" } },
      { id: "s5", type: "ig_story",  config: { story_type: "proof", script: "[STUDENT NAME] went from [BEFORE] to [AFTER] in just [TIMEFRAME]...", on_screen_text: "Real results 🙌", cta_text: "DM me 'READY' if you want this", posting_time: "afternoon" } },
      { id: "s6", type: "delay",     config: { amount: "1", unit: "days" } },
      { id: "s7", type: "ig_story",  config: { story_type: "tease", script: "Tomorrow I'm opening something I've been working on for months... it's going to [BIG PROMISE]", on_screen_text: "Coming tomorrow 👀", cta_text: "DM me 'WAITLIST' to get early access", posting_time: "evening" } },
      { id: "s8", type: "delay",     config: { amount: "1", unit: "days" } },
      { id: "s9", type: "ig_story",  config: { story_type: "cta",   script: "It's OPEN! [OFFER NAME] is live for the next 48 hours only...", on_screen_text: "Link in bio 🔗", cta_text: "DM me 'JOIN' right now", posting_time: "morning" } },
      { id: "s10", type: "ig_comment_dm", config: { keyword: "JOIN", message: "Hey {{name}}! You're in the right place 🙌\n\nHere's the link to join [OFFER NAME]: [LINK]\n\nSpots are limited — grab yours before they're gone!", delay_minutes: "1" } },
    ],
  },
  {
    id: "ig-dm-challenge",
    name: "5-Day DM Challenge",
    emoji: "🔥",
    description: "Deliver a free challenge via DMs to build trust and sell your offer at the end",
    tags: ["Challenge", "DMs", "High-conversion"],
    nodes: [
      { id: "c1", type: "trigger",   config: { event: "message_received" } },
      { id: "c2", type: "instagram", config: { message: "You're in!! Welcome to the [CHALLENGE NAME] Challenge 🎉\n\nFor the next 5 days I'm going to [PROMISE].\n\nHere's Day 1:\n\n[DAY 1 CONTENT]\n\nComplete this and reply 'DONE' when you finish! 💪" } },
      { id: "c3", type: "tag",       config: { action: "add", tag_name: "IG Challenge" } },
      { id: "c4", type: "delay",     config: { amount: "1", unit: "days" } },
      { id: "c5", type: "instagram", config: { message: "Day 2 is here! 🚀\n\nYesterday you [RECAP]. Today we're going deeper.\n\n[DAY 2 CONTENT]\n\nQuick check-in: what was your biggest win from Day 1?" } },
      { id: "c6", type: "delay",     config: { amount: "1", unit: "days" } },
      { id: "c7", type: "instagram", config: { message: "Halfway there!! Day 3 🔥\n\n[DAY 3 CONTENT]\n\nAlso — [STUDENT NAME] did this exact challenge and went on to [RESULT]. You're on that same path 💯" } },
      { id: "c8", type: "delay",     config: { amount: "1", unit: "days" } },
      { id: "c9", type: "instagram", config: { message: "Day 4 — you're almost there! 💪\n\n[DAY 4 CONTENT]\n\nTomorrow is the FINAL day and I've got something special for you..." } },
      { id: "c10", type: "delay",    config: { amount: "1", unit: "days" } },
      { id: "c11", type: "instagram",config: { message: "Day 5 — FINAL DAY! 🏆\n\n[DAY 5 CONTENT]\n\nYou've done the work. Now imagine doing this with 1:1 support from me every step of the way...\n\nThat's exactly what [PROGRAM NAME] is. For the next 24 hours only, challenge members get [DISCOUNT/BONUS].\n\nReply 'READY' if you want the details 👇" } },
      { id: "c12", type: "delay",    config: { amount: "12", unit: "hours" } },
      { id: "c13", type: "branch",   config: { condition: "replied_within_24h", else_action: "continue" },
        yes_branch: [
          { id: "c13y1", type: "instagram", config: { message: "YES! I knew you'd be ready 🙌\n\nHere's everything about [PROGRAM NAME]: [LINK]\n\nThis offer expires in 24 hours — grab your spot before it's gone!" } },
        ],
        no_branch: [
          { id: "c13n1", type: "instagram", config: { message: "Hey, just want to make sure you saw my last message! The special offer for challenge members closes tonight at midnight.\n\nDon't miss out — want me to send you the details?" } },
        ],
      },
    ],
  },
  {
    id: "ig-course-launch",
    name: "Course Launch Sequence",
    emoji: "🚀",
    description: "Build hype with stories, collect a waitlist, then open cart and close hard",
    tags: ["Launch", "Course", "Waitlist"],
    nodes: [
      { id: "l1", type: "ig_story",  config: { story_type: "tease",  script: "Something BIG is coming... I've been working on this for [X months] and it's finally almost ready.", on_screen_text: "👀 Coming soon", cta_text: "DM me 'WAITLIST' to be first to know", posting_time: "morning" } },
      { id: "l2", type: "delay",     config: { amount: "2", unit: "days" } },
      { id: "l3", type: "ig_story",  config: { story_type: "proof",  script: "I've already tested this with a beta group and the results are insane. [STUDENT] got [RESULT] in [TIME].", on_screen_text: "Beta results 📊", cta_text: "DM me 'EARLY' for early bird pricing", posting_time: "morning" } },
      { id: "l4", type: "ig_comment_dm", config: { keyword: "WAITLIST", message: "You're on the waitlist! 🎉\n\nAs a waitlist member you'll get:\n✅ First access when doors open\n✅ [EARLY BIRD BONUS]\n✅ [DISCOUNT]\n\nI'll message you the moment it's live. Stay tuned!", delay_minutes: "2" } },
      { id: "l5", type: "tag",       config: { action: "add", tag_name: "Launch Waitlist" } },
      { id: "l6", type: "delay",     config: { amount: "5", unit: "days" } },
      { id: "l7", type: "instagram", config: { message: "🚨 DOORS ARE OPEN!\n\n[PROGRAM NAME] is officially live and as a waitlist member you have 24 hours of exclusive early bird access.\n\nHere's the link: [LINK]\n\nThis is your moment — don't let it pass 🙌" } },
      { id: "l8", type: "delay",     config: { amount: "20", unit: "hours" } },
      { id: "l9", type: "instagram", config: { message: "4 hours left on your early bird access ⏰\n\nAfter midnight tonight the price goes up and the bonuses disappear.\n\n[LINK] — grab your spot now!" } },
    ],
  },
  {
    id: "ig-high-ticket",
    name: "High-Ticket DM Close",
    emoji: "💸",
    description: "Qualify leads, book a discovery call, prep them beforehand, and close",
    tags: ["High-ticket", "Discovery Call", "Qualify"],
    nodes: [
      { id: "h1", type: "trigger",   config: { event: "message_received" } },
      { id: "h2", type: "instagram", config: { message: "Hey {{name}}! I'd love to help — before I send you everything, let me ask a couple quick questions so I can make sure this is the right fit for you.\n\n1️⃣ What's your biggest struggle with [TOPIC] right now?\n2️⃣ What would it mean for you to finally solve this?" } },
      { id: "h3", type: "delay",     config: { amount: "1", unit: "hours" } },
      { id: "h4", type: "branch",    config: { condition: "replied_within_24h", else_action: "continue" },
        yes_branch: [
          { id: "h4y1", type: "instagram", config: { message: "I love that answer. Based on what you shared, I think you'd be a great fit for [PROGRAM NAME].\n\nI work with [TYPE OF PEOPLE] to help them [RESULT] in [TIMEFRAME].\n\nI only take [X] clients per month — want to hop on a quick 30-min call to see if we're a good fit?\n\nHere's my calendar: [LINK]" } },
          { id: "h4y2", type: "tag",       config: { action: "add", tag_name: "HT Qualified" } },
          { id: "h4y3", type: "task",      config: { title: "Call prep: review {{name}}'s answers before call", due_amount: "1", due_unit: "hours", priority: "high" } },
        ],
        no_branch: [
          { id: "h4n1", type: "instagram", config: { message: "No worries! I know DMs can get hectic. Still want to answer when you get a chance — I want to make sure I send you only what's actually relevant to where you're at 🙏" } },
          { id: "h4n2", type: "delay",     config: { amount: "2", unit: "days" } },
          { id: "h4n3", type: "instagram", config: { message: "Hey, last check-in from me 😊 If you're still looking to [DESIRED OUTCOME], I'm here. If not, no hard feelings — wishing you the best either way!" } },
        ],
      },
    ],
  },
];

function cloneNodes(nodes: BuilderNode[]): BuilderNode[] {
  return nodes.map(n => ({
    ...n,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    yes_branch: n.yes_branch ? cloneNodes(n.yes_branch) : undefined,
    no_branch:  n.no_branch  ? cloneNodes(n.no_branch)  : undefined,
  }));
}

export function createWorkflowFromTemplate(template: WorkflowTemplate): Workflow {
  const wf: Workflow = {
    id: Date.now().toString(),
    name: template.name,
    description: template.description,
    status: "paused",
    runs: 0,
    nodes: cloneNodes(template.nodes),
  };
  saveWorkflow(wf);
  return wf;
}
