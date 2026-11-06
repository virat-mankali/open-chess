# Engine, difficulty and move classification

## Stockfish

Pin: stockfish npm package **19.0.1**, `stockfish-19-lite-single.js` with its matching WASM. Both are copied without modification from the installed package. The small single-thread build avoids SharedArrayBuffer and cross-origin isolation requirements. Two independent Worker instances communicate over UCI: one serves bot moves/hints and one serves review. Both keep expensive searches off the UI thread.

Each worker owns its own serialized command queue. Initialization requires `uciok` and `readyok`. Searches have explicit time/depth limits and a failure timeout; runtime worker errors terminate pending requests and expose retry UI. Evaluations normalize to White’s perspective, including mate scores. Analysis and bot searches reset Skill Level and MultiPV each time.

## Difficulty

Bot strength combines Stockfish Skill Level, time budget, and legal candidate selection. Below 500, random legal moves occur with probability 0.60; below 900: 0.32; below 1300: 0.13; below 1700: 0.04. Lower settings also sample multiple candidate lines. At 1500 and above the engine’s intentionally weakened `bestmove` is respected, rather than replacing it with the strongest PV. Stronger presets use larger time budgets up to 1100 ms. Analysis is separate at skill 20 and typically 450–500 ms per position.

These parameters produce increasing difficulty but have not been tournament-calibrated. A named 2800 target is not a measured rating, and this lite net is not the full Stockfish network. Bot portraits and descriptions are original presentation; the engine does not simulate a human individual’s style.

## Coaching

Estimated outcome is `1 / (1 + exp(-centipawns / 230))`, normalized to the mover. This is a heuristic, not an empirically fitted win probability. Positive outcome loss compared with the best pre-move evaluation determines ordinary quality: <= 2% Excellent; <= 5% Good; <= 10% Inaccuracy; <= 20% Mistake; greater loss Blunder. Engine-first choices or effectively equal scores receive Best. Great requires a best move with more than 13 percentage points between the two strongest options and depth >= 8.

Brilliant is deliberately conservative:

1. At least two candidate lines, sufficient search depth, and more than one legal choice.
2. A non-pawn, non-king piece is offered on its destination square.
3. A recursive legal static-exchange search finds an opponent material gain of at least 180 centipawns if it captures that piece, **after subtracting any material the move just captured**. Winning a queen for a bishop is not a sacrifice. Pins and king safety are handled by the legality library; either side may decline further exchanges.
4. The move loses at most 2 percentage points and 60 centipawns; the resulting position is at least -50 centipawns for the mover.
5. The **second-best alternative** is not already above +300 centipawns. The best line itself may be winning precisely because of the sacrifice.

The detector does not identify every quiet sacrifice, move that exposes another piece, or deep long-term idea. A search can be wrong at short time limits. It never assigns Brilliant randomly or on a move-count schedule. A displayed grade is our assessment, not a claim to reproduce another company’s proprietary algorithm.

Move explanations combine quality, legality-backed tactical observations (check, capture, castling, development), the engine’s preferred move and its principal variation. Accuracy is the mean of `100 * exp(-4 * outcomeLoss)` across the player’s moves. It is not an official or comparative rating.

## Persistence and portability

PGN preserves actual game history. Every legal move is applied and saved synchronously, before any engine search. Review records form a validated prefix of that history and fill in asynchronously. A failed review never undoes an accepted move. If the page closes mid-review, resume analysis from the first missing record; if a bot reply is missing, the gameplay worker supplies it independently. Completed games with pending review also recover. Session generation guards discard results after undo, reload or a new game. Completed and imported games remain reviewable. Browser-local storage has no account, cloud synchronization or cross-device backup. Export PGN for a portable copy.
