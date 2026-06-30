# Sprint 9.5 — Editor Registry & Resolver

## Overview

The `TableCellEditorRegistry` manages a bi-directional mapping:
1. `editorType` → `TableEditorDefinition` (the editor metadata)
2. `columnType` (string) → `TableEditorType` (which editor handles that column)

`TableEditorResolver` is a thin facade that combines both lookups and handles fallback.

---

## Built-in Editor Types

| Editor Type | Display Name | Supports Null |
|-------------|-------------|---------------|
| `text` | Text | ✅ |
| `number` | Number | ✅ |
| `boolean` | Boolean | ❌ |
| `date` | Date | ✅ |
| `datetime` | DateTime | ✅ |
| `time` | Time | ✅ |
| `select` | Select | ✅ |
| `multiselect` | MultiSelect | ✅ |
| `checkbox` | Checkbox | ❌ |
| `textarea` | Textarea | ✅ |
| `custom` | Custom | ✅ |

---

## Built-in Column Type Mappings

| Column Type | Editor Type |
|-------------|-------------|
| `text`, `string` | `text` |
| `number`, `integer`, `decimal` | `number` |
| `boolean` | `boolean` |
| `date` | `date` |
| `datetime` | `datetime` |
| `time` | `time` |
| `select`, `enum` | `select` |
| `textarea` | `textarea` |
| anything else | `text` (fallback) |

---

## Resolution Flow

```
engine.resolveEditor(columnType, overrideEditorType?)
  │
  └─ resolver.resolve(columnType, overrideEditorType?)
       │
       ├─ if overrideEditorType:  look up directly in registry
       ├─ else:                   registry.resolveEditorTypeForColumn(columnType)
       │
       └─ get definition from registry
            ├─ found  → { editorType, definition, fallback: false }
            └─ not found → fallback to 'text' editor
                          { editorType: 'text', definition: textDef, fallback: true }
```

---

## Extending the Registry

```typescript
// Register a custom editor
registry.registerEditor({
  type: 'custom',
  displayName: 'Color Picker',
  supportsNull: true,
  config: { palette: 'material' },
});

// Map a domain column type to an existing editor
registry.mapColumnType('color', 'custom');
```

---

## Overriding Built-ins

Built-in editors can be overridden by registering a new definition with the same type:

```typescript
registry.registerEditor({
  type: 'text',
  displayName: 'Rich Text',
  supportsNull: true,
  config: { toolbar: 'minimal' },
});
```

Built-ins can also be removed with `registry.removeEditor(type)`.

---

## Reactive Count

`registry.registeredCount` is a `Signal<number>` that increments whenever editors are added or removed. Useful for driving dynamic UI that lists available editors.
