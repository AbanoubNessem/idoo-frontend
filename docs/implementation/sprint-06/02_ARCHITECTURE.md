# Sprint 6 — Dynamic Form Engine: Architecture

## Layered Design

```
┌─────────────────────────────────────────────────┐
│            Business Modules (future)             │
│         <dynamic-form [definition]="...">       │
└────────────────────┬────────────────────────────┘
                     │ uses
┌────────────────────▼────────────────────────────┐
│           DynamicFormComponent                   │
│  (orchestrates layout, routes events, no logic) │
└──────┬───────────┬────────────────┬─────────────┘
       │           │                │
   DfSection   DfTabs          DfWizard
   DfAccordion DfArray         DfErrorSummary
       │
┌──────▼──────────────────────────────────────────┐
│       FormFieldHostComponent                     │
│  (creates platform field components dynamically) │
│  (wires value signals back to form state)        │
└──────┬──────────────────────────────────────────┘
       │ resolves via
       ▼
 ComponentResolverService (Sprint 5)
 Platform Field Components (Sprint 5)

┌─────────────────────────────────────────────────┐
│          DynamicFormEngine (Facade)              │
├─────────────────────────────────────────────────┤
│  DynamicFormFactoryService  → creates instances │
│  DynamicFormRegistryService → stores defs       │
│  DynamicFormResolverService → resolves types    │
│  DynamicFormEventsService   → event bus         │
│  DynamicFormLifecycleService→ phase tracking    │
│  DynamicFormDiagnosticsService → event log      │
│  DynamicFormMetricsService  → perf metrics      │
│  DynamicFormSnapshotService → save/restore      │
│  DynamicFormSerializerService → serialize       │
└────────────────────────────────────────────────-┘

Per-Instance (created by Factory, not @Injectable):
  DynamicFormState   → reactive field/section states
  DynamicFormHistory → undo/redo stack (class)
  DynamicFormContext → ambient eval context (class)
```

## Integration Points

| Dependency         | Integration Point | How |
|--------------------|-------------------|-----|
| ComponentResolverService (Sprint 5) | `DynamicFormResolverService` | Resolves field types |
| ComponentRegistryService (Sprint 5) | `DynamicFormResolverService` | Fallback resolution |
| Expression Engine  | `FORM_EXPRESSION_EVALUATOR` token | Noop default |
| Validation Engine  | `FORM_FIELD_VALIDATOR` token | Noop default |
| Permission Engine  | `FORM_PERMISSION_CHECKER` token | Noop default |
| Query Engine       | `FORM_QUERY_PROVIDER` token | Noop default |

## Data Flow

```
FormDefinition
    → DynamicFormResolverService.resolve()
    → ResolvedFormModel (definition + componentType per field)
    → DynamicFormState.initField() × N fields
    → DynamicFormComponent renders layout
        → FormFieldHostComponent × N fields
            → ViewContainerRef.createComponent(componentType)
            → effect() watches value signal
            → emits FieldValueChangeEvent
        → DynamicFormComponent.onValueChange()
            → FormInstance.setValue(key, value)
                → DynamicFormState.setValue()
                → DynamicFormContext.patchModel()
                → DynamicFormEventsService.emit('field:value-changed')
                → DynamicFormHistory.push() (debounced)
                → evaluates expressions
```

## Form Instance Lifecycle

```
uninitialized
    ↓ createForm()
loading
    ↓ resolver.resolve() + state.initField()
ready ←────────────────── reset()
    ↓ validate()           ↑
validating                 │
    ↓                      │
ready (valid/invalid) ─────┘
    ↓ submit()
submitting
    ↓
submitted | error
```

## No-Render Contract

The `DynamicFormEngine` and `DynamicFormComponent` NEVER directly instantiate or import field components. All field rendering is delegated to:

1. `DynamicFormResolverService` → returns `Type<unknown>` (not the instance)
2. `FormFieldHostComponent` → calls `ViewContainerRef.createComponent(type)` only after receiving the `Type<unknown>`

This ensures the form engine has no coupling to any specific field component implementation.
