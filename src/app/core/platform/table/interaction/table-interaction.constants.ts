import { TableColumnEditorMapping, TableEditorDefinition } from './table-interaction.types';

export const TABLE_DEFAULT_SELECTION_MODE = 'multi' as const;
export const TABLE_DEFAULT_EDIT_MODE      = 'cell'  as const;

export const TABLE_BUILT_IN_EDITORS: readonly TableEditorDefinition[] = Object.freeze([
  Object.freeze({ type: 'text'        as const, displayName: 'Text',        supportsNull: true  }),
  Object.freeze({ type: 'number'      as const, displayName: 'Number',      supportsNull: true  }),
  Object.freeze({ type: 'boolean'     as const, displayName: 'Boolean',     supportsNull: false }),
  Object.freeze({ type: 'date'        as const, displayName: 'Date',        supportsNull: true  }),
  Object.freeze({ type: 'datetime'    as const, displayName: 'DateTime',    supportsNull: true  }),
  Object.freeze({ type: 'time'        as const, displayName: 'Time',        supportsNull: true  }),
  Object.freeze({ type: 'select'      as const, displayName: 'Select',      supportsNull: true  }),
  Object.freeze({ type: 'multiselect' as const, displayName: 'MultiSelect', supportsNull: true  }),
  Object.freeze({ type: 'checkbox'    as const, displayName: 'Checkbox',    supportsNull: false }),
  Object.freeze({ type: 'textarea'    as const, displayName: 'Textarea',    supportsNull: true  }),
  Object.freeze({ type: 'custom'      as const, displayName: 'Custom',      supportsNull: true  }),
]);

export const TABLE_COLUMN_TYPE_EDITOR_MAP: readonly TableColumnEditorMapping[] = Object.freeze([
  Object.freeze({ columnType: 'text',      editorType: 'text'        as const }),
  Object.freeze({ columnType: 'string',    editorType: 'text'        as const }),
  Object.freeze({ columnType: 'number',    editorType: 'number'      as const }),
  Object.freeze({ columnType: 'integer',   editorType: 'number'      as const }),
  Object.freeze({ columnType: 'decimal',   editorType: 'number'      as const }),
  Object.freeze({ columnType: 'boolean',   editorType: 'boolean'     as const }),
  Object.freeze({ columnType: 'date',      editorType: 'date'        as const }),
  Object.freeze({ columnType: 'datetime',  editorType: 'datetime'    as const }),
  Object.freeze({ columnType: 'time',      editorType: 'time'        as const }),
  Object.freeze({ columnType: 'select',    editorType: 'select'      as const }),
  Object.freeze({ columnType: 'enum',      editorType: 'select'      as const }),
  Object.freeze({ columnType: 'textarea',  editorType: 'textarea'    as const }),
]);
