import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType } from '../../component.types';

@Component({
  selector: 'platform-switch-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule, MatProgressSpinnerModule],
  template: `
    <div
      class="pf-field-host"
      [class.pf-skeleton]="skeleton()"
      [class.pf-loading]="loading()"
      [class.pf-disabled]="isDisabled()"
      [class.pf-has-error]="hasErrors()"
      [attr.data-density]="effectiveDensity()"
    >
      @if (skeleton()) {
        <div class="pf-skeleton-wrap" role="status" aria-label="Loading field">
          <div class="pf-skeleton-toggle-row">
            <div class="pf-skeleton-label"></div>
            <div class="pf-skeleton-track"></div>
          </div>
        </div>
      } @else {
        <div class="pf-switch-container">
          @if (loading()) {
            <mat-progress-spinner diameter="20" mode="indeterminate" aria-hidden="true"/>
          } @else {
            <mat-slide-toggle
              [id]="fieldId()"
              [checked]="!!value()"
              [disabled]="isDisabled() || readonly()"
              [required]="required()"
              [attr.aria-label]="effectiveAriaLabel()"
              [attr.aria-required]="required()"
              [attr.aria-invalid]="hasErrors()"
              [attr.aria-describedby]="hasErrors() ? errorId() : (hint() ? hintId() : null)"
              (change)="onToggleChange($event)"
              (blur)="onBlur()"
              (focus)="onFocus()"
            >
              {{ label() }}@if (required()) {<span class="pf-required" aria-hidden="true"> *</span>}
            </mat-slide-toggle>
          }
          @if (hint()) {
            <div class="pf-hint" [id]="hintId()">{{ hint() }}</div>
          }
          @for (e of errors(); track $index) {
            <div class="pf-error" [id]="$index === 0 ? errorId() : null" role="alert">{{ e }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pf-switch-container { display: flex; flex-direction: column; gap: 4px; }
    .pf-hint { font-size: 0.75rem; color: var(--platform-color-text-secondary, #64748b); padding-left: 2px; }
    .pf-error { font-size: 0.75rem; color: var(--platform-color-error, #ef4444); padding-left: 2px; }
    .pf-required { color: var(--platform-color-error, #ef4444); margin-left: 2px; }
    .pf-skeleton-wrap { padding: 4px 0; }
    .pf-skeleton-toggle-row { display: flex; align-items: center; justify-content: space-between; }
    .pf-skeleton-label { height: 14px; width: 100px; border-radius: 4px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    .pf-skeleton-track { width: 44px; height: 24px; border-radius: 12px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s 0.1s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  `],
})
export class PlatformSwitchFieldComponent extends BaseFieldComponent<boolean> {
  override readonly componentKey = 'platform-switch-field';
  override readonly fieldType: ComponentFieldType = 'switch';

  protected onToggleChange(event: { checked: boolean }): void {
    this.value.set(event.checked);
  }
}
