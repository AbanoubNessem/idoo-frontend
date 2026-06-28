// ============================================================
// Tenant Skeleton Loading State
// ============================================================

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tenant-loading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper">
      @if (type() === 'cards') {
        <div class="skeleton-cards">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton-card">
              <div class="skeleton-card__top">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-lines">
                  <div class="skeleton-line w-1/2"></div>
                  <div class="skeleton-line h-8 w-1/3 mt-2"></div>
                  <div class="skeleton-line w-1/4"></div>
                </div>
              </div>
              <div class="skeleton-chart"></div>
            </div>
          }
        </div>
      }
      
      @if (type() === 'table') {
        <div class="skeleton-table">
          <div class="skeleton-table__header"></div>
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-table__row">
              <div class="skeleton-avatar small"></div>
              <div class="skeleton-line w-1/4"></div>
              <div class="skeleton-line w-1/6"></div>
              <div class="skeleton-line w-1/12"></div>
              <div class="skeleton-line w-1/12"></div>
              <div class="skeleton-badge"></div>
              <div class="skeleton-badge"></div>
              <div class="skeleton-line w-1/6"></div>
            </div>
          }
        </div>
      }

      @if (type() === 'detail') {
        <div class="skeleton-detail">
          <div class="skeleton-detail__header">
            <div class="skeleton-avatar large"></div>
            <div class="skeleton-lines">
               <div class="skeleton-line w-1/2 h-6"></div>
               <div class="skeleton-line w-1/3 mt-2"></div>
            </div>
          </div>
          <div class="skeleton-detail__tabs">
            <div class="skeleton-line w-1/4 h-8"></div>
            <div class="skeleton-line w-1/4 h-8"></div>
            <div class="skeleton-line w-1/4 h-8"></div>
          </div>
          <div class="skeleton-detail__content">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="skeleton-detail__row">
                <div class="skeleton-line w-1/3"></div>
                <div class="skeleton-line w-1/2"></div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      width: 100%;
    }

    .skeleton-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .skeleton-card {
      background: var(--color-surface);
      border-radius: var(--radius-card);
      padding: var(--space-5) var(--space-6);
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .skeleton-card__top {
      display: flex;
      gap: var(--space-4);
    }

    .skeleton-chart {
      height: 36px;
      width: 120px;
      background: var(--color-border);
      border-radius: var(--radius-sm);
      align-self: flex-end;
      animation: pulse 1.5s infinite ease-in-out;
    }

    .skeleton-table {
      background: var(--color-surface);
      border-radius: var(--radius-card);
      border: 1px solid var(--color-border);
      overflow: hidden;
    }

    .skeleton-table__header {
      height: 48px;
      background: var(--color-background);
      border-bottom: 1px solid var(--color-border);
      animation: pulse 1.5s infinite ease-in-out;
    }

    .skeleton-table__row {
      display: flex;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
      gap: var(--space-4);
    }

    .skeleton-detail {
      background: var(--color-surface);
      border-radius: var(--radius-card);
      border: 1px solid var(--color-border);
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      height: 100%;
    }

    .skeleton-detail__header {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .skeleton-detail__tabs {
      display: flex;
      gap: var(--space-4);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--space-2);
    }

    .skeleton-detail__content {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    
    .skeleton-detail__row {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .skeleton-avatar {
      background: var(--color-border);
      border-radius: var(--radius-md);
      animation: pulse 1.5s infinite ease-in-out;
      flex-shrink: 0;
      
      &.large { width: 64px; height: 64px; border-radius: var(--radius-lg); }
      &.small { width: 32px; height: 32px; border-radius: var(--radius-sm); }
      &:not(.large):not(.small) { width: 48px; height: 48px; }
    }

    .skeleton-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .skeleton-line {
      height: 12px;
      background: var(--color-border);
      border-radius: var(--radius-sm);
      animation: pulse 1.5s infinite ease-in-out;
    }

    .skeleton-badge {
      height: 24px;
      width: 80px;
      background: var(--color-border);
      border-radius: var(--radius-full);
      animation: pulse 1.5s infinite ease-in-out;
    }

    .w-1\\/2 { width: 50%; }
    .w-1\\/3 { width: 33%; }
    .w-1\\/4 { width: 25%; }
    .w-1\\/6 { width: 16%; }
    .w-1\\/12 { width: 8%; }
    .h-8 { height: 32px; }
    .h-6 { height: 24px; }
    .mt-2 { margin-top: 8px; }

    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 0.3; }
      100% { opacity: 0.6; }
    }
  `],
})
export class TenantLoadingComponent {
  readonly type = input<'cards' | 'table' | 'detail'>('table');
}
