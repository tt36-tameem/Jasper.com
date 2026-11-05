import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { prompt, systemPrompt, maxTokens } = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_key_here') {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured in .env.local' }, { status: 500 })
  }

  const baseSystem = 'You are Jacsper, an autonomous AI CRM assistant. Be extremely concise, specific, and actionable. Plain text only — no markdown, no asterisks, no dashes, no headers.'
  const fullSystem = systemPrompt?.trim()
    ? `${baseSystem}\n\nBusiness context (always use this to personalise your responses):\n${systemPrompt.trim()}`
    : baseSystem

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: Math.min(Math.max(Number(maxTokens) || 300, 100), 2000),
      system: fullSystem,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ text })
  } catch (err) {
    console.error('[jacsper api]', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
