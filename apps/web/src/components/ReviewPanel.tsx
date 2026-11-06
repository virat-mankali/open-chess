import { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import {
  QUALITIES,
  type MoveRecord,
  type Color,
  type Quality,
  type Move,
} from '@open-chess/chess-core';
import { Piece } from './Artwork';
import { QualityBadge } from './QualityBadge';
import type { Preferences } from '../storage/local';

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
        <BarChart3 size={24} />
        <span>The evaluation graph appears as moves are analyzed.</span>
      </div>
    );
  const points = [0, ...records.map((r) => Math.max(-600, Math.min(600, r.cp)))];
  const path = points
    .map(
      (cp, i) =>
        `${i ? 'L' : 'M'} ${(i / Math.max(1, points.length - 1)) * 340} ${48 - (cp / 600) * 40}`,
    )
    .join(' ');
  const position = Math.min(cursor ?? records.length, records.length);
  return (
    <div className="eval-chart">
      <svg
        viewBox="0 0 340 96"
        role="img"
        aria-label="Game evaluation. Above the center favors White; below favors Black."
      >
        <path d="M0 0H340V96H0Z" fill="#44423e" />
        <path d={`${path} L 340 96 L 0 96 Z`} fill="#e8e7e3" />
        <path d="M0 48H340" stroke="#8c8983" strokeDasharray="3 4" />
        <path d={path} fill="none" stroke="#b9b6ae" strokeWidth="1.5" />
        <line
          x1={(position / (points.length - 1)) * 340}
          x2={(position / (points.length - 1)) * 340}
          y1="0"
          y2="96"
          stroke="var(--accent)"
          strokeWidth="2"
        />
      </svg>
      <input
        aria-label="Review position"
        type="range"
        min="0"
        max={records.length}
        value={position}
        onChange={(e) => onSelect(Number(e.target.value))}
      />
      <div>
        <span>Opening</span>
        <span>{records.length} moves analyzed</span>
      </div>
    </div>
  );
}

export function ReviewPanel({
  records,
  moves,
  color,
  opponent,
  cursor,
  onSelect,
  onExport,
  challenge,
  finished,
  reviewState,
  reviewError,
  onRetry,
  pieces,
}: {
  records: MoveRecord[];
  moves: Move[];
  color: Color;
  opponent: string;
  cursor: number | null;
  onSelect: (ply: number | null) => void;
  onExport: () => void;
  challenge: boolean;
  finished: boolean;
  reviewState: 'loading' | 'ready' | 'error';
  reviewError: string;
  onRetry: () => void;
  pieces: Preferences['pieces'];
}) {
  const [view, setView] = useState<'overview' | 'moves'>('moves');
  const selectedPly = cursor ?? moves.length;
  // During live play, explain the human's latest decision even after a quick bot
  // reply. Explicit history navigation always reviews the selected position.
  let coachPly = selectedPly;
  if (cursor === null) {
    for (let i = moves.length - 1; i >= 0; i--) {
      if (moves[i].color === color) {
        coachPly = i + 1;
        break;
      }
    }
  }
  const selected = records[coachPly - 1];
  const selectedMove = moves[coachPly - 1];
  const hidden = challenge && !finished;
  const pending = moves.length - records.length;
  const qualityKeys = Object.keys(QUALITIES) as Quality[];
  const players = (['w', 'b'] as const).map((side) => {
    const analyzed = records.filter((r) => r.color === side);
    return {
      side,
      name: side === color ? 'You' : opponent,
      accuracy: analyzed.length
        ? (analyzed.reduce((sum, r) => sum + r.accuracy, 0) / analyzed.length).toFixed(1)
        : '—',
      counts: Object.fromEntries(
        qualityKeys.map((quality) => [
          quality,
          analyzed.filter((r) => r.quality === quality).length,
        ]),
      ),
    };
  });
  const rows: { number: string; w?: number; b?: number }[] = [];
  moves.forEach((move, index) => {
    const number = move.before.split(' ')[5];
    let row = rows.at(-1);
    if (!row || row.number !== number) {
      row = { number };
      rows.push(row);
    }
    row[move.color] = index;
  });
  return (
    <div className="review-content">
      {hidden ? (
        <div className="review-locked">
          <LockKeyhole size={28} />
          <h2>Review after the game</h2>
          <p>
            Keep playing in Challenge mode. Your move grades and accuracy unlock when the game ends.
          </p>
        </div>
      ) : (
        <>
          <div className="accuracy-duel">
            {players.map((player) => (
              <div className="accuracy-player" key={player.side}>
                <div className="accuracy-name">
                  <span className="accuracy-piece">
                    <Piece type="k" color={player.side} set={pieces} />
                  </span>
                  <b>{player.name}</b>
                </div>
                <strong className={`accuracy-score score-${player.side}`}>{player.accuracy}</strong>
                <span>{player.side === color ? 'Your accuracy' : 'Bot accuracy'}</span>
              </div>
            ))}
          </div>
          <div className="review-progress" role="status">
            {reviewState === 'error' ? (
              <>
                <span>Analysis paused · moves are saved</span>
                <button className="text-button" onClick={onRetry} title={reviewError}>
                  <RotateCcw size={13} /> Retry
                </button>
              </>
            ) : pending > 0 ? (
              <>
                <LoaderCircle size={14} className="spin" />
                <span>
                  Analyzing {pending} {pending === 1 ? 'move' : 'moves'}… keep playing
                </span>
              </>
            ) : (
              <>
                <span className="status-dot ready" />
                <span>{moves.length ? 'Analysis up to date' : 'Ready for your first move'}</span>
              </>
            )}
          </div>
          <div className="review-view-tabs" role="tablist" aria-label="Review views">
            <button
              role="tab"
              aria-selected={view === 'overview'}
              className={view === 'overview' ? 'active' : ''}
              onClick={() => setView('overview')}
            >
              Overview
            </button>
            <button
              role="tab"
              aria-selected={view === 'moves'}
              className={view === 'moves' ? 'active' : ''}
              onClick={() => setView('moves')}
            >
              Move by move
            </button>
          </div>
          {view === 'overview' ? (
            <div className="review-overview">
              <div className="classification-head">
                <span>White</span>
                <span>Move quality</span>
                <span>Black</span>
              </div>
              <div className="quality-breakdown">
                {qualityKeys.map((quality) => (
                  <div className={`quality-count-row grade-${quality}`} key={quality}>
                    <strong
                      aria-label={`White ${QUALITIES[quality].label}: ${players[0].counts[quality]}`}
                    >
                      {players[0].counts[quality]}
                    </strong>
                    <span>
                      <QualityBadge quality={quality} size="sm" />
                      <b>{QUALITIES[quality].label}</b>
                    </span>
                    <strong
                      aria-label={`Black ${QUALITIES[quality].label}: ${players[1].counts[quality]}`}
                    >
                      {players[1].counts[quality]}
                    </strong>
                  </div>
                ))}
              </div>
              <EvaluationChart
                records={records}
                cursor={cursor}
                onSelect={(ply) => {
                  onSelect(ply);
                  setView('moves');
                }}
              />
              <button
                className="button primary full-width"
                disabled={!moves.length}
                onClick={() => {
                  setView('moves');
                  onSelect(1);
                }}
              >
                Review moves <ArrowRight size={18} />
              </button>
              <p className="review-method-note">
                Accuracy and grades are OpenChess estimates from engine analysis.
              </p>
            </div>
          ) : (
            <div className="move-coach" aria-live="polite">
              {selected ? (
                <>
                  <div className={`coach-move-title grade-${selected.quality}`}>
                    <QualityBadge quality={selected.quality} size="lg" />
                    <div>
                      <h2>
                        <span>{selected.san}</span>{' '}
                        <span className="grade-label">{QUALITIES[selected.quality].label}</span>
                      </h2>
                      <p>
                        {selected.color === color
                          ? cursor === null
                            ? 'Your last move'
                            : 'Your move'
                          : `${opponent}’s move`}{' '}
                        · move {selectedMove?.before.split(' ')[5]}
                      </p>
                    </div>
                    <span className="score-chip">
                      {Math.abs(selected.cp) >= 9000
                        ? 'Mate'
                        : `${selected.cp >= 0 ? '+' : ''}${(selected.cp / 100).toFixed(1)}`}
                    </span>
                  </div>
                  <p className="coach-explanation">{selected.explanation}</p>
                  <div className="best-move-line">
                    <span>
                      Best move <strong>{selected.bestSan}</strong>
                    </span>
                    <span className="engine-depth">Depth {selected.depth}</span>
                  </div>
                  <p className="continuation-line">{selected.line.join('  ') || 'Game over'}</p>
                </>
              ) : (
                <div className="coach-waiting">
                  {selectedMove ? (
                    <>
                      <LoaderCircle size={23} className={reviewState === 'error' ? '' : 'spin'} />
                      <div>
                        <b>
                          {selectedMove.san} —{' '}
                          {reviewState === 'error' ? 'review paused' : 'analyzing'}
                        </b>
                        <p>The move is on the board. Its grade appears when analysis finishes.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <BarChart3 size={26} />
                      <div>
                        <b>{cursor === 0 ? 'Starting position' : 'Every move, explained'}</b>
                        <p>
                          {cursor === 0
                            ? 'Step forward to review the first move.'
                            : 'Make a move to see its grade, explanation, and best alternative here.'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {(hidden || view === 'moves') && (
        <>
          <div className="moves-heading">
            <h3>
              Moves <span>{moves.length}</span>
            </h3>
            <button
              className="icon-button"
              aria-label="Download PGN"
              onClick={onExport}
              disabled={!moves.length}
            >
              <ArrowDownToLine size={17} />
            </button>
          </div>
          <div className="move-table" aria-label="Move history">
            {rows.length ? (
              rows.map((row) => (
                <div className="move-row" key={row.number}>
                  <span>{row.number}.</span>
                  {(['w', 'b'] as const).map((side) => {
                    const index = row[side];
                    if (index === undefined) return <span key={side} />;
                    const move = moves[index];
                    const record = records[index];
                    return (
                      <button
                        key={side}
                        className={selectedPly === index + 1 ? 'active' : ''}
                        onClick={() => onSelect(index + 1)}
                        aria-label={`Review ${side === 'w' ? 'White' : 'Black'} move ${move.san}`}
                        aria-current={selectedPly === index + 1 ? 'step' : undefined}
                      >
                        <span className="move-san">
                          <span className="notation-piece">
                            <Piece type={move.piece} color={side} set={pieces} />
                          </span>
                          <b>{move.san}</b>
                        </span>
                        {!hidden &&
                          (record ? (
                            <QualityBadge quality={record.quality} size="sm" />
                          ) : (
                            <LoaderCircle
                              size={13}
                              className={reviewState === 'error' ? '' : 'spin'}
                              aria-label="Analysis pending"
                            />
                          ))}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <p className="empty-moves">Your moves will appear here.</p>
            )}
          </div>
          <div className="history-controls">
            <button
              className="icon-button"
              aria-label="First position"
              disabled={!moves.length}
              onClick={() => onSelect(0)}
            >
              <ChevronsLeft size={22} />
            </button>
            <button
              className="icon-button"
              aria-label="Previous move"
              disabled={selectedPly === 0 || !moves.length}
              onClick={() => onSelect(Math.max(0, selectedPly - 1))}
            >
              <ChevronLeft size={22} />
            </button>
            <button className="text-button" onClick={() => onSelect(null)} disabled={!moves.length}>
              {cursor === null ? 'Live position' : `${selectedPly} / ${moves.length} · Go live`}
            </button>
            <button
              className="icon-button"
              aria-label="Next move"
              disabled={selectedPly >= moves.length}
              onClick={() => onSelect(Math.min(moves.length, selectedPly + 1))}
            >
              <ChevronRight size={22} />
            </button>
            <button
              className="icon-button"
              aria-label="Last position"
              disabled={!moves.length}
              onClick={() => onSelect(null)}
            >
              <ChevronsRight size={22} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
export function QualityGuide() {
  return (
    <div className="quality-guide">
      {(Object.entries(QUALITIES) as [Quality, (typeof QUALITIES)[Quality]][]).map(
        ([key, value]) => (
          <div key={key}>
            <QualityBadge quality={key} />
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
