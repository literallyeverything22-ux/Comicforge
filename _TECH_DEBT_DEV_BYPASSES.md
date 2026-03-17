# Development Bypasses & Tech Debt

This file tracks temporary bypasses and mock implementations added to the codebase specifically for local development to avoid rate limits or speed up testing. 

**IMPORTANT: These must be reviewed, tested, and potentially removed/adjusted before final production launch.**

## 1. Supabase Auth & RLS Bypass (Added Mar 18, 2026)
**Reason:** The free tier of Supabase has a strict limit of 2 emails per hour, which was blocking local development and testing of the `/create` flow.

**Impacted Files:**
- `middleware.ts` (Lines ~9-15)
  - *Change:* Added a check for `process.env.NODE_ENV === 'development'` to completely skip the `NextResponse.redirect(url)` kicks that normally throw unauthenticated users out of `/dashboard` and `/create` to `/auth/login`.
- `lib/supabase/server.ts` (Lines ~30-60)
  - *Change A:* `createClient()` wraps the `supabase.auth.getUser` method. In development mode, it uses the Service Role key to fetch the first existing user profile from the database and returns it as a mocked Session Object. 
  - *Change B:* (Line ~9) `createClient()` initializes the Supabase Server Client using the `SUPABASE_SERVICE_ROLE_KEY` instead of the `ANON_KEY` when `NODE_ENV === 'development'`. This globally bypasses Row Level Security (RLS) policies so that DB inserts / updates (like New Comic, Save Script) succeed despite lacking a real JWT.
- `app/auth/login/page.tsx` & `app/auth/signup/page.tsx`
  - *Change:* Added a UI banner at the top of the forms visible only in `development` mode informing the user that Auth is mocked, and providing a "Skip Login" button to route directly to `/dashboard`.

**Cleanup Action Before Production:**
1. These bypasses strictly check for `process.env.NODE_ENV === 'development'`, meaning they **will safely disable themselves in Vercel Production** (`NODE_ENV === 'production'`).
2. However, for codebase cleanliness, we may eventually want to remove these overrides and replace them with a proper test environment configuration or rely directly on Google OAuth sign-in during final stages.
