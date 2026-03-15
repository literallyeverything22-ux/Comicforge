import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callLLM } from '@/lib/nim/llm';
import { buildScriptPrompt } from '@/lib/utils/promptBuilder';

const SYSTEM_PROMPT = `You are a professional manga/comic scriptwriter. Given a story concept, generate a structured panel-by-panel script.

Return ONLY valid JSON with this exact structure:
{
  "title": "string",
  "script": [
    {
      "panel": 1,
      "type": "establishing",
      "scene": "Visual description of what to draw in this panel",
      "dialogue": "Character dialogue or caption text. Empty string if none.",
      "suggestedAssets": ["character description", "background description"]
    }
  ]
}

Rules:
- Each page = 3-4 panels
- Types: establishing, reaction, closeup, action, dialogue
- Scene descriptions must be visual and specific (for image generation)
- Keep dialogue short (fits in speech bubble)
- Do not include any text outside the JSON object`;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { concept, genre, style, pages, projectId } = body;

    if (!concept || !projectId) {
      return NextResponse.json({ error: 'Missing concept or projectId' }, { status: 400 });
    }

    const userPrompt = buildScriptPrompt(concept, genre ?? 'General', style ?? 'manga', pages ?? 3);
    const rawText = await callLLM(SYSTEM_PROMPT, userPrompt);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format from AI');

    const scriptData = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!scriptData.title || !Array.isArray(scriptData.script)) {
      throw new Error('Unexpected script structure');
    }

    return NextResponse.json({ script: scriptData });
  } catch (err: unknown) {
    console.error('[generate-script]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Script generation failed' },
      { status: 500 }
    );
  }
}
