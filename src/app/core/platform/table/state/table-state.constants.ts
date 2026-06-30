import {
  TableState,
  TableSortState,
  TableFilterState,
  TablePaginationState,
  TableSelectionState,
  TableEditingState,
} from './table-state.types';
import { TableDensity } from '../table.types';

export const TABLE_STATE_EMPTY_SORT: TableSortState           = Object.freeze({ active: false });
export const TABLE_STATE_EMPTY_FILTER: TableFilterState       = Object.freeze({ active: false });
export const TABLE_STATE_EMPTY_PAGINATION: TablePaginationState = Object.freeze({ active: false });
export const TABLE_STATE_EMPTY_SELECTION: TableSelectionState = Object.freeze({ active: false, mode: 'none' });
export const TABLE_STATE_EMPTY_EDITING: TableEditingState     = Object.freeze({ active: false });

export const TABLE_STATE_DEFAULTS: Omit<TableState, 'tableId'> = Object.freeze({
  loading:        false,
  error:          null,
  density:        'default' as TableDensity,
  visibleColumns: [],
  expandedRows:   [],
  focusedCell:    null,
  hoveredRow:     null,
  activeRow:      null,
  selection:      TABLE_STATE_EMPTY_SELECTION,
  sort:           TABLE_STATE_EMPTY_SORT,
  filter:         TABLE_STATE_EMPTY_FILTER,
  pagination:     TABLE_STATE_EMPTY_PAGINATION,
  editing:        TABLE_STATE_EMPTY_EDITING,
});

export const TABLE_STATE_VALID_DENSITIES: ReadonlyArray<TableDensity> = [
  'compact', 'default', 'comfortable',
] as const;

export const TABLE_STATE_MAX_HISTORY_DEPTH = 50;
