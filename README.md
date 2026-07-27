# 7315-CTR0 EC — Manuscript System

A single-author manuscript writing app: rich-text chapters, character profiles,
timeline/stats, and a Supabase backend. Deployed on Vercel.

## Features

- Rich text editor (TipTap): H1/H2/H3, Bold, Italic, Strikethrough, Monospace, Block Quote, scene breaks (`***`)
- Keyboard shortcuts (⌘B, ⌘I, etc.)
- Drag-and-drop chapter reordering; inline chapter rename (double-click)
- Character profiles with photo upload
- Timeline and per-chapter statistics views
- Trash with restore / permanent delete
- 30-day rolling word-count graph
- Verified autosave (see **Autosave** below)
- Export to `.md` and `.docx`

## Stack

- Next.js 14 (App Router) + React 18, TipTap editor, `docx` for Word export
- Supabase (Postgres + Storage) accessed server-side via the service role
- Auth via a single password → signed JWT cookie, enforced in middleware **and** every API route

## Setup

```bash
npm install
npm run dev      # http://localhost:3000
```

Local dev needs the environment variables below in a `.env.local` (never commit it —
it's gitignored). In production these live in the Vercel dashboard.

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key — browser-side, used only for cover uploads (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — server-only, used by all API routes. **Secret.** |
| `JWT_SECRET` | Signs the auth JWT. **Secret**, long & random (≥32 bytes); never log or commit it. |
| `APP_PASSWORD` | The single shared login password. **Secret**, high-entropy. |
| `TOKEN_VERSION` | Optional (default `"1"`). Bump to revoke all sessions — see **Session revocation**. |

## Deploy

Pushing to `main` auto-deploys to **production** on Vercel. There is no separate
staging/preview step in the current workflow, so `main` is prod. Env vars are set
in the Vercel dashboard, not in the repo.

## Database

Supabase tables (Postgres): `manuscripts`, `chapters`, `characters`,
`word_count_log`, `chapter_timeline`, and `login_attempts` (login rate limiting).
Character/cover images use the `covers` Storage bucket. **Row Level Security is
enabled** on the tables; the app reaches them through the service role in API routes.

One-time migration for the login rate limiter:

```sql
create table if not exists login_attempts (
  ip           text primary key,
  attempts     int not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz
);
alter table login_attempts enable row level security;
-- no policies: only the service role (which bypasses RLS) can touch it
```

## Autosave

Edits are buffered and flushed to Supabase with verification: the save-status
indicator (SYNCED / SAVING / RETRYING / SAVE FAILED / SESSION EXPIRED) reflects the
**actual** server result, not a timer. Failed writes retry with backoff; pending
edits are flushed on tab-hide, refocus, unmount, and page unload. All writes go
through the `queueSave` engine in `src/components/App.jsx` — new write paths should
use it rather than calling the API directly.

## Security

Auth model and hardening (single-author; there are intentionally no per-user
accounts — see **Not implemented**):

- **Login:** one shared `APP_PASSWORD`, compared in constant time
  (`crypto.timingSafeEqual` over SHA-256 digests). On success, issues an HS256 JWT.
- **Session cookie** `auth`: `httpOnly`, `secure`, `sameSite=strict`, **7-day** expiry.
  These flags defeat XSS cookie theft, network sniffing, and CSRF respectively.
- **Enforced everywhere:** the JWT is verified in `src/middleware.ts` **and** inside
  every API route via `requireAuth()` (`src/lib/auth.ts`). Route handlers never trust
  the middleware alone — defense in depth against a middleware bypass.
- **Login rate limiting:** per-IP via the `login_attempts` table — 8 attempts / 15-min
  window, then a 15-min lockout (HTTP 429). **Fails open** if the table/DB is
  unavailable, so the owner is never locked out by limiter infra.
- **Session revocation ("log out everywhere"):** the JWT carries a `v` claim equal to
  `TOKEN_VERSION`, checked on every request. To invalidate **all** outstanding sessions,
  bump `TOKEN_VERSION` in Vercel (e.g. `1` → `2`) and redeploy. This does **not** require
  rotating `JWT_SECRET`.
- **Logout:** `POST /api/auth/logout` expires the cookie; there's a Log out button in
  the dashboard topbar.
- **Mass-assignment protection:** every write allow-lists its columns (`pick()` in
  `src/lib/auth.ts`), so callers can't spoof `id`/timestamps or reparent records.
- **Generic error responses:** DB errors are logged server-side; clients get a generic
  message (no schema leakage).
- **Security headers** (`next.config.js`): a permissive CSP plus `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`.
- **CVE-2025-29927:** patched by pinning Next.js to `^14.2.25` (the middleware
  authorization-bypass fix). Do not downgrade below this.

### Secret hygiene

`JWT_SECRET` is the crown jewel: anyone who has it can forge valid sessions without the
password. Keep it long, random, and out of logs/commits. It does **not** need routine
rotation; the `TOKEN_VERSION` lever handles "kill all sessions" without touching it.

### Not implemented (by decision)

- **Per-user accounts** and **2FA** — the app is intentionally single-author with one
  shared password. Adding any per-user capability is a separate, deliberate decision.
