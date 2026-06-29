import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType } from '../../component.types';

export type BadgeColor = 'primary' | 'accent' | 'warn' | 'info' | 'success';

@Component({
  selector: 'platform-badge-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule, MatBadgeModule],
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
          <div class="pf-skeleton-badge-row">
            <div class="pf-skeleton-control"></div>
            <div class="pf-skeleton-badge"></div>
          </div>
        </div>
      } @else {
        <mat-form-field class="pf-form-field" appearance="outline">
          <mat-label>{{ label() }}@if (required()) {<span class="pf-required" aria-hidden="true"> *</span>}</mat-label>
          @if (prefixIcon()) {
            <mat-icon matPrefix aria-hidden="true">{{ prefixIcon() }}</mat-icon>
          }
          <input
            matInput
            type="text"
            [id]="fieldId()"
            [value]="value() ?? ''"
            [disabled]="isDisabled()"
            [readOnly]="readonly()"
            [placeholder]="placeholder()"
            [attr.maxlength]="config()['maxLength'] ?? null"
            [attr.aria-label]="effectiveAriaLabel()"
            [attr.aria-required]="required()"
            [attr.aria-invalid]="hasErrors()"
            [attr.aria-describedby]="hasErrors() ? errorId() : (hint() ? hintId() : null)"
            (input)="handleTextInput($event)"
            (blur)="onBlur()"
            (focus)="onFocus()"
          />
          @if (loading()) {
            <mat-progress-spinner matSuffix diameter="18" mode="indeterminate" aria-hidden="true"/>
          } @else if (badgeValue()) {
            <span
              matSuffix
              class="pf-badge"
              [class]="'pf-badge--' + badgeColor()"
              [attr.aria-label]="'Badge: ' + badgeValue()"
            >{{ badgeValue() }}</span>
          } @else if (suffixIcon()) {
            <mat-icon matSuffix aria-hidden="true">{{ suffixIcon() }}</mat-icon>
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
    .pf-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 20px; border-radius: 10px;
      padding: 0 6px; font-size: 0.75rem; font-weight: 600; line-height: 1;
    }
    .pf-badge--primary  { background: var(--platform-color-primary, #2563eb); color: #fff; }
    .pf-badge--accent   { background: var(--platform-color-secondary, #7c3aed); color: #fff; }
    .pf-badge--warn     { background: var(--platform-color-warning, #f59e0b); color: #fff; }
    .pf-badge--info     { background: var(--platform-color-info, #0ea5e9); color: #fff; }
    .pf-badge--success  { background: var(--platform-color-success, #10b981); color: #fff; }
    .pf-required { color: var(--platform-color-error, #ef4444); margin-left: 2px; }
    .pf-skeleton-wrap { display: flex; flex-direction: column; gap: 6px; }
    .pf-skeleton-label { height: 14px; width: 40%; border-radius: 4px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    .pf-skeleton-badge-row { display: flex; align-items: center; gap: 8px; }
    .pf-skeleton-control { flex: 1; height: 56px; border-radius: var(--platform-border-radius-md, 6px); background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s 0.1s infinite linear; }
    .pf-skeleton-badge { width: 40px; height: 20px; border-radius: 10px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s 0.2s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  `],
})
export class PlatformBadgeFieldComponent extends BaseFieldComponent<string> {
  override readonly componentKey = 'platform-badge-field';
  override readonly fieldType: ComponentFieldType = 'badge';

  protected badgeValue  = computed<string>(() => String(this.config()['badgeValue'] ?? ''));
  protected badgeColor  = computed<BadgeColor>(() => (this.config()['badgeColor'] as BadgeColor) ?? 'primary');
}
