import { Type } from '@angular/core';
import { ComponentFieldType } from '../components/component.types';

// ─── Form Layout ────────────────────────────────────────────────────────────

export type FormLayout = 'simple' | 'sections' | 'tabs' | 'accordion' | 'wizard';
export type FormMode   = 'create' | 'edit' | 'view' | 'readonly';

export type FormPhase =
  | 'uninitialized'
  | 'loading'
  | 'ready'
  | 'validating'
  | 'submitting'
  | 'submitted'
  | 'autosaving'
  | 'error';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export type WizardNavigationMode = 'free' | 'sequential' | 'validated';

export type ArrayLayout = 'table' | 'cards' | 'inline';

export type SectionLayout = 'grid' | 'flex' | 'stack';

// ─── Validator Spec (bridged from Validation Engine) ─────────────────────────

export interface ValidatorSpec {
  readonly type: string;
  readonly params?: Record<string, unknown>;
  readonly message?: string;
}

export interface FormValidationResult {
  readonly valid: boolean;
  readonly errors: Record<string, string[]>;
  readonly warnings: Record<string, string[]>;
  readonly fieldCount: number;
  readonly errorCount: number;
}

// ─── Field Definition ────────────────────────────────────────────────────────

export interface FieldDefinition {
  readonly key:                string;
  readonly type:               ComponentFieldType | string;
  readonly label:              string;
  readonly placeholder?:       string;
  readonly hint?:              string;
  readonly defaultValue?:      unknown;
  readonly required?:          boolean;
  readonly readonly?:          boolean;
  readonly disabled?:          boolean;
  readonly hidden?:            boolean;
  readonly hiddenExpression?:  string;
  readonly disabledExpression?: string;
  readonly requiredExpression?: string;
  readonly valueExpression?:   string;
  readonly validators?:        ValidatorSpec[];
  readonly permissions?:       string[];
  readonly ariaLabel?:         string;
  readonly prefixIcon?:        string;
  readonly suffixIcon?:        string;
  readonly span?:              number;
  readonly order?:             number;
  readonly config?:            Record<string, unknown>;
  readonly metadata?:          unknown;
}

// ─── Array Field Definition ──────────────────────────────────────────────────

export interface ArrayFieldDefinition extends Omit<FieldDefinition, 'type'> {
  readonly type:       'array';
  readonly itemSchema: SectionDefinition;
  readonly minItems?:  number;
  readonly maxItems?:  number;
  readonly addLabel?:  string;
  readonly removeLabel?: string;
  readonly arrayLayout?: ArrayLayout;
  readonly sortable?:  boolean;
}

// ─── Group Definition ────────────────────────────────────────────────────────

export interface GroupDefinition {
  readonly id:     string;
  readonly title?: string;
  readonly fields: FieldDefinition[];
  readonly columns?: number;
  readonly hiddenExpression?: string;
}

// ─── Section Definition ──────────────────────────────────────────────────────

export interface SectionDefinition {
  readonly id:          string;
  readonly title?:      string;
  readonly description?: string;
  readonly layout:      SectionLayout;
  readonly columns:     number;
  readonly collapsible?: boolean;
  readonly collapsed?:   boolean;
  readonly lazy?:        boolean;
  readonly hiddenExpression?:   string;
  readonly disabledExpression?: string;
  readonly fields?:     FieldDefinition[];
  readonly groups?:     GroupDefinition[];
  readonly arrays?:     ArrayFieldDefinition[];
  readonly subsections?: SectionDefinition[];
  readonly order?:       number;
}

// ─── Tab Definition ──────────────────────────────────────────────────────────

export interface TabDefinition {
  readonly id:             string;
  readonly title:          string;
  readonly icon?:          string;
  readonly sections:       SectionDefinition[];
  readonly hiddenExpression?: string;
  readonly badge?:         string;
  readonly order?:         number;
}

// ─── Wizard Step Definition ──────────────────────────────────────────────────

export interface WizardStepDefinition {
  readonly id:               string;
  readonly title:            string;
  readonly description?:     string;
  readonly icon?:            string;
  readonly sections:         SectionDefinition[];
  readonly canNavigateExpression?: string;
  readonly optional?:        boolean;
  readonly order?:           number;
}

// ─── Autosave Config ─────────────────────────────────────────────────────────

export interface AutosaveConfig {
  readonly intervalMs:  number;
  readonly debounceMs?: number;
  readonly onSave:      (model: Record<string, unknown>) => Promise<void>;
  readonly onError?:    (error: Error) => void;
  readonly enabled:     boolean;
}

// ─── Form Definition ─────────────────────────────────────────────────────────

export interface FormDefinition {
  readonly id:          string;
  readonly title?:      string;
  readonly description?: string;
  readonly version:     string;
  readonly mode:        FormMode;
  readonly layout:      FormLayout;
  readonly sections?:   SectionDefinition[];
  readonly tabs?:       TabDefinition[];
  readonly steps?:      WizardStepDefinition[];
  readonly autosave?:   AutosaveConfig;
  readonly permissions?: string[];
  readonly submitLabel?: string;
  readonly cancelLabel?: string;
  readonly showActions?: boolean;
  readonly showErrorSummary?: boolean;
  readonly scrollToFirstError?: boolean;
  readonly keyboardNavigation?: boolean;
  readonly draftMode?:  boolean;
  readonly metadata?:   unknown;
}

// ─── Per-Field Reactive State ────────────────────────────────────────────────

export interface FieldState {
  readonly value:     unknown;
  readonly errors:    string[];
  readonly warnings:  string[];
  readonly touched:   boolean;
  readonly dirty:     boolean;
  readonly loading:   boolean;
  readonly hidden:    boolean;
  readonly disabled:  boolean;
  readonly required:  boolean;
  readonly skeleton:  boolean;
  readonly readonly:  boolean;
}

export interface SectionState {
  readonly collapsed: boolean;
  readonly hidden:    boolean;
  readonly disabled:  boolean;
  readonly loaded:    boolean;
}

export interface WizardState {
  readonly currentStepIndex: number;
  readonly completedSteps:   ReadonlySet<string>;
  readonly stepErrors:       ReadonlyMap<string, string[]>;
  readonly isFinished:       boolean;
}

// ─── Form Snapshot ───────────────────────────────────────────────────────────

export interface FormSnapshot {
  readonly id:           string;
  readonly formId:       string;
  readonly capturedAt:   string;
  readonly model:        Record<string, unknown>;
  readonly fieldStates:  Record<string, FieldState>;
  readonly sectionStates: Record<string, SectionState>;
  readonly phase:        FormPhase;
  readonly label?:       string;
}

// ─── Form History Entry ──────────────────────────────────────────────────────

export interface FormHistoryEntry {
  readonly index:       number;
  readonly snapshot:    FormSnapshot;
  readonly action:      string;
  readonly timestamp:   string;
}

// ─── Resolved Form Model ─────────────────────────────────────────────────────

export interface ResolvedField extends FieldDefinition {
  readonly componentType: Type<unknown> | null;
}

export interface ResolvedGroup extends GroupDefinition {
  readonly fields: ResolvedField[];
}

export interface ResolvedSection extends Omit<SectionDefinition, 'fields' | 'groups' | 'subsections' | 'arrays'> {
  readonly fields:      ResolvedField[];
  readonly groups:      ResolvedGroup[];
  readonly arrays:      ArrayFieldDefinition[];
  readonly subsections: ResolvedSection[];
}

export interface ResolvedTab extends Omit<TabDefinition, 'sections'> {
  readonly sections: ResolvedSection[];
}

export interface ResolvedStep extends Omit<WizardStepDefinition, 'sections'> {
  readonly sections: ResolvedSection[];
}

export interface ResolvedFormModel {
  readonly definition:   FormDefinition;
  readonly sections:     ResolvedSection[];
  readonly tabs:         ResolvedTab[];
  readonly steps:        ResolvedStep[];
  readonly allFields:    ResolvedField[];
  readonly fieldIndex:   ReadonlyMap<string, ResolvedField>;
  readonly resolvedAt:   string;
}

// ─── Form Instance (public API contract) ────────────────────────────────────

// Forward reference: concrete types are in state/context files; declared here as `unknown`
// so the interface can be imported without circular dependencies.
// Components that need the concrete types should cast or inject them directly.
export type FormStateRef  = unknown;
export type FormContextRef = unknown;

export interface FormInstance {
  readonly id:           string;
  readonly definition:   FormDefinition;
  readonly resolvedForm: ResolvedFormModel;
  readonly state:        FormStateRef;
  readonly context:      FormContextRef;

  // Reactive state accessors
  getFieldState(key: string): FieldState;
  getModel(): Record<string, unknown>;
  getPhase(): FormPhase;
  isValid(): boolean;
  isDirty(): boolean;
  isTouched(): boolean;
  getWizardState(): WizardState;
  getAutosaveStatus(): AutosaveStatus;

  // Mutations
  setValue(key: string, value: unknown): void;
  patchModel(patch: Record<string, unknown>): void;
  setErrors(key: string, errors: string[]): void;
  clearErrors(key?: string): void;
  setFieldTouched(key: string, touched?: boolean): void;
  setFieldLoading(key: string, loading: boolean): void;
  setLookupResults(key: string, results: unknown[]): void;

  // Lifecycle
  initialize(initialModel?: Record<string, unknown>): Promise<void>;
  validate(): Promise<FormValidationResult>;
  submit(): Promise<void>;
  reset(model?: Record<string, unknown>): void;
  saveDraft(): void;
  restoreDraft(): void;

  // History (undo/redo)
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // Wizard
  nextStep(): Promise<boolean>;
  prevStep(): void;
  goToStep(index: number): Promise<boolean>;

  // Autosave
  enableAutosave(config: AutosaveConfig): void;
  disableAutosave(): void;

  // Focus / scroll
  focusField(key: string): void;
  scrollToField(key: string): void;
  scrollToFirstError(): void;

  destroy(): void;
}

// ─── Form Events ─────────────────────────────────────────────────────────────

export type FormEventType =
  | 'form:initialized'
  | 'form:reset'
  | 'form:submitted'
  | 'form:validated'
  | 'form:destroyed'
  | 'form:phase-changed'
  | 'form:autosave-start'
  | 'form:autosave-complete'
  | 'form:autosave-error'
  | 'form:draft-saved'
  | 'form:draft-restored'
  | 'field:value-changed'
  | 'field:touched'
  | 'field:blurred'
  | 'field:focused'
  | 'field:validated'
  | 'field:lookup-triggered'
  | 'section:collapsed'
  | 'section:expanded'
  | 'section:lazy-loaded'
  | 'wizard:step-changed'
  | 'wizard:step-validated'
  | 'wizard:finished'
  | 'array:item-added'
  | 'array:item-removed'
  | 'array:item-reordered'
  | 'history:undo'
  | 'history:redo'
  | 'history:pushed';

export interface FormEvent<T = unknown> {
  readonly type:      FormEventType;
  readonly formId:    string;
  readonly timestamp: string;
  readonly payload:   T;
}

export interface FieldValueChangedPayload {
  readonly key:      string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}

export interface WizardStepChangedPayload {
  readonly fromIndex: number;
  readonly toIndex:   number;
  readonly stepId:    string;
}

export interface ArrayItemPayload {
  readonly fieldKey:  string;
  readonly itemIndex: number;
  readonly item?:     Record<string, unknown>;
}

// ─── Form Diagnostics ────────────────────────────────────────────────────────

export type FormDiagEventType = 'init' | 'render' | 'validate' | 'submit' | 'error' | 'lifecycle' | 'expression' | 'autosave';

export interface FormDiagEvent {
  readonly id:        string;
  readonly type:      FormDiagEventType;
  readonly formId:    string;
  readonly fieldKey?: string;
  readonly message:   string;
  readonly durationMs?: number;
  readonly timestamp: string;
  readonly metadata?: Record<string, unknown>;
}

export interface FormDiagnosticsReport {
  readonly formId:       string;
  readonly generatedAt:  string;
  readonly totalEvents:  number;
  readonly errorCount:   number;
  readonly avgRenderMs:  number;
  readonly events:       FormDiagEvent[];
}

// ─── Form Metrics ─────────────────────────────────────────────────────────────

export interface FormRenderMetrics {
  readonly formId:          string;
  readonly initDurationMs:  number;
  readonly resolveDurationMs: number;
  readonly fieldCount:      number;
  readonly renderCount:     number;
  readonly validationCount: number;
  readonly submitCount:     number;
  readonly errorCount:      number;
  readonly firstRenderAt:   string;
  readonly lastActivityAt:  string;
}

// ─── Form Registry Entry ─────────────────────────────────────────────────────

export interface FormRegistryEntry {
  readonly id:           string;
  readonly definition:   FormDefinition;
  readonly registeredAt: string;
  readonly tags:         string[];
  readonly factory?:     () => Promise<FormDefinition>;
}

export interface FormRegistrationOptions {
  readonly overwrite?:  boolean;
  readonly tags?:       string[];
  readonly factory?:    () => Promise<FormDefinition>;
}

// ─── Form Context ────────────────────────────────────────────────────────────

export interface FormContextData {
  readonly formKey:       string;
  readonly formId:        string;
  readonly mode:          FormMode;
  readonly locale:        string;
  readonly permissions:   string[];
  readonly entityType?:   string;
  readonly entityId?:     string;
  readonly model:         Record<string, unknown>;
  readonly extra:         Record<string, unknown>;
}

// ─── Form Lifecycle ──────────────────────────────────────────────────────────

export type FormLifecyclePhase =
  | 'created'
  | 'initializing'
  | 'initialized'
  | 'validating'
  | 'valid'
  | 'invalid'
  | 'submitting'
  | 'submitted'
  | 'destroyed';

export interface FormLifecycleEvent {
  readonly formId:    string;
  readonly phase:     FormLifecyclePhase;
  readonly timestamp: string;
  readonly durationMs?: number;
}

// ─── Form Serialization ──────────────────────────────────────────────────────

export interface FormSerializationOptions {
  readonly includeHidden?:   boolean;
  readonly includeDisabled?: boolean;
  readonly dirtyOnly?:       boolean;
  readonly omitKeys?:        string[];
}

// ─── Injected Engine Interfaces ───────────────────────────────────────────────

export interface FormExpressionEvaluator {
  evaluate(expression: string, context: Record<string, unknown>): unknown;
  evaluateBoolean(expression: string, context: Record<string, unknown>): boolean;
}

export interface FormFieldValidator {
  validate(value: unknown, validators: ValidatorSpec[], context: Record<string, unknown>): Promise<string[]>;
}

export interface FormPermissionChecker {
  hasPermission(permission: string): boolean;
  hasAllPermissions(permissions: string[]): boolean;
}

export interface FormQueryProvider {
  search(query: string, config: Record<string, unknown>, context: Record<string, unknown>): Promise<unknown[]>;
}
