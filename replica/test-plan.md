# Validation plan and evidence

Automated commands: `bun run typecheck`, `bun run test`, `bun run build`. Use `bun run check` for the full sequence.

Final result (2026-11-06): **59/59 tests passed** across 3 files; TypeScript and Next.js production build passed. Bun frozen-lockfile installation also passed with no changes.

## Executed flows

- F01-H1: select Milo, play e4, get a legal bot response, save complete PGN and analysis.
- F01-H2: select Black; bot moves first.
- F01-E1: reject illegal board moves, support all promotions, castling and en passant.
- F01-E2: recognize checkmate, stalemate, repetition and insufficient material.
- F02-H1: actual Stockfish UCI readiness, legal candidate moves, evaluation sign, serialized searches and terminal positions.
- F02-H2: actual Stockfish verifies Qg8+ queen sacrifice followed by forced smothered mate as Brilliant.
- F02-E1: do not award Brilliant to ordinary development or an advantageous queen-for-bishop trade.
- F02-E2: navigate review and return live without modifying the game.
- F03-H1: undo a full turn and play a new move.
- F03-E1: Challenge disables assistance and reveals review after resignation.
- F04/F05-H1: solve a tactic and persist progress; reject wrong solutions without modifying the practice board.
- F04/F05-E1: every authored exercise has a legal solution; advertised mating exercises are actual checkmates; knight fork attacks both targets.
- F06-H1: reload a saved game with history intact; import valid PGN and analyze every ply.
- F06-N1: invalid PGN, malformed localStorage and write failures are handled.
- Settings: board palette and coordinate changes persist.

## Verification limits

DOM interaction tests use a deterministic engine double. Separate engine integration tests execute the actual shipped Stockfish WASM with Node UCI transport. No claim is made that these substitute for a real-browser Worker/network test.

The environment exposed no browser-control tool. No preview server, substitute browser installation, fabricated screenshots or visual parity scores were used. Pending manual checks: 390×844 and 1440×900 layouts, touch dragging, screen reader announcements, real browser WASM startup, download/save prompts and low-end device performance. Test with keyboard only, then a touch device. Next.js production compilation and static export are verified independently.
