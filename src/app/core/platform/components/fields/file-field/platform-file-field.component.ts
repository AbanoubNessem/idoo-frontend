import { ChangeDetectionStrategy, Component, computed, ElementRef, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, FileFieldConfig, FileValue } from '../../component.types';

@Component({
  selector: 'platform-file-field',
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
      [class.pf-has-error]="hasErrors()"
      [attr.data-density]="effectiveDensity()"
    >
      @if (skeleton()) {
        <div class="pf-skeleton-wrap" role="status" aria-label="Loading field">
          <div class="pf-skeleton-label"></div>
          <div class="pf-skeleton-control"></div>
        </div>
      } @else {
        <div class="pf-file-container">
          <label class="pf-file-label">
            {{ label() }}@if (required()) {<span class="pf-required" aria-hidden="true"> *</span>}
          </label>
          <div
            class="pf-drop-zone"
            [class.pf-drop-zone--disabled]="isDisabled() || readonly()"
            [class.pf-drop-zone--error]="hasErrors()"
            (dragover)="$event.preventDefault()"
            (drop)="onDrop($event)"
            (click)="!isDisabled() && !readonly() && fileInput.click()"
            [attr.role]="'button'"
            [attr.tabindex]="isDisabled() ? -1 : 0"
            [attr.aria-label]="effectiveAriaLabel() || 'Upload file'"
            [attr.aria-disabled]="isDisabled()"
            (keydown.enter)="!isDisabled() && !readonly() && fileInput.click()"
            (keydown.space)="!isDisabled() && !readonly() && fileInput.click()"
          >
            @if (loading()) {
              <mat-progress-spinner diameter="32" mode="indeterminate" aria-hidden="true"/>
            } @else if (currentFile()) {
              <div class="pf-file-info">
                <mat-icon aria-hidden="true">attach_file</mat-icon>
                <span class="pf-file-name">{{ currentFile()!.name }}</span>
                <span class="pf-file-size">{{ formatSize(currentFile()!.size) }}</span>
                @if (!isDisabled() && !readonly()) {
                  <button mat-icon-button class="pf-remove-btn" (click)="removeFile($event)" aria-label="Remove file" type="button">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>
            } @else {
              <div class="pf-upload-prompt">
                <mat-icon aria-hidden="true">cloud_upload</mat-icon>
                <span>{{ placeholder() || 'Click or drag to upload' }}</span>
              </div>
            }
          </div>
          <input
            #fileInput
            type="file"
            class="pf-file-input"
            [accept]="fileConfig().accept ?? ''"
            [multiple]="fileConfig().multiple ?? false"
            [attr.aria-hidden]="true"
            (change)="onFileChange($event)"
          />
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
    .pf-file-container { display: flex; flex-direction: column; gap: 6px; }
    .pf-file-label { font-size: 0.875rem; color: var(--platform-color-text-primary, #1e293b); font-weight: 500; }
    .pf-drop-zone {
      border: 2px dashed var(--platform-color-border, #e2e8f0);
      border-radius: var(--platform-border-radius-md, 6px);
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s ease, background-color 0.15s ease;
      background: var(--platform-color-surface, #fff);
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pf-drop-zone:hover:not(.pf-drop-zone--disabled) { border-color: var(--platform-color-primary, #2563eb); background: var(--platform-color-primary-container, #eff6ff); }
    .pf-drop-zone--disabled { cursor: not-allowed; opacity: 0.38; }
    .pf-drop-zone--error { border-color: var(--platform-color-error, #ef4444); }
    .pf-upload-prompt { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--platform-color-text-secondary, #64748b); }
    .pf-file-info { display: flex; align-items: center; gap: 8px; color: var(--platform-color-text-primary, #1e293b); }
    .pf-file-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
    .pf-file-size { color: var(--platform-color-text-secondary, #64748b); font-size: 0.75rem; }
    .pf-file-input { display: none; }
    .pf-hint { font-size: 0.75rem; color: var(--platform-color-text-secondary, #64748b); }
    .pf-error { font-size: 0.75rem; color: var(--platform-color-error, #ef4444); }
    .pf-required { color: var(--platform-color-error, #ef4444); margin-left: 2px; }
    .pf-skeleton-wrap { display: flex; flex-direction: column; gap: 6px; }
    .pf-skeleton-label { height: 14px; width: 40%; border-radius: 4px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    .pf-skeleton-control { height: 80px; border-radius: var(--platform-border-radius-md, 6px); background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s 0.1s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  `],
})
export class PlatformFileFieldComponent extends BaseFieldComponent<FileValue | null> {
  override readonly componentKey = 'platform-file-field';
  override readonly fieldType: ComponentFieldType = 'file';

  @ViewChild('fileInput') protected fileInput!: ElementRef<HTMLInputElement>;

  protected fileConfig(): FileFieldConfig { return this.config() as FileFieldConfig; }
  protected currentFile = computed(() => this.value() as FileValue | null);

  protected onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.value.set({ name: file.name, size: file.size, type: file.type, file });
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.isDisabled() || this.readonly()) return;
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.value.set({ name: file.name, size: file.size, type: file.type, file });
  }

  protected removeFile(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
}
