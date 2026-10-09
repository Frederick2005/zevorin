# Cloudflare Workers deployment

This app uses the Cloudflare Vite plugin to build a Worker and its static assets.

## Local development and validation

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## Environment variables

The `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values are read at
build time and included in the client bundle. Provide them in a local `.env`
file or as build environment variables in CI.

The Worker also reads `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` at runtime
for server-side Supabase requests. Configure these in the Worker's Cloudflare
settings. If server-side admin operations are enabled, configure
`SUPABASE_SERVICE_ROLE_KEY` as a Worker secret. Checkout payments require
`FLUTTERWAVE_SECRET_KEY`, also configured as a Worker secret.

## Deploy

Authenticate Wrangler with the Cloudflare account that owns the Worker, then
run:

```sh
npm run deploy
```

The script builds the app and deploys the generated Worker configuration from
`dist/server/wrangler.json`. Do not deploy the source `wrangler.jsonc` directly;
it points to the development entry point rather than the generated bundle.
