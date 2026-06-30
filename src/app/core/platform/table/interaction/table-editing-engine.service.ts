import { Injectable, inject } from '@angular/core';
import { TableEditorResolver } from './table-editor-resolver.service';
import { TableInteractionEvents } from './table-interaction-events.service';
import { TableInteractionMetrics } from './table-interaction-metrics.service';
import { TableEditingContext } from './table-editing-context';
import { TableEditingStrategy } from './table-editing-strategy';
import {
  TableCellRef,
  TableEditCommit,
  TableEditContext,
  TableEditMode,
  TableEditabilityCheck,
  TableEditingSnapshot,
  TableEditorResolution,
  TableEditorType,
  TableValidatorFn,
} from './table-interaction.types';

@Injectable({ providedIn: 'root' })
export class TableEditingEngine {
  private readonly _events   = inject(TableInteractionEvents);
  private readonly _metrics  = inject(TableInteractionMetrics);
  private readonly _resolver = inject(TableEditorResolver);

  private readonly _contexts   = new Map<string, TableEditingContext>();
  private readonly _strategies = new Map<string, TableEditingStrategy>();
  private readonly _validators = new Map<string, Map<string, TableValidatorFn>>();

  createContext(tableId: string, mode: TableEditMode = 'cell'): TableEditingContext {
    const context  = new TableEditingContext(mode);
    const strategy = new TableEditingStrategy(mode);
    this._contexts.set(tableId, context);
    this._strategies.set(tableId, strategy);
    this._validators.set(tableId, new Map());
    this._metrics.track(tableId);
    return context;
  }

  getContext(tableId: string): TableEditingContext | null {
    return this._contexts.get(tableId) ?? null;
  }

  hasContext(tableId: string): boolean {
    return this._contexts.has(tableId);
  }

  canEdit(tableId: string, check: TableEditabilityCheck): boolean {
    const strategy = this._strategies.get(tableId);
    return strategy ? strategy.canEdit(check) : false;
  }

  startCellEdit(tableId: string, cell: TableCellRef, originalValue: unknown): void {
    const context = this._contexts.get(tableId);
    if (!context) return;
    context.startCellEdit(cell, originalValue);
    this._metrics.recordEditStart(tableId);
    this._events.emit({
      type:      'EditStarted',
      tableId,
      timestamp: new Date().toISOString(),
      payload:   { cell, mode: 'cell' },
    });
  }

  startRowEdit(tableId: string, rowId: string, originalValues: Record<string, unknown>): void {
    const context = this._contexts.get(tableId);
    if (!context) return;
    context.startRowEdit(rowId, originalValues);
    this._metrics.recordEditStart(tableId);
    this._events.emit({
      type:      'EditStarted',
      tableId,
      timestamp: new Date().toISOString(),
      payload:   { rowId, mode: 'row' },
    });
  }

  setValue(tableId: string, columnId: string, value: unknown): void {
    this._contexts.get(tableId)?.setValue(columnId, value);
  }

  getValue(tableId: string, columnId: string): unknown {
    return this._contexts.get(tableId)?.getValue(columnId);
  }

  validate(tableId: string, row: Record<string, unknown>): boolean {
    const context    = this._contexts.get(tableId);
    const validators = this._validators.get(tableId);
    if (!context || !validators) return true;

    let allValid = true;
    for (const [columnId, fn] of validators) {
      const value     = context.getValue(columnId);
      const editCtx: TableEditContext = {
        rowId:        context.editingRowId() ?? '',
        columnId,
        currentValue: value,
        row,
      };
      const result = fn(value, editCtx);
      if (!result.valid) {
        context.setValidationError(columnId, result.error ?? 'Invalid');
        allValid = false;
        this._metrics.recordValidationFailure(tableId);
      } else {
        context.clearValidationError(columnId);
      }
    }

    if (!allValid) {
      this._events.emit({
        type:      'EditValidationFailed',
        tableId,
        timestamp: new Date().toISOString(),
        payload:   context.toSnapshot(),
      });
    }
    return allValid;
  }

  commitEdit(
    tableId: string,
    row?: Record<string, unknown>,
  ): readonly TableEditCommit[] | null {
    const context = this._contexts.get(tableId);
    if (!context || !context.isEditing()) return null;

    if (row && !this.validate(tableId, row)) return null;
    if (!context.isValid()) return null;

    const commits = context.collectCommits(tableId);
    context.clearEdits();
    this._metrics.recordEditCommit(tableId);
    this._events.emit({
      type:      'EditCommitted',
      tableId,
      timestamp: new Date().toISOString(),
      payload:   commits,
    });
    return commits;
  }

  cancelEdit(tableId: string): void {
    const context = this._contexts.get(tableId);
    if (!context) return;
    context.cancelEdit();
    this._metrics.recordEditCancel(tableId);
    this._events.emit({
      type:      'EditCancelled',
      tableId,
      timestamp: new Date().toISOString(),
    });
  }

  registerValidator(tableId: string, columnId: string, fn: TableValidatorFn): void {
    if (!this._validators.has(tableId)) {
      this._validators.set(tableId, new Map());
    }
    this._validators.get(tableId)!.set(columnId, fn);
  }

  removeValidator(tableId: string, columnId: string): void {
    this._validators.get(tableId)?.delete(columnId);
  }

  resolveEditor(columnType: string, overrideType?: TableEditorType): TableEditorResolution {
    return this._resolver.resolve(columnType, overrideType);
  }

  snapshot(tableId: string): TableEditingSnapshot | null {
    return this._contexts.get(tableId)?.toSnapshot() ?? null;
  }

  listTables(): readonly string[] {
    return [...this._contexts.keys()];
  }

  dispose(tableId: string): void {
    this._contexts.delete(tableId);
    this._strategies.delete(tableId);
    this._validators.delete(tableId);
    this._metrics.dispose(tableId);
    this._events.clear(tableId);
  }
}
