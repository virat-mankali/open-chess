import { Chess, type Color, type Move, type Square } from 'chess.js';
export { Chess };
export type { Color, Move, Square, PieceSymbol } from 'chess.js';

export type Bot = {
  id: string;
  name: string;
  elo: number;
  group: string;
  animal: string;
  color: string;
  style: string;
  description: string;
  greeting: string;
};
export const BOTS: Bot[] = [
  {
    id: 'pip',
    name: 'Pip',
    elo: 250,
    group: 'Beginner',
    animal: 'chick',
    color: 'yellow',
    style: 'Just hatched',
    description: 'A curious little beginner. Pip is learning how the pieces move, just like you.',
    greeting: 'One little move at a time. We’ve got this!',
  },
  {
    id: 'milo',
    name: 'Milo',
    elo: 400,
    group: 'Beginner',
    animal: 'cat',
    color: 'peach',
    style: 'Your friendly first rival',
    description:
      'A little curious. A little clumsy. The perfect companion for finding your feet on the board.',
    greeting: 'Hey there! Let’s make some moves. I promise not to bite.',
  },
  {
    id: 'fern',
    name: 'Fern',
    elo: 650,
    group: 'Beginner',
    animal: 'frog',
    color: 'sage',
    style: 'Slow and steady',
    description: 'Fern likes a quiet position, but occasionally hops into trouble.',
    greeting: 'Take your time. There’s always something new to notice.',
  },
  {
    id: 'otto',
    name: 'Otto',
    elo: 850,
    group: 'Beginner',
    animal: 'bear',
    color: 'blue',
    style: 'Learning the ropes',
    description: 'Otto has the basics down. Watch for loose pieces and simple threats.',
    greeting: 'A good game and a good snack. That’s my kind of day.',
  },
  {
    id: 'luna',
    name: 'Luna',
    elo: 1100,
    group: 'Intermediate',
    animal: 'owl',
    color: 'lavender',
    style: 'The quiet thinker',
    description: 'Luna develops carefully and waits for an opportunity to appear.',
    greeting: 'Let’s see what the position is trying to tell us.',
  },
  {
    id: 'rory',
    name: 'Rory',
    elo: 1400,
    group: 'Intermediate',
    animal: 'fox',
    color: 'orange',
    style: 'Always up to something',
    description:
      'Rory loves activity and keeps you on your toes. Check for tactics before every move.',
    greeting: 'I have a few ideas. Let’s see if you can spot them.',
  },
  {
    id: 'sage',
    name: 'Sage',
    elo: 1700,
    group: 'Advanced',
    animal: 'owl',
    color: 'sage',
    style: 'The patient strategist',
    description: 'Sage sees the big picture. Small weaknesses may become big problems.',
    greeting: 'Every square has a story. Shall we begin?',
  },
  {
    id: 'nova',
    name: 'Nova',
    elo: 2000,
    group: 'Advanced',
    animal: 'cat',
    color: 'blue',
    style: 'Sharp and ambitious',
    description: 'A serious challenge. Nova calculates precisely and rarely leaves a gift.',
    greeting: 'Let’s make this a game worth remembering.',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    elo: 2300,
    group: 'Master',
    animal: 'bear',
    color: 'peach',
    style: 'A formidable opponent',
    description: 'Strong calculation and relentless pressure. Bring your best chess.',
    greeting: 'The board is ready. Are you?',
  },
  {
    id: 'orion',
    name: 'Orion',
    elo: 2600,
    group: 'Master',
    animal: 'fox',
    color: 'lavender',
    style: 'No easy squares',
    description: 'A master-level engine challenge for players who enjoy a serious test.',
    greeting: 'Let’s look a little deeper.',
  },
  {
    id: 'zero',
    name: 'Zero',
    elo: 2800,
    group: 'Master',
    animal: 'robot',
    color: 'slate',
    style: 'Pure calculation',
    description:
      'Our strongest preset. A high-strength Stockfish search with very little forgiveness.',
    greeting: '64 squares. Endless possibilities.',
  },
  {
    id: 'custom',
    name: 'Engine',
    elo: 1500,
    group: 'Custom',
    animal: 'robot',
    color: 'lavender',
    style: 'Set your own challenge',
    description:
      'Choose a target difficulty from 250 to 2800. Find the challenge that feels right for you.',
    greeting: 'Your pace. Your challenge. Your next move.',
  },
];
export type Line = { move: string; cp: number; mate?: number; pv: string[]; depth: number };
export type Evaluation = {
  bestMove: string;
  lines: Line[];
  cp: number;
  mate?: number;
  depth: number;
};
export type Quality =
  'brilliant' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
export const QUALITIES: Record<Quality, { label: string; symbol: string; color: string }> = {
  brilliant: { label: 'Brilliant', symbol: '!!', color: 'cyan' },
  great: { label: 'Great move', symbol: '!', color: 'blue' },
  best: { label: 'Best move', symbol: '★', color: 'green' },
  excellent: { label: 'Excellent', symbol: '✓', color: 'green' },
  good: { label: 'Good move', symbol: '•', color: 'olive' },
  inaccuracy: { label: 'Inaccuracy', symbol: '?!', color: 'yellow' },
  mistake: { label: 'Mistake', symbol: '?', color: 'orange' },
  blunder: { label: 'Blunder', symbol: '??', color: 'red' },
};
export type MoveRecord = {
  ply: number;
  san: string;
  uci: string;
  color: Color;
  before: string;
  after: string;
  quality: Quality;
  cp: number;
  loss: number;
  accuracy: number;
  explanation: string;
  bestSan: string;
  line: string[];
  depth: number;
};
export const VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
export function uci(move: Move) {
  return move.from + move.to + (move.promotion || '');
}
export function playUci(game: Chess, move: string) {
  return game.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] || 'q' });
}
export function sanFor(fen: string, move: string) {
  try {
    return playUci(new Chess(fen), move).san;
  } catch {
    return move;
  }
}
export function lineToSan(fen: string, moves: string[]) {
  const game = new Chess(fen);
  const result: string[] = [];
  for (const move of moves) {
    try {
      result.push(playUci(game, move).san);
    } catch {
      break;
    }
  }
  return result;
}
export function expectedPoints(cp: number) {
  return 1 / (1 + Math.exp(-cp / 230));
}
export function classifyQuality(
  loss: number,
  isBest: boolean,
  sacrifice: boolean,
  onlyGood: boolean,
): Quality {
  if (sacrifice && loss <= 0.02) return 'brilliant';
  if (isBest && onlyGood) return 'great';
  if (isBest || loss <= 0.001) return 'best';
  if (loss <= 0.02) return 'excellent';
  if (loss <= 0.05) return 'good';
  if (loss <= 0.1) return 'inaccuracy';
  if (loss <= 0.2) return 'mistake';
  return 'blunder';
}
// Material-only exchange search. Capturing is optional; legal moves account for pins and kings.
export function exchangeGain(game: Chess, square: Square, depth = 0): number {
  if (depth > 12) return 0;
  let best = 0;
  for (const capture of game
    .moves({ verbose: true })
    .filter((m) => m.to === square && m.captured)) {
    game.move(capture);
    const gain =
      VALUES[capture.captured!] +
      (capture.promotion ? VALUES[capture.promotion] - 100 : 0) -
      exchangeGain(game, square, depth + 1);
    game.undo();
    best = Math.max(best, gain);
  }
  return best;
}
export function isSoundSacrifice(
  beforeFen: string,
  afterFen: string,
  move: Move,
  before: Evaluation,
  after: Evaluation,
) {
  const sign = move.color === 'w' ? 1 : -1;
  if (
    before.lines.length < 2 ||
    before.depth < 8 ||
    after.depth < 8 ||
    before.lines[1].cp * sign > 300 ||
    after.cp * sign < -50 ||
    new Chess(beforeFen).moves().length <= 1 ||
    move.piece === 'p' ||
    move.piece === 'k'
  )
    return false;
  const loss = Math.max(0, expectedPoints(before.cp * sign) - expectedPoints(after.cp * sign));
  if (loss > 0.02 || Math.abs(before.cp - after.cp) > 60) return false;
  const materialTaken = move.captured ? VALUES[move.captured] : 0;
  return exchangeGain(new Chess(afterFen), move.to) - materialTaken >= 180;
}
export function reviewMove(
  move: Move,
  before: Evaluation,
  after: Evaluation,
  ply: number,
): MoveRecord {
  const sign = move.color === 'w' ? 1 : -1;
  const loss = Math.max(0, expectedPoints(before.cp * sign) - expectedPoints(after.cp * sign));
  const best = uci(move) === before.bestMove;
  const gap =
    before.lines.length > 1
      ? expectedPoints(before.lines[0].cp * sign) - expectedPoints(before.lines[1].cp * sign)
      : 0;
  const sacrifice = isSoundSacrifice(move.before, move.after, move, before, after);
  const quality = classifyQuality(loss, best, sacrifice, gap > 0.13 && before.depth >= 8);
  const bestSan = sanFor(move.before, before.bestMove);
  const game = new Chess(move.after);
  let explanation =
    quality === 'brilliant'
      ? 'You offer real material and keep a sound position. The engine supports the sacrifice, even after your opponent’s best defense.'
      : quality === 'great'
        ? 'You found the critical move. The next-best option gives your opponent a substantially better position.'
        : quality === 'best'
          ? 'You found the engine’s first choice and kept the full potential of the position.'
          : quality === 'excellent'
            ? 'A very strong choice. Your move keeps almost all of the position’s potential.'
            : quality === 'good'
              ? 'A solid move that keeps you in the game, with a little room to improve.'
              : `This move gives up about ${Math.round(loss * 100)} percentage points in our estimated outcome model. ${bestSan} would have preserved more of your position.`;
  if (game.isCheckmate())
    explanation = 'Checkmate! Your opponent’s king is attacked and has no legal escape.';
  else if (move.isKingsideCastle() || move.isQueensideCastle())
    explanation += ' Castling tucks your king away and brings a rook closer to the action.';
  else if (move.san.includes('+'))
    explanation += ' Your check forces your opponent to respond to the king’s safety.';
  else if (move.captured)
    explanation += ` You capture a ${{ p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }[move.captured]}.`;
  else if (['n', 'b'].includes(move.piece) && ply < 16)
    explanation += ' Developing a minor piece helps you contest the center.';
  return {
    ply,
    san: move.san,
    uci: uci(move),
    color: move.color,
    before: move.before,
    after: move.after,
    quality,
    cp: after.cp,
    loss,
    accuracy: Math.round(100 * Math.exp(-4 * loss)),
    explanation,
    bestSan,
    line: lineToSan(move.before, before.lines[0]?.pv || []).slice(0, 8),
    depth: Math.min(before.depth, after.depth),
  };
}
export function chooseBotMove(
  evaluation: Evaluation,
  legal: Move[],
  elo: number,
  random = Math.random,
): string {
  if (!legal.length) throw new Error('No legal moves');
  const r = random();
  const randomChance =
    elo < 500 ? 0.6 : elo < 900 ? 0.32 : elo < 1300 ? 0.13 : elo < 1700 ? 0.04 : 0;
  if (r < randomChance)
    return uci(legal[Math.min(legal.length - 1, Math.floor(random() * legal.length))]);
  if (elo >= 1500 && legal.some((m) => uci(m) === evaluation.bestMove)) return evaluation.bestMove;
  const candidates = evaluation.lines.filter((line) => legal.some((m) => uci(m) === line.move));
  if (!candidates.length) return uci(legal[0]);
  const count =
    elo < 900 ? Math.min(5, candidates.length) : elo < 1500 ? Math.min(3, candidates.length) : 1;
  return candidates[Math.min(count - 1, Math.floor(random() * count))].move;
}
export function botSettings(elo: number) {
  return {
    skill: Math.max(0, Math.min(20, Math.round((elo - 700) / 95))),
    time: elo < 900 ? 180 : elo < 1500 ? 300 : elo < 2100 ? 600 : 1100,
    multiPV: elo < 1500 ? 5 : 1,
  };
}
export function gameOutcome(game: Chess): string | null {
  if (game.isCheckmate())
    return game.turn() === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
  if (game.isStalemate()) return 'Draw by stalemate';
  if (game.isThreefoldRepetition()) return 'Draw by repetition';
  if (game.isInsufficientMaterial()) return 'Draw by insufficient material';
  if (game.isDrawByFiftyMoves()) return 'Draw by the fifty-move rule';
  if (game.isDraw()) return 'Draw';
  return null;
}
export function openingName(history: string[]) {
  const h = history.join(' ');
  const openings = [
    ['e4 e5 Nf3 Nc6 Bc4', 'Italian Game'],
    ['e4 e5 Nf3 Nc6 Bb5', 'Ruy Lopez'],
    ['e4 c5', 'Sicilian Defense'],
    ['e4 e6', 'French Defense'],
    ['e4 c6', 'Caro–Kann Defense'],
    ['d4 d5 c4', 'Queen’s Gambit'],
    ['d4 Nf6', 'Indian Defense'],
    ['e4 e5', 'Open Game'],
    ['d4 d5', 'Queen’s Pawn Game'],
    ['e4', 'King’s Pawn Opening'],
    ['d4', 'Queen’s Pawn Opening'],
    ['Nf3', 'Réti Opening'],
    ['c4', 'English Opening'],
  ];
  return openings.find(([prefix]) => h.startsWith(prefix))?.[1] || 'A fresh position';
}
export type Exercise = {
  id: string;
  title: string;
  theme: string;
  difficulty: string;
  description: string;
  fen: string;
  solution: string;
  hint: string;
  explanation: string;
};
export const EXERCISES: Exercise[] = [
  {
    id: 'back-rank',
    title: 'Nowhere to run',
    theme: 'Back-rank mate',
    difficulty: 'Beginner',
    description: 'The pawns are sheltering their king a little too well. Find mate in one.',
    fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
    solution: 'a1a8',
    hint: 'Your rook can reach the eighth rank.',
    explanation:
      'Ra8# covers every square on the back rank. The king’s own pawns block its escape.',
  },
  {
    id: 'queen-mate',
    title: 'Close the net',
    theme: 'Queen and king',
    difficulty: 'Beginner',
    description: 'Your king is helping. Put the queen on the square that finishes the game.',
    fen: '7k/8/5KQ1/8/8/8/8/8 w - - 0 1',
    solution: 'g6g7',
    hint: 'Keep your queen protected by your king.',
    explanation:
      'Qg7# is protected by the king on f6 and covers all of the black king’s escape squares.',
  },
  {
    id: 'fork',
    title: 'Two at once',
    theme: 'Knight fork',
    difficulty: 'Intermediate',
    description: 'Attack the king and queen with one knight move.',
    fen: '3q1k2/8/8/8/5N2/8/8/6K1 w - - 0 1',
    solution: 'f4e6',
    hint: 'The knight can jump to e6 with check.',
    explanation:
      'Ne6+ attacks both the king on f8 and queen on d8. A check gives Black no time to save the queen first.',
  },
  {
    id: 'loose-queen',
    title: 'A royal invitation',
    theme: 'Hanging pieces',
    difficulty: 'Beginner',
    description: 'An undefended queen has wandered into your knight’s reach. Win it.',
    fen: '6k1/8/8/8/3q4/5N2/8/6K1 w - - 0 1',
    solution: 'f3d4',
    hint: 'Knights move two squares one way and one sideways.',
    explanation:
      'Nxd4 wins the undefended queen. Before a quiet move, always check what you can capture.',
  },
  {
    id: 'promotion',
    title: 'A new beginning',
    theme: 'Promotion',
    difficulty: 'Beginner',
    description: 'Your pawn is one step from becoming a queen. Promote it.',
    fen: '7k/P7/8/8/8/8/8/7K w - - 0 1',
    solution: 'a7a8q',
    hint: 'Move the a-pawn to the last rank, then choose a queen.',
    explanation:
      'a8=Q+ turns a pawn into your most powerful piece. Promotion can transform an endgame.',
  },
  {
    id: 'rook-mate',
    title: 'The final rank',
    theme: 'Rook coordination',
    difficulty: 'Intermediate',
    description: 'Two rooks work together to cut off the king. Find mate in one.',
    fen: '7k/R7/8/8/8/8/8/1R4K1 w - - 0 1',
    solution: 'b1b8',
    hint: 'One rook controls the seventh rank. The other can give check along the eighth rank.',
    explanation:
      'Rb8# completes a ladder mate. The rook on a7 prevents the king from escaping to the seventh rank.',
  },
];
export const LESSONS = [
  {
    id: 'pieces',
    title: 'Meet your pieces',
    subtitle: 'Six pieces. A world of possibilities.',
    minutes: 4,
    icon: '♞',
    exercise: 'loose-queen',
    paragraphs: [
      'Every piece has its own way of moving. Rooks move in straight lines, bishops on diagonals, and queens combine both. Knights jump in an L shape and can leap over other pieces.',
      'The king moves one square in any direction, but cannot move into check. Pawns move forward one square and capture diagonally; on their first move they may advance two squares.',
      'Try it: your knight on f3 can jump to d4. There is an undefended queen waiting there.',
    ],
  },
  {
    id: 'center',
    title: 'Own the opening',
    subtitle: 'Build a position with a purpose.',
    minutes: 5,
    icon: '♟',
    exercise: 'fork',
    paragraphs: [
      'Start by contesting the center: e4, d4, e5 and d5. Central pieces have more choices and can reach both sides of the board.',
      'Develop your knights and bishops, castle to protect your king, and avoid moving the same piece repeatedly without a reason. Bringing the queen out early can let your opponent develop with tempo.',
      'Active knights create threats. In the practice position, one knight jump attacks two valuable pieces at once.',
    ],
  },
  {
    id: 'checks',
    title: 'Think in checks and threats',
    subtitle: 'Learn to spot what matters first.',
    minutes: 5,
    icon: '♝',
    exercise: 'back-rank',
    paragraphs: [
      'Before choosing a move, look at checks, captures and threats—for both players. A check is forcing: your opponent must address the king’s safety.',
      'A king behind its pawns can be trapped on the back rank. If a rook or queen reaches that rank and the king has no escape, the game ends immediately.',
      'Try to recognize the pattern in this position. Your rook has an open file and a clear route to the back rank.',
    ],
  },
  {
    id: 'endgames',
    title: 'Finish what you started',
    subtitle: 'Turn an advantage into a win.',
    minutes: 6,
    icon: '♔',
    exercise: 'queen-mate',
    paragraphs: [
      'In an endgame, your king becomes an active piece. Bring it toward the action when enemy checks cannot drive it away.',
      'With a king and queen, gradually reduce the opponent king’s space. Keep the queen protected, and avoid stalemate: a player with no legal moves who is not in check draws.',
      'Here your king already supports the perfect mating square. Find the queen move that gives check and covers every escape.',
    ],
  },
];
