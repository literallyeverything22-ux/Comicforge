import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callLLM } from '@/lib/nim/llm';
import type { ComicStyle } from '@/types';

export interface AssetSuggestion {
  id: string;
  type: 'character' | 'background' | 'prop';
  name: string;
  tag: string;
  description: string;
  prompt: string;
}

const SYSTEM_PROMPT = `You are a comic art director. Given a comic script, extract ALL visual assets required: characters, backgrounds/environments, and props/objects.

For each asset return:
- type: "character" | "background" | "prop"
- name: a proper character/place/object name
- tag: short @handle (no spaces, lowercase, e.g. @akane, @kage_village)
- description: 1-sentence physical description for the asset sheet
- prompt: a detailed text-to-image generation prompt (include style cues based on the comic style)

Return ONLY valid JSON array. No markdown, no explanation. Example:
[
  {
    "type": "character",
    "name": "Akane",
    "tag": "@akane",
    "description": "Young female ninja, late teens, short dark hair, determined eyes, wearing black shinobi outfit.",
    "prompt": "young female ninja, short black hair, determined expression, black shinobi outfit with red sash, manga ink style, black and white, clean linework, detailed"
  }
]`;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { script, genre, style } = await req.json() as {
      script: { title: string; script: Array<{ scene: string; dialogue?: string }> };
      genre: string;
      style: ComicStyle;
    };

    if (!script?.script) return NextResponse.json({ error: 'Missing script' }, { status: 400 });

    // Build a compact script for the LLM
    const scriptText = script.script
      .map((p, i) => `Panel ${i + 1}: ${p.scene}${p.dialogue ? ` | Dialogue: "${p.dialogue}"` : ''}`)
      .join('\n');

    const userPrompt = `Comic: "${script.title}"
Genre: ${genre || 'General'}
Style: ${style || 'manga'}

Script:
${scriptText}

Extract all characters, backgrounds, and props from this script. Generate image prompts appropriate for the ${style || 'manga'} style.`;

    const raw = await callLLM(SYSTEM_PROMPT, userPrompt);

    // Extract JSON array from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in LLM response');

    const suggestions: AssetSuggestion[] = JSON.parse(jsonMatch[0]);

    // Add stable IDs
    const withIds = suggestions.map((s, i) => ({
      ...s,
      id: `suggestion-${Date.now()}-${i}`,
    }));

    return NextResponse.json({ suggestions: withIds });
  } catch (err: unknown) {
    console.error('[generate-asset-suggestions]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
