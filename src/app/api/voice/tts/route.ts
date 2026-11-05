import { NextRequest, NextResponse } from "next/server";

// ElevenLabs text-to-speech proxy.
// Set ELEVENLABS_API_KEY in .env.local. The voice is chosen per-request
// (voiceId) from the user's branding settings, falling back to "Rachel".
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah (works on free plan)
const MODEL_ID = "eleven_turbo_v2_5";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY is not set" }, { status: 503 });
  }

  let text = "";
  let voiceId = "";
  try {
    ({ text, voiceId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const vid = voiceId?.trim() || DEFAULT_VOICE_ID;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(vid)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15 },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "ElevenLabs request failed", status: res.status, detail },
      { status: res.status },
    );
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
