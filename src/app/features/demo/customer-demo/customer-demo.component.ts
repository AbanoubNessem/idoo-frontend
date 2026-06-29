import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { DynamicFormComponent } from '../../../core/platform/forms/components/dynamic-form/dynamic-form.component';
import { FieldValueChangeEvent } from '../../../core/platform/forms/components/form-field-host/form-field-host.component';
import { CustomerFormDef, CustomerEditFormDef } from '../customer/customer.form';
import { CustomerEntity } from '../customer/customer.entity';
import { CUSTOMER_INITIAL_MODEL } from '../mock/mock-data';
import { DemoPermissionChecker } from '../mock/demo-permission-checker';

// ─── CustomerDemoComponent ────────────────────────────────────────────────────
// Sprint 6.5 vertical slice demo.
// Uses ONLY the platform Dynamic Form Engine and metadata — no direct Angular Forms,
// no direct Angular Material, no business logic.

@Component({
  selector:        'demo-customer',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [DynamicFormComponent],
  template: `
    <div class="demo-customer">

      <!-- Demo controls toolbar -->
      <div class="demo-toolbar">
        <div class="demo-toolbar-left">
          <h2 class="demo-page-title">Customer Form Demo</h2>
          <span class="demo-entity-badge">{{ entityName }}</span>
        </div>
        <div class="demo-toolbar-right">
          <!-- Mode toggle -->
          <div class="demo-toggle-group">
            <button
              type="button"
              class="demo-toggle-btn"
              [class.demo-toggle-btn--active]="mode() === 'create'"
              (click)="setMode('create')"
            >Create</button>
            <button
              type="button"
              class="demo-toggle-btn"
              [class.demo-toggle-btn--active]="mode() === 'edit'"
              (click)="setMode('edit')"
            >Edit</button>
          </div>
          <!-- Permission toggle -->
          <button
            type="button"
            class="demo-perm-btn"
            [class.demo-perm-btn--restricted]="restricted()"
            (click)="togglePermissions()"
            title="Toggle permission scope"
          >
            {{ restricted() ? 'Restricted' : 'Full Access' }}
          </button>
          <!-- Undo/Redo toggle -->
          <button
            type="button"
            class="demo-perm-btn"
            [class.demo-perm-btn--active]="showUndoRedo()"
            (click)="showUndoRedo.update(v => !v)"
          >Undo/Redo</button>
        </div>
      </div>

      <!-- Status bar -->
      @if (lastEvent()) {
        <div class="demo-status-bar">
          <span class="demo-status-label">Last event:</span>
          <code class="demo-status-value">{{ lastEvent() }}</code>
        </div>
      }

      <!-- Form grid: form + live model panel -->
      <div class="demo-content-grid">

        <!-- The entire customer form — generated from metadata, zero business logic -->
        <div class="demo-form-panel">
          <dynamic-form
            [definition]="formDef()"
            [initialModel]="initialModel"
            [showUndoRedo]="showUndoRedo()"
            (formSubmit)="onSubmit($event)"
            (valueChanged)="onValueChanged($event)"
            (formReady)="onFormReady($event)"
            (cancel)="onCancel()"
            (draftSaved)="onDraftSaved()"
          />
        </div>

        <!-- Live model inspector panel -->
        <div class="demo-model-panel">
          <h3 class="demo-panel-title">Live Model</h3>
          <p class="demo-panel-sub">form id: <code>{{ formId() ?? '...' }}</code></p>
          <pre class="demo-model-json">{{ liveModelJson() }}</pre>

          @if (submitResult()) {
            <div class="demo-submit-result">
              <h4>Submit Result</h4>
              <pre>{{ submitResult() }}</pre>
            </div>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .demo-customer { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    .demo-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; background: #fff;
      border-bottom: 1px solid var(--demo-border, #e0e0e0);
      flex-shrink: 0;
    }
    .demo-toolbar-left { display: flex; align-items: center; gap: 12px; }
    .demo-toolbar-right { display: flex; align-items: center; gap: 8px; }
    .demo-page-title { margin: 0; font-size: 1rem; font-weight: 600; }
    .demo-entity-badge {
      font-size: 0.7rem; font-weight: 600; padding: 2px 8px;
      background: #e3f2fd; color: #1565c0; border-radius: 12px;
    }

    .demo-toggle-group { display: flex; border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden; }
    .demo-toggle-btn {
      padding: 5px 14px; background: #fff; border: none; cursor: pointer;
      font-size: 0.8rem; color: #616161;
    }
    .demo-toggle-btn--active { background: #1976d2; color: #fff; }
    .demo-toggle-btn:not(:last-child) { border-right: 1px solid #e0e0e0; }

    .demo-perm-btn {
      padding: 5px 14px; border: 1px solid #e0e0e0; border-radius: 4px;
      background: #fff; cursor: pointer; font-size: 0.8rem; color: #616161;
    }
    .demo-perm-btn--restricted { background: #fff3e0; color: #e65100; border-color: #ffcc80; }
    .demo-perm-btn--active { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; }

    .demo-status-bar {
      display: flex; align-items: center; gap: 8px; padding: 6px 20px;
      background: #f5f5f5; font-size: 0.75rem; border-bottom: 1px solid #e0e0e0; flex-shrink: 0;
    }
    .demo-status-label { color: #9e9e9e; }
    .demo-status-value { color: #424242; }

    .demo-content-grid {
      display: grid; grid-template-columns: 1fr 320px; gap: 0; flex: 1; overflow: hidden;
    }
    .demo-form-panel {
      overflow-y: auto; padding: 24px;
      border-right: 1px solid var(--demo-border, #e0e0e0);
    }
    .demo-model-panel { overflow-y: auto; padding: 16px; background: #fafafa; }
    .demo-panel-title { margin: 0 0 4px; font-size: 0.875rem; font-weight: 600; }
    .demo-panel-sub { margin: 0 0 12px; font-size: 0.75rem; color: #9e9e9e; }
    .demo-model-json {
      font-size: 0.7rem; background: #f5f5f5; padding: 12px; border-radius: 4px;
      overflow: auto; white-space: pre-wrap; word-break: break-all; max-height: 400px;
    }
    .demo-submit-result {
      margin-top: 16px; padding: 12px; background: #e8f5e9; border-radius: 4px;
    }
    .demo-submit-result h4 { margin: 0 0 8px; font-size: 0.8rem; color: #2e7d32; }
    .demo-submit-result pre { font-size: 0.7rem; margin: 0; }
  `],
})
export class CustomerDemoComponent {
  private readonly permChecker = inject(DemoPermissionChecker);

  readonly entityName = CustomerEntity.displayName;
  readonly initialModel = CUSTOMER_INITIAL_MODEL;

  readonly mode        = signal<'create' | 'edit'>('create');
  readonly restricted  = signal(false);
  readonly showUndoRedo = signal(false);
  readonly formId      = signal<string | null>(null);
  readonly lastEvent   = signal<string | null>(null);
  readonly liveModel   = signal<Record<string, unknown>>(CUSTOMER_INITIAL_MODEL);
  readonly submitResult = signal<string | null>(null);

  readonly formDef = () => this.mode() === 'create' ? CustomerFormDef : CustomerEditFormDef;

  readonly liveModelJson = () => JSON.stringify(this.liveModel(), null, 2);

  setMode(m: 'create' | 'edit'): void {
    this.mode.set(m);
    this.submitResult.set(null);
  }

  togglePermissions(): void {
    const next = !this.restricted();
    this.restricted.set(next);
    if (next) {
      // Revoke financial/tax permissions
      this.permChecker.revokePermission('can_view_financial');
      this.permChecker.revokePermission('can_set_tax_status');
    } else {
      this.permChecker.grantPermission('can_view_financial');
      this.permChecker.grantPermission('can_set_tax_status');
    }
    this.lastEvent.set(`Permissions toggled → ${next ? 'restricted' : 'full'}`);
  }

  onFormReady(id: string): void {
    this.formId.set(id);
    this.lastEvent.set(`form-ready: ${id}`);
  }

  onValueChanged(event: FieldValueChangeEvent): void {
    this.liveModel.update(m => ({ ...m, [event.key]: event.value }));
    this.lastEvent.set(`value-changed: ${event.key} = ${JSON.stringify(event.value)}`);
  }

  onSubmit(result: { model: Record<string, unknown>; formId: string }): void {
    this.submitResult.set(JSON.stringify(result.model, null, 2));
    this.lastEvent.set(`form-submitted: ${result.formId}`);
  }

  onCancel(): void {
    this.lastEvent.set('form-cancelled');
    this.submitResult.set(null);
  }

  onDraftSaved(): void {
    this.lastEvent.set('draft-saved');
  }
}
