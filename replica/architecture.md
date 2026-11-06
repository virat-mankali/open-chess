# Architecture

One Bun-workspaces monorepo, one bun.lock and one Git repository. No nested repositories or submodules. Bun and Next.js explicitly requested by the user.

- apps/web: Next.js App Router, React and TypeScript. Static export for the current browser-local experience; remove output: export when adding server routes. Keep a separate apps/api for a future standalone backend.
- packages/chess-core: chess.js legality, bot profiles, analysis contracts, quality rules, lessons and puzzles. Independent of React and browser APIs.
- apps/web/src/engine: Stockfish single-threaded WASM worker and serialized UCI queue. No network service or credentials needed.
- apps/web/src/storage: versioned local persistence with error handling; a future API adapter can replace it.
- apps/api: reserved in documentation, add an actual workspace when a backend is implemented.
- packages/contracts: reserved for future shared API contracts; do not create empty packages.
- docs: architecture, development and engine methodology.
- .agents/skills: all eleven upstream Replica skills installed project-locally with MIT license and provenance.

Future API boundaries: GET/POST /games, GET/PATCH /preferences, GET/PATCH /progress behind owner authorization. Future Postgres Game(user_id UUID FK users ON DELETE CASCADE, id UUID PK, created_at timestamptz, updated_at timestamptz, pgn text, result enum), LearningProgress(user_id, lesson_id unique pair, completed_at). No database or authentication claimed in the present implementation.

Concurrency: one engine serializes requests; generation tokens reject stale game operations after reset or unmount. UI remains responsive during WASM search. Persist a game after each completed turn. All controls respect setup/active/review/terminal state.

Build order: board and legality → engine → bot turns and move feedback → history/review → lessons/puzzles → persistence → verification.
