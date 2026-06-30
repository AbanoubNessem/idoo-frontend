import { Injectable } from '@angular/core';
import { TABLE_COLUMN_TYPES, TABLE_MAX_COLUMNS } from '../table.constants';
import {
  TableColumnDefinition,
  TableDefinition,
  TableValidationError,
  TableValidationResult,
} from '../table.types';

@Injectable({ providedIn: 'root' })
export class TableValidatorService {

  validate(definition: TableDefinition): TableValidationResult {
    const errors:   TableValidationError[] = [];
    const warnings: TableValidationError[] = [];

    this._validateRoot(definition, errors, warnings);
    this._validateColumns(definition.columns, errors, warnings);

    return { valid: errors.length === 0, errors, warnings };
  }

  validateColumn(column: TableColumnDefinition): TableValidationResult {
    const errors:   TableValidationError[] = [];
    const warnings: TableValidationError[] = [];
    this._validateSingleColumn(column, errors, warnings);
    return { valid: errors.length === 0, errors, warnings };
  }

  // ─── Root ────────────────────────────────────────────────────────────────

  private _validateRoot(
    def: TableDefinition,
    errors: TableValidationError[],
    warnings: TableValidationError[],
  ): void {
    if (!def.id || def.id.trim() === '') {
      errors.push({ field: 'id', message: 'Table id is required.', code: 'REQUIRED' });
    }

    if (!def.name || def.name.trim() === '') {
      errors.push({ field: 'name', message: 'Table name is required.', code: 'REQUIRED' });
    }

    if (!Array.isArray(def.columns) || def.columns.length === 0) {
      errors.push({ field: 'columns', message: 'At least one column is required.', code: 'MIN_ITEMS' });
    }

    if (Array.isArray(def.columns) && def.columns.length > TABLE_MAX_COLUMNS) {
      errors.push({
        field:   'columns',
        message: `Column count (${def.columns.length}) exceeds maximum of ${TABLE_MAX_COLUMNS}.`,
        code:    'MAX_ITEMS',
      });
    }

    if (def.selectionMode && !['none', 'single', 'multiple'].includes(def.selectionMode)) {
      errors.push({ field: 'selectionMode', message: `Invalid selectionMode: "${def.selectionMode}".`, code: 'INVALID_VALUE' });
    }

    if (def.density && !['compact', 'default', 'comfortable'].includes(def.density)) {
      errors.push({ field: 'density', message: `Invalid density: "${def.density}".`, code: 'INVALID_VALUE' });
    }

    if (!def.version) {
      warnings.push({ field: 'version', message: 'Table version is not specified.', code: 'MISSING_OPTIONAL' });
    }
  }

  // ─── Columns ─────────────────────────────────────────────────────────────

  private _validateColumns(
    columns: TableColumnDefinition[] | undefined,
    errors: TableValidationError[],
    warnings: TableValidationError[],
  ): void {
    if (!columns) return;

    const ids   = new Set<string>();
    const fields = new Set<string>();

    for (const col of columns) {
      this._validateSingleColumn(col, errors, warnings);

      if (col.id) {
        if (ids.has(col.id)) {
          errors.push({ field: `columns[${col.id}].id`, message: `Duplicate column id: "${col.id}".`, code: 'DUPLICATE_ID' });
        }
        ids.add(col.id);
      }

      if (col.field) {
        if (fields.has(col.field)) {
          warnings.push({ field: `columns[${col.id}].field`, message: `Duplicate column field: "${col.field}".`, code: 'DUPLICATE_FIELD' });
        }
        fields.add(col.field);
      }
    }
  }

  private _validateSingleColumn(
    col: TableColumnDefinition,
    errors: TableValidationError[],
    warnings: TableValidationError[],
  ): void {
    const prefix = `column[${col.id ?? '?'}]`;

    if (!col.id || col.id.trim() === '') {
      errors.push({ field: `${prefix}.id`, message: 'Column id is required.', code: 'REQUIRED' });
    }

    if (!col.field || col.field.trim() === '') {
      errors.push({ field: `${prefix}.field`, message: 'Column field is required.', code: 'REQUIRED' });
    }

    if (!col.header || col.header.trim() === '') {
      errors.push({ field: `${prefix}.header`, message: 'Column header is required.', code: 'REQUIRED' });
    }

    if (!col.type) {
      errors.push({ field: `${prefix}.type`, message: 'Column type is required.', code: 'REQUIRED' });
    } else if (!(TABLE_COLUMN_TYPES as readonly string[]).includes(col.type)) {
      errors.push({ field: `${prefix}.type`, message: `Unknown column type: "${col.type}".`, code: 'INVALID_VALUE' });
    }

    if (col.type === 'custom' && !col.renderer) {
      warnings.push({ field: `${prefix}.renderer`, message: 'Custom column type should specify a renderer id.', code: 'MISSING_OPTIONAL' });
    }
  }
}
