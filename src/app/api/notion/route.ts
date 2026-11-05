import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { token, path, body, query } = await req.json()

  if (!token || !path) {
    return NextResponse.json({ error: 'token and path are required' }, { status: 400 })
  }

  const url = new URL(`https://api.notion.com/v1/${path}`)
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  }

  const res = await fetch(url.toString(), {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  return NextResponse.json(data)
}
