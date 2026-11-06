# Component system

Warm charcoal surfaces, green controls, green-and-cream board, DM Sans. Original wordmark and bot portraits. Compact left navigation frames the dominant board and the Play Computer panel; no marketing header above the game. Desktop splits board and panel; mobile stacks them and condenses navigation. Keyboard focus uses a visible green ring. Respect reduced motion.

Board: 64 labeled square buttons; click, keyboard or drag to move; selection and legal target cues; last move/check state; promotion chooser. Board is disabled during computation and review.
Buttons: primary, secondary, icon; hover/focus/disabled/loading. Icons have text or accessible labels.
Bot card: avatar, name, approximate Elo, style, selected outline; filters and selected details.
Dialog: native modal dialog, focus containment and Escape, close button.
Review: real calculated statistics, color and symbol for every quality, text explanations independent of color.

Pieces: 12 unmodified, established Cburnett SVGs; full-square image wrapper, native square labels, native promotion options, no platform-dependent chess glyphs on the board. Desktop board size tracks viewport height; at tablet width the panel stacks below it.

## Reference-board and interaction revision

User screenshot: cream/gray woven board and outlined ivory/charcoal pieces with subtle relief and rounded bases. Implemented as Linen board plus Sculpted SVGs, independently switchable in settings. Green, Walnut and Slate board colors and Classic pieces remain available.

Legal moves render before engine evaluation. Pointer-captured dragging uses a fixed overlay, highlights legal destinations and restores the source after invalid/canceled drops. Promotion requires an explicit choice.

Review uses paired White/Black accuracy tiles, Overview/Move by move tabs, named quality counts, a monochrome evaluation timeline, a selected-move coach and two-column move history. Pending grades show a spinner and no fabricated score. The live coach follows the human’s last decision; explicit history selection reviews any move. Shared circular grade badges provide the same colors, symbols, accessible names and tooltips on every surface.
