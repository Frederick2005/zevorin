# Deploying Zevorin to Cloudflare (Workers + static assets)

Architecture: TanStack Start (SSR) built by Vite with `@cloudflare/vite-plugin`.
`npm run build` emits `dist/client` (static assets) and `dist/server` (Worker `index.js`
plus a generated `wrangler.json` whose `assets` points at `../client`). SSR and server
functions need the Worker, so this is a **Workers** deploy, not Pages or static hosting.

## Cloudflare settings (Workers Builds, Git integration)

- Workers & Pages > Create > Import a repository > `Frederick2005/zevorin`
- Production branch: `main`
- Worker name: `zevorin` (must match `name` in wrangler.jsonc)
- Build command: `npm ci && npm run build`
- Deploy command: `npx wrangler deploy` (the Vite plugin redirects it to dist/server/wrangler.json)
- Non-production branches: enable branch builds; preview command `npx wrangler versions upload`
- Node: `.node-version` pins 22.12.0 (Vite 8 needs >= 22.12)

## Variables

Build variables (Settings > Build > Variables; inlined by Vite, public by design):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`

Runtime variables (Settings > Variables and Secrets, type Text):
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`

Runtime secrets (type Secret):
`FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_HASH`, and `SUPABASE_SERVICE_ROLE_KEY` (all three required for checkout; set as Worker secrets). Optional: `SITE_URL`.

## Supabase (manual, in the Supabase dashboard)

Auth > URL Configuration: add the production URL and your workers.dev preview URL pattern to
Site URL / Redirect URLs. Migrations in `supabase/migrations` are NOT applied by this pipeline.

## Local checks

`npm ci`, `npm run typecheck`, `npm run build`, `npm run preview` (runs in workerd)
