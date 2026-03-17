import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Topbar from '@/components/layout/Topbar';
import type { Project } from '@/types';

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, plan')
    .eq('id', user.id)
    .single();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Topbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '0.25rem' }}>
              My Comics
            </h1>
            <p style={{ color: 'var(--midgray)', fontSize: '0.9rem' }}>
              {profile?.display_name ?? profile?.username ?? 'Creator'} •{' '}
              <span
                style={{
                  fontFamily: 'var(--font-tag)',
                  fontSize: '0.75rem',
                  padding: '0.1rem 0.5rem',
                  border: '2px solid var(--accent2)',
                  color: 'var(--accent2)',
                  textTransform: 'uppercase',
                }}
              >
                {profile?.plan ?? 'free'}
              </span>
            </p>
          </div>

          <NewComicButton userId={user.id} />
        </div>

        {/* Project Grid */}
        {!projects || projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {(projects as Project[]).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── New Comic Button ─────────────────────────────────────────────────────────
function NewComicButton({ userId }: { userId: string }) {
  return (
    <form action={async () => {
      'use server';
      const { createClient: createSupabase } = await import('@/lib/supabase/server');
      const supabase = createSupabase();
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          title: 'Untitled Comic',
          style: 'manga',
          status: 'draft',
          visibility: 'public',
        })
        .select('id')
        .single();

      if (error) console.error('Error creating project:', error);

      if (data?.id) {
        const { redirect: serverRedirect } = await import('next/navigation');
        serverRedirect(`/create?projectId=${data.id}`);
      }
    }}>
      <button id="new-comic-btn" type="submit" className="btn-primary">
        + New Comic
      </button>
    </form>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const href =
    project.status === 'published'
      ? `/read/${project.id}`
      : `/create?projectId=${project.id}`;

  const updatedAt = new Date(project.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="comic-card" style={{ overflow: 'hidden' }}>
        {/* Cover */}
        <div
          style={{
            height: '180px',
            background: project.cover_panel_url ? `url(${project.cover_panel_url})` : 'var(--gray)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderBottom: '3px solid var(--ink)',
            position: 'relative',
          }}
        >
          {!project.cover_panel_url && (
            <div
              className="halftone"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--midgray)' }}>
                📖
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
            <span
              className="badge"
              style={{
                background: project.status === 'published' ? 'var(--success)' : 'var(--accent)',
                color: 'white',
                borderColor: 'var(--ink)',
              }}
            >
              {project.status === 'published' ? '✓ Published' : '✎ Draft'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '0.25rem' }}>
            {project.title}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {project.genre && (
              <span className="badge" style={{ color: 'var(--accent2)', borderColor: 'var(--accent2)' }}>
                {project.genre}
              </span>
            )}
            <span className="badge" style={{ color: 'var(--midgray)', borderColor: 'var(--midgray)' }}>
              {project.style}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--midgray)', marginLeft: 'auto' }}>
              {project.page_count}p • {updatedAt}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      className="halftone"
      style={{
        border: '3px dashed var(--gray)',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', marginBottom: '1rem' }}>
        📖
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem' }}>
        No comics yet
      </h2>
      <p style={{ color: 'var(--midgray)', marginBottom: '2rem' }}>
        Start your first comic — no drawing skills required!
      </p>
      <Link href="/create" className="btn-primary">
        Start My First Comic →
      </Link>
    </div>
  );
}
