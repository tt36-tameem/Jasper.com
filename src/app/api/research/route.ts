import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const PROMPT = (query: string) => `You are a market research analyst. Generate a comprehensive profile for: "${query}"

Return ONLY raw JSON (no markdown, no code fences) matching this exact structure:

{
  "name": "Full name or brand name",
  "handle": "@handle",
  "avatar": "XX",
  "twitterHandle": "handle_without_@_symbol",
  "started": "YYYY",
  "niche": "Specific niche description",
  "market": "B2B / B2C / Category",
  "tagline": "Their real or most fitting tagline",
  "primaryPlatform": "YouTube or Instagram or Twitter/X or LinkedIn or TikTok",
  "estRevenue": "$XM+ / yr",
  "platforms": [
    { "platform": "YouTube", "followers": "1.2M", "pct": 45 },
    { "platform": "Instagram", "followers": "800K", "pct": 30 },
    { "platform": "Twitter/X", "followers": "400K", "pct": 15 },
    { "platform": "LinkedIn", "followers": "300K", "pct": 10 }
  ],
  "icp": {
    "ageRange": "25 – 45",
    "demographics": "Detailed audience description",
    "incomeLevel": "Income range",
    "painPoints": ["pain1", "pain2", "pain3", "pain4"],
    "desires": ["desire1", "desire2", "desire3", "desire4"],
    "awareness": "Problem-aware → Solution-aware"
  },
  "funnel": [
    {
      "tag": "TOFU",
      "label": "Stage label",
      "description": "What they do at top of funnel",
      "tactics": ["tactic1", "tactic2", "tactic3", "tactic4"]
    },
    {
      "tag": "MOFU",
      "label": "Stage label",
      "description": "What they do at middle of funnel",
      "tactics": ["tactic1", "tactic2", "tactic3", "tactic4"]
    },
    {
      "tag": "BOFU",
      "label": "Stage label",
      "description": "What they do at bottom of funnel — how they convert",
      "tactics": ["tactic1", "tactic2", "tactic3", "tactic4"]
    }
  ],
  "offers": [
    { "name": "Offer name", "price": "$X", "format": "Course/Book/Agency/SaaS/etc", "description": "What it does" },
    { "name": "Offer name", "price": "$X", "format": "Format", "description": "What it does" },
    { "name": "Offer name", "price": "$X", "format": "Format", "description": "What it does" }
  ],
  "positioning": {
    "coreMessage": "Their core brand message in one sentence",
    "uniqueMechanism": "Their proprietary framework or unique approach",
    "tone": ["Trait1", "Trait2", "Trait3", "Trait4"],
    "differentiators": ["differentiator1", "differentiator2", "differentiator3", "differentiator4"]
  },
  "ctas": [
    "\"CTA text in quotes\"",
    "\"CTA text in quotes\"",
    "\"CTA text in quotes\"",
    "\"CTA text in quotes\""
  ],
  "hooks": [
    "\"Hook line in quotes\"",
    "\"Hook line in quotes\"",
    "\"Hook line in quotes\"",
    "\"Hook line in quotes\"",
    "\"Hook line in quotes\""
  ],
  "contentPillars": [
    { "label": "Pillar 1" },
    { "label": "Pillar 2" },
    { "label": "Pillar 3" },
    { "label": "Pillar 4" },
    { "label": "Pillar 5" },
    { "label": "Pillar 6" }
  ],
  "tags": ["name", "alias", "niche", "platform", "topic"]
}

Rules:
- If this is a real public figure, use accurate known data
- If unknown, generate a highly plausible profile based on the query
- platforms array: only include platforms they actually use, pct values must sum to 100
- avatar: 2-letter initials from the name
- twitterHandle: best known Twitter/X handle (no @ symbol)
- All arrays must have at least the minimum entries shown
- Return ONLY the JSON object, nothing else`

export async function POST(req: NextRequest) {
  const { query } = await req.json()

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_key_here') {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set in .env.local' },
      { status: 500 }
    )
  }

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: PROMPT(query.trim()) }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Strip any accidental code fences
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const data = JSON.parse(cleaned)

    return NextResponse.json(data)
  } catch (err) {
    console.error('[research API]', err)
    return NextResponse.json({ error: 'Research failed' }, { status: 500 })
  }
}
