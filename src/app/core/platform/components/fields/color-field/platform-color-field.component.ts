import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, ColorFieldConfig } from '../../component.types';

@Component({
  selector: 'platform-color-field',
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
          <div class="pf-skeleton-color-row">
            <div class="pf-skeleton-swatch"></div>
            <div class="pf-skeleton-input"></div>
          </div>
        </div>
      } @else {
        <mat-form-field class="pf-form-field" appearance="outline">
          <mat-label>{{ label() }}@if (required()) {<span class="pf-required" aria-hidden="true"> *</span>}</mat-label>
          <div matPrefix class="pf-color-swatch-wrap">
            <div
              class="pf-color-swatch"
              [style.background-color]="value() || '#000000'"
              (click)="!isDisabled() && !readonly() && colorInput.click()"
              [attr.aria-label]="'Color preview: ' + (value() || 'none')"
              role="button"
              [attr.tabindex]="isDisabled() ? -1 : 0"
            ></div>
            <input
              #colorInput
              type="color"
              class="pf-native-color"
              [value]="value() || '#000000'"
              [disabled]="isDisabled()"
              (input)="onColorInput($event)"
              [attr.aria-hidden]="true"
            />
          </div>
          <input
            matInput
            type="text"
            [id]="fieldId()"
            [value]="value() ?? ''"
            [disabled]="isDisabled()"
            [readOnly]="readonly()"
            [placeholder]="placeholder() || '#000000'"
            [attr.pattern]="hexPattern"
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
          }
          @if (colorPresets().length) {
            <div class="pf-presets">
              @for (preset of colorPresets(); track preset) {
                <button
                  type="button"
                  class="pf-preset-btn"
                  [style.background-color]="preset"
                  [attr.aria-label]="'Select color ' + preset"
                  [class.pf-preset-btn--active]="value() === preset"
                  (click)="selectPreset(preset)"
                ></button>
              }
            </div>
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
    .pf-color-swatch-wrap { position: relative; display: flex; align-items: center; margin-right: 8px; }
    .pf-color-swatch { width: 24px; height: 24px; border-radius: 4px; border: 2px solid var(--platform-color-border, #e2e8f0); cursor: pointer; transition: border-color 0.15s; }
    .pf-color-swatch:hover { border-color: var(--platform-color-primary, #2563eb); }
    .pf-native-color { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
    .pf-presets { display: flex; gap: 6px; flex-wrap: wrap; padding: 8px 0 4px; }
    .pf-preset-btn {
      width: 20px; height: 20px; border-radius: 50%; border: 2px solid transparent;
      cursor: pointer; transition: border-color 0.1s, transform 0.1s; padding: 0;
    }
    .pf-preset-btn:hover { transform: scale(1.15); }
    .pf-preset-btn--active { border-color: var(--platform-color-primary, #2563eb); }
    .pf-required { color: var(--platform-color-error, #ef4444); margin-left: 2px; }
    .pf-skeleton-wrap { display: flex; flex-direction: column; gap: 6px; }
    .pf-skeleton-label { height: 14px; width: 40%; border-radius: 4px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    .pf-skeleton-color-row { display: flex; gap: 8px; align-items: center; }
    .pf-skeleton-swatch { width: 40px; height: 40px; border-radius: 6px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; flex-shrink: 0; }
    .pf-skeleton-input { flex: 1; height: 56px; border-radius: var(--platform-border-radius-md, 6px); background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s 0.1s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  `],
})
export class PlatformColorFieldComponent extends BaseFieldComponent<string> {
  override readonly componentKey = 'platform-color-field';
  override readonly fieldType: ComponentFieldType = 'color';

  readonly hexPattern = '^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$';

  protected colorConfig(): ColorFieldConfig { return this.config() as ColorFieldConfig; }
  protected colorPresets = computed<string[]>(() => this.colorConfig().presets ?? []);

  protected onColorInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected selectPreset(color: string): void {
    if (!this.isDisabled() && !this.readonly()) {
      this.value.set(color);
    }
  }
}
