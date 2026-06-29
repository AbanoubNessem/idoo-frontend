import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, DateFieldConfig } from '../../component.types';

@Component({
  selector: 'platform-date-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule, MatInputModule, MatDatepickerModule,
    MatNativeDateModule, MatIconModule, MatProgressSpinnerModule,
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
            [matDatepicker]="picker"
            [id]="fieldId()"
            [value]="dateValue()"
            [disabled]="isDisabled()"
            [readOnly]="readonly()"
            [min]="minDate()"
            [max]="maxDate()"
            [placeholder]="placeholder() || dateConfig().dateFormat || 'MM/DD/YYYY'"
            [attr.aria-label]="effectiveAriaLabel()"
            [attr.aria-required]="required()"
            [attr.aria-invalid]="hasErrors()"
            [attr.aria-describedby]="hasErrors() ? errorId() : (hint() ? hintId() : null)"
            (dateChange)="handleDateChange($event)"
            (blur)="onBlur()"
            (focus)="onFocus()"
          />
          @if (!readonly() && !isDisabled()) {
            <mat-datepicker-toggle matIconSuffix [for]="picker" aria-label="Open date picker"/>
          }
          @if (loading()) {
            <mat-progress-spinner matSuffix diameter="18" mode="indeterminate" aria-hidden="true"/>
          }
          <mat-datepicker #picker/>
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
export class PlatformDateFieldComponent extends BaseFieldComponent<string> {
  override readonly componentKey = 'platform-date-field';
  override readonly fieldType: ComponentFieldType = 'date';

  protected dateConfig(): DateFieldConfig {
    return this.config() as DateFieldConfig;
  }

  protected dateValue(): Date | null {
    const v = this.value();
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  protected minDate(): Date | null {
    const min = this.dateConfig().minDate;
    if (!min) return null;
    const d = new Date(min);
    return isNaN(d.getTime()) ? null : d;
  }

  protected maxDate(): Date | null {
    const max = this.dateConfig().maxDate;
    if (!max) return null;
    const d = new Date(max);
    return isNaN(d.getTime()) ? null : d;
  }

  protected handleDateChange(event: { value: Date | null }): void {
    const d = event.value;
    this.value.set(d ? d.toISOString().split('T')[0] : null);
  }
}
