import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId, script } = await req.json();
    if (!projectId || !script) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const { error } = await supabase
      .from('projects')
      .update({
        script,
        title: script.title ?? 'Untitled Comic',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[save-script]', err);
    return NextResponse.json({ error: 'Failed to save script' }, { status: 500 });
  }
}
