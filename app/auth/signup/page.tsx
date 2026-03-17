'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      // 1. Sign up
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) {
        console.error('Supabase Auth Error:', signupError);
        throw signupError;
      }
      if (!data.user) throw new Error('Signup failed - no user returned');

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: username.toLowerCase().trim(),
          display_name: username,
          plan: 'free',
        });

      if (profileError) throw profileError;

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Try again.');
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
            Create comics with AI — no drawing skills required
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
            Start for Free
          </h2>

          {error && (
            <div className="mb-4 p-3 text-sm font-semibold" style={{ background: '#fef2f2', border: '2px solid var(--accent)', color: 'var(--accent)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-tag)' }}>
                USERNAME
              </label>
              <input
                id="signup-username"
                className="inp"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="your_name"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-tag)' }}>
                EMAIL
              </label>
              <input
                id="signup-email"
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
                id="signup-password"
                className="inp"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <button
              id="signup-submit"
              type="submit"
              className="btn-primary justify-center mt-2"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" style={{ width: '1rem', height: '1rem' }} /> Creating account...</>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--midgray)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-bold underline" style={{ color: 'var(--ink)' }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
