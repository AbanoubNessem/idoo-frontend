import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormSectionComponent } from '../form-section/form-section.component';
import { FieldValueChangeEvent } from '../form-field-host/form-field-host.component';
import { DynamicFormState } from '../../state/dynamic-form-state';
import { ResolvedSection } from '../../form.types';

@Component({
  selector:        'df-accordion-container',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [FormSectionComponent],
  template: `
    <div class="df-accordion">
      @for (section of sections(); track section.id; let i = $index) {
        @if (!formState().getSection(section.id).hidden) {
          <div class="df-accordion-item" [class.df-accordion-item--open]="isOpen(i)">
            <button
              type="button"
              class="df-accordion-trigger"
              [attr.aria-expanded]="isOpen(i)"
              (click)="toggle(i)"
            >
              <span class="df-accordion-title">{{ section.title }}</span>
              <span class="df-accordion-icon" aria-hidden="true">
                {{ isOpen(i) ? '&#8963;' : '&#8964;' }}
              </span>
            </button>
            @if (isOpen(i)) {
              <div class="df-accordion-body">
                <df-section
                  [section]="section"
                  [formState]="formState()"
                  (valueChange)="valueChange.emit($event)"
                  (fieldBlur)="fieldBlur.emit($event)"
                  (fieldFocus)="fieldFocus.emit($event)"
                />
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .df-accordion { width: 100%; }
    .df-accordion-item {
      border: 1px solid var(--platform-color-border, #e0e0e0);
      border-radius: var(--platform-border-radius, 4px);
      margin-bottom: 8px; overflow: hidden;
    }
    .df-accordion-trigger {
      display: flex; align-items: center; justify-content: space-between; width: 100%;
      padding: 14px 16px; background: #fafafa; border: none; cursor: pointer;
      font-size: 0.9rem; font-weight: 500; text-align: left;
    }
    .df-accordion-item--open .df-accordion-trigger { background: #f0f4ff; }
    .df-accordion-body { padding: 16px; }
    .df-accordion-icon { font-size: 1rem; transition: transform 200ms; }
  `],
})
export class FormAccordionContainerComponent {
  readonly sections  = input.required<ResolvedSection[]>();
  readonly formState = input.required<DynamicFormState>();

  readonly valueChange = output<FieldValueChangeEvent>();
  readonly fieldBlur   = output<string>();
  readonly fieldFocus  = output<string>();

  private readonly _openSet = signal<Set<number>>(new Set([0]));

  isOpen(index: number): boolean {
    return this._openSet().has(index);
  }

  toggle(index: number): void {
    this._openSet.update(set => {
      const next = new Set(set);
      if (next.has(index)) { next.delete(index); }
      else { next.add(index); }
      return next;
    });
  }
}
