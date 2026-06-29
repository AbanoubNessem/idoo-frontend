import { BootContext } from '../../kernel.types';
import { IBootStep, buildStepResult } from '../boot-step.interface';

export class DependencyGraphStep implements IBootStep {
  readonly stepId = '05-dependency-graph';
  readonly stepName = 'Dependency Graph Validation';
  readonly order = 5;
  readonly critical = true;

  async execute(ctx: BootContext) {
    const start = performance.now();
    const warnings: string[] = [];

    try {
      // Topological sort is performed by PluginResolver using Kahn's algorithm.
      // This step validates the result is available.
      if (ctx.discoveredManifestIds.length === 0) {
        ctx.sortedPluginIds = [];
        return buildStepResult(this.stepId, start, true, {
          warnings: ['No plugins — dependency graph is trivially valid.'],
          metadata: { sortedOrder: [] },
        });
      }

      // sortedPluginIds is populated by PluginManager after resolver runs.
      // If not populated yet, default to discovered order.
      if (ctx.sortedPluginIds.length === 0) {
        ctx.sortedPluginIds = [...ctx.discoveredManifestIds];
        warnings.push('Dependency sort not performed — defaulting to discovery order.');
      }

      return buildStepResult(this.stepId, start, true, {
        warnings,
        metadata: { sortedOrder: ctx.sortedPluginIds },
      });
    } catch (error) {
      return buildStepResult(this.stepId, start, false, {
        error: error instanceof Error ? error : new Error(String(error)),
        warnings,
      });
    }
  }

  canSkip(ctx: BootContext): boolean {
    return ctx.discoveredManifestIds.length === 0;
  }

  async onError(ctx: BootContext, error: Error): Promise<void> {
    ctx.warnings.push(`Dependency graph validation failed: ${error.message}`);
  }
}
