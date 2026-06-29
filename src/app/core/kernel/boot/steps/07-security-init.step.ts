import { inject } from '@angular/core';
import { BootContext } from '../../kernel.types';
import { IBootStep, buildStepResult } from '../boot-step.interface';
import { PlatformContextService } from '../../context/platform-context.service';

export class SecurityInitStep implements IBootStep {
  readonly stepId = '07-security-init';
  readonly stepName = 'Security Initialization';
  readonly order = 7;
  readonly critical = false;

  private readonly platformContext = inject(PlatformContextService);

  async execute(ctx: BootContext) {
    const start = performance.now();
    const warnings: string[] = [];

    try {
      // Session restoration is handled by AuthFacade (already runs in APP_INITIALIZER).
      // This step records the restored session state in the boot context.
      ctx.sessionRestored = this.platformContext.isAuthenticated();

      if (!ctx.sessionRestored) {
        warnings.push('No active session found — user will need to authenticate.');
      }

      return buildStepResult(this.stepId, start, true, {
        warnings,
        metadata: {
          sessionRestored: ctx.sessionRestored,
          hasContext: this.platformContext.hasContext(),
        },
      });
    } catch (error) {
      ctx.isDegraded = true;
      return buildStepResult(this.stepId, start, false, {
        error: error instanceof Error ? error : new Error(String(error)),
        warnings,
      });
    }
  }

  canSkip(_ctx: BootContext): boolean {
    return false;
  }

  async onError(ctx: BootContext, error: Error): Promise<void> {
    ctx.warnings.push(`Security initialization failed: ${error.message}. User session may be lost.`);
    ctx.isDegraded = true;
  }
}
