import { NextRequest, NextResponse } from "next/server";

const BASE  = "https://api.telnyx.com/v2";
const KEY   = () => process.env.TELNYX_API_KEY;
const hdrs  = () => ({ Authorization: `Bearer ${KEY()}`, "Content-Type": "application/json" });

function noKey() { return NextResponse.json({ error: "missing_telnyx_key" }, { status: 503 }); }

// ── GET /api/dialer/numbers?search=415&country=US&type=local
// Returns available numbers to purchase
export async function GET(req: NextRequest) {
  if (!KEY()) return noKey();

  const p       = req.nextUrl.searchParams;
  const country = p.get("country") ?? "US";
  const search  = p.get("search")  ?? "";   // area code, prefix, or digits
  const type    = p.get("type")    ?? "local";
  const limit   = p.get("limit")   ?? "20";

  const params = new URLSearchParams({
    country_code:       country,
    phone_number_type:  type,
    limit,
    ...(search ? { national_destination_code: search } : {}),
  });

  const res  = await fetch(`${BASE}/available_phone_numbers?${params}`, { headers: hdrs() });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// ── POST /api/dialer/numbers   { phone_number: "+14155551234" }
// Purchases a number and provisions it with a TeXML App
export async function POST(req: NextRequest) {
  if (!KEY()) return noKey();

  const { phone_number, app_url } = await req.json();
  if (!phone_number) return NextResponse.json({ error: "phone_number required" }, { status: 400 });

  // 1. Order the number
  const buyRes  = await fetch(`${BASE}/number_orders`, {
    method: "POST",
    headers: hdrs(),
    body: JSON.stringify({ phone_numbers: [{ phone_number }] }),
  });
  const bought = await buyRes.json();
  if (!buyRes.ok) return NextResponse.json(bought, { status: buyRes.status });

  // Number order gives us an order ID; the actual number record comes back in phone_numbers[0]
  const numberId = bought.data?.phone_numbers?.[0]?.id ?? bought.data?.id;

  // 2. If a webhook URL was supplied, create (or reuse) a TeXML App and link the number
  if (app_url && numberId) {
    // Create TeXML App
    const appRes  = await fetch(`${BASE}/texml_applications`, {
      method: "POST",
      headers: hdrs(),
      body: JSON.stringify({
        friendly_name: "Aura CRM Dialer",
        voice_url:     `${app_url}/api/dialer/telnyx`,
        voice_method:  "POST",
      }),
    });
    const app = await appRes.json();
    const appId = app.data?.id;

    if (appId) {
      // Assign number to TeXML App
      await fetch(`${BASE}/phone_numbers/${numberId}`, {
        method: "PATCH",
        headers: hdrs(),
        body: JSON.stringify({
          connection_id: appId,
        }),
      });
    }
  }

  return NextResponse.json(bought);
}

// ── DELETE /api/dialer/numbers?id=xyz
// Releases (cancels) a number
export async function DELETE(req: NextRequest) {
  if (!KEY()) return noKey();

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const res  = await fetch(`${BASE}/phone_numbers/${id}`, { method: "DELETE", headers: hdrs() });
  return NextResponse.json({ ok: res.ok }, { status: res.status });
}
