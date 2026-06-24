import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, Event, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
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
  constructor() {
    const router = inject(Router);
    router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        console.log('Router Event: NavigationStart', event.url);
      } else if (event instanceof NavigationEnd) {
        console.log('Router Event: NavigationEnd', event.url);
      } else if (event instanceof NavigationError) {
        console.error('Router Event: NavigationError', event.error);
      }
    });
  }
}
