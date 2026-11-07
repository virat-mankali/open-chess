// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { arrowPath, BoardAnnotations, squareCenter } from './BoardAnnotations';
afterEach(cleanup);
describe('review board annotations', () => {
  it('maps squares correctly when playing Black', () => {
    expect(squareCenter('g8', 'b')).toEqual([150, 750]);
    expect(squareCenter('f6', 'b')).toEqual([250, 550]);
    expect(squareCenter('h5', 'b')).toEqual([50, 450]);
    expect(squareCenter('a1', 'w')).toEqual([50, 750]);
  });
  it('draws knight moves as an L and flips all legs together', () => {
    const arrow = { from: 'g8', to: 'f6', kind: 'move' } as const;
    expect(arrowPath(arrow, 'b')).toBe('M 150 750 L 150 550 L 250 550');
    expect(arrowPath(arrow, 'w')).toBe('M 650 50 L 650 250 L 550 250');
    expect(arrowPath({ from: 'f6', to: 'h5', kind: 'attack' }, 'b')).toBe(
      'M 250 550 L 50 550 L 50 450',
    );
  });
  it('uses separate SVG marker IDs for multiple boards and names the arrows accessibly', () => {
    const arrows = [{ from: 'g8', to: 'f6', kind: 'move' }] as const;
    const { container } = render(
      <>
        <BoardAnnotations arrows={[...arrows]} orientation="w" />
        <BoardAnnotations arrows={[...arrows]} orientation="b" />
      </>,
    );
    expect(screen.getAllByRole('img', { name: 'Move idea: g8 to f6' })).toHaveLength(2);
    const markers = [...container.querySelectorAll('marker')].map((node) => node.id);
    expect(new Set(markers).size).toBe(2);
  });
});
