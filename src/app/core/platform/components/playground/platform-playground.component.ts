import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// Platform field components
import { PlatformTextFieldComponent } from '../fields/text-field/platform-text-field.component';
import { PlatformNumberFieldComponent } from '../fields/number-field/platform-number-field.component';
import { PlatformCurrencyFieldComponent } from '../fields/currency-field/platform-currency-field.component';
import { PlatformDateFieldComponent } from '../fields/date-field/platform-date-field.component';
import { PlatformTimeFieldComponent } from '../fields/time-field/platform-time-field.component';
import { PlatformCheckboxFieldComponent } from '../fields/checkbox-field/platform-checkbox-field.component';
import { PlatformSwitchFieldComponent } from '../fields/switch-field/platform-switch-field.component';
import { PlatformTextareaFieldComponent } from '../fields/textarea-field/platform-textarea-field.component';
import { PlatformSelectFieldComponent } from '../fields/select-field/platform-select-field.component';
import { PlatformAutocompleteFieldComponent } from '../fields/autocomplete-field/platform-autocomplete-field.component';
import { PlatformFileFieldComponent } from '../fields/file-field/platform-file-field.component';
import { PlatformChipFieldComponent } from '../fields/chip-field/platform-chip-field.component';
import { PlatformBadgeFieldComponent } from '../fields/badge-field/platform-badge-field.component';
import { PlatformColorFieldComponent } from '../fields/color-field/platform-color-field.component';
import { PlatformJsonFieldComponent } from '../fields/json-field/platform-json-field.component';
import { PlatformMarkdownFieldComponent } from '../fields/markdown-field/platform-markdown-field.component';
import { PlatformLookupFieldComponent } from '../fields/lookup-field/platform-lookup-field.component';
import { PlatformImageFieldComponent } from '../fields/image-field/platform-image-field.component';
import { PlatformAvatarFieldComponent } from '../fields/avatar-field/platform-avatar-field.component';

import { PlaygroundScenario, PlaygroundScenarioConfig } from '../component.types';

interface ScenarioState {
  disabled:  boolean;
  readonly:  boolean;
  required:  boolean;
  loading:   boolean;
  skeleton:  boolean;
  errors:    string[];
  hint:      string;
}

const SCENARIO_CONFIGS: PlaygroundScenarioConfig[] = [
  { scenario: 'default',  label: 'Default',     icon: 'widgets',       description: 'Normal state with a value' },
  { scenario: 'readonly', label: 'Readonly',     icon: 'lock_outline',  description: 'Non-editable view state' },
  { scenario: 'disabled', label: 'Disabled',     icon: 'block',         description: 'Disabled, not focusable' },
  { scenario: 'required', label: 'Required',     icon: 'star',          description: 'Field is required' },
  { scenario: 'error',    label: 'Error',         icon: 'error_outline', description: 'Validation error displayed' },
  { scenario: 'loading',  label: 'Loading',       icon: 'hourglass_top', description: 'Async operation in progress' },
  { scenario: 'skeleton', label: 'Skeleton',      icon: 'image',         description: 'Initial data fetch' },
  { scenario: 'rtl',      label: 'RTL',           icon: 'format_textdirection_r_to_l', description: 'Right-to-left layout' },
  { scenario: 'dark',     label: 'Dark Theme',    icon: 'dark_mode',     description: 'Dark color scheme' },
  { scenario: 'mobile',   label: 'Mobile',        icon: 'phone_iphone',  description: 'Mobile viewport (360px)' },
  { scenario: 'desktop',  label: 'Desktop',       icon: 'desktop_windows', description: 'Desktop viewport (1280px)' },
];

const SELECT_OPTIONS = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
];

@Component({
  selector: 'platform-playground',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule, MatButtonModule, MatTooltipModule,
    PlatformTextFieldComponent, PlatformNumberFieldComponent,
    PlatformCurrencyFieldComponent, PlatformDateFieldComponent,
    PlatformTimeFieldComponent, PlatformCheckboxFieldComponent,
    PlatformSwitchFieldComponent, PlatformTextareaFieldComponent,
    PlatformSelectFieldComponent, PlatformAutocompleteFieldComponent,
    PlatformFileFieldComponent, PlatformChipFieldComponent,
    PlatformBadgeFieldComponent, PlatformColorFieldComponent,
    PlatformJsonFieldComponent, PlatformMarkdownFieldComponent,
    PlatformLookupFieldComponent, PlatformImageFieldComponent,
    PlatformAvatarFieldComponent,
  ],
  template: `
    <div class="pg-root" [attr.dir]="currentScenario() === 'rtl' ? 'rtl' : 'ltr'" [class.pg-dark]="currentScenario() === 'dark'" [class.pg-mobile]="currentScenario() === 'mobile'">
      <!-- Header -->
      <header class="pg-header">
        <h1 class="pg-title">Platform Component Playground</h1>
        <p class="pg-subtitle">Enterprise Component Library — Sprint 5</p>
      </header>

      <!-- Scenario tabs -->
      <nav class="pg-scenarios" role="tablist" aria-label="Test scenarios">
        @for (cfg of scenarios; track cfg.scenario) {
          <button
            type="button"
            class="pg-scenario-btn"
            [class.pg-scenario-btn--active]="currentScenario() === cfg.scenario"
            role="tab"
            [attr.aria-selected]="currentScenario() === cfg.scenario"
            [matTooltip]="cfg.description"
            (click)="setScenario(cfg.scenario)"
          >
            <mat-icon>{{ cfg.icon }}</mat-icon>
            <span>{{ cfg.label }}</span>
          </button>
        }
      </nav>

      <!-- Scenario state indicator -->
      <div class="pg-state-bar" role="status">
        <span class="pg-state-label">Active scenario:</span>
        <strong>{{ activeScenarioConfig()?.label }}</strong>
        <span class="pg-state-desc">— {{ activeScenarioConfig()?.description }}</span>
      </div>

      <!-- Components grid -->
      <main class="pg-grid" role="main">
        <!-- Text Field -->
        <section class="pg-card" aria-label="Text field">
          <h2 class="pg-card-title">Text Field</h2>
          <platform-text-field
            fieldKey="pg-text"
            [label]="'Full Name'"
            [placeholder]="'Enter your name'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            prefixIcon="person"
          />
        </section>

        <!-- Number Field -->
        <section class="pg-card" aria-label="Number field">
          <h2 class="pg-card-title">Number Field</h2>
          <platform-number-field
            fieldKey="pg-number"
            [label]="'Quantity'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ min: 0, max: 9999, step: 1 }"
          />
        </section>

        <!-- Currency Field -->
        <section class="pg-card" aria-label="Currency field">
          <h2 class="pg-card-title">Currency Field</h2>
          <platform-currency-field
            fieldKey="pg-currency"
            [label]="'Price'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ currency: 'USD', showSymbol: true, min: 0 }"
          />
        </section>

        <!-- Date Field -->
        <section class="pg-card" aria-label="Date field">
          <h2 class="pg-card-title">Date Field</h2>
          <platform-date-field
            fieldKey="pg-date"
            [label]="'Date of Birth'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
          />
        </section>

        <!-- Time Field -->
        <section class="pg-card" aria-label="Time field">
          <h2 class="pg-card-title">Time Field</h2>
          <platform-time-field
            fieldKey="pg-time"
            [label]="'Meeting Time'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
          />
        </section>

        <!-- Checkbox Field -->
        <section class="pg-card" aria-label="Checkbox field">
          <h2 class="pg-card-title">Checkbox Field</h2>
          <platform-checkbox-field
            fieldKey="pg-checkbox"
            [label]="'Accept Terms'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
          />
        </section>

        <!-- Switch Field -->
        <section class="pg-card" aria-label="Switch field">
          <h2 class="pg-card-title">Switch Field</h2>
          <platform-switch-field
            fieldKey="pg-switch"
            [label]="'Enable Notifications'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
          />
        </section>

        <!-- Textarea Field -->
        <section class="pg-card" aria-label="Textarea field">
          <h2 class="pg-card-title">Textarea Field</h2>
          <platform-textarea-field
            fieldKey="pg-textarea"
            [label]="'Description'"
            [placeholder]="'Enter description...'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ rows: 4 }"
          />
        </section>

        <!-- Select Field -->
        <section class="pg-card" aria-label="Select field">
          <h2 class="pg-card-title">Select Field</h2>
          <platform-select-field
            fieldKey="pg-select"
            [label]="'Category'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ options: selectOptions }"
          />
        </section>

        <!-- Autocomplete Field -->
        <section class="pg-card" aria-label="Autocomplete field">
          <h2 class="pg-card-title">Autocomplete Field</h2>
          <platform-autocomplete-field
            fieldKey="pg-autocomplete"
            [label]="'Country'"
            [placeholder]="'Search country...'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ options: selectOptions, freeText: false }"
          />
        </section>

        <!-- File Field -->
        <section class="pg-card" aria-label="File field">
          <h2 class="pg-card-title">File Field</h2>
          <platform-file-field
            fieldKey="pg-file"
            [label]="'Attachment'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ accept: '.pdf,.docx', maxSizeBytes: 10485760 }"
          />
        </section>

        <!-- Chip Field -->
        <section class="pg-card" aria-label="Chip field">
          <h2 class="pg-card-title">Chip Field</h2>
          <platform-chip-field
            fieldKey="pg-chip"
            [label]="'Tags'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ suggestions: ['Angular', 'TypeScript', 'RxJS', 'NgRx'], maxChips: 10 }"
          />
        </section>

        <!-- Badge Field -->
        <section class="pg-card" aria-label="Badge field">
          <h2 class="pg-card-title">Badge Field</h2>
          <platform-badge-field
            fieldKey="pg-badge"
            [label]="'Status Label'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ badgeValue: 'NEW', badgeColor: 'success' }"
          />
        </section>

        <!-- Color Field -->
        <section class="pg-card" aria-label="Color field">
          <h2 class="pg-card-title">Color Field</h2>
          <platform-color-field
            fieldKey="pg-color"
            [label]="'Brand Color'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ presets: ['#2563eb','#7c3aed','#059669','#dc2626','#d97706'], format: 'hex' }"
          />
        </section>

        <!-- JSON Field -->
        <section class="pg-card" aria-label="JSON field">
          <h2 class="pg-card-title">JSON Field</h2>
          <platform-json-field
            fieldKey="pg-json"
            [label]="'Configuration'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ height: '160px' }"
          />
        </section>

        <!-- Markdown Field -->
        <section class="pg-card" aria-label="Markdown field">
          <h2 class="pg-card-title">Markdown Field</h2>
          <platform-markdown-field
            fieldKey="pg-markdown"
            [label]="'Notes'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ height: '200px', preview: true }"
          />
        </section>

        <!-- Lookup Field -->
        <section class="pg-card" aria-label="Lookup field">
          <h2 class="pg-card-title">Lookup Field</h2>
          <platform-lookup-field
            fieldKey="pg-lookup"
            [label]="'Customer'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ entityType: 'customer' }"
          />
        </section>

        <!-- Image Field -->
        <section class="pg-card" aria-label="Image field">
          <h2 class="pg-card-title">Image Field</h2>
          <platform-image-field
            fieldKey="pg-image"
            [label]="'Product Image'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ previewWidth: 200, previewHeight: 150 }"
          />
        </section>

        <!-- Avatar Field -->
        <section class="pg-card" aria-label="Avatar field">
          <h2 class="pg-card-title">Avatar Field</h2>
          <platform-avatar-field
            fieldKey="pg-avatar"
            [label]="'Profile Photo'"
            [hint]="state().hint"
            [disabled]="state().disabled"
            [readonly]="state().readonly"
            [required]="state().required"
            [loading]="state().loading"
            [skeleton]="state().skeleton"
            [errors]="state().errors"
            [config]="{ size: 80, shape: 'circle' }"
          />
        </section>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pg-root { min-height: 100vh; background: var(--platform-color-background, #f8fafc); color: var(--platform-color-text-primary, #1e293b); font-family: var(--platform-typography-font-family-system, system-ui); }
    .pg-root.pg-dark { background: #020617; color: #f1f5f9; --platform-color-surface: #0f172a; --platform-color-border: #1e293b; }
    .pg-root.pg-mobile { max-width: 360px; }
    .pg-header { padding: 24px 24px 0; }
    .pg-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; }
    .pg-subtitle { font-size: 0.875rem; color: var(--platform-color-text-secondary, #64748b); margin: 0 0 24px; }
    .pg-scenarios { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 24px 16px; }
    .pg-scenario-btn {
      display: flex; align-items: center; gap: 6px; padding: 6px 14px;
      border: 1px solid var(--platform-color-border, #e2e8f0);
      border-radius: 20px; background: var(--platform-color-surface, #fff);
      cursor: pointer; font-size: 0.8125rem; font-weight: 500;
      color: var(--platform-color-text-secondary, #64748b);
      transition: all 0.15s ease; white-space: nowrap;
    }
    .pg-scenario-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .pg-scenario-btn:hover { border-color: var(--platform-color-primary, #2563eb); color: var(--platform-color-primary, #2563eb); }
    .pg-scenario-btn--active { background: var(--platform-color-primary, #2563eb); color: #fff; border-color: transparent; }
    .pg-state-bar { padding: 8px 24px 16px; font-size: 0.875rem; color: var(--platform-color-text-secondary, #64748b); }
    .pg-state-desc { opacity: 0.75; }
    .pg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; padding: 0 24px 40px; }
    .pg-card { background: var(--platform-color-surface, #fff); border: 1px solid var(--platform-color-border, #e2e8f0); border-radius: var(--platform-border-radius-md, 8px); padding: 20px; }
    .pg-card-title { font-size: 0.875rem; font-weight: 600; color: var(--platform-color-text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px; }
  `],
})
export class PlatformPlaygroundComponent {
  protected readonly scenarios = SCENARIO_CONFIGS;
  protected readonly selectOptions = SELECT_OPTIONS;

  protected readonly currentScenario = signal<PlaygroundScenario>('default');

  protected readonly activeScenarioConfig = computed(() =>
    this.scenarios.find(s => s.scenario === this.currentScenario()),
  );

  protected readonly state = computed<ScenarioState>(() => {
    switch (this.currentScenario()) {
      case 'readonly':  return { disabled: false, readonly: true,  required: false, loading: false, skeleton: false, errors: [],                  hint: 'Readonly — value cannot be changed.' };
      case 'disabled':  return { disabled: true,  readonly: false, required: false, loading: false, skeleton: false, errors: [],                  hint: '' };
      case 'required':  return { disabled: false, readonly: false, required: true,  loading: false, skeleton: false, errors: [],                  hint: 'This field is required.' };
      case 'error':     return { disabled: false, readonly: false, required: true,  loading: false, skeleton: false, errors: ['This field is required.', 'Please enter a valid value.'], hint: '' };
      case 'loading':   return { disabled: false, readonly: false, required: false, loading: true,  skeleton: false, errors: [],                  hint: 'Saving...' };
      case 'skeleton':  return { disabled: false, readonly: false, required: false, loading: false, skeleton: true,  errors: [],                  hint: '' };
      case 'rtl':       return { disabled: false, readonly: false, required: false, loading: false, skeleton: false, errors: [],                  hint: 'هذا الحقل للكتابة.' };
      case 'dark':      return { disabled: false, readonly: false, required: false, loading: false, skeleton: false, errors: [],                  hint: 'Dark theme active.' };
      case 'mobile':    return { disabled: false, readonly: false, required: false, loading: false, skeleton: false, errors: [],                  hint: 'Mobile viewport.' };
      case 'desktop':   return { disabled: false, readonly: false, required: false, loading: false, skeleton: false, errors: [],                  hint: 'Desktop viewport.' };
      default:          return { disabled: false, readonly: false, required: false, loading: false, skeleton: false, errors: [],                  hint: 'Example hint text.' };
    }
  });

  setScenario(scenario: PlaygroundScenario): void {
    this.currentScenario.set(scenario);
  }
}
