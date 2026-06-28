// ============================================================
// Tenant Pagination Component
// ============================================================

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'tenant-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSelectModule],
  template: `
    <div class="tenant-pagination">
      <div class="pagination-info">
        Showing {{ startItem }} to {{ endItem }} of {{ totalElements() }} tenants
      </div>

      <div class="pagination-controls">
        <button 
          mat-icon-button 
          class="page-btn" 
          [disabled]="isFirstPage()"
          (click)="pageChange.emit(currentPage() - 1)"
          aria-label="Previous page"
        >
          <span class="material-symbols-rounded">chevron_left</span>
        </button>

        <div class="page-numbers">
           @for (p of pagesToDisplay(); track p) {
             @if (p === -1) {
               <span class="page-ellipsis">...</span>
             } @else {
               <button 
                 class="page-number-btn" 
                 [class.active]="p === currentPage()"
                 (click)="pageChange.emit(p)"
               >
                 {{ p + 1 }}
               </button>
             }
           }
        </div>

        <button 
          mat-icon-button 
          class="page-btn" 
          [disabled]="isLastPage()"
          (click)="pageChange.emit(currentPage() + 1)"
          aria-label="Next page"
        >
          <span class="material-symbols-rounded">chevron_right</span>
        </button>
      </div>

      <div class="pagination-size">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="size-select">
          <mat-select [value]="pageSize()" (selectionChange)="pageSizeChange.emit($event.value)">
            <mat-option [value]="10">10 / page</mat-option>
            <mat-option [value]="20">20 / page</mat-option>
            <mat-option [value]="50">50 / page</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .tenant-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) 0;
      border-top: 1px solid var(--color-border);
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .pagination-info {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .page-numbers {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-number-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover:not(.active) {
        background: var(--color-surface-hover);
      }

      &.active {
        background: var(--color-primary);
        color: var(--color-text-inverse);
      }
    }

    .page-ellipsis {
      color: var(--color-text-tertiary);
      padding: 0 4px;
    }

    .pagination-size {
      display: flex;
      align-items: center;
    }

    .size-select {
      width: 120px;
      ::ng-deep .mdc-text-field--outlined {
        --mdc-outlined-text-field-container-shape: var(--radius-input);
      }
      ::ng-deep .mat-mdc-text-field-wrapper {
        background: var(--color-surface);
      }
      ::ng-deep .mat-mdc-select-value {
        font-size: var(--font-size-sm);
      }
    }

    .page-btn {
      .material-symbols-rounded {
        font-size: 20px;
      }
    }

    @media (max-width: 768px) {
      .tenant-pagination {
        flex-direction: column;
        justify-content: center;
      }
    }
  `],
})
export class TenantPaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalElements = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly isFirstPage = input.required<boolean>();
  readonly isLastPage = input.required<boolean>();

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  get startItem(): number {
    if (this.totalElements() === 0) return 0;
    return this.currentPage() * this.pageSize() + 1;
  }

  get endItem(): number {
    const end = (this.currentPage() + 1) * this.pageSize();
    return Math.min(end, this.totalElements());
  }

  pagesToDisplay(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }

    if (current <= 3) {
      return [0, 1, 2, 3, 4, -1, total - 1];
    }

    if (current >= total - 4) {
      return [0, -1, total - 5, total - 4, total - 3, total - 2, total - 1];
    }

    return [0, -1, current - 1, current, current + 1, -1, total - 1];
  }
}
