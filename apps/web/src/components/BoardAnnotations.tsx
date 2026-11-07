import { useId } from 'react';
import type { Color, ReviewArrow, Square } from '@open-chess/chess-core';

export function squareCenter(square: Square, orientation: Color) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return orientation === 'w'
    ? [file * 100 + 50, (7 - rank) * 100 + 50]
    : [(7 - file) * 100 + 50, rank * 100 + 50];
}

export function arrowPath(arrow: ReviewArrow, orientation: Color) {
  const [x1, y1] = squareCenter(arrow.from, orientation);
  const [x2, y2] = squareCenter(arrow.to, orientation);
  const dx = Math.abs(x2 - x1),
    dy = Math.abs(y2 - y1);
  // Knights travel along an L: take the long leg first, then point at the target.
  if (dx === 100 && dy === 200) return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
  if (dx === 200 && dy === 100) return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export function BoardAnnotations({
  arrows,
  targets = [],
  orientation,
}: {
  arrows: ReviewArrow[];
  targets?: Square[];
  orientation: Color;
}) {
  const id = useId().replace(/:/g, '');
  if (!arrows.length) return null;
  return (
    <svg
      className="board-annotations"
      viewBox="0 0 800 800"
      role="img"
      aria-label={`Move idea: ${arrows.map((a) => `${a.from} to ${a.to}`).join(', ')}`}
    >
      <defs>
        <marker
          id={`${id}-tip`}
          markerWidth="2.5"
          markerHeight="2.5"
          refX="1.9"
          refY="1.25"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0 0 2.4 1.25 0 2.5Z" fill="#f6ae38" />
        </marker>
      </defs>
      {targets.map((target) => {
        const [cx, cy] = squareCenter(target, orientation);
        return (
          <circle
            key={target}
            cx={cx}
            cy={cy}
            r="40"
            fill="#f6ae3814"
            stroke="#ffd080"
            strokeWidth="3"
            strokeDasharray="7 7"
          />
        );
      })}
      {arrows.map((arrow, index) => (
        <path
          key={`${arrow.from}-${arrow.to}-${index}`}
          d={arrowPath(arrow, orientation)}
          fill="none"
          stroke="#f6ae38"
          strokeWidth={arrow.kind === 'move' ? 22 : 17}
          strokeLinejoin="round"
          strokeLinecap="butt"
          opacity={arrow.kind === 'move' ? 0.88 : 0.74}
          markerEnd={`url(#${id}-tip)`}
        />
      ))}
    </svg>
  );
}
