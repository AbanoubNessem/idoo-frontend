import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { DynamicDialogComponent } from '../../shared/components/dynamic-dialog/dynamic-dialog.component';
import { DialogConfig, DialogResult } from '../../shared/models/dynamic-dialog.models';

/**
 * Single entry point for opening any confirmation-style dialog across the ERP.
 * Components never instantiate MatDialog directly — keeps dialog usage consistent
 * and swappable (e.g. replacing Angular Material dialog with a custom modal later).
 */
@Injectable({ providedIn: 'root' })
export class DialogFacadeService {
  private readonly dialog = inject(MatDialog);

  open<T = unknown>(config: DialogConfig): Observable<boolean> {
    return this.dialog
      .open<DynamicDialogComponent, DialogConfig, DialogResult<T>>(DynamicDialogComponent, {
        width: config.width ?? '420px',
        data: config,
      })
      .afterClosed()
      .pipe(map(result => result?.confirmed ?? false));
  }

  confirmDelete(entityName: string): Observable<boolean> {
    return this.open({
      type: 'delete',
      title: `Delete ${entityName}`,
      message: `Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: 'warn',
    });
  }

  confirmApprove(entityName: string): Observable<boolean> {
    return this.open({
      type: 'approve',
      title: `Approve ${entityName}`,
      message: `Approve this ${entityName.toLowerCase()}?`,
      confirmLabel: 'Approve',
      confirmColor: 'primary',
    });
  }
}
