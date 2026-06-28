// ============================================================
// Tenant Header – Title, subtitle, and action buttons
// ============================================================

import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'tenant-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <header class="tenant-header" role="banner">
      <div class="tenant-header__left">
        <div class="tenant-header__title-row">
          <h1 class="tenant-header__title">Tenant Management</h1>
          <button
            mat-icon-button
            class="tenant-header__info-btn"
            matTooltip="Manage multi-tenant organizations"
            aria-label="Tenant management information"
          >
            <span class="material-symbols-rounded">info</span>
          </button>
        </div>
        <p class="tenant-header__subtitle">
          Manage all tenants and organizations in the system.
        </p>
      </div>

      <div class="tenant-header__actions" role="toolbar" aria-label="Tenant management actions">
        <button
          mat-stroked-button
          class="btn-export"
          (click)="export.emit()"
          aria-label="Export tenants"
          id="tenant-export-btn"
        >
          <span class="material-symbols-rounded">download</span>
          Export
        </button>

        <button
          mat-stroked-button
          class="btn-refresh"
          (click)="refresh.emit()"
          aria-label="Refresh tenants list"
          id="tenant-refresh-btn"
        >
          <span class="material-symbols-rounded">refresh</span>
          Refresh
        </button>

        <button
          mat-raised-button
          class="btn-create"
          color="primary"
          (click)="create.emit()"
          aria-label="Create new tenant"
          id="tenant-create-btn"
        >
          <span class="material-symbols-rounded">add</span>
          Create Tenant
        </button>
      </div>
    </header>
  `,
  styles: [`
    .tenant-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
      flex-wrap: wrap;
      padding-bottom: var(--space-5);
    }

    .tenant-header__left {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .tenant-header__title-row {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .tenant-header__title {
      margin: 0;
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
    }

    .tenant-header__info-btn {
      width: 28px;
      height: 28px;
      line-height: 1;

      .material-symbols-rounded {
        font-size: 18px;
        color: var(--color-text-tertiary);
      }
    }

    .tenant-header__subtitle {
      margin: 0;
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
    }

    .tenant-header__actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .btn-export,
    .btn-refresh {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      border-radius: var(--radius-button);
      height: 40px;

      .material-symbols-rounded { font-size: 18px; }
    }

    .btn-create {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      border-radius: var(--radius-button);
      height: 40px;
      box-shadow: var(--shadow-primary);

      .material-symbols-rounded { font-size: 18px; }
    }

    @media (max-width: 640px) {
      .tenant-header {
        flex-direction: column;
      }

      .tenant-header__actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `],
})
export class TenantHeaderComponent {
  readonly export  = output<void>();
  readonly refresh = output<void>();
  readonly create  = output<void>();
}
