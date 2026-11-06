# Monorepo architecture

The repository root owns the Bun workspace list, lockfile, shared TypeScript configuration, scripts, and tests. It is not an application directory. App deployments and reusable libraries have explicit boundaries.

## Current dependency direction

`apps/web → packages/chess-core → chess.js`

The web app owns React state, the Stockfish browser worker, localStorage, styles and UI. The core package owns chess contracts, grading, bot settings, rules helpers and original learning content. It has no React, DOM, fetch, localStorage, Next.js or environment dependencies. A future backend can import it without bundling the web app.

`useChessGame` owns live PGN history and session state. Each move is analyzed before and after by an independently configured high-strength search. Bot selection uses a separate strength setting. UCI requests are serialized; generation tokens prevent stale async completions from changing a different game. A failed evaluation rolls back an uncommitted move and offers engine recovery. The bot continues on retry if a human move was already committed.

Storage has versioned keys, validated deserialization, a write-through in-memory cache, bounded history, and graceful quota/availability failures. PGN is replayed to retain castling, en-passant and repetition state. No browser state is read during server rendering; the interactive app is dynamically loaded on the client.

## Future backend

Create `apps/api/package.json` with a unique workspace name when implementing an API. Add `packages/contracts` only when there are shared transport schemas to own. Use `workspace:*` for internal dependencies. Keep one `bun.lock` at the root.

Suggested future endpoints: authenticated `GET/POST /games`, `GET/PATCH /preferences`, and `GET/PATCH /progress`. Every record needs a server-authenticated owner. Migrate browser data explicitly after sign-in; do not silently upload existing private games. Keep UCI engine work on clients or dedicated workers instead of blocking API handlers.

If using Next.js server routes, remove static export and introduce a server deployment. If the backend is independent, keep the web frontend statically deployable. Do not create `apps/api` with a pretend server before backend work is requested.

## Development and validation

`bun run dev` launches the Next.js app. `bun run check` typechecks the source, runs Vitest (domain + UI + actual-engine transport integration), then performs a production Next.js build. Test doubles are limited to DOM integration tests; production always uses the real Stockfish worker and has a visible error state if it fails.

The sandbox used for this build blocked child-process execution during Next’s TypeScript phase and the engine transport tests. Running the same validation with permitted local child-process access succeeded. Do not disable typechecking to work around that sandbox behavior.
