# Board feel and audio reference — 2026-11-08

The user requested inspiration from Chessreps for the board UI and sound effects, without cloning the site. The completed game-review changes were pushed to GitHub main first as a2e2078.

## Evidence and limits

Read the public homepage and analysis-page text through web search. Indexed screenshots from the official Chessreps changelog describe a beige-and-brown board, dark surrounding UI, and compact controls near the board:

- https://www.chessreps.com/
- https://www.chessreps.com/analysis
- https://www.chessreps.com/changelog

During the original UI pass, direct browser/network access to Chessreps was blocked by the environment's outbound policy. The reference sounds were not auditioned and exact visual parity was not verified. That pass used the general visual direction from public references, synthesized audio (subsequently replaced), and existing OpenChess SVG pieces.

On 2026-11-08, the new environment reached Chessreps successfully. The live analysis board was exercised in Chromium with `e4`, `d5`, and `exd5`; Web Audio tracing confirmed `/sounds/move.wav` for the moves and `/sounds/capture.wav` for the capture, with nonzero rendered output. The actual WAV files were downloaded and their signal envelopes measured. This verifies the assets and playback, not a subjective listening comparison. No audio-specific author or redistribution permission was found, and the site's terms reserve its rights. OpenChess now uses a CC0 recording of real board contacts by simone_ds, with short edited move/capture cues. Exact provenance, reference hashes, license, and reproduction commands are in `apps/web/public/audio/SOURCE.txt`.

## Applied changes

- Matte Studio palette with tan and cream squares, inset coordinates, softer last-move colors, and a subtle rounded frame.
- A legal destination highlight while dragging, plus short animations for click moves, bot replies, adjacent history navigation, and both pieces when castling. Dragged pieces land immediately. Reduced-motion users get immediate placement.
- Original short wooden taps and tonal cues for moves, captures (including en passant), castling, checks, promotions, mate/game-over moves, review navigation, and exercise feedback.
- One reusable AudioContext unlocked through user interaction, persisted mute and volume controls, a sound preview, and immediate silence when muted. Imports and reloads do not replay game sounds.
- Studio replaces the previous default Linen palette on migration. Other saved palettes and piece selections are retained; Linen remains available in settings.

Validation includes domain and audio regression tests, a production build, and browser checks of real audio events, context reuse, mute, volume persistence, silent PGN import, tactical review, and responsive layouts at 1024, 768, and 390 pixels.
