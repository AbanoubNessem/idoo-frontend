import { Injectable, inject } from '@angular/core';
import { TableSelectionMode } from '../table.types';
import { TableInteractionEvents } from './table-interaction-events.service';
import { TableInteractionMetrics } from './table-interaction-metrics.service';
import { TableSelectionContext } from './table-selection-context';
import { TableSelectionStrategy } from './table-selection-strategy';
import {
  TableCellRef,
  TableSelectionAction,
  TableSelectionSnapshot,
} from './table-interaction.types';

@Injectable({ providedIn: 'root' })
export class TableSelectionEngine {
  private readonly _events  = inject(TableInteractionEvents);
  private readonly _metrics = inject(TableInteractionMetrics);

  private readonly _contexts   = new Map<string, TableSelectionContext>();
  private readonly _strategies = new Map<string, TableSelectionStrategy>();

  createContext(tableId: string, mode: TableSelectionMode = 'multiple'): TableSelectionContext {
    const context  = new TableSelectionContext(mode);
    const strategy = new TableSelectionStrategy(mode);
    this._contexts.set(tableId, context);
    this._strategies.set(tableId, strategy);
    this._metrics.track(tableId);
    this._events.emit({
      type:      'SelectionChanged',
      tableId,
      timestamp: new Date().toISOString(),
      payload:   context.toSnapshot(),
    });
    return context;
  }

  getContext(tableId: string): TableSelectionContext | null {
    return this._contexts.get(tableId) ?? null;
  }

  hasContext(tableId: string): boolean {
    return this._contexts.has(tableId);
  }

  apply(tableId: string, action: TableSelectionAction, allIds?: readonly string[]): void {
    const context  = this._contexts.get(tableId);
    const strategy = this._strategies.get(tableId);
    if (!context || !strategy) return;

    const resolved: TableSelectionAction = allIds ? { ...action, allIds } : action;
    strategy.apply(resolved, context);
    this._metrics.recordSelectionChange(tableId);

    const eventType =
      action.type === 'clear'     ? 'SelectionCleared' :
      action.type === 'selectAll' ? 'AllSelected'       :
      action.type === 'deselect'  ? 'RowDeselected'     :
      action.type === 'select'    ? 'RowSelected'       :
      'SelectionChanged';

    this._events.emit({
      type:      eventType,
      tableId,
      timestamp: new Date().toISOString(),
      payload:   context.toSnapshot(),
    });
  }

  select(tableId: string, rowId: string): void {
    this.apply(tableId, { type: 'select', rowId });
  }

  deselect(tableId: string, rowId: string): void {
    this.apply(tableId, { type: 'deselect', rowId });
  }

  toggle(tableId: string, rowId: string, allIds?: readonly string[]): void {
    this.apply(tableId, { type: 'toggle', rowId }, allIds);
  }

  selectRange(tableId: string, toRowId: string, allIds: readonly string[]): void {
    this.apply(tableId, { type: 'range', rowId: toRowId }, allIds);
  }

  selectAll(tableId: string, allIds: readonly string[]): void {
    this.apply(tableId, { type: 'selectAll' }, allIds);
  }

  clearSelection(tableId: string): void {
    this.apply(tableId, { type: 'clear' });
  }

  setCurrentRow(tableId: string, rowId: string | null): void {
    const context = this._contexts.get(tableId);
    if (!context) return;
    context.setCurrentRow(rowId);
    this._events.emit({
      type:      'CurrentRowChanged',
      tableId,
      timestamp: new Date().toISOString(),
      payload:   rowId,
    });
  }

  setCurrentCell(tableId: string, cell: TableCellRef | null): void {
    const context = this._contexts.get(tableId);
    if (!context) return;
    context.setCurrentCell(cell);
    this._events.emit({
      type:      'CurrentCellChanged',
      tableId,
      timestamp: new Date().toISOString(),
      payload:   cell,
    });
  }

  snapshot(tableId: string): TableSelectionSnapshot | null {
    return this._contexts.get(tableId)?.toSnapshot() ?? null;
  }

  listTables(): readonly string[] {
    return [...this._contexts.keys()];
  }

  dispose(tableId: string): void {
    this._contexts.delete(tableId);
    this._strategies.delete(tableId);
    this._metrics.dispose(tableId);
    this._events.clear(tableId);
  }
}
