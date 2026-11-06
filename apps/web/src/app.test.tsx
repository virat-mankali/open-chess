// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Chess, BOTS, type Evaluation } from '@open-chess/chess-core';
import App from './App';
import { Board } from './components/Board';
import { defaults, savedGames, preferences, progress, write } from './storage/local';

vi.mock('./engine/stockfish', () => ({
  StockfishEngine: class {
    async initialize() {}
    async search(fen: string): Promise<Evaluation> {
      await Promise.resolve();
      const g = new Chess(fen);
      const moves = g.moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion || ''));
      const cp = g.isCheckmate() ? (g.turn() === 'w' ? -10000 : 10000) : 0;
      return {
        cp,
        bestMove: moves[0] || '',
        depth: 12,
        lines: moves.slice(0, 5).map((move) => ({ move, cp, pv: [move], depth: 12 })),
      };
    }
    dispose() {}
  },
}));
beforeEach(() => {
  localStorage.clear();
  write('preferences', { ...defaults, sound: false });
  vi.stubGlobal('AudioContext', undefined);
  if (!HTMLDialogElement.prototype.showModal)
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '');
    };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function setup() {
  render(<App />);
  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Let’s play Milo' }) as HTMLButtonElement).disabled,
    ).toBe(false),
  );
}
async function playFirstMove() {
  fireEvent.click(screen.getByRole('button', { name: 'Let’s play Milo' }));
  fireEvent.click(screen.getByRole('button', { name: 'e2 white pawn' }));
  fireEvent.click(screen.getByRole('button', { name: 'e4' }));
  await waitFor(() => expect(savedGames()[0]?.records.length).toBe(2));
}
describe('F01–F03 game and coach flows', () => {
  it('starts a game, makes a legal move, gets a bot reply and persists the real history', async () => {
    await setup();
    await playFirstMove();
    expect(savedGames()[0].pgn).toContain('e4');
    expect(screen.getByRole('button', { name: 'e4 white pawn' })).toBeTruthy();
    expect(savedGames()[0].records.every((r) => r.explanation.length > 20)).toBe(true);
    expect(screen.getByText(/Your last move/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /^e4 / })).toBeTruthy();
  });
  it('shows both players in the review overview and returns to the move explanation', async () => {
    await setup();
    await playFirstMove();
    fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText('Your accuracy')).toBeTruthy();
    expect(screen.getByText('Bot accuracy')).toBeTruthy();
    expect(screen.getByText('Move quality')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Brilliant' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Blunder' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Review moves' }));
    expect(screen.getByRole('heading', { name: /^e4 / })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'First position' })).toBeTruthy();
  });
  it('takes back a complete turn and permits another move', async () => {
    await setup();
    await playFirstMove();
    fireEvent.click(screen.getByRole('button', { name: 'Take back' }));
    expect(savedGames()[0].records).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'e2 white pawn' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'd2 white pawn' }));
    fireEvent.click(screen.getByRole('button', { name: 'd4' }));
    await waitFor(() => expect(savedGames()[0].records).toHaveLength(2));
  });
  it('starts as Black and lets the bot move first', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Black' }));
    fireEvent.click(screen.getByRole('button', { name: 'Let’s play Milo' }));
    await waitFor(() => expect(savedGames()[0]?.records.length).toBe(1));
    expect(savedGames()[0].color).toBe('b');
    expect(savedGames()[0].records[0].color).toBe('w');
  });
  it('disables coach assistance in Challenge and unlocks review after resignation', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Challenge mode' }));
    await playFirstMove();
    expect((screen.getByRole('button', { name: 'Hint' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Take back' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Resign game' }));
    fireEvent.click(screen.getByRole('button', { name: 'Resign & review' }));
    expect(savedGames()[0].result).toContain('resignation');
    expect(screen.getByText('Your accuracy')).toBeTruthy();
  });
  it('reviews an earlier move without changing the actual game', async () => {
    await setup();
    await playFirstMove();
    const pgn = savedGames()[0].pgn;
    fireEvent.click(screen.getByRole('tab', { name: /Game review/ }));
    fireEvent.click(screen.getByRole('button', { name: 'First position' }));
    expect(screen.getByRole('button', { name: 'e2 white pawn' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'e2 white pawn' }));
    fireEvent.click(screen.getByRole('button', { name: 'e4' }));
    expect(savedGames()[0].pgn).toBe(pgn);
    fireEvent.click(screen.getByRole('button', { name: 'Return to the current position' }));
    expect(screen.getByRole('button', { name: 'e4 white pawn' })).toBeTruthy();
  });
  it('resumes an interrupted game from PGN and existing analysis', async () => {
    await setup();
    await playFirstMove();
    const pgn = savedGames()[0].pgn;
    cleanup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Stockfish 19 ready')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'e4 white pawn' })).toBeTruthy();
    expect(savedGames()[0].pgn).toBe(pgn);
  });
});
describe('F04–F06 learning, settings and import', () => {
  it('lets a user solve a puzzle and saves completion', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Puzzles' }));
    fireEvent.click(screen.getByRole('button', { name: /Nowhere to run/ }));
    fireEvent.click(screen.getByRole('button', { name: 'a1 white rook' }));
    fireEvent.click(screen.getByRole('button', { name: 'a8' }));
    expect(screen.getByText(/Ra8# covers every square/)).toBeTruthy();
    expect(progress()).toContain('puzzle:back-rank');
  });
  it('keeps an incorrect puzzle attempt on the original board', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Puzzles' }));
    fireEvent.click(screen.getByRole('button', { name: /Nowhere to run/ }));
    fireEvent.click(screen.getByRole('button', { name: 'a1 white rook' }));
    fireEvent.click(screen.getByRole('button', { name: 'a2' }));
    expect(screen.getByText(/Not quite/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'a1 white rook' })).toBeTruthy();
    expect(progress()).toHaveLength(0);
  });
  it('changes a board preference and persists it', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Board settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Slate' }));
    expect(preferences().theme).toBe('slate');
    fireEvent.click(screen.getByRole('checkbox', { name: /Board coordinates/ }));
    expect(preferences().coordinates).toBe(false);
  });
  it('switches board and piece styles independently and preserves them on reload', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Board settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Green' }));
    fireEvent.click(screen.getByRole('button', { name: 'Classic pieces' }));
    expect(preferences()).toMatchObject({ theme: 'green', pieces: 'classic' });
    cleanup();
    render(<App />);
    expect(document.querySelector('.board-frame')?.classList.contains('theme-green')).toBe(true);
    expect(
      screen
        .getByRole('button', { name: 'e1 white king' })
        .querySelector('img')
        ?.getAttribute('src'),
    ).toBe('/pieces/cburnett/wK.svg');
  });
  it('imports a legal PGN and computes one review per move', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'My games' }));
    fireEvent.click(screen.getByRole('button', { name: 'Import PGN' }));
    fireEvent.change(screen.getByLabelText('Game notation'), {
      target: { value: '1. e4 e5 2. Nf3 Nc6' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze game' }));
    await waitFor(() => expect(savedGames()[0]?.records).toHaveLength(4));
    expect(screen.getByRole('heading', { name: 'Game Review' })).toBeTruthy();
  });
  it('rejects corrupt PGN with an actionable message', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'My games' }));
    fireEvent.click(screen.getByRole('button', { name: 'Import PGN' }));
    fireEvent.change(screen.getByLabelText('Game notation'), { target: { value: '1. e9 banana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze game' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('could not be read'),
    );
    expect(savedGames()).toHaveLength(0);
  });
});
describe('board and persistence edge cases', () => {
  it('updates the old board appearance while keeping saved games and assistance preferences', () => {
    const storedGames = localStorage.getItem('openchess.v1.games');
    write('preferences', { theme: 'walnut', sound: false, targets: false, coordinates: false });
    expect(preferences()).toEqual({
      appearanceVersion: 3,
      theme: 'linen',
      pieces: 'sculpted',
      sound: false,
      targets: false,
      coordinates: false,
    });
    expect(localStorage.getItem('openchess.v1.games')).toBe(storedGames);
    write('preferences', { ...preferences(), theme: 'walnut' });
    expect(preferences().theme).toBe('walnut');
  });
  it('requires a promotion choice and supports underpromotion', () => {
    const onMove = vi.fn();
    render(
      <Board
        fen="7k/P7/8/8/8/8/8/7K w - - 0 1"
        orientation="w"
        disabled={false}
        onMove={onMove}
        preferences={defaults}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'a7 white pawn' }));
    fireEvent.click(screen.getByRole('button', { name: 'a8' }));
    expect(onMove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Promote to knight' }));
    expect(onMove).toHaveBeenCalledWith('a7', 'a8', 'n');
  });
  it('rejects illegal moves on the board', () => {
    const onMove = vi.fn();
    render(
      <Board
        fen={new Chess().fen()}
        orientation="w"
        disabled={false}
        onMove={onMove}
        preferences={defaults}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'e2 white pawn' }));
    fireEvent.click(screen.getByRole('button', { name: 'e5' }));
    expect(onMove).not.toHaveBeenCalled();
  });
  it('recovers safely from malformed browser storage', () => {
    localStorage.setItem('openchess.v1.games', '{bad json');
    localStorage.setItem('openchess.v1.preferences', 'null');
    localStorage.setItem('openchess.v1.progress', '12');
    expect(savedGames()).toEqual([]);
    expect(preferences()).toEqual(defaults);
    expect(progress()).toEqual([]);
  });
  it('does not throw if saving is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(write('games', [])).toBe(false);
  });
});
