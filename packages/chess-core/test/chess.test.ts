import { describe, it, expect } from 'vitest';
import {
  Chess,
  BOTS,
  EXERCISES,
  playUci,
  uci,
  gameOutcome,
  chooseBotMove,
  botSettings,
  expectedPoints,
  classifyQuality,
  exchangeGain,
  isSoundSacrifice,
  reviewMove,
  lineToSan,
  type Evaluation,
} from '../src';

function evaluation(cp: number, move = 'e2e4', second = -50): Evaluation {
  return {
    bestMove: move,
    cp,
    depth: 12,
    lines: [
      { move, cp, pv: [move], depth: 12 },
      { move: 'd2d4', cp: second, pv: ['d2d4'], depth: 12 },
    ],
  };
}
describe('legal chess and history', () => {
  it('allows legal moves and rejects moving through pieces', () => {
    const g = new Chess();
    expect(g.moves()).toHaveLength(20);
    expect(() => g.move('e5')).toThrow();
    expect(g.fen()).toEqual(new Chess().fen());
  });
  it('handles castling and moves the rook', () => {
    const g = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    g.move('O-O');
    expect(g.get('g1')?.type).toBe('k');
    expect(g.get('f1')?.type).toBe('r');
  });
  it('handles en passant and a takeback', () => {
    const g = new Chess();
    ['e4', 'a6', 'e5', 'd5'].forEach((m) => g.move(m));
    const fen = g.fen();
    g.move('exd6');
    expect(g.get('d5')).toBeUndefined();
    expect(g.get('d6')?.color).toBe('w');
    g.undo();
    expect(g.fen()).toBe(fen);
  });
  it.each(['q', 'r', 'b', 'n'])('permits promotion to %s', (promotion) => {
    const g = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
    playUci(g, 'a7a8' + promotion);
    expect(g.get('a8')?.type).toBe(promotion);
  });
  it('recognizes checkmate', () => {
    const g = new Chess();
    ['f3', 'e5', 'g4', 'Qh4#'].forEach((m) => g.move(m));
    expect(gameOutcome(g)).toBe('Black wins by checkmate');
  });
  it('recognizes stalemate', () => {
    expect(gameOutcome(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'))).toBe('Draw by stalemate');
  });
  it('preserves threefold repetition after PGN roundtrip', () => {
    const g = new Chess();
    ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8'].forEach((m) => g.move(m));
    const restored = new Chess();
    restored.loadPgn(g.pgn());
    expect(gameOutcome(restored)).toBe('Draw by repetition');
  });
  it('handles insufficient material', () =>
    expect(gameOutcome(new Chess('7k/8/8/8/8/8/8/K7 w - - 0 1'))).toBe(
      'Draw by insufficient material',
    ));
  it('formats engine lines in algebraic notation', () =>
    expect(lineToSan(new Chess().fen(), ['e2e4', 'e7e5', 'g1f3'])).toEqual(['e4', 'e5', 'Nf3']));
});
describe('coaching grades', () => {
  it('uses symmetric expected outcomes', () => {
    expect(expectedPoints(0)).toBe(0.5);
    expect(expectedPoints(200) + expectedPoints(-200)).toBeCloseTo(1);
  });
  it.each([
    [0.01, 'excellent'],
    [0.03, 'good'],
    [0.07, 'inaccuracy'],
    [0.15, 'mistake'],
    [0.3, 'blunder'],
  ] as const)('grades outcome loss %s as %s', (loss, quality) =>
    expect(classifyQuality(loss, false, false, false)).toBe(quality),
  );
  it('requires an explicit sound sacrifice for brilliance', () => {
    expect(classifyQuality(0, true, false, false)).toBe('best');
    expect(classifyQuality(0.01, true, true, false)).toBe('brilliant');
    expect(classifyQuality(0.15, false, true, false)).toBe('mistake');
  });
  it('reserves great for critical best moves', () => {
    expect(classifyQuality(0, true, false, true)).toBe('great');
    expect(classifyQuality(0.01, false, false, true)).toBe('excellent');
  });
  it('does not award brilliance for normal development', () => {
    const g = new Chess();
    const m = g.move('Nf3');
    expect(
      isSoundSacrifice(m.before, m.after, m, evaluation(30, 'g1f3'), evaluation(25, 'g8f6')),
    ).toBe(false);
  });
  it('does not call winning a queen for a bishop a sacrifice', () => {
    const g = new Chess('6k1/8/4p3/3q4/2B5/8/8/6K1 w - - 0 1');
    const m = g.move('Bxd5');
    expect(exchangeGain(new Chess(m.after), 'd5')).toBe(330);
    expect(
      isSoundSacrifice(m.before, m.after, m, evaluation(0, 'c4d5'), evaluation(0, 'e6d5')),
    ).toBe(false);
  });
  it('detects an actual material offer but rejects it when losing', () => {
    const g = new Chess('6k1/8/3p4/8/4N3/8/8/6K1 w - - 0 1');
    const m = g.move('Nf6+');
    expect(exchangeGain(new Chess(m.after), 'f6')).toBe(0);
    expect(isSoundSacrifice(m.before, m.after, m, evaluation(0), evaluation(-500))).toBe(false);
  });
  it('computes a free queen exchange and rejects a pinned capture', () => {
    const free = new Chess('6k1/8/8/8/3Q4/5n2/8/6K1 b - - 0 1');
    expect(exchangeGain(free, 'd4')).toBe(900);
    const pinned = new Chess('4k3/4n3/3Q4/8/8/8/8/4R1K1 b - - 0 1');
    expect(exchangeGain(pinned, 'd6')).toBe(0);
  });
  it('normalizes evaluation loss for Black', () => {
    const g = new Chess();
    g.move('e4');
    const move = g.move('e5');
    const report = reviewMove(move, evaluation(0, 'e7e5'), evaluation(300, 'g1f3'), 2);
    expect(report.loss).toBeGreaterThan(0.2);
  });
});
describe('bot difficulty', () => {
  it('has distinct original profiles across the requested range', () => {
    expect(new Set(BOTS.map((b) => b.id)).size).toBe(BOTS.length);
    expect(Math.min(...BOTS.map((b) => b.elo))).toBe(250);
    expect(Math.max(...BOTS.map((b) => b.elo))).toBe(2800);
  });
  it('strong presets respect Stockfish’s weakened bestmove, not just PV1', () => {
    const e = evaluation(30, 'd2d4');
    e.lines[0].move = 'e2e4';
    expect(chooseBotMove(e, new Chess().moves({ verbose: true }), 1700, () => 0.9)).toBe('d2d4');
  });
  it('beginners can make intentional legal mistakes', () => {
    const legal = new Chess().moves({ verbose: true });
    const selected = chooseBotMove(evaluation(30), legal, 250, () => 0);
    expect(legal.map(uci)).toContain(selected);
    expect(selected).not.toBe('e2e4');
  });
  it('scales effort and skill with difficulty', () => {
    expect(botSettings(2800).time).toBeGreaterThan(botSettings(250).time);
    expect(botSettings(2800).skill).toBe(20);
  });
});
describe('original training content', () => {
  it.each(EXERCISES)('$id has a legal solution', (e) => {
    const game = new Chess(e.fen);
    expect(() => playUci(game, e.solution)).not.toThrow();
  });
  it.each(EXERCISES.filter((e) => ['back-rank', 'queen-mate', 'rook-mate'].includes(e.id)))(
    '$id really is mate in one',
    (e) => {
      const game = new Chess(e.fen);
      playUci(game, e.solution);
      expect(game.isCheckmate()).toBe(true);
    },
  );
  it('the fork attacks both king and queen', () => {
    const e = EXERCISES.find((e) => e.id === 'fork')!;
    const g = new Chess(e.fen);
    playUci(g, e.solution);
    expect(g.isCheck()).toBe(true);
    expect(g.isAttacked('d8', 'w')).toBe(true);
  });
});
