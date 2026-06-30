import { Injectable } from '@angular/core';
import { TableState, TableStateSnapshot } from './table-state.types';
import { TABLE_STATE_DEFAULTS } from './table-state.constants';

let _snapshotCounter = 0;

@Injectable({ providedIn: 'root' })
export class TableStateSerializerService {

  /** Create an immutable snapshot from the current live state. */
  createSnapshot(tableId: string, state: TableState): TableStateSnapshot {
    return Object.freeze({
      id:         `state-snap-${++_snapshotCounter}`,
      tableId,
      capturedAt: new Date().toISOString(),
      state:      this._freezeState(state),
    }) as TableStateSnapshot;
  }

  serialize(snapshot: TableStateSnapshot): string {
    return JSON.stringify(this.toObject(snapshot));
  }

  deserialize(json: string): TableStateSnapshot {
    try {
      return this.fromObject(JSON.parse(json) as Record<string, unknown>);
    } catch {
      throw new Error('TableStateSerializer: failed to deserialize — invalid JSON');
    }
  }

  toObject(snapshot: TableStateSnapshot): Record<string, unknown> {
    return {
      id:         snapshot.id,
      tableId:    snapshot.tableId,
      capturedAt: snapshot.capturedAt,
      state:      { ...snapshot.state },
    };
  }

  fromObject(obj: Record<string, unknown>): TableStateSnapshot {
    if (typeof obj['tableId'] !== 'string' || !obj['tableId']) {
      throw new Error('TableStateSerializer: missing or invalid tableId in snapshot object');
    }
    const raw   = ((obj['state'] ?? {}) as Partial<TableState>);
    const state = this._buildState(obj['tableId'] as string, raw);

    return Object.freeze({
      id:         (typeof obj['id'] === 'string' ? obj['id'] : `state-snap-${++_snapshotCounter}`),
      tableId:    obj['tableId'] as string,
      capturedAt: (typeof obj['capturedAt'] === 'string' ? obj['capturedAt'] : new Date().toISOString()),
      state,
    }) as TableStateSnapshot;
  }

  clone(snapshot: TableStateSnapshot): TableStateSnapshot {
    return this.fromObject(this.toObject(snapshot));
  }

  private _buildState(tableId: string, raw: Partial<TableState>): Readonly<TableState> {
    return this._freezeState({
      tableId,
      loading:        raw.loading        ?? TABLE_STATE_DEFAULTS.loading,
      error:          raw.error          ?? TABLE_STATE_DEFAULTS.error,
      density:        raw.density        ?? TABLE_STATE_DEFAULTS.density,
      visibleColumns: Array.isArray(raw.visibleColumns) ? [...raw.visibleColumns] : [],
      expandedRows:   Array.isArray(raw.expandedRows)   ? [...raw.expandedRows]   : [],
      focusedCell:    raw.focusedCell    ?? null,
      hoveredRow:     raw.hoveredRow     ?? null,
      activeRow:      raw.activeRow      ?? null,
      selection:      { ...TABLE_STATE_DEFAULTS.selection, ...(raw.selection ?? {}) },
      sort:           { ...TABLE_STATE_DEFAULTS.sort,      ...(raw.sort      ?? {}) },
      filter:         { ...TABLE_STATE_DEFAULTS.filter,    ...(raw.filter    ?? {}) },
      pagination:     { ...TABLE_STATE_DEFAULTS.pagination,...(raw.pagination ?? {}) },
      editing:        { ...TABLE_STATE_DEFAULTS.editing,   ...(raw.editing   ?? {}) },
    });
  }

  private _freezeState(state: TableState): Readonly<TableState> {
    return Object.freeze({
      ...state,
      visibleColumns: Object.freeze([...state.visibleColumns]),
      expandedRows:   Object.freeze([...state.expandedRows]),
      focusedCell:    state.focusedCell ? Object.freeze({ ...state.focusedCell }) : null,
      selection:      Object.freeze({ ...state.selection }),
      sort:           Object.freeze({ ...state.sort }),
      filter:         Object.freeze({ ...state.filter }),
      pagination:     Object.freeze({ ...state.pagination }),
      editing:        Object.freeze({ ...state.editing }),
    }) as Readonly<TableState>;
  }
}
