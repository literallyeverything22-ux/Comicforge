import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId, visibility } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    // Check user plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const allowedVisibility =
      profile?.plan === 'free' ? 'public' : visibility ?? 'public';

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        status: 'published',
        visibility: allowedVisibility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ project });
  } catch (err: unknown) {
    console.error('[publish-project]', err);
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
  }
}
