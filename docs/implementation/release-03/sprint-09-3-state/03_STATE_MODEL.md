# Sprint 9.3 — State Model

## TableState

The complete runtime state of one table instance:

```typescript
interface TableState {
  tableId:        string;
  loading:        boolean;
  error:          string | null;
  density:        TableDensity;          // 'compact' | 'default' | 'comfortable'
  visibleColumns: string[];              // ordered column IDs
  expandedRows:   unknown[];             // row IDs of expanded rows
  focusedCell:    TableFocusedCell | null;
  hoveredRow:     unknown | null;
  activeRow:      unknown | null;
  selection:      TableSelectionState;   // placeholder
  sort:           TableSortState;        // placeholder
  filter:         TableFilterState;      // placeholder
  pagination:     TablePaginationState;  // placeholder
  editing:        TableEditingState;     // placeholder
}
```

## Placeholder Sub-States

The following sub-states are defined architecturally with a single `active: boolean` flag. Full fields will be added in dedicated future sprints.

| Sub-state | Future sprint |
|-----------|---------------|
| `TableSortState` | Sprint 9.X — Sorting |
| `TableFilterState` | Sprint 9.X — Filtering |
| `TablePaginationState` | Sprint 9.X — Pagination |
| `TableSelectionState` | Sprint 9.X — Selection |
| `TableEditingState` | Sprint 9.X — Editing |

## TableStateSnapshot

Immutable point-in-time capture of a `TableState`:

```typescript
interface TableStateSnapshot {
  id:         string;              // unique, auto-incremented ('state-snap-N')
  tableId:    string;
  capturedAt: string;              // ISO 8601
  state:      Readonly<TableState>;
}
```

## Platform Defaults

```typescript
TABLE_STATE_DEFAULTS = {
  loading:        false,
  error:          null,
  density:        'default',
  visibleColumns: [],
  expandedRows:   [],
  focusedCell:    null,
  hoveredRow:     null,
  activeRow:      null,
  selection:      { active: false, mode: 'none' },
  sort:           { active: false },
  filter:         { active: false },
  pagination:     { active: false },
  editing:        { active: false },
}
```

## State Events

| Event | When emitted |
|-------|-------------|
| `StateInitialized` | After `engine.initialize()` |
| `StateChanged` | After `engine.update()` or `engine.restore()` |
| `StateReset` | After `engine.reset()` |
| `StateDisposed` | After `engine.dispose()` |

Each event carries a fresh `TableStateSnapshot` at the time of emission.
