# Build log — 2026-11-06

- S01: functional bot selection and game loop, legal moves, promotion, turn safety, end states, retry, side/mode selection.
- S02: move review, real engine grades and explanations, variation, chart and history navigation.
- S03: four original lessons with board exercises and persisted completion.
- S04: six original puzzles with legal solutions, hints and progress.
- S05: saved-game library, resume, PGN import and export, persistence failure handling.
- S06: board theme, sound, legal targets and coordinates.

All six screen implementations have DOM coverage. Browser visual states and screenshots remain unverified because the supported browser tool was unavailable. The production build and real-engine UCI integration pass. No backend or online player feature was introduced.

## Visual revision — 2026-11-06

Replaced the custom chess silhouettes with the complete licensed Cburnett SVG set. Switched the application from lavender to charcoal/green, made the standard green-and-cream board the default, tightened the left navigation, removed the marketing header/cards, and added a Play Computer panel heading. The board uses available viewport height and stacks above the panel on tablets and phones. Existing first-release preferences migrate to the green board without changing game history or sound/assistance settings; users can still choose walnut or slate afterward.

Revision validation: 60 tests pass, TypeScript and Next.js production export pass; 10 declared contrast pairs pass AA. All 12 SVGs were rasterized and inspected on the green board, and their bundled checksums match the downloaded sources. Icon-only navigation retains accessible names. Full browser interaction and responsive screenshots remain unverified because the supported browser route is unavailable.
