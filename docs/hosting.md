# Hosting

The initial deployment is an owner-private ChatGPT Site. Its opaque project ID is tracked in `.openai/hosting.json`. Preserve this ID on updates; do not create another Site for this app.

Build with `bun run build`, then run `node scripts/package-site.mjs` to copy the static Next.js export into the root `out/` directory required by the hosting manifest. This is generated deployment output, not another application. The source stays in `apps/web` and `packages/chess-core`.

The `sites` Git remote stores deployment source. The existing GitHub `origin` remains separate. Upload an archive containing `.openai/hosting.json` and `out/` only after pushing the matching source commit. Use the private deployment operation while the Site remains owner-only.

No Cloudflare account credentials, API keys or application secrets are needed. Stockfish executes in the visitor's browser. Existing browser-local games on localhost do not automatically transfer to the hosted origin; use PGN export/import when needed.

The same Next.js project can later be deployed to Vercel or its static output to Cloudflare Pages. A custom domain can be configured after the initial review.
