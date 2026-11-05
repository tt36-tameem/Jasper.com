import { NextRequest, NextResponse } from "next/server";

// Telnyx calls this URL (TeXML App webhook) to get call-handling instructions.
// TeXML is nearly identical to Twilio's TwiML.
export async function POST(req: NextRequest) {
  const body = await req.formData();
  const to   = body.get("To") as string | null;
  const from = process.env.TELNYX_PHONE_NUMBER;

  if (!to || !from) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Configuration error.</Say></Response>`, {
      headers: { "Content-Type": "application/xml" },
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${from}" record="record-from-answer-dual">
    <Number>${to}</Number>
  </Dial>
</Response>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
