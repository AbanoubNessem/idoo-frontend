import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableEmptyNode } from '../../rendering.types';

@Component({
  selector:        'platform-table-empty',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pt-empty" role="status" aria-live="polite">
      @if (node().icon) {
        <span class="pt-empty__icon" aria-hidden="true" [innerHTML]="node().icon"></span>
      }
      <p class="pt-empty__msg">{{ node().message }}</p>
    </div>
  `,
  styles: [`
    .pt-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 48px 16px; color: var(--platform-color-secondary, #757575);
      text-align: center;
    }
    .pt-empty__icon { font-size: 2rem; margin-bottom: 12px; opacity: 0.5; }
    .pt-empty__msg  { margin: 0; font-size: 0.875rem; }
  `],
})
export class TableEmptyComponent {
  readonly node = input.required<TableEmptyNode>();
}
