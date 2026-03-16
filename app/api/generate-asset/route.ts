import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateImages } from '@/lib/nim/images';
import { buildAssetPrompt } from '@/lib/utils/promptBuilder';
import type { ComicStyle } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { prompt, type, style } = body as { prompt: string; type: string; style: ComicStyle };

    if (!prompt || !type) {
      return NextResponse.json({ error: 'Missing prompt or type' }, { status: 400 });
    }

    const compositePrompt = buildAssetPrompt(prompt, style ?? 'manga');
    const images = await generateImages(compositePrompt, 4, 1024, 1024);

    return NextResponse.json({ images });
  } catch (err: unknown) {
    console.error('[generate-asset]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Image generation failed' },
      { status: 500 }
    );
  }
}
