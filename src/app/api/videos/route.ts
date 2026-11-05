import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120

const STYLE_MODIFIERS: Record<string, string> = {
  cinematic:    'cinematic quality, dramatic lighting, film grain, professional cinematography, smooth camera movement',
  documentary:  'documentary style, natural lighting, handheld feel, realistic, observational camera work',
  animation:    'smooth animation, vibrant colors, stylized motion, dynamic transitions, fluid movement',
  aerial:       'aerial drone shot, birds-eye view, sweeping camera movement, vast landscape, smooth pan',
  slowmo:       'slow motion, fluid dreamy movement, ethereal quality, time-stretched, graceful motion',
}

export async function POST(req: NextRequest) {
  const { prompt, style = 'cinematic', motion = 'natural' } = await req.json()

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const falKey = process.env.FAL_API_KEY
  if (!falKey) {
    return NextResponse.json({ error: 'FAL_API_KEY not configured in .env.local' }, { status: 500 })
  }

  try {
    const styleModifier = STYLE_MODIFIERS[style] ?? ''
    const finalPrompt = styleModifier ? `${prompt.trim()}, ${styleModifier}` : prompt.trim()

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 110_000)

    let falResponse: Response
    try {
      falResponse = await fetch('https://fal.run/fal-ai/ltx-video', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          prompt:               finalPrompt,
          num_frames:           25,
          frame_rate:           25,
          num_inference_steps:  30,
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!falResponse.ok) {
      const error = await falResponse.json().catch(() => ({}))
      console.error('[videos API] FAL error:', falResponse.status, error)
      return NextResponse.json(
        { error: `Video generation failed (HTTP ${falResponse.status}). ${falResponse.status === 429 ? 'Rate limited — wait a moment and retry.' : 'Try again shortly.'}` },
        { status: 502 },
      )
    }

    const data = await falResponse.json()
    const videoUrl = data?.video?.url
    if (!videoUrl) {
      console.error('[videos API] No video URL in response:', data)
      return NextResponse.json({ error: 'Video generation failed — no output returned.' }, { status: 502 })
    }

    // Fetch the video and convert to base64
    const videoBuffer = await fetch(videoUrl).then(r => r.arrayBuffer())
    const videoBase64 = Buffer.from(videoBuffer).toString('base64')

    return NextResponse.json({ videoData: videoBase64, mimeType: 'video/mp4', enhancedPrompt: finalPrompt })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Video generation timed out. Please retry.' }, { status: 504 })
    }
    console.error('[videos API]', err)
    return NextResponse.json({ error: 'Video generation failed. Please try again.' }, { status: 500 })
  }
}
