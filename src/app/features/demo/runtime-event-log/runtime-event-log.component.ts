import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DynamicFormEventsService } from '../../../core/platform/forms/events/dynamic-form-events.service';
import { FormEvent, FormEventType } from '../../../core/platform/forms/form.types';

// ─── RuntimeEventLogComponent ─────────────────────────────────────────────────
// Displays all form engine events as a live scrollable feed.
// Shows event type, form ID, timestamp, and payload.

@Component({
  selector:        'demo-runtime-event-log',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="log-page">
      <div class="log-header">
        <div class="log-header-left">
          <h2 class="log-title">Runtime Event Log</h2>
          <span class="log-count">{{ filteredEvents().length }} / {{ allEvents().length }} events</span>
        </div>
        <div class="log-header-right">
          <!-- Filter by type -->
          <select class="log-select" (change)="setFilter($event)">
            <option value="">All types</option>
            @for (t of eventTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
          <!-- Pause/resume -->
          <button type="button" class="log-btn" (click)="paused.update(v => !v)">
            {{ paused() ? '▶ Resume' : '⏸ Pause' }}
          </button>
          <button type="button" class="log-btn log-btn--danger" (click)="clearAll()">Clear</button>
        </div>
      </div>

      <!-- Events -->
      <div class="log-list">
        @for (event of displayEvents(); track event.timestamp + event.type) {
          <div class="log-entry" [class]="'log-entry--' + typeColor(event.type)">
            <div class="log-entry-meta">
              <span class="log-entry-time">{{ formatTime(event.timestamp) }}</span>
              <span class="log-entry-type">{{ event.type }}</span>
              <span class="log-entry-form">{{ event.formId }}</span>
            </div>
            <div class="log-entry-payload">
              {{ payloadStr(event) }}
            </div>
          </div>
        }
        @empty {
          <div class="log-empty">
            <p>No events captured yet.</p>
            <p>Open the <strong>Customer Demo</strong> and interact with the form to see events here.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .log-page { display: flex; flex-direction: column; height: 100%; background: #1a1a2e; color: #e0e0e0; }

    .log-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; background: #16213e; border-bottom: 1px solid #0f3460; flex-shrink: 0;
    }
    .log-header-left { display: flex; align-items: center; gap: 12px; }
    .log-header-right { display: flex; align-items: center; gap: 8px; }
    .log-title { margin: 0; font-size: 0.9rem; font-weight: 600; color: #fff; }
    .log-count { font-size: 0.7rem; color: #9e9e9e; }

    .log-select {
      padding: 4px 10px; background: #0f3460; border: 1px solid #1e5799;
      border-radius: 4px; color: #e0e0e0; font-size: 0.75rem; cursor: pointer;
    }
    .log-btn {
      padding: 4px 12px; border: 1px solid #424242; border-radius: 4px;
      background: #212121; color: #e0e0e0; cursor: pointer; font-size: 0.75rem;
    }
    .log-btn:hover { background: #333; }
    .log-btn--danger { border-color: #b71c1c; color: #ef9a9a; }
    .log-btn--danger:hover { background: #b71c1c; color: #fff; }

    .log-list { flex: 1; overflow-y: auto; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; }

    .log-entry {
      padding: 6px 10px; border-radius: 4px; background: rgba(255,255,255,0.04);
      border-left: 3px solid #424242; font-size: 0.75rem;
    }
    .log-entry--blue   { border-color: #2196f3; }
    .log-entry--green  { border-color: #4caf50; }
    .log-entry--orange { border-color: #ff9800; }
    .log-entry--red    { border-color: #f44336; }
    .log-entry--purple { border-color: #9c27b0; }
    .log-entry--gray   { border-color: #616161; }

    .log-entry-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 2px; }
    .log-entry-time { color: #757575; font-family: monospace; font-size: 0.7rem; }
    .log-entry-type { font-weight: 700; color: #90caf9; }
    .log-entry-form { color: #9e9e9e; font-family: monospace; font-size: 0.65rem; }
    .log-entry-payload { color: #bdbdbd; font-size: 0.7rem; white-space: pre-wrap; word-break: break-all; }

    .log-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; color: #616161; text-align: center; font-size: 0.875rem; gap: 4px;
    }
    .log-empty strong { color: #90caf9; }
  `],
})
export class RuntimeEventLogComponent {
  private readonly eventsService = inject(DynamicFormEventsService);

  readonly paused      = signal(false);
  readonly filterType  = signal<string>('');

  readonly allEvents   = this.eventsService.allEvents;

  readonly filteredEvents = computed(() => {
    const type = this.filterType();
    const all  = this.allEvents();
    return type ? all.filter(e => e.type === type) : all;
  });

  readonly displayEvents = computed(() =>
    this.paused() ? this.filteredEvents() : [...this.filteredEvents()].reverse(),
  );

  readonly eventTypes: FormEventType[] = [
    'field:value-changed',
    'field:blurred',
    'field:focused',
    'field:touched',
    'field:validated',
    'form:validated',
    'form:submitted',
    'form:initialized',
    'form:reset',
    'form:phase-changed',
    'form:autosave-start',
    'form:autosave-complete',
    'form:autosave-error',
    'form:draft-saved',
    'form:draft-restored',
    'history:pushed',
    'history:undo',
    'history:redo',
  ];

  setFilter(event: Event): void {
    this.filterType.set((event.target as HTMLSelectElement).value);
  }

  clearAll(): void {
    this.eventsService.clear();
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  typeColor(type: string): string {
    if (type.includes('submitted') || type.includes('initialized')) return 'green';
    if (type.includes('error'))                                      return 'red';
    if (type.includes('validated') || type.includes('autosave'))    return 'orange';
    if (type.startsWith('field:value'))                             return 'blue';
    if (type.startsWith('field:') || type.startsWith('history:'))   return 'purple';
    return 'gray';
  }

  payloadStr(event: FormEvent): string {
    try {
      return JSON.stringify(event.payload, null, 0);
    } catch {
      return String(event.payload);
    }
  }
}
