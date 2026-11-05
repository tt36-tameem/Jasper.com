import { NextResponse } from "next/server";

// Returns provider + credentials needed by the browser SDK.
// Priority: Telnyx (easier for non-US users) → Twilio
export async function GET() {
  // ── Telnyx ────────────────────────────────────────────────────────────────
  const telnyxSipUser  = process.env.TELNYX_SIP_USER;
  const telnyxSipPass  = process.env.TELNYX_SIP_PASSWORD;
  const telnyxPhone    = process.env.TELNYX_PHONE_NUMBER;

  if (telnyxSipUser && telnyxSipPass) {
    return NextResponse.json({
      provider: "telnyx",
      sipUser:  telnyxSipUser,
      sipPass:  telnyxSipPass,
      from:     telnyxPhone ?? "",
    });
  }

  // ── Twilio ────────────────────────────────────────────────────────────────
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey     = process.env.TWILIO_API_KEY;
  const apiSecret  = process.env.TWILIO_API_SECRET;
  const appSid     = process.env.TWILIO_TWIML_APP_SID;

  if (accountSid && apiKey && apiSecret && appSid) {
    const twilio = await import("twilio");
    const { AccessToken } = twilio.default.jwt;
    const { VoiceGrant }  = AccessToken;

    const identity = `agent-${Date.now()}`;
    const grant    = new VoiceGrant({ outgoingApplicationSid: appSid, incomingAllow: true });
    const token    = new AccessToken(accountSid, apiKey, apiSecret, { identity });
    token.addGrant(grant);

    return NextResponse.json({
      provider: "twilio",
      token:    token.toJwt(),
      identity,
      from: process.env.TWILIO_PHONE_NUMBER ?? "",
    });
  }

  return NextResponse.json({ error: "missing_credentials" }, { status: 503 });
}
