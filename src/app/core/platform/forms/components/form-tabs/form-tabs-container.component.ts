import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormSectionComponent } from '../form-section/form-section.component';
import { FieldValueChangeEvent } from '../form-field-host/form-field-host.component';
import { DynamicFormState } from '../../state/dynamic-form-state';
import { ResolvedTab } from '../../form.types';

@Component({
  selector:        'df-tabs-container',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [FormSectionComponent],
  template: `
    <div class="df-tabs">
      <!-- Tab bar -->
      <div class="df-tab-bar" role="tablist">
        @for (tab of visibleTabs(); track tab.id; let i = $index) {
          <button
            type="button"
            class="df-tab-btn"
            [class.df-tab-btn--active]="activeIndex() === i"
            [attr.role]="'tab'"
            [attr.aria-selected]="activeIndex() === i"
            [attr.aria-controls]="'df-tab-panel-' + tab.id"
            (click)="setTab(i)"
          >
            @if (tab.icon) { <span class="df-tab-icon" aria-hidden="true">{{ tab.icon }}</span> }
            {{ tab.title }}
            @if (tab.badge) {
              <span class="df-tab-badge">{{ tab.badge }}</span>
            }
          </button>
        }
      </div>

      <!-- Tab panels -->
      @for (tab of visibleTabs(); track tab.id; let i = $index) {
        <div
          class="df-tab-panel"
          [id]="'df-tab-panel-' + tab.id"
          role="tabpanel"
          [attr.aria-hidden]="activeIndex() !== i"
          [hidden]="activeIndex() !== i"
        >
          @for (section of tab.sections; track section.id) {
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
    </div>
  `,
  styles: [`
    .df-tabs { width: 100%; }
    .df-tab-bar {
      display: flex; border-bottom: 2px solid var(--platform-color-border, #e0e0e0);
      margin-bottom: 24px; overflow-x: auto;
    }
    .df-tab-btn {
      display: flex; align-items: center; gap: 6px; padding: 10px 20px;
      background: none; border: none; border-bottom: 3px solid transparent;
      cursor: pointer; font-size: 0.875rem; color: #616161; white-space: nowrap;
      margin-bottom: -2px; transition: color 200ms;
    }
    .df-tab-btn--active {
      color: var(--platform-color-primary, #1976d2);
      border-bottom-color: var(--platform-color-primary, #1976d2);
      font-weight: 600;
    }
    .df-tab-badge {
      background: var(--platform-color-primary, #1976d2); color: #fff;
      border-radius: 10px; padding: 2px 6px; font-size: 0.7rem;
    }
    .df-tab-panel { outline: none; }
  `],
})
export class FormTabsContainerComponent {
  readonly tabs      = input.required<ResolvedTab[]>();
  readonly formState = input.required<DynamicFormState>();

  readonly valueChange = output<FieldValueChangeEvent>();
  readonly fieldBlur   = output<string>();
  readonly fieldFocus  = output<string>();

  readonly activeIndex = signal(0);

  readonly visibleTabs = computed(() =>
    this.tabs().filter(t => !t.hiddenExpression),
  );

  setTab(index: number): void {
    this.activeIndex.set(index);
  }
}
