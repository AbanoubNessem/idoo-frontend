import { ChangeDetectionStrategy, Component, computed, ElementRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, FileValue, ImageFieldConfig } from '../../component.types';

@Component({
  selector: 'platform-image-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatProgressSpinnerModule, MatButtonModule],
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
          <div class="pf-skeleton-image"></div>
        </div>
      } @else {
        <div class="pf-image-container">
          <label class="pf-field-label">
            {{ label() }}@if (required()) {<span class="pf-required" aria-hidden="true"> *</span>}
          </label>
          <div
            class="pf-image-zone"
            [class.pf-image-zone--has-image]="!!previewUrl()"
            [class.pf-image-zone--disabled]="isDisabled() || readonly()"
            [class.pf-image-zone--error]="hasErrors()"
            [style.width.px]="imgConfig().previewWidth ?? 200"
            [style.height.px]="imgConfig().previewHeight ?? 200"
            [attr.role]="'button'"
            [attr.tabindex]="isDisabled() ? -1 : 0"
            [attr.aria-label]="effectiveAriaLabel() || 'Upload image'"
            (click)="!isDisabled() && !readonly() && fileInput.click()"
            (keydown.enter)="!isDisabled() && !readonly() && fileInput.click()"
          >
            @if (loading()) {
              <mat-progress-spinner diameter="32" mode="indeterminate" aria-hidden="true"/>
            } @else if (previewUrl()) {
              <img [src]="previewUrl()" [alt]="label() || 'Preview'" class="pf-preview-img"/>
              @if (!isDisabled() && !readonly()) {
                <div class="pf-image-overlay">
                  <button mat-icon-button (click)="removeImage($event)" aria-label="Remove image" type="button">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            } @else {
              <div class="pf-upload-prompt">
                <mat-icon aria-hidden="true">add_photo_alternate</mat-icon>
                <span>{{ placeholder() || 'Upload image' }}</span>
              </div>
            }
          </div>
          <input #fileInput type="file" accept="image/*" class="pf-file-input" [attr.aria-hidden]="true" (change)="onFileChange($event)"/>
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
    .pf-image-container { display: flex; flex-direction: column; gap: 8px; }
    .pf-field-label { font-size: 0.875rem; color: var(--platform-color-text-primary, #1e293b); font-weight: 500; }
    .pf-image-zone {
      position: relative; border: 2px dashed var(--platform-color-border, #e2e8f0);
      border-radius: var(--platform-border-radius-md, 6px); cursor: pointer; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      background: var(--platform-color-surface, #fff); transition: border-color 0.15s;
    }
    .pf-image-zone:hover:not(.pf-image-zone--disabled) { border-color: var(--platform-color-primary, #2563eb); }
    .pf-image-zone--disabled { cursor: not-allowed; opacity: 0.38; }
    .pf-image-zone--error { border-color: var(--platform-color-error, #ef4444); }
    .pf-image-zone--has-image { border-style: solid; }
    .pf-preview-img { width: 100%; height: 100%; object-fit: cover; }
    .pf-image-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.15s;
    }
    .pf-image-zone:hover .pf-image-overlay { opacity: 1; }
    .pf-upload-prompt { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--platform-color-text-secondary, #64748b); font-size: 0.75rem; }
    .pf-file-input { display: none; }
    .pf-hint { font-size: 0.75rem; color: var(--platform-color-text-secondary, #64748b); }
    .pf-error { font-size: 0.75rem; color: var(--platform-color-error, #ef4444); }
    .pf-required { color: var(--platform-color-error, #ef4444); margin-left: 2px; }
    .pf-skeleton-label { height: 14px; width: 40%; border-radius: 4px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    .pf-skeleton-image { width: 200px; height: 200px; border-radius: var(--platform-border-radius-md, 6px); background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s 0.1s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  `],
})
export class PlatformImageFieldComponent extends BaseFieldComponent<FileValue | null> {
  override readonly componentKey = 'platform-image-field';
  override readonly fieldType: ComponentFieldType = 'image';

  @ViewChild('fileInput') protected fileInput!: ElementRef<HTMLInputElement>;

  protected imgConfig(): ImageFieldConfig { return this.config() as ImageFieldConfig; }

  protected previewUrl = computed<string | null>(() => {
    const v = this.value();
    if (!v) return null;
    if (v.url) return v.url;
    if (v.file) return URL.createObjectURL(v.file);
    return null;
  });

  protected onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.value.set({ name: file.name, size: file.size, type: file.type, file });
  }

  protected removeImage(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
  }
}
