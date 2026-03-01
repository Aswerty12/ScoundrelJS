import { Component, output } from '@angular/core';

@Component({
  selector: 'app-start-screen',
  standalone: true,
  templateUrl: './start-screen.component.html',
})
export class StartScreenComponent {
  readonly start = output<void>();
}
