import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateImages, generateImageFromReference } from '@/lib/nim/images';
import { buildPanelPrompt } from '@/lib/utils/promptBuilder';
import type { ComicStyle } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { scriptLine, assets, style } = body;

    if (!scriptLine?.scene) {
      return NextResponse.json({ error: 'Missing scriptLine.scene' }, { status: 400 });
    }

    const prompt = buildPanelPrompt(scriptLine.scene, assets ?? [], style as ComicStyle ?? 'manga');

    // Use Canny-dev if any asset has a reference image
    const assetWithRef = (assets ?? []).find((a: { referenceUrl?: string }) => !!a.referenceUrl);

    let imageUrl: string;
    if (assetWithRef?.referenceUrl) {
      // Strip data URL prefix to get base64
      const base64 = assetWithRef.referenceUrl.replace(/^data:image\/\w+;base64,/, '');
      imageUrl = await generateImageFromReference(prompt, base64);
    } else {
      // SDXL requires width and height >= 1024. We generate squares and let frontend object-cover handle the panel aspect ratio.
      const dims = { w: 1024, h: 1024 };
      const images = await generateImages(prompt, 1, dims.w, dims.h);
      imageUrl = images[0];
    }

    return NextResponse.json({ imageUrl });
  } catch (err: unknown) {
    console.error('[generate-panel]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Panel generation failed' },
      { status: 500 }
    );
  }
}
