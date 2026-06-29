# Sprint 6 — Form Components

## Component Hierarchy

```
<dynamic-form>                    ← DynamicFormComponent
├── <df-error-summary>
├── Layout:
│   ├── <df-tabs-container>       ← tabs layout
│   │   └── <df-section> × N
│   ├── <df-wizard-container>     ← wizard layout
│   │   └── <df-section> × N
│   ├── <df-accordion-container>  ← accordion layout
│   │   └── <df-section> × N
│   └── <df-section> × N         ← simple/sections layout
│       └── <df-field-host> × M  ← field rendering
└── <df-array> × K               ← array fields
    └── <df-field-host> × M
```

## DynamicFormComponent (`<dynamic-form>`)

**Selector:** `dynamic-form`

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `definition` | `FormDefinition \| null` | `null` | Form definition object |
| `formKey` | `string \| null` | `null` | Registry key to look up definition |
| `initialModel` | `Record<string,unknown>` | `{}` | Initial field values |
| `contextData` | `Partial<FormContextData>` | `{}` | Locale, permissions, entity context |
| `showCancelButton` | `boolean` | `true` | Shows cancel button in actions bar |
| `showUndoRedo` | `boolean` | `false` | Shows undo/redo toolbar |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `formSubmit` | `{model, formId}` | Emitted after successful submit |
| `formValidated` | `FormValidationResult` | Emitted after each validation |
| `valueChanged` | `FieldValueChangeEvent` | Emitted on any field value change |
| `cancel` | `void` | Emitted when cancel button clicked |
| `draftSaved` | `void` | Emitted after draft saved |
| `formReady` | `string` | Emitted with formId when ready |

### Usage

```html
<dynamic-form
  [definition]="myFormDef"
  [initialModel]="{ name: 'Alice' }"
  (formSubmit)="onSubmit($event)"
  (valueChanged)="onFieldChange($event)"
  (cancel)="onCancel()"
/>
```

## FormFieldHostComponent (`<df-field-host>`)

The critical bridge between the form engine and platform field components. It:
1. Receives a `Type<unknown>` (resolved component type) and a `FieldState`
2. Creates the component dynamically using `ViewContainerRef.createComponent()`
3. Applies all field state as inputs via `ComponentRef.setInput()`
4. Monitors the field's `value` signal using `effect()` with an explicit `Injector`
5. Emits `valueChange` when the signal changes, with de-duplicate guard to prevent loops

### Value Loop Prevention

A `_lastEmittedValue` symbol is used as a sentinel. When the form state updates the field's input to a new value, `_applyInputs()` skips the `setInput('value', ...)` call if the value matches what was last seen from the component, preventing a circular update.

## Layout Sub-Components

| Component | Selector | Inputs |
|-----------|----------|--------|
| `FormSectionComponent` | `df-section` | `section`, `formState` |
| `FormTabsContainerComponent` | `df-tabs-container` | `tabs`, `formState` |
| `FormWizardContainerComponent` | `df-wizard-container` | `steps`, `formState`, `currentIndex` |
| `FormAccordionContainerComponent` | `df-accordion-container` | `sections`, `formState` |
| `FormErrorSummaryComponent` | `df-error-summary` | `errors`, `fieldLabels` |
| `FormArrayComponent` | `df-array` | `def`, `formState` |

All sub-components pass `(valueChange)`, `(fieldBlur)`, `(fieldFocus)` outputs up to the parent.

## No Material Dependency

None of the Dynamic Form Engine components import Angular Material directly. Layout uses pure CSS grid/flex. Angular Material may be used inside platform field components (Sprint 5), but the form engine layer remains UI-framework independent.
