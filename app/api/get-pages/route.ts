import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const { data: pages, error } = await supabase
      .from('pages')
      .select('*')
      .eq('project_id', projectId)
      .order('page_number', { ascending: true });

    if (error) throw error;

    let plan = 'free';
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
      plan = profile?.plan ?? 'free';
    }

    return NextResponse.json({ pages: pages ?? [], plan });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}
