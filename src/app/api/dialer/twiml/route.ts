import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

// Twilio POSTs here when the browser SDK initiates an outbound call.
export async function POST(req: NextRequest) {
  const body  = await req.formData();
  const to    = body.get("To") as string | null;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  const twiml = new VoiceResponse();

  if (to && from) {
    const dial = twiml.dial({ callerId: from, record: "record-from-ringing-dual" });
    // If the "To" looks like a phone number dial it directly; otherwise treat as a client name
    if (to.startsWith("+") || /^\d{10,}$/.test(to)) {
      dial.number(to);
    } else {
      dial.client(to);
    }
  } else {
    twiml.say("Configuration error: missing phone number.");
  }

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
