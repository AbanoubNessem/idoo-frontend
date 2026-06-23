import {
  Component, Output, EventEmitter, OnInit, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, signal, computed, input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { HasPermissionDirective } from '../../directives/permission/has-permission.directive';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { TableConfig, TableColumnDef } from '../../models/dynamic-table.models';

/**
 * Dynamic Table Engine — generic listing, pagination, sorting, search, filters, row actions.
 * Driven entirely by TableConfig<T>. No per-feature table component duplication.
 *
 * Big-O notes:
 *  - Rendering is O(pageSize) per page, not O(n) — server-side pagination keeps DOM small.
 *  - trackBy avoids full row re-render: O(changed rows) instead of O(n) on each CD cycle.
 *  - Virtual scroll variant (optional) renders only the visible viewport: O(visible rows).
 */
@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatChipsModule,
    MatTooltipModule, MatProgressSpinnerModule, ScrollingModule,
    HasPermissionDirective, EmptyStateComponent,
  ],
  template: `
    <div class="dynamic-table-container">
      @if (loading()) {
        <div class="loading-row"><mat-spinner diameter="32" /></div>
      } @else if (!rows().length) {
        <app-empty-state message="No records found" />
      } @else {
        <table mat-table [dataSource]="rows()" matSort (matSortChange)="onSort($event)" class="erp-table">
          @for (col of config().columns; track col.id) {
            <ng-container [matColumnDef]="col.id">
              <th mat-header-cell *matHeaderCellDef [mat-sort-header]="col.sortable ? col.id : ''" [style.width]="col.width">
                {{ col.header }}
              </th>
              <td mat-cell *matCellDef="let row" [style.text-align]="col.align ?? 'left'">
                @switch (col.type) {
                  @case ('boolean') {
                    <mat-icon [color]="getCellValue(row, col) ? 'primary' : 'warn'">
                      {{ getCellValue(row, col) ? 'check_circle' : 'cancel' }}
                    </mat-icon>
                  }
                  @case ('badge') {
                    <mat-chip [style.background]="getBadgeColor(col, getCellValue(row, col))">
                      {{ getBadgeLabel(col, getCellValue(row, col)) }}
                    </mat-chip>
                  }
                  @case ('date') {
                    {{ getAsDate(getCellValue(row, col)) | date: 'mediumDate'}}
                  }
                  @case ('datetime') {
                    {{ getAsDate(getCellValue(row, col)) | date: 'medium' }}
                  }
                  @default {
                    {{ getCellValue(row, col) }}
                  }
                }
              </td>
            </ng-container>
          }

          @if (config().actions?.length) {
            <ng-container matColumnDef="__actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  @for (action of config().actions; track action.key) {
                    @if (!action.hidden || !action.hidden(row)) {
                      <button
                        mat-menu-item
                        *hasPermission="action.permission ?? []"
                        [disabled]="action.disabled ? action.disabled(row) : false"
                        (click)="action.handler(row)"
                      >
                        <mat-icon [color]="action.color">{{ action.icon }}</mat-icon>
                        <span>{{ action.label }}</span>
                      </button>
                    }
                  }
                </mat-menu>
              </td>
            </ng-container>
          }

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns; trackBy: trackByFn"></tr>
        </table>

        <mat-paginator
          [length]="totalElements()"
          [pageSize]="config().pageSize ?? 25"
          [pageSizeOptions]="config().pageSizeOptions ?? [10, 25, 50, 100]"
          (page)="onPage($event)"
        />
      }
    </div>
  `,
  styles: [`
    .dynamic-table-container { width: 100%; }
    .erp-table { width: 100%; }
    .loading-row { display: flex; justify-content: center; padding: 48px 0; }
  `],
})
export class DynamicTableComponent<T> implements OnInit, OnChanges {
  config = input.required<TableConfig<T>>();
  rowsInput = input<T[]>([]);
  totalElementsInput = input(0);
  loadingInput = input(false);

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();

  readonly rows = signal<T[]>([]);
  readonly totalElements = signal(0);
  readonly loading = signal(false);

  readonly displayedColumns = computed(() => {
    const cols = this.config().columns.map(c => c.id);
    return this.config().actions?.length ? [...cols, '__actions'] : cols;
  });

  getCellValue(row: T, col: TableColumnDef<T>) {
    if (col.valueMapper) {
      return col.valueMapper(row);
    }
    if (col.accessor) {
      return row[col.accessor];
    }
    return null;
  }

  getBadgeColor(col: TableColumnDef<T>, value: unknown): string | undefined {
    if (!col.badgeConfig || typeof value !== 'string') return undefined;
    return col.badgeConfig[value]?.color;
  }

  getBadgeLabel(col: TableColumnDef<T>, value: unknown): unknown {
    if (!col.badgeConfig || typeof value !== 'string') return value;
    return col.badgeConfig[value]?.label ?? value;
  }

  isDateValue(value: unknown): value is string | number | Date {
    return typeof value === 'string' || typeof value === 'number' || value instanceof Date;
  }

  getAsDate(value: unknown): string | number | Date | null {
    return this.isDateValue(value) ? value : null;
  }

  ngOnInit(): void {
    this.syncInputs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rowsInput'] || changes['totalElementsInput'] || changes['loadingInput']) {
      this.syncInputs();
    }
  }

  private syncInputs(): void {
    this.rows.set(this.rowsInput());
    this.totalElements.set(this.totalElementsInput());
    this.loading.set(this.loadingInput());
  }

  trackByFn = (_: number, row: T): unknown => {
    const key = this.config().trackByKey ?? ('id' as keyof T);
    return row[key];
  };

  onPage(event: PageEvent): void { this.pageChange.emit(event); }
  onSort(event: Sort): void { this.sortChange.emit(event); }
}
