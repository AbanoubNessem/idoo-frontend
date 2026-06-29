import { ChangeDetectionStrategy, Component, computed, ElementRef, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { BaseFieldComponent } from '../../base/base-field.component';
import { ComponentFieldType, FileValue, AvatarFieldConfig } from '../../component.types';

@Component({
  selector: 'platform-avatar-field',
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
          <div class="pf-skeleton-avatar" [style.border-radius]="avatarRadius()"></div>
        </div>
      } @else {
        <div class="pf-avatar-container">
          <div
            class="pf-avatar"
            [style.width.px]="size()"
            [style.height.px]="size()"
            [style.border-radius]="avatarRadius()"
            [class.pf-avatar--disabled]="isDisabled() || readonly()"
            [class.pf-avatar--error]="hasErrors()"
            [attr.role]="'button'"
            [attr.tabindex]="isDisabled() ? -1 : 0"
            [attr.aria-label]="effectiveAriaLabel() || 'Upload avatar'"
            (click)="!isDisabled() && !readonly() && fileInput.click()"
            (keydown.enter)="!isDisabled() && !readonly() && fileInput.click()"
          >
            @if (loading()) {
              <mat-progress-spinner [diameter]="size() * 0.4" mode="indeterminate" aria-hidden="true"/>
            } @else if (previewUrl()) {
              <img [src]="previewUrl()" [alt]="label() || 'Avatar'" class="pf-avatar-img" [style.border-radius]="avatarRadius()"/>
              @if (!isDisabled() && !readonly()) {
                <div class="pf-avatar-overlay" [style.border-radius]="avatarRadius()">
                  <mat-icon aria-hidden="true">edit</mat-icon>
                </div>
              }
            } @else {
              <mat-icon class="pf-avatar-icon" aria-hidden="true">person</mat-icon>
            }
          </div>
          @if (!isDisabled() && !readonly() && value()) {
            <button mat-icon-button class="pf-avatar-remove" (click)="removeAvatar()" aria-label="Remove avatar" type="button">
              <mat-icon>delete</mat-icon>
            </button>
          }
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
    .pf-avatar-container { display: inline-flex; flex-direction: column; align-items: center; gap: 8px; }
    .pf-avatar {
      position: relative; cursor: pointer; overflow: hidden;
      background: var(--platform-color-surface-variant, #e2e8f0);
      display: flex; align-items: center; justify-content: center;
      border: 2px solid transparent; transition: border-color 0.15s;
    }
    .pf-avatar:hover:not(.pf-avatar--disabled) { border-color: var(--platform-color-primary, #2563eb); }
    .pf-avatar--disabled { cursor: not-allowed; opacity: 0.38; }
    .pf-avatar--error { border-color: var(--platform-color-error, #ef4444); }
    .pf-avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .pf-avatar-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      color: white; opacity: 0; transition: opacity 0.15s;
    }
    .pf-avatar:hover .pf-avatar-overlay { opacity: 1; }
    .pf-avatar-icon { font-size: 40px; width: 40px; height: 40px; color: var(--platform-color-text-secondary, #64748b); }
    .pf-avatar-remove { position: absolute; }
    .pf-file-input { display: none; }
    .pf-hint { font-size: 0.75rem; color: var(--platform-color-text-secondary, #64748b); }
    .pf-error { font-size: 0.75rem; color: var(--platform-color-error, #ef4444); }
    .pf-skeleton-wrap { display: flex; justify-content: center; }
    .pf-skeleton-avatar { width: 80px; height: 80px; background: var(--platform-color-surface-variant, #e2e8f0); animation: pf-shimmer 1.5s infinite linear; }
    @keyframes pf-shimmer { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  `],
})
export class PlatformAvatarFieldComponent extends BaseFieldComponent<FileValue | null> {
  override readonly componentKey = 'platform-avatar-field';
  override readonly fieldType: ComponentFieldType = 'avatar';

  @ViewChild('fileInput') protected fileInput!: ElementRef<HTMLInputElement>;

  protected avatarConfig(): AvatarFieldConfig { return this.config() as AvatarFieldConfig; }
  protected size = computed(() => this.avatarConfig().size ?? 80);
  protected avatarRadius = computed(() => this.avatarConfig().shape === 'square' ? '8px' : '50%');

  protected previewUrl = computed<string | null>(() => {
    const v = this.value();
    if (!v) return null;
    return v.url ?? (v.file ? URL.createObjectURL(v.file) : null);
  });

  protected onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.value.set({ name: file.name, size: file.size, type: file.type, file });
  }

  protected removeAvatar(): void {
    this.value.set(null);
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
  }
}
