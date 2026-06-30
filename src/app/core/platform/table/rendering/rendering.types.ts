import {
  TableActionPosition,
  TableActionVariant,
  TableCellClassFn,
  TableColumnType,
  TableDensity,
  TableStickyEdge,
  TableSummaryType,
} from '../table.types';

// ─── Render State ─────────────────────────────────────────────────────────────

export type TableRenderState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

// ─── Render Nodes ─────────────────────────────────────────────────────────────
// Nodes are immutable, serializable descriptions of what to render.
// They never duplicate metadata — they reference column IDs from Sprint 9.1 contracts.

export interface TableRenderNode {
  readonly type:      string;
  readonly id:        string;
  readonly visible:   boolean;
  readonly metadata?: Record<string, unknown>;
}

export interface TableHeaderCellNode extends TableRenderNode {
  readonly type:         'header-cell';
  readonly columnId:     string;
  readonly field:        string;
  readonly header:       string;
  readonly columnType:   TableColumnType;
  readonly width?:       number | string;
  readonly minWidth?:    number | string;
  readonly maxWidth?:    number | string;
  readonly sticky?:      TableStickyEdge | false;
  readonly sortable:     boolean;
  readonly filterable:   boolean;
  readonly resizable:    boolean;
  readonly hideable:     boolean;
  readonly required:     boolean;
  readonly headerClass?: string | string[];
  readonly order:        number;
}

export interface TableBodyCellNode extends TableRenderNode {
  readonly type:         'body-cell';
  readonly columnId:     string;
  readonly field:        string;
  readonly columnType:   TableColumnType;
  readonly renderer?:    string;
  readonly sticky?:      TableStickyEdge | false;
  readonly editable:     boolean;
  readonly permission?:  string | string[];
  readonly cellClass?:   string | string[] | TableCellClassFn;
  readonly width?:       number | string;
  readonly order:        number;
}

export interface TableSummaryCellNode extends TableRenderNode {
  readonly type:         'footer-cell';
  readonly columnId:     string;
  readonly field:        string;
  readonly summaryType?: TableSummaryType;
  readonly label?:       string;
  readonly footerClass?: string | string[];
}

export interface TableActionNode extends TableRenderNode {
  readonly type:        'action';
  readonly actionId:    string;
  readonly label:       string;
  readonly icon?:       string;
  readonly variant:     TableActionVariant;
  readonly position:    TableActionPosition;
  readonly handler?:    string;
  readonly permission?: string | string[];
  readonly order:       number;
}

export interface TableToolbarNode extends TableRenderNode {
  readonly type:               'toolbar';
  readonly showSearch:         boolean;
  readonly searchPlaceholder:  string;
  readonly showDensity:        boolean;
  readonly showColumnPicker:   boolean;
  readonly showExport:         boolean;
  readonly showPrint:          boolean;
  readonly showRefresh:        boolean;
  readonly toolbarActions:     TableActionNode[];
}

export interface TableLoadingNode extends TableRenderNode {
  readonly type:         'loading';
  readonly skeletonRows: number;
  readonly columnCount:  number;
}

export interface TableEmptyNode extends TableRenderNode {
  readonly type:    'empty';
  readonly message: string;
  readonly icon?:   string;
}

export interface TableErrorNode extends TableRenderNode {
  readonly type:     'error';
  readonly message:  string;
  readonly details?: string;
}

// ─── Render Plan ─────────────────────────────────────────────────────────────
// An immutable snapshot of everything needed to render one table.
// Components consume ONLY the plan — never raw TableDefinition.

export interface TableRenderPlan {
  readonly id:          string;
  readonly tableId:     string;
  readonly plannedAt:   string;
  readonly state:       TableRenderState;
  readonly density:     TableDensity;
  readonly toolbar?:    TableToolbarNode;
  readonly headerCells: TableHeaderCellNode[];
  readonly bodyCells:   TableBodyCellNode[];
  readonly footerCells: TableSummaryCellNode[];
  readonly loading:     TableLoadingNode;
  readonly empty:       TableEmptyNode;
  readonly error:       TableErrorNode;
  readonly hasToolbar:  boolean;
  readonly hasFooter:   boolean;
  readonly columnCount: number;
  readonly metadata:    Record<string, unknown>;
}

// ─── Cell Value ───────────────────────────────────────────────────────────────

export interface TableCellValue {
  readonly raw:       unknown;
  readonly formatted: string;
  readonly isEmpty:   boolean;
}

// ─── Renderer Configs ────────────────────────────────────────────────────────

export interface TableLoadingConfig {
  readonly skeletonRows: number;
}

export interface TableEmptyConfig {
  readonly message: string;
  readonly icon?:   string;
}

export interface TableErrorConfig {
  readonly message:  string;
  readonly details?: string;
}
