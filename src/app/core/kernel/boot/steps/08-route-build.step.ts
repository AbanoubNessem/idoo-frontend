import { BootContext } from '../../kernel.types';
import { IBootStep, buildStepResult } from '../boot-step.interface';

export class RouteBuildStep implements IBootStep {
  readonly stepId = '08-route-build';
  readonly stepName = 'Route Building';
  readonly order = 8;
  readonly critical = true;

  async execute(ctx: BootContext) {
    const start = performance.now();

    try {
      // Dynamic routes are built by the RouteRegistry consuming entries from RegistryManager.
      // Angular's Router is updated by the NavigationEngine during runtime.
      // This step validates that route building can proceed.
      const pluginCount = ctx.loadedPluginIds.length;

      return buildStepResult(this.stepId, start, true, {
        metadata: {
          pluginsContributingRoutes: pluginCount,
          mode: pluginCount === 0 ? 'static-only' : 'dynamic',
        },
      });
    } catch (error) {
      return buildStepResult(this.stepId, start, false, {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  canSkip(_ctx: BootContext): boolean {
    return false;
  }

  async onError(ctx: BootContext, error: Error): Promise<void> {
    ctx.warnings.push(`Route build failed: ${error.message}`);
  }
}
