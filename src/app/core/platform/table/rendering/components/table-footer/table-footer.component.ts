import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TableFooterRendererService } from '../../renderers/table-footer-renderer.service';
import { TableSummaryCellNode } from '../../rendering.types';

@Component({
  selector:        'platform-table-footer',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pt-footer" role="row">
      @for (cell of cells(); track cell.columnId) {
        <div class="pt-footer__cell" role="cell" [attr.data-summary]="cell.summaryType">
          @if (cell.label) {
            <span class="pt-footer__label">{{ cell.label }}</span>
          }
          <span class="pt-footer__value">{{ computedValues()[cell.columnId] ?? '' }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .pt-footer {
      display: flex; border-top: 2px solid var(--platform-color-border, #e0e0e0);
      background: var(--platform-color-surface, #fafafa);
      font-weight: 600; font-size: 0.875rem;
    }
    .pt-footer__cell {
      flex: 1; display: flex; flex-direction: column; padding: 8px 12px; gap: 2px;
    }
    .pt-footer__label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--platform-color-label, #757575); }
    .pt-footer__value { color: var(--platform-color-text, #212121); }
  `],
})
export class TableFooterComponent {
  private readonly footerSvc = inject(TableFooterRendererService);

  readonly cells = input.required<TableSummaryCellNode[]>();
  readonly rows  = input<Record<string, unknown>[]>([]);

  readonly computedValues = computed(() => {
    const result: Record<string, string> = {};
    for (const cell of this.cells()) {
      if (!cell.summaryType) continue;
      const val = this.footerSvc.computeSummaryValue(cell.summaryType, cell.field, this.rows());
      result[cell.columnId] = val != null ? String(Math.round(val * 100) / 100) : '';
    }
    return result;
  });
}
