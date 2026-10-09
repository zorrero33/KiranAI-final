# KiranAI — Repository Guide for Agents

KiranAI is an enterprise multi-model AI platform: a React 19 + Vite + TypeScript SPA
served by an Express backend that routes AI traffic through a LiteLLM-compatible
gateway (with a native Google GenAI fallback engine).

## Build & Run

```bash
npm install
npm run dev       # tsx server.ts — Express serving the built SPA + API on :3000
npm run build     # vite build  → dist/
npm start         # node server.ts (production)
npm run lint      # tsc --noEmit  (typecheck; must pass)
npm test          # node --test tests/production.test.mjs (requires server on :3000)
npm run litellm   # /opt/litellm-venv/bin/litellm --config litellm_config.yaml --port 4000
```

Testing workflow: start the server (`PORT=3000 NODE_ENV=production node --experimental-strip-types server.ts &`),
then `npm test`. The suite hits live endpoints, so the server must be running.

## Architecture

- `server.ts` — all Express routes, CORS, status/models/chat/billing/admin/vision endpoints.
- `src/server/auth.ts` — auth + rate-limit + CORS middleware. **All protected routes use
  `optionalAuth` / `requireAuth` / `requireAdmin`; the effective user id always comes from the
  verified session token, never from the request body.**
- `src/server/userStore.ts` — user records + session token issue/verify (password hashed with sha256).
- `src/server/litellmManager.ts` — gateway client, provider resolution, native GenAI fallback.
- `src/server/aiRouter.ts` + `modelDiscovery.ts` — model registry and discovery.
- `src/server/db/` — database abstraction (JSON file store with Firestore support).
- `src/services/api.ts` — frontend API client. Use `authFetch` (injects the bearer token).
- `firestore.rules` — clients may never write `plan`, `role`, `subscriptionStatus`, or credits.

## Conventions & Guardrails

- **Never** trust a `userId` from the client; derive it server-side via `resolveUserId`.
- **Never** simulate a subscription/payment. If Stripe is unconfigured, return 503 honestly.
- **Never** fabricate AI responses or mark providers as working without a real call.
- Model ids in `litellm_config.yaml`, `aiRouter.ts`, `modelDiscovery.ts` must match real provider
  identifiers that currently generate (e.g. `gemini-3.5-flash`, `meta/llama-3.2-90b-vision-instruct`)
  — no inventing versions, no keeping retired ids (`gemini-2.5-*` no longer generates for new
  users; `meta/llama-3.3-70b-instruct` reached EOL 2026-08-26).
- **Never** assume availability from a key being present. `providerHealthMap` is populated only
  from real provider responses and keyed by `canonicalProviderKey()`; a 429/quota or a 401/403
  auth failure trips a 10-minute circuit breaker so a dead key is not retried per request.
  `/api/models/discover` reports such providers as `unavailable`.
- Secrets live only in the server env (`.env`, gitignored). `.env.example` documents names with
  empty values. Never expose provider keys to the browser.
- **Server writes must use `firebase-admin`** (`src/server/db/firestore.ts`), authenticated with
  a service account — never the Firebase client SDK. Firestore rules deny anonymous client writes
  to `credits`/`subscriptions`/`creditTransactions`, so a client-SDK write fails silently and
  privileged state is lost. `/api/status` reports `persistence.mode` (`admin`/`local`) honestly.
- The frontend never talks to Firestore directly; all persistence goes through the backend.
- Set `ALLOWED_ORIGINS` (comma-separated) in production to restrict CORS.
- **Admin is granted only via `ADMIN_EMAILS`** (comma-separated). Never hardcode a personal
  address or a default password in the seed, and never let a missing password authenticate:
  an account with no `passwordHash` (Google-only) must be rejected by the password login path.
  Registration always requires a password (≥6 chars).
- **Never commit the runtime `data/` store** (users, password hashes, credit ledgers). It is
  gitignored; treat anything already in history as compromised and rotate it.

## Required Environment Variables (names only)

`LITELLM_URL`, `LITELLM_MASTER_KEY`, `LITELLM_HOST`, `LITELLM_PORT`, `GEMINI_API_KEY`,
`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`,
`MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_NIM_API_KEY`, `HF_TOKEN`, `COHERE_API_KEY`,
`AZURE_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`,
`STRIPE_PRICE_ID_BUSINESS`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `GOOGLE_APPLICATION_CREDENTIALS`,
`GOOGLE_OAUTH_CLIENT_ID`, `VITE_GOOGLE_OAUTH_CLIENT_ID`, `VITE_API_BASE_URL`,
`VITE_API_PROXY_TARGET`, `ALLOWED_ORIGINS`, `ADMIN_EMAILS`, `PORT`, `NODE_ENV`, `DISABLE_HMR`.
All are optional at boot; the app degrades gracefully and reports which providers are
unconfigured. `.env.example` documents each one with an empty value.
