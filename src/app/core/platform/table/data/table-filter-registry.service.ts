import { Injectable, signal, computed, Signal } from '@angular/core';
import { TableFilterPredicateFn } from './table-data.types';

@Injectable({ providedIn: 'root' })
export class TableFilterRegistry {
  private readonly _map     = new Map<string, TableFilterPredicateFn>();
  private readonly _version = signal(0);

  readonly registeredCount: Signal<number> = computed(() => {
    this._version();
    return this._map.size;
  });

  /** Register a custom filter predicate. Use in TableFilterCondition.predicateId. */
  registerPredicate(id: string, fn: TableFilterPredicateFn): void {
    this._map.set(id, fn);
    this._version.update(v => v + 1);
  }

  getPredicate(id: string): TableFilterPredicateFn | null {
    return this._map.get(id) ?? null;
  }

  hasPredicate(id: string): boolean {
    return this._map.has(id);
  }

  removePredicate(id: string): void {
    if (this._map.delete(id)) this._version.update(v => v + 1);
  }

  list(): string[] {
    return [...this._map.keys()];
  }
}
