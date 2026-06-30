import { Injectable } from '@angular/core';
import {
  TableDefinition,
  TableDeserializationOptions,
  TableSerializationOptions,
} from '../table.types';

@Injectable({ providedIn: 'root' })
export class TableSerializerService {

  serialize(definition: TableDefinition, options: TableSerializationOptions = {}): string {
    const prepared = this._prepare(definition, options);
    return options.pretty
      ? JSON.stringify(prepared, null, 2)
      : JSON.stringify(prepared);
  }

  deserialize(json: string, options: TableDeserializationOptions = {}): TableDefinition {
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch {
      throw new Error('[TableSerializer] Invalid JSON string provided for deserialization.');
    }

    return this._validate(raw, options);
  }

  toObject(definition: TableDefinition, options: TableSerializationOptions = {}): Record<string, unknown> {
    return this._prepare(definition, options) as Record<string, unknown>;
  }

  fromObject(raw: unknown, options: TableDeserializationOptions = {}): TableDefinition {
    return this._validate(raw, options);
  }

  clone(definition: TableDefinition): TableDefinition {
    return JSON.parse(JSON.stringify(definition)) as TableDefinition;
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private _prepare(
    definition: TableDefinition,
    options: TableSerializationOptions,
  ): Partial<TableDefinition> {
    let columns = definition.columns;

    if (!options.includeHidden) {
      columns = columns.filter(c => c.visible !== false);
    }

    if (options.omitColumns?.length) {
      const omit = new Set(options.omitColumns);
      columns = columns.filter(c => !omit.has(c.id));
    }

    const result: Record<string, unknown> = {
      id:      definition.id,
      name:    definition.name,
      version: definition.version,
      columns: columns.map(c => ({
        id:          c.id,
        field:       c.field,
        header:      c.header,
        type:        c.type,
        width:       c.width,
        minWidth:    c.minWidth,
        maxWidth:    c.maxWidth,
        sortable:    c.sortable,
        filterable:  c.filterable,
        groupable:   c.groupable,
        searchable:  c.searchable,
        hideable:    c.hideable,
        resizable:   c.resizable,
        sticky:      c.sticky,
        visible:     c.visible,
        required:    c.required,
        editable:    c.editable,
        exportable:  c.exportable,
        printable:   c.printable,
        renderer:    c.renderer,
        order:       c.order,
        metadata:    c.metadata,
        // Exclude functions (formatter, cellClass fn) — not serializable
        headerClass: typeof c.headerClass === 'string' || Array.isArray(c.headerClass) ? c.headerClass : undefined,
        footerClass: typeof c.footerClass === 'string' || Array.isArray(c.footerClass) ? c.footerClass : undefined,
        cellClass:   typeof c.cellClass   === 'string' || Array.isArray(c.cellClass)   ? c.cellClass   : undefined,
      })),
    };

    if (definition.description)     result['description']     = definition.description;
    if (definition.selectionMode)   result['selectionMode']   = definition.selectionMode;
    if (definition.density)         result['density']         = definition.density;
    if (definition.toolbar)         result['toolbar']         = definition.toolbar;
    if (definition.filters)         result['filters']         = definition.filters;
    if (definition.groups)          result['groups']          = definition.groups;
    if (definition.summaries)       result['summaries']       = definition.summaries;
    if (definition.responsiveRules) result['responsiveRules'] = definition.responsiveRules;
    if (definition.metadata)        result['metadata']        = definition.metadata;

    if (options.includePermissions && definition.permissions) {
      result['permissions'] = definition.permissions;
    }

    if (definition.actions) {
      result['actions'] = definition.actions.map(a => ({
        id:         a.id,
        label:      a.label,
        icon:       a.icon,
        type:       a.type,
        position:   a.position,
        permission: a.permission,
        handler:    a.handler,
        order:      a.order,
        metadata:   a.metadata,
        // Exclude function-type disabled/visible
        disabled:   typeof a.disabled === 'boolean' ? a.disabled : undefined,
        visible:    typeof a.visible  === 'boolean' ? a.visible  : undefined,
      }));
    }

    return result as Partial<TableDefinition>;
  }

  private _validate(raw: unknown, options: TableDeserializationOptions): TableDefinition {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new Error('[TableSerializer] Expected a plain object for deserialization.');
    }

    const obj = raw as Record<string, unknown>;

    if (options.strict) {
      if (!obj['id'])      throw new Error('[TableSerializer] Missing required field: id.');
      if (!obj['name'])    throw new Error('[TableSerializer] Missing required field: name.');
      if (!Array.isArray(obj['columns'])) {
        throw new Error('[TableSerializer] Missing required field: columns (must be array).');
      }
    }

    return obj as unknown as TableDefinition;
  }
}
