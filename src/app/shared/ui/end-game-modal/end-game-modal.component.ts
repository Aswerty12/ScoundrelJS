import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { GameOutcome } from '../../../core/models/game-state.model';

@Component({
  selector: 'app-end-game-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './end-game-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EndGameModalComponent {
  readonly outcome = input<GameOutcome | null>(null);
  readonly restart = output<void>();
}
