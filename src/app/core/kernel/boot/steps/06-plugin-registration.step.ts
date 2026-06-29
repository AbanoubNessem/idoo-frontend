import { BootContext } from '../../kernel.types';
import { IBootStep, buildStepResult } from '../boot-step.interface';

export class PluginRegistrationStep implements IBootStep {
  readonly stepId = '06-plugin-registration';
  readonly stepName = 'Plugin Registration';
  readonly order = 6;
  readonly critical = false;

  async execute(ctx: BootContext) {
    const start = performance.now();

    try {
      const warnings: string[] = [];

      if (ctx.failedPluginIds.length > 0) {
        warnings.push(
          `${ctx.failedPluginIds.length} plugin(s) failed during registration: ${ctx.failedPluginIds.join(', ')}`
        );
        ctx.isDegraded = true;
      }

      return buildStepResult(this.stepId, start, true, {
        warnings,
        metadata: {
          registered: ctx.loadedPluginIds.length,
          failed: ctx.failedPluginIds.length,
        },
      });
    } catch (error) {
      ctx.isDegraded = true;
      return buildStepResult(this.stepId, start, false, {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  canSkip(ctx: BootContext): boolean {
    return ctx.sortedPluginIds.length === 0;
  }

  async onError(ctx: BootContext, error: Error): Promise<void> {
    ctx.warnings.push(`Plugin registration step failed: ${error.message}. Platform will degrade.`);
    ctx.isDegraded = true;
  }
}
