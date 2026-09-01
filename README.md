# Maths Companion
A gamified React Native + Expo (SDK 57) learning app with a Supabase backend: homework upload, AI processing/summarization, curriculum, practice engine, XP/levels/achievements/missions, and a daily boss battle.

## Tech
- Expo SDK 57 · React Native 19 · TypeScript 6 (strict)
- Supabase (Postgres + Auth + Storage + Edge Functions)
- State: Zustand (auth, ui, upload queue) · Styling: theme Palette + useIsDark
- Routing: expo-router (file-based) · Icons: lucide-react-native

## Environment
Copy `.env.example` to `.env` and fill in:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=            (server-side; same as public URL)
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=          (for AI summaries + tutor)
```
`app.config.ts` reads `EXPO_PUBLIC_*` / `SUPABASE_*` / `API_BASE_URL` via dotenv (see `env.d.ts`).

## Setup
```bash
npm install
npx supabase start           # local dev DB + functions (Docker)
npx supabase db reset        # applies migrations in supabase/migrations
npx supabase functions deploy # deploy process-document + ai-tutor
npx supabase functions serve # run functions locally
npx expo start
```
Then press `i` (iOS) / `a` (Android) or scan the QR with the Expo Go app / run `eas build`.

## Project layout
- `app/` — expo-router routes: `auth/` (login/register, gated by auth state), `app/` (tab shell: index, learn, practice, library, profile) + `upload/` flow, `document/[id]` (viewer), `boss` (daily boss).
- `src/api/` — loose (non-generic) Supabase client + typed helpers.
- `src/services/` — curriculum, documents, upload, practice, recommendations, notifications, game, dashboard.
- `src/store/` — authStore, uiStore, uploadStore.
- `src/hooks/` — useAuth, useDashboard, useDocuments, useNotifications.
- `src/components/` — ui primitives, layout (Screen), gamification cards, forms, curriculum, DocumentViewer.
- `src/theme.tsx` — Palette + ThemeProvider + useIsDark.
- `supabase/migrations/` — schema (20240101) + rls (02) + seed incl. level thresholds/achievements/missions/gamification RPCs (03) + storage (04) + single-user (05) + search (06).
- `supabase/functions/` — `process-document` (OCR/summarize via OpenAI), `ai-tutor` (chat).

## Auth model
`supabase/migrations/20240105000000_single_user.sql` enforces a single dev user. For multi-user, delete that migration, enable public signup, and add a `profiles` row on `auth.users` via the `on_auth_user_created` trigger (see `202402..._rls.sql`).

## Build
```bash
npm run lint      # none configured (add eslint)
npx tsc --noEmit  # type-check
eas build --platform android --profile preview
```
`eas.json` has `preview` + `production` build profiles.

## Notes / manual steps
- Storage: create a private `documents` bucket in Supabase; the RLS migration scopes files per `user/{id}/…` via a path-based policy (no service-role writes from the client).
- Edge functions require `SUPABASE_SERVICE_ROLE_KEY` + `OPENAI_API_KEY` set in the Supabase dashboard (project > Functions > Environment Variables).
- OCR for PDFs/images: `process-document` extracts text only when an `OPENAI_API_KEY` is present; otherwise it marks the document `completed` with a placeholder so downstream screens still render.
- Offline: `useDocuments` caches the library list in AsyncStorage and serves stale data on first render.
