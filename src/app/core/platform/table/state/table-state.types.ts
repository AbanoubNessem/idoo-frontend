import { TableDensity, TableSelectionMode } from '../table.types';

// ─── Placeholder State Structures ────────────────────────────────────────────
// Defined architecturally now; populated in future sprints.

export interface TableSortState {
  readonly active: boolean;
  // Sprint 9.X: column, direction, multiSort[]
}

export interface TableFilterState {
  readonly active: boolean;
  // Sprint 9.X: filters[]
}

export interface TablePaginationState {
  readonly active: boolean;
  // Sprint 9.X: page, pageSize, total
}

export interface TableSelectionState {
  readonly active: boolean;
  readonly mode:   TableSelectionMode;
  // Sprint 9.X: selectedIds[]
}

export interface TableEditingState {
  readonly active: boolean;
  // Sprint 9.X: editingRowId, dirtyFields
}

export interface TableFocusedCell {
  readonly rowId:    unknown;
  readonly columnId: string;
}

// ─── Core State ──────────────────────────────────────────────────────────────

export interface TableState {
  readonly tableId:        string;
  readonly loading:        boolean;
  readonly error:          string | null;
  readonly density:        TableDensity;
  readonly visibleColumns: string[];
  readonly expandedRows:   unknown[];
  readonly focusedCell:    TableFocusedCell | null;
  readonly hoveredRow:     unknown | null;
  readonly activeRow:      unknown | null;
  readonly selection:      TableSelectionState;
  readonly sort:           TableSortState;
  readonly filter:         TableFilterState;
  readonly pagination:     TablePaginationState;
  readonly editing:        TableEditingState;
}

// Partial update — only the fields being changed
export type TableStateUpdate = Partial<Omit<TableState, 'tableId'>>;

// ─── Snapshot ────────────────────────────────────────────────────────────────

export interface TableStateSnapshot {
  readonly id:         string;
  readonly tableId:    string;
  readonly capturedAt: string;
  readonly state:      Readonly<TableState>;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type TableStateEventType =
  | 'StateInitialized'
  | 'StateChanged'
  | 'StateReset'
  | 'StateDisposed';

export interface TableStateEvent {
  readonly type:      TableStateEventType;
  readonly tableId:   string;
  readonly snapshot:  TableStateSnapshot;
  readonly timestamp: string;
}

export type TableStateEventHandler = (event: TableStateEvent) => void;

// ─── Validation ──────────────────────────────────────────────────────────────

export interface TableStateValidationResult {
  readonly valid:    boolean;
  readonly errors:   string[];
  readonly warnings: string[];
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface TableStateMetricsSnapshot {
  readonly tableId:       string;
  readonly updateCount:   number;
  readonly snapshotCount: number;
  readonly restoreCount:  number;
  readonly resetCount:    number;
  readonly disposeCount:  number;
  readonly lastUpdatedAt: string | null;
}

// ─── History (architecture only) ─────────────────────────────────────────────

export interface TableStateHistoryOptions {
  readonly maxDepth: number;
}

// ─── Initial State ───────────────────────────────────────────────────────────

export type TableStateInitializer = Partial<Omit<TableState, 'tableId'>>;
