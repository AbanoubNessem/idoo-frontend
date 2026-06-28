// ============================================================
// Tenant Details Panel – Right side sliding panel
// ============================================================

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TenantDetail } from '../../models/tenant.models';
import { TenantStatusChipComponent } from '../tenant-status-chip/tenant-status-chip.component';
import { TenantOverviewComponent } from '../tenant-overview/tenant-overview.component';

@Component({
  selector: 'tenant-details-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTabsModule, TenantStatusChipComponent, TenantOverviewComponent],
  template: `
    <aside class="details-panel" [class.is-open]="!!tenant()">
      @if (tenant()) {
        <div class="details-panel__header">
          <div class="details-panel__title-row">
            <h2 class="details-panel__title">Tenant Details</h2>
            <button mat-icon-button (click)="close.emit()" aria-label="Close details panel">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <div class="tenant-profile">
             <div class="tenant-avatar">
               <span class="material-symbols-rounded">business</span>
             </div>
             <div class="tenant-info">
               <div class="tenant-name-row">
                 <h3 class="tenant-name">{{ tenant()!.name }}</h3>
                 <tenant-status-chip [status]="tenant()!.status" />
               </div>
               <p class="tenant-code">{{ tenant()!.code }}</p>
             </div>
          </div>
        </div>

        <div class="details-panel__content">
          <mat-tab-group animationDuration="0ms" class="custom-tabs">
            <mat-tab label="Overview">
              <div class="tab-content">
                <tenant-overview 
                  [tenant]="tenant()!" 
                  (edit)="edit.emit(tenant()!)"
                  (switchContext)="switchContext.emit(tenant()!)"
                />
              </div>
            </mat-tab>
            <mat-tab label="Statistics">
              <div class="tab-content placeholder">
                <p>Statistics view coming soon.</p>
              </div>
            </mat-tab>
            <mat-tab label="Settings">
              <div class="tab-content placeholder">
                <p>Settings view coming soon.</p>
              </div>
            </mat-tab>
            <mat-tab label="Activity">
              <div class="tab-content placeholder">
                <p>Activity log coming soon.</p>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      }
    </aside>
  `,
  styles: [`
    .details-panel {
      background: var(--color-surface);
      border-radius: var(--radius-card);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-1);
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      width: 100%;
    }

    .details-panel__header {
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface);
    }

    .details-panel__title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    }

    .details-panel__title {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .tenant-profile {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .tenant-avatar {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--color-primary-light);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .material-symbols-rounded { font-size: 24px; }
    }

    .tenant-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .tenant-name-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .tenant-name {
      margin: 0;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tenant-code {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .details-panel__content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .custom-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;

      ::ng-deep .mat-mdc-tab-header {
        padding: 0 var(--space-5);
        border-bottom: 1px solid var(--color-border);
      }
      
      ::ng-deep .mdc-tab {
        padding: 0 var(--space-3);
        min-width: auto;
      }

      ::ng-deep .mat-mdc-tab-body-wrapper {
        flex: 1;
      }
    }

    .tab-content {
      padding: var(--space-5);
      height: 100%;
      overflow-y: auto;
      box-sizing: border-box;
      
      &.placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-tertiary);
        font-style: italic;
      }
    }
  `],
})
export class TenantDetailsPanelComponent {
  readonly tenant = input<TenantDetail | null>(null);
  
  readonly close = output<void>();
  readonly edit = output<TenantDetail>();
  readonly switchContext = output<TenantDetail>();
}
