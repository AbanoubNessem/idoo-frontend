import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DynamicFormComponent } from '../../../core/platform/forms/components/dynamic-form/dynamic-form.component';
import { ComponentRegistryService } from '../../../core/platform/components/registry/component-registry.service';
import { defineForm } from '../platform-api';
import { FormDefinition } from '../../../core/platform/forms/form.types';

// ─── ComponentExplorerComponent ───────────────────────────────────────────────
// Showcases all 19 platform field components via the Dynamic Form Engine.
// Components are NOT imported directly — they are resolved through the registry
// and rendered by DynamicFormComponent → FormFieldHostComponent.

const SHOWCASE_FORM: FormDefinition = defineForm({
  id:      'component-showcase',
  version: '1.0',
  mode:    'create',
  layout:  'tabs',
  title:   'Platform Component Showcase',
  description: 'All field types rendered via the Dynamic Form Engine — zero direct Material imports',
  showActions: false,
  tabs: [
    {
      id: 'text-inputs',
      title: 'Text Inputs',
      sections: [{
        id: 'text-sec', layout: 'grid', columns: 2,
        title: 'Text Input Fields',
        fields: [
          { key: 'text',     type: 'text',     label: 'Text',          placeholder: 'Type something', span: 1 },
          { key: 'email',    type: 'text',     label: 'Email',         placeholder: 'user@example.com', span: 1 },
          { key: 'phone',    type: 'text',     label: 'Phone',         placeholder: '+1 234 567 8900', span: 1 },
          { key: 'number',   type: 'number',   label: 'Number',        span: 1 },
          { key: 'currency', type: 'currency', label: 'Currency (USD)', span: 1 },
          { key: 'textarea', type: 'textarea', label: 'Textarea',      span: 2, config: { rows: 3 } },
          { key: 'markdown', type: 'markdown', label: 'Markdown',      span: 2 },
          { key: 'json',     type: 'json',     label: 'JSON Editor',   span: 2 },
        ],
      }],
    },
    {
      id: 'pickers',
      title: 'Pickers & Selects',
      sections: [{
        id: 'pick-sec', layout: 'grid', columns: 2,
        title: 'Picker Fields',
        fields: [
          {
            key: 'select', type: 'select', label: 'Select', span: 1,
            config: { options: [
              { label: 'Option A', value: 'a' },
              { label: 'Option B', value: 'b' },
              { label: 'Option C', value: 'c' },
            ]},
          },
          { key: 'date',   type: 'date',   label: 'Date Picker',    span: 1 },
          { key: 'time',   type: 'time',   label: 'Time Picker',    span: 1 },
          { key: 'color',  type: 'color',  label: 'Color Picker',   span: 1 },
          {
            key: 'chip', type: 'chip', label: 'Chip Input', span: 2,
            config: { suggestions: ['Angular', 'TypeScript', 'Platform', 'Metadata', 'Sprint 6.5'] },
          },
          {
            key: 'autocomplete', type: 'autocomplete', label: 'Autocomplete', span: 2,
            config: { options: [
              { label: 'Item Alpha',   value: 'alpha' },
              { label: 'Item Beta',    value: 'beta' },
              { label: 'Item Gamma',   value: 'gamma' },
            ]},
          },
        ],
      }],
    },
    {
      id: 'toggles',
      title: 'Toggles & Media',
      sections: [{
        id: 'tog-sec', layout: 'grid', columns: 2,
        title: 'Toggle & Media Fields',
        fields: [
          { key: 'checkbox', type: 'checkbox', label: 'Checkbox',    span: 1 },
          { key: 'switch',   type: 'switch',   label: 'Switch',      span: 1, defaultValue: true },
          { key: 'badge',    type: 'badge',    label: 'Badge',       span: 1 },
          { key: 'file',     type: 'file',     label: 'File Upload', span: 1 },
          { key: 'image',    type: 'image',    label: 'Image',       span: 1 },
          { key: 'avatar',   type: 'avatar',   label: 'Avatar',      span: 1 },
        ],
      }],
    },
  ],
});

@Component({
  selector:        'demo-component-explorer',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [DynamicFormComponent],
  template: `
    <div class="comp-explorer">
      <div class="comp-header">
        <div class="comp-header-left">
          <h2 class="comp-title">Component Explorer</h2>
          <p class="comp-sub">
            {{ totalComponents() }} platform field components rendered via
            <code>DynamicFormComponent</code> — no direct Material imports
          </p>
        </div>
        <div class="comp-header-right">
          <span class="comp-stat">{{ totalComponents() }} components</span>
          <span class="comp-stat comp-stat--green">0 direct Material imports</span>
        </div>
      </div>

      <!-- Info banner -->
      <div class="comp-banner">
        <strong>Architecture:</strong>
        <code>defineForm()</code> metadata →
        <code>DynamicFormEngine</code> →
        <code>FormFieldHostComponent</code> →
        <code>ComponentResolverService</code> →
        <code>ComponentRegistryService</code> →
        <code>MaterialAdapterConnector</code> →
        Platform Field Components
      </div>

      <!-- The showcase form rendered purely from metadata -->
      <div class="comp-form-wrapper">
        <dynamic-form
          [definition]="showcaseForm"
          [initialModel]="{}"
          [showCancelButton]="false"
        />
      </div>
    </div>
  `,
  styles: [`
    .comp-explorer { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .comp-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 20px 24px 0; flex-shrink: 0;
    }
    .comp-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .comp-title { margin: 0 0 4px; font-size: 1.125rem; font-weight: 700; }
    .comp-sub { margin: 0; color: #757575; font-size: 0.8rem; }
    .comp-stat {
      font-size: 0.7rem; padding: 3px 10px; background: #e3f2fd; color: #1565c0;
      border-radius: 12px; font-weight: 600;
    }
    .comp-stat--green { background: #e8f5e9; color: #2e7d32; }

    .comp-banner {
      margin: 12px 24px; padding: 10px 16px; background: #f3e5f5; border-radius: 6px;
      font-size: 0.75rem; color: #4a148c; flex-shrink: 0; display: flex; align-items: center;
      gap: 6px; flex-wrap: wrap;
    }
    .comp-banner code {
      background: rgba(74,20,140,0.1); padding: 1px 6px; border-radius: 3px; font-size: 0.7rem;
    }

    .comp-form-wrapper { flex: 1; overflow-y: auto; padding: 0 24px 24px; }
  `],
})
export class ComponentExplorerComponent {
  private readonly registry = inject(ComponentRegistryService);

  readonly showcaseForm = SHOWCASE_FORM;
  readonly totalComponents = this.registry.registeredCount;
}
