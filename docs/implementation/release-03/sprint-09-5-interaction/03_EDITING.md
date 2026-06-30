# Sprint 9.5 — Editing Design

## Edit Modes

| Mode | Behaviour |
|------|-----------|
| `cell` | One cell editable at a time. Commit on Enter/Tab/blur. |
| `row` | Entire row editable simultaneously. Commit explicit (button/Enter). |
| `none` | Editing disabled globally. |

---

## Editing Lifecycle

```
1. engine.startCellEdit(tableId, { rowId, columnId }, originalValue)
       │
       └─ context.startCellEdit → stores originalValue, clears pending edits

2. engine.setValue(tableId, columnId, value)
       │
       └─ context.setValue → pending edits map updated

3. engine.validate(tableId, row)           [optional pre-commit step]
       │
       └─ runs registered validators → sets/clears errors on context
       └─ emits EditValidationFailed if any fail

4. engine.commitEdit(tableId, row?)
       │
       ├─ validates if row provided
       ├─ returns null if validation fails or context.isValid() === false
       ├─ calls context.collectCommits(tableId) → frozen TableEditCommit[]
       ├─ calls context.clearEdits()
       └─ emits EditCommitted

5. engine.cancelEdit(tableId)
       └─ context.cancelEdit() → all state cleared
       └─ emits EditCancelled
```

---

## TableEditingContext Signals

| Signal | Type | Description |
|--------|------|-------------|
| `mode` | `TableEditMode` | Current edit mode |
| `editingCell` | `TableCellRef \| null` | Currently editing cell |
| `editingRowId` | `string \| null` | Currently editing row ID |
| `isEditing` | `boolean` | True when any edit is active |
| `isDirty` | `boolean` | True when pending edits exist |
| `isValid` | `boolean` | True when no validation errors |
| `pendingCount` | `number` | Number of pending edit values |
| `errorCount` | `number` | Number of validation errors |

---

## TableEditCommit Shape

```typescript
{
  tableId:       string;
  rowId:         string;
  columnId:      string;
  value:         unknown;   // new value
  previousValue: unknown;   // original value before edit
}
```

One commit per modified column. Row editing may produce multiple commits.

---

## Validation Hook

Validators are registered per table and per column:

```typescript
engine.registerValidator(tableId, columnId, (value, ctx) => {
  if (!value) return { valid: false, error: 'Required' };
  return { valid: true, error: null };
});
```

Validators run when:
- `engine.validate(tableId, row)` is called explicitly
- `engine.commitEdit(tableId, row)` is called with `row` argument

Validation errors are stored on `TableEditingContext` as signals and cleared column-by-column when validators pass.

---

## ReadOnly Detection

`TableEditingStrategy.canEdit(check)` returns false when:
- `check.readOnly === true`
- `check.editMode === 'none'`

Callers query `engine.canEdit(tableId, check)` before initiating an edit.

---

## Emitted Events

| Event | When |
|-------|------|
| `EditStarted` | `startCellEdit()` or `startRowEdit()` |
| `EditCommitted` | Successful `commitEdit()` |
| `EditCancelled` | `cancelEdit()` |
| `EditValidationFailed` | Validation produces at least one error |
