# Sprint 9.5 — Public API

## Entry Point

```typescript
import { ... } from '@app/core/platform/table';
// or
import { ... } from '@app/core/platform/table/interaction';
```

---

## TableSelectionEngine — Selection Facade

```typescript
@Injectable({ providedIn: 'root' })
class TableSelectionEngine {
  // Lifecycle
  createContext(tableId: string, mode?: TableSelectionMode): TableSelectionContext
  getContext(tableId: string): TableSelectionContext | null
  hasContext(tableId: string): boolean
  listTables(): readonly string[]
  dispose(tableId: string): void

  // Selection actions (delegate to strategy)
  select(tableId: string, rowId: string): void
  deselect(tableId: string, rowId: string): void
  toggle(tableId: string, rowId: string, allIds?: readonly string[]): void
  selectRange(tableId: string, toRowId: string, allIds: readonly string[]): void
  selectAll(tableId: string, allIds: readonly string[]): void
  clearSelection(tableId: string): void

  // Navigation
  setCurrentRow(tableId: string, rowId: string | null): void
  setCurrentCell(tableId: string, cell: TableCellRef | null): void

  // Generic action dispatch
  apply(tableId: string, action: TableSelectionAction, allIds?: readonly string[]): void

  // Snapshot
  snapshot(tableId: string): TableSelectionSnapshot | null
}
```

---

## TableEditingEngine — Editing Facade

```typescript
@Injectable({ providedIn: 'root' })
class TableEditingEngine {
  // Lifecycle
  createContext(tableId: string, mode?: TableEditMode): TableEditingContext
  getContext(tableId: string): TableEditingContext | null
  hasContext(tableId: string): boolean
  listTables(): readonly string[]
  dispose(tableId: string): void

  // Editability
  canEdit(tableId: string, check: TableEditabilityCheck): boolean

  // Edit operations
  startCellEdit(tableId: string, cell: TableCellRef, originalValue: unknown): void
  startRowEdit(tableId: string, rowId: string, originalValues: Record<string, unknown>): void
  setValue(tableId: string, columnId: string, value: unknown): void
  getValue(tableId: string, columnId: string): unknown
  commitEdit(tableId: string, row?: Record<string, unknown>): readonly TableEditCommit[] | null
  cancelEdit(tableId: string): void

  // Validation
  validate(tableId: string, row: Record<string, unknown>): boolean
  registerValidator(tableId: string, columnId: string, fn: TableValidatorFn): void
  removeValidator(tableId: string, columnId: string): void

  // Editor resolution
  resolveEditor(columnType: string, overrideType?: TableEditorType): TableEditorResolution

  // Snapshot
  snapshot(tableId: string): TableEditingSnapshot | null
}
```

---

## TableSelectionContext (non-injectable)

```typescript
class TableSelectionContext {
  // Signals (read-only)
  readonly mode:          Signal<TableSelectionMode>
  readonly selectedIds:   Signal<readonly string[]>
  readonly selectedCount: Signal<number>
  readonly hasSelection:  Signal<boolean>
  readonly currentRowId:  Signal<string | null>
  readonly currentCell:   Signal<TableCellRef | null>
  readonly anchorRowId:   Signal<string | null>

  // Computed factories
  isSelected(id: string): Signal<boolean>
  isAllSelected(allIds: readonly string[]): Signal<boolean>

  // Mutations
  select(id: string): void
  deselect(id: string): void
  toggle(id: string): void
  selectRange(fromId: string, toId: string, allIds: readonly string[]): void
  selectAll(allIds: readonly string[]): void
  clearSelection(): void
  setCurrentRow(id: string | null): void
  setCurrentCell(cell: TableCellRef | null): void
  setAnchorRow(id: string | null): void
  setMode(mode: TableSelectionMode): void

  // Snapshot
  toSnapshot(): TableSelectionSnapshot
}
```

---

## TableEditingContext (non-injectable)

```typescript
class TableEditingContext {
  // Signals (read-only)
  readonly mode:          Signal<TableEditMode>
  readonly editingCell:   Signal<TableCellRef | null>
  readonly editingRowId:  Signal<string | null>
  readonly isEditing:     Signal<boolean>
  readonly isDirty:       Signal<boolean>
  readonly isValid:       Signal<boolean>
  readonly pendingCount:  Signal<number>
  readonly errorCount:    Signal<number>

  // Cell/Row edit
  startCellEdit(cell: TableCellRef, originalValue: unknown): void
  startRowEdit(rowId: string, originalValues: Record<string, unknown>): void

  // Values
  setValue(columnId: string, value: unknown): void
  getValue(columnId: string): unknown
  getOriginalValue(columnId: string): unknown

  // Validation
  setValidationError(columnId: string, error: string): void
  clearValidationError(columnId: string): void
  getValidationError(columnId: string): string | null

  // Commit / Cancel
  collectCommits(tableId: string): readonly TableEditCommit[]
  cancelEdit(): void
  clearEdits(): void

  // Snapshot
  toSnapshot(): TableEditingSnapshot
}
```

---

## Minimum Usage Example

```typescript
const selectionEngine = inject(TableSelectionEngine);
const editingEngine   = inject(TableEditingEngine);

// Selection setup
const selCtx = selectionEngine.createContext('my-table', 'multi');

// Handle click
selectionEngine.toggle('my-table', row.id, allRowIds);

// Handle shift-click (range)
selectionEngine.selectRange('my-table', row.id, allRowIds);

// Editing — start
editingEngine.createContext('my-table', 'cell');
editingEngine.startCellEdit('my-table', { rowId: row.id, columnId: 'name' }, row.name);

// User changes value
editingEngine.setValue('my-table', 'name', newValue);

// Commit
const commits = editingEngine.commitEdit('my-table');
if (commits) {
  // apply commits to your data source
}
```
