# Copilot instructions for this repo

Big picture
- Metashot is an Express + TypeScript API that turns Metabase questions into PNGs using Playwright, stores them in S3/MinIO, and returns a presigned URL. Flow: POST /api/screenshot → generate Metabase embed JWT → load in headless Chromium → take screenshot → upload to S3 → return presigned URL.
- Service boundaries: routes live in `src/routes`, business logic in `src/services`, integration helpers in `src/metabase.ts` and `src/services/storage.ts`, infra concerns in `src/logger.ts`, `src/metrics.ts`, `src/tracing.ts`, and config in `src/config.ts`.

Developer workflow (local)
- Node >= 22 required. Install deps: `npm install`. Start deps for dev: `docker-compose up -d` (MinIO on 9000, Metabase on 3000). Copy env: `cp .env.example .env` and fill values.
- Run dev server (ts-node): `npm run dev`. Build: `npm run build`. Start built app: `npm start`. Tests: `npm test` (Jest + ts-jest). Lint/typecheck: `npm run lint` / `npm run typecheck`.
- Playwright browsers aren’t auto-downloaded in Docker; locally, tests that need Chromium will gracefully skip if the browser isn’t installed.

Key conventions
- Never read `process.env` directly; use `Config` from `src/config.ts`. Example: S3 endpoint/keys, Metabase site URL + secret, `AUTH_TOKEN`, and `PRESIGNED_URL_EXPIRY`.
- Initialize and reuse long‑lived resources. The server calls `initializeServices()` (creates Playwright browser, ensures S3 bucket) before listening, and `closeServices()` on shutdown. Don’t launch browsers or construct S3 clients per request.
- Authentication: if `AUTH_TOKEN` is set, all `/api/*` routes require `Authorization: Bearer <token>` via `authenticateToken` middleware. Health (`/api/health`) and `/metrics` are public.
- Errors: return `{ error: string, message: string }` (see `src/types.ts`). Avoid leaking internals; log details with `logger`.
- Observability is first‑class:
  - Tracing: wrap operations in `tracingUtils.traceOperation(name, fn, attrs)` (OpenTelemetry → OTLP/HTTP). Configure with `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` or `OTEL_EXPORTER_OTLP_ENDPOINT`; defaults to `http://localhost:4318/v1/traces`. Tracing is disabled in `NODE_ENV=test`.
  - Metrics: define counters/histograms/gauges in `src/metrics.ts` and time work with `metricsUtils.trackDuration`. The `/metrics` endpoint serves Prometheus metrics.
  - Logging: use `logger` (Pino). Dev pretty‑prints; production emits JSON. Request logs skip `/metrics` and health.

Important modules to follow
- Screenshots: `src/services/screenshot.ts` (viewport default 1920x1080; waits for Metabase embed frame, optional spinner; full‑page PNG).
- Metabase embed URL: `src/metabase.ts` uses JWT (requires `METABASE_SECRET_KEY`) and builds `.../embed/question/<token>#bordered=true&titled=true` with optional params.
- Storage: `src/services/storage.ts` (AWS SDK v3). Uses path‑style + `endpoint` when talking to MinIO. Uploads `image/png` and generates presigned GET URLs. Filenames follow `screenshot-<timestamp>-<random>.png`.

Extending the API (examples/guardrails)
- New route pattern: create a router under `src/routes/`, use `authenticateToken`, validate inputs, return typed responses from `src/types.ts`, wrap I/O in tracing + metrics, and log with `logger`. Wire it under `/api` in `src/index.ts`.
- When adding new S3 or browser work, reuse the existing `StorageService`/`ScreenshotService` patterns. If new metrics are needed, define them in `src/metrics.ts` and time work with `metricsUtils.trackDuration`.

Containers & charts
- Dockerfile uses Alpine + system Chromium (env: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser`, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`). Helm chart in `helm/metashot` exposes environment via `env`/`envFrom`, supports HPA and ingress.

Repo hygiene
- From `CLAUDE.md`: use feature branches; don’t commit directly to `main`.
