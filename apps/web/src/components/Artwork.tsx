import type { Color, PieceSymbol, Bot } from '@open-chess/chess-core';

export function Piece({ type, color }: { type: PieceSymbol; color: Color }) {
  return (
    <img
      className="chess-piece"
      src={`/pieces/cburnett/${color}${type.toUpperCase()}.svg`}
      width={45}
      height={45}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
export function Avatar({
  bot,
  size = 'md',
}: {
  bot: Pick<Bot, 'animal' | 'color' | 'name'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const animal = bot.animal;
  return (
    <div className={`avatar avatar-${bot.color} avatar-${size}`}>
      <svg viewBox="0 0 100 100" role="img" aria-label={`${bot.name} portrait`}>
        <ellipse cx="50" cy="103" rx="38" ry="29" fill="var(--avatar-body)" />
        {['cat', 'fox', 'owl'].includes(animal) && (
          <path
            d="M18 43 15 10 38 27M62 27 85 10 82 43"
            fill="var(--avatar-fur)"
            stroke="var(--avatar-dark)"
            strokeWidth="2"
          />
        )}
        {animal === 'bear' && (
          <g fill="var(--avatar-fur)">
            <circle cx="23" cy="28" r="14" />
            <circle cx="77" cy="28" r="14" />
          </g>
        )}
        {animal === 'frog' && (
          <g fill="var(--avatar-fur)">
            <circle cx="27" cy="28" r="17" />
            <circle cx="73" cy="28" r="17" />
          </g>
        )}
        {animal === 'chick' && (
          <path d="M43 24Q30 5 45 10L50 21Q57 4 61 16L55 27" fill="var(--avatar-fur)" />
        )}
        {animal === 'robot' && (
          <>
            <path d="M50 24V10" stroke="var(--avatar-dark)" strokeWidth="4" />
            <circle cx="50" cy="9" r="5" fill="var(--avatar-fur)" />
            <rect x="10" y="43" width="80" height="18" rx="6" fill="var(--avatar-dark)" />
          </>
        )}
        <rect
          x="18"
          y="25"
          width="64"
          height="54"
          rx={animal === 'robot' ? 16 : 28}
          fill="var(--avatar-fur)"
        />
        {(animal === 'owl' || animal === 'fox') && (
          <>
            <ellipse cx="34" cy="47" rx="16" ry="18" fill="#fff4de" />
            <ellipse cx="66" cy="47" rx="16" ry="18" fill="#fff4de" />
          </>
        )}
        {animal === 'robot' && (
          <rect x="27" y="36" width="46" height="26" rx="8" fill="var(--avatar-dark)" />
        )}
        <g fill={animal === 'robot' ? '#d8f9ee' : '#302735'}>
          <ellipse cx="35" cy="48" rx="3.5" ry="5" />
          <ellipse cx="65" cy="48" rx="3.5" ry="5" />
        </g>
        <g fill="#fff" opacity=".8">
          <circle cx="36" cy="46" r="1.2" />
          <circle cx="66" cy="46" r="1.2" />
        </g>
        {['chick', 'owl'].includes(animal) ? (
          <path d="m44 58 6 9 6-9z" fill="#d98936" />
        ) : (
          <>
            <path d="m46 58 4 4 4-4z" fill="var(--avatar-dark)" />
            <path
              d="M41 65q9 8 18 0"
              fill="none"
              stroke="var(--avatar-dark)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        )}
        {animal === 'cat' && (
          <g stroke="var(--avatar-dark)" opacity=".6" strokeWidth="1.5">
            <path d="m13 56 16 3m-16 5 16-1m42-4 16-3m-16 7 16 1" />
          </g>
        )}
        <g fill="#e78c89" opacity=".45">
          <ellipse cx="28" cy="60" rx="6" ry="3" />
          <ellipse cx="72" cy="60" rx="6" ry="3" />
        </g>
      </svg>
    </div>
  );
}
