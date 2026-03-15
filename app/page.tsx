import Link from 'next/link';

const FEATURES = [
  {
    icon: '✦',
    title: 'AI Scriptwriter',
    desc: 'Describe your idea and get a panel-by-panel comic script in seconds.',
  },
  {
    icon: '🎨',
    title: 'Asset Studio',
    desc: 'Generate characters, backgrounds, and props with FLUX.1-dev AI.',
  },
  {
    icon: '🖼️',
    title: 'Panel Builder',
    desc: 'Arrange panels, add speech bubbles, SFX text, and AI-generated art.',
  },
  {
    icon: '🚀',
    title: 'Publish & Share',
    desc: 'Publish your comic publicly and share it with the world instantly.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Tell Your Story', desc: 'Write a concept, pick a genre and style. AI generates the full script.' },
  { step: '02', title: 'Build Your Assets', desc: 'Generate characters, backgrounds, and props with AI image generation.' },
  { step: '03', title: 'Create Your Panels', desc: 'Choose a layout, generate panel art, add speech bubbles and SFX.' },
  { step: '04', title: 'Publish', desc: 'Share your finished comic with the world — or keep it private.' },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <nav style={{ background: 'var(--ink)', padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid var(--accent)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent)', letterSpacing: '0.05em' }}>
          ComicForge
        </span>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="#how-it-works" style={{ color: 'var(--paper)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>How It Works</Link>
          <Link href="#features" style={{ color: 'var(--paper)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Features</Link>
          <Link href="/auth/login" style={{ color: 'var(--paper)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Login</Link>
          <Link href="/auth/signup" className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}>Start Free</Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
        {/* Left */}
        <div>
          <div className="badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', marginBottom: '1rem', fontSize: '0.75rem' }}>
            Powered by NVIDIA NIM AI
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '4.5rem', lineHeight: 1, marginBottom: '1.25rem', letterSpacing: '0.02em' }}>
            Create <span style={{ color: 'var(--accent)' }}>Comics</span><br />With AI
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--midgray)', marginBottom: '2rem', lineHeight: 1.6, maxWidth: '420px' }}>
            Turn any story idea into a real manga or western comic. AI writes the script, generates the art, and arranges your panels — no drawing skills required.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/auth/signup" className="btn-primary" style={{ fontSize: '1.1rem' }}>
              Start Creating Free →
            </Link>
            <Link href="/dashboard" className="btn-secondary">See Examples</Link>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--midgray)', marginTop: '0.75rem' }}>
            No credit card needed. 5 free comics per month.
          </p>
        </div>

        {/* Right — Decorative Panel Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '8px',
            aspectRatio: '1',
            maxWidth: '420px',
            justifySelf: 'end',
          }}
        >
          {['establishing shot of a feudal Japanese village at sunset, manga ink style',
            'fierce samurai woman staring at camera, closeup, manga art',
            'wide shot of a stormy battlefield, dramatic ink hatching',
            'dramatic speech bubble: "This ends NOW!" manga style'].map((label, i) => (
            <div
              key={i}
              className="comic-panel halftone"
              style={{
                minHeight: '180px',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '0.5rem',
                background: `hsl(${i * 40}, 5%, ${88 - i * 3}%)`,
              }}
            >
              <span style={{ fontFamily: 'var(--font-tag)', fontSize: '0.6rem', color: 'var(--midgray)', lineHeight: 1.2 }}>
                {label}
              </span>
              {i === 3 && <div className="speech-bubble" style={{ position: 'relative', bottom: 'auto', left: 'auto', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>This ends NOW!</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Strip ──────────────────────────────────────────────────── */}
      <section id="features" style={{ borderTop: '3px solid var(--ink)', borderBottom: '3px solid var(--ink)', background: 'var(--ink)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                padding: '2rem 1.5rem',
                borderRight: i < 3 ? '3px solid rgba(255,255,255,0.1)' : 'none',
                color: 'var(--paper)',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--accent)' }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(247,244,238,0.7)', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: '1100px', margin: '0 auto', padding: '5rem 2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', textAlign: 'center', marginBottom: '3rem' }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', position: 'relative' }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  border: '3px solid var(--ink)',
                  background: i === 0 ? 'var(--accent)' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  color: i === 0 ? 'white' : 'var(--ink)',
                  margin: '0 auto 1rem',
                  boxShadow: 'var(--shadow)',
                }}
              >
                {step.step}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--midgray)', lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section
        className="halftone"
        style={{
          borderTop: '3px solid var(--ink)',
          borderBottom: '3px solid var(--ink)',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', marginBottom: '0.5rem' }}>
          Start your first comic free.
        </h2>
        <p style={{ color: 'var(--midgray)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          No credit card needed. Jump in and create something amazing.
        </p>
        <Link href="/auth/signup" className="btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
          Create My First Comic →
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--accent)' }}>ComicForge</span>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
          <Link href="/auth/signup" style={{ color: 'var(--paper)', textDecoration: 'none' }}>Sign Up</Link>
          <Link href="/auth/login" style={{ color: 'var(--paper)', textDecoration: 'none' }}>Login</Link>
          <Link href="/dashboard" style={{ color: 'var(--paper)', textDecoration: 'none' }}>Dashboard</Link>
        </div>
        <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0 }}>
          AI-powered comics for everyone
        </p>
      </footer>
    </div>
  );
}
