'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen halftone flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl" style={{ color: 'var(--accent)' }}>
            ComicForge
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--midgray)', fontFamily: 'var(--font-body)' }}>
            Your comics are waiting
          </p>
        </div>

        {/* DEV BYPASS BANNER */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 text-center" style={{ background: '#fef3c7', border: '2px dashed #d97706', borderRadius: '4px' }}>
            <p className="font-bold text-sm" style={{ color: '#b45309', marginBottom: '0.5rem' }}>DEVELOPMENT MODE ACTIVE</p>
            <p className="text-xs mb-3" style={{ color: '#d97706' }}>Local Auth is mocked. You can skip signup/login.</p>
            <Link href="/dashboard" className="btn-secondary justify-center w-full" style={{ padding: '0.5rem' }}>
              Skip Login {"->"} Go to Dashboard 
            </Link>
          </div>
        )}

        {/* Form Card */}
        <div className="ink-border bg-white p-8">
          <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            Welcome Back
          </h2>

          {error && (
            <div className="mb-4 p-3 text-sm font-semibold" style={{ background: '#fef2f2', border: '2px solid var(--accent)', color: 'var(--accent)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-tag)' }}>
                EMAIL
              </label>
              <input
                id="login-email"
                className="inp"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-tag)' }}>
                PASSWORD
              </label>
              <input
                id="login-password"
                className="inp"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn-primary justify-center mt-2"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" style={{ width: '1rem', height: '1rem' }} /> Logging in...</>
              ) : (
                'Log In →'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--midgray)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-bold underline" style={{ color: 'var(--ink)' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
