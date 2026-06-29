# Sprint 6 — Supported Features

## Form Layouts

| Layout | Description | Definition key |
|--------|-------------|----------------|
| `simple` | Single column sections | `definition.sections` |
| `sections` | Multiple named sections | `definition.sections` |
| `tabs` | Tabbed form with section groups | `definition.tabs` |
| `accordion` | Collapsible sections | `definition.sections` (collapsible: true) |
| `wizard` | Step-by-step guided form | `definition.steps` |

## Field Features

All 19 platform field types are supported (text, number, currency, date, time, checkbox, switch, textarea, select, lookup, autocomplete, file, image, avatar, chip, badge, color, json, markdown).

### Expressions

All field state attributes support expression strings evaluated by `FORM_EXPRESSION_EVALUATOR`:

```typescript
{
  hiddenExpression:   'model.type === "B"',
  disabledExpression: '!permissions.includes("admin")',
  requiredExpression: 'model.mode === "strict"',
  valueExpression:    'model.firstName + " " + model.lastName',
}
```

Expressions are re-evaluated after every `setValue()` call.

### Conditional Fields & Sections

Fields with `hiddenExpression` are hidden when the expression evaluates to `true`. Hidden fields are excluded from validation and serialization by default.

### Lazy Sections

Sections with `lazy: true` are marked as `loaded: false` initially. The layout component can detect this and defer rendering until the section becomes visible (e.g., when a tab is clicked).

### Async Lookups

Lookup fields (type `'lookup'`) receive search results via `FormInstance.setLookupResults(key, results)`. The form engine emits `'field:lookup-triggered'` when the field requests a search; the consuming code calls the query engine and passes results back.

## Form Features

### Autosave

```typescript
instance.enableAutosave({
  intervalMs: 30000,
  debounceMs: 2000,
  enabled: true,
  onSave: async (model) => await api.saveDraft(model),
  onError: (err) => console.error(err),
});
```

### Draft Mode

```typescript
instance.saveDraft();    // Saves to localStorage
instance.restoreDraft(); // Restores from localStorage
```

Draft key: `df_draft_{formId}`

### Undo / Redo

```typescript
if (instance.canUndo()) instance.undo();
if (instance.canRedo()) instance.redo();
```

History is debounced (300ms) to avoid one entry per keystroke. Max stack: 50 entries.

### Error Summary

When `definition.showErrorSummary: true` and the form is invalid after a submit attempt, `<df-error-summary>` renders all errors with clickable links that scroll to the field.

### Scroll to First Error

When `definition.scrollToFirstError: true`, after a failed validation, `instance.scrollToFirstError()` is called automatically.

### Keyboard Navigation

Fields are identified with `[data-field-key]` attributes. `instance.focusField(key)` uses native `querySelector` to focus the underlying input element within the field host.

### Arrays

`<df-array>` supports:
- Add item (up to `maxItems`)
- Remove item (down to `minItems`)
- Reorder items (when `sortable: true`)
- Per-item field states stored with composite keys: `fieldKey[index].itemKey`

### Wizard Navigation

```typescript
const moved = await instance.nextStep();   // validates current step first
instance.prevStep();
await instance.goToStep(2);
```

`nextStep()` runs `validate()` before advancing. Returns `false` if validation fails.

## Permission-Based Field Disabling

Fields with `permissions: ['can_edit']` are automatically disabled if `FORM_PERMISSION_CHECKER.hasAllPermissions(permissions)` returns `false`. Permissions are re-evaluated during `initialize()`.
