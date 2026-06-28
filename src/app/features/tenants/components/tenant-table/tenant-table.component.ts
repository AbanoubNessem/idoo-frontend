// ============================================================
// Tenant Table Component
// ============================================================

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TenantListItem } from '../../models/tenant.models';
import { TenantStatusChipComponent } from '../tenant-status-chip/tenant-status-chip.component';
import { TenantPlanChipComponent } from '../tenant-plan-chip/tenant-plan-chip.component';

@Component({
  selector: 'tenant-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, MatMenuModule, MatCheckboxModule, TenantStatusChipComponent, TenantPlanChipComponent],
  template: `
    <div class="table-container">
      <table class="tenant-table" aria-label="Tenants list">
        <thead>
          <tr>
            <th class="col-checkbox"><mat-checkbox /></th>
            <th class="col-tenant">Tenant</th>
            <th class="col-code">Code</th>
            <th class="col-domain">Domain</th>
            <th class="col-number">Max Users</th>
            <th class="col-plan">Plan</th>
            <th class="col-status">Status</th>
            <th class="col-date">Created At</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (tenant of tenants(); track tenant.id) {
            <tr 
              class="tenant-row" 
              [class.selected]="selectedTenantId() === tenant.id"
              (click)="rowClick.emit(tenant)"
            >
              <td class="col-checkbox" (click)="$event.stopPropagation()">
                <mat-checkbox />
              </td>
              <td class="col-tenant">
                <div class="tenant-cell">
                  <div class="tenant-avatar">
                    @if (tenant.logoUrl) {
                      <img [src]="tenant.logoUrl" alt="Logo" class="tenant-logo">
                    } @else {
                      <span class="material-symbols-rounded">business</span>
                    }
                  </div>
                  <div class="tenant-info">
                    <span class="tenant-name">{{ tenant.name }}</span>
                  </div>
                </div>
              </td>
              <td class="col-code"><span class="code-badge">{{ tenant.code }}</span></td>
              <td class="col-domain">{{ tenant.domain || 'N/A' }}</td>
              <td class="col-number font-medium">{{ tenant.maxUsers }}</td>
              <td class="col-plan"><tenant-plan-chip [plan]="tenant.subscriptionPlan" /></td>
              <td class="col-status"><tenant-status-chip [status]="tenant.status" /></td>
              <td class="col-date text-secondary">{{ tenant.createdAt | date:'mediumDate' }}</td>
              <td class="col-actions" (click)="$event.stopPropagation()">
                <div class="action-buttons">
                  <button mat-icon-button class="action-btn" matTooltip="View details" (click)="view.emit(tenant)">
                    <span class="material-symbols-rounded">visibility</span>
                  </button>
                  <button mat-icon-button class="action-btn" matTooltip="Edit tenant" (click)="edit.emit(tenant)">
                    <span class="material-symbols-rounded">edit</span>
                  </button>
                  <button mat-icon-button class="action-btn" [matMenuTriggerFor]="moreMenu">
                    <span class="material-symbols-rounded">more_vert</span>
                  </button>
                  <mat-menu #moreMenu="matMenu" class="custom-menu">
                  <button mat-menu-item (click)="switchContext.emit(tenant)">
                      <mat-icon>login</mat-icon>
                      <span>Switch Context</span>
                    </button>
                    @if (tenant.status !== 'ACTIVE') {
                      <button mat-menu-item class="text-success" (click)="activate.emit(tenant)">
                        <mat-icon class="text-success">check_circle</mat-icon>
                        <span>Activate</span>
                      </button>
                    }
                    @if (tenant.status === 'ACTIVE') {
                      <button mat-menu-item class="text-warning" (click)="deactivate.emit(tenant)">
                        <mat-icon class="text-warning">pause_circle</mat-icon>
                        <span>Deactivate</span>
                      </button>
                    }
                    <button mat-menu-item class="text-danger" (click)="delete.emit(tenant)">
                      <mat-icon color="warn">delete</mat-icon>
                      <span>Delete</span>
                    </button>
                  </mat-menu>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      width: 100%;
      overflow-x: auto;
      background: var(--color-surface);
      border-radius: var(--radius-card);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-1);
    }

    .tenant-table {
      width: 100%;
      min-width: 1000px;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-background);
      white-space: nowrap;
    }

    td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      vertical-align: middle;
    }

    .tenant-row {
      transition: background var(--transition-fast);
      cursor: pointer;

      &:hover {
        background: var(--color-surface-hover);
      }

      &.selected {
        background: var(--color-context-bg);
        border-left: 3px solid var(--color-primary);
        td:first-child { padding-left: calc(var(--space-4) - 3px); }
      }
      
      &:last-child td { border-bottom: none; }
    }

    .col-checkbox { width: 48px; text-align: center; padding-right: 0; }
    .col-tenant { width: 25%; }
    .col-code { width: 10%; }
    .col-domain { width: 15%; }
    .col-number { width: 8%; text-align: center; }
    .col-plan { width: 12%; }
    .col-status { width: 10%; }
    .col-date { width: 12%; }
    .col-actions { width: 8%; text-align: right; }

    th.col-number { text-align: center; }
    th.col-actions { text-align: right; }

    .tenant-cell {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .tenant-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: var(--color-primary-light);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      .material-symbols-rounded { font-size: 18px; }
    }
    
    .tenant-logo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .tenant-info {
      display: flex;
      flex-direction: column;
    }

    .tenant-name {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .code-badge {
      font-family: monospace;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-primary-dark);
      background: var(--color-context-bg);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .font-medium { font-weight: var(--font-weight-semibold); }
    .text-secondary { color: var(--color-text-secondary); }
    .text-success { color: var(--color-success); }
    .text-warning { color: var(--color-warning); }
    .text-danger { color: var(--color-danger); }

    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      line-height: 32px;
      color: var(--color-text-secondary);
      .material-symbols-rounded { font-size: 18px; }
      
      &:hover {
        color: var(--color-text-primary);
        background: var(--color-border);
      }
    }
  `],
})
export class TenantTableComponent {
  readonly tenants = input.required<TenantListItem[]>();
  readonly selectedTenantId = input<string | null>(null);

  readonly rowClick = output<TenantListItem>();
  readonly view = output<TenantListItem>();
  readonly edit = output<TenantListItem>();
  readonly delete = output<TenantListItem>();
  readonly activate = output<TenantListItem>();
  readonly deactivate = output<TenantListItem>();
  readonly switchContext = output<TenantListItem>();
}
