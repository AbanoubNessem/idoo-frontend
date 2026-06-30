# Sprint 9.4 — Public API

## Entry Point

```typescript
import { ... } from '@app/core/platform/table';
// or
import { ... } from '@app/core/platform/table/data';
```

## TableDataEngine — Primary Facade

```typescript
@Injectable({ providedIn: 'root' })
class TableDataEngine {
  // Context factories
  createSortContext(initial?: Partial<TableSortConfig>): TableSortContext
  createFilterContext(initial?: TableFilterGroup): TableFilterContext
  createPaginationContext(initial?: Partial<TablePaginationConfig & { totalCount: number }>): TablePaginationContext

  // Full pipeline
  run(input: TableDataPipelineInput): TableDataPipelineResult
  runWithContexts(
    rows:          Row[],
    sortCtx?:      TableSortContext,
    filterCtx?:    TableFilterContext,
    paginationCtx?: TablePaginationContext,
  ): TableDataPipelineResult

  // Direct operations
  sort(rows: Row[], config: TableSortConfig): Row[]
  filter(rows: Row[], config: TableFilterConfig): Row[]
  paginate(rows: Row[], config: TablePaginationConfig): { rows: Row[]; result: TablePaginationResult }

  // Registry
  registerComparator(id: string, fn: TableComparatorFn): void
  registerFilter(id: string, fn: TableFilterPredicateFn): void
  hasComparator(id: string): boolean
  hasFilter(id: string): boolean
}
```

## Context Classes (non-injectable)

```typescript
class TableSortContext {
  readonly fields:       Signal<TableSortField[]>
  readonly multiColumn:  Signal<boolean>
  readonly isActive:     Signal<boolean>
  readonly fieldCount:   Signal<number>

  setFields(fields: TableSortField[]): void
  addField(field: TableSortField): void
  removeField(columnId: string): void
  toggleField(field: TableSortField): void  // cycles asc→desc→remove
  setMultiColumn(multi: boolean): void
  clear(): void
  toConfig(): TableSortConfig               // frozen snapshot
}

class TableFilterContext {
  readonly root:           Signal<TableFilterGroup>
  readonly isActive:       Signal<boolean>
  readonly conditionCount: Signal<number>

  setGroup(group: TableFilterGroup): void
  setLogic(logic: TableFilterLogic): void
  addCondition(condition: TableFilterCondition): void
  removeCondition(columnId: string): void
  clear(): void
  toConfig(): TableFilterConfig              // frozen snapshot
}

class TablePaginationContext {
  readonly page:       Signal<number>
  readonly pageSize:   Signal<number>
  readonly totalCount: Signal<number>
  readonly pageCount:  Signal<number>
  readonly hasFirst:   Signal<boolean>
  readonly hasLast:    Signal<boolean>
  readonly hasPrevious:Signal<boolean>
  readonly hasNext:    Signal<boolean>
  readonly startIndex: Signal<number>
  readonly endIndex:   Signal<number>

  setPage(page: number): void
  setPageSize(size: number): void
  setTotalCount(count: number): void
  first(): void
  last(): void
  previous(): void
  next(): void
  toConfig(): TablePaginationConfig          // { page, pageSize }
  toResult(): TablePaginationResult          // full frozen snapshot for display
}
```

## Minimum Usage Example

```typescript
const dataEngine = inject(TableDataEngine);

const sortCtx   = dataEngine.createSortContext();
const filterCtx = dataEngine.createFilterContext();
const pageCtx   = dataEngine.createPaginationContext({ pageSize: 10 });

// React to user interaction:
filterCtx.addCondition({ columnId: 'name', field: 'name', operator: 'contains', value: searchQuery });
sortCtx.toggleField({ columnId: 'name', field: 'name', direction: 'asc' });

// Run pipeline:
const result = dataEngine.runWithContexts(allRows, sortCtx, filterCtx, pageCtx);
// result.rows → pass to <platform-table [rows]="result.rows">
// pageCtx.totalCount(), pageCtx.pageCount() → reactive pagination UI
```
