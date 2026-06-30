# Sprint 9.3 — Signal Design

## Signal Architecture

```
TableStateStore (non-injectable)
├── private _loading        = signal<boolean>(false)
├── private _error          = signal<string | null>(null)
├── private _density        = signal<TableDensity>('default')
├── private _visibleColumns = signal<string[]>([])
├── private _expandedRows   = signal<unknown[]>([])
├── private _focusedCell    = signal<TableFocusedCell | null>(null)
├── private _hoveredRow     = signal<unknown | null>(null)
├── private _activeRow      = signal<unknown | null>(null)
├── private _selection      = signal<TableSelectionState>(...)
├── private _sort           = signal<TableSortState>(...)
├── private _filter         = signal<TableFilterState>(...)
├── private _pagination     = signal<TablePaginationState>(...)
└── private _editing        = signal<TableEditingState>(...)

Public surface (exposed as readonly signals / computed):
├── loading:        Signal<boolean>          = _loading.asReadonly()
├── error:          Signal<string | null>    = _error.asReadonly()
├── density:        Signal<TableDensity>     = _density.asReadonly()
├── visibleColumns: Signal<string[]>         = _visibleColumns.asReadonly()
├── expandedRows:   Signal<unknown[]>        = _expandedRows.asReadonly()
├── focusedCell:    Signal<...>              = _focusedCell.asReadonly()
├── hoveredRow:     Signal<unknown | null>   = _hoveredRow.asReadonly()
├── activeRow:      Signal<unknown | null>   = _activeRow.asReadonly()
├── selection       = computed(() => _selection())
├── sort            = computed(() => _sort())
├── filter          = computed(() => _filter())
├── pagination      = computed(() => _pagination())
└── editing         = computed(() => _editing())
```

## TableStateContext Computed Helpers

```
TableStateContext.asReadonly()
├── ...all store signals (passthrough)
├── isLoading  = computed(() => store.loading())
├── hasError   = computed(() => store.error() !== null)
├── isColumnVisible(columnId) → computed(() => store.visibleColumns().includes(columnId))
└── isRowExpanded(rowId)      → computed(() => store.expandedRows().some(id => id === rowId))
```

`isColumnVisible` and `isRowExpanded` are factory functions — each call creates a new `computed()` bound to a specific ID. Cache results at the call site if needed.

## Why No Injection Context is Needed

`signal()` and `computed()` are plain functions — they do not require `inject()` and do not need an Angular injection context. This means `TableStateStore`, `TableStateContext`, and `TableStateHistory` can all be instantiated with `new` outside of Angular's DI tree, making them:
- Testable without `TestBed`
- Instantiable in non-Angular contexts (e.g., server-side rendering utilities)
- Safe to create in loops or factories

## TableStateMetricsService Signal Usage

```typescript
private readonly _version = signal(0);

readonly trackedCount: Signal<number> = computed(() => {
  this._version(); // declare dependency
  return this._store.size;
});
```

`_version` is bumped after every mutation to invalidate the `trackedCount` computed. This is the same pattern used in `TableRegistryService` (Sprint 9.1) and `TableMetricsService`.
