import { Injectable } from '@angular/core';
import { ResolvedTableColumn } from '../../table.types';
import { TableHeaderCellNode } from '../rendering.types';

@Injectable({ providedIn: 'root' })
export class TableHeaderRendererService {

  buildHeaderCells(visibleColumns: ResolvedTableColumn[]): TableHeaderCellNode[] {
    return visibleColumns
      .map((col, index): TableHeaderCellNode => ({
        type:        'header-cell',
        id:          `hdr-${col.id}`,
        visible:     true,
        columnId:    col.id,
        field:       col.field,
        header:      col.header,
        columnType:  col.type,
        width:       col.width,
        minWidth:    col.minWidth,
        maxWidth:    col.maxWidth,
        sticky:      col.sticky,
        sortable:    col.sortable   ?? false,
        filterable:  col.filterable ?? false,
        resizable:   col.resizable  ?? false,
        hideable:    col.hideable   ?? true,
        required:    col.required   ?? false,
        headerClass: col.headerClass,
        order:       col.order ?? index,
      }))
      .sort((a, b) => a.order - b.order);
  }
}
