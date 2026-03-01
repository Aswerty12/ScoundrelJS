import { Card } from './card.model';

export interface WeaponState {
  card: Card;
  damage: number;
  lastSlainValue: number;
  slainByThisWeapon: Card[];
}

export type GamePhase = 'start' | 'room-ready' | 'resolving' | 'won' | 'lost';
export type CombatMode = 'weapon' | 'barehanded';

export interface ResolutionEvent {
  cardId: string;
  action: 'equip' | 'heal' | 'potion-discarded' | 'monster-weapon' | 'monster-barehanded';
  hpDelta: number;
  notes?: string;
}

export interface TurnSnapshot {
  deck: Card[];
  room: Card[];
  discard: Card[];
  hp: number;
  weapon: WeaponState | null;
  canSkip: boolean;
  potionsUsedThisTurn: number;
  selectedCountThisTurn: number;
}

export interface GameOutcome {
  kind: 'won' | 'lost';
  score: number;
  scoreBreakdown: string;
}
