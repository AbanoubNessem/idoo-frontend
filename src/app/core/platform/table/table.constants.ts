import { TableDensity, TableRegistryLayer, TableRegistryLayer as Layer, TableSelectionMode } from './table.types';

// ─── Table Defaults ──────────────────────────────────────────────────────────

export const TABLE_DEFAULTS = {
  density:       'default'  as TableDensity,
  selectionMode: 'none'     as TableSelectionMode,
  version:       '1.0.0',
  layer:         'module'   as TableRegistryLayer,
} as const;

// ─── Column Defaults ─────────────────────────────────────────────────────────

export const TABLE_COLUMN_DEFAULTS = {
  visible:    true,
  sortable:   false,
  filterable: false,
  groupable:  false,
  searchable: false,
  hideable:   true,
  resizable:  false,
  editable:   false,
  exportable: true,
  printable:  true,
  required:   false,
  sticky:     false as const,
} as const;

// ─── Resolution Order ────────────────────────────────────────────────────────
// Lower index = lower priority; runtime wins over platform.

export const TABLE_RESOLUTION_ORDER: Layer[] = [
  'platform',
  'plugin',
  'module',
  'runtime',
];

// ─── Supported Column Types ──────────────────────────────────────────────────

export const TABLE_COLUMN_TYPES = [
  'text', 'number', 'currency', 'percentage', 'boolean',
  'date', 'datetime', 'time', 'badge', 'chip', 'status',
  'tag', 'avatar', 'image', 'icon', 'link', 'email',
  'phone', 'progress', 'rating', 'custom',
] as const;

// ─── Limits ──────────────────────────────────────────────────────────────────

export const TABLE_MAX_DIAG_EVENTS = 500;
export const TABLE_MAX_COLUMNS     = 200;
