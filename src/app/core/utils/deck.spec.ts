import { describe, expect, it } from 'vitest';
import { createFullDeck, createScoundrelDeck } from './deck';

describe('deck utils', () => {
  it('creates a full 52-card deck', () => {
    const fullDeck = createFullDeck();
    expect(fullDeck).toHaveLength(52);
  });

  it('creates a 44-card Scoundrel deck with expected composition', () => {
    const deck = createScoundrelDeck(() => 0.5);

    expect(deck).toHaveLength(44);
    expect(deck.filter((card) => card.suit === 'clubs').length).toBe(13);
    expect(deck.filter((card) => card.suit === 'spades').length).toBe(13);
    expect(deck.filter((card) => card.suit === 'hearts').length).toBe(9);
    expect(deck.filter((card) => card.suit === 'diamonds').length).toBe(9);

    const invalidRedRanks = deck.filter(
      (card) => (card.suit === 'hearts' || card.suit === 'diamonds') && ['A', 'J', 'Q', 'K'].includes(card.rank),
    );
    expect(invalidRedRanks).toHaveLength(0);
  });
});
