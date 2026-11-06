import { useEffect, useRef, useState } from 'react';
import {
  Chess,
  BOTS,
  botSettings,
  chooseBotMove,
  gameOutcome,
  playUci,
  reviewMove,
  type Bot,
  type Color,
  type MoveRecord,
  type Square,
} from '@open-chess/chess-core';
import { StockfishEngine } from './engine/stockfish';
import { read, write, savedGames, saveGame, type SavedGame } from './storage/local';

type Session = SavedGame & { active: boolean };
function fresh(
  bot: Bot = BOTS[1],
  color: Color = 'w',
  mode: 'coach' | 'challenge' = 'coach',
  elo = bot.elo,
): Session {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    botId: bot.id,
    elo,
    color,
    mode,
    pgn: '',
    records: [],
    result: null,
    active: false,
  };
}
function initial() {
  const id = read<string | null>('active', null);
  const saved = savedGames().find((g) => g.id === id && !g.result);
  return saved ? { ...saved, active: true } : fresh();
}
export function useChessGame(onNotice: (message: string) => void) {
  const [session, setSession] = useState<Session>(initial);
  const sessionRef = useRef(session);
  const game = useRef<Chess | null>(null);
  if (!game.current) {
    game.current = new Chess();
    if (session.pgn) game.current.loadPgn(session.pgn);
  }
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [engineState, setEngineState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [engineVersion, setEngineVersion] = useState(0);
  const engine = useRef<StockfishEngine | null>(null);
  const generation = useRef(0);
  const [hint, setHint] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  function update(next: Session) {
    sessionRef.current = next;
    setSession(next);
    if (next.active || next.records.length) {
      if (!saveGame(next))
        onNotice('Your browser could not save this game. Export the PGN to keep a copy.');
    }
    write('active', next.active ? next.id : null);
  }
  function setWorking(value: boolean) {
    busyRef.current = value;
    setBusy(value);
  }
  async function commitMove(moveUci: string, token: number) {
    const current = game.current!;
    const service = engine.current!;
    const before = await service.search(current.fen(), { time: 500, multiPV: 3 });
    if (token !== generation.current) return false;
    const move = playUci(current, moveUci);
    try {
      const after = await service.search(current.fen(), { time: 450, multiPV: 2 });
      if (token !== generation.current) return false;
      const record = reviewMove(move, before, after, sessionRef.current.records.length + 1);
      const result = gameOutcome(current);
      if (result)
        current.header(
          'Result',
          current.isCheckmate() ? (current.turn() === 'w' ? '0-1' : '1-0') : '1/2-1/2',
        );
      update({
        ...sessionRef.current,
        pgn: current.pgn(),
        records: [...sessionRef.current.records, record],
        result,
        active: !result,
      });
      return true;
    } catch (e) {
      current.undo();
      throw e;
    }
  }
  async function botTurn(token: number) {
    if (
      token !== generation.current ||
      !sessionRef.current.active ||
      game.current!.turn() === sessionRef.current.color ||
      game.current!.isGameOver()
    )
      return;
    const current = game.current!;
    const settings = botSettings(sessionRef.current.elo);
    const evaluation = await engine.current!.search(current.fen(), settings);
    if (token !== generation.current) return;
    const selected = chooseBotMove(
      evaluation,
      current.moves({ verbose: true }),
      sessionRef.current.elo,
    );
    await commitMove(selected, token);
  }
  function handleError(e: unknown) {
    const message = e instanceof Error ? e.message : 'The engine could not finish this move.';
    setError(message);
    setEngineState('error');
    onNotice(message);
  }
  useEffect(() => {
    const service = new StockfishEngine();
    engine.current = service;
    let cancelled = false;
    setEngineState('loading');
    setError('');
    service
      .initialize()
      .then(async () => {
        if (cancelled) return;
        setEngineState('ready');
        if (sessionRef.current.active && game.current!.turn() !== sessionRef.current.color) {
          setWorking(true);
          try {
            await botTurn(generation.current);
          } catch (e) {
            if (!cancelled) handleError(e);
          } finally {
            if (!cancelled) setWorking(false);
          }
        }
      })
      .catch((e) => {
        if (!cancelled) handleError(e);
      });
    return () => {
      cancelled = true;
      generation.current++;
      service.dispose();
    };
    // The engine is intentionally replaced only by an explicit retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineVersion]);
  async function start(bot: Bot, color: Color, mode: 'coach' | 'challenge', elo = bot.elo) {
    if (busyRef.current || engineState !== 'ready') return;
    const token = ++generation.current;
    const next = { ...fresh(bot, color, mode, elo), active: true };
    game.current = new Chess();
    game.current.header(
      'Event',
      'OpenChess bot practice',
      'White',
      color === 'w' ? 'You' : bot.name,
      'Black',
      color === 'b' ? 'You' : bot.name,
      'Date',
      new Date().toISOString().slice(0, 10).replaceAll('-', '.'),
    );
    update({ ...next, pgn: game.current.pgn() });
    setHint(null);
    if (color === 'b') {
      setWorking(true);
      try {
        await botTurn(token);
      } catch (e) {
        handleError(e);
      } finally {
        setWorking(false);
      }
    }
  }
  async function move(from: Square, to: Square, promotion = 'q') {
    if (
      busyRef.current ||
      engineState !== 'ready' ||
      !sessionRef.current.active ||
      game.current!.turn() !== sessionRef.current.color
    )
      return;
    const legal = game
      .current!.moves({ verbose: true })
      .find((m) => m.from === from && m.to === to && (!m.promotion || m.promotion === promotion));
    if (!legal) return;
    const token = generation.current;
    setWorking(true);
    setHint(null);
    try {
      if (await commitMove(from + to + (legal.promotion || ''), token)) await botTurn(token);
    } catch (e) {
      handleError(e);
    } finally {
      if (token === generation.current) setWorking(false);
    }
  }
  function undo() {
    if (
      busyRef.current ||
      !sessionRef.current.active ||
      sessionRef.current.mode !== 'coach' ||
      !game.current!.history().length
    )
      return;
    let count = 0;
    do {
      game.current!.undo();
      count++;
    } while (game.current!.history().length && game.current!.turn() !== sessionRef.current.color);
    update({
      ...sessionRef.current,
      records: sessionRef.current.records.slice(0, -count),
      pgn: game.current!.pgn(),
      result: null,
      active: true,
    });
    setHint(null);
  }
  async function getHint() {
    if (
      busyRef.current ||
      !sessionRef.current.active ||
      sessionRef.current.mode !== 'coach' ||
      engineState !== 'ready'
    )
      return;
    setWorking(true);
    const token = generation.current;
    try {
      const result = await engine.current!.search(game.current!.fen(), { time: 700, multiPV: 1 });
      if (token === generation.current) setHint(result.bestMove);
    } catch (e) {
      handleError(e);
    } finally {
      setWorking(false);
    }
  }
  function resign() {
    if (busyRef.current || !sessionRef.current.active) return;
    game.current!.header('Result', sessionRef.current.color === 'w' ? '0-1' : '1-0');
    update({
      ...sessionRef.current,
      pgn: game.current!.pgn(),
      result: `${sessionRef.current.color === 'w' ? 'Black' : 'White'} wins by resignation`,
      active: false,
    });
  }
  function load(saved: SavedGame) {
    if (busyRef.current) return;
    generation.current++;
    const chess = new Chess();
    chess.loadPgn(saved.pgn);
    game.current = chess;
    const result = saved.result || gameOutcome(chess);
    update({ ...saved, result, active: !result });
    setHint(null);
    if (!result && chess.turn() !== saved.color) setEngineVersion((v) => v + 1);
  }
  function newSetup() {
    if (busyRef.current) return;
    generation.current++;
    game.current = new Chess();
    const next = fresh();
    sessionRef.current = next;
    setSession(next);
    write('active', null);
    setHint(null);
  }
  async function importPgn(text: string) {
    if (busyRef.current || engineState !== 'ready') return false;
    if (text.length > 1000000) {
      onNotice('This PGN is too large. Import one game at a time.');
      return false;
    }
    const imported = new Chess();
    try {
      imported.loadPgn(text);
    } catch {
      onNotice('That PGN could not be read. Check the notation and try again.');
      return false;
    }
    const moves = imported.history({ verbose: true });
    if (!moves.length || moves.length > 500) {
      onNotice('Please import a game containing 1–500 moves.');
      return false;
    }
    const token = ++generation.current;
    setWorking(true);
    setImportProgress(0);
    const records: MoveRecord[] = [];
    try {
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        const before = await engine.current!.search(move.before, { time: 350, multiPV: 3 });
        const after = await engine.current!.search(move.after, { time: 350, multiPV: 2 });
        if (token !== generation.current) return false;
        records.push(reviewMove(move, before, after, i + 1));
        setImportProgress(Math.round(((i + 1) / moves.length) * 100));
      }
      game.current = imported;
      update({
        ...fresh(),
        pgn: imported.pgn(),
        records,
        active: false,
        result: gameOutcome(imported) || 'Imported game',
      });
      return true;
    } catch (e) {
      handleError(e);
      return false;
    } finally {
      setWorking(false);
      setImportProgress(null);
    }
  }
  return {
    game: game.current!,
    session,
    busy,
    engineState,
    error,
    hint,
    importProgress,
    start,
    move,
    undo,
    getHint,
    resign,
    load,
    newSetup,
    importPgn,
    retry: () => {
      setWorking(false);
      setEngineVersion((v) => v + 1);
    },
  };
}
