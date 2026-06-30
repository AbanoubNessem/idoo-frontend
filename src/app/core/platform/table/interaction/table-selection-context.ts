import { Signal, computed, signal } from '@angular/core';
import { TableSelectionMode } from '../table.types';
import { TableCellRef, TableSelectionSnapshot } from './table-interaction.types';

export class TableSelectionContext {
  private readonly _mode         = signal<TableSelectionMode>('multiple');
  private readonly _selected     = signal<ReadonlySet<string>>(new Set());
  private readonly _currentRowId = signal<string | null>(null);
  private readonly _currentCell  = signal<TableCellRef | null>(null);
  private readonly _anchorRowId  = signal<string | null>(null);

  readonly mode:          Signal<TableSelectionMode>  = this._mode.asReadonly();
  readonly currentRowId:  Signal<string | null>        = this._currentRowId.asReadonly();
  readonly currentCell:   Signal<TableCellRef | null>  = this._currentCell.asReadonly();
  readonly anchorRowId:   Signal<string | null>        = this._anchorRowId.asReadonly();
  readonly selectedIds:   Signal<readonly string[]>    = computed(() => [...this._selected()]);
  readonly selectedCount: Signal<number>               = computed(() => this._selected().size);
  readonly hasSelection:  Signal<boolean>              = computed(() => this._selected().size > 0);

  constructor(mode: TableSelectionMode = 'multiple') {
    this._mode.set(mode);
  }

  isSelected(id: string): Signal<boolean> {
    return computed(() => this._selected().has(id));
  }

  isAllSelected(allIds: readonly string[]): Signal<boolean> {
    return computed(() => {
      const sel = this._selected();
      return allIds.length > 0 && allIds.every(id => sel.has(id));
    });
  }

  select(id: string): void {
    const mode = this._mode();
    if (mode === 'none') return;
    if (mode === 'single') {
      this._selected.set(new Set([id]));
    } else {
      const next = new Set(this._selected());
      next.add(id);
      this._selected.set(next);
    }
  }

  deselect(id: string): void {
    const next = new Set(this._selected());
    next.delete(id);
    this._selected.set(next);
  }

  toggle(id: string): void {
    if (this._selected().has(id)) {
      this.deselect(id);
    } else {
      this.select(id);
    }
  }

  selectRange(fromId: string, toId: string, allIds: readonly string[]): void {
    if (this._mode() === 'none' || this._mode() === 'single') return;
    const fromIdx = allIds.indexOf(fromId);
    const toIdx   = allIds.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [start, end] = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    const next = new Set(this._selected());
    for (let i = start; i <= end; i++) next.add(allIds[i]);
    this._selected.set(next);
  }

  selectAll(allIds: readonly string[]): void {
    if (this._mode() === 'none' || this._mode() === 'single') return;
    this._selected.set(new Set(allIds));
  }

  clearSelection(): void {
    this._selected.set(new Set());
  }

  setCurrentRow(id: string | null): void {
    this._currentRowId.set(id);
  }

  setCurrentCell(cell: TableCellRef | null): void {
    this._currentCell.set(cell);
  }

  setAnchorRow(id: string | null): void {
    this._anchorRowId.set(id);
  }

  setMode(mode: TableSelectionMode): void {
    if (mode === 'single' && this._selected().size > 1) {
      const first = [...this._selected()][0];
      this._selected.set(first ? new Set([first]) : new Set());
    }
    this._mode.set(mode);
  }

  toSnapshot(): TableSelectionSnapshot {
    return Object.freeze({
      mode:         this._mode(),
      selectedIds:  Object.freeze([...this._selected()]),
      currentRowId: this._currentRowId(),
      currentCell:  this._currentCell()
        ? Object.freeze({ ...this._currentCell()! })
        : null,
      anchorRowId:  this._anchorRowId(),
    });
  }
}
