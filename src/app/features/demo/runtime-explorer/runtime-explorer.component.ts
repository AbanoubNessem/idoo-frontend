import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DynamicFormEngine } from '../../../core/platform/forms/engine/dynamic-form-engine.service';
import { DynamicFormEventsService } from '../../../core/platform/forms/events/dynamic-form-events.service';
import { DynamicFormMetricsService } from '../../../core/platform/forms/metrics/dynamic-form-metrics.service';
import { DynamicFormDiagnosticsService } from '../../../core/platform/forms/diagnostics/dynamic-form-diagnostics.service';
import { FormRenderMetrics } from '../../../core/platform/forms/form.types';

// ─── RuntimeExplorerComponent ─────────────────────────────────────────────────
// Shows all active DynamicFormEngine instances with their live state,
// event counts, metrics, and diagnostics.

@Component({
  selector:        'demo-runtime-explorer',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="runtime">
      <div class="runtime-header">
        <h2 class="runtime-title">Runtime Explorer</h2>
        <p class="runtime-sub">Active Dynamic Form Engine instances and runtime metrics</p>
      </div>

      <!-- Summary strip -->
      <div class="runtime-summary">
        <div class="runtime-stat">
          <span class="runtime-stat-value">{{ instanceCount() }}</span>
          <span class="runtime-stat-label">Active Instances</span>
        </div>
        <div class="runtime-stat">
          <span class="runtime-stat-value">{{ eventCount() }}</span>
          <span class="runtime-stat-label">Total Events</span>
        </div>
        <div class="runtime-stat">
          <span class="runtime-stat-value">{{ diagnosticsEnabled() ? 'ON' : 'OFF' }}</span>
          <span class="runtime-stat-label">Diagnostics</span>
        </div>
        <button
          type="button"
          class="runtime-diag-btn"
          (click)="toggleDiagnostics()"
        >{{ diagnosticsEnabled() ? 'Disable Diagnostics' : 'Enable Diagnostics' }}</button>
        <button
          type="button"
          class="runtime-diag-btn runtime-diag-btn--danger"
          (click)="destroyAll()"
          [disabled]="instanceCount() === 0"
        >Destroy All</button>
      </div>

      <!-- Instance cards -->
      <div class="runtime-body">
        @if (instances().length === 0) {
          <div class="runtime-empty">
            <p>No active form instances.</p>
            <p>Navigate to <strong>Customer Demo</strong> to create a form instance.</p>
          </div>
        }

        @for (inst of instances(); track inst.id) {
          <div class="runtime-card">
            <div class="runtime-card-header">
              <div class="runtime-card-id">
                <code>{{ inst.id }}</code>
              </div>
              <div class="runtime-card-badges">
                <span class="runtime-badge runtime-badge--phase">{{ inst.phase }}</span>
                <span class="runtime-badge" [class.runtime-badge--valid]="inst.valid" [class.runtime-badge--invalid]="!inst.valid">
                  {{ inst.valid ? 'valid' : 'invalid' }}
                </span>
                <span class="runtime-badge" [class.runtime-badge--dirty]="inst.dirty">
                  {{ inst.dirty ? 'dirty' : 'pristine' }}
                </span>
              </div>
            </div>

            <!-- Metrics -->
            <div class="runtime-metrics">
              @let m = getMetrics(inst.id);
              @if (m) {
                <div class="runtime-metric"><span class="runtime-metric-l">Renders</span><span>{{ m.renderCount }}</span></div>
                <div class="runtime-metric"><span class="runtime-metric-l">Validations</span><span>{{ m.validationCount }}</span></div>
                <div class="runtime-metric"><span class="runtime-metric-l">Submits</span><span>{{ m.submitCount }}</span></div>
                <div class="runtime-metric"><span class="runtime-metric-l">Fields</span><span>{{ m.fieldCount }}</span></div>
                <div class="runtime-metric"><span class="runtime-metric-l">Init (ms)</span><span>{{ m.initDurationMs.toFixed(0) }}</span></div>
              } @else {
                <span class="runtime-no-metrics">No metrics recorded</span>
              }
            </div>

            <!-- Events for this instance -->
            <div class="runtime-events">
              <span class="runtime-events-label">Recent events:</span>
              @for (e of getFormEvents(inst.id); track e.timestamp) {
                <span class="runtime-event-pill">{{ e.type }}</span>
              }
              @empty {
                <span class="runtime-no-events">none</span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .runtime { display: flex; flex-direction: column; height: 100%; }
    .runtime-header { padding: 20px 24px 0; flex-shrink: 0; }
    .runtime-title { margin: 0 0 4px; font-size: 1.125rem; font-weight: 700; }
    .runtime-sub { margin: 0; color: #757575; font-size: 0.8rem; }

    .runtime-summary {
      display: flex; align-items: center; gap: 16px; padding: 12px 24px;
      background: #fff; border-bottom: 1px solid #e0e0e0; flex-shrink: 0; flex-wrap: wrap;
    }
    .runtime-stat { display: flex; flex-direction: column; align-items: center; }
    .runtime-stat-value { font-size: 1.25rem; font-weight: 700; color: #1976d2; }
    .runtime-stat-label { font-size: 0.65rem; color: #9e9e9e; }

    .runtime-diag-btn {
      padding: 6px 14px; border: 1px solid #e0e0e0; border-radius: 4px;
      background: #fff; cursor: pointer; font-size: 0.75rem; color: #424242; margin-left: auto;
    }
    .runtime-diag-btn--danger { border-color: #ef9a9a; color: #c62828; margin-left: 0; }
    .runtime-diag-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .runtime-body { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 12px; }
    .runtime-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; color: #9e9e9e; text-align: center; font-size: 0.875rem;
    }
    .runtime-empty strong { color: #1976d2; }

    .runtime-card {
      background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px;
    }
    .runtime-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .runtime-card-id code { font-family: monospace; font-size: 0.75rem; color: #1565c0; }
    .runtime-card-badges { display: flex; gap: 6px; }

    .runtime-badge {
      font-size: 0.65rem; padding: 2px 8px; border-radius: 12px;
      background: #f5f5f5; color: #616161;
    }
    .runtime-badge--phase { background: #e3f2fd; color: #1565c0; }
    .runtime-badge--valid { background: #e8f5e9; color: #2e7d32; }
    .runtime-badge--invalid { background: #ffebee; color: #c62828; }
    .runtime-badge--dirty { background: #fff8e1; color: #f57f17; }

    .runtime-metrics {
      display: flex; gap: 16px; font-size: 0.75rem; margin-bottom: 10px;
    }
    .runtime-metric { display: flex; flex-direction: column; }
    .runtime-metric-l { font-size: 0.65rem; color: #9e9e9e; }
    .runtime-no-metrics { font-size: 0.7rem; color: #bdbdbd; }

    .runtime-events { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .runtime-events-label { font-size: 0.65rem; color: #9e9e9e; }
    .runtime-event-pill {
      font-size: 0.65rem; padding: 1px 8px; background: #f5f5f5; border-radius: 10px; color: #616161;
    }
    .runtime-no-events { font-size: 0.7rem; color: #bdbdbd; }
  `],
})
export class RuntimeExplorerComponent {
  private readonly engine      = inject(DynamicFormEngine);
  private readonly eventsService = inject(DynamicFormEventsService);
  private readonly metrics     = inject(DynamicFormMetricsService);
  private readonly diagnostics = inject(DynamicFormDiagnosticsService);

  readonly instanceCount = this.engine.instanceCount;
  readonly eventCount    = this.eventsService.eventCount;

  readonly instances = computed(() => this.engine.getSummary());

  readonly diagnosticsEnabled = computed(() => this.diagnostics.enabled());

  getMetrics(formId: string): FormRenderMetrics | null {
    return this.metrics.get(formId);
  }

  getFormEvents(formId: string) {
    return this.eventsService.forForm(formId).slice(-5).reverse();
  }

  toggleDiagnostics(): void {
    if (this.diagnostics.enabled()) {
      this.diagnostics.disable();
    } else {
      this.diagnostics.enable();
    }
  }

  destroyAll(): void {
    this.engine.destroyAll();
  }
}
