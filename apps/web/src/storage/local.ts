import { Chess, BOTS, QUALITIES, type MoveRecord, type Color } from '@open-chess/chess-core';
export type SavedGame = {
  id: string;
  date: string;
  botId: string;
  elo: number;
  color: Color;
  pgn: string;
  records: MoveRecord[];
  result: string | null;
  mode: 'coach' | 'challenge';
};
export type Preferences = {
  appearanceVersion: 3;
  sound: boolean;
  targets: boolean;
  coordinates: boolean;
  theme: 'linen' | 'green' | 'walnut' | 'slate';
  pieces: 'sculpted' | 'classic';
};
export const defaults: Preferences = {
  appearanceVersion: 3,
  sound: true,
  targets: true,
  coordinates: true,
  theme: 'linen',
  pieces: 'sculpted',
};
let cachedRaw: string | null = null;
let cachedGames: SavedGame[] = [];
export function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(`openchess.v1.${key}`);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
export function write(key: string, value: unknown) {
  try {
    localStorage.setItem(`openchess.v1.${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function preferences(): Preferences {
  const v = read<Partial<Preferences>>('preferences', {});
  return {
    appearanceVersion: 3,
    sound: typeof v?.sound === 'boolean' ? v.sound : true,
    targets: typeof v?.targets === 'boolean' ? v.targets : true,
    coordinates: typeof v?.coordinates === 'boolean' ? v.coordinates : true,
    // Adopt the reference board once; later explicit board/piece selections persist.
    theme:
      v?.appearanceVersion === 3 && ['linen', 'green', 'walnut', 'slate'].includes(v.theme || '')
        ? v.theme!
        : 'linen',
    pieces: v?.appearanceVersion === 3 && v.pieces === 'classic' ? 'classic' : 'sculpted',
  };
}
export function savedGames(): SavedGame[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem('openchess.v1.games');
  } catch {
    return [];
  }
  if (raw === cachedRaw) return cachedGames;
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : [];
  } catch {
    data = [];
  }
  if (!Array.isArray(data)) data = [];
  cachedRaw = raw;
  cachedGames = (data as unknown[]).slice(0, 50).filter((value): value is SavedGame => {
    try {
      const g = value as SavedGame;
      if (
        !g ||
        typeof g.id !== 'string' ||
        typeof g.date !== 'string' ||
        typeof g.pgn !== 'string' ||
        g.pgn.length > 1000000 ||
        !BOTS.some((b) => b.id === g.botId) ||
        !['w', 'b'].includes(g.color) ||
        !Number.isFinite(g.elo) ||
        !Array.isArray(g.records)
      )
        return false;
      const chess = new Chess();
      chess.loadPgn(g.pgn);
      const moves = chess.history({ verbose: true });
      return (
        g.records.length <= moves.length &&
        g.records.every(
          (r: MoveRecord, i: number) =>
            r &&
            r.ply === i + 1 &&
            r.san === moves[i].san &&
            r.color === moves[i].color &&
            r.before === moves[i].before &&
            r.after === moves[i].after &&
            r.uci === moves[i].from + moves[i].to + (moves[i].promotion || '') &&
            r.quality in QUALITIES &&
            typeof r.explanation === 'string' &&
            typeof r.bestSan === 'string' &&
            Number.isFinite(r.cp) &&
            Number.isFinite(r.depth) &&
            Number.isFinite(r.accuracy) &&
            Array.isArray(r.line) &&
            r.line.every((s) => typeof s === 'string'),
        ) &&
        (g.mode === 'coach' || g.mode === 'challenge') &&
        (g.result === null || typeof g.result === 'string') &&
        Number.isFinite(Date.parse(g.date))
      );
    } catch {
      return false;
    }
  });
  return cachedGames;
}
export function saveGame(game: SavedGame) {
  const games = [game, ...savedGames().filter((g) => g.id !== game.id)].slice(0, 50);
  if (!write('games', games)) return false;
  cachedRaw = JSON.stringify(games);
  cachedGames = games;
  return true;
}
export function progress(): string[] {
  const value = read<unknown>('progress', []);
  return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
}
