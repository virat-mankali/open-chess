import { Check, Star, ThumbsUp } from 'lucide-react';
import { QUALITIES, type Quality } from '@open-chess/chess-core';

/** One visual language for the board, move list, coach and review summary. */
export function QualityBadge({
  quality,
  size = 'md',
  className = '',
}: {
  quality: Quality;
  size?: 'sm' | 'md' | 'lg' | 'board';
  className?: string;
}) {
  const label = QUALITIES[quality].label;
  return (
    <span
      className={`quality-badge grade-${quality} badge-${size} ${className}`}
      role="img"
      aria-label={label}
      title={label}
    >
      {quality === 'best' ? (
        <Star fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
      ) : quality === 'excellent' ? (
        <ThumbsUp strokeWidth={2.6} aria-hidden="true" />
      ) : quality === 'good' ? (
        <Check strokeWidth={3.5} aria-hidden="true" />
      ) : (
        <span aria-hidden="true">
          {{ brilliant: '!!', great: '!', inaccuracy: '?!', mistake: '?', blunder: '??' }[quality]}
        </span>
      )}
    </span>
  );
}
