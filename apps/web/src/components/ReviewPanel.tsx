import { useEffect, useRef, useState } from 'react';
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
  Lightbulb,
  Star,
  Sparkles,
  Play,
  Pause,
} from 'lucide-react';
import {
  QUALITIES,
  type MoveRecord,
  type Color,
  type Quality,
  type Move,
  type ReviewIdea,
} from '@open-chess/chess-core';
import { Piece } from './Artwork';
import { CoachPortrait } from './CoachPortrait';
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
        preserveAspectRatio="none"
        role="img"
        aria-label="Game evaluation. Above the center favors White; below favors Black."
      >
        <path d="M0 0H340V96H0Z" fill="#44423e" />
        <path d={`${path} L 340 96 L 0 96 Z`} fill="#e8e7e3" />
        <path d="M0 48H340" stroke="#8c8983" strokeDasharray="3 4" />
        <path d={path} fill="none" stroke="#b9b6ae" strokeWidth="1.5" />
        {records.map((record, index) => (
          <circle
            key={record.ply}
            className={`grade-${record.quality}`}
            cx={((index + 1) / records.length) * 340}
            cy={48 - (Math.max(-600, Math.min(600, record.cp)) / 600) * 40}
            r="2.8"
            fill="var(--grade-text)"
          />
        ))}
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
        <span>{records.length} half-moves analyzed</span>
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
  coachPly,
  idea,
  showingBest,
  showingIdea,
  onShowBest,
  onShowIdea,
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
  coachPly: number;
  idea: ReviewIdea | null;
  showingBest: boolean;
  showingIdea: boolean;
  onShowBest: () => void;
  onShowIdea: () => void;
}) {
  const [view, setView] = useState<'overview' | 'moves'>('moves');
  const [explained, setExplained] = useState(false);
  const [playing, setPlaying] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const selectedPly = cursor ?? moves.length;
  const selected = records[coachPly - 1];
  const selectedMove = moves[coachPly - 1];
  const hidden = challenge && !finished;
  const pending = moves.length - records.length;
  useEffect(() => {
    setExplained(false);
  }, [selectedMove?.after]);
  useEffect(() => {
    tableRef.current
      ?.querySelector('[aria-current="step"]')
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedPly, view]);
  useEffect(() => {
    if (!playing) return;
    if (selectedPly >= moves.length || view !== 'moves') {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => onSelect(selectedPly + 1), 1400);
    return () => clearTimeout(timer);
  }, [playing, selectedPly, moves.length, onSelect, view]);
  function select(ply: number | null) {
    setPlaying(false);
    onSelect(ply);
  }
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
  const grade =
    selected &&
    {
      best: 'best',
      great: 'a great move',
      good: 'good',
      brilliant: 'brilliant',
      excellent: 'excellent',
      inaccuracy: 'an inaccuracy',
      mistake: 'a mistake',
      blunder: 'a blunder',
    }[selected.quality];
  return (
    <div className={`review-content ${finished ? '' : 'review-compact'}`}>
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
                    <strong className={`accuracy-score score-${player.side}`}>
                      {player.accuracy}
                    </strong>
                    <span>{player.side === color ? 'Your accuracy' : 'Bot accuracy'}</span>
                  </div>
                ))}
              </div>
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
                    select(ply);
                    setView('moves');
                  }}
                />
                <button
                  className="button primary full-width"
                  disabled={!moves.length}
                  onClick={() => {
                    setView('moves');
                    select(1);
                  }}
                >
                  Review moves <ArrowRight size={18} />
                </button>
                <p className="review-method-note">
                  Accuracy and grades are OpenChess estimates from engine analysis.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="move-coach" aria-live="polite">
                <div className="coach-conversation">
                  {finished && <CoachPortrait />}
                  <div className="coach-bubble">
                    {selected ? (
                      <>
                        <div className={`coach-move-title grade-${selected.quality}`}>
                          <QualityBadge quality={selected.quality} size="sm" />
                          <h2>
                            {selected.san} <span>is {grade}</span>
                          </h2>
                          <span className="score-chip" title="Evaluation from White’s perspective">
                            {Math.abs(selected.cp) >= 9000
                              ? 'Mate'
                              : `${selected.cp >= 0 ? '+' : ''}${(selected.cp / 100).toFixed(2)}`}
                          </span>
                        </div>
                        <p className="coach-move-meta">
                          {selected.color === color
                            ? cursor === null
                              ? 'Your last move'
                              : 'Your move'
                            : `${opponent}’s move`}{' '}
                          · move {selectedMove?.before.split(' ')[5]}
                        </p>
                        {finished && (
                          <p className="coach-explanation">
                            {idea ? idea.description : selected.explanation}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="coach-waiting">
                        {selectedMove ? (
                          <LoaderCircle
                            size={21}
                            className={reviewState === 'error' ? '' : 'spin'}
                          />
                        ) : (
                          <Sparkles size={21} />
                        )}
                        <div>
                          <b>
                            {selectedMove
                              ? `${selectedMove.san} — ${reviewState === 'error' ? 'review paused' : 'analyzing'}`
                              : cursor === 0
                                ? 'Starting position'
                                : finished
                                  ? 'Let’s look at your game'
                                  : 'Ready to play'}
                          </b>
                          {finished && (
                            <p>
                              {selectedMove
                                ? 'Your move is saved. Its grade and ideas will appear here shortly.'
                                : cursor === 0
                                  ? 'Step forward to explore the first move.'
                                  : 'Play a move or import a game to discover the ideas behind every decision.'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {selected && idea && (
                  <div className="idea-caption">
                    <span className="idea-dot" />
                    <span>
                      {idea.timing === 'plan' ? 'Possible plan' : 'Fork on the board'} ·{' '}
                      <b>{idea.san}</b>
                    </span>
                    <button onClick={onShowIdea} aria-pressed={showingIdea}>
                      {showingIdea ? 'Hide arrows' : 'Show idea'}
                    </button>
                  </div>
                )}
                {explained && selected && (
                  <div className="coach-detail">
                    {!finished && idea && <p>{idea.description}</p>}
                    <p>{selected.explanation}</p>
                    <div className="best-move-line">
                      <span>
                        Engine choice <strong>{selected.bestSan}</strong>
                      </span>
                      <span className="engine-depth">Depth {selected.depth}</span>
                    </div>
                    <p className="continuation-line">{selected.line.join('  ') || 'Game over'}</p>
                  </div>
                )}
              </div>
              <div className="review-actions">
                <button
                  className={`review-action ${explained ? 'active' : ''}`}
                  disabled={!selected}
                  onClick={() => setExplained((value) => !value)}
                  aria-expanded={explained}
                >
                  <Lightbulb size={17} /> Explain
                </button>
                <button
                  className={`review-action ${showingBest ? 'active' : ''}`}
                  disabled={!selected || !selected.bestSan}
                  onClick={onShowBest}
                  aria-pressed={showingBest}
                >
                  <Star size={17} /> {showingBest ? 'Played' : 'Best'}
                </button>
                <button
                  className="review-action review-next"
                  disabled={selectedPly >= moves.length}
                  onClick={() => select(selectedPly + 1)}
                >
                  <ArrowRight size={20} /> Next
                </button>
              </div>
            </>
          )}
          {(finished || pending > 0 || reviewState === 'error') && (
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
                  <LoaderCircle size={12} className="spin" />
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
              <ArrowDownToLine size={16} />
            </button>
          </div>
          <div className="move-table" ref={tableRef} aria-label="Move history">
            {rows.length ? (
              rows.map((row) => (
                <div className="move-row" key={row.number}>
                  <span>{row.number}.</span>
                  {(['w', 'b'] as const).map((side) => {
                    const index = row[side];
                    if (index === undefined) return <span key={side} />;
                    const move = moves[index],
                      record = records[index];
                    return (
                      <button
                        key={side}
                        className={`${selectedPly === index + 1 ? 'active' : ''} ${!hidden && record ? `grade-${record.quality}` : ''}`}
                        onClick={() => select(index + 1)}
                        aria-label={`Review ${side === 'w' ? 'White' : 'Black'} move ${move.san}`}
                        aria-current={selectedPly === index + 1 ? 'step' : undefined}
                      >
                        <span className="move-quality-slot">
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
                        </span>
                        <span className="move-san">
                          <span className="notation-piece">
                            <Piece type={move.piece} color={side} set={pieces} />
                          </span>
                          <b>
                            {move.piece === 'p' || move.san.startsWith('O')
                              ? move.san
                              : move.san.slice(1)}
                          </b>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <p className="empty-moves">Your moves will appear here.</p>
            )}
          </div>
          {!hidden &&
            (finished ? (
              <div className="review-timeline">
                <EvaluationChart records={records} cursor={cursor} onSelect={select} />
              </div>
            ) : (
              <details className="match-evaluation">
                <summary>Evaluation graph</summary>
                <EvaluationChart records={records} cursor={cursor} onSelect={select} />
              </details>
            ))}
          <div className="history-controls">
            <button
              className="icon-button"
              aria-label="First position"
              disabled={!moves.length || selectedPly === 0}
              onClick={() => select(0)}
            >
              <ChevronsLeft size={23} />
            </button>
            <button
              className="icon-button"
              aria-label="Previous move"
              disabled={!moves.length || selectedPly === 0}
              onClick={() => select(Math.max(0, selectedPly - 1))}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="icon-button replay-button"
              aria-label={playing ? 'Pause review' : 'Play review'}
              disabled={!moves.length}
              onClick={() => {
                if (playing) setPlaying(false);
                else {
                  if (selectedPly >= moves.length) onSelect(0);
                  setPlaying(true);
                }
              }}
            >
              {playing ? (
                <Pause size={21} fill="currentColor" />
              ) : (
                <Play size={21} fill="currentColor" />
              )}
            </button>
            <button
              className="icon-button"
              aria-label="Next move"
              disabled={selectedPly >= moves.length}
              onClick={() => select(Math.min(moves.length, selectedPly + 1))}
            >
              <ChevronRight size={24} />
            </button>
            <button
              className="icon-button"
              aria-label="Last position"
              disabled={!moves.length || selectedPly === moves.length}
              onClick={() => select(moves.length)}
            >
              <ChevronsRight size={23} />
            </button>
          </div>
          <div className="review-position-footer">
            <span>
              {selectedPly} / {moves.length} half-moves
            </span>
            <button className="text-button" onClick={() => select(null)} disabled={cursor === null}>
              {cursor === null ? 'Live position' : 'Back to live'}
            </button>
            {finished && <span title="Use left and right arrow keys">← → to navigate</span>}
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
