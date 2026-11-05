import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 503 });
  }

  const { phoneNumber, assistantId, assistantConfig } = await req.json();

  if (!phoneNumber) {
    return NextResponse.json({ error: "phone_number_required" }, { status: 400 });
  }

  const body: Record<string, unknown> = {
    customer: { number: phoneNumber },
  };

  if (assistantId) {
    body.assistantId = assistantId;
  } else {
    // Inline assistant config — build a sensible default if none provided
    body.assistant = assistantConfig ?? {
      model: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
      voice: { provider: "11labs", voiceId: "21m00Tcm4TlvDq8ikWAM" },
      firstMessage: "Hey, this is an automated call — do you have 30 seconds?",
      endCallMessage: "Thanks so much for your time. Have a great day!",
    };
  }

  // Attach phone number if provided in env
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  if (phoneNumberId) body.phoneNumberId = phoneNumberId;

  const res = await fetch("https://api.vapi.ai/call/phone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json(data);
}

// Fetch live call status from Vapi
export async function GET(req: NextRequest) {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "missing_credentials" }, { status: 503 });

  const callId = req.nextUrl.searchParams.get("callId");
  if (!callId) return NextResponse.json({ error: "callId_required" }, { status: 400 });

  const res = await fetch(`https://api.vapi.ai/call/${callId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
