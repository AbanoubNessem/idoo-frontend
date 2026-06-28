// ============================================================
// Tenant Empty State
// ============================================================

import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'tenant-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="empty-state">
      <div class="empty-state__icon-wrap">
        <span class="material-symbols-rounded empty-state__icon">domain_disabled</span>
      </div>
      <h2 class="empty-state__title">No Tenants Found</h2>
      <p class="empty-state__desc">
        There are currently no tenants matching your criteria. 
        Adjust your filters or create a new tenant to get started.
      </p>
      <button mat-raised-button color="primary" class="empty-state__btn" (click)="create.emit()">
        <mat-icon>add</mat-icon>
        Create Tenant
      </button>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-16) var(--space-8);
      text-align: center;
      background: var(--color-surface);
      border-radius: var(--radius-card);
      border: 1px dashed var(--color-border-hover);
      margin: var(--space-4) 0;
    }

    .empty-state__icon-wrap {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--color-background);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-5);
    }

    .empty-state__icon {
      font-size: 40px;
      color: var(--color-text-tertiary);
    }

    .empty-state__title {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .empty-state__desc {
      margin: 0 0 var(--space-6) 0;
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      max-width: 400px;
      line-height: var(--line-height-normal);
    }
    
    .empty-state__btn {
      border-radius: var(--radius-button);
      height: 44px;
      padding: 0 var(--space-6);
    }
  `],
})
export class TenantEmptyStateComponent {
  readonly create = output<void>();
}
