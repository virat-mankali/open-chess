import type { Move } from '@open-chess/chess-core';

export type ChessSound =
  'move' | 'capture' | 'castle' | 'check' | 'promotion' | 'finish' | 'review' | 'retry';
export function soundForMove(move: Move): ChessSound {
  if (move.san.endsWith('#')) return 'finish';
  if (move.promotion) return 'promotion';
  if (move.san.includes('+')) return 'check';
  if (move.isKingsideCastle() || move.isQueensideCastle()) return 'castle';
  return move.captured ? 'capture' : 'move';
}

let context: AudioContext | null = null;
const active = new Set<AudioScheduledSourceNode>();

/** Call from a user gesture, so the later computer reply can also make a sound. */
export function unlockChessAudio() {
  try {
    const Audio = window.AudioContext;
    if (!Audio) return;
    if (!context || context.state === 'closed') context = new Audio();
    if (context.state === 'suspended') void context.resume().catch(() => {});
  } catch {
    /* Audio is optional on browsers without Web Audio. */
  }
}
export function silenceChessAudio() {
  for (const source of active) {
    try {
      source.stop();
    } catch {
      /* Already ended. */
    }
    source.disconnect();
  }
  active.clear();
}

/** Original synthesized sounds: a dry wooden tap and quiet tonal cues. No remote samples. */
export function playChessSound(kind: ChessSound, enabled: boolean, volume: number) {
  const audio = context;
  if (!enabled || !Number.isFinite(volume) || volume <= 0 || !audio || audio.state !== 'running')
    return;
  const level = Math.min(volume, 100) / 100;
  const now = audio.currentTime;
  const track = (source: AudioScheduledSourceNode, gain: GainNode) => {
    active.add(source);
    source.onended = () => {
      active.delete(source);
      source.disconnect();
      gain.disconnect();
    };
  };
  function tone(
    frequency: number,
    delay: number,
    duration: number,
    strength: number,
    end = frequency,
  ) {
    const oscillator = audio!.createOscillator();
    const gain = audio!.createGain();
    const start = now + delay;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(strength * level, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audio!.destination);
    track(oscillator, gain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }
  function tap(delay: number, heavy = false) {
    const duration = heavy ? 0.075 : 0.045;
    const buffer = audio!.createBuffer(
      1,
      Math.ceil(audio!.sampleRate * duration),
      audio!.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    // A decaying noise transient gives the tap texture without a long electronic beep.
    for (let i = 0; i < samples.length; i++)
      samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (samples.length / 5));
    const source = audio!.createBufferSource();
    const gain = audio!.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime((heavy ? 0.11 : 0.065) * level, now + delay);
    source.connect(gain).connect(audio!.destination);
    track(source, gain);
    source.start(now + delay);
    source.stop(now + delay + duration);
    tone(heavy ? 190 : 330, delay, 0.09, heavy ? 0.16 : 0.1, heavy ? 95 : 145);
  }
  try {
    if (kind === 'review') {
      tone(480, 0, 0.035, 0.035, 250);
      return;
    }
    if (kind === 'retry') {
      tone(190, 0, 0.09, 0.065);
      tone(160, 0.09, 0.1, 0.045);
      return;
    }
    tap(0, kind === 'capture');
    if (kind === 'castle') tap(0.09);
    if (kind === 'check') {
      tone(740, 0.035, 0.14, 0.055);
      tone(880, 0.12, 0.18, 0.04);
    }
    if (kind === 'promotion' || kind === 'finish') {
      [523.25, 659.25, 783.99].forEach((frequency, i) =>
        tone(frequency, 0.06 + i * 0.07, 0.3, 0.045),
      );
    }
  } catch {
    /* A device change or browser audio policy must never interrupt a move. */
  }
}
