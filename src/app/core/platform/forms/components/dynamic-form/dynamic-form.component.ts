import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  signal,
  SimpleChanges,
  untracked,
} from '@angular/core';

import { FormSectionComponent } from '../form-section/form-section.component';
import { FormTabsContainerComponent } from '../form-tabs/form-tabs-container.component';
import { FormWizardContainerComponent } from '../form-wizard/form-wizard-container.component';
import { FormAccordionContainerComponent } from '../form-accordion/form-accordion-container.component';
import { FormErrorSummaryComponent } from '../form-error-summary/form-error-summary.component';
import { FormArrayComponent } from '../form-array/form-array.component';
import { FieldValueChangeEvent } from '../form-field-host/form-field-host.component';
import { WizardNextEvent } from '../form-wizard/form-wizard-container.component';

import { DynamicFormEngine } from '../../engine/dynamic-form-engine.service';
import { DynamicFormState } from '../../state/dynamic-form-state';

import {
  FormContextData,
  FormDefinition,
  FormInstance,
  FormValidationResult,
  ResolvedFormModel,
} from '../../form.types';

// ─── DynamicFormComponent ─────────────────────────────────────────────────────
// The top-level form rendering orchestrator.
// - Receives a FormDefinition (or form key) + initial model
// - Creates a FormInstance via DynamicFormEngine
// - Renders layout using sub-components (tabs / wizard / accordion / sections)
// - Routes field value changes back into the FormInstance
// - MUST NOT render field components directly
// - MUST NOT contain business logic

@Component({
  selector:        'dynamic-form',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormSectionComponent,
    FormTabsContainerComponent,
    FormWizardContainerComponent,
    FormAccordionContainerComponent,
    FormErrorSummaryComponent,
    FormArrayComponent,
  ],
  template: `
    <div
      class="df-root"
      [class.df-root--loading]="phase() === 'loading'"
      [class.df-root--submitting]="phase() === 'submitting'"
      [class.df-root--submitted]="phase() === 'submitted'"
      [class.df-root--error]="phase() === 'error'"
      [attr.data-form-id]="instanceId()"
      [attr.aria-busy]="phase() === 'loading' || phase() === 'submitting'"
    >

      <!-- Loading skeleton -->
      @if (phase() === 'loading') {
        <div class="df-loading" role="status" aria-label="Loading form">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="df-skeleton-field">
              <div class="df-skeleton-label"></div>
              <div class="df-skeleton-input"></div>
            </div>
          }
        </div>
      }

      <!-- Error state -->
      @if (phase() === 'error') {
        <div class="df-error-state" role="alert">
          <span class="df-error-icon" aria-hidden="true">&#9888;</span>
          <p class="df-error-message">{{ errorMessage() ?? 'An error occurred loading the form.' }}</p>
          <button type="button" class="df-retry-btn" (click)="retryLoad()">Retry</button>
        </div>
      }

      <!-- Form content -->
      @if (isReady()) {
        @let resolved = resolvedForm();
        @let formState = activeFormState();

        <!-- Header -->
        @if (resolved && resolved.definition.title) {
          <header class="df-header">
            <h2 class="df-form-title">{{ resolved.definition.title }}</h2>
            @if (resolved.definition.description) {
              <p class="df-form-desc">{{ resolved.definition.description }}</p>
            }
          </header>
        }

        <!-- Error summary (shown after first submit attempt) -->
        @if (showErrorSummary() && !formState!.isValid()) {
          <df-error-summary
            [errors]="formState!.allErrors()"
            [fieldLabels]="fieldLabels()"
            (scrollTo)="scrollToField($event)"
          />
        }

        <!-- Autosave status -->
        @if (formState!.autosaveStatus() !== 'idle') {
          <div class="df-autosave-status" aria-live="polite">
            @switch (formState!.autosaveStatus()) {
              @case ('saving')   { <span class="df-autosave--saving">Saving draft&hellip;</span> }
              @case ('saved')    { <span class="df-autosave--saved">&#10003; Draft saved</span> }
              @case ('error')    { <span class="df-autosave--error">&#9888; Draft save failed</span> }
            }
          </div>
        }

        <!-- Layout -->
        <form class="df-form" (submit)="onFormSubmit($event)" novalidate>

          @switch (layout()) {
            @case ('tabs') {
              <df-tabs-container
                [tabs]="resolved!.tabs"
                [formState]="formState!"
                (valueChange)="onValueChange($event)"
                (fieldBlur)="onFieldBlur($event)"
                (fieldFocus)="onFieldFocus($event)"
              />
            }
            @case ('wizard') {
              <df-wizard-container
                [steps]="resolved!.steps"
                [formState]="formState!"
                [currentIndex]="wizardStep()"
                (valueChange)="onValueChange($event)"
                (fieldBlur)="onFieldBlur($event)"
                (fieldFocus)="onFieldFocus($event)"
                (next)="onWizardNext($event)"
                (prev)="onWizardPrev()"
                (finish)="onWizardFinish()"
              />
            }
            @case ('accordion') {
              <df-accordion-container
                [sections]="resolved!.sections"
                [formState]="formState!"
                (valueChange)="onValueChange($event)"
                (fieldBlur)="onFieldBlur($event)"
                (fieldFocus)="onFieldFocus($event)"
              />
            }
            @default {
              <!-- simple / sections -->
              @for (section of resolved!.sections; track section.id) {
                @if (!formState!.getSection(section.id).hidden) {
                  <df-section
                    [section]="section"
                    [formState]="formState!"
                    (valueChange)="onValueChange($event)"
                    (fieldBlur)="onFieldBlur($event)"
                    (fieldFocus)="onFieldFocus($event)"
                  />
                }
              }
            }
          }

          <!-- Form actions (hidden for wizard — wizard has its own controls) -->
          @if (showFormActions() && layout() !== 'wizard') {
            <div class="df-actions">
              @if (definition()?.draftMode) {
                <button type="button" class="df-btn df-btn--secondary" (click)="saveDraft()">
                  Save Draft
                </button>
              }
              @if (showCancelButton()) {
                <button type="button" class="df-btn df-btn--ghost" (click)="cancel.emit()">
                  {{ definition()?.cancelLabel ?? 'Cancel' }}
                </button>
              }
              <button
                type="submit"
                class="df-btn df-btn--primary"
                [disabled]="phase() === 'submitting'"
                [attr.aria-busy]="phase() === 'submitting'"
              >
                @if (phase() === 'submitting') { Submitting&hellip; }
                @else { {{ definition()?.submitLabel ?? 'Submit' }} }
              </button>
            </div>
          }

          <!-- Undo/Redo toolbar -->
          @if (showUndoRedo()) {
            <div class="df-history-toolbar" aria-label="Form history">
              <button type="button" class="df-hist-btn" [disabled]="!canUndo()" (click)="undo()">
                &#8617; Undo
              </button>
              <button type="button" class="df-hist-btn" [disabled]="!canRedo()" (click)="redo()">
                Redo &#8618;
              </button>
            </div>
          }

        </form>
      }

    </div>
  `,
  styles: [`
    .df-root { width: 100%; font-family: var(--platform-font-family, inherit); }
    .df-header { margin-bottom: 24px; }
    .df-form-title { margin: 0 0 4px; font-size: 1.25rem; font-weight: 600; }
    .df-form-desc { margin: 0; color: #616161; font-size: 0.875rem; }

    /* Loading skeleton */
    .df-loading { padding: 16px; }
    .df-skeleton-field { margin-bottom: 20px; }
    .df-skeleton-label, .df-skeleton-input {
      border-radius: 4px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%; animation: df-shimmer 1.5s infinite;
    }
    .df-skeleton-label { height: 14px; width: 40%; margin-bottom: 8px; }
    .df-skeleton-input { height: 44px; width: 100%; }
    @keyframes df-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

    /* Error state */
    .df-error-state {
      display: flex; flex-direction: column; align-items: center; padding: 32px;
      text-align: center; color: var(--platform-color-error, #d32f2f);
    }
    .df-error-icon { font-size: 2rem; margin-bottom: 8px; }
    .df-error-message { margin: 0 0 16px; }
    .df-retry-btn {
      padding: 8px 20px; border: 1px solid currentColor; border-radius: 4px;
      background: none; color: inherit; cursor: pointer;
    }

    /* Autosave */
    .df-autosave-status { font-size: 0.75rem; padding: 4px 0; margin-bottom: 8px; }
    .df-autosave--saving { color: #616161; }
    .df-autosave--saved  { color: #388e3c; }
    .df-autosave--error  { color: var(--platform-color-error, #d32f2f); }

    /* Actions */
    .df-actions {
      display: flex; align-items: center; justify-content: flex-end;
      gap: 12px; margin-top: 32px; padding-top: 16px;
      border-top: 1px solid var(--platform-color-border, #e0e0e0);
    }
    .df-btn {
      padding: 10px 24px; border-radius: var(--platform-border-radius, 4px);
      font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none;
      transition: opacity 200ms;
    }
    .df-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .df-btn--primary { background: var(--platform-color-primary, #1976d2); color: #fff; }
    .df-btn--secondary { background: #f5f5f5; color: #424242; }
    .df-btn--ghost { background: none; color: #757575; border: 1px solid #bdbdbd; }

    /* History toolbar */
    .df-history-toolbar { display: flex; gap: 8px; margin-top: 12px; }
    .df-hist-btn {
      padding: 6px 12px; border: 1px solid #e0e0e0; border-radius: 4px;
      background: #fafafa; cursor: pointer; font-size: 0.8rem;
    }
    .df-hist-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `],
})
export class DynamicFormComponent implements OnInit, OnChanges, OnDestroy {
  private readonly engine = inject(DynamicFormEngine);

  // ─── Inputs ───────────────────────────────────────────────────────────────

  readonly definition  = input<FormDefinition | null>(null);
  readonly formKey     = input<string | null>(null);
  readonly initialModel = input<Record<string, unknown>>({});
  readonly contextData = input<Partial<FormContextData>>({});
  readonly showCancelButton = input<boolean>(true);
  readonly showUndoRedo = input<boolean>(false);

  // ─── Outputs ──────────────────────────────────────────────────────────────

  readonly formSubmit    = output<{ model: Record<string, unknown>; formId: string }>();
  readonly formValidated = output<FormValidationResult>();
  readonly valueChanged  = output<FieldValueChangeEvent>();
  readonly cancel        = output<void>();
  readonly draftSaved    = output<void>();
  readonly formReady     = output<string>();

  // ─── Private state ────────────────────────────────────────────────────────

  private _instance: FormInstance | null = null;
  private _submitAttempted = false;

  readonly instanceId    = signal<string | null>(null);
  readonly phase         = signal<string>('uninitialized');
  readonly errorMessage  = signal<string | null>(null);
  readonly wizardStep    = signal(0);
  readonly _formState    = signal<DynamicFormState | null>(null);

  // ─── Computed ─────────────────────────────────────────────────────────────

  readonly isReady = computed(() =>
    ['ready', 'validating', 'submitting', 'submitted', 'autosaving'].includes(this.phase()),
  );

  readonly resolvedForm = computed<ResolvedFormModel | null>(() => {
    const id = this.instanceId();
    if (!id) return null;
    return this.engine.getInstance(id)?.resolvedForm ?? null;
  });

  readonly activeFormState = computed(() => this._formState());

  readonly layout = computed(() => this.resolvedForm()?.definition.layout ?? 'simple');

  readonly showErrorSummary = computed(() => {
    const resolved = this.resolvedForm();
    return this._submitAttempted && (resolved?.definition.showErrorSummary ?? true);
  });

  readonly showFormActions = computed(() =>
    this.resolvedForm()?.definition.showActions !== false,
  );

  readonly fieldLabels = computed<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    for (const field of this.resolvedForm()?.allFields ?? []) {
      result[field.key] = field.label;
    }
    return result;
  });

  readonly canUndo = computed(() => {
    const id = this.instanceId();
    if (!id) return false;
    return this.engine.getInstance(id)?.canUndo() ?? false;
  });

  readonly canRedo = computed(() => {
    const id = this.instanceId();
    if (!id) return false;
    return this.engine.getInstance(id)?.canRedo() ?? false;
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    void this._loadForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !changes['definition']?.firstChange ||
      !changes['formKey']?.firstChange
    ) {
      if (changes['definition'] || changes['formKey']) {
        void this._reloadForm();
      }
    }
  }

  ngOnDestroy(): void {
    this._destroyInstance();
  }

  // ─── Form Actions ─────────────────────────────────────────────────────────

  async onFormSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await this.submit();
  }

  async submit(): Promise<void> {
    if (!this._instance) return;
    this._submitAttempted = true;

    const validation = await this._instance.validate();
    this.formValidated.emit(validation);

    if (!validation.valid) {
      if (this.resolvedForm()?.definition.scrollToFirstError) {
        this._instance.scrollToFirstError();
      }
      return;
    }

    await this._instance.submit();
    this.formSubmit.emit({ model: this._instance.getModel(), formId: this._instance.id });
  }

  retryLoad(): void {
    void this._reloadForm();
  }

  saveDraft(): void {
    this._instance?.saveDraft();
    this.draftSaved.emit();
  }

  undo(): void { this._instance?.undo(); }
  redo(): void { this._instance?.redo(); }

  scrollToField(key: string): void { this._instance?.scrollToField(key); }

  // ─── Field Event Handlers ─────────────────────────────────────────────────

  onValueChange(event: FieldValueChangeEvent): void {
    this._instance?.setValue(event.key, event.value);
    this.valueChanged.emit(event);
    this._syncPhase();
  }

  onFieldBlur(key: string): void {
    this._instance?.setFieldTouched(key);
    this._syncPhase();
  }

  onFieldFocus(_key: string): void {
    // No-op: focus tracking is handled by FormInstance events
  }

  // ─── Wizard Handlers ──────────────────────────────────────────────────────

  async onWizardNext(_event: WizardNextEvent): Promise<void> {
    const moved = await this._instance?.nextStep();
    if (moved) {
      this.wizardStep.update(n => n + 1);
      this._syncPhase();
    }
  }

  onWizardPrev(): void {
    this._instance?.prevStep();
    this.wizardStep.update(n => Math.max(0, n - 1));
  }

  async onWizardFinish(): Promise<void> {
    await this.submit();
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private async _loadForm(): Promise<void> {
    this.phase.set('loading');

    try {
      const def = this.definition();
      const key = this.formKey();

      if (!def && !key) {
        this.phase.set('error');
        this.errorMessage.set('No form definition or form key provided.');
        return;
      }

      let instance: FormInstance;
      if (def) {
        instance = await this.engine.createForm(def, this.initialModel(), this.contextData());
      } else {
        instance = await this.engine.createFormByKey(key!, this.initialModel(), this.contextData());
      }

      await instance.initialize(this.initialModel());

      this._instance = instance;
      this.instanceId.set(instance.id);
      this._formState.set(instance.state as DynamicFormState);
      this._syncPhase();
      this.formReady.emit(instance.id);

    } catch (err) {
      this.phase.set('error');
      this.errorMessage.set(String(err));
    }
  }

  private async _reloadForm(): Promise<void> {
    this._destroyInstance();
    await this._loadForm();
  }

  private _destroyInstance(): void {
    if (this._instance) {
      this.engine.destroyInstance(this._instance.id);
      this._instance = null;
      this.instanceId.set(null);
      this._formState.set(null);
    }
  }

  private _syncPhase(): void {
    if (!this._instance) return;
    this.phase.set(this._instance.getPhase());
  }
}
