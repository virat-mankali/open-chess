# OpenChess

A focused chess learning app built with **Next.js App Router, React, TypeScript, and Bun workspaces**. Play original bot characters, understand every move, and practice on an interactive board. No online multiplayer or backend services are required.

## Run

Install [Bun](https://bun.sh) (this repository pins 1.4.4) and Node.js 22 or newer, then run from the repository root:

```sh
bun install --frozen-lockfile
bun run dev
```

Open `http://localhost:3000`. The dev/build commands copy the pinned Stockfish worker and WASM assets into the web app automatically. They do not depend on an external engine CDN or API key. The only prerequisite download is the package installation.

In the provided cloud environment, Bun is installed at `/workspace/toolchain/node_modules/.bin/bun`; add `/workspace/toolchain/node_modules/.bin` to `PATH` if the shell does not already include it.

```sh
bun run typecheck
bun run test
bun run build
# Or all three:
bun run check
```

Next.js currently exports static files to `apps/web/out`. Deploy that directory with a static web server that serves `.wasm` as `application/wasm`. `next start` is not used with static export. Remove `output: 'export'` in `apps/web/next.config.ts` if introducing server features later.

## Repository layout

```text
open-chess/                      # One Git repository; Bun workspace root
├── apps/
│   └── web/                     # Next.js application
│       ├── src/app/             # App Router entrypoints
│       ├── src/components/      # Board, artwork, review and training UI
│       ├── src/engine/          # Serialized Stockfish UCI worker adapter
│       ├── src/storage/         # Versioned browser persistence
│       └── public/engine/       # Generated, ignored engine assets
├── packages/
│   └── chess-core/              # React-free domain logic and shared contracts
├── scripts/                     # Engine asset preparation
├── docs/                        # Architecture and engine methodology
├── replica/                     # Discovery, design, scope and QA artifacts
├── .agents/skills/replica-*/     # All 11 installed Replica skills
├── bun.lock                     # The single dependency lockfile
└── AGENTS.md                    # Conventions for future work
```

Add a future standalone backend as `apps/api`, and shared API contracts as `packages/contracts` when they are implemented. Do not create nested Git repositories, submodules or separate lockfiles. See [architecture](docs/architecture.md).

## Included

- 11 original bot characters and a custom engine preset, targeting approximately 250–2800 Elo.
- Local Stockfish 19 lite single-threaded WASM; no cross-origin isolation headers required.
- Full chess legality, castling, en passant, all four promotions, mate and draw conditions.
- Coach mode with hints, takebacks, evaluation and live feedback; Challenge mode with post-game review.
- Move-by-move grades, explanations, principal variations, evaluation graph and custom accuracy estimate.
- A conservative sound-sacrifice detector for Brilliant; critical best moves can earn Great.
- Local autosave/resume, game library, PGN export and full-game PGN import analysis.
- Four original introductory lessons and six original tactical exercises.
- Four board styles (textured linen, green, walnut, slate), independent Sculpted/Classic SVG piece styles, sound controls, coordinates, legal-move guides, keyboard selection, pointer-following drag/drop, and responsive layouts.
- Immediate legal moves and autosaves; independent gameplay and review workers keep analysis off the interaction path.
- Paired player accuracy, move-quality breakdown, readable shared badges and a live coach focused on your latest move.
- A matte Studio board with smooth piece movement, SVG corner selection and hover guides, click-again deselection, and locally bundled move/capture/check samples with mute and volume controls.
- A focused match layout with a narrow review panel, explanations on demand, and a collapsible evaluation graph.
- A conversational game review with an original SVG coach, a colored evaluation timeline, playback, and an engine-best-move preview that preserves your PGN.
- Position-based fork ideas with gold SVG arrows (including L-shaped knight paths). Future plans are explicitly conditional on the opponent's reply; they are not engine scores or promises of winning material.

## Scope and limits

Elo numbers are difficulty targets, not calibrated ratings. Coaching grades and accuracy are our own transparent heuristics, not proprietary classifications. Stockfish search is intentionally bounded to keep the UI responsive, so deeper analysis can change a judgment. Bot characters differ in target difficulty and presentation; this release does not model human playing styles or adaptive personalities. See [engine methodology](docs/engine.md).

Games and progress live in localStorage on the current browser (up to 50 games). They are not account-synced. PGN is the portable backup. Four lessons and six exercises are a starter curriculum, not a large licensed course catalog. No accounts, online opponents, friends, payments or remote backend are included.

Automated coverage includes actual Stockfish WASM through a Node UCI transport, domain tests, and DOM interaction flows. The production build passes. Real-browser visual, touch, accessibility-tree and Worker loading verification remains to be performed; browser-control tools were unavailable in the build environment.

## Replica skill

Installed project-locally from [Jakeschincariol/replica-skill](https://github.com/Jakeschincariol/replica-skill), pinned to commit `77c9436fb3d18c3d58169efb8caf4fe906b0dc51`. All 11 folders and their helper scripts are in `.agents/skills`; the upstream MIT license is preserved as `.agents/skills/REPLICA-LICENSE`. Discovery, architecture, design, implementation, testing, and parity workflows were applied. See [provenance](.agents/skills/REPLICA-SOURCE.md).

Third-party software and corresponding engine source: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
