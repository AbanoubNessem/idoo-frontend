import { signal, computed } from '@angular/core';
import {
  TableFilterConfig,
  TableFilterCondition,
  TableFilterGroup,
  TableFilterLogic,
} from './table-data.types';
import { TABLE_DATA_DEFAULT_FILTER_GROUP } from './table-data.constants';

/**
 * Per-instance filter state holder.
 * Created via TableDataEngine.createFilterContext() — not @Injectable.
 */
export class TableFilterContext {
  private readonly _root = signal<TableFilterGroup>({ ...TABLE_DATA_DEFAULT_FILTER_GROUP, conditions: [] });

  readonly root = this._root.asReadonly();

  readonly isActive = computed(() => {
    const r = this._root();
    return r.conditions.length > 0 || (r.groups?.length ?? 0) > 0;
  });

  readonly conditionCount = computed(() => this._root().conditions.length);

  constructor(initial?: TableFilterGroup) {
    if (initial) this._root.set({ ...initial, conditions: [...initial.conditions] });
  }

  /** Replace the entire filter group tree. */
  setGroup(group: TableFilterGroup): void {
    this._root.set({ ...group, conditions: [...group.conditions] });
  }

  /** Set the root logic (AND / OR). */
  setLogic(logic: TableFilterLogic): void {
    this._root.update(r => ({ ...r, logic }));
  }

  /** Add a condition to the root group. Replaces if same columnId exists. */
  addCondition(condition: TableFilterCondition): void {
    const idx = this._root().conditions.findIndex(c => c.columnId === condition.columnId);
    if (idx >= 0) {
      this._root.update(r => ({
        ...r,
        conditions: r.conditions.map((c, i) => i === idx ? { ...condition } : c),
      }));
    } else {
      this._root.update(r => ({
        ...r,
        conditions: [...r.conditions, { ...condition }],
      }));
    }
  }

  /** Remove the condition for a specific column from the root group. */
  removeCondition(columnId: string): void {
    this._root.update(r => ({
      ...r,
      conditions: r.conditions.filter(c => c.columnId !== columnId),
    }));
  }

  /** Clear all conditions and nested groups. */
  clear(): void {
    this._root.set({ ...TABLE_DATA_DEFAULT_FILTER_GROUP, conditions: [] });
  }

  /** Produce an immutable snapshot config for the pipeline. */
  toConfig(): TableFilterConfig {
    return Object.freeze({ root: this._freezeGroup(this._root()) });
  }

  private _freezeGroup(group: TableFilterGroup): TableFilterGroup {
    return Object.freeze({
      logic:      group.logic,
      conditions: Object.freeze([...group.conditions.map(c => Object.freeze({ ...c }))]),
      groups:     group.groups
        ? Object.freeze(group.groups.map(g => this._freezeGroup(g)))
        : undefined,
    });
  }
}
