import { Injectable, computed, signal } from '@angular/core';
import { Card } from '../models/card.model';
import { CombatMode, GameOutcome, GamePhase, ResolutionEvent, TurnSnapshot, WeaponState } from '../models/game-state.model';
import { cloneCards, createScoundrelDeck } from '../utils/deck';

const STARTING_HP = 20;

@Injectable({ providedIn: 'root' })
export class GameService {
  readonly deck = signal<Card[]>([]);
  readonly room = signal<Card[]>([]);
  readonly discard = signal<Card[]>([]);
  readonly playerHP = signal<number>(STARTING_HP);
  readonly equippedWeapon = signal<WeaponState | null>(null);
  readonly phase = signal<GamePhase>('start');
  readonly canSkip = signal<boolean>(true);

  readonly potionsUsedThisTurn = signal<number>(0);
  readonly selectedCountThisTurn = signal<number>(0);
  readonly requiredSelectionsThisTurn = signal<number>(0);

  readonly pendingCombatTarget = signal<Card | null>(null);
  readonly pendingForcedBarehandTarget = signal<Card | null>(null);
  readonly roomStartSnapshot = signal<TurnSnapshot | null>(null);

  readonly resolutionLog = signal<ResolutionEvent[]>([]);
  readonly lastMessage = signal<string>('Press Start Game to begin.');
  readonly lastHpDelta = signal<number>(0);

  private readonly lastResolvedCardType = signal<'potion' | 'other' | null>(null);
  private readonly lastResolvedPotionValue = signal<number | null>(null);

  readonly deckCount = computed(() => this.deck().length);
  readonly discardCount = computed(() => this.discard().length);
  readonly currentRoomDamage = computed(() => this.room().filter((card) => card.type === 'monster').reduce((sum, card) => sum + card.value, 0));

  readonly isFinalPartialRoom = computed(() => this.deck().length === 0 && this.room().length > 0 && this.room().length < 4);

  readonly canRunAway = computed(() => {
    if (this.phase() !== 'room-ready') return false;
    if (!this.canSkip()) return false;
    if (this.room().length === 0) return false;
    if (this.isFinalPartialRoom()) return false;
    if (this.pendingCombatTarget() || this.pendingForcedBarehandTarget()) return false;
    return true;
  });

  readonly canResetRoom = computed(() => {
    if (this.phase() !== 'room-ready') return false;
    if (!this.roomStartSnapshot()) return false;
    return this.selectedCountThisTurn() > 0;
  });

  readonly isBusyChoosingCombat = computed(() => !!this.pendingCombatTarget() || !!this.pendingForcedBarehandTarget());

  readonly outcome = computed<GameOutcome | null>(() => {
    if (this.phase() === 'won') {
      const hp = this.playerHP();
      const wasPotion = this.lastResolvedCardType() === 'potion';
      const potionValue = this.lastResolvedPotionValue();
      const score = hp === STARTING_HP && wasPotion && potionValue ? STARTING_HP + potionValue : hp;
      const scoreBreakdown = hp === STARTING_HP && wasPotion && potionValue
        ? `Perfect health (${STARTING_HP}) + last potion value (${potionValue})`
        : `Remaining health (${hp})`;

      return { kind: 'won', score, scoreBreakdown };
    }

    if (this.phase() === 'lost') {
      const hp = this.playerHP();
      const remainingMonsterSum = [...this.deck(), ...this.room()]
        .filter((card) => card.type === 'monster')
        .reduce((sum, card) => sum + card.value, 0);
      const score = hp - remainingMonsterSum;
      return {
        kind: 'lost',
        score,
        scoreBreakdown: `HP (${hp}) - remaining monsters (${remainingMonsterSum})`,
      };
    }

    return null;
  });

  startGame(): void {
    this.deck.set(createScoundrelDeck());
    this.room.set([]);
    this.discard.set([]);
    this.playerHP.set(STARTING_HP);
    this.equippedWeapon.set(null);
    this.canSkip.set(true);
    this.phase.set('room-ready');
    this.potionsUsedThisTurn.set(0);
    this.selectedCountThisTurn.set(0);
    this.requiredSelectionsThisTurn.set(0);
    this.pendingCombatTarget.set(null);
    this.pendingForcedBarehandTarget.set(null);
    this.roomStartSnapshot.set(null);
    this.resolutionLog.set([]);
    this.lastMessage.set('Explore the dungeon. Pick 3 cards or run away.');
    this.lastHpDelta.set(0);
    this.lastResolvedCardType.set(null);
    this.lastResolvedPotionValue.set(null);

    this.drawRoom();
  }

  runAway(order: 'ltr' | 'rtl'): void {
    if (!this.canRunAway()) {
      this.lastMessage.set('You cannot run away right now.');
      return;
    }

    const roomCards = [...this.room()];
    const ordered = order === 'ltr' ? roomCards : [...roomCards].reverse();

    this.deck.set([...this.deck(), ...ordered]);
    this.room.set([]);
    this.canSkip.set(false);
    this.lastMessage.set(`You ran away (${order.toUpperCase()}) and reshuffled the room to deck bottom.`);

    this.drawRoom();
  }

  resetRoom(): void {
    const snapshot = this.roomStartSnapshot();
    if (!snapshot || !this.canResetRoom()) {
      this.lastMessage.set('Reset Room is unavailable.');
      return;
    }

    this.deck.set(cloneCards(snapshot.deck));
    this.room.set(cloneCards(snapshot.room));
    this.discard.set(cloneCards(snapshot.discard));
    this.playerHP.set(snapshot.hp);
    this.equippedWeapon.set(this.cloneWeapon(snapshot.weapon));
    this.canSkip.set(snapshot.canSkip);
    this.potionsUsedThisTurn.set(snapshot.potionsUsedThisTurn);
    this.selectedCountThisTurn.set(snapshot.selectedCountThisTurn);
    this.requiredSelectionsThisTurn.set(snapshot.room.length === 4 ? 3 : snapshot.room.length);
    this.pendingCombatTarget.set(null);
    this.pendingForcedBarehandTarget.set(null);
    this.lastMessage.set('Room state reset.');
    this.lastHpDelta.set(0);
  }

  handleCardSelection(cardId: string): void {
    if (this.phase() !== 'room-ready') return;
    if (this.isBusyChoosingCombat()) return;

    const card = this.room().find((entry) => entry.id === cardId);
    if (!card) return;

    this.phase.set('resolving');

    if (card.type === 'weapon') {
      this.resolveWeapon(card);
      return;
    }

    if (card.type === 'potion') {
      this.resolvePotion(card);
      return;
    }

    this.handleMonsterSelection(card);
  }

  chooseCombatMode(mode: CombatMode): void {
    const card = this.pendingCombatTarget();
    if (!card || this.phase() === 'won' || this.phase() === 'lost') return;

    this.pendingCombatTarget.set(null);

    if (mode === 'weapon') {
      this.resolveMonsterWithWeapon(card);
      return;
    }

    this.resolveMonsterBarehanded(card, true);
  }

  confirmForcedBarehand(): void {
    const card = this.pendingForcedBarehandTarget();
    if (!card || this.phase() === 'won' || this.phase() === 'lost') return;

    this.pendingForcedBarehandTarget.set(null);
    this.resolveMonsterBarehanded(card, true);
  }

  cancelPendingCombat(): void {
    if (this.pendingCombatTarget()) {
      this.pendingCombatTarget.set(null);
      this.phase.set('room-ready');
      this.lastMessage.set('Combat choice canceled.');
      return;
    }

    if (this.pendingForcedBarehandTarget()) {
      this.pendingForcedBarehandTarget.set(null);
      this.phase.set('room-ready');
      this.lastMessage.set('Action canceled.');
    }
  }

  getDamagePreview(card: Card): string | null {
    if (card.type !== 'monster') return null;

    const weapon = this.equippedWeapon();
    if (!weapon) {
      return `Barehanded: -${card.value} HP`;
    }

    if (card.value <= weapon.lastSlainValue) {
      const withWeapon = Math.max(card.value - weapon.damage, 0);
      return `Weapon: -${withWeapon} HP | Barehanded: -${card.value} HP`;
    }

    return `Weapon locked (max ${weapon.lastSlainValue}). Barehanded: -${card.value} HP`;
  }

  isCardDimmed(card: Card): boolean {
    return card.type === 'potion' && this.potionsUsedThisTurn() > 0;
  }

  private drawRoom(): void {
    if (this.phase() === 'won' || this.phase() === 'lost') return;

    const room = [...this.room()];
    const deck = [...this.deck()];

    while (room.length < 4 && deck.length > 0) {
      const top = deck.shift();
      if (top) room.push(top);
    }

    this.room.set(room);
    this.deck.set(deck);
    this.phase.set('room-ready');
    this.potionsUsedThisTurn.set(0);
    this.selectedCountThisTurn.set(0);
    this.requiredSelectionsThisTurn.set(room.length === 4 ? 3 : room.length);
    this.pendingCombatTarget.set(null);
    this.pendingForcedBarehandTarget.set(null);
    this.captureRoomSnapshot();

    if (room.length === 0 && deck.length === 0) {
      this.triggerWin();
      return;
    }

    if (room.length < 4 && deck.length === 0) {
      this.lastMessage.set('Final partial room: run away disabled, resolve all remaining cards.');
      return;
    }

    this.lastMessage.set('Room ready. Resolve your cards.');
  }

  private captureRoomSnapshot(): void {
    this.roomStartSnapshot.set({
      deck: cloneCards(this.deck()),
      room: cloneCards(this.room()),
      discard: cloneCards(this.discard()),
      hp: this.playerHP(),
      weapon: this.cloneWeapon(this.equippedWeapon()),
      canSkip: this.canSkip(),
      potionsUsedThisTurn: this.potionsUsedThisTurn(),
      selectedCountThisTurn: this.selectedCountThisTurn(),
    });
  }

  private handleMonsterSelection(card: Card): void {
    const weapon = this.equippedWeapon();

    if (!weapon) {
      this.resolveMonsterBarehanded(card, false);
      return;
    }

    if (card.value <= weapon.lastSlainValue) {
      this.pendingCombatTarget.set(card);
      this.phase.set('room-ready');
      this.lastMessage.set('Choose combat mode: weapon or barehanded.');
      return;
    }

    this.pendingForcedBarehandTarget.set(card);
    this.phase.set('room-ready');
    this.lastMessage.set(`Weapon is locked for this monster. Confirm barehanded fight for ${card.value} damage.`);
  }

  private resolveWeapon(card: Card): void {
    const oldWeapon = this.equippedWeapon();
    if (oldWeapon) {
      this.discard.update((current) => [...current, oldWeapon.card, ...oldWeapon.slainByThisWeapon]);
    }

    this.equippedWeapon.set({
      card,
      damage: card.value,
      lastSlainValue: Number.POSITIVE_INFINITY,
      slainByThisWeapon: [],
    });

    this.removeCardFromRoom(card.id);
    this.lastResolvedCardType.set('other');
    this.lastResolvedPotionValue.set(null);
    this.pushEvent({ cardId: card.id, action: 'equip', hpDelta: 0, notes: `Equipped ${card.rank} of ${card.suit}` });
    this.lastHpDelta.set(0);
    this.afterResolvedCard();
  }

  private resolvePotion(card: Card): void {
    const alreadyUsedPotion = this.potionsUsedThisTurn() > 0;
    const currentHP = this.playerHP();
    const healedHP = alreadyUsedPotion ? currentHP : Math.min(STARTING_HP, currentHP + card.value);
    const hpDelta = healedHP - currentHP;

    this.playerHP.set(healedHP);
    this.potionsUsedThisTurn.update((value) => value + 1);
    this.discard.update((cards) => [...cards, card]);
    this.removeCardFromRoom(card.id);

    this.lastResolvedCardType.set('potion');
    this.lastResolvedPotionValue.set(card.value);
    this.pushEvent({
      cardId: card.id,
      action: alreadyUsedPotion ? 'potion-discarded' : 'heal',
      hpDelta,
      notes: alreadyUsedPotion ? 'Second potion this turn: discarded.' : `Healed ${hpDelta} HP.`,
    });

    this.lastHpDelta.set(hpDelta);
    this.afterResolvedCard();
  }

  private resolveMonsterWithWeapon(card: Card): void {
    const weapon = this.equippedWeapon();
    if (!weapon) {
      this.resolveMonsterBarehanded(card, true);
      return;
    }

    const damage = Math.max(card.value - weapon.damage, 0);
    this.playerHP.update((hp) => hp - damage);
    this.equippedWeapon.set({
      ...weapon,
      lastSlainValue: card.value,
      slainByThisWeapon: [...weapon.slainByThisWeapon, card],
    });

    this.removeCardFromRoom(card.id);
    this.lastResolvedCardType.set('other');
    this.lastResolvedPotionValue.set(null);
    this.pushEvent({
      cardId: card.id,
      action: 'monster-weapon',
      hpDelta: -damage,
      notes: damage > 0 ? `Took ${damage} damage with weapon.` : 'No damage taken.',
    });
    this.lastHpDelta.set(-damage);

    if (this.playerHP() <= 0) {
      this.triggerLoss();
      return;
    }

    this.afterResolvedCard();
  }

  private resolveMonsterBarehanded(card: Card, fromChoice: boolean): void {
    const damage = card.value;
    this.playerHP.update((hp) => hp - damage);
    this.discard.update((cards) => [...cards, card]);
    this.removeCardFromRoom(card.id);
    this.lastResolvedCardType.set('other');
    this.lastResolvedPotionValue.set(null);
    this.pushEvent({
      cardId: card.id,
      action: 'monster-barehanded',
      hpDelta: -damage,
      notes: fromChoice ? `Barehanded hit for ${damage}.` : `No valid weapon path. Barehanded hit for ${damage}.`,
    });
    this.lastHpDelta.set(-damage);

    if (this.playerHP() <= 0) {
      this.triggerLoss();
      return;
    }

    this.afterResolvedCard();
  }

  private afterResolvedCard(): void {
    this.selectedCountThisTurn.update((value) => value + 1);
    const selected = this.selectedCountThisTurn();
    const required = this.requiredSelectionsThisTurn();

    if (selected >= required) {
      this.canSkip.set(true);
      this.drawRoom();
      return;
    }

    this.phase.set('room-ready');
    this.lastMessage.set(`Resolved ${selected}/${required} cards this turn.`);
  }

  private removeCardFromRoom(cardId: string): void {
    this.room.update((cards) => cards.filter((card) => card.id !== cardId));
  }

  private triggerWin(): void {
    this.phase.set('won');
    this.pendingCombatTarget.set(null);
    this.pendingForcedBarehandTarget.set(null);
    this.lastMessage.set('Dungeon cleared. You win.');
  }

  private triggerLoss(): void {
    this.phase.set('lost');
    this.pendingCombatTarget.set(null);
    this.pendingForcedBarehandTarget.set(null);
    this.lastMessage.set('You have fallen in the dungeon.');
  }

  private pushEvent(event: ResolutionEvent): void {
    this.resolutionLog.update((log) => [event, ...log].slice(0, 12));
  }

  private cloneWeapon(weapon: WeaponState | null): WeaponState | null {
    if (!weapon) return null;
    return {
      card: { ...weapon.card },
      damage: weapon.damage,
      lastSlainValue: weapon.lastSlainValue,
      slainByThisWeapon: cloneCards(weapon.slainByThisWeapon),
    };
  }
}
