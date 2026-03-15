import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId, pageNumber, templateId, panels } = await req.json();
    if (!projectId || pageNumber == null || !templateId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Upsert page
    const { data: existing } = await supabase
      .from('pages')
      .select('id')
      .eq('project_id', projectId)
      .eq('page_number', pageNumber)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from('pages')
        .update({ template_id: templateId, panels })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('pages')
        .insert({ project_id: projectId, page_number: pageNumber, template_id: templateId, panels })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Update project page count
    const { count } = await supabase
      .from('pages')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    await supabase
      .from('projects')
      .update({ page_count: count ?? 0, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', user.id);

    return NextResponse.json({ page: result.data });
  } catch (err: unknown) {
    console.error('[save-page]', err);
    return NextResponse.json({ error: 'Failed to save page' }, { status: 500 });
  }
}
