import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { Chess, playUci, reviewMove } from '@open-chess/chess-core';
import { StockfishEngine } from './stockfish';
const require = createRequire(new URL('../../package.json', import.meta.url));
const enginePath = require('stockfish').findEngine('lite-single');
class NodeWorker {
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  child: ChildProcessWithoutNullStreams;
  constructor() {
    this.child = spawn(process.execPath, [enginePath]);
    createInterface({ input: this.child.stdout }).on('line', (line) =>
      this.onmessage?.({ data: line }),
    );
    this.child.on('error', () => this.onerror?.());
  }
  postMessage(command: string) {
    this.child.stdin.write(command + '\n');
  }
  terminate() {
    this.child.kill();
  }
}
let engine: StockfishEngine;
beforeEach(() => {
  vi.stubGlobal('Worker', NodeWorker);
  engine = new StockfishEngine();
});
afterEach(() => {
  engine.dispose();
  vi.unstubAllGlobals();
});
describe('real Stockfish WASM integration via UCI transport', () => {
  it('initializes and returns legal candidate moves', async () => {
    await engine.initialize();
    const g = new Chess();
    const e = await engine.search(g.fen(), { time: 300, multiPV: 3 });
    expect(e.lines.length).toBe(3);
    expect(e.depth).toBeGreaterThan(0);
    expect(() => playUci(g, e.bestMove)).not.toThrow();
  });
  it('normalizes scores to White and finds Black’s mate', async () => {
    const g = new Chess();
    ['f3', 'e5', 'g4'].forEach((m) => g.move(m));
    const e = await engine.search(g.fen(), { time: 500 });
    expect(e.bestMove).toBe('d8h4');
    expect(e.cp).toBeLessThan(-9000);
    playUci(g, e.bestMove);
    expect(g.isCheckmate()).toBe(true);
  });
  it('serializes independent searches without mixing results', async () => {
    const white = new Chess('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1');
    const black = new Chess();
    black.move('e4');
    const [a, b] = await Promise.all([
      engine.search(white.fen(), { time: 150 }),
      engine.search(black.fen(), { time: 150 }),
    ]);
    expect(a.bestMove).toBe('a1a8');
    expect(() => playUci(black, b.bestMove)).not.toThrow();
    expect(b.lines.every((l) => l.pv[0] === l.move)).toBe(true);
  });
  it('keeps gameplay available when the separate review worker is stopped', async () => {
    const reviewEngine = new StockfishEngine();
    try {
      await Promise.all([engine.initialize(), reviewEngine.initialize()]);
      const game = new Chess();
      game.move('e4');
      const reply = engine.search(game.fen(), { time: 200 });
      reviewEngine.dispose();
      const evaluation = await reply;
      expect(() => playUci(game, evaluation.bestMove)).not.toThrow();
      expect(game.turn()).toBe('w');
    } finally {
      reviewEngine.dispose();
    }
  });
  it('treats checkmate and stalemate as terminal without stale moves', async () => {
    const mate = await engine.search('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1');
    expect(mate.cp).toBe(10000);
    expect(mate.bestMove).toBe('');
    const draw = await engine.search('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(draw.cp).toBe(0);
  });
  it('recognizes a sound queen sacrifice that creates a forced smothered mate', async () => {
    const g = new Chess('r4r1k/6pp/4Q2N/q7/8/8/5PPP/6K1 w - - 0 1');
    const before = await engine.search(g.fen(), { time: 1800, multiPV: 3, depth: 18 });
    const move = g.move('Qg8+');
    const after = await engine.search(g.fen(), { time: 1200, multiPV: 2, depth: 18 });
    const review = reviewMove(move, before, after, 1);
    expect(before.bestMove).toBe('e6g8');
    expect(after.cp).toBeGreaterThan(9000);
    expect(review.quality).toBe('brilliant');
  });
});
