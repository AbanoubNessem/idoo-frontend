import { Injectable, inject } from '@angular/core';
import { TableSortConfig, TableSortField } from './table-data.types';
import { TableComparatorRegistry } from './table-comparator-registry.service';

type Row = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class TableSortingEngine {
  private readonly _comparators = inject(TableComparatorRegistry);

  /**
   * Sort rows according to the config.
   * Returns a new array — original is never mutated.
   * Implements stable sort by preserving original index as tiebreaker.
   */
  sort(rows: Row[], config: TableSortConfig): Row[] {
    if (!config.fields.length) return [...rows];

    // Tag each row with its original index for stable tiebreaking
    const indexed = rows.map((row, i) => ({ row, i }));

    indexed.sort((a, b) => {
      for (const field of config.fields) {
        const result = this._compareField(a.row, b.row, field);
        if (result !== 0) return field.direction === 'asc' ? result : -result;
      }
      // Stable: preserve original order when all comparisons are equal
      return config.stable ? a.i - b.i : 0;
    });

    return indexed.map(({ row }) => row);
  }

  private _compareField(a: Row, b: Row, field: TableSortField): number {
    const va = this._getFieldValue(a, field.field);
    const vb = this._getFieldValue(b, field.field);

    // Nulls sort last
    if (va === null || va === undefined) return vb === null || vb === undefined ? 0 : 1;
    if (vb === null || vb === undefined) return -1;

    if (field.comparatorId) {
      const fn = this._comparators.get(field.comparatorId);
      if (fn) return fn(va, vb, field.locale);
    }

    return this._defaultCompare(va, vb, field.locale);
  }

  private _defaultCompare(a: unknown, b: unknown, locale?: string): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);

    const sa = String(a);
    const sb = String(b);

    if (locale) return new Intl.Collator(locale).compare(sa, sb);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  }

  private _getFieldValue(row: Row, field: string): unknown {
    if (!field.includes('.')) return row[field];
    const parts = field.split('.');
    let current: unknown = row;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = (current as Row)[part];
    }
    return current;
  }
}
