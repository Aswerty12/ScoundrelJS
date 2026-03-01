import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GameService } from '../../core/services/game.service';
import { Card } from '../../core/models/card.model';
import { ActionPanelComponent } from '../action-panel/action-panel.component';
import { CardComponent } from '../card/card.component';
import { HudComponent } from '../hud/hud.component';
import { cardStateAnimation } from '../../shared/animations/card.animations';
import { CombatChoiceModalComponent } from '../../shared/ui/combat-choice-modal/combat-choice-modal.component';
import { EndGameModalComponent } from '../../shared/ui/end-game-modal/end-game-modal.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, ActionPanelComponent, CardComponent, HudComponent, CombatChoiceModalComponent, EndGameModalComponent],
  templateUrl: './game-board.component.html',
  animations: [cardStateAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameBoardComponent {
  readonly game = inject(GameService);

  private readonly hoveredCardId = signal<string | null>(null);

  readonly combatChoiceVisible = computed(() => !!this.game.pendingCombatTarget());
  readonly combatMonsterValue = computed(() => this.game.pendingCombatTarget()?.value ?? 0);
  readonly weaponDamageTaken = computed(() => {
    const target = this.game.pendingCombatTarget();
    const weapon = this.game.equippedWeapon();
    if (!target || !weapon) return 0;
    return Math.max(target.value - weapon.damage, 0);
  });
  readonly forcedBarehandDamage = computed(() => this.game.pendingForcedBarehandTarget()?.value ?? null);

  handleCardClick(card: Card): void {
    this.game.handleCardSelection(card.id);
  }

  handleCardEnter(card: Card): void {
    this.hoveredCardId.set(card.id);
  }

  handleCardLeave(): void {
    this.hoveredCardId.set(null);
  }

  previewFor(card: Card): string | null {
    if (this.hoveredCardId() !== card.id) return null;
    return this.game.getDamagePreview(card);
  }
}
