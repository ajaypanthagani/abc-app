# abc-app

Ads By Creators — creator dashboard at `app.adsbycreators.com`. Phase 1:
the onboarding flow (sign in with Instagram → profile + parallel data sync →
"you're in the network").

- **Stack**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.
- **Backend**: the separate [`abc-api`](../abc-api) repo (NestJS) at
  `api.adsbycreators.com`; session lives in an httpOnly `abc_session` cookie on
  `.adsbycreators.com`, so `app.*` never touches tokens.
- **Auth gating**: `src/proxy.ts` (Next 16's middleware replacement) checks
  cookie *presence* only; every gated page asserts its onboarding step against
  `GET /v1/onboarding` (`requireStep()` in `src/lib/onboarding.ts`), which is
  what makes onboarding resumable from any URL.

## Routes

| route | purpose |
|---|---|
| `/` | dispatcher → canonical screen for the server-side onboarding state |
| `/signin` | public; "Continue with Instagram" + all OAuth error states |
| `/auth/callback` | zero-UI landing after the API sets the session cookie |
| `/onboarding/connect` | permission explainer / reconnect entry |
| `/onboarding/profile` | categories, city, languages, exclusions — with a live sync strip (the Instagram backfill runs in parallel) |
| `/onboarding/sync` | full sync progress; only shown if profile finished first |
| `/network` | terminal page: real synced stats, payout explainer, profile summary, connection health |
| `/profile` | edit campaign preferences after onboarding |
| `/data-deletion` | public status page for Meta data-deletion requests |

## Ops console (`/admin`)

Internal staff console, built from the ops design ("Admin Console"). Staff sign
in with email + password (`/admin/signin`; accounts come from abc-api's
`npm run staff:create` — there is no signup) and get a separate
`abc_staff_session` cookie, so a staff and a creator sign-in coexist. The proxy
gates `/admin/*` on that cookie; RSC reads go through `adminFetch()`
(`src/lib/admin/server.ts`), mutations through `adminClientFetch()`.

| route | purpose |
|---|---|
| `/admin` | overview: KPIs, work queues, month economics, alerts |
| `/admin/campaigns` · `/new` · `/[id]` | list, 5-step guided brief, detail (overview / delivery & drafts / performance / money / activity) |
| `/admin/campaigns/[id]/mix` | mix builder: scored candidates, filters, KPI projections, propose / finalize |
| `/admin/quotes/[id]` | quote editor (overrides, fees, rights, deposit terms, margin-floor approval, send) |
| `/admin/creators` · `/[id]` | creator directory and ops profile (audience, pricing, reliability, history) |
| `/admin/brands` · `/admin/payments` · `/admin/rates` | brands, payouts + invoices, CPM rate reviews |
| `/admin/quotes/[id]/print`, `/admin/campaigns/[id]/mix/[mixId]/print` | brand-facing PDFs (browser print) — never show CPM, payouts or margin |

The console uses its own type pairing (Space Grotesk + JetBrains Mono, scoped
by `.admin-console`) and keeps its strings inline: it is internal and
English-only, unlike the creator app's `copy.ts` seam.

## Local development

```bash
# abc-api must be running on :4000 (INSTAGRAM_MODE=mock works end to end)
npm install
npm run dev
```

Visit `http://localhost:3000`. Mock sign-in tips (query params on the API's
`/v1/auth/instagram/start`): `?as=<username>`, `?account_type=PERSONAL`,
`?followers=50`.

## Design system

Tokens in `src/app/globals.css` (`@theme`): Electric Lime `#C7FF32` (ink text
only, never on light), Ink `#111111`, Warm White `#FAFAF7`, Gray `#666666`,
hairline `#E6E6E0`. Geist (UI) + Geist Mono (micro-labels) — same as the marketing site, whose script "abc" wordmark (`public/logo-mark.png`, inverse variant for dark surfaces) is the shared logo.
2px radius and no shadows — enforced by resetting the Tailwind scales.
`.on-ink` flips the semantic surface tokens for dark panels. All user-facing
strings live in `src/lib/copy.ts`.

## Deploy (Railway)

Same Railway project and region (Singapore) as abc-api; `railway.json`
builds with Railpack and runs `next start`. Domain `app.adsbycreators.com`.
Env: `NEXT_PUBLIC_API_URL=https://api.adsbycreators.com` (browser calls,
needed at build time) and `API_INTERNAL_URL=http://${{abc-api.RAILWAY_PRIVATE_DOMAIN}}:8080` (Railway's
injected `PORT`)
so server-rendered pages reach the API over the private network.
