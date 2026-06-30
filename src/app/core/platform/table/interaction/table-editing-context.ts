import { Signal, computed, signal } from '@angular/core';
import { TableCellRef, TableEditCommit, TableEditMode, TableEditingSnapshot } from './table-interaction.types';

export class TableEditingContext {
  private readonly _mode             = signal<TableEditMode>('cell');
  private readonly _editingCell      = signal<TableCellRef | null>(null);
  private readonly _editingRowId     = signal<string | null>(null);
  private readonly _pendingEdits     = signal(new Map<string, unknown>());
  private readonly _validationErrors = signal(new Map<string, string>());
  private _originalValues            = new Map<string, unknown>();

  readonly mode:         Signal<TableEditMode>      = this._mode.asReadonly();
  readonly editingCell:  Signal<TableCellRef | null> = this._editingCell.asReadonly();
  readonly editingRowId: Signal<string | null>       = this._editingRowId.asReadonly();
  readonly isEditing:    Signal<boolean>             = computed(
    () => this._editingCell() !== null || this._editingRowId() !== null,
  );
  readonly isDirty:     Signal<boolean> = computed(() => this._pendingEdits().size > 0);
  readonly isValid:     Signal<boolean> = computed(() => this._validationErrors().size === 0);
  readonly pendingCount: Signal<number> = computed(() => this._pendingEdits().size);
  readonly errorCount:   Signal<number> = computed(() => this._validationErrors().size);

  constructor(mode: TableEditMode = 'cell') {
    this._mode.set(mode);
  }

  startCellEdit(cell: TableCellRef, originalValue: unknown): void {
    this._editingCell.set(Object.freeze({ ...cell }));
    this._editingRowId.set(cell.rowId);
    this._originalValues = new Map([[cell.columnId, originalValue]]);
    this._pendingEdits.set(new Map());
    this._validationErrors.set(new Map());
  }

  startRowEdit(rowId: string, originalValues: Record<string, unknown>): void {
    this._editingRowId.set(rowId);
    this._editingCell.set(null);
    this._originalValues = new Map(Object.entries(originalValues));
    this._pendingEdits.set(new Map());
    this._validationErrors.set(new Map());
  }

  setValue(columnId: string, value: unknown): void {
    const next = new Map(this._pendingEdits());
    next.set(columnId, value);
    this._pendingEdits.set(next);
  }

  getValue(columnId: string): unknown {
    const pending = this._pendingEdits();
    return pending.has(columnId)
      ? pending.get(columnId)
      : this._originalValues.get(columnId);
  }

  getOriginalValue(columnId: string): unknown {
    return this._originalValues.get(columnId);
  }

  setValidationError(columnId: string, error: string): void {
    const next = new Map(this._validationErrors());
    next.set(columnId, error);
    this._validationErrors.set(next);
  }

  clearValidationError(columnId: string): void {
    const next = new Map(this._validationErrors());
    next.delete(columnId);
    this._validationErrors.set(next);
  }

  getValidationError(columnId: string): string | null {
    return this._validationErrors().get(columnId) ?? null;
  }

  collectCommits(tableId: string): readonly TableEditCommit[] {
    const rowId = this._editingRowId();
    if (!rowId) return Object.freeze([]);
    const commits: TableEditCommit[] = [];
    for (const [columnId, value] of this._pendingEdits()) {
      commits.push(Object.freeze({
        tableId,
        rowId,
        columnId,
        value,
        previousValue: this._originalValues.get(columnId),
      }));
    }
    return Object.freeze(commits);
  }

  cancelEdit(): void {
    this._editingCell.set(null);
    this._editingRowId.set(null);
    this._pendingEdits.set(new Map());
    this._validationErrors.set(new Map());
    this._originalValues.clear();
  }

  clearEdits(): void {
    this.cancelEdit();
  }

  setMode(mode: TableEditMode): void {
    this._mode.set(mode);
  }

  toSnapshot(): TableEditingSnapshot {
    return Object.freeze({
      mode:         this._mode(),
      editingCell:  this._editingCell()
        ? Object.freeze({ ...this._editingCell()! })
        : null,
      editingRowId: this._editingRowId(),
      isDirty:      this._pendingEdits().size > 0,
      isValid:      this._validationErrors().size === 0,
    });
  }
}
