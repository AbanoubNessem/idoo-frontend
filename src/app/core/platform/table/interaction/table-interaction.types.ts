import type { TableSelectionMode } from '../table.types';

// ─── Editor Types ─────────────────────────────────────────────────────────────

export type TableEditorType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'textarea'
  | 'custom';

export type TableEditMode = 'cell' | 'row' | 'none';

// ─── Cell Reference ───────────────────────────────────────────────────────────

export interface TableCellRef {
  readonly rowId:    string;
  readonly columnId: string;
}

// ─── Selection ────────────────────────────────────────────────────────────────

export interface TableSelectionSnapshot {
  readonly mode:         TableSelectionMode;
  readonly selectedIds:  readonly string[];
  readonly currentRowId: string | null;
  readonly currentCell:  TableCellRef | null;
  readonly anchorRowId:  string | null;
}

export type TableSelectionActionType =
  | 'select'
  | 'deselect'
  | 'toggle'
  | 'range'
  | 'selectAll'
  | 'clear';

export interface TableSelectionAction {
  readonly type:    TableSelectionActionType;
  readonly rowId?:  string;
  readonly allIds?: readonly string[];
}

// ─── Editing ──────────────────────────────────────────────────────────────────

export interface TableEditContext {
  readonly rowId:        string;
  readonly columnId:     string;
  readonly currentValue: unknown;
  readonly row:          Readonly<Record<string, unknown>>;
}

export interface TableEditValidationResult {
  readonly valid:  boolean;
  readonly error:  string | null;
}

export type TableValidatorFn = (
  value:   unknown,
  context: TableEditContext,
) => TableEditValidationResult;

export interface TableEditCommit {
  readonly tableId:       string;
  readonly rowId:         string;
  readonly columnId:      string;
  readonly value:         unknown;
  readonly previousValue: unknown;
}

export interface TableEditingSnapshot {
  readonly mode:         TableEditMode;
  readonly editingCell:  TableCellRef | null;
  readonly editingRowId: string | null;
  readonly isDirty:      boolean;
  readonly isValid:      boolean;
}

// ─── Editor Registry ──────────────────────────────────────────────────────────

export interface TableEditorDefinition {
  readonly type:         TableEditorType;
  readonly displayName:  string;
  readonly supportsNull: boolean;
  readonly config?:      Readonly<Record<string, unknown>>;
}

export interface TableColumnEditorMapping {
  readonly columnType: string;
  readonly editorType: TableEditorType;
}

export interface TableEditorResolution {
  readonly editorType: TableEditorType;
  readonly definition: TableEditorDefinition | null;
  readonly fallback:   boolean;
}

// ─── Editability Check ────────────────────────────────────────────────────────

export interface TableEditabilityCheck {
  readonly columnId:    string;
  readonly columnType:  string;
  readonly readOnly?:   boolean;
  readonly editMode?:   TableEditMode;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type TableInteractionEventType =
  | 'SelectionChanged'
  | 'RowSelected'
  | 'RowDeselected'
  | 'AllSelected'
  | 'SelectionCleared'
  | 'CurrentRowChanged'
  | 'CurrentCellChanged'
  | 'EditStarted'
  | 'EditCommitted'
  | 'EditCancelled'
  | 'EditValidationFailed';

export interface TableInteractionEvent {
  readonly type:      TableInteractionEventType;
  readonly tableId:   string;
  readonly timestamp: string;
  readonly payload?:  unknown;
}

export type TableInteractionEventHandler = (event: TableInteractionEvent) => void;
