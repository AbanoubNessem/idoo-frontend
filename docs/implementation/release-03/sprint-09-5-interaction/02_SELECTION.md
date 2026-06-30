# Sprint 9.5 — Selection Design

## Selection Modes

| Mode | Behaviour |
|------|-----------|
| `single` | At most one row selected at any time. New selection replaces previous. Range/selectAll disabled. |
| `multi` | Multiple rows. Toggle, range, and selectAll all work. |
| `none` | Selection disabled. `select()` / `toggle()` are no-ops. |

---

## Action Types

| Action | Behaviour |
|--------|-----------|
| `select` | Selects a row. Respects mode. Updates anchor. |
| `deselect` | Removes a row from selection. |
| `toggle` | Selects if not selected; deselects if selected. Updates anchor. |
| `range` | Selects from anchor to target (inclusive). Multi mode only. |
| `selectAll` | Selects all provided row IDs. Multi mode only. Clears anchor. |
| `clear` | Empties selection. Clears anchor. |

---

## Range Selection Design

```
anchor (set by last select/toggle)
       │
       └─ strategy.apply({ type: 'range', rowId: target, allIds })
              │
              └─ context.selectRange(anchor, target, allIds)
                    │
                    └─ find indices in allIds → add all rows in [start, end]
```

Requires `allIds` — the ordered row ID array — to determine the range boundaries. Adding to existing selection (does not clear prior selection before applying range).

---

## Keyboard Navigation Structure

The following state is ready for keyboard event handlers to consume and update:

| Signal | Purpose |
|--------|---------|
| `currentRowId` | The currently focused/navigated row |
| `currentCell` | `{ rowId, columnId }` for cell-level navigation |
| `anchorRowId` | Start of a shift-click range |

The platform does not directly handle `keydown` events — component layer reads signals and calls engine methods (`setCurrentRow`, `setCurrentCell`, `selectRange`).

---

## Engine Lifecycle

```
1. engine.createContext(tableId, mode)     → TableSelectionContext
2. engine.select(tableId, rowId)           → context.select → event emitted
3. engine.selectRange(tableId, to, allIds) → strategy.apply → context.selectRange
4. engine.snapshot(tableId)               → context.toSnapshot() → frozen
5. engine.dispose(tableId)                → context + strategy removed
```

---

## Emitted Events

| Event | When |
|-------|------|
| `SelectionChanged` | Context created; toggle; range |
| `RowSelected` | `select()` action |
| `RowDeselected` | `deselect()` action |
| `AllSelected` | `selectAll()` action |
| `SelectionCleared` | `clear()` action |
| `CurrentRowChanged` | `setCurrentRow()` |
| `CurrentCellChanged` | `setCurrentCell()` |
