import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { projectId, tag, name, type, imageUrl, description, referenceUrl } = body;

    if (!projectId || !tag || !name || !type || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('assets')
      .insert({
        user_id: user.id,
        project_id: projectId,
        tag,
        name,
        type,
        image_url: imageUrl,
        description: description ?? '',
        reference_url: referenceUrl ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ asset: data });
  } catch (err: unknown) {
    console.error('[save-asset]', err);
    return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
  }
}
