// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOTS, Chess, type Evaluation } from '@open-chess/chess-core';
import { useChessGame } from './useChessGame';
import { savedGames, write, type SavedGame } from './storage/local';

const mocks = vi.hoisted(() => ({ instances: [] as { search: ReturnType<typeof vi.fn> }[] }));
function evaluate(fen: string, choice?: string): Evaluation {
  const game = new Chess(fen);
  const moves = game
    .moves({ verbose: true })
    .map((move) => move.from + move.to + (move.promotion || ''));
  const cp = game.isCheckmate() ? (game.turn() === 'w' ? -10000 : 10000) : 0;
  return {
    bestMove: choice || moves[0] || '',
    cp,
    depth: 12,
    lines: moves.slice(0, 4).map((move) => ({ move, cp, depth: 12, pv: [move] })),
  };
}
vi.mock('./engine/stockfish', () => ({
  StockfishEngine: class {
    search = vi.fn(async (fen: string) => evaluate(fen));
    constructor() {
      mocks.instances.push(this);
    }
    async initialize() {}
    dispose() {}
  },
}));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function savePending(sans: string[], color: 'w' | 'b' = 'w') {
  const game = new Chess();
  sans.forEach((san) => game.move(san));
  const saved: SavedGame = {
    id: 'interrupted-game',
    date: new Date().toISOString(),
    botId: 'milo',
    elo: 400,
    color,
    pgn: game.pgn(),
    records: [],
    result: null,
    mode: 'coach',
  };
  write('games', [saved]);
  write('active', saved.id);
  return saved;
}
async function setup() {
  const hook = renderHook(() => useChessGame(vi.fn()));
  await waitFor(() => {
    expect(hook.result.current.engineState).toBe('ready');
    expect(hook.result.current.reviewState).toBe('ready');
  });
  return hook;
}
beforeEach(() => {
  localStorage.clear();
  mocks.instances.length = 0;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('instant gameplay with independent background review', () => {
  it('renders and saves a move synchronously, accepts the bot reply and another turn while review is blocked', async () => {
    const { result } = await setup();
    const bot = deferred<Evaluation>();
    mocks.instances[0].search.mockImplementation(() => bot.promise);
    mocks.instances[1].search.mockImplementation(() => new Promise(() => {}));
    act(() => {
      void result.current.start(BOTS[1], 'w', 'coach');
    });
    act(() => {
      void result.current.move('e2', 'e4');
    });
    expect(result.current.game.get('e4')?.type).toBe('p');
    expect(result.current.game.get('e2')).toBeUndefined();
    expect(result.current.session.pgn).toContain('e4');
    expect(savedGames()[0].pgn).toContain('e4');
    expect(result.current.session.records).toHaveLength(0);
    const fen = result.current.game.fen();
    await act(async () => {
      bot.resolve(evaluate(fen, 'e7e5'));
      await bot.promise;
    });
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.game.history()).toHaveLength(2);
    expect(result.current.pendingReviews).toBe(2);
    mocks.instances[0].search.mockImplementation(() => new Promise(() => {}));
    act(() => {
      void result.current.move('g1', 'f3');
    });
    expect(result.current.game.get('f3')?.type).toBe('n');
    expect(result.current.session.records).toHaveLength(0);
    expect(result.current.game.history()).toHaveLength(3);
  });
  it('keeps accepted moves and allows play after review fails, then retries without replaying a move', async () => {
    const { result } = await setup();
    mocks.instances[1].search.mockRejectedValue(new Error('Review unavailable'));
    act(() => {
      void result.current.start(BOTS[1], 'w', 'coach');
      void result.current.move('e2', 'e4');
    });
    await waitFor(() => {
      expect(result.current.reviewState).toBe('error');
      expect(result.current.busy).toBe(false);
    });
    expect(result.current.engineState).toBe('ready');
    expect(result.current.game.get('e4')?.type).toBe('p');
    const pgn = result.current.session.pgn;
    act(() => result.current.retryReview());
    await waitFor(() => expect(result.current.session.records).toHaveLength(2));
    expect(result.current.session.pgn).toBe(pgn);
    expect(result.current.game.history()).toHaveLength(2);
  });
  it('resumes a saved human move whose analysis and bot response were interrupted', async () => {
    const saved = savePending(['e4']);
    const { result } = await setup();
    await waitFor(() => expect(result.current.session.records).toHaveLength(2));
    expect(result.current.session.id).toBe(saved.id);
    expect(result.current.game.history()[0]).toBe('e4');
    expect(result.current.game.history()).toHaveLength(2);
    expect(result.current.game.turn()).toBe('w');
  });
  it('recovers pending review after reload without changing a completed turn', async () => {
    const saved = savePending(['e4', 'e5']);
    const { result } = await setup();
    await waitFor(() => expect(result.current.session.records).toHaveLength(2));
    expect(result.current.session.pgn).toBe(saved.pgn);
    expect(mocks.instances[0].search).not.toHaveBeenCalled();
  });
  it('discards stale analysis when a turn is taken back', async () => {
    const { result } = await setup();
    const pending = deferred<Evaluation>();
    mocks.instances[1].search.mockImplementationOnce(() => pending.promise);
    act(() => {
      void result.current.start(BOTS[1], 'w', 'coach');
      void result.current.move('e2', 'e4');
    });
    await waitFor(() => expect(result.current.busy).toBe(false));
    await waitFor(() => expect(mocks.instances[1].search).toHaveBeenCalled());
    act(() => result.current.undo());
    await act(async () => {
      pending.resolve(evaluate(new Chess().fen()));
      await pending.promise;
    });
    expect(result.current.session.records).toHaveLength(0);
    expect(result.current.game.history()).toHaveLength(0);
    act(() => {
      void result.current.move('d2', 'd4');
    });
    await waitFor(() => expect(result.current.session.records).toHaveLength(2));
    expect(result.current.session.records[0].san).toBe('d4');
  });
  it('saves checkmate immediately and resumes unfinished review without making another move', async () => {
    savePending(['f3', 'e5', 'g4'], 'b');
    // Pause review before initialization completes.
    const hook = renderHook(() => useChessGame(vi.fn()));
    mocks.instances[1].search.mockImplementation(() => new Promise(() => {}));
    await waitFor(() => expect(hook.result.current.engineState).toBe('ready'));
    act(() => {
      void hook.result.current.move('d8', 'h4');
    });
    expect(hook.result.current.game.isCheckmate()).toBe(true);
    expect(hook.result.current.session.active).toBe(false);
    expect(savedGames()[0].pgn).toContain('Qh4#');
    expect(localStorage.getItem('openchess.v1.active')).toContain('interrupted-game');
    hook.unmount();
    const resumed = await setup();
    await waitFor(() => expect(resumed.result.current.session.records).toHaveLength(4));
    expect(resumed.result.current.session.active).toBe(false);
    expect(resumed.result.current.game.history()).toEqual(['f3', 'e5', 'g4', 'Qh4#']);
    expect(localStorage.getItem('openchess.v1.active')).toBe('null');
  });
});
