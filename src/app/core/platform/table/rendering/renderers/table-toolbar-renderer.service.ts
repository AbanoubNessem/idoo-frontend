import { Injectable } from '@angular/core';
import { TableActionDefinition, TableToolbarDefinition } from '../../table.types';
import { TableActionNode, TableToolbarNode } from '../rendering.types';

@Injectable({ providedIn: 'root' })
export class TableToolbarRendererService {

  buildToolbarNode(
    toolbar?:  TableToolbarDefinition,
    actions?:  TableActionDefinition[],
  ): TableToolbarNode | null {
    const hasToolbar = !!toolbar;
    const toolbarActions = this._resolveActions(actions ?? []);

    if (!hasToolbar && !toolbarActions.length) return null;

    return {
      type:              'toolbar',
      id:                'toolbar',
      visible:           true,
      showSearch:        toolbar?.search        ?? false,
      searchPlaceholder: toolbar?.searchPlaceholder ?? 'Search...',
      showDensity:       toolbar?.density       ?? false,
      showColumnPicker:  toolbar?.columnVisibility ?? false,
      showExport:        toolbar?.export        ?? false,
      showPrint:         toolbar?.print         ?? false,
      showRefresh:       toolbar?.refresh       ?? false,
      toolbarActions,
    };
  }

  private _resolveActions(actions: TableActionDefinition[]): TableActionNode[] {
    return actions
      .filter(a => this._isVisible(a))
      .map((a, i): TableActionNode => ({
        type:        'action',
        id:          `action-${a.id}`,
        visible:     true,
        actionId:    a.id,
        label:       a.label,
        icon:        a.icon,
        variant:     a.type,
        position:    a.position,
        handler:     a.handler,
        permission:  a.permission,
        order:       a.order ?? i,
        metadata:    a.metadata,
      }))
      .sort((a, b) => a.order - b.order);
  }

  private _isVisible(action: TableActionDefinition): boolean {
    if (typeof action.visible === 'boolean') return action.visible;
    if (typeof action.visible === 'function') return action.visible({});
    return true;
  }
}
