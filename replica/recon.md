# OpenChess discovery

Scope supplied by user: a web chess learning app with bot play and detailed move review. Online opponents and friends are excluded. Root repository remains a monorepo.

## Public sources consulted 2026-11-06
| Source | Evidence |
|---|---|
| https://support.chess.com/en/articles/8614091-how-can-i-play-against-the-chess-com-bots | Bot categories, adjustable difficulty, side selection, hints and evaluation |
| https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc | Move-quality categories and sound sacrifice criterion |
| https://support.chess.com/en/articles/8584089-how-does-game-review-work | Move-by-move game review |

No original source code, private APIs, bot identities or artwork used. No reference screenshot available; visual measurements and layout parity are not claimed.

## Screens
S01 Play: board, bot catalog, color/mode selection; setup/loading/active/complete/error.
S02 Review: move history, evaluation chart, classification, engine line; empty/active/history.
S03 Learn: original lessons and interactive board exercises; available/complete.
S04 Puzzles: original tactical positions; attempt/incorrect/solved.
S05 Library: locally saved games; empty/filled/import error.
S06 Settings: board palettes, sound, legal targets and coordinates.

## Flows
F01 Select bot and color, start game, make legal moves, finish.
F02 Inspect each move and its explanation; traverse history, export PGN.
F03 Request hint or take back a move in assisted mode.
F04 Learn a concept, complete a board exercise.
F05 Solve a tactic, persist completion.
F06 Resume a game or import a PGN for review.

Entities: Bot (static personality and target Elo), Game (PGN, player color, result, bot, timestamp), MoveAnalysis (FENs, SAN, scores, engine line, quality), Preferences, LearningProgress. Persistence is browser-local, not a fake network API.

Hard parts: asynchronous UCI engine lifecycle, move classification including sound sacrifices, chess special rules and history preservation. This release is a bounded functional foundation, not the original's entire learning catalog. Product scale M; backend accounts and online play deferred.
