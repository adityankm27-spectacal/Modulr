# Modulr

Subscription learning platform for engineering students: animated explainers, short notes,
formula sheets, solved PYQs and viva prep for every module. The full specification is
[`MODULR_SPEC.md`](MODULR_SPEC.md); the design rules are in
[`design-system/modulr/MASTER.md`](design-system/modulr/MASTER.md).

## Layout

```
apps/web          Next.js 16 (App Router) + Tailwind 4: public site, student app; /admin from M2
apps/mobile       Expo Android app                                         (M6, placeholder)
packages/shared   Brand tokens, domain enums, settings, entitlement + attendance logic
supabase/         config.toml, migrations, seed.sql (DUMMY data)
scripts/          db-verify.sh + database tests
```

## Setup

Requirements: Node ≥ 20.9 (see `.nvmrc`), pnpm 10, and either Docker (for the local Supabase
stack) or a local Postgres ≥ 14 (enough for `pnpm db:verify`).

```bash
npm install -g pnpm   # or: corepack enable
pnpm install
```

### Run it locally

Needs Docker (OrbStack works: `brew install --cask orbstack`).

```bash
pnpm db:start                     # Supabase + migrations + DUMMY seed; prints URL and keys
cp .env.example apps/web/.env.local   # then paste NEXT_PUBLIC_SUPABASE_URL / ANON_KEY
pnpm dev                          # http://localhost:3000
```

- **Email sign-in codes** land in the local Mailpit inbox at http://127.0.0.1:54324 (no real
  email is sent locally).
- **Google sign-in** needs `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `_SECRET` in a root `.env`
  before `pnpm db:start`. Email codes work without it.
- `pnpm db:reset` re-applies migrations + seed from scratch; `pnpm db:types` regenerates
  `packages/shared/src/database.generated.ts` from the migrations (local Postgres, no Docker).

### Becoming an admin

Sign in once (so your account exists), then promote it. Locally:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "update profiles set role = 'admin' where email = 'you@example.com'"
```

On hosted Supabase, run the same `update` in the SQL editor. Admins see an **Admin** link in the
header (`/admin`): catalog tree, subject and module editors with drag-to-reorder, publish and
free-preview switches, a Markdown + LaTeX editor with the student renderer as live preview, formula
cards, questions, CSV import (template at `/templates/questions-import.csv`) and preview-as-student
(drafts included). Non-admins get a 404 there, and RLS blocks their writes regardless.

### Hosted Supabase checklist

- Auth → Email Templates: the **Magic Link** and **Confirm signup** templates must contain
  `{{ .Token }}` (copy `supabase/templates/*.html`), otherwise users get a link instead of a code.
- Auth → URL Configuration: add `https://<domain>/auth/callback` as a redirect URL.
- Enable the Google provider with your OAuth client.

## Checks

```bash
pnpm check       # prettier + eslint + typecheck + unit tests
pnpm db:verify   # migrations + seed + RLS/entitlement tests on a throwaway local Postgres DB
pnpm db:verify --url postgresql://postgres:postgres@127.0.0.1:54322/postgres   # same tests on local Supabase
pnpm build
```

## Database notes

- **Entitlement** has one rule set in two places that must stay in sync:
  `has_access()` / `has_subject_access()` in `supabase/migrations/…_rls.sql` (enforced by RLS)
  and `packages/shared/src/entitlement.ts` (for UI and server logic). Both are tested.
- **Grants are explicit.** The RLS migration revokes Supabase's default table grants from
  `anon`/`authenticated` and grants only what each role needs. A new table needs its own
  `grant` + `enable row level security` + policies in its migration.
- **Open decisions (spec §16)** are rows in `app_settings` (defaults mirrored in
  `packages/shared/src/settings.ts`): free-preview modules, trial days, device limits, grace
  days, Android payments, PDF downloads, reviewers, domain, support email.
- **Seed data is DUMMY.** Never ship it; it exists only for development.

Fixed seed ids: college `10000000-0000-4000-8000-000000000001`, subjects
`40000000-0000-4000-8000-00000000000{1,2}`, modules `50000000-0000-4000-8000-0000000000{S}{M}`,
monthly plan `60000000-0000-4000-8000-000000000001`.
