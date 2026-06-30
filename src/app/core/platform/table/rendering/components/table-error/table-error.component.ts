import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TableErrorNode } from '../../rendering.types';

@Component({
  selector:        'platform-table-error',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pt-error" role="alert">
      <span class="pt-error__icon" aria-hidden="true">&#9888;</span>
      <p class="pt-error__msg">{{ node().message }}</p>
      @if (node().details) {
        <details class="pt-error__details">
          <summary>Details</summary>
          <pre class="pt-error__trace">{{ node().details }}</pre>
        </details>
      }
      <button type="button" class="pt-error__retry" (click)="retry.emit()">
        Retry
      </button>
    </div>
  `,
  styles: [`
    .pt-error {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 48px 16px; text-align: center;
      color: var(--platform-color-error, #d32f2f);
    }
    .pt-error__icon { font-size: 2rem; margin-bottom: 12px; }
    .pt-error__msg  { margin: 0 0 16px; font-size: 0.875rem; }
    .pt-error__details { margin-bottom: 16px; font-size: 0.75rem; text-align: left; max-width: 600px; }
    .pt-error__trace { white-space: pre-wrap; word-break: break-all; color: #616161; }
    .pt-error__retry {
      padding: 8px 20px; border: 1px solid currentColor; border-radius: 4px;
      background: none; color: inherit; cursor: pointer; font-size: 0.875rem;
    }
  `],
})
export class TableErrorComponent {
  readonly node  = input.required<TableErrorNode>();
  readonly retry = output<void>();
}
