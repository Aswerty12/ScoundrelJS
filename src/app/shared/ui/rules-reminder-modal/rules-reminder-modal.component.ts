import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-rules-reminder-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rules-reminder-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesReminderModalComponent {
  readonly visible = input.required<boolean>();

  readonly close = output<void>();
}
