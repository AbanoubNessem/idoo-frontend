import { TableSortConfig, TableFilterGroup, TablePaginationConfig } from './table-data.types';

export const TABLE_DATA_DEFAULT_PAGE_SIZE = 25;
export const TABLE_DATA_DEFAULT_PAGE      = 1;
export const TABLE_DATA_MAX_PAGE_SIZE     = 1000;
export const TABLE_DATA_MIN_PAGE_SIZE     = 1;

export const TABLE_DATA_DEFAULT_SORT_CONFIG: TableSortConfig = Object.freeze({
  fields:      [],
  multiColumn: false,
  stable:      true,
});

export const TABLE_DATA_DEFAULT_FILTER_GROUP: TableFilterGroup = Object.freeze({
  logic:      'and',
  conditions: [],
});

export const TABLE_DATA_DEFAULT_PAGINATION_CONFIG: TablePaginationConfig = Object.freeze({
  page:     TABLE_DATA_DEFAULT_PAGE,
  pageSize: TABLE_DATA_DEFAULT_PAGE_SIZE,
});

// Built-in comparator IDs
export const TABLE_COMPARATOR_TEXT       = 'text';
export const TABLE_COMPARATOR_NUMBER     = 'number';
export const TABLE_COMPARATOR_DATE       = 'date';
export const TABLE_COMPARATOR_BOOLEAN    = 'boolean';
export const TABLE_COMPARATOR_LOCALE     = 'locale-text';
