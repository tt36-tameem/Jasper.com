import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 90

const DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1:1':  { width: 1024, height: 1024 },
  '16:9': { width: 1280, height: 720  },
  '9:16': { width: 720,  height: 1280 },
  '4:3':  { width: 1024, height: 768  },
}

const STYLE_MODIFIERS: Record<string, string> = {
  photorealistic: 'photorealistic, ultra-detailed, professional photography, sharp focus, natural lighting',
  cinematic:      'cinematic film still, dramatic lighting, movie scene, anamorphic lens bokeh, color graded',
  illustration:   'digital illustration, vibrant colors, stylized artwork, concept art, detailed brushwork',
  minimalist:     'minimalist design, clean composition, negative space, modern aesthetic, flat design',
  'dark-moody':   'dark and moody, atmospheric, low key lighting, dramatic shadows, noir aesthetic',
  corporate:      'professional corporate photography, bright and airy, modern office aesthetic, clean business look',
}

export async function POST(req: NextRequest) {
  const { prompt, style = 'photorealistic', aspectRatio = '1:1' } = await req.json()

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const hfKey = process.env.HUGGINGFACE_API_KEY
  if (!hfKey || hfKey === 'your_hf_key_here') {
    return NextResponse.json({ error: 'HUGGINGFACE_API_KEY not configured in .env.local' }, { status: 500 })
  }

  try {
    const styleModifier = STYLE_MODIFIERS[style] ?? ''
    const finalPrompt = styleModifier ? `${prompt.trim()}, ${styleModifier}` : prompt.trim()

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 80_000)

    const dims = DIMENSIONS[aspectRatio] ?? DIMENSIONS['1:1']

    let hfResponse: Response
    try {
      hfResponse = await fetch(
        'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
        {
          method: 'POST',
          headers: {
            'Authorization':    `Bearer ${hfKey}`,
            'Content-Type':     'application/json',
            'x-wait-for-model': 'true',
          },
          body: JSON.stringify({
            inputs: finalPrompt,
            parameters: { width: dims.width, height: dims.height, num_inference_steps: 4 },
          }),
          signal: controller.signal,
        }
      )
    } finally {
      clearTimeout(timeoutId)
    }

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text().catch(() => '')
      console.error('[images API] HF error:', hfResponse.status, errorText)
      return NextResponse.json(
        { error: `Image generation failed (HTTP ${hfResponse.status}). ${hfResponse.status === 429 ? 'Rate limited — wait a moment and retry.' : 'Try again shortly.'}` },
        { status: 502 },
      )
    }

    const imageBuffer = await hfResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    const contentType = hfResponse.headers.get('content-type') ?? 'image/jpeg'

    return NextResponse.json({ imageData: imageBase64, mimeType: contentType, enhancedPrompt: finalPrompt, dimensions: dims })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Generation timed out — the model may be busy. Please retry.' }, { status: 504 })
    }
    const cause = err instanceof Error ? (err as Error & { cause?: unknown }).cause : undefined
    console.error('[images API]', err, cause)
    return NextResponse.json({ error: 'Image generation failed. Please try again.' }, { status: 500 })
  }
}
