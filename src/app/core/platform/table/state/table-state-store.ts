import { signal, computed, Signal } from '@angular/core';
import { TableDensity } from '../table.types';
import {
  TableState,
  TableStateUpdate,
  TableFocusedCell,
  TableSelectionState,
  TableSortState,
  TableFilterState,
  TablePaginationState,
  TableEditingState,
} from './table-state.types';
import { TABLE_STATE_DEFAULTS } from './table-state.constants';

/**
 * Per-instance signal store for a single table's state.
 * Created via TableStateEngine.createStore() — not @Injectable.
 */
export class TableStateStore {
  private readonly _tableId: string;

  private readonly _loading        = signal<boolean>(TABLE_STATE_DEFAULTS.loading);
  private readonly _error          = signal<string | null>(TABLE_STATE_DEFAULTS.error);
  private readonly _density        = signal<TableDensity>(TABLE_STATE_DEFAULTS.density);
  private readonly _visibleColumns = signal<string[]>([]);
  private readonly _expandedRows   = signal<unknown[]>([]);
  private readonly _focusedCell    = signal<TableFocusedCell | null>(null);
  private readonly _hoveredRow     = signal<unknown | null>(null);
  private readonly _activeRow      = signal<unknown | null>(null);
  private readonly _selection      = signal<TableSelectionState>({ ...TABLE_STATE_DEFAULTS.selection });
  private readonly _sort           = signal<TableSortState>({ ...TABLE_STATE_DEFAULTS.sort });
  private readonly _filter         = signal<TableFilterState>({ ...TABLE_STATE_DEFAULTS.filter });
  private readonly _pagination     = signal<TablePaginationState>({ ...TABLE_STATE_DEFAULTS.pagination });
  private readonly _editing        = signal<TableEditingState>({ ...TABLE_STATE_DEFAULTS.editing });

  // Public read-only signals
  readonly loading:        Signal<boolean>             = this._loading.asReadonly();
  readonly error:          Signal<string | null>       = this._error.asReadonly();
  readonly density:        Signal<TableDensity>        = this._density.asReadonly();
  readonly visibleColumns: Signal<string[]>            = this._visibleColumns.asReadonly();
  readonly expandedRows:   Signal<unknown[]>           = this._expandedRows.asReadonly();
  readonly focusedCell:    Signal<TableFocusedCell | null> = this._focusedCell.asReadonly();
  readonly hoveredRow:     Signal<unknown | null>      = this._hoveredRow.asReadonly();
  readonly activeRow:      Signal<unknown | null>      = this._activeRow.asReadonly();
  readonly selection       = computed(() => this._selection());
  readonly sort            = computed(() => this._sort());
  readonly filter          = computed(() => this._filter());
  readonly pagination      = computed(() => this._pagination());
  readonly editing         = computed(() => this._editing());

  constructor(tableId: string, initial?: TableStateUpdate) {
    this._tableId = tableId;
    if (initial) this._apply(initial);
  }

  get tableId(): string { return this._tableId; }

  /** Immutable snapshot of the current state. */
  snapshot(): TableState {
    return Object.freeze({
      tableId:        this._tableId,
      loading:        this._loading(),
      error:          this._error(),
      density:        this._density(),
      visibleColumns: Object.freeze([...this._visibleColumns()]),
      expandedRows:   Object.freeze([...this._expandedRows()]),
      focusedCell:    this._focusedCell()
        ? Object.freeze({ ...this._focusedCell()! })
        : null,
      hoveredRow:     this._hoveredRow(),
      activeRow:      this._activeRow(),
      selection:      Object.freeze({ ...this._selection() }),
      sort:           Object.freeze({ ...this._sort() }),
      filter:         Object.freeze({ ...this._filter() }),
      pagination:     Object.freeze({ ...this._pagination() }),
      editing:        Object.freeze({ ...this._editing() }),
    }) as TableState;
  }

  /** Apply a partial update to the store's signals. */
  update(changes: TableStateUpdate): void {
    this._apply(changes);
  }

  /** Reset every signal to platform defaults. */
  reset(): void {
    const d = TABLE_STATE_DEFAULTS;
    this._loading.set(d.loading);
    this._error.set(d.error);
    this._density.set(d.density);
    this._visibleColumns.set([]);
    this._expandedRows.set([]);
    this._focusedCell.set(null);
    this._hoveredRow.set(null);
    this._activeRow.set(null);
    this._selection.set({ ...d.selection });
    this._sort.set({ ...d.sort });
    this._filter.set({ ...d.filter });
    this._pagination.set({ ...d.pagination });
    this._editing.set({ ...d.editing });
  }

  /** Restore all signals from a previously captured state. */
  restore(state: TableState): void {
    this._apply({
      loading:        state.loading,
      error:          state.error,
      density:        state.density,
      visibleColumns: [...state.visibleColumns],
      expandedRows:   [...state.expandedRows],
      focusedCell:    state.focusedCell ? { ...state.focusedCell } : null,
      hoveredRow:     state.hoveredRow,
      activeRow:      state.activeRow,
      selection:      { ...state.selection },
      sort:           { ...state.sort },
      filter:         { ...state.filter },
      pagination:     { ...state.pagination },
      editing:        { ...state.editing },
    });
  }

  private _apply(changes: TableStateUpdate): void {
    if (changes.loading        !== undefined) this._loading.set(changes.loading);
    if (changes.error          !== undefined) this._error.set(changes.error);
    if (changes.density        !== undefined) this._density.set(changes.density);
    if (changes.visibleColumns !== undefined) this._visibleColumns.set([...changes.visibleColumns]);
    if (changes.expandedRows   !== undefined) this._expandedRows.set([...changes.expandedRows]);
    if (changes.focusedCell    !== undefined)
      this._focusedCell.set(changes.focusedCell ? { ...changes.focusedCell } : null);
    if (changes.hoveredRow     !== undefined) this._hoveredRow.set(changes.hoveredRow);
    if (changes.activeRow      !== undefined) this._activeRow.set(changes.activeRow);
    if (changes.selection      !== undefined) this._selection.set({ ...changes.selection });
    if (changes.sort           !== undefined) this._sort.set({ ...changes.sort });
    if (changes.filter         !== undefined) this._filter.set({ ...changes.filter });
    if (changes.pagination     !== undefined) this._pagination.set({ ...changes.pagination });
    if (changes.editing        !== undefined) this._editing.set({ ...changes.editing });
  }
}
