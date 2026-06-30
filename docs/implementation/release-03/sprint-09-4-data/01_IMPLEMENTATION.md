# Sprint 9.4 — Dynamic Table Data Operations: Implementation

## Overview

Sprint 9.4 implements the data operations layer for the Dynamic Table system. It sits between the State Engine (Sprint 9.3) and the Rendering Engine (Sprint 9.2), transforming raw data arrays through a configurable pipeline of filtering, sorting, and pagination. The original data is never mutated.

## Directory Structure

```
src/app/core/platform/table/data/
├── table-data.types.ts                      # All types: sort, filter, pagination, pipeline
├── table-data.constants.ts                  # Defaults, built-in comparator IDs
├── table-sort-context.ts                    # Per-instance sort signal state (non-injectable)
├── table-filter-context.ts                  # Per-instance filter signal state (non-injectable)
├── table-pagination-context.ts              # Per-instance pagination signal state (non-injectable)
├── table-comparator-registry.service.ts     # Built-in + custom comparator registry
├── table-filter-registry.service.ts         # Custom filter predicate registry
├── table-sorting-engine.service.ts          # Sort logic (stable, multi-column, locale)
├── table-filtering-engine.service.ts        # Filter logic (12 operators, compound AND/OR)
├── table-pagination-engine.service.ts       # Pagination logic (client-side slicing)
├── table-data-pipeline.service.ts           # Orchestrates filter→sort→paginate
├── table-data-engine.service.ts             # Public facade
└── index.ts                                 # Public API barrel
tests/
├── table-sort-context.spec.ts
├── table-filter-context.spec.ts
├── table-pagination-context.spec.ts
├── table-comparator-registry.service.spec.ts
├── table-filter-registry.service.spec.ts
├── table-sorting-engine.service.spec.ts
├── table-filtering-engine.service.spec.ts
├── table-pagination-engine.service.spec.ts
├── table-data-pipeline.service.spec.ts
└── table-data-engine.service.spec.ts
```

## Source File Count

| Category | Count |
|----------|-------|
| Type / constant files | 2 |
| Non-injectable context classes | 3 |
| Injectable registry services | 2 |
| Injectable engine services | 3 |
| Pipeline + facade | 2 |
| Barrel index | 1 |
| **Total** | **13** |

## Key Principles

- Original data arrays are **never mutated** — all operations return new arrays
- All context snapshots (`toConfig()`) are **frozen** immutable objects  
- **Stable sort** guaranteed via original-index tiebreaking
- **Dot-notation** field paths supported across all operations (`address.city`)
- No RxJS, no NgRx, no third-party data libraries
