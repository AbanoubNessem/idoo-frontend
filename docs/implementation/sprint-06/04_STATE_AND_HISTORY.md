# Sprint 6 — Form State & History

## DynamicFormState

A plain class (not `@Injectable`) that holds the reactive state of a single form instance. One instance exists per active form.

### Signals

| Signal | Type | Description |
|--------|------|-------------|
| `fieldStates` | `Signal<Record<string, FieldState>>` | All field states keyed by field key |
| `sectionStates` | `Signal<Record<string, SectionState>>` | Section collapsed/hidden/loaded |
| `phase` | `Signal<FormPhase>` | Current form phase |
| `autosaveStatus` | `Signal<AutosaveStatus>` | Autosave state |
| `submitCount` | `Signal<number>` | Number of submit attempts |

### Computed Signals

| Computed | Type | Description |
|----------|------|-------------|
| `model` | `Signal<Record<string, unknown>>` | Current model (all field values) |
| `isValid` | `Signal<boolean>` | True when no fields have errors |
| `isDirty` | `Signal<boolean>` | True when any field is dirty |
| `isTouched` | `Signal<boolean>` | True when any field is touched |
| `isSubmitting` | `Signal<boolean>` | True when phase = 'submitting' |
| `allErrors` | `Signal<Record<string, string[]>>` | Only fields with errors |

### Key Methods

```typescript
// Field mutations
initField(key: string, overrides?: Partial<FieldState>): void
setValue(key: string, value: unknown): void        // marks dirty automatically
setErrors(key: string, errors: string[]): void
clearErrors(key?: string): void
setTouched(key: string, touched?: boolean): void
setHidden(key: string, hidden: boolean): void
setDisabled(key: string, disabled: boolean): void
setRequired(key: string, required: boolean): void
setLoading(key: string, loading: boolean): void
setSkeleton(key: string, skeleton: boolean): void
setAllSkeleton(skeleton: boolean): void

// Snapshot (for history integration)
snapshot(): Record<string, FieldState>
restoreSnapshot(fieldStates: Record<string, FieldState>): void

// Bulk
patchModel(patch: Record<string, unknown>): void
reset(keys: string[], initialModel?: Record<string, unknown>): void
buildValidationResult(): FormValidationResult
```

### Dirty Tracking

`setValue(key, value)` sets `dirty: true` only when the new value differs from the current value. Re-setting the same value does not mark the field as dirty.

## DynamicFormHistory

A plain class (one per form instance) that implements the undo/redo stack.

### API

```typescript
class DynamicFormHistory {
  canUndo: Signal<boolean>
  canRedo: Signal<boolean>
  size:    Signal<number>
  entries: ReadonlySignal<FormHistoryEntry[]>

  push(snapshot: FormSnapshot, action?: string): void
  undo(): FormSnapshot | null
  redo(): FormSnapshot | null
  peek(): FormSnapshot | null
  clear(): void
}
```

### Behaviour

- Default max stack size: **50 entries** (configurable via constructor)
- When a new snapshot is pushed after an undo, all redo entries are discarded
- When the stack exceeds `maxSize`, oldest entries are trimmed
- History entries are re-indexed after any trim operation
- Pushing and undoing/redoing are O(n) worst-case (array operations)

### History Debounce

The `DynamicFormFactoryService` (via `DynamicFormInstance`) debounces history pushes by 300ms to avoid creating one entry per keystroke. Each `setValue()` or `patchModel()` schedules a push; if another change arrives within 300ms, the timer is reset.

## buildSnapshot utility

```typescript
function buildSnapshot(
  formId:       string,
  model:        Record<string, unknown>,
  fieldStates:  Record<string, FieldState>,
  label?:       string,
): FormSnapshot
```

Creates a new `FormSnapshot` with a unique monotonic ID, the current timestamp, and a deep clone of `fieldStates`.
