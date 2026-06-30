import { Injectable, inject } from '@angular/core';
import {
  TableSortConfig,
  TableFilterConfig,
  TableFilterGroup,
  TablePaginationConfig,
  TableDataPipelineInput,
  TableDataPipelineResult,
  TableComparatorFn,
  TableFilterPredicateFn,
  TablePaginationResult,
} from './table-data.types';
import { TableSortContext }        from './table-sort-context';
import { TableFilterContext }      from './table-filter-context';
import { TablePaginationContext }  from './table-pagination-context';
import { TableComparatorRegistry } from './table-comparator-registry.service';
import { TableFilterRegistry }     from './table-filter-registry.service';
import { TableSortingEngine }      from './table-sorting-engine.service';
import { TableFilteringEngine }    from './table-filtering-engine.service';
import { TablePaginationEngine }   from './table-pagination-engine.service';
import { TableDataPipeline }       from './table-data-pipeline.service';

type Row = Record<string, unknown>;

/**
 * Central facade for all table data operations.
 * Compose sort, filter, and pagination via contexts or raw configs.
 */
@Injectable({ providedIn: 'root' })
export class TableDataEngine {
  private readonly _comparators = inject(TableComparatorRegistry);
  private readonly _filters     = inject(TableFilterRegistry);
  private readonly _sorting     = inject(TableSortingEngine);
  private readonly _filtering   = inject(TableFilteringEngine);
  private readonly _pagination  = inject(TablePaginationEngine);
  private readonly _pipeline    = inject(TableDataPipeline);

  // ─── Context Factories ────────────────────────────────────────────────────

  createSortContext(initial?: Partial<TableSortConfig>): TableSortContext {
    return new TableSortContext(initial);
  }

  createFilterContext(initial?: TableFilterGroup): TableFilterContext {
    return new TableFilterContext(initial);
  }

  createPaginationContext(
    initial?: Partial<TablePaginationConfig & { totalCount: number }>
  ): TablePaginationContext {
    return new TablePaginationContext(initial);
  }

  // ─── Pipeline ─────────────────────────────────────────────────────────────

  /** Run the full pipeline from a raw config input. */
  run(input: TableDataPipelineInput): TableDataPipelineResult {
    return this._pipeline.run(input);
  }

  /**
   * Run the pipeline using context objects.
   * Automatically updates the pagination context's totalCount with the
   * filtered row count so pageCount and navigation helpers stay reactive.
   */
  runWithContexts(
    rows:          Row[],
    sortCtx?:      TableSortContext,
    filterCtx?:    TableFilterContext,
    paginationCtx?: TablePaginationContext,
  ): TableDataPipelineResult {
    const result = this._pipeline.run({
      rows,
      filter:     filterCtx?.isActive()  ? filterCtx.toConfig()     : undefined,
      sort:       sortCtx?.isActive()    ? sortCtx.toConfig()       : undefined,
      pagination: paginationCtx          ? paginationCtx.toConfig() : undefined,
    });

    if (paginationCtx) {
      paginationCtx.setTotalCount(result.filteredCount);
    }

    return result;
  }

  // ─── Direct Operations ────────────────────────────────────────────────────

  sort(rows: Row[], config: TableSortConfig): Row[] {
    return this._sorting.sort(rows, config);
  }

  filter(rows: Row[], config: TableFilterConfig): Row[] {
    return this._filtering.filter(rows, config);
  }

  paginate(rows: Row[], config: TablePaginationConfig): { rows: Row[]; result: TablePaginationResult } {
    return this._pagination.paginate(rows, config);
  }

  // ─── Registry ─────────────────────────────────────────────────────────────

  registerComparator(id: string, fn: TableComparatorFn): void {
    this._comparators.register(id, fn);
  }

  registerFilter(id: string, fn: TableFilterPredicateFn): void {
    this._filters.registerPredicate(id, fn);
  }

  hasComparator(id: string): boolean {
    return this._comparators.has(id);
  }

  hasFilter(id: string): boolean {
    return this._filters.hasPredicate(id);
  }
}
