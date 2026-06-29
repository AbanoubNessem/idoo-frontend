import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormSectionComponent } from '../form-section/form-section.component';
import { FieldValueChangeEvent } from '../form-field-host/form-field-host.component';
import { DynamicFormState } from '../../state/dynamic-form-state';
import { ResolvedStep } from '../../form.types';

export interface WizardNextEvent {
  fromIndex: number;
  toIndex:   number;
}

@Component({
  selector:        'df-wizard-container',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [FormSectionComponent],
  template: `
    <div class="df-wizard">

      <!-- Step indicator -->
      <nav class="df-wizard-nav" aria-label="Form steps">
        <ol class="df-wizard-steps">
          @for (step of steps(); track step.id; let i = $index) {
            <li
              class="df-wizard-step"
              [class.df-wizard-step--active]="currentIndex() === i"
              [class.df-wizard-step--completed]="isCompleted(step.id)"
            >
              <span class="df-wizard-step-num" aria-hidden="true">
                @if (isCompleted(step.id)) { &#10003; } @else { {{ i + 1 }} }
              </span>
              <span class="df-wizard-step-title">{{ step.title }}</span>
            </li>
          }
        </ol>
      </nav>

      <!-- Progress bar -->
      <div class="df-wizard-progress" role="progressbar"
        [attr.aria-valuenow]="progressPct()"
        aria-valuemin="0" aria-valuemax="100">
        <div class="df-wizard-progress-fill" [style.width.%]="progressPct()"></div>
      </div>

      <!-- Current step content -->
      @let currentStep = currentStepDef();
      @if (currentStep) {
        <div class="df-wizard-panel">
          @if (currentStep.description) {
            <p class="df-wizard-desc">{{ currentStep.description }}</p>
          }
          @for (section of currentStep.sections; track section.id) {
            <df-section
              [section]="section"
              [formState]="formState()"
              (valueChange)="valueChange.emit($event)"
              (fieldBlur)="fieldBlur.emit($event)"
              (fieldFocus)="fieldFocus.emit($event)"
            />
          }
        </div>
      }

      <!-- Wizard actions -->
      <div class="df-wizard-actions">
        <button
          type="button"
          class="df-wizard-btn df-wizard-btn--prev"
          [disabled]="currentIndex() === 0"
          (click)="prev.emit()"
        >
          Previous
        </button>
        <span class="df-wizard-pager">
          Step {{ currentIndex() + 1 }} of {{ steps().length }}
        </span>
        @if (isLastStep()) {
          <button
            type="button"
            class="df-wizard-btn df-wizard-btn--finish"
            (click)="finish.emit()"
          >
            Finish
          </button>
        } @else {
          <button
            type="button"
            class="df-wizard-btn df-wizard-btn--next"
            (click)="next.emit({ fromIndex: currentIndex(), toIndex: currentIndex() + 1 })"
          >
            Next
          </button>
        }
      </div>

    </div>
  `,
  styles: [`
    .df-wizard { width: 100%; }
    .df-wizard-nav { margin-bottom: 24px; }
    .df-wizard-steps { display: flex; list-style: none; margin: 0; padding: 0; gap: 0; }
    .df-wizard-step {
      display: flex; align-items: center; gap: 8px; flex: 1; font-size: 0.8rem;
      color: #9e9e9e; padding: 8px 12px; position: relative;
    }
    .df-wizard-step::after {
      content: ''; flex: 1; height: 2px;
      background: var(--platform-color-border, #e0e0e0); margin-left: 8px;
    }
    .df-wizard-step:last-child::after { display: none; }
    .df-wizard-step--active { color: var(--platform-color-primary, #1976d2); font-weight: 600; }
    .df-wizard-step--completed { color: #388e3c; }
    .df-wizard-step-num {
      width: 28px; height: 28px; border-radius: 50%; border: 2px solid currentColor;
      display: flex; align-items: center; justify-content: center; font-weight: 600;
      font-size: 0.8rem; flex-shrink: 0;
    }
    .df-wizard-progress {
      height: 4px; background: var(--platform-color-border, #e0e0e0);
      border-radius: 2px; margin-bottom: 24px; overflow: hidden;
    }
    .df-wizard-progress-fill {
      height: 100%; background: var(--platform-color-primary, #1976d2);
      transition: width 400ms ease;
    }
    .df-wizard-desc { color: #616161; margin-bottom: 16px; }
    .df-wizard-actions {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 32px; padding-top: 16px;
      border-top: 1px solid var(--platform-color-border, #e0e0e0);
    }
    .df-wizard-btn {
      padding: 10px 24px; border: none; border-radius: var(--platform-border-radius, 4px);
      cursor: pointer; font-size: 0.875rem; font-weight: 500;
    }
    .df-wizard-btn--prev { background: #f5f5f5; color: #424242; }
    .df-wizard-btn--next, .df-wizard-btn--finish {
      background: var(--platform-color-primary, #1976d2); color: #fff;
    }
    .df-wizard-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .df-wizard-pager { color: #757575; font-size: 0.8rem; }
  `],
})
export class FormWizardContainerComponent {
  readonly steps        = input.required<ResolvedStep[]>();
  readonly formState    = input.required<DynamicFormState>();
  readonly currentIndex = input<number>(0);

  readonly valueChange = output<FieldValueChangeEvent>();
  readonly fieldBlur   = output<string>();
  readonly fieldFocus  = output<string>();
  readonly next        = output<WizardNextEvent>();
  readonly prev        = output<void>();
  readonly finish      = output<void>();

  readonly currentStepDef = computed(() =>
    this.steps()[this.currentIndex()] ?? null,
  );

  readonly isLastStep = computed(() =>
    this.currentIndex() === this.steps().length - 1,
  );

  readonly progressPct = computed(() =>
    this.steps().length > 1
      ? Math.round((this.currentIndex() / (this.steps().length - 1)) * 100)
      : 0,
  );

  readonly completedSteps = computed(() =>
    this.formState().wizardState().completedSteps,
  );

  isCompleted(stepId: string): boolean {
    return this.completedSteps().has(stepId);
  }
}
