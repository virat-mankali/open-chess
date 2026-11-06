import { useEffect, useRef, useState } from 'react';
import {
  Chess,
  type Color,
  type Square,
  type PieceSymbol,
  type MoveRecord,
  QUALITIES,
} from '@open-chess/chess-core';
import { Piece } from './Artwork';
import type { Preferences } from '../storage/local';

export function Board({
  fen,
  orientation,
  disabled,
  onMove,
  preferences,
  lastMove,
  hint,
  quality,
}: {
  fen: string;
  orientation: Color;
  disabled: boolean;
  onMove: (from: Square, to: Square, promotion?: string) => void;
  preferences: Preferences;
  lastMove?: { from: string; to: string };
  hint?: string | null;
  quality?: MoveRecord;
}) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const promotionRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (promotion) promotionRef.current?.showModal();
  }, [promotion]);
  const [selectionFen, setSelectionFen] = useState(fen);
  const game = new Chess(fen);
  const currentSelected = selectionFen === fen ? selected : null;
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
    setSelected(game.get(square)?.color === game.turn() ? square : null);
  };
  const checkedKing = game.isCheck()
    ? game
        .board()
        .flat()
        .find((p) => p?.type === 'k' && p.color === game.turn())?.square
    : null;
  return (
    <div className={`board-frame theme-${preferences.theme}`}>
      <div
        className="board"
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
                className={`square ${light ? 'light' : 'dark'} ${currentSelected === square ? 'selected' : ''} ${recent ? 'last-move' : ''} ${suggested ? 'hinted' : ''} ${checkedKing === square ? 'checked' : ''}`}
                aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${{ p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }[piece.type]}` : ''}`}
                aria-disabled={disabled}
                onClick={() => select(square)}
                onDragOver={(e) => {
                  if (!disabled) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!disabled) {
                    const from = e.dataTransfer.getData('text/plain') as Square;
                    if (/^[a-h][1-8]$/.test(from)) submit(from, square);
                  }
                }}
              >
                {preferences.coordinates && col === 0 && <span className="rank-label">{rank}</span>}
                {preferences.coordinates && row === 7 && <span className="file-label">{file}</span>}
                {piece && (
                  <span
                    className="piece-drag"
                    draggable={!disabled && piece.color === game.turn()}
                    onDragStart={(e) => {
                      if (disabled) {
                        e.preventDefault();
                        return;
                      }
                      e.dataTransfer.setData('text/plain', square);
                      setSelectionFen(fen);
                      setSelected(square);
                    }}
                  >
                    <Piece type={piece.type} color={piece.color} />
                  </span>
                )}
                {preferences.targets && target && (
                  <span className={piece ? 'capture-target' : 'move-target'} />
                )}
                {quality && quality.uci.slice(2, 4) === square && (
                  <span className={`move-badge quality-${QUALITIES[quality.quality].color}`}>
                    {QUALITIES[quality.quality].symbol}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
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
                  <Piece type={type} color={game.turn()} />
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
