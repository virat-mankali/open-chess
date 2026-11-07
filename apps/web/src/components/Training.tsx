import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Chess, EXERCISES, LESSONS, type Exercise, type Square } from '@open-chess/chess-core';
import { playChessSound } from '../audio/chessAudio';
import { Board } from './Board';
import type { Preferences } from '../storage/local';

function ExerciseBoard({
  exercise,
  preferences,
  onComplete,
}: {
  exercise: Exercise;
  preferences: Preferences;
  onComplete: () => void;
}) {
  const [fen, setFen] = useState(exercise.fen);
  const [message, setMessage] = useState('');
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState(false);
  function attempt(from: Square, to: Square, promotion = 'q') {
    const game = new Chess(fen);
    let move;
    try {
      move = game.move({ from, to, promotion });
    } catch {
      return;
    }
    if (from + to + (move.promotion || '') === exercise.solution) {
      playChessSound('finish', preferences.sound, preferences.soundVolume);
      setFen(game.fen());
      setSolved(true);
      setMessage(exercise.explanation);
      onComplete();
    } else {
      playChessSound('retry', preferences.sound, preferences.soundVolume);
      setMessage('Not quite. Look for a move that matches the goal, and try again.');
    }
  }
  return (
    <div className="training-workspace">
      <div className="training-board">
        <Board
          fen={fen}
          orientation="w"
          disabled={solved}
          onMove={attempt}
          preferences={preferences}
          hint={hint ? exercise.solution : null}
        />
      </div>
      <div className="exercise-detail">
        <span className="eyebrow">{exercise.theme}</span>
        <h2>{exercise.title}</h2>
        <p>{exercise.description}</p>
        <div className="turn-chip">
          <span className="white-dot" />
          White to move
        </div>
        {message && (
          <div className={`exercise-message ${solved ? 'solved' : ''}`} role="status">
            {solved && <CheckCircle2 size={24} />}
            <p>{message}</p>
          </div>
        )}
        {hint && !solved && <p className="hint-text">{exercise.hint}</p>}
        <div className="exercise-actions">
          <button className="button secondary" disabled={solved} onClick={() => setHint(true)}>
            <Lightbulb size={17} />A little hint
          </button>
          <button
            className="icon-button"
            aria-label="Reset exercise"
            onClick={() => {
              setFen(exercise.fen);
              setSolved(false);
              setMessage('');
              setHint(false);
            }}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
export function Training({
  kind,
  preferences,
  completed,
  onComplete,
}: {
  kind: 'learn' | 'puzzles';
  preferences: Preferences;
  completed: string[];
  onComplete: (id: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const lesson = LESSONS.find((l) => l.id === selected);
  const exercise = EXERCISES.find((e) => e.id === (kind === 'learn' ? lesson?.exercise : selected));
  if (exercise)
    return (
      <section className="training-page">
        <button className="text-button back-link" onClick={() => setSelected(null)}>
          <ArrowLeft size={16} />
          Back to {kind === 'learn' ? 'lessons' : 'puzzles'}
        </button>
        {lesson && (
          <div className="lesson-reading">
            <span className="eyebrow">
              LESSON {LESSONS.indexOf(lesson) + 1} · {lesson.minutes} MIN READ
            </span>
            <h1>{lesson.title}</h1>
            {lesson.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        )}
        <ExerciseBoard
          key={exercise.id}
          exercise={exercise}
          preferences={preferences}
          onComplete={() =>
            onComplete(kind === 'learn' ? `lesson:${lesson!.id}` : `puzzle:${exercise.id}`)
          }
        />
      </section>
    );
  return (
    <section>
      <div className="page-intro">
        <span className="eyebrow">
          {kind === 'learn'
            ? 'SMALL LESSONS. LASTING PROGRESS.'
            : 'A LITTLE CHALLENGE GOES A LONG WAY.'}
        </span>
        <h1>
          {kind === 'learn' ? 'Build your chess intuition.' : 'Find the idea. Make the move.'}
        </h1>
        <p>
          {kind === 'learn'
            ? 'From your first knight move to your first checkmate. Learn it, then try it on the board.'
            : 'Original tactical exercises to help you see the board a little differently.'}
        </p>
      </div>
      <div className="learning-summary">
        <span className="sparkle-tile">{kind === 'learn' ? <BookOpen /> : <Sparkles />}</span>
        <div>
          <h3>
            {completed.filter((x) => x.startsWith(kind === 'learn' ? 'lesson:' : 'puzzle:')).length}{' '}
            of {kind === 'learn' ? LESSONS.length : EXERCISES.length} completed
          </h3>
          <p>Progress is saved on this browser. There’s no rush.</p>
        </div>
      </div>
      <div className="lesson-grid">
        {kind === 'learn'
          ? LESSONS.map((l, i) => (
              <button className="lesson-card" key={l.id} onClick={() => setSelected(l.id)}>
                <div className={`lesson-art lesson-art-${i}`}>
                  <span>{l.icon}</span>
                  <i>{String(i + 1).padStart(2, '0')}</i>
                </div>
                <div className="lesson-card-body">
                  <span className="eyebrow">{l.minutes} MIN · BEGINNER</span>
                  <h2>{l.title}</h2>
                  <p>{l.subtitle}</p>
                  <div>
                    <span>
                      {completed.includes(`lesson:${l.id}`) ? 'Practice again' : 'Start lesson'}
                    </span>
                    {completed.includes(`lesson:${l.id}`) ? (
                      <Check size={19} />
                    ) : (
                      <ArrowRight size={19} />
                    )}
                  </div>
                </div>
              </button>
            ))
          : EXERCISES.map((e, i) => (
              <button className="puzzle-card" key={e.id} onClick={() => setSelected(e.id)}>
                <span className={`puzzle-number puzzle-color-${i % 3}`}>
                  {completed.includes(`puzzle:${e.id}`) ? (
                    <Check />
                  ) : (
                    String(i + 1).padStart(2, '0')
                  )}
                </span>
                <span className="eyebrow">
                  {e.difficulty} · {e.theme}
                </span>
                <h2>{e.title}</h2>
                <p>{e.description}</p>
                <span className="puzzle-link">
                  {completed.includes(`puzzle:${e.id}`) ? 'Solve again' : 'Find the move'}
                  <ArrowRight size={18} />
                </span>
              </button>
            ))}
      </div>
    </section>
  );
}
