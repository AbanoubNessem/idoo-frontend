import { Injectable } from '@angular/core';
import { ResolvedTableColumn, TableSummaryDefinition } from '../../table.types';
import { TableSummaryCellNode } from '../rendering.types';

@Injectable({ providedIn: 'root' })
export class TableFooterRendererService {

  buildFooterCells(
    summaries:      TableSummaryDefinition[],
    visibleColumns: ResolvedTableColumn[],
  ): TableSummaryCellNode[] {
    if (!summaries.length) return [];

    const visibleIds = new Set(visibleColumns.map(c => c.id));
    const colByField = new Map(visibleColumns.map(c => [c.field, c]));

    return summaries
      .filter(s => colByField.has(s.field))
      .map((summary, i): TableSummaryCellNode | null => {
        const col = colByField.get(summary.field);
        if (!col || !visibleIds.has(col.id)) return null;

        return {
          type:        'footer-cell',
          id:          `footer-${col.id}-${i}`,
          visible:     true,
          columnId:    col.id,
          field:       summary.field,
          summaryType: summary.type,
          label:       summary.label,
          footerClass: col.footerClass,
        };
      })
      .filter((n): n is TableSummaryCellNode => n !== null);
  }

  computeSummaryValue(
    summaryType: string,
    field:       string,
    rows:        Record<string, unknown>[],
  ): number | null {
    const values = rows
      .map(r => r[field])
      .filter((v): v is number => typeof v === 'number');

    if (!values.length) return null;

    switch (summaryType) {
      case 'sum':     return values.reduce((a, b) => a + b, 0);
      case 'average': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'count':   return rows.length;
      case 'min':     return Math.min(...values);
      case 'max':     return Math.max(...values);
      default:        return null;
    }
  }
}
