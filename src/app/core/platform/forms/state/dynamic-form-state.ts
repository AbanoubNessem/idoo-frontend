import { computed, signal, Signal } from '@angular/core';
import {
  AutosaveStatus,
  FieldState,
  FormPhase,
  FormValidationResult,
  SectionState,
  WizardState,
} from '../form.types';

// ─── Default Field State ─────────────────────────────────────────────────────

const DEFAULT_FIELD_STATE: FieldState = {
  value:    null,
  errors:   [],
  warnings: [],
  touched:  false,
  dirty:    false,
  loading:  false,
  hidden:   false,
  disabled: false,
  required: false,
  skeleton: false,
  readonly: false,
};

const DEFAULT_SECTION_STATE: SectionState = {
  collapsed: false,
  hidden:    false,
  disabled:  false,
  loaded:    true,
};

// ─── DynamicFormState ────────────────────────────────────────────────────────

export class DynamicFormState {
  private readonly _fieldStates   = signal<Record<string, FieldState>>({});
  private readonly _sectionStates = signal<Record<string, SectionState>>({});
  private readonly _phase         = signal<FormPhase>('uninitialized');
  private readonly _submitCount   = signal(0);
  private readonly _errorMessage  = signal<string | null>(null);
  private readonly _autosaveStatus = signal<AutosaveStatus>('idle');
  private readonly _lastSavedAt   = signal<string | null>(null);
  private readonly _wizardStep    = signal(0);
  private readonly _completedSteps = signal<ReadonlySet<string>>(new Set());
  private readonly _draftKey      = signal<string | null>(null);

  readonly fieldStates   = this._fieldStates.asReadonly();
  readonly sectionStates = this._sectionStates.asReadonly();
  readonly phase         = this._phase.asReadonly();
  readonly submitCount   = this._submitCount.asReadonly();
  readonly errorMessage  = this._errorMessage.asReadonly();
  readonly autosaveStatus = this._autosaveStatus.asReadonly();
  readonly lastSavedAt   = this._lastSavedAt.asReadonly();

  readonly model: Signal<Record<string, unknown>> = computed(() => {
    const states = this._fieldStates();
    const model: Record<string, unknown> = {};
    for (const [key, state] of Object.entries(states)) {
      model[key] = state.value;
    }
    return model;
  });

  readonly isValid: Signal<boolean> = computed(() => {
    return Object.values(this._fieldStates()).every(s => s.errors.length === 0);
  });

  readonly isDirty: Signal<boolean> = computed(() => {
    return Object.values(this._fieldStates()).some(s => s.dirty);
  });

  readonly isTouched: Signal<boolean> = computed(() => {
    return Object.values(this._fieldStates()).some(s => s.touched);
  });

  readonly isSubmitting: Signal<boolean> = computed(() =>
    this._phase() === 'submitting',
  );

  readonly isLoading: Signal<boolean> = computed(() =>
    this._phase() === 'loading',
  );

  readonly allErrors: Signal<Record<string, string[]>> = computed(() => {
    const result: Record<string, string[]> = {};
    for (const [key, state] of Object.entries(this._fieldStates())) {
      if (state.errors.length > 0) result[key] = state.errors;
    }
    return result;
  });

  readonly wizardState: Signal<WizardState> = computed(() => ({
    currentStepIndex: this._wizardStep(),
    completedSteps:   this._completedSteps(),
    stepErrors:       new Map<string, string[]>(),
    isFinished:       false,
  }));

  // ─── Field State API ──────────────────────────────────────────────────────

  initField(key: string, overrides: Partial<FieldState> = {}): void {
    this._fieldStates.update(states => ({
      ...states,
      [key]: { ...DEFAULT_FIELD_STATE, ...overrides },
    }));
  }

  getField(key: string): FieldState {
    return this._fieldStates()[key] ?? DEFAULT_FIELD_STATE;
  }

  setValue(key: string, value: unknown): void {
    this._mutateField(key, s => ({
      ...s,
      value,
      dirty: s.value !== value ? true : s.dirty,
    }));
  }

  setErrors(key: string, errors: string[]): void {
    this._mutateField(key, s => ({ ...s, errors }));
  }

  clearErrors(key?: string): void {
    if (key) {
      this._mutateField(key, s => ({ ...s, errors: [] }));
    } else {
      this._fieldStates.update(states => {
        const next: Record<string, FieldState> = {};
        for (const [k, s] of Object.entries(states)) next[k] = { ...s, errors: [] };
        return next;
      });
    }
  }

  setTouched(key: string, touched = true): void {
    this._mutateField(key, s => ({ ...s, touched }));
  }

  setLoading(key: string, loading: boolean): void {
    this._mutateField(key, s => ({ ...s, loading }));
  }

  setHidden(key: string, hidden: boolean): void {
    this._mutateField(key, s => ({ ...s, hidden }));
  }

  setDisabled(key: string, disabled: boolean): void {
    this._mutateField(key, s => ({ ...s, disabled }));
  }

  setRequired(key: string, required: boolean): void {
    this._mutateField(key, s => ({ ...s, required }));
  }

  setSkeleton(key: string, skeleton: boolean): void {
    this._mutateField(key, s => ({ ...s, skeleton }));
  }

  setAllSkeleton(skeleton: boolean): void {
    this._fieldStates.update(states => {
      const next: Record<string, FieldState> = {};
      for (const [k, s] of Object.entries(states)) next[k] = { ...s, skeleton };
      return next;
    });
  }

  // ─── Section State API ────────────────────────────────────────────────────

  initSection(id: string, overrides: Partial<SectionState> = {}): void {
    this._sectionStates.update(s => ({
      ...s,
      [id]: { ...DEFAULT_SECTION_STATE, ...overrides },
    }));
  }

  getSection(id: string): SectionState {
    return this._sectionStates()[id] ?? DEFAULT_SECTION_STATE;
  }

  setSectionCollapsed(id: string, collapsed: boolean): void {
    this._mutateSectionState(id, s => ({ ...s, collapsed }));
  }

  setSectionHidden(id: string, hidden: boolean): void {
    this._mutateSectionState(id, s => ({ ...s, hidden }));
  }

  setSectionLoaded(id: string, loaded: boolean): void {
    this._mutateSectionState(id, s => ({ ...s, loaded }));
  }

  // ─── Phase API ────────────────────────────────────────────────────────────

  setPhase(phase: FormPhase): void {
    this._phase.set(phase);
  }

  setErrorMessage(message: string | null): void {
    this._errorMessage.set(message);
  }

  incrementSubmitCount(): void {
    this._submitCount.update(n => n + 1);
  }

  // ─── Autosave API ────────────────────────────────────────────────────────

  setAutosaveStatus(status: AutosaveStatus): void {
    this._autosaveStatus.set(status);
    if (status === 'saved') {
      this._lastSavedAt.set(new Date().toISOString());
    }
  }

  // ─── Wizard API ──────────────────────────────────────────────────────────

  setWizardStep(index: number): void {
    this._wizardStep.set(index);
  }

  markStepCompleted(stepId: string): void {
    this._completedSteps.update(set => {
      const next = new Set(set);
      next.add(stepId);
      return next;
    });
  }

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  patchModel(patch: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(patch)) {
      this.setValue(key, value);
    }
  }

  reset(keys: string[], initialModel: Record<string, unknown> = {}): void {
    this._fieldStates.update(states => {
      const next: Record<string, FieldState> = {};
      for (const key of keys) {
        next[key] = {
          ...DEFAULT_FIELD_STATE,
          value: initialModel[key] ?? null,
        };
      }
      return next;
    });
    this._phase.set('ready');
    this._submitCount.set(0);
    this._errorMessage.set(null);
    this._wizardStep.set(0);
    this._completedSteps.set(new Set());
  }

  buildValidationResult(): FormValidationResult {
    const errors = this.allErrors();
    const errorCount = Object.values(errors).reduce((sum, e) => sum + e.length, 0);
    return {
      valid:       this.isValid(),
      errors,
      warnings:    {},
      fieldCount:  Object.keys(this._fieldStates()).length,
      errorCount,
    };
  }

  snapshot(): Record<string, FieldState> {
    return { ...this._fieldStates() };
  }

  restoreSnapshot(fieldStates: Record<string, FieldState>): void {
    this._fieldStates.set({ ...fieldStates });
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private _mutateField(key: string, updater: (s: FieldState) => FieldState): void {
    this._fieldStates.update(states => ({
      ...states,
      [key]: updater(states[key] ?? DEFAULT_FIELD_STATE),
    }));
  }

  private _mutateSectionState(id: string, updater: (s: SectionState) => SectionState): void {
    this._sectionStates.update(states => ({
      ...states,
      [id]: updater(states[id] ?? DEFAULT_SECTION_STATE),
    }));
  }
}
