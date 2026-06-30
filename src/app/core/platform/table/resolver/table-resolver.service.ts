import { inject, Injectable } from '@angular/core';
import { TABLE_COLUMN_DEFAULTS, TABLE_DEFAULTS } from '../table.constants';
import { TableMetadataRegistryService } from '../registry/table-metadata-registry.service';
import { TableRegistryService } from '../registry/table-registry.service';
import {
  ResolvedTableColumn,
  ResolvedTableDefinition,
  TableColumnDefinition,
  TableDefinition,
  TableRegistryLayer,
} from '../table.types';

// ─── TableResolverService ─────────────────────────────────────────────────────
// Produces a fully merged ResolvedTableDefinition from the registry,
// applying layer overrides in priority order: platform → plugin → module → runtime.

@Injectable({ providedIn: 'root' })
export class TableResolverService {
  private readonly registry         = inject(TableRegistryService);
  private readonly metadataRegistry = inject(TableMetadataRegistryService);

  async resolve(tableId: string): Promise<ResolvedTableDefinition | null> {
    const start  = performance.now();
    const base   = await this.registry.resolve(tableId);
    if (!base) return null;

    const merged = this.metadataRegistry.mergeInto(base);
    return this._buildResolved(merged, this._detectLayer(tableId), start);
  }

  resolveSync(definition: TableDefinition): ResolvedTableDefinition {
    const start  = performance.now();
    const merged = this.metadataRegistry.mergeInto(definition);
    return this._buildResolved(merged, this._detectLayer(definition.id), start);
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private _buildResolved(
    definition: TableDefinition,
    layer: TableRegistryLayer,
    startMs: number,
  ): ResolvedTableDefinition {
    const columns      = this._resolveColumns(definition.columns);
    const visibleCols  = columns.filter(c => c.effectiveVisible);
    const columnIndex  = new Map<string, ResolvedTableColumn>(
      columns.map(c => [c.id, c]),
    );

    return {
      definition,
      columns,
      visibleColumns: visibleCols,
      columnIndex,
      resolvedAt:    new Date().toISOString(),
      resolvedLayer: layer,
    };
  }

  private _resolveColumns(defs: TableColumnDefinition[]): ResolvedTableColumn[] {
    return defs.map((col, index) => {
      const effectiveVisible  = col.visible  ?? TABLE_COLUMN_DEFAULTS.visible;
      const effectiveEditable = col.editable ?? TABLE_COLUMN_DEFAULTS.editable;

      return {
        ...col,
        order:           col.order ?? index,
        sortable:        col.sortable   ?? TABLE_COLUMN_DEFAULTS.sortable,
        filterable:      col.filterable ?? TABLE_COLUMN_DEFAULTS.filterable,
        groupable:       col.groupable  ?? TABLE_COLUMN_DEFAULTS.groupable,
        searchable:      col.searchable ?? TABLE_COLUMN_DEFAULTS.searchable,
        hideable:        col.hideable   ?? TABLE_COLUMN_DEFAULTS.hideable,
        resizable:       col.resizable  ?? TABLE_COLUMN_DEFAULTS.resizable,
        exportable:      col.exportable ?? TABLE_COLUMN_DEFAULTS.exportable,
        printable:       col.printable  ?? TABLE_COLUMN_DEFAULTS.printable,
        required:        col.required   ?? TABLE_COLUMN_DEFAULTS.required,
        effectiveVisible,
        effectiveEditable,
      };
    });
  }

  private _detectLayer(tableId: string): TableRegistryLayer {
    return this.registry.get(tableId)?.layer ?? TABLE_DEFAULTS.layer;
  }
}
