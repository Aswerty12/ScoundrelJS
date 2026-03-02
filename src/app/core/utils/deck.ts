import {
  ALL_RANKS,
  ALL_SUITS,
  Card,
  Rank,
  Suit,
  cardTypeFromSuit,
  isRedSuit,
  rankToValue,
} from '../models/card.model';
import { fisherYatesShuffle, RandomFn } from './shuffle';

const KEEPABLE_RED_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];

function shouldKeepCard(suit: Suit, rank: Rank): boolean {
  if (!isRedSuit(suit)) return true;
  return KEEPABLE_RED_RANKS.includes(rank);
}

let idCounter = 0;

function buildCard(suit: Suit, rank: Rank): Card {
  const id = `card-${idCounter++}`;

  return {
    id,
    suit,
    rank,
    value: rankToValue(rank),
    type: cardTypeFromSuit(suit),
    imagePath: `playing-cards/${suit}_${rank}.png`,
  };
}

export function createFullDeck(): Card[] {
  const cards: Card[] = [];

  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      cards.push(buildCard(suit, rank));
    }
  }

  return cards;
}

export function createScoundrelDeck(randomFn: RandomFn = Math.random): Card[] {
  const filtered = createFullDeck().filter((card) => shouldKeepCard(card.suit, card.rank));
  return fisherYatesShuffle(filtered, randomFn);
}

export function cloneCard(card: Card): Card {
  return { ...card };
}

export function cloneCards(cards: Card[]): Card[] {
  return cards.map((card) => cloneCard(card));
}
