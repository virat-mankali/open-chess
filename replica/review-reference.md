# Review and board reference — updated 2026-11-08

## Evidence

The user supplied two Chess.com game-review screenshots on 2026-11-08. They show a black-oriented cream-and-gray textured board, outlined Staunton pieces, a dark review panel, a coach portrait beside a white speech bubble, Explain / Best / Next actions, a dense two-column move list, an evaluation graph, and five playback controls.

The second screenshot shows 1. e4 e5 2. Qh5 Nc6. Nc6 is marked best, with gold L-shaped arrows illustrating the possible g8–f6 development and attacks on h5 and e4. The new UI uses the existing OpenChess board/piece assets and an original SVG coach illustration.

## Implemented review behavior

- Move-by-move review leads with the coach bubble. Player accuracy and quality counts live in Overview.
- Existing Stockfish evaluations determine grades and the best move. Pending moves remain ungraded, and analysis errors retain the retry flow.
- Fork ideas are computed from the selected position, for either color. Legal-move checks exclude pins; prospective forks that immediately lose the attacking piece to a profitable exchange are omitted.
- A plan after a move is explicitly conditional: the opponent moves first and can prevent it. The motif detector is not an engine evaluation or a forced-win detector.
- Gold SVG movement and attack arrows follow board orientation; knight arrows use an L path. Users can hide or restore them.
- Best previews the original position and the engine's preferred move without modifying PGN or entering a move. Returning, selecting another move, or navigating history restores the played position.
- The evaluation timeline, move table, first/previous/play/next/last controls, and keyboard navigation share the review cursor.
- Challenge mode hides explanations, grades, graphs, and tactical arrows until the game ends.

## Validation

The exact Nc6 example was imported and analyzed with the browser's real Stockfish worker. Desktop and mobile browser checks cover arrows, board flipping, explanation, best-move preview, unchanged storage, navigation, and playback. Domain regression tests cover both colors, actual versus prospective forks, missing targets, pins, unsafe knight moves, checks, and checkmate.

## Quality conventions

Use a consistent badge component across the board, selected-move card, breakdown and move list:

| Quality | Symbol | Color family |
| --- | --- | --- |
| Brilliant | `!!` | Teal |
| Great | `!` | Blue |
| Best | Five-point star | Green |
| Excellent | Thumbs-up | Green |
| Good | Check | Muted green |
| Inaccuracy | `?!` | Yellow |
| Mistake | `?` | Orange |
| Blunder | `??` | Red |

Use bold, centered symbols with sufficient contrast, a clear circular boundary and a light outline against either board square. Board badges should remain legible at normal square sizes and avoid covering the piece's recognizable silhouette. Pair symbols with visible category names in the review panel and accessible names/tooltips on the board; do not rely on color alone. Use only existing engine-computed classifications.
