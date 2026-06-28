// ============================================================
// Tenant Toolbar – Search and Filters
// ============================================================

import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TenantStatus, SubscriptionPlan } from '../../enums/tenant.enums';
import { TenantFilters } from '../../models/tenant.models';

@Component({
  selector: 'tenant-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule
  ],
  template: `
    <div class="tenant-toolbar">
      <div class="tenant-toolbar__search">
        <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
          <mat-icon matPrefix class="search-icon">search</mat-icon>
          <input matInput [formControl]="searchControl" placeholder="Search by name or code..." aria-label="Search tenants">
          <div matSuffix class="search-shortcut">Ctrl /</div>
        </mat-form-field>
      </div>

      <div class="tenant-toolbar__filters" [formGroup]="filterForm">
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter-field">
            <mat-select formControlName="status" aria-label="Filter by status">
              <mat-option value="">All Statuses</mat-option>
              <mat-option [value]="TenantStatus.ACTIVE">Active</mat-option>
              <mat-option [value]="TenantStatus.INACTIVE">Inactive</mat-option>
              <mat-option [value]="TenantStatus.TRIAL">Trial</mat-option>
              <mat-option [value]="TenantStatus.SUSPENDED">Suspended</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <button mat-stroked-button class="btn-filter" aria-label="Advanced filters">
          <span class="material-symbols-rounded">filter_alt</span>
          Filter
        </button>
        
        <button mat-icon-button class="btn-settings" aria-label="Table settings">
          <span class="material-symbols-rounded">settings</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .tenant-toolbar {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-4) 0;
      flex-wrap: wrap;
    }

    .tenant-toolbar__search {
      flex: 1;
      min-width: 250px;
      max-width: 400px;
    }

    .search-field {
      width: 100%;
      
      ::ng-deep .mdc-text-field--outlined {
        --mdc-outlined-text-field-container-shape: var(--radius-input);
        --mdc-outlined-text-field-focus-outline-color: var(--color-border-focus);
      }
      ::ng-deep .mat-mdc-text-field-wrapper {
        background: var(--color-surface);
      }
    }

    .search-icon {
      color: var(--color-text-tertiary);
      margin-right: 4px;
    }

    .search-shortcut {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px 6px;
      margin-right: 8px;
      background: #F3F4F6;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      font-size: 11px;
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
    }

    .tenant-toolbar__filters {
      display: flex;
      align-items: flex-end;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
    }

    .filter-field {
      width: 150px;
      ::ng-deep .mdc-text-field--outlined {
        --mdc-outlined-text-field-container-shape: var(--radius-input);
      }
      ::ng-deep .mat-mdc-text-field-wrapper {
        background: var(--color-surface);
      }
    }

    .btn-filter {
      height: 48px; /* match mat-form-field height */
      border-radius: var(--radius-input);
      color: var(--color-primary);
      border-color: var(--color-primary-light);
      background: var(--color-context-bg);
      display: flex;
      align-items: center;
      gap: 4px;
      
      .material-symbols-rounded {
        font-size: 18px;
      }
    }
    
    .btn-settings {
      height: 48px;
      width: 48px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-input);
      color: var(--color-text-secondary);
      background: var(--color-surface);
      
      .material-symbols-rounded {
        font-size: 20px;
      }
    }

    @media (max-width: 1024px) {
      .tenant-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .tenant-toolbar__search {
        max-width: 100%;
      }
      .tenant-toolbar__filters {
        width: 100%;
        justify-content: flex-start;
      }
    }
  `],
})
export class TenantToolbarComponent {
  readonly searchChange = output<string>();
  readonly filtersChange = output<Partial<TenantFilters>>();

  readonly TenantStatus = TenantStatus;
  readonly SubscriptionPlan = SubscriptionPlan;

  readonly searchControl = new FormControl('');
  
  readonly filterForm = new FormGroup({
    status: new FormControl<TenantStatus | ''>(''),
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(), debounceTime(300), distinctUntilChanged())
      .subscribe(val => this.searchChange.emit(val ?? ''));

    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(val => {
        this.filtersChange.emit({
          status: (val.status as TenantStatus | '') ?? '',
        });
      });
  }
}
