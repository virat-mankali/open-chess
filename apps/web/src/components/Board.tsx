import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Chess,
  type Color,
  type Square,
  type PieceSymbol,
  type MoveRecord,
  type ReviewArrow,
} from '@open-chess/chess-core';
import { Piece } from './Artwork';
import { QualityBadge } from './QualityBadge';
import { usePieceMotion } from './usePieceMotion';
import { BoardAnnotations } from './BoardAnnotations';
import type { Preferences } from '../storage/local';

type Drag = {
  from: Square;
  type: PieceSymbol;
  color: Color;
  pointerId: number;
  x: number;
  y: number;
  size: number;
  active: boolean;
  fen: string;
};

export function Board({
  fen,
  orientation,
  disabled,
  onMove,
  preferences,
  lastMove,
  hint,
  quality,
  arrows = [],
  ideaTargets = [],
}: {
  fen: string;
  orientation: Color;
  disabled: boolean;
  onMove: (from: Square, to: Square, promotion?: string) => void;
  preferences: Preferences;
  lastMove?: { from: string; to: string };
  hint?: string | null;
  quality?: MoveRecord;
  arrows?: ReviewArrow[];
  ideaTargets?: Square[];
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const droppedMove = useRef<string | null>(null);
  usePieceMotion(boardRef, fen, orientation, droppedMove);
  const [hoverSquare, setHoverSquare] = useState<Square | null>(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  function cancelDrag() {
    dragRef.current = null;
    setHoverSquare(null);
    setDrag(null);
  }
  useEffect(() => {
    cancelDrag();
  }, [fen, orientation, disabled]);
  useEffect(() => {
    const cancel = () => cancelDrag();
    window.addEventListener('blur', cancel);
    return () => window.removeEventListener('blur', cancel);
  }, []);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const promotionRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (promotion) promotionRef.current?.showModal();
  }, [promotion]);
  const [selectionFen, setSelectionFen] = useState(fen);
  const game = new Chess(fen);
  const currentSelected = !disabled && selectionFen === fen ? selected : null;
  const targets = currentSelected ? game.moves({ square: currentSelected, verbose: true }) : [];
  const files = orientation === 'w' ? 'abcdefgh' : 'hgfedcba';
  const ranks = orientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const submit = (from: Square, to: Square) => {
    const possible = game.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (!possible.length) return;
    setSelected(null);
    if (possible.some((m) => m.promotion)) {
      setPromotion({ from, to });
      return;
    }
    onMove(from, to);
  };
  const select = (square: Square) => {
    if (disabled) return;
    if (currentSelected && targets.some((m) => m.to === square)) {
      submit(currentSelected, square);
      return;
    }
    setSelectionFen(fen);
    setSelected(
      currentSelected !== square && game.get(square)?.color === game.turn() ? square : null,
    );
  };
  function pointerDown(e: ReactPointerEvent<HTMLButtonElement>, square: Square) {
    const piece = game.get(square);
    if (
      disabled ||
      e.isPrimary === false ||
      e.button !== 0 ||
      !piece ||
      piece.color !== game.turn()
    )
      return;
    suppressClick.current = false;
    const size = boardRef.current!.getBoundingClientRect().width / 8;
    dragRef.current = {
      from: square,
      type: piece.type,
      color: piece.color,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      size,
      active: false,
      fen,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function pointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const candidate = dragRef.current;
    if (!candidate || candidate.pointerId !== e.pointerId || disabled || candidate.fen !== fen)
      return;
    if (!candidate.active && Math.hypot(e.clientX - candidate.x, e.clientY - candidate.y) < 4)
      return;
    e.preventDefault();
    if (!candidate.active) {
      candidate.active = true;
      setSelectionFen(fen);
      setSelected(candidate.from);
      setDrag({ ...candidate, x: e.clientX, y: e.clientY });
    }
    const rect = boardRef.current!.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
    const hover =
      col >= 0 && col < 8 && row >= 0 && row < 8 ? ((files[col] + ranks[row]) as Square) : null;
    setHoverSquare((old) => (old === hover ? old : hover));
    // Moving a single fixed overlay avoids rerendering 64 squares at pointer speed.
    if (ghostRef.current)
      ghostRef.current.style.transform = `translate3d(${e.clientX - candidate.size / 2}px, ${e.clientY - candidate.size / 2}px, 0)`;
  }
  function pointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const candidate = dragRef.current;
    if (!candidate || candidate.pointerId !== e.pointerId) return;
    cancelDrag();
    if (!candidate.active) return; // A normal click is handled by the square button.
    e.preventDefault();
    suppressClick.current = true;
    if (disabled || candidate.fen !== fen) return;
    const rect = boardRef.current!.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return;
    const to = (files[col] + ranks[row]) as Square;
    if (to !== candidate.from) {
      droppedMove.current = candidate.from + to;
      submit(candidate.from, to);
    }
  }
  const checkedKing = game.isCheck()
    ? game
        .board()
        .flat()
        .find((p) => p?.type === 'k' && p.color === game.turn())?.square
    : null;
  return (
    <div className={`board-frame theme-${preferences.theme}`}>
      <div
        className={`board ${drag ? 'is-dragging' : ''}`}
        ref={boardRef}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            cancelDrag();
            setSelected(null);
          }
        }}
        role="group"
        aria-label={`${game.turn() === 'w' ? 'White' : 'Black'} to move. Chessboard`}
      >
        {ranks.flatMap((rank, row) =>
          [...files].map((file, col) => {
            const square = (file + rank) as Square;
            const piece = game.get(square);
            const light = (file.charCodeAt(0) - 97 + rank) % 2 === 0;
            const target = targets.some((m) => m.to === square);
            const recent = lastMove?.from === square || lastMove?.to === square;
            const suggested = hint?.slice(0, 2) === square || hint?.slice(2, 4) === square;
            return (
              <button
                key={square}
                data-square={square}
                className={`square ${light ? 'light' : 'dark'} ${currentSelected === square ? 'selected' : ''} ${recent ? 'last-move' : ''} ${suggested ? 'hinted' : ''} ${preferences.targets && target ? 'legal-target' : ''} ${preferences.targets && hoverSquare === square && target ? 'drop-ready' : ''} ${!disabled && piece?.color === game.turn() ? 'selectable-piece' : ''} ${checkedKing === square ? 'checked' : ''}`}
                aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${{ p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }[piece.type]}` : ''}`}
                aria-disabled={disabled}
                aria-pressed={currentSelected === square}
                onClick={(e) => {
                  if (suppressClick.current && e.detail > 0) {
                    suppressClick.current = false;
                    return;
                  }
                  select(square);
                }}
                onPointerDown={(e) => pointerDown(e, square)}
              >
                {preferences.coordinates && col === 0 && <span className="rank-label">{rank}</span>}
                {preferences.coordinates && row === 7 && <span className="file-label">{file}</span>}
                {piece && (
                  <span className={`piece-drag ${drag?.from === square ? 'drag-source' : ''}`}>
                    <Piece type={piece.type} color={piece.color} set={preferences.pieces} />
                  </span>
                )}
                {preferences.targets && target && (
                  <span className={piece ? 'capture-target' : 'move-target'} />
                )}
                <svg className="square-corners" viewBox="0 0 100 100" aria-hidden="true">
                  <path d="M7 28V10Q7 7 10 7H28M72 7H90Q93 7 93 10V28M93 72V90Q93 93 90 93H72M28 93H10Q7 93 7 90V72" />
                </svg>
                {quality && quality.uci.slice(2, 4) === square && (
                  <QualityBadge quality={quality.quality} size="board" className="move-badge" />
                )}
              </button>
            );
          }),
        )}
      </div>
      <BoardAnnotations arrows={arrows} targets={ideaTargets} orientation={orientation} />
      {drag &&
        createPortal(
          <div
            className="dragged-piece"
            ref={ghostRef}
            aria-hidden="true"
            style={{
              width: drag.size,
              height: drag.size,
              transform: `translate3d(${drag.x - drag.size / 2}px, ${drag.y - drag.size / 2}px, 0)`,
            }}
          >
            <Piece type={drag.type} color={drag.color} set={preferences.pieces} />
          </div>,
          document.body,
        )}
      {promotion && (
        <dialog
          ref={promotionRef}
          className="promotion-dialog"
          aria-label="Choose a promotion piece"
          onCancel={(e) => {
            e.preventDefault();
            setPromotion(null);
          }}
        >
          <div>
            <h3>Make it a promotion</h3>
            <p>Choose your new piece.</p>
            <div className="promotion-choices">
              {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((type) => (
                <button
                  key={type}
                  autoFocus={type === 'q'}
                  aria-label={`Promote to ${{ q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn', k: 'king' }[type]}`}
                  onClick={() => {
                    onMove(promotion.from, promotion.to, type);
                    setPromotion(null);
                  }}
                >
                  <Piece type={type} color={game.turn()} set={preferences.pieces} />
                </button>
              ))}
            </div>
            <button className="text-button" onClick={() => setPromotion(null)}>
              Cancel
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
