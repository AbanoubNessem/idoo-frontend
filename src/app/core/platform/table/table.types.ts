// ─── Column Types ────────────────────────────────────────────────────────────

export type TableColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'badge'
  | 'chip'
  | 'status'
  | 'tag'
  | 'avatar'
  | 'image'
  | 'icon'
  | 'link'
  | 'email'
  | 'phone'
  | 'progress'
  | 'rating'
  | 'custom';

// ─── Table Primitives ────────────────────────────────────────────────────────

export type TableSelectionMode  = 'none' | 'single' | 'multiple';
export type TableDensity        = 'compact' | 'default' | 'comfortable';
export type TableStickyEdge     = 'start' | 'end';
export type TableFilterType     = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'range';
export type TableSummaryType    = 'sum' | 'average' | 'count' | 'min' | 'max' | 'custom';
export type TableActionPosition = 'toolbar' | 'row' | 'bulk';
export type TableActionVariant  = 'primary' | 'secondary' | 'danger' | 'ghost';
export type TableBreakpoint     = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TableRegistryLayer  = 'platform' | 'plugin' | 'module' | 'runtime';

// ─── Formatter / Renderer ────────────────────────────────────────────────────

export type TableFormatter<T = unknown> = (value: T, row: Record<string, unknown>) => string;
export type TableCellClassFn            = (value: unknown, row: Record<string, unknown>) => string | string[];

// ─── Column Definition ───────────────────────────────────────────────────────

export interface TableColumnDefinition {
  readonly id:           string;
  readonly field:        string;
  readonly header:       string;
  readonly type:         TableColumnType;
  readonly width?:       number | string;
  readonly minWidth?:    number | string;
  readonly maxWidth?:    number | string;
  readonly sortable?:    boolean;
  readonly filterable?:  boolean;
  readonly groupable?:   boolean;
  readonly searchable?:  boolean;
  readonly hideable?:    boolean;
  readonly resizable?:   boolean;
  readonly sticky?:      TableStickyEdge | false;
  readonly visible?:     boolean;
  readonly required?:    boolean;
  readonly editable?:    boolean;
  readonly exportable?:  boolean;
  readonly printable?:   boolean;
  readonly permission?:  string | string[];
  readonly formatter?:   TableFormatter;
  readonly renderer?:    string;
  readonly cellClass?:   string | string[] | TableCellClassFn;
  readonly headerClass?: string | string[];
  readonly footerClass?: string | string[];
  readonly order?:       number;
  readonly metadata?:    Record<string, unknown>;
}

// ─── Action Definition ───────────────────────────────────────────────────────

export interface TableActionContext {
  readonly row?:      Record<string, unknown>;
  readonly selected?: Record<string, unknown>[];
}

export interface TableActionDefinition {
  readonly id:          string;
  readonly label:       string;
  readonly icon?:       string;
  readonly type:        TableActionVariant;
  readonly position:    TableActionPosition;
  readonly permission?: string | string[];
  readonly disabled?:   boolean | ((ctx: TableActionContext) => boolean);
  readonly visible?:    boolean | ((ctx: TableActionContext) => boolean);
  readonly handler?:    string;
  readonly order?:      number;
  readonly metadata?:   Record<string, unknown>;
}

// ─── Toolbar Definition ──────────────────────────────────────────────────────

export interface TableToolbarDefinition {
  readonly search?:            boolean;
  readonly searchPlaceholder?: string;
  readonly density?:           boolean;
  readonly columnVisibility?:  boolean;
  readonly export?:            boolean;
  readonly print?:             boolean;
  readonly refresh?:           boolean;
  readonly actions?:           TableActionDefinition[];
}

// ─── Filter Definition ───────────────────────────────────────────────────────

export interface TableFilterOption {
  readonly label: string;
  readonly value: unknown;
}

export interface TableFilterDefinition {
  readonly id:            string;
  readonly field:         string;
  readonly label:         string;
  readonly type:          TableFilterType;
  readonly options?:      TableFilterOption[];
  readonly defaultValue?: unknown;
  readonly metadata?:     Record<string, unknown>;
}

// ─── Group Definition ────────────────────────────────────────────────────────

export interface TableGroupDefinition {
  readonly field:      string;
  readonly label?:     string;
  readonly collapsed?: boolean;
  readonly showCount?: boolean;
}

// ─── Summary Definition ──────────────────────────────────────────────────────

export interface TableSummaryDefinition {
  readonly field:      string;
  readonly type:       TableSummaryType;
  readonly label?:     string;
  readonly formatter?: TableFormatter;
  readonly customFn?:  string;
}

// ─── Permission Definition ───────────────────────────────────────────────────

export interface TablePermissionDefinition {
  readonly view?:   string | string[];
  readonly create?: string | string[];
  readonly edit?:   string | string[];
  readonly delete?: string | string[];
  readonly export?: string | string[];
  readonly print?:  string | string[];
  readonly bulk?:   string | string[];
}

// ─── Responsive Rules ────────────────────────────────────────────────────────

export interface TableResponsiveRule {
  readonly breakpoint:     TableBreakpoint;
  readonly hiddenColumns?: string[];
  readonly density?:       TableDensity;
  readonly stackColumns?:  boolean;
}

// ─── Table Definition ────────────────────────────────────────────────────────

export interface TableDefinition {
  readonly id:               string;
  readonly name:             string;
  readonly description?:     string;
  readonly version?:         string;
  readonly columns:          TableColumnDefinition[];
  readonly toolbar?:         TableToolbarDefinition;
  readonly actions?:         TableActionDefinition[];
  readonly filters?:         TableFilterDefinition[];
  readonly groups?:          TableGroupDefinition[];
  readonly summaries?:       TableSummaryDefinition[];
  readonly permissions?:     TablePermissionDefinition;
  readonly selectionMode?:   TableSelectionMode;
  readonly density?:         TableDensity;
  readonly responsiveRules?: TableResponsiveRule[];
  readonly metadata?:        Record<string, unknown>;
}

// ─── Registry Entry ──────────────────────────────────────────────────────────

export interface TableRegistryEntry {
  readonly id:           string;
  readonly definition:   TableDefinition;
  readonly layer:        TableRegistryLayer;
  readonly registeredAt: string;
  readonly tags:         string[];
  readonly factory?:     () => Promise<TableDefinition>;
}

export interface TableRegistrationOptions {
  readonly overwrite?: boolean;
  readonly layer?:     TableRegistryLayer;
  readonly tags?:      string[];
  readonly factory?:   () => Promise<TableDefinition>;
}

// ─── Layer Override ───────────────────────────────────────────────────────────

export interface TableLayerOverride {
  readonly tableId:     string;
  readonly layer:       TableRegistryLayer;
  readonly patch:       Partial<Omit<TableDefinition, 'id' | 'name'>>;
  readonly appliedAt:   string;
}

// ─── Resolution ──────────────────────────────────────────────────────────────

export interface ResolvedTableColumn extends TableColumnDefinition {
  readonly effectiveVisible:  boolean;
  readonly effectiveEditable: boolean;
}

export interface ResolvedTableDefinition {
  readonly definition:     TableDefinition;
  readonly columns:        ResolvedTableColumn[];
  readonly visibleColumns: ResolvedTableColumn[];
  readonly columnIndex:    ReadonlyMap<string, ResolvedTableColumn>;
  readonly resolvedAt:     string;
  readonly resolvedLayer:  TableRegistryLayer;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface TableValidationError {
  readonly field:   string;
  readonly message: string;
  readonly code:    string;
}

export interface TableValidationResult {
  readonly valid:    boolean;
  readonly errors:   TableValidationError[];
  readonly warnings: TableValidationError[];
}

// ─── Serialization ──────────────────────────────────────────────────────────

export interface TableSerializationOptions {
  readonly includeHidden?:      boolean;
  readonly includePermissions?: boolean;
  readonly omitColumns?:        string[];
  readonly pretty?:             boolean;
}

export interface TableDeserializationOptions {
  readonly strict?: boolean;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type TableEventType =
  | 'TableRegistered'
  | 'TableResolved'
  | 'TableRemoved'
  | 'TableMetadataChanged';

export interface TableEvent<T = unknown> {
  readonly type:      TableEventType;
  readonly tableId:   string;
  readonly timestamp: string;
  readonly layer?:    TableRegistryLayer;
  readonly payload?:  T;
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

export type TableDiagEventType =
  | 'register'
  | 'resolve'
  | 'remove'
  | 'validate'
  | 'serialize'
  | 'error'
  | 'lifecycle';

export interface TableDiagEvent {
  readonly id:          string;
  readonly type:        TableDiagEventType;
  readonly tableId:     string;
  readonly message:     string;
  readonly durationMs?: number;
  readonly timestamp:   string;
  readonly metadata?:   Record<string, unknown>;
}

export interface TableDiagnosticsReport {
  readonly tableId:     string;
  readonly generatedAt: string;
  readonly totalEvents: number;
  readonly errorCount:  number;
  readonly events:      TableDiagEvent[];
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface TableMetricsSnapshot {
  readonly tableId:              string;
  readonly registrationCount:    number;
  readonly resolveCount:         number;
  readonly avgResolveDurationMs: number;
  readonly errorCount:           number;
  readonly lastActivityAt:       string;
}
