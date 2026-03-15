'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import StepSidebar from '@/components/layout/StepSidebar';
import Topbar from '@/components/layout/Topbar';
import Link from 'next/link';
import type { Asset, ScriptLine, Panel, SpeechBubble } from '@/types';

type TemplateId = 'twobytwo' | 'splash_2' | 'threestrip' | 'full_splash';

const TEMPLATES: { id: TemplateId; label: string; description: string; panelCount: number }[] = [
  { id: 'twobytwo', label: '2×2 Grid', description: '4 equal panels', panelCount: 4 },
  { id: 'splash_2', label: 'Splash + 2', description: 'Wide top + 2 below', panelCount: 3 },
  { id: 'threestrip', label: '3 Strip', description: '3 horizontal strips', panelCount: 3 },
  { id: 'full_splash', label: 'Full Splash', description: 'One full-page panel', panelCount: 1 },
];

const TEMPLATE_PANEL_POSITIONS: Record<TemplateId, ('wide' | 'square' | 'tall')[]> = {
  twobytwo:   ['square', 'square', 'square', 'square'],
  splash_2:   ['wide', 'square', 'square'],
  threestrip: ['wide', 'wide', 'wide'],
  full_splash: ['wide'],
};

export default function PanelBuilderPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [template, setTemplate] = useState<TemplateId>('twobytwo');
  const [scriptLines, setScriptLines] = useState<ScriptLine[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [activePanel, setActivePanel] = useState(0);
  const [generating, setGenerating] = useState<Record<number, boolean>>({});
  const [sfxInput, setSfxInput] = useState('');
  const [bubbleText, setBubbleText] = useState('');
  const [bubbleType, setBubbleType] = useState<'speech' | 'thought' | 'caption'>('speech');
  const [saving, setSaving] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [error, setError] = useState('');
  const [pageNumber] = useState(1);

  // Load script and assets on mount
  useEffect(() => {
    async function load() {
      const [projectRes, assetsRes] = await Promise.all([
        fetch(`/api/get-project?id=${projectId}`),
        fetch(`/api/get-assets?projectId=${projectId}`),
      ]);
      if (projectRes.ok) {
        const { project } = await projectRes.json();
        if (project?.script?.script) setScriptLines(project.script.script);
      }
      if (assetsRes.ok) {
        const { assets: a } = await assetsRes.json();
        setAssets(a ?? []);
      }
    }
    if (projectId) load();
  }, [projectId]);

  // Initialize panels when template or script changes
  useEffect(() => {
    const positions = TEMPLATE_PANEL_POSITIONS[template];
    const newPanels: Panel[] = positions.map((position, idx) => ({
      panel_index: idx,
      position,
      image_url: null,
      script_ref: scriptLines[idx]?.scene ?? '',
      speech_bubbles: [],
      sfx_text: null,
      active_assets: [],
    }));
    setPanels(newPanels);
    setActivePanel(0);
  }, [template, scriptLines]);

  async function generatePanel(panelIdx: number) {
    const panel = panels[panelIdx];
    const scriptLine = scriptLines[panelIdx] ?? { scene: panel.script_ref, dialogue: '' };
    const panelAssets = assets.filter(a => panel.active_assets.includes(a.tag));

    setGenerating(prev => ({ ...prev, [panelIdx]: true }));
    setError('');

    try {
      const res = await fetch('/api/generate-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptLine,
          assets: panelAssets.map(a => ({
            tag: a.tag,
            description: a.description,
            imageUrl: a.image_url,
            referenceUrl: a.reference_url ?? undefined,
          })),
          style: 'manga',
          panelPosition: panel.position,
          projectId,
          pageId: `${projectId}-page-${pageNumber}`,
          panelIndex: panelIdx,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');

      setPanels(prev => prev.map((p, i) => i === panelIdx ? { ...p, image_url: data.imageUrl } : p));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Panel generation failed');
    } finally {
      setGenerating(prev => ({ ...prev, [panelIdx]: false }));
    }
  }

  async function generateAll() {
    for (let i = 0; i < panels.length; i++) {
      await generatePanel(i);
    }
  }

  function addSpeechBubble() {
    if (!bubbleText.trim()) return;
    const bubble: SpeechBubble = {
      id: `bubble-${Date.now()}`,
      text: bubbleText,
      position: 'top-right',
      type: bubbleType,
    };
    setPanels(prev => prev.map((p, i) => i === activePanel
      ? { ...p, speech_bubbles: [...p.speech_bubbles, bubble] }
      : p
    ));
    setBubbleText('');
  }

  function addSfx() {
    if (!sfxInput.trim()) return;
    setPanels(prev => prev.map((p, i) => i === activePanel ? { ...p, sfx_text: sfxInput.toUpperCase() } : p));
    setSfxInput('');
  }

  function toggleAsset(tag: string) {
    setPanels(prev => prev.map((p, i) => {
      if (i !== activePanel) return p;
      const has = p.active_assets.includes(tag);
      return { ...p, active_assets: has ? p.active_assets.filter(t => t !== tag) : [...p.active_assets, tag] };
    }));
  }

  function removeBubble(panelIdx: number, bubbleId: string) {
    setPanels(prev => prev.map((p, i) => i === panelIdx
      ? { ...p, speech_bubbles: p.speech_bubbles.filter(b => b.id !== bubbleId) }
      : p
    ));
  }

  async function finalizePage() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/save-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, pageNumber, templateId: template, panels }),
      });
      if (!res.ok) throw new Error('Save failed');
      setFinalized(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const activePanelData = panels[activePanel];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Topbar />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <StepSidebar currentStep={3} />

        {/* Three-column layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left — Template Selector */}
          <aside style={{ width: '220px', flexShrink: 0, borderRight: '3px solid var(--ink)', background: 'white', padding: '1.25rem', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', color: 'var(--midgray)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>TEMPLATES</h3>
            {TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                id={`template-${tmpl.id}`}
                onClick={() => setTemplate(tmpl.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  border: '2px solid var(--ink)',
                  background: template === tmpl.id ? 'var(--ink)' : 'white',
                  color: template === tmpl.id ? 'var(--paper)' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{tmpl.label}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{tmpl.description}</div>
                {/* Mini grid preview */}
                <TemplatePreview id={tmpl.id} selected={template === tmpl.id} />
              </button>
            ))}
          </aside>

          {/* Center — Canvas */}
          <main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', borderRight: '3px solid var(--ink)' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>Page {pageNumber}</h1>
                {error && <p style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</p>}
              </div>
              <button id="generate-all-btn" className="btn-primary" onClick={generateAll}>✦ Generate All</button>
            </div>

            {/* Comic Page */}
            <div className="comic-panel" style={{ width: '100%', maxWidth: '520px', background: 'white' }}>
              <PageLayout template={template} panels={panels} activePanel={activePanel} generating={generating} onPanelClick={setActivePanel} onGenerate={generatePanel} onRemoveBubble={removeBubble} />
            </div>

            {/* Finalize / Next */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignSelf: 'stretch', justifyContent: 'flex-end' }}>
              <button id="finalize-page-btn" className="btn-secondary" onClick={finalizePage} disabled={saving || finalized}>
                {saving ? <><span className="spinner" style={{ width: '1rem', height: '1rem' }} /> Saving...</> : finalized ? '✓ Page Finalized' : 'Finalize Page'}
              </button>
              {finalized && (
                <Link href={`/create/${projectId}/publish`} className="btn-primary">
                  Publish →
                </Link>
              )}
            </div>
          </main>

          {/* Right — Script & Controls */}
          <aside style={{ width: '280px', flexShrink: 0, padding: '1.25rem', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', color: 'var(--midgray)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>SCRIPT</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {scriptLines.map((line, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePanel(Math.min(idx, panels.length - 1))}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem',
                    border: '2px solid var(--ink)',
                    background: activePanel === idx ? 'var(--ink)' : 'white',
                    color: activePanel === idx ? 'var(--paper)' : 'var(--ink)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  <strong>P{line.panel}</strong> — {line.scene.slice(0, 60)}...
                </button>
              ))}
            </div>

            {/* Active Assets */}
            <h3 style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', color: 'var(--midgray)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>ACTIVE ASSETS (Panel {activePanel + 1})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {assets.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--midgray)' }}>No assets in project yet.</p>
              ) : assets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => toggleAsset(asset.tag)}
                  className={activePanelData?.active_assets.includes(asset.tag) ? 'chip selected' : 'chip'}
                  style={{ fontSize: '0.75rem' }}
                >
                  {asset.tag}
                </button>
              ))}
            </div>

            {/* SFX */}
            <h3 style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', color: 'var(--midgray)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>SFX TEXT</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input id="sfx-input" className="inp" value={sfxInput} onChange={e => setSfxInput(e.target.value)} placeholder="CRASH!!" style={{ fontSize: '0.9rem' }} />
              <button id="add-sfx-btn" className="btn-ink" onClick={addSfx} style={{ flexShrink: 0, fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}>Add</button>
            </div>

            {/* Speech Bubbles */}
            <h3 style={{ fontFamily: 'var(--font-tag)', fontSize: '0.75rem', color: 'var(--midgray)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>SPEECH BUBBLE</h3>
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
              {(['speech', 'thought', 'caption'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setBubbleType(t)}
                  className={bubbleType === t ? 'chip selected' : 'chip'}
                  style={{ fontSize: '0.7rem' }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input id="bubble-text" className="inp" value={bubbleText} onChange={e => setBubbleText(e.target.value)} placeholder="Dialogue text..." style={{ fontSize: '0.9rem' }} />
              <button id="add-bubble-btn" className="btn-ink" onClick={addSpeechBubble} style={{ flexShrink: 0, fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}>Add</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Template Preview (mini) ─────────────────────────────────────────────────
function TemplatePreview({ id, selected }: { id: TemplateId; selected: boolean }) {
  const color = selected ? 'rgba(255,255,255,0.4)' : 'var(--gray)';
  const activeColor = selected ? 'rgba(255,255,255,0.7)' : 'var(--midgray)';

  const grids: Record<TemplateId, React.ReactNode> = {
    twobytwo: (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', height: '32px', marginTop: '6px' }}>
        {[0,1,2,3].map(i => <div key={i} style={{ background: activeColor, border: `1px solid ${color}` }} />)}
      </div>
    ),
    splash_2: (
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '2px', height: '32px', marginTop: '6px' }}>
        <div style={{ background: activeColor, border: `1px solid ${color}` }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          <div style={{ background: activeColor, border: `1px solid ${color}` }} />
          <div style={{ background: activeColor, border: `1px solid ${color}` }} />
        </div>
      </div>
    ),
    threestrip: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '32px', marginTop: '6px' }}>
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, background: activeColor, border: `1px solid ${color}` }} />)}
      </div>
    ),
    full_splash: (
      <div style={{ height: '32px', marginTop: '6px', background: activeColor, border: `1px solid ${color}` }} />
    ),
  };

  return grids[id];
}

// ─── Page Layout Grid ─────────────────────────────────────────────────────────
function PageLayout({ template, panels, activePanel, generating, onPanelClick, onGenerate, onRemoveBubble }: {
  template: TemplateId;
  panels: Panel[];
  activePanel: number;
  generating: Record<number, boolean>;
  onPanelClick: (idx: number) => void;
  onGenerate: (idx: number) => void;
  onRemoveBubble: (panelIdx: number, bubbleId: string) => void;
}) {
  const gridStyles: Record<TemplateId, React.CSSProperties> = {
    twobytwo:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' },
    splash_2:   { display: 'grid', gridTemplateRows: '1.5fr 1fr', gridTemplateColumns: '1fr' },
    threestrip: { display: 'grid', gridTemplateRows: '1fr 1fr 1fr', gridTemplateColumns: '1fr' },
    full_splash: { display: 'grid', gridTemplateColumns: '1fr', gridTemplateRows: '1fr' },
  };

  const renderPanels = (panelIndices: number[]) => panelIndices.map(idx => (
    <div
      key={idx}
      onClick={() => onPanelClick(idx)}
      style={{
        position: 'relative',
        borderRight: '2px solid var(--ink)',
        borderBottom: '2px solid var(--ink)',
        minHeight: template === 'full_splash' ? '600px' : template === 'threestrip' ? '160px' : '200px',
        background: panels[idx]?.image_url ? `url(${panels[idx].image_url}) center/cover` : 'var(--gray)',
        cursor: 'pointer',
        outline: activePanel === idx ? '3px solid var(--accent)' : 'none',
        outlineOffset: '-3px',
        overflow: 'hidden',
      }}
    >
      {/* Halftone placeholder */}
      {!panels[idx]?.image_url && !generating[idx] && (
        <div className="halftone" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--midgray)', fontFamily: 'var(--font-tag)' }}>Panel {idx + 1}</span>
          <button
            id={`generate-panel-${idx}`}
            className="btn-secondary"
            onClick={e => { e.stopPropagation(); onGenerate(idx); }}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            ✦ Generate
          </button>
        </div>
      )}

      {/* Loading state */}
      {generating[idx] && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(247,244,238,0.9)' }}>
          <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
        </div>
      )}

      {/* Regenerate button on hover */}
      {panels[idx]?.image_url && (
        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0 }} className="regen-btn">
          <button className="btn-ink" onClick={e => { e.stopPropagation(); onGenerate(idx); }} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>↺ Regen</button>
        </div>
      )}

      {/* SFX Text */}
      {panels[idx]?.sfx_text && (
        <div className="sfx-text" style={{ top: '0.5rem', left: '0.5rem', fontSize: '1.5rem' }}>
          {panels[idx].sfx_text}
        </div>
      )}

      {/* Speech Bubbles */}
      {panels[idx]?.speech_bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="speech-bubble"
          style={{ top: '0.5rem', right: '0.5rem', position: 'absolute', zIndex: 10 }}
          onClick={e => e.stopPropagation()}
          title="Click × to remove"
        >
          {bubble.text}
          <button
            onClick={() => onRemoveBubble(idx, bubble.id)}
            style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', border: '2px solid var(--ink)', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  ));

  const panelIndices = panels.map((_, i) => i);

  if (template === 'splash_2') {
    return (
      <div style={{ minHeight: '400px' }}>
        <div style={{ position: 'relative', borderBottom: '3px solid var(--ink)', minHeight: '200px', background: panels[0]?.image_url ? `url(${panels[0].image_url}) center/cover` : 'var(--gray)', cursor: 'pointer', outline: activePanel === 0 ? '3px solid var(--accent)' : 'none', outlineOffset: '-3px', overflow: 'hidden' }} onClick={() => onPanelClick(0)}>
          {!panels[0]?.image_url && !generating[0] && (
            <div className="halftone" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <button id="generate-panel-0" className="btn-secondary" onClick={e => { e.stopPropagation(); onGenerate(0); }} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>✦ Generate</button>
            </div>
          )}
          {generating[0] && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(247,244,238,0.9)' }}><span className="spinner" style={{ width: '2rem', height: '2rem' }} /></div>}
          {panels[0]?.sfx_text && <div className="sfx-text" style={{ top: '0.5rem', left: '0.5rem', fontSize: '1.5rem' }}>{panels[0].sfx_text}</div>}
          {panels[0]?.speech_bubbles.map(b => (
            <div key={b.id} className="speech-bubble" style={{ top: '0.5rem', right: '0.5rem', position: 'absolute' }} onClick={e => e.stopPropagation()}>{b.text}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {renderPanels([1, 2])}
        </div>
      </div>
    );
  }

  return <div style={{ ...gridStyles[template], minHeight: '400px' }}>{renderPanels(panelIndices)}</div>;
}
