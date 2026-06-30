import { Injectable } from '@angular/core';
import { TablePaginationConfig, TablePaginationResult } from './table-data.types';
import { TABLE_DATA_MIN_PAGE_SIZE } from './table-data.constants';

type Row = Record<string, unknown>;

export interface TablePaginationEngineResult {
  readonly rows:   Row[];
  readonly result: TablePaginationResult;
}

@Injectable({ providedIn: 'root' })
export class TablePaginationEngine {

  /**
   * Slice rows to a single page.
   * Returns a new array — original is never mutated.
   * totalCount is derived from rows.length (post-filter count).
   */
  paginate(rows: Row[], config: TablePaginationConfig): TablePaginationEngineResult {
    const pageSize   = Math.max(TABLE_DATA_MIN_PAGE_SIZE, config.pageSize);
    const totalCount = rows.length;
    const pageCount  = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);
    const page       = Math.max(1, Math.min(config.page, pageCount));
    const startIndex = (page - 1) * pageSize;
    const endIndex   = Math.min(startIndex + pageSize - 1, totalCount - 1);

    return {
      rows:   rows.slice(startIndex, endIndex + 1),
      result: Object.freeze({
        page,
        pageSize,
        totalCount,
        pageCount,
        hasFirst:    page > 1,
        hasLast:     page < pageCount,
        hasPrevious: page > 1,
        hasNext:     page < pageCount,
        startIndex,
        endIndex:    totalCount === 0 ? -1 : endIndex,
      }),
    };
  }
}
