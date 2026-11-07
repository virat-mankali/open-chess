import { describe, expect, it } from 'vitest';
import { Chess, reviewIdea } from '../src/index';

function lastMove(pgn: string) {
  const game = new Chess();
  game.loadPgn(pgn);
  return game.history({ verbose: true }).at(-1)!;
}

describe('position-based review ideas', () => {
  it('explains the g8–f6 plan after Nc6 without changing the position or calling it forced', () => {
    const move = lastMove('1. e4 e5 2. Qh5 Nc6');
    const after = move.after;
    const idea = reviewIdea(move);
    expect(idea).toMatchObject({ timing: 'plan', san: 'Nf6', targets: ['h5', 'e4'] });
    expect(idea?.arrows).toEqual([
      { from: 'g8', to: 'f6', kind: 'move' },
      { from: 'f6', to: 'h5', kind: 'attack' },
      { from: 'f6', to: 'e4', kind: 'attack' },
    ]);
    expect(idea?.description).toContain('Your opponent moves first');
    expect(move.after).toBe(after);
  });
  it('distinguishes a fork already played from a possible plan', () => {
    const idea = reviewIdea(lastMove('1. e4 e5 2. Qh5 Nc6 3. d3 Nf6'));
    expect(idea).toMatchObject({ timing: 'played', targets: ['h5', 'e4'] });
    expect(idea?.arrows.every((arrow) => arrow.kind === 'attack')).toBe(true);
  });
  it('finds the same pattern for White from a different square', () => {
    const game = new Chess('4k3/8/8/4p3/7q/8/8/K5N1 w - - 0 1');
    const move = game.move('Nf3');
    expect(reviewIdea(move)).toMatchObject({ timing: 'played', san: 'Nf3', targets: ['h4', 'e5'] });
  });
  it('does not invent a fork when the queen has moved away', () => {
    const idea = reviewIdea(lastMove('1. e4 e5 2. Nf3 Nc6'));
    expect(idea?.targets).not.toContain('h5');
    expect(idea?.san).not.toBe('Nf6');
  });
  it('does not suggest moving a knight pinned to its king', () => {
    const game = new Chess('4k1nR/8/8/7Q/4P3/8/8/K7 b - - 0 1');
    const move = game.move('Kd8');
    expect(reviewIdea(move)?.arrows.some((arrow) => arrow.from === 'g8')).not.toBe(true);
  });
  it('rejects a prospective fork that simply hangs the knight', () => {
    const game = new Chess('4k1n1/8/8/4P2Q/4P3/8/8/K7 b - - 0 1');
    const move = game.move('Kd8');
    expect(reviewIdea(move)).toBeNull();
  });
  it('stops suggesting plans at checkmate', () => {
    expect(reviewIdea(lastMove('1. f3 e5 2. g4 Qh4#'))).toBeNull();
  });
  it('does not propose a waiting-turn plan while the opponent is in check', () => {
    expect(reviewIdea(lastMove('1. e4 d6 2. Bb5+'))).toBeNull();
  });
});
