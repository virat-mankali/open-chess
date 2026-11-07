import { useId } from 'react';

/** Original vector coach illustration, crisp at every board size. */
export function CoachPortrait() {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="coach-portrait" viewBox="0 0 100 124" role="img" aria-label="OpenChess coach">
      <defs>
        <linearGradient id={`${id}-hair`} x2="1" y2="1">
          <stop stopColor="#464448" />
          <stop offset="1" stopColor="#24242b" />
        </linearGradient>
        <linearGradient id={`${id}-shirt`} x2="0.8" y2="1">
          <stop stopColor="#b9c8a4" />
          <stop offset="1" stopColor="#6b8061" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="61" r="43" fill="#a3d160" opacity=".08" />
      <path d="M22 60C14 22 28 8 51 8c30 0 35 23 29 51l8 34H14Z" fill={`url(#${id}-hair)`} />
      <path d="M7 124c2-27 15-40 35-43h17c22 4 32 18 35 43" fill={`url(#${id}-shirt)`} />
      <path d="m41 72-1 16 11 13 12-14-4-16" fill="#d69c7f" />
      <path
        d="M29 36c-4 24 3 45 22 47 17-2 25-22 22-45-19 1-22-15-22-15s-7 13-22 13"
        fill="#efc1a2"
      />
      <path d="M29 44c-6-2-8 11 1 16m42-16c7-3 7 12-1 16" fill="#e7b193" />
      <path
        d="M34 46q6-4 11-1m12 0q6-3 11 1"
        fill="none"
        stroke="#624e48"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M34 51q5-4 10 0m14 0q5-4 9 0"
        fill="none"
        stroke="#392f32"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="40" cy="52" rx="2" ry="3" fill="#393333" />
      <ellipse cx="62" cy="52" rx="2" ry="3" fill="#393333" />
      <circle cx="40.7" cy="51.2" r=".8" fill="#fff" />
      <circle cx="62.7" cy="51.2" r=".8" fill="#fff" />
      <path d="m51 54-2 8h4" stroke="#c48a74" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <ellipse cx="36" cy="62" rx="5" ry="2.8" fill="#db8d83" opacity=".35" />
      <ellipse cx="66" cy="62" rx="5" ry="2.8" fill="#db8d83" opacity=".35" />
      <path d="M43 68q8 11 16 0Z" fill="#b66b66" />
      <path d="M44 68h14q-7 5-14 0" fill="#fff8ed" />
      <path
        d="M28 36q16-5 23-16c9 14 16 18 23 19M23 35q-4 42 8 55m45-56q9 40-6 58"
        fill="none"
        stroke="#59545a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m38 85 13 16-14 10-7-22m33-4-12 16 14 10 7-21" fill="#d6dfcb" />
      <path d="M51 101v23M21 107l-3 17m62-17 3 17" fill="none" stroke="#58724e" strokeWidth="1.5" />
      <circle cx="55" cy="115" r="1.5" fill="#e0e9d8" />
      <circle cx="28" cy="62" r="2" fill="#e4c877" />
      <circle cx="73" cy="62" r="2" fill="#e4c877" />
    </svg>
  );
}
