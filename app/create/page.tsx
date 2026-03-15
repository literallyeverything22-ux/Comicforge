'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StepSidebar from '@/components/layout/StepSidebar';
import Topbar from '@/components/layout/Topbar';
import type { ComicScript, ScriptLine } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AssetSuggestion {
  id: string;
  type: 'character' | 'background' | 'prop';
  name: string;
  tag: string;
  description: string;
  prompt: string;
}

const GENRES = ['Action', 'Romance', 'Horror', 'Sci-Fi', 'Fantasy', 'Slice of Life', 'Comedy'];
const STYLES = ['manga', 'western', 'webtoon'];
const PAGE_OPTIONS = [1, 3, 5];

const TYPE_CONFIG = {
  character: { color: 'var(--accent)', label: 'Character', emoji: '👤' },
  background: { color: 'var(--accent2)', label: 'Background', emoji: '🏞️' },
  prop: { color: 'var(--midgray)', label: 'Prop', emoji: '🗡️' },
};

// ─── Page Wrapper (Suspense boundary for useSearchParams) ─────────────────────
export default function CreatePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    }>
      <CreatePageInner />
    </Suspense>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function CreatePageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const projectId = params.get('projectId');

  // Script state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [style, setStyle] = useState('manga');
  const [pages, setPages] = useState(3);
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [script, setScript] = useState<ComicScript | null>(null);
  const [editedLines, setEditedLines] = useState<ScriptLine[]>([]);
  const [savingNext, setSavingNext] = useState(false);

  // Asset suggestions state
  const [suggestions, setSuggestions] = useState<AssetSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  useEffect(() => {
    if (script) setEditedLines(script.script);
  }, [script]);

  // Auto-generate asset suggestions after script appears
  const generateSuggestions = useCallback(async (generatedScript: ComicScript) => {
    setLoadingSuggestions(true);
    setSuggestionError('');
    setSuggestions([]);
    try {
      const res = await fetch('/api/generate-asset-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: generatedScript,
          genre: selectedGenres.join(', ') || 'General',
          style,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate suggestions');
      setSuggestions(data.suggestions ?? []);
    } catch (err: unknown) {
      setSuggestionError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  }, [selectedGenres, style]);

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
    setSuggestions([]);

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, genre: selectedGenres.join(', ') || 'General', style, pages, projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Script generation failed');
      setScript(data.script);
      // Kick off asset suggestions in parallel
      generateSuggestions(data.script);
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

  function updateSuggestion(id: string, field: keyof AssetSuggestion, value: string) {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function sendToAssetStudio(suggestion: AssetSuggestion) {
    // Store in localStorage for the Asset Studio to pick up
    const pending = JSON.parse(localStorage.getItem('pending_asset_suggestion') ?? 'null');
    void pending; // just overwrite
    localStorage.setItem('pending_asset_suggestion', JSON.stringify({
      prompt: suggestion.prompt,
      type: suggestion.type,
      tag: suggestion.tag,
      name: suggestion.name,
      description: suggestion.description,
    }));
    router.push(`/create/${projectId}/assets`);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Topbar />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <StepSidebar currentStep={1} />

        {/* Two-column content area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── LEFT: Story Form + Script ──────────────────────────────────── */}
          <main style={{
            flex: '0 0 55%',
            padding: '2.5rem',
            overflowY: 'auto',
            borderRight: '3px solid var(--ink)',
          }}>
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
                <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>STYLE</label>
                <select id="style-select" className="inp" value={style} onChange={e => setStyle(e.target.value)}>
                  {STYLES.map(s => (
                    <option key={s} value={s}>{s === 'manga' ? 'Manga (B&W)' : s === 'western' ? 'Western Comic' : 'Webtoon'}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>PAGES</label>
                <select id="pages-select" className="inp" value={pages} onChange={e => setPages(Number(e.target.value))}>
                  {PAGE_OPTIONS.map(p => (
                    <option key={p} value={p}>{p} {p === 1 ? 'Page' : 'Pages'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Story Textarea */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>STORY CONCEPT</label>
              <textarea
                id="story-concept"
                className="inp"
                rows={6}
                value={concept}
                onChange={e => setConcept(e.target.value)}
                placeholder="Describe your story concept... (e.g. 'A young samurai discovers her village burned down and sets out for revenge against the warlord who ordered it.')"
                style={{ resize: 'vertical' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--midgray)', marginTop: '0.25rem' }}>
                {concept.length} characters
              </p>
            </div>

            {error && (
              <div style={{ padding: '0.75rem', border: '2px solid var(--accent)', color: 'var(--accent)', marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button id="generate-script-btn" className="btn-primary" onClick={handleGenerateScript} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: '1rem', height: '1rem' }} /> Writing your script...</> : '✦ Generate Script'}
            </button>

            {/* Generated Script */}
            {script && editedLines.length > 0 && (
              <div style={{ marginTop: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem' }}>{script.title}</h2>
                  <span className="badge" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
                    {editedLines.length} panels
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                  {editedLines.map((line, idx) => (
                    <ScriptLineCard key={idx} line={line} index={idx} onUpdate={updateLine} />
                  ))}
                </div>
                <button id="next-assets-btn" className="btn-ink" onClick={handleNext} disabled={savingNext}>
                  {savingNext ? <><span className="spinner" style={{ width: '1rem', height: '1rem' }} /> Saving...</> : 'Next: Build Assets →'}
                </button>
              </div>
            )}
          </main>

          {/* ── RIGHT: Asset Suggestions Panel ────────────────────────────── */}
          <aside style={{
            flex: '0 0 45%',
            padding: '2rem 1.5rem',
            overflowY: 'auto',
            background: 'white',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem' }}>Asset Suggestions</h2>
              {loadingSuggestions && <span className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} />}
            </div>

            {/* Empty state (before script) */}
            {!script && !loadingSuggestions && suggestions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--midgray)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎨</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Asset ideas will appear here
                </p>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                  After generating your script, AI will suggest characters, backgrounds, and props — with ready-to-use image prompts you can tweak.
                </p>
              </div>
            )}

            {/* Loading suggestions */}
            {loadingSuggestions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="halftone"
                    style={{ height: '120px', border: '2px solid var(--gray)', animationDelay: `${i * 0.1}s` }}
                  />
                ))}
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--midgray)', fontFamily: 'var(--font-tag)' }}>
                  AI is analyzing your script...
                </p>
              </div>
            )}

            {/* Suggestion error */}
            {suggestionError && (
              <div style={{ padding: '0.75rem', border: '2px solid var(--accent)', color: 'var(--accent)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {suggestionError}
              </div>
            )}

            {/* Suggestions list */}
            {suggestions.length > 0 && (
              <>
                <p style={{ fontSize: '0.8rem', color: 'var(--midgray)', marginBottom: '1rem', fontFamily: 'var(--font-tag)', letterSpacing: '0.05em' }}>
                  {suggestions.length} ASSETS FOUND — EDIT THEN SEND TO STUDIO
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {suggestions.map(s => (
                    <AssetSuggestionCard
                      key={s.id}
                      suggestion={s}
                      onUpdate={updateSuggestion}
                      onGenerate={sendToAssetStudio}
                    />
                  ))}
                </div>

                {/* Send all to studio */}
                <div style={{ marginTop: '1.5rem', padding: '1rem', border: '2px dashed var(--gray)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--midgray)', marginBottom: '0.75rem' }}>
                    💡 Click <strong>→ Studio</strong> on any card to open Asset Studio with that prompt pre-filled. You can generate all of them one by one.
                  </p>
                  <button
                    id="next-assets-skip-btn"
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.875rem' }}
                    onClick={handleNext}
                    disabled={savingNext || !script}
                  >
                    Skip to Asset Studio →
                  </button>
                </div>
              </>
            )}

            {/* Regenerate suggestions button */}
            {script && !loadingSuggestions && (
              <button
                id="regen-suggestions-btn"
                className="btn-ghost"
                style={{ marginTop: '1rem', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
                onClick={() => generateSuggestions(script)}
              >
                ↺ Regenerate Suggestions
              </button>
            )}
          </aside>
        </div>
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
    <div className="ink-border-sm bg-white p-4" onClick={() => setEditing(true)} style={{ cursor: 'pointer', background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', minWidth: '2rem' }}>P{line.panel}</span>
        <span className="badge" style={{ color: TYPE_COLORS[line.type] ?? 'var(--ink)', borderColor: 'currentColor' }}>{line.type}</span>
        {!editing && <span style={{ fontSize: '0.75rem', color: 'var(--midgray)', marginLeft: 'auto' }}>click to edit</span>}
      </div>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea
            className="inp" rows={3} value={line.scene}
            onChange={e => onUpdate(index, 'scene', e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: '0.875rem', resize: 'vertical' }}
          />
          <input
            className="inp" value={line.dialogue}
            onChange={e => onUpdate(index, 'dialogue', e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder="Dialogue (leave empty if none)"
            style={{ fontSize: '0.875rem' }}
          />
          <button className="btn-ghost" onClick={e => { e.stopPropagation(); setEditing(false); }} style={{ alignSelf: 'flex-end', fontSize: '0.8rem' }}>✓ Done</button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>{line.scene}</p>
          {line.dialogue && (
            <p style={{ fontSize: '0.825rem', color: 'var(--midgray)', fontStyle: 'italic' }}>&ldquo;{line.dialogue}&rdquo;</p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Asset Suggestion Card ─────────────────────────────────────────────────────
function AssetSuggestionCard({
  suggestion,
  onUpdate,
  onGenerate,
}: {
  suggestion: AssetSuggestion;
  onUpdate: (id: string, field: keyof AssetSuggestion, value: string) => void;
  onGenerate: (s: AssetSuggestion) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[suggestion.type];

  return (
    <div
      style={{
        border: '2px solid var(--ink)',
        background: 'var(--paper)',
        boxShadow: '3px 3px 0 var(--ink)',
      }}
    >
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', borderBottom: expanded ? '2px solid var(--ink)' : 'none', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <span style={{ fontSize: '1.1rem' }}>{cfg.emoji}</span>
        <span className="badge" style={{ color: cfg.color, borderColor: cfg.color, fontSize: '0.65rem', flexShrink: 0 }}>{cfg.label}</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <input
            id={`suggestion-name-${suggestion.id}`}
            value={suggestion.name}
            onChange={e => { e.stopPropagation(); onUpdate(suggestion.id, 'name', e.target.value); }}
            onClick={e => e.stopPropagation()}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              border: 'none',
              background: 'transparent',
              width: '100%',
              outline: 'none',
              cursor: 'text',
            }}
          />
          <div style={{ fontFamily: 'var(--font-tag)', fontSize: '0.65rem', color: 'var(--midgray)' }}>{suggestion.tag}</div>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--midgray)', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div>
            <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.65rem', color: 'var(--midgray)', display: 'block', marginBottom: '0.2rem' }}>TAG</label>
            <input
              id={`suggestion-tag-${suggestion.id}`}
              className="inp"
              value={suggestion.tag}
              onChange={e => onUpdate(suggestion.id, 'tag', e.target.value)}
              style={{ fontSize: '0.8rem', fontFamily: 'var(--font-tag)' }}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.65rem', color: 'var(--midgray)', display: 'block', marginBottom: '0.2rem' }}>DESCRIPTION</label>
            <textarea
              id={`suggestion-desc-${suggestion.id}`}
              className="inp"
              rows={2}
              value={suggestion.description}
              onChange={e => onUpdate(suggestion.id, 'description', e.target.value)}
              style={{ fontSize: '0.8rem', resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.65rem', color: 'var(--midgray)', display: 'block', marginBottom: '0.2rem' }}>IMAGE PROMPT — tweak before generating</label>
            <textarea
              id={`suggestion-prompt-${suggestion.id}`}
              className="inp"
              rows={3}
              value={suggestion.prompt}
              onChange={e => onUpdate(suggestion.id, 'prompt', e.target.value)}
              style={{ fontSize: '0.8rem', resize: 'vertical', fontFamily: 'var(--font-tag)' }}
            />
          </div>

          <button
            id={`send-to-studio-${suggestion.id}`}
            className="btn-primary"
            style={{ fontSize: '0.875rem', alignSelf: 'stretch', justifyContent: 'center' }}
            onClick={() => onGenerate(suggestion)}
          >
            → Generate in Asset Studio
          </button>
        </div>
      )}
    </div>
  );
}
