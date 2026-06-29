# iDoo ERP Platform — Form Engine

---

## 1. Overview

The Form Engine renders a complete, validated, reactive form from a `FormSchema` metadata object. It handles all Angular `ReactiveFormsModule` wiring, field layout, conditional visibility, validation, API submission, and error display — without any per-entity code.

---

## 2. Responsibilities

| Responsibility | Handled by |
|---|---|
| Build `FormGroup` from `FormSchema.fields` | `FormBuilderService` |
| Render field layout (grid, sections) | `FormEngineComponent` |
| Render individual fields | `FieldEngine` (via `FieldRegistry`) |
| Apply validators | `ValidationEngine` |
| Display error messages | `FieldErrorComponent` |
| Handle conditional visibility | `FormEngineComponent` |
| Call API on submit | `ActionEngine` |
| Show loading state | `FormEngineComponent` signals |
| Handle server validation errors | `FormErrorMapperService` |

---

## 3. FormEngineComponent Inputs

```typescript
// Component inputs
@Input() schema: FormSchema;          // from FormRegistry
@Input() mode: 'create' | 'edit' | 'view';
@Input() entityId: string;            // for API path resolution
@Input() recordId?: string;           // for edit/view modes
@Input() initialValue?: Record<string, unknown>;  // pre-populate fields
@Output() saved = new EventEmitter<Record<string, unknown>>();
@Output() cancelled = new EventEmitter<void>();
```

---

## 4. Form Rendering Pipeline

```
FormSchema (from FormRegistry)
        │
        ▼
FormBuilderService.build(schema, mode)
        │
        ├── Creates FormGroup
        ├── Creates FormControl per field
        ├── Applies validators (sync + async)
        ├── Sets initial values / defaults
        └── Marks read-only controls as disabled
        │
        ▼
FormEngineComponent
        │
        ├── Renders FormSection components
        │       └── Each section renders its FormFieldDef[]
        │               └── FieldEngine resolves the field type
        │                       └── Renders the appropriate field component
        │
        ├── Evaluates showWhen predicates (reactive)
        │
        └── ActionEngine renders form toolbar (save/cancel/workflow buttons)
```

---

## 5. Section Layout

Sections are rendered in order. Each section can have an independent column count:

```
┌─ Section: Basic Information ────────────────────────────────┐
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│ │  First Name  │  │  Last Name   │  │    Email     │      │
│ └──────────────┘  └──────────────┘  └──────────────┘      │
│ ┌─────────────────────────────────────────────────┐        │
│ │  Department (full width span=3)                  │        │
│ └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘

┌─ Section: Employment Details ──────────────────────────────┐
│ ┌──────────────┐  ┌──────────────┐                        │
│ │  Start Date  │  │  Job Title   │                        │
│ └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Conditional Fields

Fields with `hidden` predicates are evaluated reactively against the current form value:

```typescript
{
  key: 'contractEndDate',
  label: 'Contract End Date',
  type: 'date',
  hidden: (model) => model['contractType'] !== 'FIXED_TERM'
}
```

The `FormEngineComponent` creates a `computed(() => field.hidden(form.value))` signal for each conditional field and shows/hides it without destroying the `FormControl` (value is preserved but control is excluded from validation when hidden).

---

## 7. API Submission

On form submit, the `FormEngine` does NOT directly call the API. It:

1. Runs all validators synchronously
2. Triggers all async validators and waits
3. If form is valid, executes the `submitAction` defined in `FormSchema`
4. The `ActionEngine` resolves the action and calls the appropriate API endpoint
5. On success: emits `saved` event, shows success toast, optionally navigates
6. On server validation error (400): maps `fieldErrors` from response to form controls via `FormErrorMapperService`

---

## 8. Server Validation Error Mapping

```
HTTP 400 response body:
{
  "error": {
    "code": "VALIDATION_ERROR",
    "fieldErrors": {
      "email": "Must be a valid email address.",
      "username": "Username already taken."
    }
  }
}
        │
        ▼
FormErrorMapperService.applyErrors(form, fieldErrors)
        │
        ├── form.get('email').setErrors({ server: 'Must be a valid email address.' })
        └── form.get('username').setErrors({ server: 'Username already taken.' })
        │
        ▼
FieldErrorComponent reads control.errors.server and displays inline
```

---

## 9. View Mode

In `view` mode the form renders all fields as read-only display values, not editable inputs. Fields use a `FormFieldViewComponent` renderer instead of their edit renderer.

The view renderer:
- Formats dates, currencies, booleans appropriately
- Renders badges for status fields
- Shows "—" for null/empty values
- Links to related entities (clickable tenant name, etc.)

---

## 10. Form Lifecycle Hooks

Plugins can attach hooks to form lifecycle events via `FormSchema.hooks`:

```typescript
interface FormHooks {
  afterBuild?: (form: FormGroup) => void;
  beforeSubmit?: (value: Record<string, unknown>) => Record<string, unknown>;
  afterSave?: (savedRecord: Record<string, unknown>) => void;
  afterError?: (error: ApiError) => void;
}
```

These hooks are called by the `FormEngine` at the appropriate lifecycle point, allowing plugins to perform cross-field transformations or side effects without modifying the engine.

---

## 11. Form State Signals

`FormEngineComponent` exposes these signals for the template:

```typescript
readonly isLoading = signal(false);
readonly isSaving  = signal(false);
readonly hasError  = signal(false);
readonly isValid   = computed(() => this.form()?.valid ?? false);
readonly isDirty   = computed(() => this.form()?.dirty ?? false);
```

These drive the loading skeleton, save button disabled state, and unsaved-changes guard.

---

## 12. Unsaved Changes Guard

If `form.isDirty()` is true and the user navigates away, the `UnsavedChangesGuard` shows a confirmation dialog:

> "You have unsaved changes. Are you sure you want to leave?"

This guard is automatically applied to all routes that load `FormEngineComponent` in `edit` or `create` mode. No per-entity registration is needed.

---

## 13. Form Schema Examples

### Minimal

```typescript
const MinimalFormSchema: FormSchema = {
  sections: [{
    id: 'main',
    fields: [
      { key: 'name', type: 'text', label: 'Name', required: true },
      { key: 'email', type: 'email', label: 'Email', required: true },
    ]
  }]
};
```

### Full Two-Section with Conditional

```typescript
const EmployeeCreateFormSchema: FormSchema = {
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      columns: 3,
      fields: [
        { key: 'firstName', type: 'text', label: 'First Name', required: true, span: 1 },
        { key: 'lastName',  type: 'text', label: 'Last Name',  required: true, span: 1 },
        { key: 'email',     type: 'email', label: 'Email',     required: true, span: 1 },
      ]
    },
    {
      id: 'employment',
      title: 'Employment',
      columns: 2,
      fields: [
        { key: 'contractType', type: 'select', label: 'Contract Type',
          options: [
            { value: 'PERMANENT',   label: 'Permanent' },
            { value: 'FIXED_TERM',  label: 'Fixed Term' },
          ],
          required: true
        },
        { key: 'contractEndDate', type: 'date', label: 'Contract End Date',
          hidden: (m) => m['contractType'] !== 'FIXED_TERM'
        },
      ]
    }
  ],
  submitLabel: 'Create Employee',
};
```
