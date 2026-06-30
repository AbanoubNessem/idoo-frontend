# Sprint 9.4 — Pagination

## TablePaginationConfig

```typescript
interface TablePaginationConfig {
  page:     number;   // 1-based current page
  pageSize: number;   // rows per page
}
```

`totalCount` is NOT in the config — it is derived from `rows.length` inside `TablePaginationEngine.paginate()`. This ensures the count always reflects the filtered dataset passed to the engine.

## TablePaginationResult

```typescript
interface TablePaginationResult {
  page:        number;   // actual page (clamped to [1, pageCount])
  pageSize:    number;
  totalCount:  number;   // = filteredRows.length
  pageCount:   number;   // = ceil(totalCount / pageSize)
  hasFirst:    boolean;  // page > 1
  hasLast:     boolean;  // page < pageCount
  hasPrevious: boolean;  // page > 1
  hasNext:     boolean;  // page < pageCount
  startIndex:  number;   // 0-based index of first row on page
  endIndex:    number;   // 0-based index of last row on page (inclusive)
}
```

## TablePaginationEngine

```typescript
paginate(rows: Row[], config: TablePaginationConfig): { rows: Row[]; result: TablePaginationResult }
```

- Returns a **slice** of the input rows (no mutation)
- Clamps `page` to `[1, pageCount]` automatically
- `endIndex` is capped at `totalCount - 1` for partial last pages
- Empty dataset: `pageCount = 1`, `endIndex = -1`

## TablePaginationContext Signal API

```typescript
const paginationCtx = dataEngine.createPaginationContext({ page: 1, pageSize: 25 });

// Navigation
paginationCtx.first();
paginationCtx.last();
paginationCtx.previous();
paginationCtx.next();
paginationCtx.setPage(3);
paginationCtx.setPageSize(50);  // resets to page 1

// Called after each pipeline run
paginationCtx.setTotalCount(result.filteredCount);

// Reactive signals (for UI)
paginationCtx.page()        // Signal<number>
paginationCtx.pageSize()    // Signal<number>
paginationCtx.totalCount()  // Signal<number>
paginationCtx.pageCount()   // computed Signal<number>
paginationCtx.hasFirst()    // computed Signal<boolean>
paginationCtx.hasLast()     // computed Signal<boolean>
paginationCtx.hasPrevious() // computed Signal<boolean>
paginationCtx.hasNext()     // computed Signal<boolean>
paginationCtx.startIndex()  // computed Signal<number>
paginationCtx.endIndex()    // computed Signal<number>

// Snapshot for pipeline
paginationCtx.toConfig()    // { page, pageSize }
paginationCtx.toResult()    // full frozen TablePaginationResult for display
```

## Reactive Flow (with runWithContexts)

```typescript
// After each data change:
const result = dataEngine.runWithContexts(rows, sortCtx, filterCtx, paginationCtx);
// → paginationCtx.totalCount() now equals result.filteredCount
// → paginationCtx.pageCount() recomputes automatically
// → paginationCtx.hasNext() / hasLast() update automatically
// → UI re-renders driven by Angular signals
```

## Page Size Constraints

- Minimum: 1
- Maximum: 1,000
- `setPageSize()` resets to page 1 to prevent out-of-range page
- `setTotalCount()` clamps current page if it exceeds new `pageCount`
