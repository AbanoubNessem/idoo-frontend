import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DynamicFormEventsService } from '../../../core/platform/forms/events/dynamic-form-events.service';
import { FormEvent } from '../../../core/platform/forms/form.types';

interface NavItem {
  readonly path:  string;
  readonly label: string;
  readonly icon:  string;
  readonly desc:  string;
}

const NAV_ITEMS: NavItem[] = [
  { path: 'customer',   label: 'Customer Demo',         icon: '👤', desc: 'Live Customer form' },
  { path: 'inspector',  label: 'Architecture Inspector', icon: '🔍', desc: 'Platform runtime state' },
  { path: 'metadata',   label: 'Metadata Explorer',      icon: '📋', desc: 'Entity & form metadata' },
  { path: 'registry',   label: 'Registry Explorer',      icon: '📦', desc: 'Component registry' },
  { path: 'runtime',    label: 'Runtime Explorer',       icon: '⚡', desc: 'Active form instances' },
  { path: 'components', label: 'Component Explorer',     icon: '🧩', desc: 'Platform field components' },
  { path: 'events',     label: 'Event Log',              icon: '📡', desc: 'Runtime event stream' },
];

// ─── DemoShellComponent ───────────────────────────────────────────────────────
// Sprint 6.5 outer shell: sidebar navigation + content area + bottom event log.

@Component({
  selector:        'demo-shell',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="demo-shell">

      <!-- Top bar -->
      <header class="demo-topbar">
        <div class="demo-topbar-brand">
          <span class="demo-brand-icon">🏗</span>
          <span class="demo-brand-name">IDo ERP Platform</span>
          <span class="demo-brand-badge">Sprint 6.5</span>
        </div>
        <div class="demo-topbar-meta">
          <span class="demo-meta-chip">Dynamic Form Engine</span>
          <span class="demo-meta-chip">Metadata-Driven</span>
          <span class="demo-meta-chip demo-meta-chip--green">Architecture Validation</span>
        </div>
      </header>

      <!-- Body -->
      <div class="demo-body">

        <!-- Sidebar navigation -->
        <nav class="demo-sidebar" aria-label="Demo navigation">
          <p class="demo-sidebar-section">Demos</p>
          @for (item of navItems; track item.path) {
            <a
              class="demo-nav-link"
              [routerLink]="item.path"
              routerLinkActive="demo-nav-link--active"
              [title]="item.desc"
            >
              <span class="demo-nav-icon">{{ item.icon }}</span>
              <span class="demo-nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Main content -->
        <main class="demo-main" role="main">
          <router-outlet />
        </main>

      </div>

      <!-- Bottom event log strip -->
      <footer class="demo-event-strip" aria-label="Runtime event log">
        <div class="demo-event-strip-header">
          <span class="demo-event-strip-title">Event Stream</span>
          <span class="demo-event-count">{{ recentEvents().length }} recent</span>
          <button type="button" class="demo-event-clear" (click)="clearEvents()">Clear</button>
        </div>
        <div class="demo-event-list">
          @for (e of recentEvents(); track e.timestamp) {
            <div class="demo-event-chip" [class]="'demo-event-chip--' + eventColor(e.type)">
              <span class="demo-event-time">{{ formatTime(e.timestamp) }}</span>
              <span class="demo-event-type">{{ e.type }}</span>
              <span class="demo-event-form">{{ e.formId.slice(-8) }}</span>
            </div>
          }
          @empty {
            <span class="demo-event-empty">No events yet — interact with a form</span>
          }
        </div>
      </footer>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }
    .demo-shell {
      display: flex; flex-direction: column; height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
    }

    /* Topbar */
    .demo-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 52px; background: #1976d2; color: #fff; flex-shrink: 0;
    }
    .demo-topbar-brand { display: flex; align-items: center; gap: 10px; }
    .demo-brand-icon { font-size: 1.2rem; }
    .demo-brand-name { font-size: 0.9rem; font-weight: 600; }
    .demo-brand-badge {
      font-size: 0.65rem; padding: 2px 8px; background: rgba(255,255,255,0.2);
      border-radius: 12px;
    }
    .demo-topbar-meta { display: flex; gap: 6px; }
    .demo-meta-chip {
      font-size: 0.65rem; padding: 3px 8px; background: rgba(255,255,255,0.15);
      border-radius: 12px;
    }
    .demo-meta-chip--green { background: rgba(129,199,132,0.4); }

    /* Body */
    .demo-body { display: flex; flex: 1; overflow: hidden; }

    /* Sidebar */
    .demo-sidebar {
      width: 200px; background: #fff; border-right: 1px solid #e0e0e0;
      overflow-y: auto; padding: 12px 0; flex-shrink: 0;
    }
    .demo-sidebar-section {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #9e9e9e; padding: 4px 16px 8px; margin: 0;
    }
    .demo-nav-link {
      display: flex; align-items: center; gap: 8px; padding: 8px 16px;
      text-decoration: none; color: #424242; font-size: 0.8rem; border-radius: 0;
      transition: background 150ms;
    }
    .demo-nav-link:hover { background: #f5f5f5; }
    .demo-nav-link--active { background: #e3f2fd; color: #1565c0; font-weight: 600; }
    .demo-nav-icon { font-size: 1rem; flex-shrink: 0; }
    .demo-nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Main */
    .demo-main { flex: 1; overflow: hidden; background: #fff; }

    /* Event strip */
    .demo-event-strip {
      height: 68px; background: #212121; color: #fff; flex-shrink: 0;
      display: flex; flex-direction: column; border-top: 1px solid #424242;
    }
    .demo-event-strip-header {
      display: flex; align-items: center; gap: 8px; padding: 4px 12px 0;
      font-size: 0.65rem; color: #9e9e9e;
    }
    .demo-event-strip-title { font-weight: 600; color: #bdbdbd; }
    .demo-event-count { margin-left: auto; }
    .demo-event-clear {
      background: none; border: none; color: #757575; cursor: pointer; font-size: 0.65rem;
      padding: 2px 6px; border-radius: 3px;
    }
    .demo-event-clear:hover { color: #fff; }
    .demo-event-list {
      display: flex; align-items: center; gap: 6px; padding: 4px 12px;
      overflow-x: auto; flex: 1;
    }
    .demo-event-chip {
      display: flex; align-items: center; gap: 4px; padding: 2px 8px;
      border-radius: 12px; font-size: 0.65rem; flex-shrink: 0;
      background: rgba(255,255,255,0.08);
    }
    .demo-event-chip--blue   { background: rgba(33,150,243,0.2); color: #90caf9; }
    .demo-event-chip--green  { background: rgba(76,175,80,0.2);  color: #a5d6a7; }
    .demo-event-chip--orange { background: rgba(255,152,0,0.2);  color: #ffcc80; }
    .demo-event-chip--red    { background: rgba(244,67,54,0.2);  color: #ef9a9a; }
    .demo-event-time  { color: #757575; }
    .demo-event-type  { font-weight: 600; }
    .demo-event-form  { color: #9e9e9e; font-family: monospace; }
    .demo-event-empty { font-size: 0.75rem; color: #616161; }
  `],
})
export class DemoShellComponent {
  private readonly eventsService = inject(DynamicFormEventsService);

  readonly navItems = NAV_ITEMS;

  readonly recentEvents = this.eventsService.latestEvents;

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  eventColor(type: string): string {
    if (type.includes('submitted') || type.includes('initialized')) return 'green';
    if (type.includes('error'))                                      return 'red';
    if (type.includes('value'))                                      return 'blue';
    return 'orange';
  }

  clearEvents(): void {
    this.eventsService.clear();
  }
}
