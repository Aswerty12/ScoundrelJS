import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Card } from '../../core/models/card.model';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly card = input.required<Card>();
  readonly interactable = input<boolean>(true);
  readonly dimmed = input<boolean>(false);
  readonly previewText = input<string | null>(null);

  readonly cardClick = output<void>();
  readonly cardEnter = output<void>();
  readonly cardLeave = output<void>();

  protected readonly suitClassMap = {
    hearts: 'border-rose-500 text-rose-600',
    diamonds: 'border-rose-500 text-rose-600',
    clubs: 'border-zinc-800 text-zinc-800',
    spades: 'border-zinc-800 text-zinc-800',
  } as const;
}
