# Sprint 6 — Form Types Reference

## FormDefinition

The top-level object that describes a form's structure, layout, and behaviour.

```typescript
interface FormDefinition {
  id:          string;         // Unique form identifier
  version:     string;         // Semantic version
  mode:        FormMode;       // 'create' | 'edit' | 'view' | 'readonly'
  layout:      FormLayout;     // 'simple' | 'sections' | 'tabs' | 'accordion' | 'wizard'
  title?:      string;
  description?: string;
  sections?:   SectionDefinition[];   // For simple/sections/accordion
  tabs?:       TabDefinition[];       // For tabs layout
  steps?:      WizardStepDefinition[]; // For wizard layout
  autosave?:   AutosaveConfig;
  permissions?: string[];
  submitLabel?: string;
  cancelLabel?: string;
  showActions?: boolean;
  showErrorSummary?: boolean;
  scrollToFirstError?: boolean;
  draftMode?:  boolean;
}
```

## FieldDefinition

Defines a single form field. Includes all expressions and permissions.

```typescript
interface FieldDefinition {
  key:                string;              // Unique key within the form
  type:               ComponentFieldType;  // 'text' | 'number' | ... (19 types)
  label:              string;
  placeholder?:       string;
  hint?:              string;
  defaultValue?:      unknown;
  required?:          boolean;
  readonly?:          boolean;
  disabled?:          boolean;
  hidden?:            boolean;
  hiddenExpression?:  string;   // evaluated by FORM_EXPRESSION_EVALUATOR
  disabledExpression?: string;
  requiredExpression?: string;
  valueExpression?:   string;   // computed value override
  validators?:        ValidatorSpec[];
  permissions?:       string[];
  span?:              number;   // grid column span (1–12)
  config?:            Record<string, unknown>;
}
```

## FieldState (reactive, per field)

```typescript
interface FieldState {
  value:    unknown;
  errors:   string[];
  warnings: string[];
  touched:  boolean;
  dirty:    boolean;
  loading:  boolean;
  hidden:   boolean;
  disabled: boolean;
  required: boolean;
  skeleton: boolean;
  readonly: boolean;
}
```

## ResolvedFormModel

Output of `DynamicFormResolverService.resolve()` — the definition augmented with resolved `Type<unknown>` references for each field.

```typescript
interface ResolvedFormModel {
  definition:  FormDefinition;
  sections:    ResolvedSection[];
  tabs:        ResolvedTab[];
  steps:       ResolvedStep[];
  allFields:   ResolvedField[];         // flat list of all fields
  fieldIndex:  ReadonlyMap<string, ResolvedField>;
  resolvedAt:  string;
}

interface ResolvedField extends FieldDefinition {
  componentType: Type<unknown> | null;  // null if not found in registry
}
```

## FormInstance

The public API for a running form. Created by `DynamicFormFactoryService`.

```typescript
interface FormInstance {
  id:           string;
  definition:   FormDefinition;
  resolvedForm: ResolvedFormModel;
  state:        FormStateRef;   // concrete: DynamicFormState
  context:      FormContextRef; // concrete: DynamicFormContext

  // Reads
  getFieldState(key: string): FieldState;
  getModel(): Record<string, unknown>;
  getPhase(): FormPhase;
  isValid(): boolean;
  isDirty(): boolean;

  // Mutations
  setValue(key: string, value: unknown): void;
  patchModel(patch: Record<string, unknown>): void;
  setErrors(key: string, errors: string[]): void;

  // Actions
  initialize(initialModel?: Record<string, unknown>): Promise<void>;
  validate(): Promise<FormValidationResult>;
  submit(): Promise<void>;
  reset(model?: Record<string, unknown>): void;
  saveDraft(): void;
  restoreDraft(): void;

  // History
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // Wizard
  nextStep(): Promise<boolean>;
  prevStep(): void;
  goToStep(index: number): Promise<boolean>;

  // Focus
  focusField(key: string): void;
  scrollToField(key: string): void;
  scrollToFirstError(): void;

  destroy(): void;
}
```
