export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type CardType = 'monster' | 'weapon' | 'potion';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  type: CardType;
  imagePath: string;
}

export const ALL_SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const ALL_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function rankToValue(rank: Rank): number {
  if (rank === 'A') return 14;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return Number(rank);
}

export function cardTypeFromSuit(suit: Suit): CardType {
  if (suit === 'hearts') return 'potion';
  if (suit === 'diamonds') return 'weapon';
  return 'monster';
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}
