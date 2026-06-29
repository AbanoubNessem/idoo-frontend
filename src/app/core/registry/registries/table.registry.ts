import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface ColumnDef {
  id: string;
  header: string;
  accessor?: string;
  type: string;
  sortable?: boolean;
  filterable?: boolean;
  sticky?: 'start' | 'end';
  width?: string;
  badgeConfig?: Record<string, { label: string; color: string }>;
  [key: string]: unknown;
}

export interface TableDef {
  columns: ColumnDef[];
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  pageSize?: number;
  selectable?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  rowClickBehavior?: string;
}

@Injectable({ providedIn: 'root' })
export class TableRegistryService extends BaseRegistry<TableDef> {
  readonly name = 'table';
  readonly mergeStrategy: MergeStrategy = 'ADDITIVE';

  protected override validate(id: string, def: TableDef): string[] {
    const errors: string[] = [];
    if (!def.columns || def.columns.length === 0) {
      errors.push(`${id}: table must have at least one column`);
    }
    return errors;
  }
}
