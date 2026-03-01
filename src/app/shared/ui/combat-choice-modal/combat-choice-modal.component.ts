import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-combat-choice-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './combat-choice-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatChoiceModalComponent {
  readonly visible = input.required<boolean>();
  readonly monsterValue = input.required<number>();
  readonly weaponDamageTaken = input.required<number>();
  readonly barehandDamageTaken = input.required<number>();

  readonly chooseWeapon = output<void>();
  readonly chooseBarehanded = output<void>();
  readonly cancel = output<void>();
}
