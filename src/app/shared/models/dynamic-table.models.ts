export type ColumnType = 'text' | 'date' | 'datetime' | 'badge' | 'boolean' | 'avatar' | 'actions' | 'link' | 'number' | 'currency';

export interface TableColumnDef<T> {
  id: string;
  accessor?: keyof T;
  header: string;
  type?: ColumnType;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  valueMapper?: (row: T) => string;
  badgeConfig?: Record<string, { label: string; color: string }>;
  sticky?: 'start' | 'end';
}

export interface TableActionDef<T> {
  key: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'warn' | 'accent';
  permission?: string;
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
  handler: (row: T) => void;
}

export interface TableFilterDef {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange' | 'boolean';
  options?: { label: string; value: unknown }[];
  defaultValue?: unknown;
}

export interface TableConfig<T> {
  columns: TableColumnDef<T>[];
  actions?: TableActionDef<T>[];
  filters?: TableFilterDef[];
  pageSize?: number;
  pageSizeOptions?: number[];
  selectable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  trackByKey?: keyof T;
  createPermission?: string;
  createLabel?: string;
  onCreateClick?: () => void;
}
