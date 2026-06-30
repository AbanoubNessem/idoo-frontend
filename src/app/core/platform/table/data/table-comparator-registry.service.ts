import { Injectable, signal, computed, Signal } from '@angular/core';
import { TableComparatorFn } from './table-data.types';
import {
  TABLE_COMPARATOR_BOOLEAN,
  TABLE_COMPARATOR_DATE,
  TABLE_COMPARATOR_LOCALE,
  TABLE_COMPARATOR_NUMBER,
  TABLE_COMPARATOR_TEXT,
} from './table-data.constants';

@Injectable({ providedIn: 'root' })
export class TableComparatorRegistry {
  private readonly _map     = new Map<string, TableComparatorFn>();
  private readonly _version = signal(0);

  readonly registeredCount: Signal<number> = computed(() => {
    this._version();
    return this._map.size;
  });

  constructor() {
    this._registerBuiltIns();
  }

  register(id: string, fn: TableComparatorFn): void {
    this._map.set(id, fn);
    this._version.update(v => v + 1);
  }

  get(id: string): TableComparatorFn | null {
    return this._map.get(id) ?? null;
  }

  has(id: string): boolean {
    return this._map.has(id);
  }

  remove(id: string): void {
    if (this._map.delete(id)) this._version.update(v => v + 1);
  }

  list(): string[] {
    return [...this._map.keys()];
  }

  private _registerBuiltIns(): void {
    this._map.set(TABLE_COMPARATOR_TEXT, (a, b) => {
      const sa = String(a ?? '').toLowerCase();
      const sb = String(b ?? '').toLowerCase();
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    });

    this._map.set(TABLE_COMPARATOR_NUMBER, (a, b) => {
      const na = a === null || a === undefined ? -Infinity : Number(a);
      const nb = b === null || b === undefined ? -Infinity : Number(b);
      return na - nb;
    });

    this._map.set(TABLE_COMPARATOR_DATE, (a, b) => {
      const da = new Date(a as string | number).getTime();
      const db = new Date(b as string | number).getTime();
      const va = isNaN(da) ? -Infinity : da;
      const vb = isNaN(db) ? -Infinity : db;
      return va - vb;
    });

    this._map.set(TABLE_COMPARATOR_BOOLEAN, (a, b) => {
      const ba = a ? 1 : 0;
      const bb = b ? 1 : 0;
      return ba - bb;
    });

    this._map.set(TABLE_COMPARATOR_LOCALE, (a, b, locale) => {
      const sa = String(a ?? '');
      const sb = String(b ?? '');
      return new Intl.Collator(locale).compare(sa, sb);
    });
  }
}
