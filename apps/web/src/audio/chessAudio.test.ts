// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chess } from '@open-chess/chess-core';
import { soundForMove } from './chessAudio';

describe('chess sound events', () => {
  it('distinguishes moves, ordinary captures, en passant, and castling', () => {
    const game = new Chess();
    expect(soundForMove(game.move('e4'))).toBe('move');
    game.move('d5');
    expect(soundForMove(game.move('exd5'))).toBe('capture');
    const ep = new Chess('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2');
    expect(soundForMove(ep.move('exd6'))).toBe('capture');
    const castle = new Chess('4k3/8/8/8/8/8/8/4K2R w K - 0 1');
    expect(soundForMove(castle.move('O-O'))).toBe('castle');
  });
  it('prioritizes mate and promotion over the ordinary move sound', () => {
    const mate = new Chess();
    ['f3', 'e5', 'g4'].forEach((san) => mate.move(san));
    expect(soundForMove(mate.move('Qh4#'))).toBe('finish');
    const promotion = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
    expect(soundForMove(promotion.move('a8=Q+'))).toBe('promotion');
    const check = new Chess();
    ['e4', 'd6'].forEach((san) => check.move(san));
    expect(soundForMove(check.move('Bb5+'))).toBe('check');
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
async function setupAudio(decode = () => Promise.resolve({ duration: 0.22 })) {
  const sources: {
    stop: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    playbackRate: { value: number };
  }[] = [];
  const gains: { gain: { value: number }; disconnect: ReturnType<typeof vi.fn> }[] = [];
  class Context {
    state = 'running';
    currentTime = 0;
    destination = {};
    decodeAudioData = vi.fn(decode);
    createGain() {
      const gain = { gain: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() };
      gains.push(gain);
      return gain;
    }
    createBufferSource() {
      const source = {
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
        connect: vi.fn((gain) => gain),
        playbackRate: { value: 1 },
        onended: null,
      };
      sources.push(source);
      return source;
    }
  }
  const constructor = vi.fn(function () {
    return new Context();
  });
  const fetchSample = vi.fn(async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  }));
  vi.stubGlobal('AudioContext', constructor);
  vi.stubGlobal('fetch', fetchSample);
  const audio = await import('./chessAudio');
  return { audio, constructor, sources, gains, fetchSample };
}

it('unlocks one context, caches samples, respects volume and mute, and stops active cues', async () => {
  const { audio, constructor, sources, gains, fetchSample } = await setupAudio();
  audio.playChessSound('move', true, 65);
  expect(constructor).not.toHaveBeenCalled();
  audio.unlockChessAudio();
  audio.unlockChessAudio();
  expect(constructor).toHaveBeenCalledTimes(1);
  expect(fetchSample).toHaveBeenCalledTimes(3);
  audio.playChessSound('move', false, 65);
  audio.playChessSound('check', true, 0);
  audio.playChessSound('move', true, NaN);
  expect(sources).toHaveLength(0);
  audio.playChessSound('capture', true, 65);
  await vi.waitFor(() => expect(sources).toHaveLength(1));
  expect(gains[0].gain.value).toBeCloseTo(0.52);
  audio.silenceChessAudio();
  expect(sources[0].stop).toHaveBeenCalledOnce();
  expect(sources[0].disconnect).toHaveBeenCalledOnce();
  expect(gains[0].disconnect).toHaveBeenCalledOnce();
  audio.playChessSound('castle', true, 35);
  await vi.waitFor(() => expect(sources).toHaveLength(3));
  expect(sources[2].start).toHaveBeenCalledWith(0.1);
  expect(fetchSample).toHaveBeenCalledTimes(3);
});

it('does not play a pending decoded sample after muting', async () => {
  let resolve!: (buffer: { duration: number }) => void;
  const decoded = new Promise<{ duration: number }>((done) => {
    resolve = done;
  });
  const { audio, sources } = await setupAudio(() => decoded);
  audio.unlockChessAudio();
  audio.playChessSound('move', true, 65);
  audio.silenceChessAudio();
  resolve({ duration: 0.22 });
  // Flush fetch, decode and playback promise continuations.
  await new Promise((done) => setTimeout(done, 0));
  expect(sources).toHaveLength(0);
});

it('discards a late sound instead of playing it after the move', async () => {
  let now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  const { audio, sources } = await setupAudio();
  audio.unlockChessAudio();
  audio.playChessSound('move', true, 65);
  now = 1000;
  await new Promise((done) => setTimeout(done, 0));
  expect(sources).toHaveLength(0);
  vi.restoreAllMocks();
});

it('quietly handles unavailable sound files', async () => {
  const { audio, sources } = await setupAudio();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('offline');
    }),
  );
  audio.unlockChessAudio();
  audio.playChessSound('check', true, 65);
  await new Promise((done) => setTimeout(done, 0));
  expect(sources).toHaveLength(0);
});
