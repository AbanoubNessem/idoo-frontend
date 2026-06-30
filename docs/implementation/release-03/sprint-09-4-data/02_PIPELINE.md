# Sprint 9.4 — Data Pipeline

## Pipeline Overview

```
Original Data (rows: Record<string, unknown>[])
        │   (never mutated)
        ▼
─── Step 1: Filter ───────────────────────────────────────────────────────
TableFilteringEngine.filter(rows, config)
  → evaluates TableFilterGroup (AND/OR logic + nested groups)
  → applies 12 built-in operators per condition
  → calls custom predicates from TableFilterRegistry
  → returns new array: filteredRows
        │
        ▼  filteredCount = filteredRows.length
        │
─── Step 2: Sort ─────────────────────────────────────────────────────────
TableSortingEngine.sort(filteredRows, config)
  → stable sort via original-index tiebreaking
  → multi-column: primary, secondary, ... comparisons in order
  → direction: asc / desc per field
  → comparator: auto-detect (number/boolean/string) or named from registry
  → locale-aware: Intl.Collator when locale is specified
  → returns new array: sortedRows
        │
        ▼
─── Step 3: Paginate ─────────────────────────────────────────────────────
TablePaginationEngine.paginate(sortedRows, config)
  → derives totalCount from sortedRows.length
  → computes pageCount = ceil(totalCount / pageSize)
  → clamps page to [1, pageCount]
  → returns { rows: pagedRows, result: TablePaginationResult }
        │
        ▼
TableDataPipelineResult {
  rows:          Row[]                   // final rendered rows
  filteredCount: number                  // after filter, before pagination
  totalCount:    number                  // original row count
  pagination?:   TablePaginationResult   // present if pagination was applied
}
```

## TableDataPipeline Orchestrator

`TableDataPipeline.run(input)` executes all three steps in sequence. Each step is skipped when its config is absent:
- No `filter` → `filteredRows = [...rows]` (copy, no filtering)
- No `sort.fields` → rows passed through unchanged
- No `pagination` → all rows returned; no `pagination` key in result

## Context-Based Execution

`TableDataEngine.runWithContexts(rows, sortCtx?, filterCtx?, paginationCtx?)` is the recommended high-level API:

1. Calls `filterCtx.toConfig()` only when `filterCtx.isActive()` — avoids unnecessary work
2. Calls `sortCtx.toConfig()` only when `sortCtx.isActive()`
3. After the run, calls `paginationCtx.setTotalCount(result.filteredCount)` to keep reactive signals current (page count, navigation helpers)
