import { computed, Signal } from '@angular/core';
import { TableDensity } from '../table.types';
import { TableFocusedCell } from './table-state.types';
import { TableStateStore } from './table-state-store';

/** Read-only signal surface exposed by TableStateContext.asReadonly(). */
export interface TableStateReadonly {
  readonly loading:        Signal<boolean>;
  readonly error:          Signal<string | null>;
  readonly density:        Signal<TableDensity>;
  readonly visibleColumns: Signal<string[]>;
  readonly expandedRows:   Signal<unknown[]>;
  readonly focusedCell:    Signal<TableFocusedCell | null>;
  readonly hoveredRow:     Signal<unknown | null>;
  readonly activeRow:      Signal<unknown | null>;
  readonly isLoading:      Signal<boolean>;
  readonly hasError:       Signal<boolean>;
  isColumnVisible(columnId: string): Signal<boolean>;
  isRowExpanded(rowId: unknown): Signal<boolean>;
}

/**
 * Per-instance context wrapper around a TableStateStore.
 * Exposes computed helpers alongside raw signal accessors.
 * Created via TableStateEngine.createContext() — not @Injectable.
 */
export class TableStateContext {
  private readonly _store:    TableStateStore;
  private readonly _readonly: TableStateReadonly;

  constructor(store: TableStateStore) {
    this._store = store;
    this._readonly = {
      loading:        store.loading,
      error:          store.error,
      density:        store.density,
      visibleColumns: store.visibleColumns,
      expandedRows:   store.expandedRows,
      focusedCell:    store.focusedCell,
      hoveredRow:     store.hoveredRow,
      activeRow:      store.activeRow,
      isLoading:      computed(() => store.loading()),
      hasError:       computed(() => store.error() !== null),
      isColumnVisible: (columnId: string) =>
        computed(() => store.visibleColumns().includes(columnId)),
      isRowExpanded: (rowId: unknown) =>
        computed(() => store.expandedRows().some(id => id === rowId)),
    };
  }

  get tableId(): string { return this._store.tableId; }

  /** Read-only signal surface — safe to pass to components. */
  asReadonly(): TableStateReadonly { return this._readonly; }

  /** Direct store access — use only within the engine layer. */
  get store(): TableStateStore { return this._store; }
}
