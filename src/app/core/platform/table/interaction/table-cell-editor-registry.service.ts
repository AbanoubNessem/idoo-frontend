import { Injectable, Signal, computed, signal } from '@angular/core';
import { TABLE_BUILT_IN_EDITORS, TABLE_COLUMN_TYPE_EDITOR_MAP } from './table-interaction.constants';
import {
  TableColumnEditorMapping,
  TableEditorDefinition,
  TableEditorType,
} from './table-interaction.types';

@Injectable({ providedIn: 'root' })
export class TableCellEditorRegistry {
  private readonly _editors = new Map<TableEditorType, TableEditorDefinition>(
    TABLE_BUILT_IN_EDITORS.map(e => [e.type, e]),
  );
  private readonly _columnMappings = new Map<string, TableEditorType>(
    TABLE_COLUMN_TYPE_EDITOR_MAP.map(m => [m.columnType, m.editorType]),
  );
  private readonly _version = signal(0);

  readonly registeredCount: Signal<number> = computed(() => {
    this._version();
    return this._editors.size;
  });

  registerEditor(definition: TableEditorDefinition): void {
    this._editors.set(definition.type, Object.freeze({ ...definition }));
    this._version.update(v => v + 1);
  }

  getEditor(type: TableEditorType): TableEditorDefinition | null {
    return this._editors.get(type) ?? null;
  }

  hasEditor(type: TableEditorType): boolean {
    return this._editors.has(type);
  }

  removeEditor(type: TableEditorType): boolean {
    const removed = this._editors.delete(type);
    if (removed) this._version.update(v => v + 1);
    return removed;
  }

  mapColumnType(columnType: string, editorType: TableEditorType): void {
    this._columnMappings.set(columnType, editorType);
    this._version.update(v => v + 1);
  }

  resolveEditorTypeForColumn(columnType: string): TableEditorType {
    return this._columnMappings.get(columnType) ?? 'text';
  }

  listEditors(): readonly TableEditorDefinition[] {
    return [...this._editors.values()];
  }

  listMappings(): readonly TableColumnEditorMapping[] {
    return [...this._columnMappings.entries()].map(([columnType, editorType]) =>
      Object.freeze({ columnType, editorType }),
    );
  }
}
