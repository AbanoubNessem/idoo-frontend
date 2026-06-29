import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, AutocompleteFieldConfig, SelectOption } from '../../component.types';

@Component({
  selector: 'platform-autocomplete-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div
      class="pf-field-host"
      [class.pf-skeleton]="skeleton()"
      [class.pf-loading]="loading()"
      [class.pf-disabled]="isDisabled()"
      [class.pf-readonly]="readonly()"
      [class.pf-has-error]="hasErrors()"
      [attr.data-density]="effectiveDensity()"
    >
      @if (skeleton()) {
        <div class="pf-skeleton-wrap" role="status" aria-label="Loading field">
          <div class="pf-skeleton-label"></div>
          <div class="pf-skeleton-control"></div>
        </div>
      } @else {
        <mat-form-field class="pf-form-field" appearance="outline">
          <mat-label>{{ label() }}@if (required()) {<span class="pf-required" aria-hidden="true"> *</span>}</mat-label>
          @if (prefixIcon()) {
            <mat-icon matPrefix aria-hidden="true">{{ prefixIcon() }}</mat-icon>
          }
          <input
            matInput
            [id]="fieldId()"
            [matAutocomplete]="auto"
            [value]="textValue()"
            [disabled]="isDisabled()"
            [readOnly]="readonly()"
            [placeholder]="placeholder()"
            [attr.aria-label]="effectiveAriaLabel()"
            [attr.aria-required]="required()"
            [attr.aria-invalid]="hasErrors()"
            [attr.aria-describedby]="hasErrors() ? errorId() : (hint() ? hintId() : null)"
            (input)="onTextInput($event)"
            (blur)="onBlur()"
            (focus)="onFocus()"
          />
          @if (loading()) {
            <mat-progress-spinner matSuffix diameter="18" mode="indeterminate" aria-hidden="true"/>
          } @else if (suffixIcon()) {
            <mat-icon matSuffix aria-hidden="true">{{ suffixIcon() }}</mat-icon>
          }
          <mat-autocomplete #auto (optionSelected)="onSelect($event.option.value)">
            @for (opt of filteredOptions(); track opt.value) {
              <mat-option [value]="opt.value" [disabled]="opt.disabled ?? false">
                @if (opt.icon) { <mat-icon aria-hidden="true">{{ opt.icon }}</mat-icon> }
                {{ opt.label }}
              </mat-option>
            }
          </mat-autocomplete>
          @for (e of errors(); track $index) {
            <mat-error [attr.id]="$index === 0 ? errorId() : null">{{ e }}</mat-error>
          }
          @if (hint()) {
            <mat-hint [id]="hintId()">{{ hint() }}</mat-hint>
          }
        </mat-form-field>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pf-form-field { width: 100%; }
    .pf-skeleton-wrap { display: flex; flex-direction: column; gap: 6px; }
    .pf-skeleton-label { height: 14px; width: 40%; border-radius: 4px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    .pf-skeleton-control { height: 56px; border-radius: var(--platform-border-radius-md, 6px); background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s 0.1s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    .pf-required { color: var(--platform-color-error, #ef4444); margin-left: 2px; }
  `],
})
export class PlatformAutocompleteFieldComponent extends BaseFieldComponent<unknown> {
  override readonly componentKey = 'platform-autocomplete-field';
  override readonly fieldType: ComponentFieldType = 'autocomplete';

  private readonly _search = signal('');

  protected acConfig(): AutocompleteFieldConfig { return this.config() as unknown as AutocompleteFieldConfig; }

  protected textValue = computed(() => {
    const v = this.value();
    if (v == null) return '';
    const opts = this.acConfig().options ?? [];
    return opts.find(o => o.value === v)?.label ?? String(v);
  });

  protected filteredOptions = computed<SelectOption[]>(() => {
    const search = this._search().toLowerCase();
    const opts   = this.acConfig().options ?? [];
    const minLen = this.acConfig().minSearchLength ?? 0;
    if (search.length < minLen) return opts;
    return opts.filter(o => o.label.toLowerCase().includes(search));
  });

  protected onTextInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this._search.set(val);
    if (this.acConfig().freeText) {
      this.value.set(val as unknown);
    }
  }

  protected onSelect(val: unknown): void {
    this.value.set(val);
    const opt = (this.acConfig().options ?? []).find(o => o.value === val);
    this._search.set(opt?.label ?? String(val));
  }
}
