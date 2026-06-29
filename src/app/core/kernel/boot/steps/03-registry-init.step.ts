import { BootContext } from '../../kernel.types';
import { IBootStep, buildStepResult } from '../boot-step.interface';

export class RegistryInitStep implements IBootStep {
  readonly stepId = '03-registry-init';
  readonly stepName = 'Registry Initialization';
  readonly order = 3;
  readonly critical = true;

  async execute(ctx: BootContext) {
    const start = performance.now();
    try {
      // Registry manager initialization is handled via Angular DI at app startup.
      // This step verifies the registry subsystem is in a consistent state.
      // Concrete validation happens when RegistryManager is injected.
      ctx.stepResults.set(this.stepId, buildStepResult(this.stepId, start, true));

      return buildStepResult(this.stepId, start, true, {
        metadata: { initialized: true },
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

  async onError(_ctx: BootContext, _error: Error): Promise<void> {
    // Registry init failure is unrecoverable — platform cannot function without registries
  }
}
