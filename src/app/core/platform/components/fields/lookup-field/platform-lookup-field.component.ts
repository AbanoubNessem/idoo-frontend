import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, LookupFieldConfig, LookupResult } from '../../component.types';

@Component({
  selector: 'platform-lookup-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div
      class="pf-field-host"
      [class.pf-skeleton]="skeleton()"
      [class.pf-loading]="loading() || _searching()"
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
          <mat-icon matPrefix aria-hidden="true">search</mat-icon>
          <input
            matInput
            [id]="fieldId()"
            [matAutocomplete]="auto"
            [value]="displayValue()"
            [disabled]="isDisabled()"
            [readOnly]="readonly()"
            [placeholder]="placeholder() || 'Search...'"
            [attr.aria-label]="effectiveAriaLabel()"
            [attr.aria-required]="required()"
            [attr.aria-invalid]="hasErrors()"
            [attr.aria-describedby]="hasErrors() ? errorId() : (hint() ? hintId() : null)"
            (input)="handleSearchInput($event)"
            (blur)="onBlur()"
            (focus)="onFocus()"
          />
          @if (loading() || _searching()) {
            <mat-progress-spinner matSuffix diameter="18" mode="indeterminate" aria-hidden="true"/>
          } @else if (displayValue()) {
            <button matSuffix class="pf-clear-btn" (click)="clearValue()" aria-label="Clear selection" type="button">
              <mat-icon aria-hidden="true">close</mat-icon>
            </button>
          }
          <mat-autocomplete #auto [displayWith]="displayFn" (optionSelected)="onOptionSelected($event.option.value)">
            @for (result of _results(); track result.id) {
              <mat-option [value]="result">
                @if (result.icon) { <mat-icon aria-hidden="true">{{ result.icon }}</mat-icon> }
                <span class="pf-lookup-label">{{ result.label }}</span>
                @if (result.description) {
                  <span class="pf-lookup-desc">{{ result.description }}</span>
                }
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
    .pf-clear-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; color: var(--platform-color-text-secondary, #64748b); }
    .pf-lookup-label { display: block; }
    .pf-lookup-desc { display: block; font-size: 0.75rem; color: var(--platform-color-text-secondary, #64748b); }
  `],
})
export class PlatformLookupFieldComponent extends BaseFieldComponent<LookupResult | null> {
  override readonly componentKey = 'platform-lookup-field';
  override readonly fieldType: ComponentFieldType = 'lookup';

  protected readonly _results  = signal<LookupResult[]>([]);
  protected readonly _searching = signal(false);
  private _searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected lookupConfig(): LookupFieldConfig { return this.config() as unknown as LookupFieldConfig; }

  protected displayValue = computed(() => this.value()?.label ?? '');

  protected displayFn = (result: LookupResult | null) => result?.label ?? '';

  protected handleSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    if (this._searchTimer) clearTimeout(this._searchTimer);
    const debounce = this.lookupConfig().searchDebounce ?? 300;
    const minLen   = this.lookupConfig().minSearchLength ?? 1;

    if (query.length < minLen) {
      this._results.set([]);
      return;
    }

    this._searching.set(true);
    this._searchTimer = setTimeout(() => {
      this._searching.set(false);
    }, debounce);
  }

  protected onOptionSelected(result: LookupResult): void {
    this.value.set(result);
  }

  protected clearValue(): void {
    this.value.set(null);
    this._results.set([]);
  }

  /** Allows parent to inject search results (from an async data source). */
  setResults(results: LookupResult[]): void {
    this._results.set(results);
    this._searching.set(false);
  }
}
