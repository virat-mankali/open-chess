import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { QUALITIES, type MoveRecord, type Color, type Quality } from '@open-chess/chess-core';

export function EvaluationChart({
  records,
  cursor,
  onSelect,
}: {
  records: MoveRecord[];
  cursor: number | null;
  onSelect: (ply: number) => void;
}) {
  if (!records.length)
    return (
      <div className="empty-chart">
        <TrendingUp size={26} />
        <span>Your story on the board starts here.</span>
      </div>
    );
  const points = [0, ...records.map((r) => Math.max(-600, Math.min(600, r.cp)))];
  const path = points
    .map(
      (cp, i) =>
        `${i ? 'L' : 'M'} ${(i / Math.max(1, points.length - 1)) * 340} ${48 - (cp / 600) * 40}`,
    )
    .join(' ');
  return (
    <div className="eval-chart">
      <svg
        viewBox="0 0 340 96"
        role="img"
        aria-label="Evaluation over the game. Above the middle favors White, below favors Black."
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity=".28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L 340 96 L 0 96 Z`} fill="url(#chart-fill)" />
        <path d="M0 48H340" stroke="var(--border)" strokeDasharray="4 4" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />
        {cursor !== null && (
          <line
            x1={(cursor / Math.max(1, points.length - 1)) * 340}
            x2={(cursor / Math.max(1, points.length - 1)) * 340}
            y1="4"
            y2="92"
            stroke="var(--text)"
            strokeOpacity=".5"
          />
        )}
      </svg>
      <input
        aria-label="Review position"
        type="range"
        min="0"
        max={records.length}
        value={cursor ?? records.length}
        onChange={(e) => onSelect(Number(e.target.value))}
      />
      <div>
        <span>Opening</span>
        <span>Latest position</span>
      </div>
    </div>
  );
}
export function ReviewPanel({
  records,
  color,
  cursor,
  onSelect,
  onExport,
  challenge,
  finished,
}: {
  records: MoveRecord[];
  color: Color;
  cursor: number | null;
  onSelect: (ply: number | null) => void;
  onExport: () => void;
  challenge: boolean;
  finished: boolean;
}) {
  const selected = records[(cursor ?? records.length) - 1];
  const yours = records.filter((r) => r.color === color);
  const accuracy = yours.length
    ? Math.round(yours.reduce((n, r) => n + r.accuracy, 0) / yours.length)
    : null;
  const hidden = challenge && !finished;
  const pairs = Array.from({ length: Math.ceil(records.length / 2) }, (_, i) =>
    records.slice(i * 2, i * 2 + 2),
  );
  return (
    <div className="review-content">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">EVERY MOVE IS A LESSON</span>
          <h2>Your game, explained.</h2>
        </div>
        <Sparkles size={21} />
      </div>
      {hidden ? (
        <div className="coach-note">
          <b>Trust your own calculation.</b>
          <p>Your full analysis will be ready after the game. You’re playing in Challenge mode.</p>
        </div>
      ) : (
        <>
          <div className="review-stats">
            <div>
              <span>Your accuracy</span>
              <strong>{accuracy === null ? '—' : `${accuracy}%`}</strong>
            </div>
            <div>
              <span>Brilliant moves</span>
              <strong className="brilliant-number">
                {yours.filter((r) => r.quality === 'brilliant').length}
                <span> !!</span>
              </strong>
            </div>
          </div>
          <EvaluationChart records={records} cursor={cursor} onSelect={onSelect} />
          {selected ? (
            <div
              className={`feedback-card quality-border-${QUALITIES[selected.quality].color}`}
              aria-live="polite"
            >
              <div className="feedback-title">
                <span className={`quality-icon quality-${QUALITIES[selected.quality].color}`}>
                  {QUALITIES[selected.quality].symbol}
                </span>
                <div>
                  <strong>{QUALITIES[selected.quality].label}</strong>
                  <span>
                    {selected.color === 'w' ? 'White' : 'Black'} played {selected.san}
                  </span>
                </div>
                <span className="score-chip">
                  {Math.abs(selected.cp) >= 9000
                    ? 'Mate'
                    : `${selected.cp >= 0 ? '+' : ''}${(selected.cp / 100).toFixed(1)}`}
                </span>
              </div>
              <p>{selected.explanation}</p>
              <div className="best-line">
                <span>Best continuation</span>
                <b>{selected.line.join('  ') || 'Game over'}</b>
              </div>
              <small>Stockfish · depth {selected.depth} · approximate coaching grade</small>
            </div>
          ) : (
            <div className="coach-note">
              <span className="sparkle-tile">
                <Sparkles size={20} />
              </span>
              <b>A good move starts with a good idea.</b>
              <p>
                Make your first move to get an engine-backed explanation. Every move is a chance to
                learn.
              </p>
            </div>
          )}
        </>
      )}
      <div className="moves-heading">
        <h3>Move history</h3>
        <button
          className="icon-button"
          aria-label="Download PGN"
          onClick={onExport}
          disabled={!records.length}
        >
          <ArrowDownToLine size={16} />
        </button>
      </div>
      <div className="move-table" aria-label="Move history">
        {pairs.length ? (
          pairs.map((pair, i) => (
            <div className="move-row" key={i}>
              <span>{i + 1}.</span>
              {pair.map((move) => (
                <button
                  className={cursor === move.ply ? 'active' : ''}
                  key={move.ply}
                  onClick={() => onSelect(move.ply)}
                  aria-label={`Review ${move.color === 'w' ? 'White' : 'Black'} move ${move.san}`}
                >
                  <b>{move.san}</b>
                  {!hidden && (
                    <span className={`quality-small quality-text-${QUALITIES[move.quality].color}`}>
                      {QUALITIES[move.quality].symbol}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))
        ) : (
          <p className="muted empty-moves">Your moves will appear here.</p>
        )}
      </div>
      <div className="history-controls">
        <button
          className="icon-button"
          aria-label="First position"
          disabled={!records.length}
          onClick={() => onSelect(0)}
        >
          <ChevronsLeft size={20} />
        </button>
        <button
          className="icon-button"
          aria-label="Previous move"
          disabled={cursor === 0 || !records.length}
          onClick={() => onSelect(Math.max(0, (cursor ?? records.length) - 1))}
        >
          <ChevronLeft size={20} />
        </button>
        <button className="text-button" onClick={() => onSelect(null)} disabled={!records.length}>
          {cursor === null ? 'Latest position' : 'Back to latest'}
        </button>
        <button
          className="icon-button"
          aria-label="Next move"
          disabled={cursor === null || cursor >= records.length}
          onClick={() => onSelect(Math.min(records.length, (cursor ?? 0) + 1))}
        >
          <ChevronRight size={20} />
        </button>
        <button
          className="icon-button"
          aria-label="Last position"
          disabled={!records.length}
          onClick={() => onSelect(null)}
        >
          <ChevronsRight size={20} />
        </button>
      </div>
    </div>
  );
}
export function QualityGuide() {
  return (
    <div className="quality-guide">
      {(Object.entries(QUALITIES) as [Quality, (typeof QUALITIES)[Quality]][]).map(
        ([key, value]) => (
          <div key={key}>
            <span className={`quality-icon quality-${value.color}`}>{value.symbol}</span>
            <div>
              <b>{value.label}</b>
              <p>
                {
                  {
                    brilliant:
                      'A sound piece sacrifice, supported by the engine. Our conservative detector requires a real material offer and a strong resulting position.',
                    great: 'A critical best move when the next option is significantly worse.',
                    best: 'The engine’s preferred move, or effectively equal in value.',
                    excellent: 'Loses no more than 2% in our estimated outcome model.',
                    good: 'Loses no more than 5% in our estimated outcome model.',
                    inaccuracy: 'Loses between 5% and 10% in our estimated outcome model.',
                    mistake: 'Loses between 10% and 20% in our estimated outcome model.',
                    blunder: 'Loses more than 20% in our estimated outcome model.',
                  }[key]
                }
              </p>
            </div>
          </div>
        ),
      )}
      <p className="muted">
        These are OpenChess’s own estimates, not certified ratings or a proprietary grading system.
        Short engine searches can miss deeper ideas.
      </p>
    </div>
  );
}
