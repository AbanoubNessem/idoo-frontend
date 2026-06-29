import { inject, Injectable, Injector } from '@angular/core';
import {
  AutosaveConfig,
  AutosaveStatus,
  FieldState,
  FormContextData,
  FormDefinition,
  FormInstance,
  FormValidationResult,
  ResolvedFormModel,
  ValidatorSpec,
  WizardState,
} from '../form.types';
import { DynamicFormState } from '../state/dynamic-form-state';
import { DynamicFormHistory, buildSnapshot } from '../state/dynamic-form-history';
import { DynamicFormContext } from '../context/dynamic-form-context';
import { DynamicFormEventsService } from '../events/dynamic-form-events.service';
import { DynamicFormDiagnosticsService } from '../diagnostics/dynamic-form-diagnostics.service';
import { DynamicFormMetricsService } from '../metrics/dynamic-form-metrics.service';
import { DynamicFormLifecycleService } from '../lifecycle/dynamic-form-lifecycle.service';
import { DynamicFormSnapshotService } from '../snapshot/dynamic-form-snapshot.service';
import { DynamicFormResolverService } from '../resolver/dynamic-form-resolver.service';
import { FORM_EXPRESSION_EVALUATOR, FORM_FIELD_VALIDATOR, FORM_PERMISSION_CHECKER } from '../form.tokens';

let _instanceCounter = 0;

// ─── DynamicFormInstance ──────────────────────────────────────────────────────

class DynamicFormInstance implements FormInstance {
  readonly id:           string;
  readonly definition:   FormDefinition;
  readonly resolvedForm: ResolvedFormModel;

  private readonly _state:       DynamicFormState;
  private readonly _history:     DynamicFormHistory;
  private readonly _context:     DynamicFormContext;
  private readonly _events:      DynamicFormEventsService;
  private readonly _diag:        DynamicFormDiagnosticsService;
  private readonly _metrics:     DynamicFormMetricsService;
  private readonly _lifecycle:   DynamicFormLifecycleService;
  private readonly _snapshots:   DynamicFormSnapshotService;
  private readonly _injector:    Injector;

  private _autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private _autosaveConfig: AutosaveConfig | null = null;
  private _destroyed = false;

  constructor(
    id: string,
    definition: FormDefinition,
    resolvedForm: ResolvedFormModel,
    context: DynamicFormContext,
    injector: Injector,
    events: DynamicFormEventsService,
    diag: DynamicFormDiagnosticsService,
    metrics: DynamicFormMetricsService,
    lifecycle: DynamicFormLifecycleService,
    snapshots: DynamicFormSnapshotService,
  ) {
    this.id           = id;
    this.definition   = definition;
    this.resolvedForm = resolvedForm;
    this._context     = context;
    this._injector    = injector;
    this._events      = events;
    this._diag        = diag;
    this._metrics     = metrics;
    this._lifecycle   = lifecycle;
    this._snapshots   = snapshots;
    this._state       = new DynamicFormState();
    this._history     = new DynamicFormHistory();
  }

  // ─── State Accessors ────────────────────────────────────────────────────────

  getFieldState(key: string): FieldState { return this._state.getField(key); }
  getModel():   Record<string, unknown>   { return this._state.model(); }
  getPhase():   import('../form.types').FormPhase { return this._state.phase(); }
  isValid():    boolean { return this._state.isValid(); }
  isDirty():    boolean { return this._state.isDirty(); }
  isTouched():  boolean { return this._state.isTouched(); }
  getWizardState(): WizardState { return this._state.wizardState(); }
  getAutosaveStatus(): AutosaveStatus { return this._state.autosaveStatus(); }

  // ─── Reactive State Signals (for template binding) ───────────────────────

  get state(): DynamicFormState { return this._state; }
  get context(): DynamicFormContext { return this._context; }
  get history(): DynamicFormHistory { return this._history; }

  // ─── Initialization ──────────────────────────────────────────────────────

  async initialize(initialModel: Record<string, unknown> = {}): Promise<void> {
    const t0 = performance.now();
    this._state.setPhase('loading');
    this._lifecycle.onInitializing(this.id);
    this._diag.recordLifecycle(this.id, 'initializing');

    // Initialize field states from resolved form
    for (const field of this.resolvedForm.allFields) {
      const permChecker = this._injector.get(FORM_PERMISSION_CHECKER);
      const permDisabled = (field.permissions ?? []).length > 0
        && !permChecker.hasAllPermissions(field.permissions ?? []);

      this._state.initField(field.key, {
        value:    initialModel[field.key] ?? field.defaultValue ?? null,
        required: field.required ?? false,
        disabled: (field.disabled ?? false) || permDisabled,
        readonly: field.readonly ?? false,
        hidden:   field.hidden ?? false,
      });
    }

    // Initialize section states
    const allSections = [
      ...this.resolvedForm.sections,
      ...this.resolvedForm.tabs.flatMap(t => t.sections),
      ...this.resolvedForm.steps.flatMap(s => s.sections),
    ];
    for (const section of allSections) {
      this._state.initSection(section.id, {
        collapsed: section.collapsed ?? false,
        loaded:    !section.lazy,
      });
    }

    // Evaluate initial expressions
    await this._evaluateAllExpressions();

    // Push initial history snapshot
    this._pushHistory('initialize');

    this._state.setPhase('ready');
    this._lifecycle.onInitialized(this.id, Math.round(performance.now() - t0));
    this._diag.recordInit(this.id, Math.round(performance.now() - t0));
    this._events.emit('form:initialized', this.id, { model: this.getModel() });
  }

  // ─── Mutations ────────────────────────────────────────────────────────────

  setValue(key: string, value: unknown): void {
    const oldValue = this._state.getField(key).value;
    this._state.setValue(key, value);
    this._context.patchModel({ [key]: value });
    this._events.emit('field:value-changed', this.id, { key, oldValue, newValue: value });
    this._schedulePushHistory('field-change');
    this._scheduleAutosave();

    // Re-evaluate expressions that may depend on this field
    void this._evaluateAllExpressions();
  }

  patchModel(patch: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(patch)) {
      this._state.setValue(key, value);
    }
    this._context.patchModel(patch);
    this._schedulePushHistory('patch');
    this._scheduleAutosave();
    void this._evaluateAllExpressions();
  }

  setErrors(key: string, errors: string[]): void {
    this._state.setErrors(key, errors);
    this._events.emit('field:validated', this.id, { key, errors });
  }

  clearErrors(key?: string): void {
    this._state.clearErrors(key);
  }

  setFieldTouched(key: string, touched = true): void {
    this._state.setTouched(key, touched);
    this._events.emit('field:touched', this.id, { key });
  }

  setFieldLoading(key: string, loading: boolean): void {
    this._state.setLoading(key, loading);
  }

  setLookupResults(_key: string, _results: unknown[]): void {
    // Results are passed directly to the field component via form state;
    // the QueryEngine is responsible for supplying them externally.
    this._events.emit('field:lookup-triggered', this.id, { key: _key });
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  async validate(): Promise<FormValidationResult> {
    const t0 = performance.now();
    this._state.setPhase('validating');
    this._lifecycle.onValidating(this.id);
    this._metrics.recordValidation(this.id);

    const validator = this._injector.get(FORM_FIELD_VALIDATOR);
    const context   = this._context.buildEvalContext();

    for (const field of this.resolvedForm.allFields) {
      const fieldState = this._state.getField(field.key);
      if (fieldState.hidden || fieldState.disabled) continue;

      const validators: ValidatorSpec[] = field.validators ?? [];
      if (fieldState.required) {
        validators.unshift({ type: 'required' });
      }

      const errors = await validator.validate(fieldState.value, validators, context);
      this._state.setErrors(field.key, errors);
    }

    const result = this._state.buildValidationResult();
    const duration = Math.round(performance.now() - t0);

    this._diag.recordValidation(this.id, `${result.errorCount} errors found`, duration);
    this._events.emit('form:validated', this.id, result);

    if (result.valid) {
      this._lifecycle.onValid(this.id);
      this._state.setPhase('ready');
    } else {
      this._lifecycle.onInvalid(this.id);
      this._state.setPhase('ready');
    }

    return result;
  }

  async submit(): Promise<void> {
    const t0 = performance.now();
    const validation = await this.validate();
    if (!validation.valid) {
      if (this.definition.scrollToFirstError) {
        this.scrollToFirstError();
      }
      return;
    }

    this._state.setPhase('submitting');
    this._lifecycle.onSubmitting(this.id);
    this._state.incrementSubmitCount();
    this._metrics.recordSubmit(this.id);

    try {
      const duration = Math.round(performance.now() - t0);
      this._state.setPhase('submitted');
      this._lifecycle.onSubmitted(this.id, duration);
      this._diag.recordSubmit(this.id, duration);
      this._events.emit('form:submitted', this.id, { model: this.getModel() });
    } catch (err) {
      this._state.setPhase('error');
      this._state.setErrorMessage(String(err));
      this._diag.recordError(this.id, String(err));
      this._metrics.recordError(this.id);
    }
  }

  reset(model: Record<string, unknown> = {}): void {
    const keys = this.resolvedForm.allFields.map(f => f.key);
    this._state.reset(keys, model);
    this._history.clear();
    this._pushHistory('reset');
    this._context.setModel(model);
    this._events.emit('form:reset', this.id, {});
  }

  saveDraft(): void {
    const snapshot = this._snapshots.capture(this.id, this._state, 'draft');
    this._snapshots.saveDraft(this.id, snapshot);
    this._events.emit('form:draft-saved', this.id, {});
  }

  restoreDraft(): void {
    const draft = this._snapshots.loadDraft(this.id);
    if (!draft) return;
    this._snapshots.restore(draft, this._state);
    this._context.setModel(draft.model);
    this._events.emit('form:draft-restored', this.id, {});
  }

  // ─── History ─────────────────────────────────────────────────────────────

  undo(): void {
    const snapshot = this._history.undo();
    if (!snapshot) return;
    this._snapshots.restore(snapshot, this._state);
    this._context.setModel(snapshot.model);
    this._events.emit('history:undo', this.id, {});
  }

  redo(): void {
    const snapshot = this._history.redo();
    if (!snapshot) return;
    this._snapshots.restore(snapshot, this._state);
    this._context.setModel(snapshot.model);
    this._events.emit('history:redo', this.id, {});
  }

  canUndo(): boolean { return this._history.canUndo(); }
  canRedo(): boolean { return this._history.canRedo(); }

  // ─── Wizard Navigation ────────────────────────────────────────────────────

  async nextStep(): Promise<boolean> {
    const current = this._state.wizardState().currentStepIndex;
    const steps   = this.resolvedForm.steps;
    if (current >= steps.length - 1) return false;

    const validation = await this.validate();
    if (!validation.valid) return false;

    const step = steps[current];
    this._state.markStepCompleted(step.id);
    this._state.setWizardStep(current + 1);
    this._events.emit('wizard:step-changed', this.id, {
      fromIndex: current, toIndex: current + 1, stepId: steps[current + 1].id,
    });
    return true;
  }

  prevStep(): void {
    const current = this._state.wizardState().currentStepIndex;
    if (current <= 0) return;
    this._state.setWizardStep(current - 1);
    this._events.emit('wizard:step-changed', this.id, {
      fromIndex: current, toIndex: current - 1,
      stepId: this.resolvedForm.steps[current - 1].id,
    });
  }

  async goToStep(index: number): Promise<boolean> {
    const steps = this.resolvedForm.steps;
    if (index < 0 || index >= steps.length) return false;
    this._state.setWizardStep(index);
    this._events.emit('wizard:step-changed', this.id, {
      fromIndex: this._state.wizardState().currentStepIndex,
      toIndex: index,
      stepId: steps[index].id,
    });
    return true;
  }

  // ─── Autosave ────────────────────────────────────────────────────────────

  enableAutosave(config: AutosaveConfig): void {
    this._autosaveConfig = config;
    if (config.enabled) this._scheduleAutosave();
  }

  disableAutosave(): void {
    this._autosaveConfig = null;
    if (this._autosaveTimer) clearTimeout(this._autosaveTimer);
    this._autosaveTimer = null;
  }

  // ─── Focus / Scroll ───────────────────────────────────────────────────────

  focusField(key: string): void {
    const el = document.querySelector<HTMLElement>(`[data-field-key="${key}"] input, [data-field-key="${key}"] textarea`);
    el?.focus();
  }

  scrollToField(key: string): void {
    const el = document.querySelector(`[data-field-key="${key}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  scrollToFirstError(): void {
    const errors = this._state.allErrors();
    const firstKey = Object.keys(errors)[0];
    if (firstKey) this.scrollToField(firstKey);
  }

  // ─── Destroy ─────────────────────────────────────────────────────────────

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.disableAutosave();
    this._lifecycle.onDestroyed(this.id);
    this._events.emit('form:destroyed', this.id, {});
    this._events.clear(this.id);
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private async _evaluateAllExpressions(): Promise<void> {
    const evaluator = this._injector.get(FORM_EXPRESSION_EVALUATOR);
    const context   = this._context.buildEvalContext();

    for (const field of this.resolvedForm.allFields) {
      if (field.hiddenExpression) {
        const hidden = evaluator.evaluateBoolean(field.hiddenExpression, context);
        this._state.setHidden(field.key, hidden);
        this._diag.recordExpression(this.id, field.key, field.hiddenExpression);
      }
      if (field.disabledExpression) {
        const disabled = evaluator.evaluateBoolean(field.disabledExpression, context);
        this._state.setDisabled(field.key, disabled);
      }
      if (field.requiredExpression) {
        const required = evaluator.evaluateBoolean(field.requiredExpression, context);
        this._state.setRequired(field.key, required);
      }
      if (field.valueExpression) {
        const value = evaluator.evaluate(field.valueExpression, context);
        if (value !== undefined) this._state.setValue(field.key, value);
      }
    }
  }

  private _historyDebounce: ReturnType<typeof setTimeout> | null = null;
  private _schedulePushHistory(action: string): void {
    if (this._historyDebounce) clearTimeout(this._historyDebounce);
    this._historyDebounce = setTimeout(() => {
      this._pushHistory(action);
    }, 300);
  }

  private _pushHistory(action: string): void {
    const snapshot = buildSnapshot(
      this.id,
      this.getModel(),
      this._state.snapshot(),
    );
    this._history.push(snapshot, action);
    this._events.emit('history:pushed', this.id, { action });
  }

  private _scheduleAutosave(): void {
    if (!this._autosaveConfig?.enabled) return;
    if (this._autosaveTimer) clearTimeout(this._autosaveTimer);
    const debounce = this._autosaveConfig.debounceMs ?? 2000;
    this._autosaveTimer = setTimeout(() => void this._runAutosave(), debounce);
  }

  private async _runAutosave(): Promise<void> {
    if (!this._autosaveConfig || !this._isDirtyForAutosave()) return;
    this._state.setPhase('autosaving');
    this._state.setAutosaveStatus('saving');
    this._diag.recordAutosave(this.id, 'start');
    this._events.emit('form:autosave-start', this.id, {});

    try {
      await this._autosaveConfig.onSave(this.getModel());
      this._state.setAutosaveStatus('saved');
      this._state.setPhase('ready');
      this._diag.recordAutosave(this.id, 'complete');
      this._events.emit('form:autosave-complete', this.id, {});
    } catch (err) {
      this._state.setAutosaveStatus('error');
      this._state.setPhase('ready');
      this._autosaveConfig.onError?.(err as Error);
      this._diag.recordAutosave(this.id, 'error');
      this._events.emit('form:autosave-error', this.id, { error: String(err) });
    }
  }

  private _isDirtyForAutosave(): boolean {
    return this._state.isDirty();
  }
}

// ─── DynamicFormFactory ────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DynamicFormFactoryService {
  private readonly events    = inject(DynamicFormEventsService);
  private readonly diag      = inject(DynamicFormDiagnosticsService);
  private readonly metrics   = inject(DynamicFormMetricsService);
  private readonly lifecycle = inject(DynamicFormLifecycleService);
  private readonly snapshots = inject(DynamicFormSnapshotService);
  private readonly resolver  = inject(DynamicFormResolverService);
  private readonly injector  = inject(Injector);

  async create(
    definition: FormDefinition,
    initialModel: Record<string, unknown> = {},
    contextData: Partial<FormContextData> = {},
  ): Promise<FormInstance> {
    const t0 = performance.now();
    const id = `form-${++_instanceCounter}-${Date.now()}`;

    this.lifecycle.onCreated(id);
    this.diag.recordLifecycle(id, 'resolving');

    const resolveStart = performance.now();
    const resolvedForm = await this.resolver.resolve(definition);
    const resolveDuration = Math.round(performance.now() - resolveStart);

    const context = new DynamicFormContext();
    context.initialize({
      formKey:  definition.id,
      formId:   id,
      mode:     definition.mode,
      model:    initialModel,
      ...contextData,
    });

    const instance = new DynamicFormInstance(
      id,
      definition,
      resolvedForm,
      context,
      this.injector,
      this.events,
      this.diag,
      this.metrics,
      this.lifecycle,
      this.snapshots,
    );

    const initDuration = Math.round(performance.now() - t0);
    this.metrics.init(id, resolvedForm.allFields.length, initDuration, resolveDuration);
    this.diag.recordInit(id, initDuration);

    return instance;
  }
}
