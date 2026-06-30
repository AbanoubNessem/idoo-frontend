# Sprint 9.5 — Performance Design

## Signal-Based Reactivity

All mutable state lives in Angular signals. Components using `ChangeDetectionStrategy.OnPush` are notified only when a specific signal they read changes. No `markForCheck()` required.

Key reactive signals:
- `selectedIds` — only recalculates when `_selected` set changes
- `selectedCount` — computed from `_selected.size`
- `isEditing` — computed from `editingCell || editingRowId`
- `isDirty` — computed from `pendingEdits.size`
- `isValid` — computed from `validationErrors.size`

## Immutable Set Updates

`TableSelectionContext` uses `ReadonlySet<string>` stored in a signal. Every mutation creates a new `Set` from the existing one. This ensures Angular's signal equality check (`===`) detects the change without deep comparison.

```typescript
const next = new Set(this._selected());
next.add(id);
this._selected.set(next);   // reference changes → signal notifies
```

## Immutable Map Updates

`TableEditingContext` pending edits and validation errors use `Map<string, unknown>` stored in signals. Same pattern — new Map created per mutation.

## isSelected() Factory Signals

`context.isSelected(rowId)` returns a `computed()` that reads `_selected().has(rowId)`. For a grid with N rows, this creates N computed signals. They are lazy and only recalculate when `_selected` changes.

For large datasets (>1000 rows), prefer `context.selectedIds()` and checking membership in the component rather than creating per-row computed signals.

## Context Isolation

Each table has its own `TableSelectionContext` and `TableEditingContext` instance. Selection or edit operations on `t1` do not trigger recalculation in `t2`.

## Event Bus — No Allocation Overhead

`TableInteractionEvents` iterates handler maps synchronously. No queuing, no microtask scheduling, no allocation per emit. Each `emit()` is a direct iteration through registered handlers — O(h) where h = handlers registered for that table + type.

## Editor Registry — O(1) Lookup

`TableCellEditorRegistry` uses `Map`. `getEditor()` and `resolveEditorTypeForColumn()` are both O(1).

## Metrics — Write Counters, Read Snapshots

Metrics counters are plain numbers in a `Map` entry. Recording is O(1). `getSnapshot()` does a single frozen object allocation per call.

## Strategy Per-Table

`TableSelectionStrategy` and `TableEditingStrategy` are plain classes. No DI, no signal overhead. Created once per table context and held in the engine map.
