import { Injectable } from '@angular/core';
import { ResolvedTableColumn, TableColumnType } from '../../table.types';
import { TableBodyCellNode, TableCellValue } from '../rendering.types';

@Injectable({ providedIn: 'root' })
export class TableCellRendererService {

  buildBodyCells(visibleColumns: ResolvedTableColumn[]): TableBodyCellNode[] {
    return visibleColumns
      .map((col, index): TableBodyCellNode => ({
        type:        'body-cell',
        id:          `cell-col-${col.id}`,
        visible:     col.effectiveVisible,
        columnId:    col.id,
        field:       col.field,
        columnType:  col.type,
        renderer:    col.renderer,
        sticky:      col.sticky,
        editable:    col.effectiveEditable,
        permission:  col.permission,
        cellClass:   col.cellClass,
        width:       col.width,
        order:       col.order ?? index,
      }))
      .sort((a, b) => a.order - b.order);
  }

  formatValue(
    value:    unknown,
    node:     TableBodyCellNode,
    locale?:  string,
  ): TableCellValue {
    const isEmpty  = value == null || value === '';
    if (isEmpty) return { raw: value, formatted: '', isEmpty: true };

    const formatted = this._format(value, node.columnType, locale);
    return { raw: value, formatted, isEmpty: false };
  }

  // ─── Internal Formatters ──────────────────────────────────────────────────

  private _format(value: unknown, type: TableColumnType, locale?: string): string {
    try {
      switch (type) {
        case 'number':
          return new Intl.NumberFormat(locale).format(Number(value));

        case 'currency':
          return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(Number(value));

        case 'percentage':
          return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 })
            .format(typeof value === 'number' && value > 1 ? value / 100 : Number(value));

        case 'boolean':
          return Boolean(value) ? 'Yes' : 'No';

        case 'date':
          return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(String(value)));

        case 'datetime':
          return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
            .format(new Date(String(value)));

        case 'time':
          return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(String(value)));

        case 'progress':
          return `${Number(value)}%`;

        case 'rating':
          return String(value);

        case 'text':
        case 'badge':
        case 'chip':
        case 'status':
        case 'tag':
        case 'avatar':
        case 'image':
        case 'icon':
        case 'link':
        case 'email':
        case 'phone':
        case 'custom':
        default:
          return String(value);
      }
    } catch {
      return String(value);
    }
  }

  resolveCellClasses(node: TableBodyCellNode, value: unknown, row: Record<string, unknown>): string[] {
    const cls = node.cellClass;
    if (!cls) return [];
    if (typeof cls === 'function') return [cls(value, row)].flat();
    return [cls].flat();
  }
}
