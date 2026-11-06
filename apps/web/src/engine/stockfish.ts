import { Chess, type Evaluation, type Line } from '@open-chess/chess-core';

export class StockfishEngine {
  private worker: Worker;
  private handlers = new Set<(line: string) => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private ready: Promise<void>;
  private fatal: Error | null = null;
  private failureHandlers = new Set<(error: Error) => void>();
  constructor() {
    this.worker = new Worker('/engine/stockfish-19-lite-single.js');
    this.worker.onmessage = (event) =>
      String(event.data)
        .split('\n')
        .forEach((line) => this.handlers.forEach((fn) => fn(line.trim())));
    this.worker.onerror = () =>
      this.fail(new Error('The chess engine could not load. Check your connection and retry.'));
    this.ready = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => this.fail(new Error('The chess engine took too long to load. Please retry.')),
        25000,
      );
      const onFailure = (e: Error) => {
        clearTimeout(timeout);
        this.handlers.delete(onLine);
        reject(e);
      };
      const onLine = (line: string) => {
        if (line === 'uciok') {
          this.send('setoption name Hash value 32');
          this.send('isready');
        }
        if (line === 'readyok') {
          clearTimeout(timeout);
          this.handlers.delete(onLine);
          this.failureHandlers.delete(onFailure);
          resolve();
        }
      };
      this.handlers.add(onLine);
      this.failureHandlers.add(onFailure);
      this.send('uci');
    });
    // A consumer may attach after construction.
    this.ready.catch(() => {});
  }
  private send(command: string) {
    this.worker.postMessage(command);
  }
  private fail(error: Error) {
    if (this.fatal) return;
    this.fatal = error;
    this.worker.terminate();
    this.failureHandlers.forEach((fn) => fn(error));
    this.failureHandlers.clear();
    this.handlers.clear();
  }
  async initialize() {
    await this.ready;
  }
  search(
    fen: string,
    options: { time?: number; multiPV?: number; skill?: number; depth?: number } = {},
  ): Promise<Evaluation> {
    const task = this.queue.then(async () => {
      await this.ready;
      if (this.fatal) throw this.fatal;
      const game = new Chess(fen);
      const sign = game.turn() === 'w' ? 1 : -1;
      if (game.isGameOver())
        return {
          bestMove: '',
          lines: [],
          cp: game.isCheckmate() ? -sign * 10000 : 0,
          mate: game.isCheckmate() ? 0 : undefined,
          depth: 99,
        };
      return new Promise<Evaluation>((resolve, reject) => {
        const lines = new Map<number, Line>();
        const onFail = (e: Error) => {
          cleanup();
          reject(e);
        };
        const timeout = setTimeout(
          () => this.fail(new Error('Engine analysis timed out. Please reload the engine.')),
          Math.max(15000, (options.time ?? 400) * 10),
        );
        const cleanup = () => {
          clearTimeout(timeout);
          this.handlers.delete(onLine);
          this.failureHandlers.delete(onFail);
        };
        const onLine = (line: string) => {
          if (line.startsWith('info ') && line.includes(' pv ') && !line.includes('bound')) {
            const score = line.match(/score (cp|mate) (-?\d+)/);
            const pv = line.split(' pv ')[1]?.trim().split(' ');
            if (!score || !pv?.length) return;
            const mate = score[1] === 'mate' ? Number(score[2]) : undefined;
            const cp =
              (mate !== undefined
                ? Math.sign(mate || 1) * (10000 - Math.min(100, Math.abs(mate)) * 10)
                : Number(score[2])) * sign;
            const depth = Number(line.match(/depth (\d+)/)?.[1] || 0);
            lines.set(Number(line.match(/multipv (\d+)/)?.[1] || 1), {
              move: pv[0],
              cp,
              mate: mate !== undefined ? mate * sign : undefined,
              pv,
              depth,
            });
          }
          if (line.startsWith('bestmove ')) {
            cleanup();
            const ranked = [...lines.entries()].sort((a, b) => a[0] - b[0]).map((x) => x[1]);
            if (!ranked.length) {
              reject(new Error('The engine returned no evaluation. Please retry.'));
              return;
            }
            resolve({
              bestMove: line.split(' ')[1],
              lines: ranked,
              cp: ranked[0].cp,
              mate: ranked[0].mate,
              depth: ranked[0].depth,
            });
          }
        };
        this.handlers.add(onLine);
        this.failureHandlers.add(onFail);
        this.send(`setoption name Skill Level value ${options.skill ?? 20}`);
        this.send(`setoption name MultiPV value ${options.multiPV ?? 3}`);
        this.send(`position fen ${fen}`);
        this.send(`go depth ${options.depth ?? 18} movetime ${options.time ?? 450}`);
      });
    });
    this.queue = task.catch(() => {});
    return task;
  }
  dispose() {
    this.fail(new Error('Engine stopped.'));
  }
}
