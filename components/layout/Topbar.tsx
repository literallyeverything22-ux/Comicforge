'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface TopbarProps {
  showAuth?: boolean;
}

export default function Topbar({ showAuth = true }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <nav
      style={{
        background: 'var(--ink)',
        borderBottom: '3px solid var(--ink)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            color: 'var(--accent)',
            letterSpacing: '0.05em',
          }}
        >
          ComicForge
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ color: 'var(--paper)', textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600 }}>
          My Comics
        </Link>
        <Link href="/create" style={{ color: 'var(--paper)', textDecoration: 'none', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600 }}>
          Create
        </Link>

        {showAuth && (
          <button
            id="topbar-logout"
            onClick={handleLogout}
            className="btn-primary"
            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
          >
            Log Out
          </button>
        )}
      </div>
    </nav>
  );
}
