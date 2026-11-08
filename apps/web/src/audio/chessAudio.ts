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

const samples = {
  move: '/audio/move.mp3',
  capture: '/audio/capture.mp3',
  check: '/audio/check.mp3',
};
type Sample = keyof typeof samples;
let context: AudioContext | null = null;
let generation = 0;
const buffers = new Map<Sample, Promise<AudioBuffer | null>>();
const active = new Map<AudioBufferSourceNode, GainNode>();

function loadSample(audio: AudioContext, name: Sample) {
  let pending = buffers.get(name);
  if (!pending) {
    pending = fetch(samples[name])
      .then((response) => {
        if (!response.ok) throw new Error('Sound unavailable');
        return response.arrayBuffer();
      })
      .then((data) => audio.decodeAudioData(data))
      .catch(() => {
        buffers.delete(name);
        return null;
      });
    buffers.set(name, pending);
  }
  return pending;
}

/** Unlock and preload from a gesture, including for the later computer reply. */
export function unlockChessAudio() {
  try {
    const Audio = window.AudioContext;
    if (!Audio) return;
    if (!context || context.state === 'closed') context = new Audio();
    if (context.state === 'suspended') void context.resume().catch(() => {});
    for (const name of Object.keys(samples) as Sample[]) void loadSample(context, name);
  } catch {
    /* Audio is optional on browsers without Web Audio. */
  }
}

export function silenceChessAudio() {
  generation++;
  for (const [source, gain] of active) {
    try {
      source.stop();
    } catch {
      /* Already ended. */
    }
    source.disconnect();
    gain.disconnect();
  }
  active.clear();
}

/** Short, locally bundled samples; provenance and licenses are in /audio/SOURCE.txt. */
export function playChessSound(kind: ChessSound, enabled: boolean, volume: number) {
  const audio = context;
  if (!enabled || !Number.isFinite(volume) || volume <= 0 || !audio || audio.state !== 'running')
    return;
  const cue = ++generation;
  const requestedAt = performance.now();
  const name: Sample =
    kind === 'capture' || kind === 'promotion'
      ? 'capture'
      : kind === 'check' || kind === 'finish'
        ? 'check'
        : 'move';
  void loadSample(audio, name).then((buffer) => {
    // A slow download must never play an old move or bypass a later mute action.
    if (
      !buffer ||
      cue !== generation ||
      audio.state !== 'running' ||
      performance.now() - requestedAt > 250
    )
      return;
    const level = Math.min(volume, 100) / 100;
    const strength = kind === 'review' ? 0.32 : kind === 'retry' ? 0.4 : 0.8;
    function tap(delay: number, rate = 1) {
      const source = audio!.createBufferSource();
      const gain = audio!.createGain();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      gain.gain.value = level * strength;
      source.connect(gain).connect(audio!.destination);
      active.set(source, gain);
      source.onended = () => {
        if (!active.delete(source)) return;
        source.disconnect();
        gain.disconnect();
      };
      source.start(audio!.currentTime + delay);
    }
    try {
      tap(0, kind === 'retry' ? 0.85 : 1);
      if (kind === 'castle') tap(0.1, 0.92);
    } catch {
      /* A device change or browser audio policy must never interrupt a move. */
    }
  });
}
