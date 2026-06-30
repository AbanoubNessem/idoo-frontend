import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TableLoadingNode } from '../../rendering.types';

@Component({
  selector:        'platform-table-loading',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pt-loading" role="status" aria-label="Loading table data" aria-busy="true">
      @for (row of skeletonRows(); track $index) {
        <div class="pt-loading__row">
          @for (col of skeletonCols(); track $index) {
            <div class="pt-loading__cell">
              <div class="pt-skeleton"></div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .pt-loading { padding: 8px 0; }
    .pt-loading__row {
      display: flex; gap: 12px; padding: 10px 0;
      border-bottom: 1px solid var(--platform-color-border, #f0f0f0);
    }
    .pt-loading__cell { flex: 1; }
    .pt-skeleton {
      height: 16px; border-radius: 4px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: pt-shimmer 1.5s infinite;
    }
    @keyframes pt-shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
  `],
})
export class TableLoadingComponent {
  readonly node = input.required<TableLoadingNode>();

  readonly skeletonRows = computed(() => Array.from({ length: this.node().skeletonRows }));
  readonly skeletonCols = computed(() => Array.from({ length: Math.max(1, this.node().columnCount) }));
}
