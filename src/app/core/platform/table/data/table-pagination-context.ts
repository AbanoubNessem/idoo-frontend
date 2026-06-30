import { signal, computed } from '@angular/core';
import { TablePaginationConfig, TablePaginationResult } from './table-data.types';
import {
  TABLE_DATA_DEFAULT_PAGE,
  TABLE_DATA_DEFAULT_PAGE_SIZE,
  TABLE_DATA_MAX_PAGE_SIZE,
  TABLE_DATA_MIN_PAGE_SIZE,
} from './table-data.constants';

/**
 * Per-instance pagination state holder.
 * Created via TableDataEngine.createPaginationContext() — not @Injectable.
 * Call setTotalCount(result.filteredCount) after each pipeline run to keep
 * pageCount and navigation helpers reactive.
 */
export class TablePaginationContext {
  private readonly _page       = signal<number>(TABLE_DATA_DEFAULT_PAGE);
  private readonly _pageSize   = signal<number>(TABLE_DATA_DEFAULT_PAGE_SIZE);
  private readonly _totalCount = signal<number>(0);

  readonly page       = this._page.asReadonly();
  readonly pageSize   = this._pageSize.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();

  readonly pageCount   = computed(() =>
    this._totalCount() === 0 ? 1 : Math.ceil(this._totalCount() / this._pageSize())
  );
  readonly hasFirst    = computed(() => this._page() > 1);
  readonly hasLast     = computed(() => this._page() < this.pageCount());
  readonly hasPrevious = computed(() => this._page() > 1);
  readonly hasNext     = computed(() => this._page() < this.pageCount());
  readonly startIndex  = computed(() => (this._page() - 1) * this._pageSize());
  readonly endIndex    = computed(() =>
    Math.min(this.startIndex() + this._pageSize() - 1, this._totalCount() - 1)
  );

  constructor(initial?: Partial<TablePaginationConfig & { totalCount: number }>) {
    if (initial?.page     !== undefined) this._page.set(Math.max(1, initial.page));
    if (initial?.pageSize !== undefined) this._pageSize.set(this._clampPageSize(initial.pageSize));
    if ((initial as { totalCount?: number })?.totalCount !== undefined) {
      this._totalCount.set(Math.max(0, (initial as { totalCount: number }).totalCount));
    }
  }

  setPage(page: number): void {
    const clamped = Math.max(1, Math.min(Math.round(page), this.pageCount()));
    this._page.set(clamped);
  }

  setPageSize(size: number): void {
    this._pageSize.set(this._clampPageSize(size));
    this._page.set(1);
  }

  /** Called after each pipeline run with the filtered (pre-pagination) count. */
  setTotalCount(count: number): void {
    this._totalCount.set(Math.max(0, count));
    // Clamp page to new pageCount
    const pc = this.pageCount();
    if (this._page() > pc) this._page.set(pc);
  }

  first(): void    { this._page.set(1); }
  last(): void     { this._page.set(this.pageCount()); }
  previous(): void { if (this.hasPrevious()) this._page.update(p => p - 1); }
  next(): void     { if (this.hasNext())     this._page.update(p => p + 1); }

  /** Config consumed by TablePaginationEngine. */
  toConfig(): TablePaginationConfig {
    return Object.freeze({ page: this._page(), pageSize: this._pageSize() });
  }

  /** Full reactive result snapshot (for display: "Page X of Y"). */
  toResult(): TablePaginationResult {
    return Object.freeze({
      page:        this._page(),
      pageSize:    this._pageSize(),
      totalCount:  this._totalCount(),
      pageCount:   this.pageCount(),
      hasFirst:    this.hasFirst(),
      hasLast:     this.hasLast(),
      hasPrevious: this.hasPrevious(),
      hasNext:     this.hasNext(),
      startIndex:  this.startIndex(),
      endIndex:    this.endIndex(),
    });
  }

  private _clampPageSize(size: number): number {
    return Math.max(TABLE_DATA_MIN_PAGE_SIZE, Math.min(TABLE_DATA_MAX_PAGE_SIZE, Math.round(size)));
  }
}
