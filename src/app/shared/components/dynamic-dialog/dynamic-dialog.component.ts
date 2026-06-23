import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DialogConfig, DialogResult } from '../../models/dynamic-dialog.models';

const ICON_MAP: Record<string, string> = {
  confirm: 'help_outline',
  delete: 'delete_outline',
  approve: 'check_circle_outline',
  reject: 'cancel_outline',
  info: 'info_outline',
  form: 'edit_outline',
};

/**
 * Dynamic Dialog Engine — single component handles confirm / delete / approve / reject / info dialogs.
 * Opened via DialogFacadeService.open(config) — no per-feature dialog component duplication.
 */
@Component({
  selector: 'app-dynamic-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon [color]="iconColor">{{ icon }}</mat-icon>
      {{ config.title }}
    </h2>
    <mat-dialog-content>
      <p>{{ config.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">{{ config.cancelLabel ?? 'Cancel' }}</button>
      <button mat-raised-button [color]="config.confirmColor ?? 'primary'" (click)="onConfirm()">
        {{ config.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-title { display: flex; align-items: center; gap: 8px; }`],
})
export class DynamicDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DynamicDialogComponent, DialogResult>);
  readonly config = inject<DialogConfig>(MAT_DIALOG_DATA);

  get icon(): string { return ICON_MAP[this.config.type] ?? 'help_outline'; }
  get iconColor(): 'primary' | 'warn' {
    return this.config.type === 'delete' || this.config.type === 'reject' ? 'warn' : 'primary';
  }

  onConfirm(): void {
    this.dialogRef.close({ confirmed: true, data: this.config.data });
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }
}
