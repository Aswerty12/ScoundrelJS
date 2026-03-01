import { describe, expect, it } from 'vitest';
import { Card, Suit, Rank, cardTypeFromSuit, rankToValue } from '../models/card.model';
import { GameService } from './game.service';

function makeCard(id: string, suit: Suit, rank: Rank): Card {
  return {
    id,
    suit,
    rank,
    value: rankToValue(rank),
    type: cardTypeFromSuit(suit),
    imagePath: `/playing-cards/${suit}_${rank}.png`,
  };
}

describe('GameService', () => {
  it('initial draw creates room of 4 cards unless deck exhausted', () => {
    const service = new GameService();
    service.startGame();

    expect(service.room().length).toBe(4);
    expect(service.deck().length).toBe(40);
  });

  it('cannot run away twice in a row', () => {
    const service = new GameService();
    service.startGame();

    service.runAway('ltr');

    expect(service.canSkip()).toBe(false);
    expect(service.canRunAway()).toBe(false);
  });

  it('disables run away in final partial room', () => {
    const service = new GameService();
    service.phase.set('room-ready');
    service.canSkip.set(true);
    service.deck.set([]);
    service.room.set([makeCard('m1', 'spades', '9'), makeCard('m2', 'clubs', '6')]);

    expect(service.isFinalPartialRoom()).toBe(true);
    expect(service.canRunAway()).toBe(false);
  });

  it('applies potion cap of one heal per turn', () => {
    const service = new GameService();
    service.phase.set('room-ready');
    service.playerHP.set(10);
    service.room.set([
      makeCard('p1', 'hearts', '6'),
      makeCard('p2', 'hearts', '5'),
      makeCard('m1', 'clubs', '2'),
      makeCard('w1', 'diamonds', '4'),
    ]);
    service.requiredSelectionsThisTurn.set(3);

    service.handleCardSelection('p1');
    expect(service.playerHP()).toBe(16);

    service.handleCardSelection('p2');
    expect(service.playerHP()).toBe(16);
  });

  it('replacing weapon discards previous weapon and slain stack', () => {
    const service = new GameService();
    const oldWeapon = makeCard('oldw', 'diamonds', '5');
    const slainA = makeCard('slainA', 'spades', '4');
    service.equippedWeapon.set({
      card: oldWeapon,
      damage: 5,
      lastSlainValue: 4,
      slainByThisWeapon: [slainA],
    });
    service.phase.set('room-ready');
    service.room.set([makeCard('neww', 'diamonds', '9')]);
    service.requiredSelectionsThisTurn.set(1);
    service.deck.set([makeCard('fill', 'clubs', '2')]);

    service.handleCardSelection('neww');

    expect(service.discard().map((card) => card.id)).toContain('oldw');
    expect(service.discard().map((card) => card.id)).toContain('slainA');
    expect(service.equippedWeapon()?.damage).toBe(9);
  });

  it('weapon combat uses max(monster-weapon,0) and updates lastSlainValue', () => {
    const service = new GameService();
    service.phase.set('room-ready');
    service.equippedWeapon.set({
      card: makeCard('w', 'diamonds', '5'),
      damage: 5,
      lastSlainValue: Infinity,
      slainByThisWeapon: [],
    });
    service.playerHP.set(20);
    service.room.set([makeCard('m', 'spades', 'J')]);
    service.requiredSelectionsThisTurn.set(1);

    service.handleCardSelection('m');
    expect(service.pendingCombatTarget()?.id).toBe('m');

    service.chooseCombatMode('weapon');

    expect(service.playerHP()).toBe(14);
    expect(service.equippedWeapon()?.lastSlainValue).toBe(11);
    expect(service.equippedWeapon()?.slainByThisWeapon.map((card) => card.id)).toContain('m');
  });

  it('monster above lastSlain forces barehand confirmation', () => {
    const service = new GameService();
    service.phase.set('room-ready');
    service.equippedWeapon.set({
      card: makeCard('w', 'diamonds', '8'),
      damage: 8,
      lastSlainValue: 5,
      slainByThisWeapon: [],
    });
    service.room.set([makeCard('m', 'spades', 'Q')]);
    service.requiredSelectionsThisTurn.set(1);

    service.handleCardSelection('m');

    expect(service.pendingForcedBarehandTarget()?.id).toBe('m');
  });

  it('resolving 3 cards from 4 carries one and refills room', () => {
    const service = new GameService();
    service.phase.set('room-ready');
    service.canSkip.set(true);
    service.playerHP.set(20);
    service.room.set([
      makeCard('c1', 'hearts', '2'),
      makeCard('c2', 'diamonds', '3'),
      makeCard('c3', 'hearts', '4'),
      makeCard('c4', 'clubs', '2'),
    ]);
    service.deck.set([
      makeCard('d1', 'spades', '3'),
      makeCard('d2', 'spades', '4'),
      makeCard('d3', 'spades', '5'),
    ]);
    service.requiredSelectionsThisTurn.set(3);

    service.handleCardSelection('c1');
    service.handleCardSelection('c2');
    service.handleCardSelection('c3');

    expect(service.room().length).toBe(4);
    expect(service.room().map((card) => card.id)).toContain('c4');
  });

  it('final partial room resolves all cards then wins', () => {
    const service = new GameService();
    service.phase.set('room-ready');
    service.playerHP.set(20);
    service.deck.set([]);
    service.room.set([makeCard('p', 'hearts', '3')]);
    service.requiredSelectionsThisTurn.set(1);

    service.handleCardSelection('p');

    expect(service.phase()).toBe('won');
  });

  it('loss score includes remaining monsters only', () => {
    const service = new GameService();
    service.phase.set('lost');
    service.playerHP.set(-2);
    service.deck.set([makeCard('m1', 'spades', '10'), makeCard('h1', 'hearts', '5')]);
    service.room.set([makeCard('m2', 'clubs', '4')]);

    expect(service.outcome()?.score).toBe(-16);
  });

  it('win score includes potion bonus at 20 HP when last card is potion', () => {
    const service = new GameService();
    service.phase.set('room-ready');
    service.playerHP.set(20);
    service.deck.set([]);
    service.room.set([makeCard('p', 'hearts', '7')]);
    service.requiredSelectionsThisTurn.set(1);

    service.handleCardSelection('p');

    expect(service.phase()).toBe('won');
    expect(service.outcome()?.score).toBe(27);
  });

  it('reset room restores room-start snapshot', () => {
    const service = new GameService();
    const snapshotRoom = [makeCard('m1', 'clubs', '3'), makeCard('p1', 'hearts', '6')];
    const snapshotDeck = [makeCard('d1', 'spades', '8')];

    service.roomStartSnapshot.set({
      room: snapshotRoom,
      deck: snapshotDeck,
      discard: [],
      hp: 18,
      weapon: null,
      canSkip: true,
      potionsUsedThisTurn: 0,
      selectedCountThisTurn: 0,
    });

    service.phase.set('room-ready');
    service.room.set([makeCard('x1', 'hearts', '2')]);
    service.deck.set([]);
    service.playerHP.set(5);
    service.selectedCountThisTurn.set(1);
    service.requiredSelectionsThisTurn.set(1);

    service.resetRoom();

    expect(service.playerHP()).toBe(18);
    expect(service.room().map((card) => card.id)).toEqual(['m1', 'p1']);
    expect(service.deck().map((card) => card.id)).toEqual(['d1']);
  });
});
