import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DebugPanelComponent } from './core/debug/debug-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DebugPanelComponent],
  template: `
    <router-outlet></router-outlet>
    <app-debug-panel></app-debug-panel>
  `,
})
export class AppComponent {
}
