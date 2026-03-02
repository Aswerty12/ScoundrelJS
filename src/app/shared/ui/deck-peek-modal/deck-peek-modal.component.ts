import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Card } from '../../../core/models/card.model';

type GroupLabel = 'Monsters' | 'Weapons' | 'Potions';

interface DeckGroupSummary {
  label: GroupLabel;
  entries: Array<{ value: number; count: number }>;
  totalCards: number;
}

@Component({
  selector: 'app-deck-peek-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deck-peek-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckPeekModalComponent {
  readonly visible = input.required<boolean>();
  readonly deck = input.required<Card[]>();

  readonly close = output<void>();

  readonly groups = computed<DeckGroupSummary[]>(() => {
    const deck = this.deck();

    const groupConfig: Array<{ label: GroupLabel; type: Card['type'] }> = [
      { label: 'Monsters', type: 'monster' },
      { label: 'Weapons', type: 'weapon' },
      { label: 'Potions', type: 'potion' },
    ];

    return groupConfig.map(({ label, type }) => {
      const counts = new Map<number, number>();

      for (const card of deck) {
        if (card.type !== type) continue;
        counts.set(card.value, (counts.get(card.value) ?? 0) + 1);
      }

      const entries = [...counts.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([value, count]) => ({ value, count }));

      return {
        label,
        entries,
        totalCards: entries.reduce((sum, entry) => sum + entry.count, 0),
      };
    });
  });
}
