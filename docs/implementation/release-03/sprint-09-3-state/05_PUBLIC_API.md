# Sprint 9.3 — Public API

## Entry Point

```typescript
import { ... } from '@app/core/platform/table';
// or
import { ... } from '@app/core/platform/table/state';
```

## TableStateEngine — Primary Facade

```typescript
@Injectable({ providedIn: 'root' })
class TableStateEngine {
  // Factory
  createStore(tableId: string, initial?: TableStateUpdate): TableStateStore
  createContext(store: TableStateStore): TableStateContext
  createHistory(maxDepth?: number): TableStateHistory

  // Lifecycle
  initialize(store: TableStateStore, initial?: TableStateUpdate): void
  reset(store: TableStateStore): void
  dispose(store: TableStateStore): void

  // State operations
  update(store: TableStateStore, changes: TableStateUpdate): void
  snapshot(store: TableStateStore): TableStateSnapshot
  restore(store: TableStateStore, snap: TableStateSnapshot): void

  // Validation
  validate(state: TableState | TableStateUpdate): TableStateValidationResult

  // Serialization
  serialize(snap: TableStateSnapshot): string
  deserialize(json: string): TableStateSnapshot

  // Metrics
  metrics(tableId: string): TableStateMetricsSnapshot | null

  // Events
  on(tableId: string | '*', type: TableStateEventType | '*', handler: TableStateEventHandler): () => void

  // Lookup
  getStore(tableId: string): TableStateStore | undefined
  hasStore(tableId: string): boolean
  listStores(): string[]
}
```

## TableStateStore (non-injectable)

```typescript
class TableStateStore {
  readonly tableId:        string                    // get
  readonly loading:        Signal<boolean>
  readonly error:          Signal<string | null>
  readonly density:        Signal<TableDensity>
  readonly visibleColumns: Signal<string[]>
  readonly expandedRows:   Signal<unknown[]>
  readonly focusedCell:    Signal<TableFocusedCell | null>
  readonly hoveredRow:     Signal<unknown | null>
  readonly activeRow:      Signal<unknown | null>
  readonly selection:      Signal<TableSelectionState>
  readonly sort:           Signal<TableSortState>
  readonly filter:         Signal<TableFilterState>
  readonly pagination:     Signal<TablePaginationState>
  readonly editing:        Signal<TableEditingState>

  snapshot(): TableState
  // update / reset / restore: used internally by the engine
}
```

## TableStateContext (non-injectable)

```typescript
class TableStateContext {
  readonly tableId: string
  asReadonly(): TableStateReadonly
  get store(): TableStateStore
}

interface TableStateReadonly {
  loading:        Signal<boolean>
  error:          Signal<string | null>
  density:        Signal<TableDensity>
  visibleColumns: Signal<string[]>
  expandedRows:   Signal<unknown[]>
  focusedCell:    Signal<TableFocusedCell | null>
  hoveredRow:     Signal<unknown | null>
  activeRow:      Signal<unknown | null>
  isLoading:      Signal<boolean>
  hasError:       Signal<boolean>
  isColumnVisible(columnId: string): Signal<boolean>
  isRowExpanded(rowId: unknown): Signal<boolean>
}
```

## TableStateHistory (non-injectable, architecture placeholder)

```typescript
class TableStateHistory {
  readonly canUndo: Signal<boolean>
  readonly canRedo: Signal<boolean>
  readonly depth:   Signal<number>

  push(snapshot: TableStateSnapshot): void
  peek(): TableStateSnapshot | null
  undo(): TableStateSnapshot | null  // returns null until future sprint
  redo(): TableStateSnapshot | null  // returns null until future sprint
  clear(): void
}
```

## Minimum Usage Example

```typescript
// Feature component / page
const stateEngine = inject(TableStateEngine);
const store  = stateEngine.createStore('orders', { visibleColumns: ['id','name','total'] });
const ctx    = stateEngine.createContext(store);
stateEngine.initialize(store);

// In template:
// ctx.asReadonly().density()      → current density (signal)
// ctx.asReadonly().isLoading()    → computed boolean
// ctx.asReadonly().isColumnVisible('email')() → computed boolean per column

// Subscribe to state changes:
const off = stateEngine.on('orders', 'StateChanged', event => {
  console.log('State changed:', event.snapshot.state);
});

// Update state:
stateEngine.update(store, { density: 'compact' });

// Snapshot and restore:
const snap = stateEngine.snapshot(store);
stateEngine.update(store, { visibleColumns: [] });
stateEngine.restore(store, snap); // reverts

// Cleanup:
off(); // unsubscribe
stateEngine.dispose(store);
```
