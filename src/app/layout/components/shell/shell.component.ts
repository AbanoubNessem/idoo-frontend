import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  HostBinding,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ContextBarComponent } from '../context-bar/context-bar.component';

/**
 * Application Shell – root layout for all authenticated routes.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │  Topbar (72px)                               │
 *   ├──────────────────────────────────────────────┤
 *   │  Context Bar (44px)                          │
 *   ├────────────┬─────────────────────────────────┤
 *   │  Sidebar   │  Main Content (scrollable)      │
 *   └────────────┴─────────────────────────────────┘
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, TopbarComponent, SidebarComponent, ContextBarComponent],
  template: `
    <div class="shell" [class.shell--collapsed]="sidebarCollapsed()">
      <!-- ── Fixed Header Zone ─────────────────── -->
      <app-topbar
        class="shell__topbar"
        [sidebarCollapsed]="sidebarCollapsed()"
        (toggleSidebar)="toggleSidebar()"
      />

      <!-- ── Context Bar ───────────────────────── -->
      <app-context-bar class="shell__context-bar" />

      <!-- ── Body (Sidebar + Content) ─────────── -->
      <div class="shell__body">
        <app-sidebar
          class="shell__sidebar"
          [collapsed]="sidebarCollapsed()"
          (collapse)="setSidebarCollapsed($event)"
        />
        <main class="shell__content" id="main-content" role="main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }

    .shell {
      display: grid;
      grid-template-rows: var(--header-height) var(--context-bar-height) 1fr;
      grid-template-columns: var(--sidebar-width) 1fr;
      grid-template-areas:
        "topbar  topbar"
        "ctxbar  ctxbar"
        "sidebar content";
      height: 100vh;
      overflow: hidden;
      transition: grid-template-columns var(--transition-layout);

      &--collapsed {
        grid-template-columns: var(--sidebar-collapsed-w) 1fr;
      }
    }

    .shell__topbar {
      grid-area: topbar;
      z-index: var(--z-sticky);
    }

    .shell__context-bar {
      grid-area: ctxbar;
      z-index: var(--z-sticky);
    }

    .shell__body {
      grid-area: 3 / 1 / 4 / 3;
      display: grid;
      grid-template-columns: subgrid;
      overflow: hidden;
      min-width: 0;
    }

    .shell__sidebar {
      grid-column: 1;
      overflow: hidden;
      min-width: 0;
    }

    .shell__content {
      grid-column: 2;
      overflow-y: auto;
      overflow-x: hidden;
      background-color: var(--color-background);
      padding: var(--space-6);
      min-width: 0;
      width: 100%;
    }

    /* ── Responsive ────────────────────────────── */
    @media (max-width: 1024px) {
      .shell {
        grid-template-columns: var(--sidebar-collapsed-w) 1fr;
      }
    }

    @media (max-width: 767px) {
      .shell {
        grid-template-columns: 0 1fr;

        &--collapsed {
          grid-template-columns: 0 1fr;
        }
      }

      .shell__content {
        padding: var(--space-4);
      }
    }
  `],
})
export class ShellComponent implements OnInit {
  readonly sidebarCollapsed = signal(false);

  ngOnInit() {
    console.log('ShellComponent Loaded');
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  setSidebarCollapsed(val: boolean): void {
    this.sidebarCollapsed.set(val);
  }
}
