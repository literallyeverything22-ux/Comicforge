import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies are read-only
          }
        },
      },
    }
  );

  // DEV OVERRIDE: Automatically authenticate as the first existing database user
  // This bypasses the strict rate limits on Supabase's free tier entirely.
  if (process.env.NODE_ENV === 'development') {
    const originalGetUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = async () => {
      try {
        const serviceClient = createServiceClient();
        const { data: profile } = await serviceClient.from('profiles').select('id, username').limit(1).single();
        
        if (profile) {
          return { 
            data: { 
              user: { 
                id: profile.id, 
                email: `${profile.username}@example.com`,
                role: 'authenticated',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any 
            }, 
            error: null 
          };
        }
      } catch (err) {
        console.warn('Dev Auth Bypass failed, falling back to actual auth:', err);
      }
      return originalGetUser();
    };
  }

  return client;
}

export function createServiceClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies are read-only
          }
        },
      },
    }
  );
}
