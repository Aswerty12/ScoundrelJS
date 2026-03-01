export type RandomFn = () => number;

export function fisherYatesShuffle<T>(source: readonly T[], randomFn: RandomFn = Math.random): T[] {
  const deck = [...source];

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}
