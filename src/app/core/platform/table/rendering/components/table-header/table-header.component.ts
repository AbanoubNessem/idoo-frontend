import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableHeaderCellNode } from '../../rendering.types';

@Component({
  selector:        'platform-table-header',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pt-header" role="row">
      @for (cell of cells(); track cell.columnId) {
        <div
          class="pt-header__cell"
          role="columnheader"
          [class.pt-header__cell--sortable]="cell.sortable"
          [class.pt-header__cell--required]="cell.required"
          [class.pt-header__cell--sticky-start]="cell.sticky === 'start'"
          [class.pt-header__cell--sticky-end]="cell.sticky === 'end'"
          [style.width]="cell.width"
          [style.min-width]="cell.minWidth"
          [style.max-width]="cell.maxWidth"
          [attr.data-column-id]="cell.columnId"
          [attr.data-column-type]="cell.columnType"
        >
          <span class="pt-header__label">{{ cell.header }}</span>
          @if (cell.required) {
            <span class="pt-header__required" aria-label="Required">*</span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .pt-header {
      display: flex; background: var(--platform-color-surface, #fafafa);
      border-bottom: 2px solid var(--platform-color-border, #e0e0e0);
      font-weight: 600; font-size: 0.8rem; text-transform: uppercase;
      letter-spacing: 0.04em; color: var(--platform-color-label, #616161);
    }
    .pt-header__cell {
      flex: 1; display: flex; align-items: center; padding: 10px 12px;
      overflow: hidden; position: relative; gap: 4px;
    }
    .pt-header__cell--sticky-start { position: sticky; left: 0; z-index: 1; background: inherit; }
    .pt-header__cell--sticky-end   { position: sticky; right: 0; z-index: 1; background: inherit; }
    .pt-header__cell--sortable     { cursor: pointer; }
    .pt-header__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pt-header__required { color: var(--platform-color-error, #d32f2f); margin-left: 2px; }
  `],
})
export class TableHeaderComponent {
  readonly cells = input.required<TableHeaderCellNode[]>();
}
