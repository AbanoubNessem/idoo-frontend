import { ChangeDetectionStrategy, Component, computed, ElementRef, ViewChild, afterNextRender } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, TextareaFieldConfig } from '../../component.types';

@Component({
  selector: 'platform-textarea-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
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
          <div class="pf-skeleton-textarea"></div>
        </div>
      } @else {
        <mat-form-field class="pf-form-field" appearance="outline">
          <mat-label>{{ label() }}@if (required()) {<span class="pf-required" aria-hidden="true"> *</span>}</mat-label>
          @if (prefixIcon()) {
            <mat-icon matPrefix aria-hidden="true">{{ prefixIcon() }}</mat-icon>
          }
          <textarea
            #textareaEl
            matInput
            [id]="fieldId()"
            [value]="value() ?? ''"
            [disabled]="isDisabled()"
            [readOnly]="readonly()"
            [placeholder]="placeholder()"
            [rows]="rows()"
            [attr.maxlength]="taConfig().maxLength ?? null"
            [attr.aria-label]="effectiveAriaLabel()"
            [attr.aria-required]="required()"
            [attr.aria-invalid]="hasErrors()"
            [attr.aria-describedby]="hasErrors() ? errorId() : (hint() ? hintId() : null)"
            [style.resize]="taConfig().autoResize ? 'none' : 'vertical'"
            (input)="handleTextInput($event)"
            (blur)="onBlur()"
            (focus)="onFocus()"
          ></textarea>
          @if (loading()) {
            <mat-progress-spinner matSuffix diameter="18" mode="indeterminate" aria-hidden="true"/>
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
    .pf-skeleton-wrap { display: flex; flex-direction: column; gap: 6px; }
    .pf-skeleton-label { height: 14px; width: 40%; border-radius: 4px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    .pf-skeleton-textarea { height: 112px; border-radius: var(--platform-border-radius-md, 6px); background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s 0.1s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    .pf-required { color: var(--platform-color-error, #ef4444); margin-left: 2px; }
  `],
})
export class PlatformTextareaFieldComponent extends BaseFieldComponent<string> {
  override readonly componentKey = 'platform-textarea-field';
  override readonly fieldType: ComponentFieldType = 'textarea';

  @ViewChild('textareaEl') private textareaEl?: ElementRef<HTMLTextAreaElement>;

  protected taConfig(): TextareaFieldConfig { return this.config() as TextareaFieldConfig; }
  protected rows = computed(() => this.taConfig().rows ?? 4);
}
