import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { WeaponState } from '../../core/models/game-state.model';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hud.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HudComponent {
  protected readonly infinity = Number.POSITIVE_INFINITY;

  readonly hp = input.required<number>();
  readonly hpDelta = input<number>(0);
  readonly deckCount = input.required<number>();
  readonly discardCount = input.required<number>();
  readonly weapon = input<WeaponState | null>(null);
}
