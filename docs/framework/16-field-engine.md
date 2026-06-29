# iDoo ERP Platform — Field Engine

---

## 1. Overview

The Field Engine is responsible for rendering individual form fields. It resolves a `FieldType` string to the correct Angular component and passes the `FormControl`, `FormFieldDef`, and view mode as inputs. It is the extensibility point for custom field types introduced by ERP plugins.

---

## 2. Field Resolution

The `FieldEngine` resolves fields through the `FieldRegistry`:

```
FormFieldDef.type  →  FieldRegistry.get(type)  →  FieldComponentDef  →  rendered component
```

If a type is not found in the registry, the platform falls back to `'text'`.

---

## 3. FieldRegistry

```typescript
interface FieldComponentDef {
  component: Type<FieldComponent> | (() => Promise<Type<FieldComponent>>);
  lazyLoad?: boolean;  // default: false for built-in types, true for custom
}

@Injectable({ providedIn: 'root' })
class FieldRegistry {
  register(type: string, def: FieldComponentDef): void;
  get(type: string): FieldComponentDef | null;
  has(type: string): boolean;
}
```

---

## 4. FieldComponent Interface

Every field component must implement:

```typescript
abstract class FieldComponent {
  @Input() control!: FormControl;
  @Input() fieldDef!: FormFieldDef;
  @Input() mode!: 'create' | 'edit' | 'view';
}
```

In `view` mode, the field renders as a read-only display value, not an editable input.

---

## 5. Built-in Field Components

The platform registers these types at bootstrap via `CoreFieldModule`:

| Type | Component | Notes |
|---|---|---|
| `text` | `TextFieldComponent` | Standard input |
| `email` | `EmailFieldComponent` | Input with email validation |
| `password` | `PasswordFieldComponent` | Input with show/hide toggle |
| `phone` | `PhoneFieldComponent` | Input with country code picker |
| `url` | `UrlFieldComponent` | Input with link preview |
| `textarea` | `TextareaFieldComponent` | Multi-line, auto-resize |
| `number` | `NumberFieldComponent` | Numeric with step/min/max |
| `currency` | `CurrencyFieldComponent` | Number with currency symbol |
| `percentage` | `PercentageFieldComponent` | Number with % suffix |
| `date` | `DateFieldComponent` | Date picker (calendar popup) |
| `time` | `TimeFieldComponent` | Time picker |
| `datetime` | `DatetimeFieldComponent` | Combined date + time picker |
| `date-range` | `DateRangeFieldComponent` | Start–end date picker |
| `checkbox` | `CheckboxFieldComponent` | Single checkbox |
| `toggle` | `ToggleFieldComponent` | Slide toggle |
| `select` | `SelectFieldComponent` | Dropdown (static options) |
| `multiselect` | `MultiselectFieldComponent` | Multi-select dropdown |
| `radio` | `RadioFieldComponent` | Radio button group |
| `autocomplete` | `AutocompleteFieldComponent` | Type-ahead with API loader |
| `chips` | `ChipsFieldComponent` | Free-text chip input |
| `file` | `FileFieldComponent` | File upload with drag-drop |
| `image` | `ImageFieldComponent` | Image upload with preview |
| `entity-picker` | `EntityPickerFieldComponent` | Picker dialog for related entity |
| `rich-text` | `RichTextFieldComponent` | WYSIWYG (Phase 2) |

---

## 6. EntityPickerField

The `entity-picker` type is the most important field for relations. It renders as:

```
┌─ Department ──────────────────────┐
│  Engineering           [Browse ▼] │
└───────────────────────────────────┘
```

Clicking "Browse" opens a `PickerDialog` for the entity specified in `FormFieldDef.entityRef`. The selected record's `labelField` value is shown in the input, and its `id` is stored in the `FormControl`.

For large datasets, the picker also supports typing in the input to search:

```typescript
{
  key: 'departmentId',
  type: 'entity-picker',
  label: 'Department',
  entityRef: 'hr:department',         // resolves via EntityRegistry
  required: true,
}
```

---

## 7. Custom Field Types (Plugin Extension)

Plugins register custom field types to handle domain-specific inputs:

```typescript
// In HR plugin initialization:
fieldRegistry.register('salary-grade', {
  component: () => import('./salary-grade-field.component')
                     .then(m => m.SalaryGradeFieldComponent),
  lazyLoad: true,
});
```

Then in any `FormFieldDef`:

```typescript
{ key: 'gradeId', type: 'salary-grade', label: 'Salary Grade' }
```

The Field Engine will lazy-load the custom component on first use.

---

## 8. View Mode Rendering

In `view` mode, the Field Engine renders a `FieldViewComponent` instead of the editable input. The view renderer formats the value appropriately:

| Type | View rendering |
|---|---|
| `text`, `email` | Plain text |
| `date` | `26 Jun 2025` |
| `datetime` | `26 Jun 2025 at 14:30` |
| `boolean` | `Yes` / `No` |
| `select` | Option label (not value key) |
| `currency` | `EGP 10,500.00` |
| `entity-picker` | Linked display name |
| `file` | Download link |
| `image` | Thumbnail image |
| `password` | `••••••••` |
| null / empty | `—` |

---

## 9. Field Label and Error Display

The `FieldWrapperComponent` wraps every field (both built-in and custom) and handles:
- Label rendering with required `*` indicator
- Hint text below the field
- Error messages from `FieldErrorComponent`

Plugins do NOT need to implement label or error rendering — the wrapper handles it automatically.

```
┌─ FieldWrapperComponent ──────────────────────┐
│  Label *                                      │
│  ┌─ [field component renders here] ─────────┐│
│  └──────────────────────────────────────────┘│
│  Hint text                                    │
│  ⚠ Validation error message                  │
└──────────────────────────────────────────────┘
```
