import type { Color, PieceSymbol, Bot } from '@open-chess/chess-core';

export function Piece({ type, color }: { type: PieceSymbol; color: Color }) {
  const fill = color === 'w' ? '#f8f3e8' : '#37303a';
  const stroke = color === 'w' ? '#665b55' : '#16121a';
  return (
    <svg className="chess-piece" viewBox="0 0 80 80" aria-hidden="true">
      <g fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {type === 'p' && (
          <>
            <circle cx="40" cy="23" r="10" />
            <path d="M32 34h16l-3 10 3 10 8 8H24l8-8 3-10z" />
          </>
        )}
        {type === 'r' && (
          <>
            <path d="M22 15h8v9h6v-9h8v9h6v-9h8v21l-9 7 2 17H29l2-17-9-7z" />
            <path d="M25 35h30M31 43h18" fill="none" />
          </>
        )}
        {type === 'n' && (
          <>
            <path d="m24 59 4-12 14-8-9-5-8 7-10-8 12-17 9-2 1-8 12 9 9 16-1 17 3 12z" />
            <path d="m41 24 4 7-8 10M31 20l-7 10" fill="none" />
            <circle cx="34" cy="25" r="2" fill={stroke} stroke="none" />
          </>
        )}
        {type === 'b' && (
          <>
            <path d="M40 12c-6 7-15 15-15 23 0 7 6 10 10 12l-6 13h22l-6-13c5-2 10-5 10-12 0-8-9-16-15-23z" />
            <path d="m44 25-9 12M31 47h18" fill="none" />
            <circle cx="40" cy="11" r="4" />
          </>
        )}
        {type === 'q' && (
          <>
            <path d="m20 25 8 7 5-12 7 13 7-13 5 12 8-7-9 28H29z" />
            <circle cx="20" cy="22" r="4" />
            <circle cx="32" cy="16" r="4" />
            <circle cx="48" cy="16" r="4" />
            <circle cx="60" cy="22" r="4" />
            <path d="M29 48h22l3 12H26zM29 53h22" />
          </>
        )}
        {type === 'k' && (
          <>
            <path d="M37 8h6v7h7v6h-7v9h-6v-9h-7v-6h7z" />
            <path d="M40 31c-6-12-23-9-19 5l9 17h20l9-17c4-14-13-17-19-5zM30 48h20M30 53h20l4 8H26z" />
          </>
        )}
        <path d="M25 59h30l4 8H21z" />
        <path d="M20 67h40v6H20z" />
      </g>
    </svg>
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
