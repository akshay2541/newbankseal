# Bank Seal — working notes

Bank auction marketplace. Next.js 15 App Router, TypeScript strict, Tailwind v4,
Drizzle + Neon PostgreSQL. Treat this as a production security-sensitive application,
not a prototype.

## Commands

```bash
npm run dev            # dev server
npm run typecheck      # tsc --noEmit — run before claiming a change works
npm run lint
npm run build          # fails on type or lint errors by design
npm run db:generate    # after ANY schema change
npm run db:seed        # idempotent
```

## Non-negotiables

- **Never bypass `defineRoute`.** Every API route goes through
  `src/server/api/route-handler.ts`, which applies CSRF, rate limiting, body limits,
  schema validation, permission checks and safe error serialisation. A handwritten
  handler silently drops all of it.
- **Never check roles inline.** Use `requirePermission(session, '<permission>')`.
  Add new permissions to the `Permission` union and `ROLE_PERMISSIONS` in
  `src/server/auth/rbac.ts`. `if (user.role === 'admin')` is a bug.
- **Public listing queries must compose `publicScope()`** from
  `src/server/repositories/listing-repository.ts`. It is what stops a draft or withdrawn
  listing being reachable by guessing an id.
- **Validate on the server, always.** Client-side Zod is for feedback only. Both sides
  share the schemas in `src/lib/validation/`.
- **Money is `bigint` paise** in the database, converted to rupees only at the DTO
  boundary. Never store a float.
- **No raw hex in components.** Add a token to `@theme` in `src/app/globals.css`.
- **Dropdowns/menus go through `src/components/ui/select.tsx`** (Radix Select, styled
  with our tokens). Don't hand-roll a listbox — typeahead, roving focus and collision
  positioning are why the library is there. Compose it like `category-select.tsx`.
- **UI never imports `@/db/*` or a repository.** Fetch in a page/route handler and pass
  props down. ESLint enforces this for `src/components/**` and `src/features/**`.
- **Every server module starts with `import 'server-only'`.**
- **Errors leave through `toPublicError`.** Never return a driver message, stack or
  internal id to a client.
- **Audit security-sensitive actions** with `recordAudit`. Auth events, role changes,
  publishes and administrative mutations all qualify.

## Conventions

- Comments explain *why*, not *what*. The security modules carry the reasoning behind
  each decision — keep that standard when editing them.
- DTOs in `src/domain/` are deliberately narrower than table rows. Widen them
  consciously, never by spreading a row.
- Prefer native platform behaviour over JS: the rails use scroll-snap, the hero search
  is a plain GET form that works without JavaScript.
- Accessibility is part of "done": labelled controls, `aria-live` on async feedback,
  visible focus, and the ARIA tabs pattern where tabs are used.

## Known follow-ups

- Rate-limit store is in-process; swap for Redis via `setRateLimitStore` before scaling
  past one instance.
- Email verification and password reset are scaffolded (`verification_tokens` table,
  `verificationTokens` schema) but not wired to a provider.
- Denormalised counters (`cities.listing_count`, `banks.listing_count`) are refreshed by
  the seed only — they need a scheduled job.
- `/explore`, `/listings/[slug]`, `/banks/[slug]` are linked from the homepage but not
  yet built.
