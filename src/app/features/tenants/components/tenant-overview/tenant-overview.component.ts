// ============================================================
// Tenant Overview Tab Content
// ============================================================

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TenantDetail } from '../../models/tenant.models';
import { TenantPlanChipComponent } from '../tenant-plan-chip/tenant-plan-chip.component';

@Component({
  selector: 'tenant-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, TenantPlanChipComponent],
  template: `
    <div class="tenant-overview">
      <div class="overview-list">
        
        <div class="overview-item">
          <div class="overview-item__icon"><span class="material-symbols-rounded">badge</span></div>
          <div class="overview-item__content">
            <span class="overview-item__label">Name</span>
            <span class="overview-item__value">{{ tenant().name }}</span>
          </div>
        </div>

        <div class="overview-item">
          <div class="overview-item__icon"><span class="material-symbols-rounded">tag</span></div>
          <div class="overview-item__content">
            <span class="overview-item__label">Code</span>
            <span class="overview-item__value">{{ tenant().code }}</span>
          </div>
        </div>

        <div class="overview-item">
          <div class="overview-item__icon"><span class="material-symbols-rounded">language</span></div>
          <div class="overview-item__content">
            <span class="overview-item__label">Domain</span>
            <span class="overview-item__value">{{ tenant().domain || 'N/A' }}</span>
          </div>
        </div>

        <div class="overview-item">
          <div class="overview-item__icon"><span class="material-symbols-rounded">calendar_today</span></div>
          <div class="overview-item__content">
            <span class="overview-item__label">Created At</span>
            <span class="overview-item__value">{{ tenant().createdAt | date:'mediumDate' }}</span>
          </div>
        </div>
        
        <div class="overview-item">
          <div class="overview-item__icon"><span class="material-symbols-rounded">update</span></div>
          <div class="overview-item__content">
            <span class="overview-item__label">Updated At</span>
            <span class="overview-item__value">{{ tenant().updatedAt | date:'mediumDate' }}</span>
          </div>
        </div>

        <div class="overview-item">
          <div class="overview-item__icon"><span class="material-symbols-rounded">verified</span></div>
          <div class="overview-item__content">
            <span class="overview-item__label">Plan</span>
            <span class="overview-item__value">
               <tenant-plan-chip [plan]="tenant().subscriptionPlan" />
            </span>
          </div>
        </div>
        
        <div class="overview-item">
          <div class="overview-item__icon"><span class="material-symbols-rounded">event</span></div>
          <div class="overview-item__content">
            <span class="overview-item__label">Expires At</span>
            <span class="overview-item__value">{{ tenant().subscriptionExpiresAt ? (tenant().subscriptionExpiresAt | date:'mediumDate') : 'No Expiry' }}</span>
          </div>
        </div>

        <div class="overview-item">
          <div class="overview-item__icon"><span class="material-symbols-rounded">group</span></div>
          <div class="overview-item__content">
            <span class="overview-item__label">Max Users</span>
            <span class="overview-item__value">{{ tenant().maxUsers || '∞' }}</span>
          </div>
        </div>

      </div>

      <div class="overview-actions">
        <button mat-stroked-button class="btn-full" (click)="switchContext.emit()">
          Switch Context
        </button>
        <button mat-raised-button color="primary" class="btn-full" (click)="edit.emit()">
          <mat-icon>edit</mat-icon>
          Edit Tenant
        </button>
      </div>
    </div>
  `,
  styles: [`
    .tenant-overview {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .overview-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      flex: 1;
      padding-right: var(--space-2);
      /* Remove scrollbar if container handles it */
    }

    .overview-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .overview-item__icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: var(--color-surface-hover);
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      .material-symbols-rounded {
        font-size: 18px;
      }
    }

    .overview-item__content {
      display: flex;
      align-items: center;
      flex: 1;
      justify-content: space-between;
      gap: var(--space-2);
    }

    .overview-item__label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
      flex-shrink: 0;
    }

    .overview-item__value {
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      font-weight: var(--font-weight-medium);
      text-align: right;
      display: flex;
      align-items: center;
    }

    .overview-actions {
      display: flex;
      gap: var(--space-3);
      margin-top: var(--space-6);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
    }

    .btn-full {
      flex: 1;
      border-radius: var(--radius-button);
      height: 40px;
    }
  `],
})
export class TenantOverviewComponent {
  readonly tenant = input.required<TenantDetail>();

  readonly switchContext = output<void>();
  readonly edit = output<void>();
}
