import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector:        'df-error-summary',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasErrors()) {
      <div class="df-error-summary" role="alert" aria-live="polite" aria-label="Form errors">
        <div class="df-error-summary-header">
          <span class="df-error-summary-icon" aria-hidden="true">&#9888;</span>
          <strong class="df-error-summary-title">
            {{ errorCount() }} error{{ errorCount() > 1 ? 's' : '' }} found — please fix before submitting
          </strong>
        </div>
        <ul class="df-error-summary-list">
          @for (entry of errorEntries(); track entry.key) {
            <li class="df-error-summary-item">
              <button
                type="button"
                class="df-error-link"
                (click)="scrollTo.emit(entry.key)"
              >
                {{ entry.label }}:
              </button>
              <span class="df-error-summary-msgs">{{ entry.messages }}</span>
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: [`
    .df-error-summary {
      border: 2px solid var(--platform-color-error, #d32f2f);
      border-radius: var(--platform-border-radius, 4px);
      padding: 16px;
      margin-bottom: 24px;
      background: #fff8f8;
    }
    .df-error-summary-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .df-error-summary-icon { color: var(--platform-color-error, #d32f2f); font-size: 1.2rem; }
    .df-error-summary-title { color: var(--platform-color-error, #d32f2f); font-size: 0.9rem; }
    .df-error-summary-list { margin: 0; padding-left: 20px; }
    .df-error-summary-item { margin-bottom: 4px; font-size: 0.875rem; }
    .df-error-link {
      background: none; border: none; padding: 0; color: var(--platform-color-error, #d32f2f);
      cursor: pointer; font-weight: 500; text-decoration: underline;
    }
    .df-error-summary-msgs { color: #424242; }
  `],
})
export class FormErrorSummaryComponent {
  readonly errors   = input<Record<string, string[]>>({});
  readonly fieldLabels = input<Record<string, string>>({});

  readonly scrollTo = output<string>();

  readonly hasErrors = computed(() => Object.keys(this.errors()).length > 0);

  readonly errorCount = computed(() =>
    Object.values(this.errors()).reduce((s, e) => s + e.length, 0),
  );

  readonly errorEntries = computed(() =>
    Object.entries(this.errors()).map(([key, msgs]) => ({
      key,
      label:    this.fieldLabels()[key] ?? key,
      messages: msgs.join('; '),
    })),
  );
}
