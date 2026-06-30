import { signal, computed } from '@angular/core';
import {
  TableSortConfig,
  TableSortDirection,
  TableSortField,
} from './table-data.types';
import { TABLE_DATA_DEFAULT_SORT_CONFIG } from './table-data.constants';

/**
 * Per-instance sort state holder.
 * Created via TableDataEngine.createSortContext() — not @Injectable.
 */
export class TableSortContext {
  private readonly _fields      = signal<TableSortField[]>([]);
  private readonly _multiColumn = signal<boolean>(false);
  private readonly _stable      = signal<boolean>(true);

  readonly fields       = this._fields.asReadonly();
  readonly multiColumn  = this._multiColumn.asReadonly();
  readonly stable       = this._stable.asReadonly();
  readonly isActive     = computed(() => this._fields().length > 0);
  readonly fieldCount   = computed(() => this._fields().length);

  constructor(initial?: Partial<TableSortConfig>) {
    if (initial?.fields)      this._fields.set([...initial.fields]);
    if (initial?.multiColumn !== undefined) this._multiColumn.set(initial.multiColumn);
    if (initial?.stable      !== undefined) this._stable.set(initial.stable);
  }

  /** Replace the entire sort field list. */
  setFields(fields: TableSortField[]): void {
    this._fields.set([...fields]);
  }

  /** Set whether multi-column sort is enabled. */
  setMultiColumn(multi: boolean): void {
    this._multiColumn.set(multi);
    if (!multi && this._fields().length > 1) {
      this._fields.update(fields => [fields[0]]);
    }
  }

  /**
   * Toggle a sort field:
   * - If the same column is already sorted, cycle direction: asc → desc → remove.
   * - If a different column, add it (multi-column mode) or replace (single-column mode).
   */
  toggleField(field: TableSortField): void {
    const existing = this._fields().find(f => f.columnId === field.columnId);
    if (existing) {
      if (existing.direction === 'asc') {
        this._updateDirection(field.columnId, 'desc');
      } else {
        this.removeField(field.columnId);
      }
    } else if (this._multiColumn()) {
      this._fields.update(fields => [...fields, { ...field }]);
    } else {
      this._fields.set([{ ...field }]);
    }
  }

  /** Add a sort field. Replaces if same columnId exists. */
  addField(field: TableSortField): void {
    const idx = this._fields().findIndex(f => f.columnId === field.columnId);
    if (idx >= 0) {
      this._fields.update(fields =>
        fields.map((f, i) => i === idx ? { ...field } : f)
      );
    } else if (this._multiColumn()) {
      this._fields.update(fields => [...fields, { ...field }]);
    } else {
      this._fields.set([{ ...field }]);
    }
  }

  /** Remove a sort field by column id. */
  removeField(columnId: string): void {
    this._fields.update(fields => fields.filter(f => f.columnId !== columnId));
  }

  /** Clear all sort fields. */
  clear(): void {
    this._fields.set([]);
  }

  /** Produce an immutable snapshot config for the pipeline. */
  toConfig(): TableSortConfig {
    return Object.freeze({
      fields:      Object.freeze([...this._fields().map(f => Object.freeze({ ...f }))]),
      multiColumn: this._multiColumn(),
      stable:      this._stable(),
    });
  }

  private _updateDirection(columnId: string, direction: TableSortDirection): void {
    this._fields.update(fields =>
      fields.map(f => f.columnId === columnId ? { ...f, direction } : f)
    );
  }
}
