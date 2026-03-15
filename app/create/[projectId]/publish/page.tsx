'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StepSidebar from '@/components/layout/StepSidebar';
import Topbar from '@/components/layout/Topbar';
import type { Page } from '@/types';

export default function PublishPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [project, setProject] = useState<{ title: string; genre: string; style: string; status: string; plan?: string } | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [currentPage, setCurrentPage] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    async function load() {
      const [projRes, pagesRes] = await Promise.all([
        fetch(`/api/get-project?id=${projectId}`),
        fetch(`/api/get-pages?projectId=${projectId}`),
      ]);
      if (projRes.ok) {
        const { project: p } = await projRes.json();
        setProject(p);
      }
      if (pagesRes.ok) {
        const { pages: pg, plan: pl } = await pagesRes.json();
        setPages(pg ?? []);
        setPlan(pl ?? 'free');
      }
    }
    if (projectId) load();
  }, [projectId]);

  async function handlePublish() {
    setPublishing(true);
    setError('');
    try {
      const res = await fetch('/api/publish-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, visibility }),
      });
      if (!res.ok) throw new Error('Publish failed');
      router.push(`/read/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Publish failed');
      setPublishing(false);
    }
  }

  const page = pages[currentPage];
  const firstPanel = page?.panels?.[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Topbar />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <StepSidebar currentStep={4} />

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left — Comic Viewer */}
          <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', borderRight: '3px solid var(--ink)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '1.5rem' }}>
              {project?.title ?? 'Your Comic'}
            </h1>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {project?.genre && <span className="badge" style={{ color: 'var(--accent2)', borderColor: 'var(--accent2)' }}>{project.genre}</span>}
              {project?.style && <span className="badge" style={{ color: 'var(--midgray)', borderColor: 'var(--midgray)' }}>{project.style}</span>}
              <span className="badge" style={{ color: 'var(--ink)', borderColor: 'var(--ink)' }}>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Page Preview */}
            {page ? (
              <div>
                <div
                  className="comic-panel"
                  style={{ maxWidth: '480px', marginBottom: '1rem' }}
                >
                  {firstPanel?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={firstPanel.image_url} alt={`Page ${currentPage + 1}`} style={{ width: '100%', display: 'block' }} />
                  ) : (
                    <div className="halftone" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'var(--midgray)', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Page {currentPage + 1}</span>
                    </div>
                  )}
                </div>

                {/* Page Nav */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button id="prev-page-btn" className="btn-secondary" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem' }}>← Prev</button>
                  <span style={{ fontFamily: 'var(--font-tag)', fontSize: '0.8rem' }}>Page {currentPage + 1} / {pages.length}</span>
                  <button id="next-page-btn" className="btn-secondary" onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))} disabled={currentPage === pages.length - 1} style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem' }}>Next →</button>
                </div>
              </div>
            ) : (
              <div className="halftone" style={{ height: '300px', border: '2px dashed var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--midgray)' }}>No pages finalized yet. Go back to the Panel Builder.</p>
              </div>
            )}
          </main>

          {/* Right — Publish Controls */}
          <aside style={{ width: '280px', flexShrink: 0, padding: '2rem 1.25rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '1.25rem' }}>Publish</h2>

            {/* Visibility */}
            <h3 style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', color: 'var(--midgray)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>VISIBILITY</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  id="visibility-public"
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>Public</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--midgray)' }}>Anyone can read your comic</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: plan === 'free' ? 'not-allowed' : 'pointer', opacity: plan === 'free' ? 0.5 : 1 }}>
                <input
                  id="visibility-private"
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={() => plan !== 'free' && setVisibility('private')}
                  disabled={plan === 'free'}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>Private {plan === 'free' && <span className="badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', fontSize: '0.65rem', marginLeft: '0.25rem' }}>PRO</span>}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--midgray)' }}>Only you can see this comic</div>
                </div>
              </label>
            </div>

            {error && (
              <div style={{ padding: '0.5rem', border: '2px solid var(--accent)', color: 'var(--accent)', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              id="publish-btn"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handlePublish}
              disabled={publishing || pages.length === 0}
            >
              {publishing ? <><span className="spinner" style={{ width: '1rem', height: '1rem' }} /> Publishing...</> : '🚀 Publish Comic'}
            </button>

            {pages.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--midgray)', marginTop: '0.5rem' }}>
                Finalize at least one page in the Panel Builder first.
              </p>
            )}

            {/* Export section (Pro locked) */}
            <div style={{ marginTop: '2rem', borderTop: '2px solid var(--gray)', paddingTop: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', color: 'var(--midgray)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>EXPORT</h3>
              <button
                id="export-pdf-btn"
                disabled
                style={{ width: '100%', padding: '0.6rem', border: '2px solid var(--gray)', color: 'var(--midgray)', background: 'white', cursor: 'not-allowed', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                PDF Export{' '}
                <span className="badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', fontSize: '0.65rem' }}>PRO</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
