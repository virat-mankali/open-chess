import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';
import { exchangeGain, VALUES } from './index';

export type ReviewArrow = { from: Square; to: Square; kind: 'move' | 'attack' };
export type ReviewIdea = {
  title: string;
  description: string;
  timing: 'played' | 'plan';
  san: string;
  arrows: ReviewArrow[];
  targets: Square[];
};
const names: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

// A plan asks what the mover threatens IF the opponent leaves the position intact.
// Clear en passant: a hypothetical waiting turn cannot preserve that right.
function forSide(fen: string, color: Color) {
  const fields = fen.split(' ');
  fields[1] = color;
  fields[3] = '-';
  return new Chess(fields.join(' '));
}

function forkTargets(move: Move) {
  const position = new Chess(move.after);
  const attacker = forSide(move.after, move.color);
  const legalCaptures = attacker.moves({ square: move.to, verbose: true });
  return position
    .board()
    .flat()
    .filter((piece) => {
      if (!piece || piece.color === move.color) return false;
      if (piece.type === 'k') return position.attackers(piece.square, move.color).includes(move.to);
      return legalCaptures.some((capture) => capture.to === piece.square && capture.captured);
    })
    .filter((piece): piece is NonNullable<typeof piece> => piece !== null)
    .sort((a, b) => VALUES[b.type] - VALUES[a.type]);
}

function forkIdea(move: Move, timing: ReviewIdea['timing']): ReviewIdea | null {
  const targets = forkTargets(move);
  // Two pawn attacks alone are usually ordinary central control, not a useful lesson.
  if (targets.length < 2 || targets[0].type === 'p') return null;
  const relevant = targets.slice(0, 2);
  const targetText = relevant
    .map((target) => `the ${names[target.type]} on ${target.square}`)
    .join(' and ');
  const developing =
    ['n', 'b'].includes(move.piece) && move.from[1] === (move.color === 'w' ? '1' : '8');
  return {
    title: timing === 'played' ? 'Two targets. One move.' : 'An idea for your next move',
    description:
      timing === 'played'
        ? `Your ${names[move.piece]} on ${move.to} attacks ${targetText} at once. This is a fork; what it wins depends on the reply.`
        : `${developing ? 'Develop' : 'Move'} your ${names[move.piece]} from ${move.from} to ${move.to} to attack ${targetText} at once. Your opponent moves first and can prevent this idea.`,
    timing,
    san: move.san,
    arrows: [
      ...(timing === 'plan' ? [{ from: move.from, to: move.to, kind: 'move' as const }] : []),
      ...relevant.map((target) => ({ from: move.to, to: target.square, kind: 'attack' as const })),
    ],
    targets: relevant.map((target) => target.square),
  };
}

/** Position-based teaching motifs, never an engine score or a promise of a forced win. */
export function reviewIdea(move: Move): ReviewIdea | null {
  const position = new Chess(move.after);
  if (position.isGameOver()) return null;
  const played = forkIdea(move, 'played');
  if (played) return played;
  // A check must be answered; don't invent a plan by giving the mover a second turn.
  if (position.isCheck()) return null;
  const candidates = forSide(move.after, move.color).moves({ verbose: true });
  const ideas = candidates.flatMap((candidate) => {
    if (candidate.piece === 'k' || candidate.promotion) return [];
    const idea = forkIdea(candidate, 'plan');
    if (!idea || exchangeGain(new Chess(candidate.after), candidate.to) > 0) return [];
    const value = forkTargets(candidate)
      .slice(0, 2)
      .reduce((sum, target) => sum + VALUES[target.type], 0);
    return [{ idea, value }];
  });
  return ideas.sort((a, b) => b.value - a.value)[0]?.idea ?? null;
}
