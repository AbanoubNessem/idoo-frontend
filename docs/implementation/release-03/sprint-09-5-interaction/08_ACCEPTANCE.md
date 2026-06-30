# Sprint 9.5 — Acceptance Checklist

## TypeScript

- [x] `tsconfig.app.json` compiles with 0 errors
- [x] All public APIs typed — no `any` in public signatures
- [x] Frozen snapshots: `TableSelectionSnapshot`, `TableEditingSnapshot`, `TableEditCommit`, `TableEditorResolution`

## Selection

- [x] Single mode — only one row selected at a time
- [x] Multi mode — multiple rows selectable
- [x] None mode — selection disabled
- [x] `toggle()` cycles selected ↔ deselected
- [x] `selectRange()` uses anchor and allIds to determine bounds
- [x] `selectAll()` / `clearSelection()` work correctly
- [x] `currentRowId` / `currentCell` / `anchorRowId` state maintained
- [x] `setMode()` trims to first when downgrading from multi to single
- [x] `isSelected(id)` returns reactive `Signal<boolean>`
- [x] `isAllSelected(allIds)` returns reactive `Signal<boolean>`

## Editing Lifecycle

- [x] `startCellEdit()` puts context in cell edit mode with original value
- [x] `startRowEdit()` puts context in row edit mode with all original values
- [x] `setValue()` updates pending edit, `isDirty` becomes true
- [x] `getValue()` returns pending value if set, else original
- [x] `cancelEdit()` clears all state — `isEditing` false, `isDirty` false
- [x] `commitEdit()` returns frozen `TableEditCommit[]` with value + previousValue
- [x] `commitEdit()` returns `null` when not editing
- [x] `commitEdit()` returns `null` when validation fails

## Validation Hook

- [x] Validators registered per `(tableId, columnId)`
- [x] Validators receive `(value, TableEditContext)`
- [x] Failed validator sets error on context — `isValid()` becomes false
- [x] Passed validator clears error — `isValid()` becomes true
- [x] `EditValidationFailed` event emitted when any validator fails
- [x] `removeValidator()` stops the validator from running

## Editor Registry

- [x] All 11 built-in editor types registered on startup
- [x] Column types mapped to editor types (12 default mappings)
- [x] `registerEditor()` adds or overrides
- [x] `removeEditor()` removes and updates `registeredCount`
- [x] `mapColumnType()` registers custom column → editor mapping
- [x] `resolveEditorTypeForColumn()` falls back to `text` for unknown types
- [x] `TableEditorResolver.resolve()` falls back to text when editor not found
- [x] Resolution objects are frozen

## Events

- [x] Exact table+type handler fires on match
- [x] Wildcard `'*'` tableId fires on all tables
- [x] Wildcard `'*'` type fires on all event types
- [x] Unsubscribe function removes handler
- [x] `clear(tableId)` removes all handlers for a table
- [x] `handlerCount` signal is reactive

## Architecture

- [x] Selection engine imports nothing from rendering layer
- [x] Editing engine imports nothing from rendering layer
- [x] Editors referenced by type token only — no Angular component coupling
- [x] No RxJS
- [x] No NgRx
- [x] No circular dependencies
- [x] No business modules
- [x] No API calls
- [x] No persistence

## Documentation

- [x] 10 documentation files generated in `docs/implementation/release-03/sprint-09-5-interaction/`
