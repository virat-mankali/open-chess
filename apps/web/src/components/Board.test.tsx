// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Chess, type Color } from '@open-chess/chess-core';
import { Board } from './Board';
import { defaults } from '../storage/local';

beforeEach(() => {
  class PointerEventMock extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;
    constructor(type: string, init: PointerEventInit) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  vi.stubGlobal('PointerEvent', PointerEventMock);
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate;
});
function setup(orientation: Color = 'w', fen = new Chess().fen()) {
  const onMove = vi.fn();
  const rendered = render(
    <Board
      fen={fen}
      orientation={orientation}
      disabled={false}
      onMove={onMove}
      preferences={defaults}
    />,
  );
  const board = screen.getByRole('group', { name: /Chessboard/ });
  vi.spyOn(board, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    width: 800,
    height: 800,
    right: 800,
    bottom: 800,
    toJSON() {},
  });
  board.querySelectorAll<HTMLElement>('[data-square]').forEach((element, index) => {
    const left = (index % 8) * 100;
    const top = Math.floor(index / 8) * 100;
    const rect = {
      x: left,
      y: top,
      left,
      top,
      width: 100,
      height: 100,
      right: left + 100,
      bottom: top + 100,
      toJSON() {},
    };
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect);
    const piece = element.querySelector<HTMLElement>('.piece-drag');
    if (piece) vi.spyOn(piece, 'getBoundingClientRect').mockReturnValue(rect);
  });
  return { ...rendered, board, onMove };
}
function drag(
  from: HTMLElement,
  board: HTMLElement,
  start: [number, number],
  end: [number, number],
) {
  fireEvent.pointerDown(from, { pointerId: 7, button: 0, clientX: start[0], clientY: start[1] });
  fireEvent.pointerMove(board, { pointerId: 7, clientX: end[0], clientY: end[1] });
}
describe('piece selection', () => {
  it('shows legal knight destinations, and clicking the same piece again clears them', () => {
    const { onMove } = setup();
    const knight = screen.getByRole('button', { name: 'g1 white knight' });
    fireEvent.click(knight);
    expect(knight.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelectorAll('.move-target')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'f3' }).classList.contains('legal-target')).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: 'g3' }).classList.contains('legal-target')).toBe(
      false,
    );
    fireEvent.click(knight);
    expect(knight.getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelectorAll('.move-target, .legal-target, .selected')).toHaveLength(0);
    expect(onMove).not.toHaveBeenCalled();
  });
  it('switches selection, permits a capture, and clears selection on Escape', () => {
    const { board, onMove } = setup('w', '4k3/8/8/8/8/3p4/4PN2/4K3 w - - 0 1');
    fireEvent.click(screen.getByRole('button', { name: 'e2 white pawn' }));
    fireEvent.click(screen.getByRole('button', { name: 'f2 white knight' }));
    expect(screen.getByRole('button', { name: 'e2 white pawn' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
    const capture = screen.getByRole('button', { name: 'd3 black pawn' });
    expect(capture.querySelector('.capture-target')).toBeTruthy();
    fireEvent.keyDown(board, { key: 'Escape' });
    expect(capture.querySelector('.capture-target')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'f2 white knight' }));
    fireEvent.click(capture);
    expect(onMove).toHaveBeenCalledExactlyOnceWith('f2', 'd3');
  });
});
describe('pointer-following chess pieces', () => {
  it('preserves the grab point and ignores a second pointer', () => {
    const { board, onMove } = setup();
    drag(screen.getByRole('button', { name: 'e2 white pawn' }), board, [420, 675], [450, 450]);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'd2 white pawn' }), {
      pointerId: 8,
      button: 0,
      clientX: 350,
      clientY: 650,
    });
    fireEvent.pointerCancel(board, { pointerId: 8 });
    expect((document.querySelector('.dragged-piece') as HTMLElement).style.transform).toBe(
      'translate3d(430px, 375px, 0px)',
    );
    fireEvent.pointerUp(board, { pointerId: 7, clientX: 450, clientY: 450 });
    expect(onMove).toHaveBeenCalledExactlyOnceWith('e2', 'e4');
  });
  it('lifts touch pieces above the finger while using the finger position for the drop', () => {
    const { board, onMove } = setup();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'e2 white pawn' }), {
      pointerId: 7,
      pointerType: 'touch',
      button: 0,
      clientX: 450,
      clientY: 650,
    });
    fireEvent.pointerMove(board, {
      pointerId: 7,
      pointerType: 'touch',
      clientX: 450,
      clientY: 450,
    });
    expect((document.querySelector('.dragged-piece') as HTMLElement).style.transform).toBe(
      'translate3d(400px, 335px, 0px)',
    );
    expect(screen.getByRole('button', { name: 'e4' }).classList.contains('drop-ready')).toBe(true);
    fireEvent.pointerUp(board, { pointerId: 7, clientX: 450, clientY: 450 });
    expect(onMove).toHaveBeenCalledExactlyOnceWith('e2', 'e4');
  });
  it.each(['blur', 'resize', 'scroll'])(
    'cancels a drag on %s without submitting a move',
    (event) => {
      const { board, onMove } = setup();
      drag(screen.getByRole('button', { name: 'e2 white pawn' }), board, [450, 650], [450, 450]);
      fireEvent(window, new Event(event));
      fireEvent.pointerUp(board, { pointerId: 7, clientX: 450, clientY: 450 });
      expect(onMove).not.toHaveBeenCalled();
      expect(document.querySelector('.dragged-piece')).toBeNull();
    },
  );
  it('moves a visible piece with the pointer and submits a legal drop once', () => {
    const { board, onMove } = setup();
    const pawn = screen.getByRole('button', { name: 'e2 white pawn' });
    drag(pawn, board, [450, 650], [450, 450]);
    expect(document.querySelector('.dragged-piece')).toBeTruthy();
    expect(pawn.querySelector('.drag-source')).toBeTruthy();
    fireEvent.pointerMove(board, { pointerId: 7, clientX: 480, clientY: 420 });
    expect((document.querySelector('.dragged-piece') as HTMLElement).style.transform).toBe(
      'translate3d(430px, 370px, 0px)',
    );
    fireEvent.pointerUp(board, { pointerId: 7, clientX: 450, clientY: 450 });
    expect(onMove).toHaveBeenCalledExactlyOnceWith('e2', 'e4');
    expect(document.querySelector('.dragged-piece')).toBeNull();
    fireEvent.click(pawn, { detail: 1 });
    expect(onMove).toHaveBeenCalledTimes(1);
  });
  it.each([
    [450, 350],
    [-50, 450],
  ])('returns an illegal or off-board drop to its source (%i, %i)', (x, y) => {
    const { board, onMove } = setup();
    const pawn = screen.getByRole('button', { name: 'e2 white pawn' });
    drag(pawn, board, [450, 650], [x, y]);
    fireEvent.pointerUp(board, { pointerId: 7, clientX: x, clientY: y });
    expect(onMove).not.toHaveBeenCalled();
    expect(pawn.querySelector('.drag-source')).toBeNull();
    expect(document.querySelector('.dragged-piece')).toBeNull();
  });
  it('maps a drag to the correct square when the board is flipped', () => {
    const { board, onMove } = setup('b');
    drag(screen.getByRole('button', { name: 'e2 white pawn' }), board, [350, 150], [350, 350]);
    fireEvent.pointerUp(board, { pointerId: 7, clientX: 350, clientY: 350 });
    expect(onMove).toHaveBeenCalledExactlyOnceWith('e2', 'e4');
  });
  it('clears the floating piece on a canceled touch/pointer interaction', () => {
    const { board, onMove } = setup();
    drag(screen.getByRole('button', { name: 'e2 white pawn' }), board, [450, 650], [450, 450]);
    fireEvent.pointerCancel(board, { pointerId: 7 });
    fireEvent.pointerUp(board, { pointerId: 7, clientX: 450, clientY: 450 });
    expect(document.querySelector('.dragged-piece')).toBeNull();
    expect(onMove).not.toHaveBeenCalled();
  });
  it('waits for a promotion choice after a legal pawn drag', () => {
    const { board, onMove } = setup('w', '7k/P7/8/8/8/8/8/7K w - - 0 1');
    drag(screen.getByRole('button', { name: 'a7 white pawn' }), board, [50, 150], [50, 50]);
    fireEvent.pointerUp(board, { pointerId: 7, clientX: 50, clientY: 50 });
    expect(onMove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Promote to rook' }));
    expect(onMove).toHaveBeenCalledExactlyOnceWith('a7', 'a8', 'r');
  });
});

describe('piece motion', () => {
  function mockMotion() {
    const animations: {
      element: HTMLElement;
      frames: Keyframe[];
      options: KeyframeAnimationOptions;
      cancel: ReturnType<typeof vi.fn>;
      onfinish: (() => void) | null;
      oncancel: (() => void) | null;
    }[] = [];
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: function (frames: Keyframe[], options: KeyframeAnimationOptions) {
        const animation = {
          element: this as HTMLElement,
          frames,
          options,
          cancel: vi.fn(),
          onfinish: null,
          oncancel: null,
        };
        animations.push(animation);
        return animation;
      },
    });
    return animations;
  }
  it('settles a dropped capture from its release position and removes the captured ghost', () => {
    const animations = mockMotion();
    const game = new Chess();
    game.move('e4');
    game.move('d5');
    const { board, rerender } = setup('w', game.fen());
    drag(screen.getByRole('button', { name: 'e4 white pawn' }), board, [450, 450], [380, 330]);
    expect(
      screen.getByRole('button', { name: 'd5 black pawn' }).classList.contains('capture-ready'),
    ).toBe(true);
    fireEvent.pointerUp(board, { pointerId: 7, clientX: 380, clientY: 330 });
    game.move('exd5');
    rerender(
      <Board
        fen={game.fen()}
        orientation="w"
        disabled={false}
        onMove={vi.fn()}
        preferences={defaults}
      />,
    );
    const moved = animations.find((a) => a.element.classList.contains('piece-drag'))!;
    expect(moved.options.duration).toBe(140);
    expect(moved.frames[0].transform).toBe('translate(30px, -20px) scale(1.1)');
    const ghost = document.querySelector<HTMLElement>('.captured-piece')!;
    expect(ghost.querySelector('img')?.getAttribute('src')).toContain('/bP.svg');
    expect(ghost.style.left).toBe('37.5%');
    expect(ghost.style.top).toBe('37.5%');
    animations.forEach((a) => a.onfinish?.());
    expect(document.querySelector('.captured-piece, .piece-landing, .piece-in-motion')).toBeNull();
  });
  it('removes the correct pawn for en passant, and cleans up when the board changes', () => {
    const animations = mockMotion();
    const game = new Chess();
    ['e4', 'a6', 'e5', 'd5'].forEach((move) => game.move(move));
    const { rerender, unmount } = setup('b', game.fen());
    game.move('exd6');
    rerender(
      <Board
        fen={game.fen()}
        orientation="b"
        disabled={false}
        onMove={vi.fn()}
        preferences={defaults}
      />,
    );
    const ghost = document.querySelector<HTMLElement>('.captured-piece')!;
    expect(ghost.style.left).toBe('50%');
    expect(ghost.style.top).toBe('50%');
    rerender(
      <Board
        fen={new Chess().fen()}
        orientation="w"
        disabled={false}
        onMove={vi.fn()}
        preferences={defaults}
      />,
    );
    expect(document.querySelector('.captured-piece, .piece-landing')).toBeNull();
    expect(animations.every((a) => a.cancel.mock.calls.length === 1)).toBe(true);
    unmount();
  });
  it('animates an invalid drop back and cancels it before a new drag', () => {
    const animations = mockMotion();
    const { board, onMove } = setup();
    const pawn = screen.getByRole('button', { name: 'e2 white pawn' });
    drag(pawn, board, [450, 650], [450, 350]);
    fireEvent.pointerUp(board, { pointerId: 7, clientX: 450, clientY: 350 });
    expect(animations[0].frames[0].transform).toBe('translate(0px, -300px) scale(1.1)');
    expect(onMove).not.toHaveBeenCalled();
    fireEvent.pointerDown(pawn, { pointerId: 8, button: 0, clientX: 450, clientY: 650 });
    expect(animations[0].cancel).toHaveBeenCalledOnce();
    expect(document.querySelector('.piece-in-motion')).toBeNull();
  });
  it('slides both king and rook for castling and respects reduced motion', () => {
    const game = new Chess('4k3/8/8/8/8/8/8/4K2R w K - 0 1');
    const animation = { cancel: vi.fn(), onfinish: null, oncancel: null };
    const animate = vi.fn(() => animation);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    const { rerender } = setup('w', game.fen());
    game.move('O-O');
    rerender(
      <Board
        fen={game.fen()}
        orientation="w"
        disabled={false}
        onMove={vi.fn()}
        preferences={defaults}
      />,
    );
    expect(
      animate.mock.contexts.filter((element) =>
        element instanceof HTMLElement && element.classList.contains('piece-drag'),
      ),
    ).toHaveLength(2);
    expect(document.querySelector('.piece-landing')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'g1 white king' })).toBeTruthy();
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    game.undo();
    rerender(
      <Board
        fen={game.fen()}
        orientation="w"
        disabled={false}
        onMove={vi.fn()}
        preferences={defaults}
      />,
    );
    expect(animate).toHaveBeenCalledTimes(3);
  });
});
