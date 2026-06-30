# Sprint 9.4 — Test Report

## Test Files

| File | Subject | Cases |
|------|---------|-------|
| `table-sort-context.spec.ts` | `TableSortContext` | 15 |
| `table-filter-context.spec.ts` | `TableFilterContext` | 14 |
| `table-pagination-context.spec.ts` | `TablePaginationContext` | 25 |
| `table-comparator-registry.service.spec.ts` | `TableComparatorRegistry` | 20 |
| `table-filter-registry.service.spec.ts` | `TableFilterRegistry` | 10 |
| `table-sorting-engine.service.spec.ts` | `TableSortingEngine` | 16 |
| `table-filtering-engine.service.spec.ts` | `TableFilteringEngine` | 22 |
| `table-pagination-engine.service.spec.ts` | `TablePaginationEngine` | 18 |
| `table-data-pipeline.service.spec.ts` | `TableDataPipeline` | 13 |
| `table-data-engine.service.spec.ts` | `TableDataEngine` | 18 |
| **Total** | | **~171** |

## Coverage Areas

### TableSortContext
- Default state (no fields, isActive=false)
- Constructor initial fields
- `setFields()`, `clear()`, `addField()` in multi/single-column mode
- `addField()` replaces existing by columnId
- `removeField()` by columnId
- `toggleField()` cycles asc→desc→remove
- `setMultiColumn(false)` trims to first field
- `toConfig()` frozen and independent of mutations

### TableFilterContext
- Default isActive=false, conditionCount=0
- Constructor initial group
- `addCondition()` appends or replaces
- `removeCondition()` by columnId
- `setLogic()` changes AND/OR
- `setGroup()` replaces root
- `clear()` resets
- `toConfig()` frozen and independent of mutations
- Nested groups preserved in `toConfig()`

### TablePaginationContext
- Defaults (page=1, pageSize=25, total=0)
- `pageCount` computation (ceil formula)
- `pageCount=1` for empty dataset
- `hasFirst`, `hasLast`, `hasPrevious`, `hasNext` all four states
- `next()` / `previous()` / `first()` / `last()` navigation
- Boundary enforcement (no < 1, no > pageCount)
- `setPage()` clamps
- `setPageSize()` resets to page 1
- `setTotalCount()` clamps page
- `startIndex` / `endIndex` computation
- Partial last page `endIndex`
- `toConfig()` and `toResult()`

### TableComparatorRegistry
- Built-in 5 comparators present
- Each built-in comparator produces correct ordering
- Text comparator case-insensitive
- Number comparator numeric
- Date comparator chronological
- Boolean: false < true
- Locale: delegates to Intl.Collator
- `register()` + `get()` + `remove()` + `list()`
- Override built-in
- `get()` returns null for unknown

### TableFilterRegistry
- Starts empty
- `registerPredicate()` / `getPredicate()` / `hasPredicate()` / `removePredicate()` / `list()`
- Predicate evaluates correctly
- `registeredCount` reactive

### TableSortingEngine
- No-op when no fields
- Original array not mutated
- String sort asc/desc
- Number sort asc/desc
- Boolean sort
- Date sort
- Nulls last
- Stable sort (preserves original order on equality)
- Multi-column sort (secondary key)
- Named comparator from registry
- Dot-notation field paths
- Locale-aware comparator

### TableFilteringEngine
- No-op for empty conditions
- Original array not mutated
- All 12 operators: contains, startsWith, endsWith, equals, notEquals, greaterThan, lessThan, between, in, boolean, date, custom
- Case-sensitivity
- AND compound filter
- OR compound filter
- Nested group evaluation
- Dot-notation field paths

### TablePaginationEngine
- No mutation of original
- First page rows
- Second page rows
- Partial last page
- Page clamping beyond pageCount
- `totalCount` = rows.length
- `pageCount` formula
- `hasFirst`/`hasLast`/`hasPrevious`/`hasNext`
- `startIndex`/`endIndex` formula
- Partial page endIndex capped
- Empty rows

### TableDataPipeline
- No mutation
- All rows when no ops
- Filter only
- `filteredCount` vs `totalCount`
- Sort only
- Pagination only
- Pipeline order: filter → sort → paginate
- filteredCount used for pagination totalCount
- Result frozen
- Empty rows

### TableDataEngine
- Factory methods
- Direct `sort()`, `filter()`, `paginate()`
- `run()` full pipeline
- `runWithContexts()` with all contexts
- `runWithContexts()` skips inactive contexts
- `runWithContexts()` updates paginationCtx.totalCount
- `registerComparator()` + custom sort
- `registerFilter()` + custom filter predicate
