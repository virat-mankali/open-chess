# Review and board reference — 2026-11-06

## Evidence and limits

The user supplied a board screenshot. It shows a textured cream-and-gray board, large coordinate labels, and white/charcoal Staunton pieces with dark outlines, soft interior shading and a single rounded pedestal. This is the visual reference for the new optional board palette and piece set.

The screenshot does not show the review panel. Attempts to retrieve the following public documentation returned proxy HTTP 403 CONNECT errors in this environment:

- https://support.chess.com/en/articles/8584089-how-does-game-review-work
- https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc
- https://support.chess.com/en/articles/8614091-how-can-i-play-against-the-chess-com-bots

No supported interactive browser or general web-search tool was exposed. No current Chess.com panel screenshot was inspected, and exact pixel/layout parity is not verified. No alternative browser was installed.

## Proposed review structure

These are implementation recommendations for a familiar chess review experience, not newly observed measurements of Chess.com's current UI:

1. Compact Review header and distinct summary/move-review navigation.
2. White and Black player identities side by side, each with a prominent computed accuracy value; show a dash before analysis exists.
3. A compact, clickable evaluation timeline underneath the player summary.
4. A move-quality breakdown with a centered icon and full category label, and aligned counts for each player.
5. A selected-move card with move number/SAN, a large named quality badge, explanation, evaluation and best continuation.
6. A dense two-column move list (White/Black), visible selection and first/previous/next/last controls.

Show analysis-in-progress explicitly. A pending move must appear in history immediately without a fabricated quality or accuracy. Challenge mode continues to hide assistance until completion.

## Proposed quality conventions

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
