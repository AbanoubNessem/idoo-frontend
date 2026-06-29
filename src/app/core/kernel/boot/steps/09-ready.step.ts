import { BootContext } from '../../kernel.types';
import { IBootStep, buildStepResult } from '../boot-step.interface';

export class ReadyStep implements IBootStep {
  readonly stepId = '09-ready';
  readonly stepName = 'Platform Ready';
  readonly order = 9;
  readonly critical = false;

  async execute(ctx: BootContext) {
    const start = performance.now();
    const totalMs = performance.now() - ctx.startedAt;

    return buildStepResult(this.stepId, start, true, {
      metadata: {
        totalBootMs: totalMs,
        isDegraded: ctx.isDegraded,
        warningCount: ctx.warnings.length,
        loadedPlugins: ctx.loadedPluginIds.length,
        failedPlugins: ctx.failedPluginIds.length,
      },
    });
  }

  canSkip(_ctx: BootContext): boolean {
    return false;
  }

  async onError(_ctx: BootContext, _error: Error): Promise<void> {
    // Ready step failure is cosmetic — platform is already in final state
  }
}
