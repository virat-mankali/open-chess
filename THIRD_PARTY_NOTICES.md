# Third-party notices

- **Stockfish.js 19.0.1 / Stockfish 19**: engine code GPL-3.0. Copyright contributors identified in the unmodified engine header and upstream AUTHORS. Binary package https://registry.npmjs.org/stockfish/-/stockfish-19.0.1.tgz. Exact corresponding source and build instructions: https://github.com/nmrugg/stockfish.js/tree/v19.0.1 (commit `0d5dd7944f88c817c07a26bc4fb1905d5f9c46d6`); downloadable source https://github.com/nmrugg/stockfish.js/archive/refs/tags/v19.0.1.tar.gz. `scripts/prepare-engine.mjs` retains the GPL text at `/engine/COPYING.txt` and source information at `/engine/SOURCE.txt`. The engine is unmodified. Preserve those files and source access when distributing it.
- **chess.js**: BSD-2-Clause; https://github.com/jhlywa/chess.js. Its installed package preserves the license.
- **Lucide**: ISC; https://lucide.dev/license. Icons are used through lucide-react.
- **DM Sans**: SIL Open Font License; bundled locally through @fontsource/dm-sans. No runtime font-service request.
- **React** and **Next.js**: MIT; see installed package licenses.
- **Replica skill pack**: MIT, Jake Schincariol; https://github.com/Jakeschincariol/replica-skill. License preserved in `.agents/skills/REPLICA-LICENSE`.

**Cburnett chess pieces**, Colin M. L. Burnett: GPL-2.0-or-later. All 12 unmodified SVG source files, license, attribution, upstream links and SHA-256 checksums are bundled under `apps/web/public/pieces/cburnett/` and served at `/pieces/cburnett/`. These remain available as the Classic piece style.

**Chess sound recordings**, simone_ds: CC0-1.0. Short edited excerpts of "chess pieces.wav" (2016-10-31), obtained from the credited `Move.ogg` in EmyChess revision `428aae78a7a9c280b8d4e182045306e02d45efd1`. Source: https://freesound.org/people/simone_ds/sounds/366065/. Editing recipe, upstream links, reference investigation, checksums and license are bundled under `apps/web/public/audio/`, served at `/audio/SOURCE.txt` and `/audio/COPYING.txt`. No Chessreps or Lichess sound files are bundled.

The Sculpted SVG set and linen board texture were implemented for this project from the visual direction in the user-supplied screenshot; the editable assets are in `apps/web/public/pieces/sculpted/` and `apps/web/public/boards/`. Bot artwork, the wordmark, interface copy and training positions were authored for this project. No target app assets or bot identities are bundled.
