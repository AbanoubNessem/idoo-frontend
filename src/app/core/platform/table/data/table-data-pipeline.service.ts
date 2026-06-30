import { Injectable, inject } from '@angular/core';
import {
  TableDataPipelineInput,
  TableDataPipelineResult,
} from './table-data.types';
import { TableSortingEngine }    from './table-sorting-engine.service';
import { TableFilteringEngine }  from './table-filtering-engine.service';
import { TablePaginationEngine } from './table-pagination-engine.service';

/**
 * Executes the four-step data pipeline:
 *   Original rows → Filter → Sort → Paginate → Rendered rows
 *
 * Never mutates the input rows array.
 */
@Injectable({ providedIn: 'root' })
export class TableDataPipeline {
  private readonly _sorting    = inject(TableSortingEngine);
  private readonly _filtering  = inject(TableFilteringEngine);
  private readonly _pagination = inject(TablePaginationEngine);

  run(input: TableDataPipelineInput): TableDataPipelineResult {
    const totalCount = input.rows.length;

    // ── Step 1: Filter ────────────────────────────────────────────────────
    let rows = input.filter
      ? this._filtering.filter(input.rows, input.filter)
      : [...input.rows];

    const filteredCount = rows.length;

    // ── Step 2: Sort ──────────────────────────────────────────────────────
    if (input.sort?.fields.length) {
      rows = this._sorting.sort(rows, input.sort);
    }

    // ── Step 3: Paginate ──────────────────────────────────────────────────
    if (input.pagination) {
      const { rows: paged, result } = this._pagination.paginate(rows, input.pagination);
      return Object.freeze({ rows: paged, filteredCount, totalCount, pagination: result });
    }

    return Object.freeze({ rows, filteredCount, totalCount });
  }
}
