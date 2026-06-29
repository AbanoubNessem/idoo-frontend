import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ComponentRegistryService } from '../../../core/platform/components/registry/component-registry.service';
import { ComponentEntry } from '../../../core/platform/components/component.types';

// ─── RegistryExplorerComponent ────────────────────────────────────────────────
// Shows all entries in the ComponentRegistryService.
// Validates that all platform field components are registered via the adapter layer.

@Component({
  selector:        'demo-registry-explorer',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="registry">
      <div class="registry-header">
        <div class="registry-header-left">
          <h2 class="registry-title">Registry Explorer</h2>
          <p class="registry-sub">ComponentRegistryService — registered platform components</p>
        </div>
        <div class="registry-header-right">
          <span class="registry-count-badge">{{ filteredEntries().length }} / {{ totalCount() }}</span>
          <input
            type="text"
            class="registry-search"
            placeholder="Filter by key or type..."
            (input)="setSearch($event)"
          />
          <select class="registry-select" (change)="setCategory($event)">
            <option value="">All categories</option>
            @for (cat of categories(); track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
        </div>
      </div>

      <div class="registry-body">
        @if (filteredEntries().length === 0) {
          <div class="registry-empty">
            <p>No components registered yet.</p>
            <p>The MaterialAdapterConnector must be called at bootstrap to populate the registry.</p>
          </div>
        }

        <div class="registry-grid">
          @for (entry of filteredEntries(); track entry.key) {
            <div class="registry-card" [class.registry-card--resolved]="entry.resolved">
              <div class="registry-card-header">
                <span class="registry-card-key">{{ entry.key }}</span>
                <span class="registry-status" [class.registry-status--ok]="entry.resolved">
                  {{ entry.resolved ? 'resolved' : 'lazy' }}
                </span>
              </div>
              <dl class="registry-dl">
                <dt>Field Type</dt>
                <dd>
                  @if (entry.fieldType) {
                    <span class="registry-type-chip">{{ entry.fieldType }}</span>
                  } @else { — }
                </dd>
                <dt>Category</dt><dd>{{ entry.category }}</dd>
                <dt>Version</dt><dd>v{{ entry.version }}</dd>
                <dt>Tags</dt><dd>{{ (entry.tags ?? []).join(', ') || '—' }}</dd>
              </dl>
              @if (entry.description) {
                <p class="registry-desc">{{ entry.description }}</p>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .registry { display: flex; flex-direction: column; height: 100%; }
    .registry-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 20px 24px 0; flex-shrink: 0;
    }
    .registry-header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .registry-title { margin: 0 0 4px; font-size: 1.125rem; font-weight: 700; }
    .registry-sub { margin: 0; color: #757575; font-size: 0.8rem; }

    .registry-count-badge {
      font-size: 0.7rem; padding: 3px 10px; background: #e3f2fd; color: #1565c0;
      border-radius: 12px; font-weight: 600; white-space: nowrap;
    }
    .registry-search, .registry-select {
      padding: 6px 10px; border: 1px solid #e0e0e0; border-radius: 4px;
      font-size: 0.75rem; color: #424242; background: #fff;
    }
    .registry-search { width: 200px; }

    .registry-body { flex: 1; overflow-y: auto; padding: 16px 24px; }
    .registry-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; color: #9e9e9e; text-align: center; font-size: 0.875rem;
    }

    .registry-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px;
    }
    .registry-card {
      background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px;
    }
    .registry-card--resolved { border-left: 3px solid #4caf50; }

    .registry-card-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
    }
    .registry-card-key { font-family: monospace; font-size: 0.75rem; color: #1565c0; font-weight: 600; }
    .registry-status {
      font-size: 0.6rem; padding: 1px 6px; border-radius: 10px;
      background: #fff3e0; color: #e65100;
    }
    .registry-status--ok { background: #e8f5e9; color: #2e7d32; }

    .registry-dl {
      display: grid; grid-template-columns: 80px 1fr; gap: 2px 6px;
      font-size: 0.7rem; margin: 0 0 6px;
    }
    .registry-dl dt { color: #9e9e9e; }
    .registry-dl dd { margin: 0; color: #424242; }
    .registry-type-chip {
      font-size: 0.65rem; padding: 1px 6px; background: #e3f2fd; color: #1565c0; border-radius: 3px;
    }
    .registry-desc { margin: 0; font-size: 0.7rem; color: #9e9e9e; }
  `],
})
export class RegistryExplorerComponent {
  private readonly registry = inject(ComponentRegistryService);

  readonly search   = signal('');
  readonly category = signal('');

  readonly totalCount = this.registry.registeredCount;

  readonly categories = computed(() =>
    [...new Set(this.registry.all().map(e => e.category))].sort(),
  );

  readonly filteredEntries = computed<ComponentEntry[]>(() => {
    const q   = this.search().toLowerCase();
    const cat = this.category();
    return this.registry.all().filter(e => {
      if (cat && e.category !== cat) return false;
      if (q && !e.key.includes(q) && !(e.fieldType ?? '').includes(q)) return false;
      return true;
    });
  });

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setCategory(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value);
  }
}
