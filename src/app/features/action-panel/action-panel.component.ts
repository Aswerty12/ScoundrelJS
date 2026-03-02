import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-action-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionPanelComponent {
  readonly canRunAway = input.required<boolean>();
  readonly canResetRoom = input.required<boolean>();
  readonly isFinalPartialRoom = input.required<boolean>();
  readonly isInScoundrelEndgame = input<boolean>(false);
  readonly selectedCount = input.required<number>();
  readonly requiredCount = input.required<number>();
  readonly message = input.required<string>();
  readonly forcedBarehandDamage = input<number | null>(null);

  readonly runAway = output<'ltr' | 'rtl'>();
  readonly resetRoom = output<void>();
  readonly openDeckPeek = output<void>();
  readonly openRules = output<void>();
  readonly confirmForcedBarehand = output<void>();
  readonly cancelForcedBarehand = output<void>();
}
