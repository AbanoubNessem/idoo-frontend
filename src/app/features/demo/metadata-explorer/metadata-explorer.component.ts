import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { CustomerEntity } from '../customer/customer.entity';
import { CustomerFormDef, CustomerEditFormDef } from '../customer/customer.form';
import { CountryLookup, IndustryLookup, AccountManagerLookup } from '../customer/customer.lookups';
import { SaveCustomerAction, DiscardAction, DeleteCustomerAction, SaveDraftAction } from '../customer/customer.actions';

type ExplorerTab = 'entity' | 'forms' | 'lookups' | 'actions';

// ─── MetadataExplorerComponent ────────────────────────────────────────────────
// Renders all registered metadata objects: entity, forms, lookups, actions.
// Validates that all metadata is defined via platform API (defineEntity, defineForm, etc.).

@Component({
  selector:        'demo-metadata-explorer',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="meta-explorer">
      <div class="meta-header">
        <h2 class="meta-title">Metadata Explorer</h2>
        <p class="meta-sub">All metadata defined via platform API — no business logic</p>
      </div>

      <!-- Tabs -->
      <div class="meta-tabs">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="meta-tab"
            [class.meta-tab--active]="activeTab() === tab.id"
            (click)="activeTab.set(tab.id)"
          >{{ tab.label }}</button>
        }
      </div>

      <div class="meta-body">

        <!-- Entity tab -->
        @if (activeTab() === 'entity') {
          <div class="meta-section">
            <div class="meta-section-header">
              <span class="meta-badge meta-badge--entity">entity</span>
              <code class="meta-id">{{ entity.id }}</code>
              <span class="meta-detail">{{ entity.displayName }} · {{ entity.fields.length }} fields</span>
            </div>
            <dl class="meta-dl">
              <dt>Display Name</dt><dd>{{ entity.displayName }}</dd>
              <dt>Plural Name</dt><dd>{{ entity.pluralName }}</dd>
              <dt>API Path</dt><dd>{{ entity.metadata?.['apiPath'] ?? '—' }}</dd>
              <dt>Primary Key</dt><dd>{{ entity.metadata?.['primaryKey'] ?? '—' }}</dd>
              <dt>Permissions</dt><dd>{{ entity.permissions?.join(', ') }}</dd>
            </dl>
            <h4 class="meta-subsection-title">Fields</h4>
            <table class="meta-table">
              <thead>
                <tr><th>Key</th><th>Type</th><th>Label</th><th>Required</th><th>Validators</th></tr>
              </thead>
              <tbody>
                @for (f of entity.fields; track f.key) {
                  <tr>
                    <td><code>{{ f.key }}</code></td>
                    <td><span class="meta-type-chip">{{ f.type }}</span></td>
                    <td>{{ f.label }}</td>
                    <td>{{ f.required ? '✓' : '' }}</td>
                    <td>{{ (f.validators ?? []).map(v => v.type).join(', ') }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Forms tab -->
        @if (activeTab() === 'forms') {
          @for (form of forms; track form.id) {
            <div class="meta-section">
              <div class="meta-section-header">
                <span class="meta-badge meta-badge--form">form</span>
                <code class="meta-id">{{ form.id }}</code>
                <span class="meta-detail">v{{ form.version }} · {{ form.mode }} · {{ form.layout }}</span>
              </div>
              <dl class="meta-dl">
                <dt>Title</dt><dd>{{ form.title }}</dd>
                <dt>Tabs</dt><dd>{{ form.tabs?.length ?? 0 }}</dd>
                <dt>Total Sections</dt><dd>{{ countSections(form) }}</dd>
                <dt>Draft Mode</dt><dd>{{ form.draftMode ? 'Yes' : 'No' }}</dd>
                <dt>Submit Label</dt><dd>{{ form.submitLabel }}</dd>
              </dl>
            </div>
          }
        }

        <!-- Lookups tab -->
        @if (activeTab() === 'lookups') {
          @for (lookup of lookups; track lookup.id) {
            <div class="meta-section">
              <div class="meta-section-header">
                <span class="meta-badge meta-badge--lookup">lookup</span>
                <code class="meta-id">{{ lookup.id }}</code>
                <span class="meta-detail">{{ lookup.labelKey ?? 'label' }} / {{ lookup.valueKey ?? 'value' }}</span>
              </div>
              <dl class="meta-dl">
                <dt>Label</dt><dd>{{ lookup.label }}</dd>
                <dt>Query Type</dt><dd>{{ lookup.queryType }}</dd>
                <dt>Label Key</dt><dd>{{ lookup.labelKey }}</dd>
                <dt>Value Key</dt><dd>{{ lookup.valueKey }}</dd>
                <dt>Searchable</dt><dd>{{ lookup.config?.['searchable'] ? 'Yes' : 'No' }}</dd>
              </dl>
            </div>
          }
        }

        <!-- Actions tab -->
        @if (activeTab() === 'actions') {
          @for (action of actions; track action.id) {
            <div class="meta-section">
              <div class="meta-section-header">
                <span class="meta-badge meta-badge--action">action</span>
                <code class="meta-id">{{ action.id }}</code>
                <span class="meta-detail">{{ action.label }} · {{ action.variant }}</span>
              </div>
              <dl class="meta-dl">
                <dt>Label</dt><dd>{{ action.label }}</dd>
                <dt>Variant</dt><dd>{{ action.variant }}</dd>
                <dt>Icon</dt><dd>{{ action.icon }}</dd>
                <dt>Permissions</dt><dd>{{ (action.permissions ?? []).join(', ') }}</dd>
                <dt>Handler</dt><dd>{{ action.handler }}</dd>
              </dl>
            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`
    .meta-explorer { display: flex; flex-direction: column; height: 100%; }
    .meta-header { padding: 20px 24px 0; flex-shrink: 0; }
    .meta-title { margin: 0 0 4px; font-size: 1.125rem; font-weight: 700; }
    .meta-sub { margin: 0; color: #757575; font-size: 0.8rem; }

    .meta-tabs {
      display: flex; gap: 0; padding: 0 24px; margin-top: 16px;
      border-bottom: 1px solid #e0e0e0; flex-shrink: 0;
    }
    .meta-tab {
      padding: 8px 20px; border: none; background: none; cursor: pointer;
      font-size: 0.8rem; color: #757575; border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .meta-tab--active { color: #1976d2; border-bottom-color: #1976d2; font-weight: 600; }

    .meta-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

    .meta-section {
      background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px;
    }
    .meta-section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .meta-id { font-family: monospace; font-size: 0.85rem; color: #1565c0; }
    .meta-detail { color: #757575; font-size: 0.75rem; }

    .meta-badge {
      font-size: 0.6rem; font-weight: 700; padding: 2px 8px; border-radius: 12px;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .meta-badge--entity { background: #e8f5e9; color: #2e7d32; }
    .meta-badge--form   { background: #e3f2fd; color: #1565c0; }
    .meta-badge--lookup { background: #fff3e0; color: #e65100; }
    .meta-badge--action { background: #f3e5f5; color: #6a1b9a; }

    .meta-dl { display: grid; grid-template-columns: 140px 1fr; gap: 4px 8px; font-size: 0.75rem; margin: 0 0 12px; }
    .meta-dl dt { color: #9e9e9e; font-weight: 500; }
    .meta-dl dd { margin: 0; color: #424242; }

    .meta-subsection-title { margin: 12px 0 8px; font-size: 0.8rem; font-weight: 600; }

    .meta-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .meta-table th {
      text-align: left; padding: 4px 8px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0;
      font-weight: 600; color: #616161; font-size: 0.65rem;
    }
    .meta-table td { padding: 4px 8px; border-bottom: 1px solid #f5f5f5; color: #424242; }
    .meta-table tr:last-child td { border-bottom: none; }

    .meta-type-chip {
      font-size: 0.65rem; padding: 1px 6px; background: #e3f2fd; color: #1565c0; border-radius: 3px;
    }
  `],
})
export class MetadataExplorerComponent {
  readonly activeTab = signal<ExplorerTab>('entity');

  readonly tabs = [
    { id: 'entity'  as ExplorerTab, label: 'Entity (1)' },
    { id: 'forms'   as ExplorerTab, label: 'Forms (2)' },
    { id: 'lookups' as ExplorerTab, label: 'Lookups (3)' },
    { id: 'actions' as ExplorerTab, label: 'Actions (4)' },
  ];

  readonly entity = CustomerEntity;

  readonly forms = [CustomerFormDef, CustomerEditFormDef];

  readonly lookups = [
    CountryLookup,
    IndustryLookup,
    AccountManagerLookup,
  ];

  readonly actions = [
    SaveCustomerAction,
    DiscardAction,
    DeleteCustomerAction,
    SaveDraftAction,
  ];

  countSections(form: typeof CustomerFormDef): number {
    return (form.tabs ?? []).reduce((n, t) => n + t.sections.length, 0)
         + (form.sections ?? []).length;
  }
}
