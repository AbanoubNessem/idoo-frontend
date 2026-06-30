import { Injectable, inject } from '@angular/core';
import {
  TableFilterConfig,
  TableFilterCondition,
  TableFilterGroup,
} from './table-data.types';
import { TableFilterRegistry } from './table-filter-registry.service';

type Row = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class TableFilteringEngine {
  private readonly _registry = inject(TableFilterRegistry);

  /**
   * Filter rows according to the config.
   * Returns a new array — original is never mutated.
   */
  filter(rows: Row[], config: TableFilterConfig): Row[] {
    if (!this._groupHasContent(config.root)) return [...rows];
    return rows.filter(row => this._matchGroup(row, config.root));
  }

  // ─── Group matching ───────────────────────────────────────────────────────

  private _matchGroup(row: Row, group: TableFilterGroup): boolean {
    const results: boolean[] = [
      ...group.conditions.map(c => this._matchCondition(row, c)),
      ...(group.groups ?? []).map(g => this._matchGroup(row, g)),
    ];
    if (results.length === 0) return true;
    return group.logic === 'and' ? results.every(Boolean) : results.some(Boolean);
  }

  private _matchCondition(row: Row, condition: TableFilterCondition): boolean {
    const value = this._getFieldValue(row, condition.field);
    return this._applyOperator(value, condition);
  }

  // ─── Operator dispatch ────────────────────────────────────────────────────

  private _applyOperator(value: unknown, condition: TableFilterCondition): boolean {
    switch (condition.operator) {
      case 'contains':     return this._opContains(value, condition);
      case 'startsWith':   return this._opStartsWith(value, condition);
      case 'endsWith':     return this._opEndsWith(value, condition);
      case 'equals':       return this._opEquals(value, condition);
      case 'notEquals':    return !this._opEquals(value, condition);
      case 'greaterThan':  return this._opCompare(value, condition) > 0;
      case 'lessThan':     return this._opCompare(value, condition) < 0;
      case 'between':      return this._opBetween(value, condition);
      case 'in':           return this._opIn(value, condition);
      case 'boolean':      return this._opBoolean(value, condition);
      case 'date':         return this._opDate(value, condition);
      case 'custom':       return this._opCustom(value, condition);
      default:             return true;
    }
  }

  // ─── Individual operators ─────────────────────────────────────────────────

  private _opContains(value: unknown, c: TableFilterCondition): boolean {
    const s  = this._str(value,     c.caseSensitive);
    const cv = this._str(c.value,   c.caseSensitive);
    return s.includes(cv);
  }

  private _opStartsWith(value: unknown, c: TableFilterCondition): boolean {
    return this._str(value, c.caseSensitive).startsWith(this._str(c.value, c.caseSensitive));
  }

  private _opEndsWith(value: unknown, c: TableFilterCondition): boolean {
    return this._str(value, c.caseSensitive).endsWith(this._str(c.value, c.caseSensitive));
  }

  private _opEquals(value: unknown, c: TableFilterCondition): boolean {
    if (typeof value === 'string' && typeof c.value === 'string') {
      return this._str(value, c.caseSensitive) === this._str(c.value, c.caseSensitive);
    }
    return value === c.value;
  }

  private _opCompare(value: unknown, c: TableFilterCondition): number {
    const n  = Number(value);
    const cv = Number(c.value);
    if (!isNaN(n) && !isNaN(cv)) return n - cv;
    const s  = String(value  ?? '');
    const sv = String(c.value ?? '');
    return s < sv ? -1 : s > sv ? 1 : 0;
  }

  private _opBetween(value: unknown, c: TableFilterCondition): boolean {
    const n    = Number(value);
    const low  = Number(c.value);
    const high = Number(c.value2);
    if (isNaN(n) || isNaN(low) || isNaN(high)) return false;
    return n >= low && n <= high;
  }

  private _opIn(value: unknown, c: TableFilterCondition): boolean {
    if (!Array.isArray(c.value)) return false;
    return (c.value as unknown[]).includes(value);
  }

  private _opBoolean(value: unknown, c: TableFilterCondition): boolean {
    const bv = typeof value === 'string'
      ? value.toLowerCase() === 'true'
      : Boolean(value);
    return bv === Boolean(c.value);
  }

  private _opDate(value: unknown, c: TableFilterCondition): boolean {
    const rowDate = new Date(value as string | number);
    const cmpDate = new Date(c.value as string | number);
    if (isNaN(rowDate.getTime()) || isNaN(cmpDate.getTime())) return false;
    return rowDate.toDateString() === cmpDate.toDateString();
  }

  private _opCustom(value: unknown, c: TableFilterCondition): boolean {
    if (!c.predicateId) return true;
    const fn = this._registry.getPredicate(c.predicateId);
    return fn ? fn(value, c) : true;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _str(value: unknown, caseSensitive?: boolean): string {
    const s = String(value ?? '');
    return caseSensitive ? s : s.toLowerCase();
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

  private _groupHasContent(group: TableFilterGroup): boolean {
    return group.conditions.length > 0 || (group.groups?.length ?? 0) > 0;
  }
}
