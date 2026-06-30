// ─── Sorting ──────────────────────────────────────────────────────────────────

export type TableSortDirection = 'asc' | 'desc';

export interface TableSortField {
  readonly columnId:     string;
  readonly field:        string;
  readonly direction:    TableSortDirection;
  readonly comparatorId?: string;   // custom comparator from TableComparatorRegistry
  readonly locale?:       string;   // for locale-aware sort (e.g. 'en-US')
}

export interface TableSortConfig {
  readonly fields:       readonly TableSortField[];
  readonly multiColumn:  boolean;
  readonly stable:       boolean;
}

export type TableComparatorFn = (a: unknown, b: unknown, locale?: string) => number;

export interface TableComparatorEntry {
  readonly id: string;
  readonly fn: TableComparatorFn;
}

// ─── Filtering ────────────────────────────────────────────────────────────────

export type TableFilterOperator =
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in'
  | 'boolean'
  | 'date'
  | 'custom';

export type TableFilterLogic = 'and' | 'or';

export interface TableFilterCondition {
  readonly columnId:       string;
  readonly field:          string;
  readonly operator:       TableFilterOperator;
  readonly value:          unknown;
  readonly value2?:        unknown;   // second bound for 'between'
  readonly predicateId?:   string;   // custom predicate from TableFilterRegistry
  readonly caseSensitive?: boolean;
}

export interface TableFilterGroup {
  readonly logic:       TableFilterLogic;
  readonly conditions:  readonly TableFilterCondition[];
  readonly groups?:     readonly TableFilterGroup[];
}

export interface TableFilterConfig {
  readonly root: TableFilterGroup;
}

export type TableFilterPredicateFn = (value: unknown, condition: TableFilterCondition) => boolean;

export interface TableFilterPredicateEntry {
  readonly id: string;
  readonly fn: TableFilterPredicateFn;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface TablePaginationConfig {
  readonly page:     number;   // 1-based
  readonly pageSize: number;
}

export interface TablePaginationResult {
  readonly page:        number;
  readonly pageSize:    number;
  readonly totalCount:  number;
  readonly pageCount:   number;
  readonly hasFirst:    boolean;
  readonly hasLast:     boolean;
  readonly hasPrevious: boolean;
  readonly hasNext:     boolean;
  readonly startIndex:  number;   // 0-based index of first item on page
  readonly endIndex:    number;   // 0-based index of last item on page (inclusive)
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export interface TableDataPipelineInput {
  readonly rows:        Record<string, unknown>[];
  readonly filter?:     TableFilterConfig;
  readonly sort?:       TableSortConfig;
  readonly pagination?: TablePaginationConfig;
}

export interface TableDataPipelineResult {
  readonly rows:          Record<string, unknown>[];  // final rendered rows
  readonly filteredCount: number;                     // count after filtering, before pagination
  readonly totalCount:    number;                     // original row count
  readonly pagination?:   TablePaginationResult;
}
