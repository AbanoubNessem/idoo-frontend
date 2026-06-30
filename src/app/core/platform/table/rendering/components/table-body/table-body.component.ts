import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableCellComponent } from '../table-cell/table-cell.component';
import { TableBodyCellNode } from '../../rendering.types';

@Component({
  selector:        'platform-table-body',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [TableCellComponent],
  template: `
    <div class="pt-body" role="rowgroup">
      @for (row of rows(); track trackRow($index, row)) {
        <div class="pt-body__row" role="row">
          @for (cell of bodyCells(); track cell.columnId) {
            <platform-table-cell
              [node]="cell"
              [value]="getFieldValue(row, cell.field)"
            />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .pt-body { display: flex; flex-direction: column; }
    .pt-body__row {
      display: flex; border-bottom: 1px solid var(--platform-color-border, #f0f0f0);
      transition: background 120ms;
    }
    .pt-body__row:hover { background: var(--platform-color-hover, #fafafa); }
  `],
})
export class TableBodyComponent {
  readonly bodyCells = input.required<TableBodyCellNode[]>();
  readonly rows      = input<Record<string, unknown>[]>([]);

  trackRow(index: number, row: Record<string, unknown>): unknown {
    return (row as Record<string, unknown>)['id'] ?? index;
  }

  getFieldValue(row: Record<string, unknown>, field: string): unknown {
    if (!field.includes('.')) return row[field];
    return field.split('.').reduce<unknown>((acc, key) =>
      acc != null && typeof acc === 'object'
        ? (acc as Record<string, unknown>)[key]
        : undefined,
      row,
    );
  }
}
