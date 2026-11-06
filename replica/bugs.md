# Bug log

Resolved during implementation:

- B01 (S2): strong bots selected strongest PV instead of Stockfish’s difficulty-adjusted bestmove. Fixed by respecting legal `bestmove` at higher presets; regression test retained.
- B02 (S2): using the best evaluation to reject already-winning positions suppressed decisive brilliant sacrifices. Fixed by checking the next-best alternative; real WASM smothered-mate sacrifice regression retained.
- B03 (S2): material gained by the played move was not deducted in sacrifice detection. Fixed to avoid labeling a queen won for a bishop as a sacrifice; regression retained.
- B04 (S3): production CSS token path incorrectly traversed one extra directory. Fixed; production build verified.
- B05 (S3): resignation lacked the PGN Result tag. Result is now written before export and persistence.
- B06 (S3): promotion used a nonmodal overlay without native focus containment. Replaced with a native dialog and initial queen-button focus.

Environment-only issue: the process sandbox returned EPERM for compiler/engine child processes, causing misleading build initialization failures. The exact validation sequence passed with permitted local process access. No check was disabled.

No known open S1/S2 defects in executed automated flows. Visual, touch, screen reader and browser Worker behavior remain unverified; see test-plan.md. The bot Elo ladder has not been empirically calibrated.
