import {
  Component, Input, ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldType, RenderMode } from '../rendering.types';

@Component({
  selector: 'platform-field-display',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!hidden) {
      <div class="pf-field" [class.pf-field--required]="required" [class.pf-field--disabled]="disabled">
        @if (label) {
          <label class="pf-field__label">
            {{ label }}
            @if (required) { <span class="pf-field__required" aria-hidden="true">*</span> }
          </label>
        }
        <div class="pf-field__value" [attr.data-field-type]="fieldType">
          {{ displayValue() }}
        </div>
      </div>
    }
  `,
  styles: [`
    .pf-field { display: flex; flex-direction: column; gap: 4px; }
    .pf-field__label { font-size: 0.75rem; font-weight: 500; color: rgba(0,0,0,.6); }
    .pf-field__required { color: red; margin-left: 2px; }
    .pf-field__value { font-size: 0.875rem; color: rgba(0,0,0,.87); min-height: 1.25rem; }
    .pf-field--disabled .pf-field__value { color: rgba(0,0,0,.38); }
  `],
})
export class FieldDisplayComponent {
  @Input() label = '';
  @Input() value: unknown = null;
  @Input() fieldType: FieldType | string = 'text';
  @Input() mode: RenderMode = 'display';
  @Input() required = false;
  @Input() disabled = false;
  @Input() hidden = false;
  @Input() config: Record<string, unknown> = {};

  readonly displayValue = computed(() => this.formatValue(this.value));

  private formatValue(val: unknown): string {
    if (val === null || val === undefined || val === '') return '—';

    switch (this.fieldType) {
      case 'boolean':
        return val ? 'Yes' : 'No';

      case 'date':
        try { return new Date(val as string).toLocaleDateString(); }
        catch { return String(val); }

      case 'datetime':
        try { return new Date(val as string).toLocaleString(); }
        catch { return String(val); }

      case 'time':
        return String(val);

      case 'currency': {
        const currency = (this.config['currency'] as string) ?? 'USD';
        const locale = (this.config['locale'] as string) ?? 'en-US';
        try { return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(val)); }
        catch { return String(val); }
      }

      case 'number': {
        const decimals = (this.config['decimals'] as number) ?? 0;
        try { return Number(val).toFixed(decimals); }
        catch { return String(val); }
      }

      case 'select':
      case 'lookup':
      case 'autocomplete': {
        const options = this.config['options'] as Array<{ value: unknown; label: string }> | undefined;
        const found = options?.find(o => o.value === val);
        return found?.label ?? String(val);
      }

      case 'file':
      case 'image':
      case 'avatar':
        return typeof val === 'string' ? val.split('/').pop() ?? val : String(val);

      case 'json':
        try { return JSON.stringify(val, null, 2); }
        catch { return String(val); }

      case 'chip':
      case 'badge':
        return Array.isArray(val) ? (val as unknown[]).map(String).join(', ') : String(val);

      default:
        return String(val);
    }
  }
}
