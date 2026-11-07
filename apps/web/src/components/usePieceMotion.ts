import { useLayoutEffect, useRef, type RefObject } from 'react';
import { Chess, type Color, type Square } from '@open-chess/chess-core';

/** Animate only a single legal transition; imports and arbitrary history jumps snap into place. */
export function usePieceMotion(
  board: RefObject<HTMLDivElement | null>,
  fen: string,
  orientation: Color,
  dragged: RefObject<string | null>,
) {
  const previous = useRef({ fen, orientation });
  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = { fen, orientation };
    const skip = dragged.current;
    dragged.current = null;
    if (
      old.fen === fen ||
      old.orientation !== orientation ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const before = new Chess(old.fen);
    const after = new Chess(fen);
    const forward = before.moves({ verbose: true }).find((move) => move.after === fen);
    const backward = forward
      ? null
      : after.moves({ verbose: true }).find((move) => move.after === old.fen);
    const move = forward || backward;
    if (!move) return;
    const paths: [Square, Square][] = [[move.from, move.to]];
    if (move.isKingsideCastle())
      paths.push([`h${move.from[1]}` as Square, `f${move.from[1]}` as Square]);
    if (move.isQueensideCastle())
      paths.push([`a${move.from[1]}` as Square, `d${move.from[1]}` as Square]);
    const animations: Animation[] = [];
    for (const [source, destination] of paths) {
      const [from, to] = backward ? [destination, source] : [source, destination];
      if (forward && skip === from + to) continue;
      const element = board.current?.querySelector<HTMLElement>(
        `[data-square="${to}"] .piece-drag`,
      );
      if (!element?.animate) continue;
      const direction = orientation === 'w' ? 1 : -1;
      const x = (from.charCodeAt(0) - to.charCodeAt(0)) * 100 * direction;
      const y = (Number(to[1]) - Number(from[1])) * 100 * direction;
      const square = element.parentElement;
      square?.classList.add('piece-in-motion');
      const animation = element.animate(
        [{ transform: `translate(${x}%, ${y}%)` }, { transform: 'translate(0, 0)' }],
        { duration: 160, easing: 'cubic-bezier(.2,.7,.25,1)' },
      );
      animation.onfinish = animation.oncancel = () => square?.classList.remove('piece-in-motion');
      animations.push(animation);
    }
    return () => animations.forEach((animation) => animation.cancel());
  }, [board, fen, orientation, dragged]);
}
