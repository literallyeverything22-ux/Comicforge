import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Page, Panel } from '@/types';

export default async function PublicReaderPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*, profiles(username, display_name)')
    .eq('id', params.projectId)
    .eq('status', 'published')
    .single();

  if (!project) notFound();

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('project_id', params.projectId)
    .order('page_number', { ascending: true });

  const author = (project.profiles as { username: string; display_name: string } | null);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      {/* Topbar */}
      <nav style={{ background: 'var(--ink)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--accent)' }}>ComicForge</span>
        </Link>
        <Link href="/dashboard" className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.4rem 1rem' }}>My Dashboard</Link>
      </nav>

      {/* Comic Header */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2.5rem 1.5rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', marginBottom: '0.5rem' }}>
          {project.title}
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {author && (
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              by {author.display_name ?? author.username}
            </span>
          )}
          {project.genre && <span className="badge" style={{ color: 'var(--accent2)', borderColor: 'var(--accent2)' }}>{project.genre}</span>}
          <span className="badge" style={{ color: 'var(--midgray)', borderColor: 'var(--midgray)' }}>{project.style}</span>
          <span className="badge" style={{ color: 'var(--ink)', borderColor: 'var(--ink)' }}>{(pages ?? []).length} pages</span>
        </div>

        {/* Pages */}
        {(pages ?? []).map((page: Page, pageIdx: number) => (
          <div key={page.id} style={{ marginBottom: '2rem' }}>
            <div style={{ fontFamily: 'var(--font-tag)', fontSize: '0.7rem', color: 'var(--midgray)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
              PAGE {pageIdx + 1}
            </div>
            <PageRenderer page={page} />
          </div>
        ))}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', padding: '1.5rem 0', borderTop: '3px solid var(--ink)' }}>
          <LikeButton projectId={params.projectId} />
          <ShareButton />
        </div>

        {/* CTA Banner */}
        <div className="halftone ink-border" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem' }}>
            Inspired? Create your own →
          </h2>
          <p style={{ color: 'var(--midgray)', marginBottom: '1.5rem' }}>
            Turn any story idea into a comic with AI. Free to start.
          </p>
          <Link href="/auth/signup" className="btn-primary">
            Start for Free
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page Renderer ────────────────────────────────────────────────────────────
function PageRenderer({ page }: { page: Page }) {
  const gridStyles: Record<string, React.CSSProperties> = {
    twobytwo:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '3px' },
    threestrip: { display: 'grid', gridTemplateRows: '1fr 1fr 1fr', gap: '3px' },
    full_splash: { display: 'grid', gridTemplateColumns: '1fr' },
    splash_2: { display: 'grid', gridTemplateRows: '1.5fr 1fr', gap: '3px' },
  };

  return (
    <div className="comic-panel" style={{ width: '100%', background: 'white' }}>
      <div style={{ ...gridStyles[page.template_id] }}>
        {(page.panels ?? []).map((panel: Panel, idx: number) => (
          <div
            key={idx}
            style={{
              position: 'relative',
              borderRight: idx % 2 === 0 && page.template_id === 'twobytwo' ? '2px solid var(--ink)' : 'none',
              borderBottom: '2px solid var(--ink)',
              minHeight: page.template_id === 'full_splash' ? '500px' : '200px',
              overflow: 'hidden',
              background: panel.image_url ? `url(${panel.image_url}) center/cover` : 'var(--gray)',
            }}
          >
            {!panel.image_url && (
              <div className="halftone" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--midgray)', fontSize: '0.8rem' }}>Panel {idx + 1}</span>
              </div>
            )}

            {panel.sfx_text && (
              <div className="sfx-text" style={{ top: '0.5rem', left: '0.5rem', fontSize: '1.25rem' }}>
                {panel.sfx_text}
              </div>
            )}

            {panel.speech_bubbles?.map(bubble => (
              <div key={bubble.id} className="speech-bubble" style={{ top: '0.5rem', right: '0.5rem', position: 'absolute' }}>
                {bubble.text}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Like Button (client component) ──────────────────────────────────────────
function LikeButton({ projectId }: { projectId: string }) {
  return (
    <form action={async () => {
      'use server';
      // Like tracking can be implemented post-MVP
      console.log('Liked project', projectId);
    }}>
      <button id="like-btn" type="submit" className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
        ♡ Like
      </button>
    </form>
  );
}

// ─── Share Button ─────────────────────────────────────────────────────────────
function ShareButton() {
  return (
    <button
      id="share-btn"
      className="btn-ghost"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onClick={() => { if (typeof window !== 'undefined') { (navigator as any).clipboard?.writeText(window.location.href); } }}
    >
      🔗 Copy Link
    </button>
  );
}
