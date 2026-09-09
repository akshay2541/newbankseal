# Bank Seal

A marketplace for verified bank-seized and SARFAESI auction assets — properties,
vehicles, plant and machinery — across India.

**Stack:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 ·
Drizzle ORM · Neon PostgreSQL

---

## Getting started

```bash
npm install
cp .env.example .env.local
```

Generate the two secrets and paste them into `.env.local`:

```bash
openssl rand -base64 48   # SESSION_SECRET
openssl rand -base64 48   # CSRF_SECRET
```

Add your Neon connection string as `DATABASE_URL`, then create and seed the schema:

```bash
npm run db:push     # or: npm run db:migrate  (applies src/db/migrations)
npm run db:seed
npm run dev
```

> **Before Neon is provisioned:** with `DATABASE_URL` unset, the homepage renders from
> a built-in sample dataset so the UI is reviewable immediately. This is scoped to
> development and the build step — a *serving* production process without a database
> fails loudly rather than showing placeholder figures. See
> `src/server/services/home-service.ts`.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a migration from the schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push the schema directly (development only) |
| `npm run db:seed` | Load reference data (idempotent) |
| `npm run db:studio` | Drizzle Studio |

---

## Architecture

Dependencies point in one direction. UI never reaches the database; the database layer
knows nothing about HTTP.

```
src/app/         Routes, layouts, route handlers  — the only place that fetches
src/features/    Feature-scoped components (home, auth)
src/components/  Reusable UI primitives and layout chrome
src/domain/      DTOs shared across the server/client boundary
src/server/      Business logic
  ├── api/           defineRoute — the single API entry point
  ├── auth/          sessions, RBAC, current-user helpers
  ├── security/      crypto, CSRF, rate limiting, request context
  ├── services/      use-cases (auth, audit, homepage aggregation)
  └── repositories/  data access — the only callers of Drizzle
src/db/          Schema, migrations, seed
src/lib/         Framework-free utilities (env, errors, logger, validation)
src/middleware.ts  Edge: CSP nonce, origin guard, CSRF cookie
```

Two mechanisms keep the layering honest:

- **`server-only`** — imported by every server module. A client-component import of one
  becomes a build error, so a connection string can never reach the browser bundle.
- **ESLint `no-restricted-imports`** — `src/components/**` and `src/features/**` cannot
  import `@/db/*` or a repository. Presentation receives data as props.

### Where to add things

| Task | Where |
| --- | --- |
| New API endpoint | `src/app/api/**/route.ts`, wrapped in `defineRoute` |
| New query | `src/server/repositories/` — compose `publicScope()` for anything public |
| New business rule | `src/server/services/` |
| New permission | `src/server/auth/rbac.ts` (`Permission` union + `ROLE_PERMISSIONS`) |
| New table | `src/db/schema/`, then `npm run db:generate` |
| New colour / radius | `@theme` in `src/app/globals.css` — never a raw hex in a component |
| New dropdown / menu | Compose `src/components/ui/select.tsx` (Radix Select, themed) |

---

## Security

Design notes live next to the code they describe. The summary:

**Authentication.** Argon2id password hashing at OWASP-recommended parameters, with a
stored algorithm version so costs can be raised and hashes upgraded transparently on
next login. Sessions are opaque 256-bit random tokens; only a SHA-256 digest is stored,
so a database disclosure yields nothing presentable. Cookies are `httpOnly`, `SameSite=Lax`,
`Secure` in production, and carry the `__Host-` prefix there. Sessions have both a rolling
idle timeout and a hard absolute cap, and are revoked in bulk on password change.

**Authorization.** Permission-based, not role-based, at the call site:
`requirePermission(session, 'listing:publish')`. Roles map to permissions in exactly one
table, so adding a role is one edit rather than an audit of every branch.
`requireOwnershipOrPermission` covers IDOR on owned resources, and `publicScope()` keeps
unpublished listings out of every public query at the SQL level.

**CSRF.** Signed double-submit tokens (HMAC-SHA256) plus an `Origin` check enforced twice:
in edge middleware before any work happens, and again in `defineRoute`. Sign-out is a POST
for the same reason.

**Input.** Zod schemas at every boundary; client-side validation is convenience only.
Bodies are capped at 64 KB and checked both by `Content-Length` and after reading, since
the header is client-supplied. Redirect targets are restricted to single-slash-prefixed
relative paths, which closes the `//evil.example` open-redirect.

**Rate limiting.** Per-endpoint fixed windows, with identifiers hashed before they become
keys. Login is throttled per IP+email *and* backed by a per-account lockout, so a
distributed attempt that defeats the IP limit still cannot grind one account.
The default store is in-process — **wire a shared store before running more than one
instance** via `setRateLimitStore` in `src/server/security/rate-limit.ts`.

**Enumeration.** Registering a taken address, signing in with an unknown address and
signing in with a wrong password are indistinguishable in status, body and approximate
timing (`burnEquivalentWork` spends comparable CPU on the unknown-user branch).

**Transport & headers.** HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, COOP/CORP, and a per-request nonce CSP with
`strict-dynamic` — no `unsafe-inline` for scripts. Fonts are self-hosted by `next/font`,
so `font-src` stays `'self'` and no visitor IP reaches a font CDN.

**Errors & audit.** Every error leaves through `toPublicError`, which returns a fixed
message per code; the real cause is logged server-side with a request id. Security-relevant
actions write to an append-only `audit_logs` table. The logger redacts credential-shaped
keys as a backstop.

### Before going to production

- [ ] Set every variable in `.env.example`; rotate the two secrets away from any dev value.
- [ ] Replace the in-process rate-limit store with Redis (`setRateLimitStore`).
- [ ] Grant the application's database role `INSERT`/`SELECT` only on `audit_logs`.
- [ ] Wire an email provider, then flip new-user `status` to `pending_verification`
      in `registerUser` to require verification.
- [ ] Schedule `purgeExpiredSessions()` and a job to refresh the denormalised counters.
- [ ] Point `APP_URL` at the real origin — CSRF and cookie scoping both depend on it.

---

## Design system

The theme is derived from the marketplace design and lives entirely in `@theme` in
[`src/app/globals.css`](src/app/globals.css): the `brand` azure scale, the `ink` neutral
ramp, the `price` accent, radii (`rounded-card`, `rounded-hero`), shadows and the 1200px
content column. Components reference tokens, never hex values, so a palette change is a
one-file edit.

Typography is Inter for body and Plus Jakarta Sans for display headings, both self-hosted.

> **Note on branding:** the reference design carries the "BANKRUPTCY" wordmark. The build
> uses "BANK SEAL" throughout, sourced from `siteConfig.wordmark` in
> [`src/lib/site-config.ts`](src/lib/site-config.ts) — change it there if you want the
> original wordmark back.

The hero photograph is served locally from `public/images/` — no third-party request,
no extra CSP host, and Next's optimiser still resizes it per breakpoint. Remaining
photography (listings, articles) points at Unsplash, allow-listed in both
`next.config.ts` and the CSP `img-src`; replace with your own asset host and update
both allow-lists together.

Bank marks live in `public/images/banks/<bank-slug>.webp` and are referenced by
`banks.logo_url`. Adding one is a two-step data change: drop the file in using the
bank's slug as the filename, then set `logoUrl` on that bank in
[`src/db/seed-data.ts`](src/db/seed-data.ts) and re-seed. Any bank without a file falls
back to a coloured monogram, so a missing logo never breaks a row.

City landmarks in the Top Cities grid come from
[`src/components/ui/city-icon.tsx`](src/components/ui/city-icon.tsx), keyed by city slug.
The designer's SVGs were converted into that module by extracting only each path's `d`
attribute (validated against a strict path-data charset) and re-rendering with
`stroke="currentColor"`, so the icons inherit the theme and no third-party SVG markup
reaches the DOM. A city with no glyph falls back to a generic building.

Dropdowns are built on Radix Select, styled entirely against our tokens in
[`src/components/ui/select.tsx`](src/components/ui/select.tsx).
