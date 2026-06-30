# Sprint 9.5 — Test Report

## Test Files

| File | Subject | Cases |
|------|---------|-------|
| `table-selection-context.spec.ts` | `TableSelectionContext` | 22 |
| `table-editing-context.spec.ts` | `TableEditingContext` | 20 |
| `table-selection-strategy.spec.ts` | `TableSelectionStrategy` | 15 |
| `table-editing-strategy.spec.ts` | `TableEditingStrategy` | 10 |
| `table-cell-editor-registry.service.spec.ts` | `TableCellEditorRegistry` | 20 |
| `table-editor-resolver.service.spec.ts` | `TableEditorResolver` | 12 |
| `table-selection-engine.service.spec.ts` | `TableSelectionEngine` | 22 |
| `table-editing-engine.service.spec.ts` | `TableEditingEngine` | 28 |
| `table-interaction-events.service.spec.ts` | `TableInteractionEvents` | 15 |
| `table-interaction-metrics.service.spec.ts` | `TableInteractionMetrics` | 14 |
| **Total** | | **~178** |

---

## Coverage Areas

### TableSelectionContext
- Default state, constructor modes
- `select()` in multi/single/none mode
- Multi-select accumulation
- `deselect()`, `toggle()` lifecycle
- `selectRange()` forward, reverse, boundary
- `selectAll()` / `clearSelection()`
- `isSelected()` / `isAllSelected()` signals
- `setMode()` with trim-to-first behavior
- `setCurrentRow` / `setCurrentCell` / `setAnchorRow`
- `toSnapshot()` frozen + independent

### TableEditingContext
- Default state, constructor modes
- `startCellEdit()` / `startRowEdit()` state setup
- `setValue()` / `getValue()` pending override
- `getOriginalValue()` preservation
- `isDirty` reactivity
- `setValidationError()` / `clearValidationError()`
- `isValid()` reactivity
- `collectCommits()` correctness, frozen, empty
- `cancelEdit()` full cleanup
- `toSnapshot()` frozen

### TableSelectionStrategy
- `apply()` for all 6 action types
- Anchor updates
- Range with/without anchor
- `canSelect()` / `canMultiSelect()` gate checks

### TableEditingStrategy
- `canEdit()` with readOnly, editMode: none
- `resolveMode()` column override vs default
- `shouldCommitOnEnter/Blur/Tab/CancelOnEscape`
- Cell vs row mode differences

### TableCellEditorRegistry
- All 11 built-in editors present
- `registerEditor()` / `removeEditor()` / `getEditor()` / `hasEditor()`
- Built-in override
- `mapColumnType()` custom mapping
- `listEditors()` / `listMappings()`
- `registeredCount` reactive

### TableEditorResolver
- Built-in column type resolution
- Fallback on unknown column type
- Override editor type
- Fallback when editor removed
- `resolveByType()` with and without editor
- `supports()` gate
- Frozen resolution objects

### TableSelectionEngine
- `createContext()` + event + metrics
- `select/deselect/toggle/selectRange/selectAll/clear` — mutations + events
- `setCurrentRow` / `setCurrentCell`
- Metrics integration
- `snapshot()` frozen / null for unknown
- `dispose()` cleanup

### TableEditingEngine
- `createContext()` lifecycle
- `startCellEdit()` / `startRowEdit()` + events
- `setValue()` / `getValue()`
- `commitEdit()` success, null on no edit, null on validation fail
- `cancelEdit()` + event + metrics
- `validate()` — pass, fail, event, metrics
- `registerValidator` / `removeValidator`
- `resolveEditor()` with override
- `canEdit()` unknown/editable/readOnly
- `snapshot()` / `dispose()` / `listTables()`

### TableInteractionEvents
- `on()` + `emit()` matching
- Non-matching table/type filtering
- Wildcard tableId, wildcard type, double wildcard
- Unsubscribe stops delivery
- `off()` removes type handlers
- `clear()` removes all for table
- `handlerCount` reactive

### TableInteractionMetrics
- Initial state
- `track()` idempotency
- All 5 record operations increment counters
- `lastActivityAt` updated on record
- Auto-track unknown table on record
- `getSnapshot()` null / frozen / trackedTables
- `dispose()` removes table
