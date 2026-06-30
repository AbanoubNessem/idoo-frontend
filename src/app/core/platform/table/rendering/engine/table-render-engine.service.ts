import { inject, Injectable } from '@angular/core';
import { TableResolverService } from '../../resolver/table-resolver.service';
import { ResolvedTableDefinition } from '../../table.types';
import { TableRenderPlanBuilderService } from '../plan/table-render-plan-builder.service';
import { TableRenderContext } from '../plan/table-render-context';
import { TableRenderPlan } from '../rendering.types';

// ─── TableRenderEngine ────────────────────────────────────────────────────────
// Orchestrates the render pipeline:
//   resolve → build plan → update context
// Manages state transitions on a TableRenderContext.

@Injectable({ providedIn: 'root' })
export class TableRenderEngineService {
  private readonly resolver    = inject(TableResolverService);
  private readonly planBuilder = inject(TableRenderPlanBuilderService);

  async prepareFromId(
    tableId: string,
    context: TableRenderContext,
    hasData  = true,
  ): Promise<TableRenderPlan | null> {
    context.setLoading();

    try {
      const resolved = await this.resolver.resolve(tableId);
      if (!resolved) {
        context.setError(`Table "${tableId}" not found in registry.`);
        return null;
      }
      return this._applyResolved(resolved, context, hasData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      context.setError(msg);
      return null;
    }
  }

  prepareFromResolved(
    resolved: ResolvedTableDefinition,
    context:  TableRenderContext,
    hasData   = true,
  ): TableRenderPlan {
    const plan = this._applyResolved(resolved, context, hasData);
    return plan;
  }

  applyData(
    context: TableRenderContext,
    hasData: boolean,
  ): void {
    const plan = context.plan();
    if (!plan) return;

    const state = hasData ? 'ready' : 'empty';
    const updated: TableRenderPlan = { ...plan, state };

    if (hasData) context.setReady(updated);
    else         context.setEmpty(updated);
  }

  applyError(context: TableRenderContext, message: string): void {
    context.setError(message);
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private _applyResolved(
    resolved: ResolvedTableDefinition,
    context:  TableRenderContext,
    hasData:  boolean,
  ): TableRenderPlan {
    const state = hasData ? 'ready' : 'empty';
    const plan  = this.planBuilder.build(resolved, state);

    if (hasData) context.setReady(plan);
    else         context.setEmpty(plan);

    return plan;
  }
}
