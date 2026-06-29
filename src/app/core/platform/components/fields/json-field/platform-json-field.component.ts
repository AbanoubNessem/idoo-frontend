import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, JsonFieldConfig } from '../../component.types';

@Component({
  selector: 'platform-json-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule],
  template: `
    <div
      class="pf-field-host"
      [class.pf-skeleton]="skeleton()"
      [class.pf-loading]="loading()"
      [class.pf-disabled]="isDisabled()"
      [class.pf-readonly]="readonly()"
      [class.pf-has-error]="hasErrors() || !!_parseError()"
      [attr.data-density]="effectiveDensity()"
    >
      @if (skeleton()) {
        <div class="pf-skeleton-wrap" role="status" aria-label="Loading field">
          <div class="pf-skeleton-label"></div>
          <div class="pf-skeleton-editor"></div>
        </div>
      } @else {
        <div class="pf-json-container">
          <div class="pf-json-header">
            <label class="pf-json-label" [attr.for]="fieldId()">
              {{ label() }}@if (required()) {<span class="pf-required" aria-hidden="true"> *</span>}
            </label>
            <div class="pf-json-actions">
              @if (!isDisabled() && !readonly()) {
                <button mat-icon-button type="button" (click)="formatJson()" aria-label="Format JSON" [disabled]="!!_parseError()">
                  <mat-icon>code</mat-icon>
                </button>
              }
              @if (loading()) {
                <mat-progress-spinner diameter="20" mode="indeterminate" aria-hidden="true"/>
              }
            </div>
          </div>
          <div class="pf-editor-wrap" [style.height]="jsonConfig().height ?? '200px'">
            <textarea
              [id]="fieldId()"
              class="pf-json-editor"
              [value]="rawText()"
              [disabled]="isDisabled()"
              [readOnly]="readonly()"
              [attr.aria-label]="effectiveAriaLabel()"
              [attr.aria-required]="required()"
              [attr.aria-invalid]="hasErrors() || !!_parseError()"
              [attr.aria-describedby]="hasErrors() ? errorId() : (hint() ? hintId() : null)"
              spellcheck="false"
              autocomplete="off"
              (input)="onJsonInput($event)"
              (blur)="onBlur()"
              (focus)="onFocus()"
            ></textarea>
          </div>
          @if (_parseError()) {
            <div class="pf-parse-error" role="alert">{{ _parseError() }}</div>
          }
          @if (hint()) { <div class="pf-hint" [id]="hintId()">{{ hint() }}</div> }
          @for (e of errors(); track $index) {
            <div class="pf-error" [id]="$index === 0 ? errorId() : null" role="alert">{{ e }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pf-json-container { display: flex; flex-direction: column; gap: 4px; }
    .pf-json-header { display: flex; align-items: center; justify-content: space-between; }
    .pf-json-label { font-size: 0.875rem; font-weight: 500; color: var(--platform-color-text-primary, #1e293b); }
    .pf-json-actions { display: flex; align-items: center; }
    .pf-editor-wrap { border: 1px solid var(--platform-color-border, #e2e8f0); border-radius: var(--platform-border-radius-md, 6px); overflow: auto; }
    .pf-json-editor {
      width: 100%; height: 100%; padding: 12px; resize: none; border: none; outline: none;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.8125rem; line-height: 1.6;
      background: var(--platform-color-surface, #fff);
      color: var(--platform-color-text-primary, #1e293b);
      box-sizing: border-box;
    }
    .pf-json-editor:disabled { opacity: 0.38; cursor: not-allowed; }
    .pf-parse-error { font-size: 0.75rem; color: var(--platform-color-error, #ef4444); }
    .pf-hint { font-size: 0.75rem; color: var(--platform-color-text-secondary, #64748b); }
    .pf-error { font-size: 0.75rem; color: var(--platform-color-error, #ef4444); }
    .pf-required { color: var(--platform-color-error, #ef4444); margin-left: 2px; }
    .pf-skeleton-wrap { display: flex; flex-direction: column; gap: 6px; }
    .pf-skeleton-label { height: 14px; width: 40%; border-radius: 4px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    .pf-skeleton-editor { height: 200px; border-radius: var(--platform-border-radius-md, 6px); background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s 0.1s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  `],
})
export class PlatformJsonFieldComponent extends BaseFieldComponent<unknown> {
  override readonly componentKey = 'platform-json-field';
  override readonly fieldType: ComponentFieldType = 'json';

  protected readonly _parseError = signal<string | null>(null);

  protected jsonConfig(): JsonFieldConfig { return this.config() as JsonFieldConfig; }

  protected rawText = computed(() => {
    const v = this.value();
    if (v == null) return '';
    try { return JSON.stringify(v, null, 2); } catch { return ''; }
  });

  protected onJsonInput(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    if (!text.trim()) {
      this._parseError.set(null);
      this.value.set(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      this._parseError.set(null);
      this.value.set(parsed);
    } catch (err: unknown) {
      this._parseError.set(`Invalid JSON: ${(err as Error).message}`);
    }
  }

  protected formatJson(): void {
    const v = this.value();
    if (v != null && !this._parseError()) {
      this.value.set(JSON.parse(JSON.stringify(v)));
    }
  }
}
