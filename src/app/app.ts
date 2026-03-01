import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StartScreenComponent } from './features/start-screen/start-screen.component';
import { GameBoardComponent } from './features/game-board/game-board.component';
import { GameService } from './core/services/game.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StartScreenComponent, GameBoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly game = inject(GameService);
}
