'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import StepSidebar from '@/components/layout/StepSidebar';
import Topbar from '@/components/layout/Topbar';
import Link from 'next/link';
import type { Asset } from '@/types';

type AssetType = 'character' | 'background' | 'prop';

export default function AssetStudioPage() {
  const { projectId } = useParams<{ projectId: string }>();

  // Generation state
  const [activeTab, setActiveTab] = useState<AssetType>('character');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [genError, setGenError] = useState('');

  // Save form state
  const [tag, setTag] = useState('@');
  const [assetName, setAssetName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Library
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  // Reference image
  const fileRef = useRef<HTMLInputElement>(null);
  const [refImageUrl, setRefImageUrl] = useState<string | null>(null);

  // Fetch existing assets
  useEffect(() => {
    async function loadAssets() {
      try {
        const res = await fetch(`/api/get-assets?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setAssets(data.assets ?? []);
        }
      } finally {
        setLoadingAssets(false);
      }
    }
    if (projectId) loadAssets();
  }, [projectId]);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenError('');
    setGeneratedImages([]);
    setSelectedImage(null);

    try {
      const res = await fetch('/api/generate-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: activeTab, style: 'manga' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setGeneratedImages(data.images ?? []);
      setDescription(prompt);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (selectedImage === null || !tag || !assetName) {
      setSaveError('Select an image, tag, and name first.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const res = await fetch('/api/save-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          tag: tag.startsWith('@') ? tag : `@${tag}`,
          name: assetName,
          type: activeTab,
          imageUrl: generatedImages[selectedImage],
          description,
          referenceUrl: refImageUrl ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setAssets(prev => [data.asset, ...prev]);
      setSelectedImage(null);
      setTag('@');
      setAssetName('');
      setDescription('');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAsset(assetId: string) {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    await fetch(`/api/delete-asset?id=${assetId}`, { method: 'DELETE' });
  }

  function handleRefImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRefImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Topbar />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <StepSidebar currentStep={2} />

        {/* Main + Sidebar */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Main Generation Area */}
          <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', borderRight: '3px solid var(--ink)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem' }}>Generate Assets</h1>
              <span className="badge" style={{ color: 'var(--accent2)', borderColor: 'var(--accent2)', fontSize: '0.8rem' }}>
                Powered by FLUX.1-dev
              </span>
            </div>

            {/* Tab Row */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '3px solid var(--ink)' }}>
              {(['character', 'background', 'prop'] as AssetType[]).map(tab => (
                <button
                  key={tab}
                  id={`tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.6rem 1.5rem',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                    letterSpacing: '0.05em',
                    border: '3px solid var(--ink)',
                    borderBottom: 'none',
                    marginBottom: '-3px',
                    background: activeTab === tab ? 'var(--ink)' : 'white',
                    color: activeTab === tab ? 'var(--paper)' : 'var(--ink)',
                    cursor: 'pointer',
                    marginRight: '0.25rem',
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Prompt Input */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input
                id="asset-prompt"
                className="inp"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={
                  activeTab === 'character'
                    ? 'e.g. young samurai woman with red armor and short black hair'
                    : activeTab === 'background'
                    ? 'e.g. misty mountain village at dawn with traditional buildings'
                    : 'e.g. ancient katana with ornate dragon handle'
                }
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              />
              <button id="generate-asset-btn" className="btn-primary" onClick={handleGenerate} disabled={generating} style={{ flexShrink: 0 }}>
                {generating ? <span className="spinner" style={{ width: '1rem', height: '1rem' }} /> : 'Generate'}
              </button>
            </div>

            {genError && (
              <div style={{ padding: '0.75rem', border: '2px solid var(--accent)', color: 'var(--accent)', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                {genError}
              </div>
            )}

            {/* Image Grid */}
            {generating && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="comic-panel halftone" style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
                  </div>
                ))}
              </div>
            )}

            {generatedImages.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {generatedImages.map((url, idx) => (
                  <div
                    key={idx}
                    id={`variation-${idx}`}
                    className="comic-panel"
                    onClick={() => setSelectedImage(idx)}
                    style={{
                      cursor: 'pointer',
                      aspectRatio: '1',
                      outline: selectedImage === idx ? '4px solid var(--accent)' : 'none',
                      outlineOffset: '-4px',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Variation ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem' }}>
                      <span className="badge" style={{ background: 'rgba(0,0,0,0.8)', color: 'white', borderColor: 'transparent', fontSize: '0.7rem' }}>
                        Variation {idx + 1}
                      </span>
                    </div>
                    {selectedImage === idx && (
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                        <span className="badge" style={{ background: 'var(--accent)', color: 'white', borderColor: 'transparent' }}>✓ Selected</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tag & Save Panel */}
            {selectedImage !== null && (
              <div className="ink-border-sm" style={{ background: 'white', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '1rem' }}>Tag &amp; Save</h3>

                {saveError && (
                  <div style={{ padding: '0.5rem', border: '2px solid var(--accent)', color: 'var(--accent)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    {saveError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>TAG</label>
                    <input
                      id="asset-tag"
                      className="inp"
                      value={tag}
                      onChange={e => setTag(e.target.value.startsWith('@') ? e.target.value : `@${e.target.value}`)}
                      placeholder="@character_name"
                      style={{ fontFamily: 'var(--font-tag)' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>NAME</label>
                    <input
                      id="asset-name"
                      className="inp"
                      value={assetName}
                      onChange={e => setAssetName(e.target.value)}
                      placeholder="Display name"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontFamily: 'var(--font-tag)', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>DESCRIPTION</label>
                  <input
                    id="asset-description"
                    className="inp"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description used in panel prompts"
                  />
                </div>

                <button id="save-asset-btn" className="btn-ink" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: '1rem', height: '1rem' }} /> Saving...</> : '✓ Save to Library'}
                </button>
              </div>
            )}

            {/* Reference Image Upload */}
            <div
              className="halftone"
              style={{ border: '2px dashed var(--gray)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', marginBottom: '2rem' }}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleRefImageUpload} />
              {refImageUrl ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={refImageUrl} alt="Reference" style={{ maxHeight: '120px', margin: '0 auto', border: '2px solid var(--ink)' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--midgray)', marginTop: '0.5rem' }}>Reference image uploaded — enables character consistency</p>
                </div>
              ) : (
                <>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.25rem' }}>+ Upload Reference Image</p>
                  <p style={{ fontSize: 0.8 + 'rem', color: 'var(--midgray)' }}>Optional — locks character appearance across panels (uses FLUX.1-Canny-dev)</p>
                </>
              )}
            </div>

            {/* Next Button */}
            <div style={{ textAlign: 'right' }}>
              <Link href={`/create/${projectId}/build`} className="btn-primary">
                Assets Ready → Panel Builder
              </Link>
            </div>
          </main>

          {/* Asset Library Sidebar */}
          <aside style={{ width: '280px', padding: '2rem 1.25rem', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Asset Library</h2>

            {loadingAssets ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>
            ) : assets.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--midgray)', fontSize: '0.875rem', padding: '2rem 0' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No assets yet</p>
                <p>Generate your first character or background.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {assets.map(asset => (
                  <AssetLibraryItem key={asset.id} asset={asset} onDelete={handleDeleteAsset} />
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Asset Library Item ───────────────────────────────────────────────────────
function AssetLibraryItem({ asset, onDelete }: { asset: Asset; onDelete: (id: string) => void }) {
  const TYPE_COLORS: Record<string, string> = {
    character: 'var(--accent)',
    background: 'var(--accent2)',
    prop: 'var(--midgray)',
  };

  return (
    <div className="ink-border-sm" style={{ background: 'white', display: 'flex', gap: '0.75rem', padding: '0.5rem', alignItems: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.image_url} alt={asset.name} style={{ width: '60px', height: '60px', objectFit: 'cover', border: '2px solid var(--ink)', flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ fontFamily: 'var(--font-tag)', fontSize: '0.8rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {asset.tag}
        </p>
        <span className="badge" style={{ color: TYPE_COLORS[asset.type], borderColor: TYPE_COLORS[asset.type], fontSize: '0.65rem' }}>
          {asset.type}
        </span>
      </div>
      <button
        onClick={() => onDelete(asset.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--midgray)', fontSize: '1rem', padding: '0.25rem' }}
        title="Delete asset"
      >
        ✕
      </button>
    </div>
  );
}
