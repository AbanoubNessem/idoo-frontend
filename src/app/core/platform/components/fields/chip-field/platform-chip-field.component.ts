import { ChangeDetectionStrategy, Component, computed, ElementRef, ViewChild, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, ChipFieldConfig, ChipValue } from '../../component.types';

@Component({
  selector: 'platform-chip-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule, MatChipsModule, MatIconModule,
    MatProgressSpinnerModule, MatAutocompleteModule, MatInputModule,
  ],
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
          <div class="pf-skeleton-chips">
            <div class="pf-skeleton-chip"></div>
            <div class="pf-skeleton-chip"></div>
            <div class="pf-skeleton-chip"></div>
          </div>
        </div>
      } @else {
        <mat-form-field class="pf-form-field" appearance="outline">
          <mat-label>{{ label() }}@if (required()) {<span class="pf-required" aria-hidden="true"> *</span>}</mat-label>
          <mat-chip-grid #chipGrid [attr.aria-label]="effectiveAriaLabel()" [attr.aria-required]="required()" [attr.aria-invalid]="hasErrors()">
            @for (chip of chips(); track chip.value) {
              <mat-chip-row
                [removable]="(!isDisabled() && !readonly()) && (chip.removable !== false)"
                (removed)="removeChip(chip)"
                [attr.aria-label]="chip.label ?? chip.value"
              >
                {{ chip.label ?? chip.value }}
                @if (!isDisabled() && !readonly() && chip.removable !== false) {
                  <button matChipRemove [attr.aria-label]="'Remove ' + (chip.label ?? chip.value)" type="button">
                    <mat-icon>cancel</mat-icon>
                  </button>
                }
              </mat-chip-row>
            }
            @if (!isDisabled() && !readonly() && !maxReached()) {
              <input
                #chipInput
                [matChipInputFor]="chipGrid"
                [matChipInputSeparatorKeyCodes]="separatorKeys"
                [placeholder]="placeholder() || 'Add tag...'"
                [matAutocomplete]="chipAuto"
                [attr.aria-describedby]="hasErrors() ? errorId() : (hint() ? hintId() : null)"
                (matChipInputTokenEnd)="addChip($event)"
              />
            }
          </mat-chip-grid>
          <mat-autocomplete #chipAuto (optionSelected)="addFromSuggestion($event.option.value)">
            @for (s of filteredSuggestions(); track s) {
              <mat-option [value]="s">{{ s }}</mat-option>
            }
          </mat-autocomplete>
          @if (loading()) {
            <mat-progress-spinner matSuffix diameter="18" mode="indeterminate" aria-hidden="true"/>
          }
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
    .pf-required { color: var(--platform-color-error, #ef4444); margin-left: 2px; }
    .pf-skeleton-wrap { display: flex; flex-direction: column; gap: 6px; }
    .pf-skeleton-label { height: 14px; width: 40%; border-radius: 4px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    .pf-skeleton-chips { display: flex; gap: 8px; }
    .pf-skeleton-chip { height: 32px; width: 80px; border-radius: 16px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  `],
})
export class PlatformChipFieldComponent extends BaseFieldComponent<ChipValue[]> {
  override readonly componentKey = 'platform-chip-field';
  override readonly fieldType: ComponentFieldType = 'chip';

  @ViewChild('chipInput') private chipInput?: ElementRef<HTMLInputElement>;

  readonly separatorKeys = [ENTER, COMMA];

  protected chipConfig(): ChipFieldConfig { return this.config() as ChipFieldConfig; }
  protected chips = computed(() => this.value() ?? []);
  protected maxReached = computed(() => {
    const max = this.chipConfig().maxChips;
    return max != null && this.chips().length >= max;
  });

  protected filteredSuggestions = computed<string[]>(() => {
    const existing = new Set(this.chips().map(c => c.value));
    return (this.chipConfig().suggestions ?? []).filter(s => !existing.has(s));
  });

  protected addChip(event: { value: string; chipInput: { clear(): void } }): void {
    const val = (event.value ?? '').trim();
    if (!val || this.maxReached()) return;
    const current = this.chips();
    if (!current.find(c => c.value === val)) {
      this.value.set([...current, { value: val, removable: true }]);
    }
    event.chipInput.clear();
  }

  protected addFromSuggestion(val: string): void {
    if (!val || this.maxReached()) return;
    const current = this.chips();
    if (!current.find(c => c.value === val)) {
      this.value.set([...current, { value: val, removable: true }]);
    }
    if (this.chipInput?.nativeElement) this.chipInput.nativeElement.value = '';
  }

  protected removeChip(chip: ChipValue): void {
    this.value.set(this.chips().filter(c => c.value !== chip.value));
  }
}
