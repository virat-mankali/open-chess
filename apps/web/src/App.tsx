'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flag,
  FolderHeart,
  GraduationCap,
  Infinity,
  Lightbulb,
  LoaderCircle,
  Menu,
  Puzzle,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  BOTS,
  Chess,
  QUALITIES,
  openingName,
  reviewIdea,
  type Color,
  type ReviewArrow,
} from '@open-chess/chess-core';
import { Board } from './components/Board';
import { Avatar, Piece } from './components/Artwork';
import { QualityBadge } from './components/QualityBadge';
import { QualityGuide, ReviewPanel } from './components/ReviewPanel';
import { Training } from './components/Training';
import { preferences, progress, savedGames, write, type SavedGame } from './storage/local';
import { useChessGame } from './useChessGame';

type Page = 'play' | 'learn' | 'puzzles' | 'review' | 'library';
type Modal = 'settings' | 'guide' | 'resign' | 'new' | 'import' | null;
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close dialog">
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function downloadPgn(pgn: string) {
  const url = URL.createObjectURL(new Blob([pgn], { type: 'application/x-chess-pgn' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `openchess-${new Date().toISOString().slice(0, 10)}.pgn`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function moveSound() {
  try {
    const Audio = window.AudioContext;
    const context = new Audio();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(180, context.currentTime + 0.07);
    gain.gain.setValueAtTime(0.06, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
    oscillator.onended = () => void context.close();
  } catch {
    /* Sound is optional when the browser blocks audio. */
  }
}
export default function App() {
  const [page, setPage] = useState<Page>('play');
  const [prefs, setPrefs] = useState(preferences);
  const [completed, setCompleted] = useState(progress);
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function notify(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 6000);
  }
  const chess = useChessGame(notify);
  const { session, game } = chess;
  const [selectedBot, setSelectedBot] = useState(BOTS[1]);
  const [filter, setFilter] = useState('Beginner');
  const [customElo, setCustomElo] = useState(1500);
  const [side, setSide] = useState<'w' | 'b' | 'random'>('w');
  const [mode, setMode] = useState<'coach' | 'challenge'>('coach');
  const [flipped, setFlipped] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [reviewOverlay, setReviewOverlay] = useState<{
    key: string;
    mode: 'best' | 'hidden';
  } | null>(null);
  const [tab, setTab] = useState<'opponent' | 'review'>('opponent');
  const [modal, setModal] = useState<Modal>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [pgnInput, setPgnInput] = useState('');
  const bot = BOTS.find((b) => b.id === session.botId) || BOTS[1];
  const displayBot = session.active || session.pgn ? bot : selectedBot;
  const moves = game.history({ verbose: true });
  const history = moves.map((move) => move.san);
  const selectedPly = cursor ?? moves.length;
  const currentRecord = session.records[selectedPly - 1];
  const selectedMove = moves[selectedPly - 1];
  const initialFen = moves[0]?.before || new Chess().fen();
  const positionFen =
    cursor === null ? game.fen() : cursor === 0 ? initialFen : selectedMove?.after || game.fen();
  const coachPly =
    cursor === null && session.active
      ? moves.reduce((last, move, index) => (move.color === session.color ? index + 1 : last), 0) ||
        selectedPly
      : selectedPly;
  const coachMove = moves[coachPly - 1];
  const coachRecord = session.records[coachPly - 1];
  const showAnalysis = session.mode === 'coach' || !session.active;
  const idea = useMemo(
    () =>
      coachMove && coachRecord && showAnalysis && tab === 'review' ? reviewIdea(coachMove) : null,
    [coachMove?.after, coachMove?.before, coachRecord, showAnalysis, tab],
  );
  const overlayKey = `${session.id}:${coachMove?.after}`;
  const bestMove = useMemo(() => {
    if (!coachRecord) return null;
    try {
      return new Chess(coachRecord.before).move(coachRecord.bestSan);
    } catch {
      return null;
    }
  }, [coachRecord]);
  const showingBest =
    showAnalysis &&
    tab === 'review' &&
    reviewOverlay?.key === overlayKey &&
    reviewOverlay.mode === 'best' &&
    !!bestMove;
  const showingIdea =
    showAnalysis &&
    tab === 'review' &&
    !!coachRecord &&
    !!idea &&
    positionFen === coachMove?.after &&
    !showingBest &&
    !(reviewOverlay?.key === overlayKey && reviewOverlay.mode === 'hidden');
  const boardFen = showingBest ? coachRecord!.before : positionFen;
  const reviewArrows: ReviewArrow[] =
    showingBest && bestMove
      ? [{ from: bestMove.from, to: bestMove.to, kind: 'move' }]
      : showingIdea
        ? idea!.arrows
        : [];
  function selectPosition(ply: number | null) {
    setReviewOverlay(null);
    setCursor(ply);
  }
  const orientation: Color = flipped ? (session.color === 'w' ? 'b' : 'w') : session.color;
  const currentMove = selectedMove ? { from: selectedMove.from, to: selectedMove.to } : undefined;
  const evaluationRecord = showingBest ? session.records[coachPly - 2] : currentRecord;
  const score = evaluationRecord?.cp ?? 0;
  const latestPlayerRecord = [...session.records].reverse().find((r) => r.color === session.color);
  const prevCount = useRef(moves.length);
  useEffect(() => {
    if (moves.length > prevCount.current && prefs.sound) moveSound();
    prevCount.current = moves.length;
  }, [moves.length, prefs.sound]);
  useEffect(() => {
    write('preferences', prefs);
  }, [prefs]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        modal ||
        !(page === 'play' || page === 'review') ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName)
      )
        return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setReviewOverlay(null);
        setCursor((c) => Math.max(0, (c ?? moves.length) - 1));
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setReviewOverlay(null);
        setCursor((c) => (c === null ? null : Math.min(moves.length, c + 1)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, page, moves.length]);
  function navigate(next: Page) {
    setPage(next);
    setMobileNav(false);
    if (next === 'review') setTab('review');
    else if (next === 'play' && !session.active) setTab('opponent');
  }
  function complete(id: string) {
    const next = [...new Set([...completed, id])];
    setCompleted(next);
    if (!write('progress', next)) notify('Progress could not be saved in this browser.');
  }
  function begin() {
    setCursor(null);
    setFlipped(false);
    setTab('review');
    void chess.start(
      selectedBot,
      side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : side,
      mode,
      selectedBot.id === 'custom' ? customElo : selectedBot.elo,
    );
  }
  function newGame() {
    if (session.active && moves.length) setModal('new');
    else {
      chess.newSetup();
      setCursor(null);
      setTab('opponent');
      setPage('play');
    }
  }
  function loadSaved(saved: SavedGame) {
    chess.load(saved);
    setCursor(null);
    setFlipped(false);
    setTab('review');
    setPage(saved.result ? 'review' : 'play');
  }
  const nav = [
    { id: 'play' as Page, label: 'Play bots', icon: Swords },
    { id: 'learn' as Page, label: 'Learn', icon: GraduationCap },
    { id: 'puzzles' as Page, label: 'Puzzles', icon: Puzzle },
    { id: 'review' as Page, label: 'Game review', icon: TrendingUp },
    { id: 'library' as Page, label: 'My games', icon: FolderHeart },
  ];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
        <a
          className="brand"
          aria-label="OpenChess home"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('play');
          }}
        >
          <svg viewBox="0 0 40 44" aria-hidden="true">
            <path
              d="M7 39h29v-6H11l5-10-11-4L14 1l15 2 8 13v14H20l6-9-4-8-7 9 5 3-7 8"
              fill="currentColor"
            />
            <circle cx="19" cy="11" r="2" fill="var(--sidebar)" />
          </svg>
          <span>
            open<span>chess</span>
          </span>
        </a>

        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-item nav-${n.id} ${page === n.id ? 'active' : ''}`}
              aria-label={n.label}
              aria-current={page === n.id ? 'page' : undefined}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={26} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-new-game">
          <button className="button secondary full-width" disabled={chess.busy} onClick={newGame}>
            <Swords size={18} /> New game
          </button>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" aria-label="Settings" onClick={() => setModal('settings')}>
            <Settings2 size={19} />
            <span>Settings</span>
          </button>
          <button className="nav-item" aria-label="How it works" onClick={() => setModal('guide')}>
            <CircleHelp size={19} />
            <span>How it works</span>
          </button>
          <div className="local-profile">
            <div className="profile-avatar">Y</div>
            <div>
              <strong>Your chess journey</strong>
              <span>Local profile</span>
            </div>
            <ShieldCheck size={16} />
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className={`main-shell ${page === 'play' || page === 'review' ? 'game-page' : ''}`}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={22} />
            </button>
            <span>Your workspace</span>
            <ChevronRight size={14} />
            <b>{nav.find((n) => n.id === page)?.label}</b>
          </div>
          <div className="topbar-right">
            <span className="private-label">
              <ShieldCheck size={14} />
              Just you and the board
            </span>
            <button
              className="icon-button"
              aria-label="Settings"
              onClick={() => setModal('settings')}
            >
              <SlidersHorizontal size={18} />
            </button>
            <span className="profile-avatar small">Y</span>
          </div>
        </header>
        <main>
          {(page === 'play' || page === 'review') && (
            <>
              <div className={`game-layout ${tab === 'review' ? 'review-layout' : ''}`}>
                <section className="board-column" aria-label="Chess game">
                  <div className="player-strip">
                    <div className="player-identity">
                      <Avatar bot={displayBot} size="sm" />
                      <div>
                        <div className="player-name">
                          {displayBot.name}
                          <span className="bot-label">BOT</span>
                          <span className="rating">
                            {session.active || session.pgn
                              ? session.elo
                              : displayBot.id === 'custom'
                                ? customElo
                                : displayBot.elo}
                          </span>
                        </div>
                        <span className="player-caption">
                          {chess.busy
                            ? 'Thinking through the position…'
                            : session.active
                              ? displayBot.style
                              : 'Your next practice partner'}
                        </span>
                      </div>
                    </div>
                    <span className={`clock-chip ${chess.busy ? 'thinking' : ''}`}>
                      {chess.busy ? (
                        <LoaderCircle size={18} className="spin" />
                      ) : (
                        <Infinity size={21} />
                      )}
                    </span>
                  </div>
                  <div className="board-with-eval">
                    {showAnalysis && (
                      <div
                        className="evaluation-bar"
                        aria-label={
                          evaluationRecord
                            ? `Evaluation ${Math.abs(score) >= 9000 ? 'mate' : (score / 100).toFixed(1)} pawns for White`
                            : 'Evaluation pending'
                        }
                      >
                        <div
                          className="eval-white"
                          style={{
                            height: `${Math.max(4, Math.min(96, 50 + score / 12))}%`,
                            ...(orientation === 'b' ? { top: 0, bottom: 'auto' } : {}),
                          }}
                        />
                        <span>
                          {!evaluationRecord
                            ? '—'
                            : Math.abs(score) >= 9000
                              ? 'M'
                              : Math.abs(score / 100).toFixed(1)}
                        </span>
                      </div>
                    )}
                    <Board
                      key={session.id}
                      fen={boardFen}
                      orientation={orientation}
                      disabled={
                        chess.busy ||
                        !session.active ||
                        cursor !== null ||
                        showingBest ||
                        chess.engineState !== 'ready' ||
                        game.turn() !== session.color
                      }
                      onMove={(from, to, promotion) => void chess.move(from, to, promotion)}
                      preferences={prefs}
                      lastMove={showingBest ? undefined : currentMove}
                      hint={showingBest || cursor !== null ? null : chess.hint}
                      arrows={reviewArrows}
                      ideaTargets={showingIdea ? idea!.targets : []}
                      quality={
                        showAnalysis && currentRecord?.after === boardFen
                          ? currentRecord
                          : undefined
                      }
                    />
                  </div>
                  {showingBest && bestMove && (
                    <div className="board-idea-legend best-preview" role="status">
                      <Sparkles size={16} />
                      <span>
                        Before {coachMove.san} · best move <b>{bestMove.san}</b>
                      </span>
                      <button onClick={() => setReviewOverlay(null)}>Back to played move</button>
                    </div>
                  )}
                  {showingIdea && idea && (
                    <div className="board-idea-legend">
                      <span className="idea-dot" />
                      <span>
                        {idea.timing === 'plan'
                          ? 'Possible next-move idea'
                          : 'Two targets under attack'}{' '}
                        · <b>{idea.san}</b>
                      </span>
                      <button onClick={() => setReviewOverlay({ key: overlayKey, mode: 'hidden' })}>
                        Hide arrows
                      </button>
                    </div>
                  )}
                  {showAnalysis && selectedMove && !showingBest && (
                    <div className="board-review-caption" aria-live="polite">
                      {currentRecord ? (
                        <>
                          <QualityBadge quality={currentRecord.quality} size="sm" />
                          <b>{selectedMove.san}</b>
                          <span>{QUALITIES[currentRecord.quality].label}</span>
                        </>
                      ) : (
                        <>
                          <LoaderCircle
                            size={14}
                            className={chess.reviewState === 'error' ? '' : 'spin'}
                          />
                          <b>{selectedMove.san}</b>
                          <span>
                            {chess.reviewState === 'error' ? 'Review paused' : 'Analyzing move…'}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="player-strip bottom-player">
                    <div className="player-identity">
                      <div className="you-avatar">
                        <span>Y</span>
                        <i />
                      </div>
                      <div>
                        <div className="player-name">
                          You
                          <span className="you-tag">
                            {session.color === 'w' ? 'White' : 'Black'}
                          </span>
                        </div>
                        <span className="player-caption">
                          {session.result
                            ? session.result
                            : cursor !== null
                              ? 'Reviewing the position'
                              : session.active
                                ? chess.busy
                                  ? 'A moment to think ahead'
                                  : game.isCheck()
                                    ? 'You’re in check — protect your king!'
                                    : 'Your move. Make it yours.'
                                : 'Ready when you are'}
                        </span>
                      </div>
                    </div>
                    <span className="clock-chip">
                      <Infinity size={21} />
                    </span>
                  </div>
                  <div className="board-toolbar">
                    <div>
                      <button
                        className="tool-button"
                        disabled={
                          chess.busy ||
                          !session.active ||
                          session.mode === 'challenge' ||
                          !moves.length
                        }
                        onClick={() => {
                          chess.undo();
                          setCursor(null);
                        }}
                      >
                        <RotateCcw size={17} />
                        <span>Take back</span>
                      </button>
                      <button
                        className="tool-button hint-button"
                        disabled={
                          chess.busy ||
                          !session.active ||
                          session.mode === 'challenge' ||
                          cursor !== null ||
                          chess.engineState !== 'ready'
                        }
                        onClick={() => void chess.getHint()}
                      >
                        <Lightbulb size={17} />
                        <span>Hint</span>
                      </button>
                    </div>
                    <div>
                      <button
                        className="icon-button"
                        aria-label="Flip board"
                        onClick={() => setFlipped((v) => !v)}
                      >
                        <Shuffle size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={prefs.sound ? 'Mute sound' : 'Enable sound'}
                        onClick={() => setPrefs((p) => ({ ...p, sound: !p.sound }))}
                      >
                        {prefs.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Board settings"
                        onClick={() => setModal('settings')}
                      >
                        <Settings2 size={17} />
                      </button>
                      <span className="toolbar-separator" />
                      <button
                        className="icon-button"
                        aria-label="Resign game"
                        disabled={!session.active || chess.busy}
                        onClick={() => setModal('resign')}
                      >
                        <Flag size={17} />
                      </button>
                    </div>
                  </div>
                  {cursor !== null && (
                    <button className="return-live" onClick={() => selectPosition(null)}>
                      <ArrowLeft size={16} />
                      Return to the current position
                    </button>
                  )}
                  {session.result ? (
                    <div className="result-banner">
                      <Trophy size={25} />
                      <div>
                        <h3>{session.result}</h3>
                        <p>There’s something to learn from every game.</p>
                      </div>
                      <button className="button secondary" disabled={chess.busy} onClick={newGame}>
                        Play again
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="under-board-note">
                      <span className="note-icon">
                        <BookOpen size={19} />
                      </span>
                      <div>
                        <b>{history.length ? openingName(history) : 'Ready to play?'}</b>
                        <p>
                          {history.length
                            ? 'Keep your pieces active, your king safe, and your mind curious.'
                            : 'Choose an opponent and press Play to start your game.'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="board-footer">
                    <span>
                      <span
                        className={`status-dot ${chess.engineState === 'ready' ? 'ready' : ''}`}
                      />
                      {chess.engineState === 'ready'
                        ? 'Stockfish 19 ready'
                        : chess.engineState === 'loading'
                          ? 'Warming up the engine…'
                          : 'Engine needs attention'}
                    </span>
                    <span>Private by design · Saved on this device</span>
                  </div>
                  {chess.engineState === 'error' && (
                    <div className="engine-error" role="alert">
                      <p>{chess.error}</p>
                      <button className="button secondary" onClick={chess.retry}>
                        Retry engine
                      </button>
                    </div>
                  )}
                </section>
                <aside className={`game-panel ${tab === 'review' ? 'review-panel' : ''}`}>
                  <div className="game-panel-heading">
                    {tab === 'review' ? <TrendingUp size={28} /> : <Swords size={28} />}
                    <h1>{tab === 'review' ? 'Game Review' : 'Play Computer'}</h1>
                  </div>
                  <div className="panel-tabs" role="tablist" aria-label="Game panel">
                    <button
                      role="tab"
                      aria-selected={tab === 'opponent'}
                      className={tab === 'opponent' ? 'active' : ''}
                      onClick={() => setTab('opponent')}
                    >
                      <Swords size={17} />
                      {session.active ? 'Your opponent' : 'Choose a bot'}
                    </button>
                    <button
                      role="tab"
                      aria-selected={tab === 'review'}
                      className={tab === 'review' ? 'active' : ''}
                      onClick={() => setTab('review')}
                    >
                      <TrendingUp size={17} />
                      Game review
                      {moves.length > 0 && <span className="tab-count">{moves.length}</span>}
                    </button>
                  </div>
                  {tab === 'review' ? (
                    <ReviewPanel
                      records={session.records}
                      moves={moves}
                      opponent={bot.name}
                      pieces={prefs.pieces}
                      reviewState={chess.reviewState}
                      reviewError={chess.reviewError}
                      onRetry={chess.retryReview}
                      color={session.color}
                      cursor={cursor}
                      onSelect={selectPosition}
                      coachPly={coachPly}
                      idea={idea}
                      showingBest={showingBest}
                      showingIdea={showingIdea}
                      onShowBest={() => {
                        setCursor(coachPly);
                        setReviewOverlay(showingBest ? null : { key: overlayKey, mode: 'best' });
                      }}
                      onShowIdea={() => {
                        setCursor(coachPly);
                        setReviewOverlay(showingIdea ? { key: overlayKey, mode: 'hidden' } : null);
                      }}
                      onExport={() => downloadPgn(session.pgn)}
                      challenge={session.mode === 'challenge'}
                      finished={!session.active}
                    />
                  ) : session.active ? (
                    <div className="active-opponent">
                      <div className="active-bot-portrait">
                        <Avatar bot={bot} size="xl" />
                        <span className="online-indicator" />
                      </div>
                      <span className="eyebrow">YOUR OPPONENT</span>
                      <h2>
                        {bot.name}
                        <span>{session.elo}</span>
                      </h2>
                      <p className="bot-description">{bot.description}</p>
                      <div className="bot-speech">“{bot.greeting}”</div>
                      <div className="game-meta">
                        <span>
                          <Infinity size={16} />
                          No time limit
                        </span>
                        <span>
                          {session.mode === 'coach' ? (
                            <GraduationCap size={16} />
                          ) : (
                            <Target size={16} />
                          )}{' '}
                          {session.mode === 'coach' ? 'Coach mode' : 'Challenge mode'}
                        </span>
                      </div>
                      {latestPlayerRecord && showAnalysis ? (
                        <button
                          className="live-feedback"
                          onClick={() => {
                            setTab('review');
                            setCursor(latestPlayerRecord.ply);
                          }}
                        >
                          <QualityBadge quality={latestPlayerRecord.quality} />
                          <div>
                            <strong>{QUALITIES[latestPlayerRecord.quality].label}</strong>
                            <span>You played {latestPlayerRecord.san}. See why.</span>
                          </div>
                          <ChevronRight size={18} />
                        </button>
                      ) : (
                        <div className="coach-note">
                          <Lightbulb size={23} />
                          <b>
                            {session.mode === 'coach'
                              ? 'Your coach is in your corner.'
                              : 'A challenge, at your level.'}
                          </b>
                          <p>
                            {session.mode === 'coach'
                              ? 'Try an idea, ask for a hint, or take a move back. This is your space to learn.'
                              : 'Play with your own ideas. Your move-by-move review unlocks when the game ends.'}
                          </p>
                        </div>
                      )}
                      <button
                        className="button secondary full-width"
                        disabled={chess.busy}
                        onClick={newGame}
                      >
                        Choose another opponent
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="bot-selector">
                        <div className="panel-heading">
                          <div>
                            <h2>Choose your opponent</h2>
                            <p>Find a bot for your level.</p>
                          </div>
                          <span className="bot-total">12 bots</span>
                        </div>
                        <div className="bot-filters" aria-label="Bot difficulty">
                          {['Beginner', 'Intermediate', 'Advanced', 'Master', 'Custom'].map(
                            (group) => (
                              <button
                                key={group}
                                className={filter === group ? 'active' : ''}
                                onClick={() => {
                                  setFilter(group);
                                  if (group === 'Custom') setSelectedBot(BOTS.at(-1)!);
                                }}
                              >
                                {group}
                              </button>
                            ),
                          )}
                        </div>
                        <div className="bot-grid">
                          {BOTS.filter((b) => b.group === filter).map((b) => (
                            <button
                              className={`bot-card ${selectedBot.id === b.id ? 'selected' : ''}`}
                              key={b.id}
                              onClick={() => setSelectedBot(b)}
                              aria-label={`Select ${b.name}, ${b.elo} Elo`}
                              aria-pressed={selectedBot.id === b.id}
                            >
                              <div className="bot-portrait">
                                <Avatar bot={b} size="lg" />
                                {selectedBot.id === b.id && (
                                  <span className="selected-check">
                                    <Check size={11} />
                                  </span>
                                )}
                              </div>
                              <strong>{b.name}</strong>
                              <span>{b.id === 'custom' ? '250–2800' : b.elo}</span>
                            </button>
                          ))}
                        </div>
                        <div className="selected-bot-info">
                          <div>
                            <h3>
                              {selectedBot.name}
                              <span>
                                {selectedBot.id === 'custom' ? customElo : selectedBot.elo}
                                <small>ELO</small>
                              </span>
                            </h3>
                            <span className="style-tag">{selectedBot.style}</span>
                          </div>
                          <p>{selectedBot.description}</p>
                          {selectedBot.id === 'custom' && (
                            <label className="elo-slider">
                              Target difficulty: {customElo}
                              <input
                                type="range"
                                min="250"
                                max="2800"
                                step="50"
                                value={customElo}
                                onChange={(e) => setCustomElo(Number(e.target.value))}
                              />
                            </label>
                          )}
                        </div>
                        <div className="bot-speech small-speech">“{selectedBot.greeting}”</div>
                      </div>
                      <div className="game-setup">
                        <div className="setup-label">
                          <h3>Play as</h3>
                          <span>White moves first</span>
                        </div>
                        <div className="side-options" role="group" aria-label="Choose your color">
                          <button
                            className={side === 'w' ? 'selected' : ''}
                            onClick={() => setSide('w')}
                            aria-pressed={side === 'w'}
                          >
                            <span className="side-piece">
                              <Piece type="k" color="w" set={prefs.pieces} />
                            </span>
                            White
                          </button>
                          <button
                            className={side === 'random' ? 'selected' : ''}
                            onClick={() => setSide('random')}
                            aria-pressed={side === 'random'}
                          >
                            <Shuffle size={19} />
                            Random
                          </button>
                          <button
                            className={side === 'b' ? 'selected' : ''}
                            onClick={() => setSide('b')}
                            aria-pressed={side === 'b'}
                          >
                            <span className="side-piece">
                              <Piece type="k" color="b" set={prefs.pieces} />
                            </span>
                            Black
                          </button>
                        </div>
                        <div className="setup-label mode-label">
                          <h3>Your experience</h3>
                          <button
                            className="text-button"
                            onClick={() => setModal('guide')}
                            aria-label="About game modes"
                          >
                            <CircleHelp size={14} />
                          </button>
                        </div>
                        <div className="mode-options">
                          <button
                            className={mode === 'coach' ? 'selected' : ''}
                            onClick={() => setMode('coach')}
                            aria-label="Coach mode"
                            aria-pressed={mode === 'coach'}
                          >
                            <GraduationCap size={21} />
                            <span>
                              <strong>Coach</strong>
                              <small>Hints & live feedback</small>
                            </span>
                            <i />
                          </button>
                          <button
                            className={mode === 'challenge' ? 'selected' : ''}
                            onClick={() => setMode('challenge')}
                            aria-label="Challenge mode"
                            aria-pressed={mode === 'challenge'}
                          >
                            <Target size={20} />
                            <span>
                              <strong>Challenge</strong>
                              <small>Trust your instincts</small>
                            </span>
                            <i />
                          </button>
                        </div>
                        <button
                          className="button primary play-button"
                          disabled={chess.engineState !== 'ready' || chess.busy}
                          onClick={begin}
                        >
                          {chess.engineState === 'loading' ? (
                            <LoaderCircle size={19} className="spin" />
                          ) : (
                            <Swords size={20} />
                          )}
                          <span>
                            {chess.engineState === 'loading'
                              ? 'Getting the board ready…'
                              : `Let’s play ${selectedBot.name}`}
                          </span>
                          <ArrowRight size={19} />
                        </button>
                        <span className="setup-footnote">
                          <Infinity size={14} />
                          No clock. No pressure. Just chess.
                        </span>
                      </div>
                    </>
                  )}
                </aside>
              </div>
            </>
          )}
          {(page === 'learn' || page === 'puzzles') && (
            <Training
              key={page}
              kind={page}
              preferences={prefs}
              completed={completed}
              onComplete={complete}
            />
          )}
          {page === 'library' && (
            <section>
              <div className="page-intro library-intro">
                <div>
                  <span className="eyebrow">YOUR JOURNEY, MOVE BY MOVE</span>
                  <h1>Every game belongs here.</h1>
                  <p>
                    Revisit a good idea. Learn from a tough position. Pick up where you left off.
                  </p>
                </div>
                <button
                  className="button secondary"
                  disabled={chess.busy}
                  onClick={() => setModal('import')}
                >
                  <Upload size={17} />
                  Import PGN
                </button>
              </div>
              <Library busy={chess.busy} onLoad={loadSaved} onPlay={() => navigate('play')} />
            </section>
          )}
        </main>
        <footer className="app-footer">
          <span>
            openchess<span className="footer-dot">·</span>A little better. Every move.
          </span>
          <button onClick={() => setModal('guide')}>
            Made for the love of the game
            <CircleHelp size={13} />
          </button>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Dialog
          title={
            modal === 'settings'
              ? 'Board & settings'
              : modal === 'guide'
                ? 'A little guidance goes a long way.'
                : modal === 'import'
                  ? 'Bring a game to the board.'
                  : modal === 'resign'
                    ? 'Call this one a lesson?'
                    : 'A fresh board, a new idea.'
          }
          onClose={() => {
            if (chess.importProgress === null) setModal(null);
          }}
        >
          {modal === 'settings' && (
            <div className="settings-content">
              <h3>Board style</h3>
              <p className="setting-description">
                Choose the textured reference board or a classic color palette.
              </p>
              <div className="theme-options">
                {(['linen', 'green', 'walnut', 'slate'] as const).map((theme) => (
                  <button
                    key={theme}
                    aria-pressed={prefs.theme === theme}
                    className={`theme-option theme-${theme} ${prefs.theme === theme ? 'selected' : ''}`}
                    onClick={() => setPrefs((p) => ({ ...p, theme }))}
                  >
                    <span className="mini-board">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    <b>{theme[0].toUpperCase() + theme.slice(1)}</b>
                    {prefs.theme === theme && <Check size={16} />}
                  </button>
                ))}
              </div>
              <h3>Piece style</h3>
              <p className="setting-description">Change the pieces independently of the board.</p>
              <div className="piece-set-options">
                {(['sculpted', 'classic'] as const).map((pieces) => (
                  <button
                    key={pieces}
                    className={`piece-set-option ${prefs.pieces === pieces ? 'selected' : ''}`}
                    aria-pressed={prefs.pieces === pieces}
                    aria-label={`${pieces === 'sculpted' ? 'Sculpted' : 'Classic'} pieces`}
                    onClick={() => setPrefs((p) => ({ ...p, pieces }))}
                  >
                    <span className="piece-set-preview">
                      <Piece type="n" color="w" set={pieces} />
                      <Piece type="n" color="b" set={pieces} />
                    </span>
                    <b>{pieces === 'sculpted' ? 'Sculpted' : 'Classic'}</b>
                    <small>
                      {pieces === 'sculpted' ? 'From your reference' : 'Traditional outlines'}
                    </small>
                    {prefs.pieces === pieces && <Check size={16} />}
                  </button>
                ))}
              </div>
              {(
                [
                  {
                    key: 'sound',
                    title: 'Move sounds',
                    description: 'A small sound for each move.',
                  },
                  {
                    key: 'targets',
                    title: 'Legal move guides',
                    description: 'See where a selected piece can go.',
                  },
                  {
                    key: 'coordinates',
                    title: 'Board coordinates',
                    description: 'Show file letters and rank numbers.',
                  },
                ] as const
              ).map((setting) => (
                <label className="setting-row" key={setting.key}>
                  <span>
                    <b>{setting.title}</b>
                    <small>{setting.description}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={prefs[setting.key]}
                    onChange={(e) => setPrefs((p) => ({ ...p, [setting.key]: e.target.checked }))}
                  />
                </label>
              ))}
              <p className="settings-note">
                <ShieldCheck size={16} />
                Your preferences and games stay in this browser.
              </p>
            </div>
          )}
          {modal === 'guide' && (
            <div className="guide-content">
              <p>
                Choose a bot, choose your color, and make a move by clicking or dragging a piece.
                You can also Tab to a square and press Enter. Use the arrow keys to step through
                your game.
              </p>
              <div className="guide-modes">
                <div>
                  <GraduationCap />
                  <b>Coach mode</b>
                  <p>
                    Live feedback, hints, evaluation, and takebacks. A welcoming space to
                    experiment.
                  </p>
                </div>
                <div>
                  <Target />
                  <b>Challenge mode</b>
                  <p>Make your own decisions. See the full review after the game ends.</p>
                </div>
              </div>
              <h3>What does my move rating mean?</h3>
              <QualityGuide />
              <h3>Bot difficulty</h3>
              <p>
                250–2800 are approximate difficulty targets. Stockfish’s skill setting, search time,
                candidate selection, and deliberate beginner mistakes shape the challenge. These are
                not calibrated human Elo ratings.
              </p>
              <p className="muted">
                Analysis runs locally with Stockfish 19. No account is needed. Games and learning
                progress are saved only in this browser. Clear browser data and those saves are
                removed; export important games as PGN.
              </p>
              <a
                className="text-link"
                href="/pieces/cburnett/SOURCE.txt"
                target="_blank"
                rel="noreferrer"
              >
                Classic pieces by Colin M. L. Burnett · GPL-2.0+
              </a>
              <br />
              <a className="text-link" href="/engine/COPYING.txt" target="_blank" rel="noreferrer">
                Stockfish GPL license
              </a>
              <span className="muted"> · </span>
              <a
                className="text-link"
                href="https://github.com/nmrugg/stockfish.js/tree/v19.0.1"
                target="_blank"
                rel="noreferrer"
              >
                Engine source
              </a>
            </div>
          )}
          {(modal === 'resign' || modal === 'new') && (
            <div className="confirm-content">
              <p>
                {modal === 'resign'
                  ? 'Your game will be saved so you can review it and learn from every move.'
                  : 'Your current game is saved in My games. You can return to it whenever you like.'}
              </p>
              <div className="dialog-actions">
                <button className="button secondary" onClick={() => setModal(null)}>
                  Keep playing
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    if (modal === 'resign') {
                      chess.resign();
                      setTab('review');
                    } else {
                      chess.newSetup();
                      setTab('opponent');
                      setCursor(null);
                      setPage('play');
                    }
                    setModal(null);
                  }}
                >
                  {modal === 'resign' ? 'Resign & review' : 'Choose a new bot'}
                </button>
              </div>
            </div>
          )}
          {modal === 'import' && (
            <div className="import-content">
              <p>
                Paste the PGN of one game. We’ll analyze every move with Stockfish. Longer games can
                take a few minutes.
              </p>
              <label htmlFor="pgn">Game notation</label>
              <textarea
                id="pgn"
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                placeholder={'[Event "My game"]\n\n1. e4 e5 2. Nf3 Nc6 ...'}
                disabled={chess.busy}
              />
              <label className="file-upload">
                <Upload size={17} />
                Or choose a .pgn file
                <input
                  type="file"
                  accept=".pgn,.txt"
                  disabled={chess.busy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 1000000) {
                        notify('Please choose a PGN smaller than 1 MB.');
                        return;
                      }
                      setPgnInput(await file.text());
                    }
                  }}
                />
              </label>
              {chess.importProgress !== null && (
                <div role="status" className="import-progress">
                  <progress value={chess.importProgress} max="100" />
                  <span>Reviewing moves… {chess.importProgress}%</span>
                </div>
              )}
              <button
                className="button primary full-width"
                disabled={!pgnInput.trim() || chess.busy || chess.engineState !== 'ready'}
                onClick={async () => {
                  if (await chess.importPgn(pgnInput)) {
                    setModal(null);
                    setPage('review');
                    setTab('review');
                    setCursor(null);
                    setPgnInput('');
                  }
                }}
              >
                {chess.busy ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}
                Analyze game
              </button>
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}
function Library({
  busy,
  onLoad,
  onPlay,
}: {
  busy: boolean;
  onLoad: (game: SavedGame) => void;
  onPlay: () => void;
}) {
  const games = savedGames();
  if (!games.length)
    return (
      <div className="empty-library">
        <span className="empty-library-icon">
          <FolderHeart size={42} />
        </span>
        <h2>Your story is still unfolding.</h2>
        <p>
          Play your first game and it will be saved here automatically.
          <br />
          Or import a PGN to explore a game you’ve already played.
        </p>
        <button className="button primary" onClick={onPlay}>
          <Swords size={18} />
          Find an opponent
        </button>
      </div>
    );
  return (
    <div className="game-library">
      {games.map((g) => {
        const bot = BOTS.find((b) => b.id === g.botId) || BOTS[1];
        const position = new Chess();
        position.loadPgn(g.pgn);
        const played = position.history().length;
        return (
          <article className="saved-game" key={g.id}>
            <Avatar bot={bot} size="md" />
            <div className="saved-game-title">
              <h3>
                You vs. {bot.name}
                <span>{g.elo}</span>
              </h3>
              <p>
                {g.result || 'In progress'} · {Math.ceil(played / 2)} moves
              </p>
              <small>
                {new Date(g.date).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                · {g.mode === 'coach' ? 'Coach' : 'Challenge'}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label={`Download game against ${bot.name}`}
              onClick={() => downloadPgn(g.pgn)}
            >
              <ArrowDownToLine size={18} />
            </button>
            <button className="button secondary" disabled={busy} onClick={() => onLoad(g)}>
              {g.result ? 'Review' : 'Resume'}
              <ArrowRight size={16} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
