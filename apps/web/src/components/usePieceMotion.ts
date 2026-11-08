import { useLayoutEffect, useRef, type RefObject } from 'react';
import { Chess, type Color, type Square } from '@open-chess/chess-core';

export type PieceDrop = { from: Square; to: Square; x: number; y: number };
const easing = 'cubic-bezier(.2,.75,.25,1)';
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Only animate legal, adjacent positions. Imports and history jumps stay instant. */
export function usePieceMotion(
  board: RefObject<HTMLDivElement | null>,
  effects: RefObject<HTMLDivElement | null>,
  fen: string,
  orientation: Color,
  dropped: RefObject<PieceDrop | null>,
  pieceSet: string,
) {
  const previous = useRef({ fen, orientation, pieces: new Map<string, HTMLElement>() });
  const running = useRef(new Set<() => void>());

  function cancelMotion() {
    for (const cancel of running.current) cancel();
  }

  function animate(
    element: HTMLElement,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
    cleanup = () => {},
  ) {
    const animation = element.animate(frames, options);
    let finished = false;
    const cancel = () => {
      animation.cancel();
      finish();
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      cleanup();
      running.current.delete(cancel);
    };
    animation.onfinish = animation.oncancel = finish;
    running.current.add(cancel);
  }

  function returnPiece(square: Square, x: number, y: number) {
    const element = board.current?.querySelector<HTMLElement>(
      `[data-square="${square}"] .piece-drag`,
    );
    if (!element?.animate || reducedMotion()) return;
    const rect = element.getBoundingClientRect();
    const parent = element.parentElement;
    parent?.classList.add('piece-in-motion');
    animate(
      element,
      [
        { transform: `translate(${x - rect.left}px, ${y - rect.top}px) scale(1.1)` },
        { transform: 'translate(0, 0) scale(1)' },
      ],
      { duration: 190, easing },
      () => parent?.classList.remove('piece-in-motion'),
    );
  }

  useLayoutEffect(() => {
    cancelMotion();
    const old = previous.current;
    const pieces = new Map<string, HTMLElement>();
    board.current?.querySelectorAll<HTMLElement>('[data-square]').forEach((square) => {
      const piece = square.querySelector<HTMLElement>('.piece-drag');
      if (piece) {
        const copy = piece.cloneNode(true) as HTMLElement;
        copy.className = 'captured-piece';
        pieces.set(square.dataset.square!, copy);
      }
    });
    previous.current = { fen, orientation, pieces };
    const drop = dropped.current;
    dropped.current = null;
    if (old.fen === fen || old.orientation !== orientation || reducedMotion()) return;
    const before = new Chess(old.fen);
    const after = new Chess(fen);
    const forward = before.moves({ verbose: true }).find((move) => move.after === fen);
    const backward = forward
      ? null
      : after.moves({ verbose: true }).find((move) => move.after === old.fen);
    const move = forward || backward;
    if (!move) return;
    const isDrop = !!forward && drop?.from === move.from && drop.to === move.to;
    const duration = isDrop ? 140 : 200;
    const position = (square: Square) => ({
      left: `${(orientation === 'w' ? square.charCodeAt(0) - 97 : 104 - square.charCodeAt(0)) * 12.5}%`,
      top: `${(orientation === 'w' ? 8 - Number(square[1]) : Number(square[1]) - 1) * 12.5}%`,
    });

    if (forward?.captured && effects.current) {
      const capturedSquare = move.isEnPassant() ? ((move.to[0] + move.from[1]) as Square) : move.to;
      const captured = old.pieces.get(capturedSquare);
      if (captured?.animate) {
        Object.assign(captured.style, position(capturedSquare));
        effects.current.appendChild(captured);
        animate(
          captured,
          [
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'translateY(8%) scale(.72)' },
          ],
          { duration: 150, delay: isDrop ? 0 : 75, easing, fill: 'both' },
          () => captured.remove(),
        );
      }
    }

    const paths: [Square, Square][] = [[move.from, move.to]];
    if (move.isKingsideCastle())
      paths.push([`h${move.from[1]}` as Square, `f${move.from[1]}` as Square]);
    if (move.isQueensideCastle())
      paths.push([`a${move.from[1]}` as Square, `d${move.from[1]}` as Square]);
    for (const [source, destination] of paths) {
      const [from, to] = backward ? [destination, source] : [source, destination];
      const element = board.current?.querySelector<HTMLElement>(
        `[data-square="${to}"] .piece-drag`,
      );
      if (!element?.animate) continue;
      const direction = orientation === 'w' ? 1 : -1;
      const x = (from.charCodeAt(0) - to.charCodeAt(0)) * 100 * direction;
      const y = (Number(to[1]) - Number(from[1])) * 100 * direction;
      const rect = element.getBoundingClientRect();
      const fromPointer = isDrop && from === drop.from;
      const start = fromPointer
        ? `translate(${drop.x - rect.left}px, ${drop.y - rect.top}px) scale(1.1)`
        : `translate(${x}%, ${y}%) scale(1)`;
      const square = element.parentElement;
      square?.classList.add('piece-in-motion');
      animate(
        element,
        [
          { transform: start },
          { transform: 'translate(0, 0) scale(.97)', offset: 0.82 },
          { transform: 'translate(0, 0) scale(1)' },
        ],
        { duration, easing },
        () => square?.classList.remove('piece-in-motion'),
      );
    }
    if (forward && effects.current?.animate) {
      const landing = document.createElement('span');
      landing.className = `piece-landing ${move.captured ? 'capture-landing' : ''}`;
      Object.assign(landing.style, position(move.to));
      effects.current.appendChild(landing);
      animate(
        landing,
        [
          { opacity: 0, transform: 'scale(.65)' },
          { opacity: 0.55, transform: 'scale(.85)', offset: 0.25 },
          { opacity: 0, transform: 'scale(1.12)' },
        ],
        { duration: 260, delay: isDrop ? 0 : 100, easing, fill: 'both' },
        () => landing.remove(),
      );
    }
    return cancelMotion;
  }, [board, effects, fen, orientation, dropped, pieceSet]);

  // Also covers a return animation started after the last position update.
  useLayoutEffect(() => cancelMotion, []);
  return { returnPiece, cancelMotion };
}
