import { inject, Injectable } from '@angular/core';
import { ResolvedTableDefinition, TableDensity } from '../table.types';
import { TableRenderEngineService } from './engine/table-render-engine.service';
import { TableRenderContext } from './plan/table-render-context';
import { TableRenderPlanBuilderService } from './plan/table-render-plan-builder.service';
import { TableCellRendererService } from './renderers/table-cell-renderer.service';
import { TableErrorRendererService } from './renderers/table-error-renderer.service';
import { TableEmptyRendererService } from './renderers/table-empty-renderer.service';
import { TableLoadingRendererService } from './renderers/table-loading-renderer.service';
import { TableBodyCellNode, TableCellValue, TableRenderPlan, TableRenderState } from './rendering.types';

// ─── TableRendererService ─────────────────────────────────────────────────────
// Main facade for the rendering sub-system.
// Consumers create a context, then call prepare() to populate it.
// Components receive only the plan signal from the context.

@Injectable({ providedIn: 'root' })
export class TableRendererService {
  private readonly engine      = inject(TableRenderEngineService);
  private readonly planBuilder = inject(TableRenderPlanBuilderService);
  private readonly cellRenderer = inject(TableCellRendererService);
  private readonly emptyRenderer = inject(TableEmptyRendererService);
  private readonly loadingRenderer = inject(TableLoadingRendererService);
  private readonly errorRenderer = inject(TableErrorRendererService);

  // ─── Service Facades ──────────────────────────────────────────────────────

  get Engine():          TableRenderEngineService  { return this.engine; }
  get PlanBuilder():     TableRenderPlanBuilderService { return this.planBuilder; }
  get CellRenderer():    TableCellRendererService  { return this.cellRenderer; }
  get EmptyRenderer():   TableEmptyRendererService { return this.emptyRenderer; }
  get LoadingRenderer(): TableLoadingRendererService { return this.loadingRenderer; }
  get ErrorRenderer():   TableErrorRendererService { return this.errorRenderer; }

  // ─── Context Lifecycle ────────────────────────────────────────────────────

  createContext(): TableRenderContext {
    return new TableRenderContext();
  }

  // ─── Prepare Pipeline ────────────────────────────────────────────────────

  async prepareFromId(
    tableId: string,
    context: TableRenderContext,
    hasData  = true,
  ): Promise<TableRenderPlan | null> {
    return this.engine.prepareFromId(tableId, context, hasData);
  }

  prepare(
    resolved: ResolvedTableDefinition,
    context:  TableRenderContext,
    hasData   = true,
  ): TableRenderPlan {
    return this.engine.prepareFromResolved(resolved, context, hasData);
  }

  // ─── Plan Building (without context) ────────────────────────────────────

  buildPlan(
    resolved: ResolvedTableDefinition,
    state:    TableRenderState = 'ready',
  ): TableRenderPlan {
    return this.planBuilder.build(resolved, state);
  }

  // ─── Data Updates ─────────────────────────────────────────────────────────

  applyData(context: TableRenderContext, hasData: boolean): void {
    this.engine.applyData(context, hasData);
  }

  setError(context: TableRenderContext, message: string): void {
    this.engine.applyError(context, message);
  }

  setDensity(context: TableRenderContext, density: TableDensity): void {
    context.setDensity(density);
  }

  // ─── Cell Value Formatting ────────────────────────────────────────────────

  formatValue(
    value:   unknown,
    node:    TableBodyCellNode,
    locale?: string,
  ): TableCellValue {
    return this.cellRenderer.formatValue(value, node, locale);
  }
}
