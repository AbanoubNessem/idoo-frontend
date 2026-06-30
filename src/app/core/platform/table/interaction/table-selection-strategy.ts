import { TableSelectionMode } from '../table.types';
import { TableSelectionAction } from './table-interaction.types';
import { TableSelectionContext } from './table-selection-context';

export class TableSelectionStrategy {
  private readonly _mode: TableSelectionMode;

  constructor(mode: TableSelectionMode = 'multiple') {
    this._mode = mode;
  }

  get mode(): TableSelectionMode {
    return this._mode;
  }

  apply(action: TableSelectionAction, context: TableSelectionContext): void {
    const { type, rowId, allIds } = action;

    switch (type) {
      case 'select':
        if (rowId) {
          context.select(rowId);
          context.setAnchorRow(rowId);
        }
        break;

      case 'deselect':
        if (rowId) context.deselect(rowId);
        break;

      case 'toggle':
        if (rowId) {
          context.toggle(rowId);
          context.setAnchorRow(rowId);
        }
        break;

      case 'range': {
        const anchor = context.anchorRowId();
        if (rowId && anchor && allIds) {
          context.selectRange(anchor, rowId, allIds);
        } else if (rowId) {
          context.select(rowId);
          context.setAnchorRow(rowId);
        }
        break;
      }

      case 'selectAll':
        if (allIds) {
          context.selectAll(allIds);
          context.setAnchorRow(null);
        }
        break;

      case 'clear':
        context.clearSelection();
        context.setAnchorRow(null);
        break;
    }
  }

  canSelect(mode: TableSelectionMode): boolean {
    return mode !== 'none';
  }

  canMultiSelect(mode: TableSelectionMode): boolean {
    return mode === 'multiple';
  }
}
