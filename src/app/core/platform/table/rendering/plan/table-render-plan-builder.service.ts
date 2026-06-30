import { inject, Injectable } from '@angular/core';
import { TABLE_DEFAULTS } from '../../table.constants';
import { ResolvedTableDefinition } from '../../table.types';
import { TableErrorRendererService } from '../renderers/table-error-renderer.service';
import { TableCellRendererService } from '../renderers/table-cell-renderer.service';
import { TableEmptyRendererService } from '../renderers/table-empty-renderer.service';
import { TableFooterRendererService } from '../renderers/table-footer-renderer.service';
import { TableHeaderRendererService } from '../renderers/table-header-renderer.service';
import { TableLoadingRendererService } from '../renderers/table-loading-renderer.service';
import { TableToolbarRendererService } from '../renderers/table-toolbar-renderer.service';
import { TableRenderPlan, TableRenderState } from '../rendering.types';

let _planCounter = 0;

// ─── TableRenderPlanBuilder ───────────────────────────────────────────────────
// Assembles a complete, immutable TableRenderPlan from a ResolvedTableDefinition.
// This is the only place that touches metadata — components only receive the plan.

@Injectable({ providedIn: 'root' })
export class TableRenderPlanBuilderService {
  private readonly headerRenderer  = inject(TableHeaderRendererService);
  private readonly cellRenderer    = inject(TableCellRendererService);
  private readonly footerRenderer  = inject(TableFooterRendererService);
  private readonly toolbarRenderer = inject(TableToolbarRendererService);
  private readonly emptyRenderer   = inject(TableEmptyRendererService);
  private readonly loadingRenderer = inject(TableLoadingRendererService);
  private readonly errorRenderer   = inject(TableErrorRendererService);

  build(
    resolved:  ResolvedTableDefinition,
    state:     TableRenderState = 'ready',
    errorMsg?: string,
  ): TableRenderPlan {
    const def        = resolved.definition;
    const density    = def.density ?? TABLE_DEFAULTS.density;
    const headerCells = this.headerRenderer.buildHeaderCells(resolved.visibleColumns);
    const bodyCells  = this.cellRenderer.buildBodyCells(resolved.visibleColumns);
    const footerCells = this.footerRenderer.buildFooterCells(
      def.summaries ?? [],
      resolved.visibleColumns,
    );
    const toolbar     = this.toolbarRenderer.buildToolbarNode(def.toolbar, def.actions);
    const loading     = this.loadingRenderer.buildLoadingNode(headerCells.length);
    const empty       = this.emptyRenderer.buildEmptyNode();
    const error       = this.errorRenderer.buildErrorNode(errorMsg ?? 'An error occurred.');

    return {
      id:          `plan-${++_planCounter}`,
      tableId:     def.id,
      plannedAt:   new Date().toISOString(),
      state:       errorMsg ? 'error' : state,
      density,
      toolbar:     toolbar ?? undefined,
      headerCells,
      bodyCells,
      footerCells,
      loading,
      empty,
      error,
      hasToolbar:  !!toolbar,
      hasFooter:   footerCells.length > 0,
      columnCount: headerCells.length,
      metadata:    (def.metadata ?? {}) as Record<string, unknown>,
    };
  }
}
