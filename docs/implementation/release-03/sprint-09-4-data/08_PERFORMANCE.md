# Sprint 9.4 — Performance Design

## Immutable Operations — No Mutation

Every engine method returns a **new array**. The original `rows` reference is never modified:

```typescript
// TableSortingEngine.sort()
const indexed = rows.map((row, i) => ({ row, i }));  // allocates once
indexed.sort(...);
return indexed.map(({ row }) => row);  // allocates once

// TableFilteringEngine.filter()
return rows.filter(row => this._matchGroup(row, config.root));  // new array

// TablePaginationEngine.paginate()
return { rows: rows.slice(startIndex, endIndex + 1), result };  // slice = new array
```

Consumers can safely cache the original `rows` signal without defensive copies.

## Pipeline Avoids Redundant Work

`TableDataPipeline.run()` short-circuits each step:
- Filter is skipped (cheap array copy) when config is absent
- Sort is skipped entirely when `config.fields` is empty
- Pagination is skipped when config is absent

`TableDataEngine.runWithContexts()` further reduces allocations:
- Only calls `filterCtx.toConfig()` when `filterCtx.isActive()`
- Only calls `sortCtx.toConfig()` when `sortCtx.isActive()`
- Avoids building frozen config objects for empty/inactive contexts

## Stable Sort Cost

Stable sort via indexing allocates one `{ row, i }` wrapper per row. This is `O(n)` space. For typical tables (< 10,000 rows), this is negligible. The sort itself is `O(n log n)`.

## Context Signals — OnPush Friendly

All three context classes expose Angular signals. Components that read `paginationCtx.pageCount()` or `filterCtx.isActive()` are notified only when those specific values change. No `markForCheck()` required.

## `toConfig()` Cost

`toConfig()` calls `Object.freeze()` and copies arrays. For typical configs (≤10 sort fields, ≤20 filter conditions), this is `O(n)` with very small `n`. Calling `toConfig()` per pipeline run is acceptable.

## Comparator Registry — O(1) Lookup

`TableComparatorRegistry` is a `Map`. `get(id)` is O(1). No iteration is done at sort time — the registry is looked up once per sort field, not once per row comparison.

## Filter Short-Circuiting

`Array.prototype.filter` + `Array.prototype.every/some` both short-circuit:
- AND logic (`every`): stops on the first false condition
- OR logic (`some`): stops on the first true condition

Nested groups short-circuit in the same way.
