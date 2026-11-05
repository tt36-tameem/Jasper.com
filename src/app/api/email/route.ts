import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, from_name, reply_to, subject, body } = await req.json()

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'no_key' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: `${from_name} <onboarding@resend.dev>`,
        reply_to: reply_to || undefined,
        to: [to],
        subject,
        text: body,
      }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data?.message ?? 'Send failed' }, { status: 500 })
    return NextResponse.json({ ok: true, id: data.id })
  } catch (err) {
    console.error('[email api]', err)
    return NextResponse.json({ error: 'Send failed' }, { status: 500 })
  }
}
