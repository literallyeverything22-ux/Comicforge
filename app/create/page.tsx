'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StepSidebar from '@/components/layout/StepSidebar';
import Topbar from '@/components/layout/Topbar';
import type { ComicScript, ScriptLine } from '@/types';

const GENRES = ['Action', 'Romance', 'Horror', 'Sci-Fi', 'Fantasy', 'Slice of Life', 'Comedy'];
const STYLES = ['manga', 'western', 'webtoon'];
const PAGE_OPTIONS = [1, 3, 5];

export default function CreatePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" style={{ width: '2rem', height: '2rem' }} /></div>}>
      <CreatePageInner />
    </Suspense>
  );
}

function CreatePageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const projectId = params.get('projectId');


  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [style, setStyle] = useState('manga');
  const [pages, setPages] = useState(3);
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [script, setScript] = useState<ComicScript | null>(null);
  const [editedLines, setEditedLines] = useState<ScriptLine[]>([]);
  const [savingNext, setSavingNext] = useState(false);

  useEffect(() => {
    if (script) setEditedLines(script.script);
  }, [script]);

  function toggleGenre(genre: string) {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  }

  async function handleGenerateScript() {
    if (!concept.trim()) { setError('Please describe your story concept.'); return; }
    if (!projectId) { setError('No project ID. Try creating a new comic from the dashboard.'); return; }

    setLoading(true);
    setError('');
    setScript(null);

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          genre: selectedGenres.join(', ') || 'General',
          style,
          pages,
          projectId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Script generation failed');
      setScript(data.script);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    if (!projectId || !script) return;
    setSavingNext(true);

    try {
      const res = await fetch('/api/save-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, script: { ...script, script: editedLines } }),
      });

      if (!res.ok) throw new Error('Failed to save script');
      router.push(`/create/${projectId}/assets`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Try again.');
      setSavingNext(false);
    }
  }

  function updateLine(idx: number, field: keyof ScriptLine, value: string) {
    setEditedLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Topbar />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <StepSidebar currentStep={1} />

        {/* Main Content */}
        <main style={{ flex: 1, padding: '2.5rem', maxWidth: '780px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '0.25rem' }}>
            Your Story
          </h1>
          <p style={{ color: 'var(--midgray)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Describe your idea and let AI write the comic script.
          </p>

          {/* Genre Chips */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
              GENRE (select all that apply)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {GENRES.map(g => (
                <button
                  key={g}
                  id={`genre-${g.toLowerCase().replace(' ', '-')}`}
                  className={`chip ${selectedGenres.includes(g) ? 'selected' : ''}`}
                  onClick={() => toggleGenre(g)}
                  type="button"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Style + Pages Row */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
                STYLE
              </label>
              <select
                id="style-select"
                className="inp"
                value={style}
                onChange={e => setStyle(e.target.value)}
              >
                {STYLES.map(s => (
                  <option key={s} value={s}>{s === 'manga' ? 'Manga (B&W)' : s === 'western' ? 'Western Comic' : 'Webtoon'}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
                PAGES
              </label>
              <select
                id="pages-select"
                className="inp"
                value={pages}
                onChange={e => setPages(Number(e.target.value))}
              >
                {PAGE_OPTIONS.map(p => (
                  <option key={p} value={p}>{p} {p === 1 ? 'Page' : 'Pages'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Story Textarea */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
              STORY CONCEPT
            </label>
            <textarea
              id="story-concept"
              className="inp"
              rows={6}
              value={concept}
              onChange={e => setConcept(e.target.value)}
              placeholder="Describe your story concept, a scene, or a full idea... (e.g. 'A young samurai discovers her village burned down and sets out for revenge against the warlord who ordered it.')"
              style={{ resize: 'vertical' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--midgray)', marginTop: '0.25rem' }}>
              {concept.length} characters
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '0.75rem', border: '2px solid var(--accent)', color: 'var(--accent)', marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            id="generate-script-btn"
            className="btn-primary"
            onClick={handleGenerateScript}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ width: '1rem', height: '1rem' }} /> Writing your script...</>
            ) : (
              '✦ Generate Script'
            )}
          </button>

          {/* Generated Script */}
          {script && editedLines.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem' }}>
                  {script.title}
                </h2>
                <span className="badge" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
                  {editedLines.length} panels
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {editedLines.map((line, idx) => (
                  <ScriptLineCard key={idx} line={line} index={idx} onUpdate={updateLine} />
                ))}
              </div>

              <button
                id="next-assets-btn"
                className="btn-ink"
                onClick={handleNext}
                disabled={savingNext}
              >
                {savingNext ? (
                  <><span className="spinner" style={{ width: '1rem', height: '1rem' }} /> Saving...</>
                ) : (
                  'Next: Build Assets →'
                )}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Script Line Card ─────────────────────────────────────────────────────────
function ScriptLineCard({ line, index, onUpdate }: {
  line: ScriptLine;
  index: number;
  onUpdate: (idx: number, field: keyof ScriptLine, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  const TYPE_COLORS: Record<string, string> = {
    establishing: 'var(--accent2)',
    reaction: 'var(--midgray)',
    closeup: 'var(--accent)',
    action: 'var(--accent)',
    dialogue: 'var(--success)',
  };

  return (
    <div className="ink-border-sm bg-white p-4" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', minWidth: '2rem' }}>
          P{line.panel}
        </span>
        <span className="badge" style={{ color: TYPE_COLORS[line.type] ?? 'var(--ink)', borderColor: 'currentColor' }}>
          {line.type}
        </span>
        {!editing && <span style={{ fontSize: '0.75rem', color: 'var(--midgray)', marginLeft: 'auto' }}>click to edit</span>}
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea
            className="inp"
            rows={3}
            value={line.scene}
            onChange={e => onUpdate(index, 'scene', e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: '0.875rem', resize: 'vertical' }}
          />
          <input
            className="inp"
            value={line.dialogue}
            onChange={e => onUpdate(index, 'dialogue', e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder="Dialogue (leave empty if none)"
            style={{ fontSize: '0.875rem' }}
          />
          <button
            className="btn-ghost"
            onClick={e => { e.stopPropagation(); setEditing(false); }}
            style={{ alignSelf: 'flex-end', fontSize: '0.8rem' }}
          >
            ✓ Done
          </button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>{line.scene}</p>
          {line.dialogue && (
            <p style={{ fontSize: '0.825rem', color: 'var(--midgray)', fontStyle: 'italic' }}>
              &ldquo;{line.dialogue}&rdquo;
            </p>
          )}
        </>
      )}
    </div>
  );
}
