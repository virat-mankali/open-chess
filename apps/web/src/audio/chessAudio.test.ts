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
it('reuses a single gesture-unlocked audio context, respects mute, and stops active cues', async () => {
  const sources: { stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
  const param = () => ({
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  class Context {
    state = 'running';
    currentTime = 0;
    sampleRate = 44100;
    destination = {};
    createGain() {
      return { gain: param(), connect: vi.fn(), disconnect: vi.fn() };
    }
    createBuffer(_channels: number, length: number) {
      return { getChannelData: () => new Float32Array(length) };
    }
    createBufferSource() {
      return this.source();
    }
    createOscillator() {
      return { ...this.source(), frequency: param() };
    }
    source() {
      const node = {
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn((gain) => gain),
        disconnect: vi.fn(),
        onended: null,
      };
      sources.push(node);
      return node;
    }
  }
  const constructor = vi.fn(function () {
    return new Context();
  });
  vi.stubGlobal('AudioContext', constructor);
  const audio = await import('./chessAudio');
  audio.playChessSound('move', true, 65);
  expect(constructor).not.toHaveBeenCalled();
  audio.unlockChessAudio();
  audio.unlockChessAudio();
  expect(constructor).toHaveBeenCalledTimes(1);
  audio.playChessSound('move', false, 65);
  audio.playChessSound('check', true, 0);
  expect(sources).toHaveLength(0);
  audio.playChessSound('capture', true, 65);
  expect(sources.length).toBeGreaterThan(0);
  audio.silenceChessAudio();
  expect(
    sources.every(
      (node) => node.stop.mock.calls.length === 2 && node.disconnect.mock.calls.length === 1,
    ),
  ).toBe(true);
});
