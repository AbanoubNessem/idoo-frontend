import { Injectable } from '@angular/core';
import {
  TableState,
  TableStateUpdate,
  TableStateValidationResult,
} from './table-state.types';
import { TABLE_STATE_VALID_DENSITIES } from './table-state.constants';

@Injectable({ providedIn: 'root' })
export class TableStateValidatorService {

  validate(state: TableState | TableStateUpdate): TableStateValidationResult {
    const errors:   string[] = [];
    const warnings: string[] = [];

    if ('tableId' in state) {
      if (!state.tableId || typeof state.tableId !== 'string') {
        errors.push('tableId is required and must be a non-empty string');
      }
    }

    if (state.density !== undefined) {
      if (!(TABLE_STATE_VALID_DENSITIES as readonly string[]).includes(state.density)) {
        errors.push(
          `Invalid density: "${state.density}". Must be one of: ${TABLE_STATE_VALID_DENSITIES.join(', ')}`
        );
      }
    }

    if (state.visibleColumns !== undefined) {
      if (!Array.isArray(state.visibleColumns)) {
        errors.push('visibleColumns must be an array of column id strings');
      } else if (state.visibleColumns.length === 0) {
        warnings.push('visibleColumns is empty — no columns will be displayed');
      }
    }

    if (state.expandedRows !== undefined && !Array.isArray(state.expandedRows)) {
      errors.push('expandedRows must be an array');
    }

    if (state.focusedCell !== undefined && state.focusedCell !== null) {
      if (!state.focusedCell.columnId || typeof state.focusedCell.columnId !== 'string') {
        errors.push('focusedCell.columnId is required and must be a non-empty string');
      }
      if (state.focusedCell.rowId === undefined) {
        errors.push('focusedCell.rowId is required');
      }
    }

    if (state.loading !== undefined && typeof state.loading !== 'boolean') {
      errors.push('loading must be a boolean');
    }

    if (state.error !== undefined && state.error !== null && typeof state.error !== 'string') {
      errors.push('error must be a string or null');
    }

    return Object.freeze({ valid: errors.length === 0, errors, warnings });
  }

  validateUpdate(update: TableStateUpdate): TableStateValidationResult {
    return this.validate(update);
  }
}
