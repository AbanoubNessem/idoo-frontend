import { Injectable, inject } from '@angular/core';
import { TableCellEditorRegistry } from './table-cell-editor-registry.service';
import { TableEditorResolution, TableEditorType } from './table-interaction.types';

@Injectable({ providedIn: 'root' })
export class TableEditorResolver {
  private readonly _registry = inject(TableCellEditorRegistry);

  resolve(columnType: string, overrideEditorType?: TableEditorType): TableEditorResolution {
    const editorType = overrideEditorType ?? this._registry.resolveEditorTypeForColumn(columnType);
    const definition = this._registry.getEditor(editorType);

    if (!definition) {
      const textDef = this._registry.getEditor('text');
      return Object.freeze({ editorType: 'text', definition: textDef, fallback: true });
    }

    return Object.freeze({ editorType, definition, fallback: false });
  }

  resolveByType(editorType: TableEditorType): TableEditorResolution {
    const definition = this._registry.getEditor(editorType);
    return Object.freeze({ editorType, definition, fallback: !definition });
  }

  supports(columnType: string): boolean {
    const editorType = this._registry.resolveEditorTypeForColumn(columnType);
    return this._registry.hasEditor(editorType);
  }
}
