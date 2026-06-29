import { inject } from '@angular/core';
import { PLATFORM_CONFIG_TOKEN } from '../../kernel.tokens';
import { BootContext } from '../../kernel.types';
import { IBootStep, buildStepResult } from '../boot-step.interface';

export class ConfigurationStep implements IBootStep {
  readonly stepId = '01-configuration';
  readonly stepName = 'Configuration';
  readonly order = 1;
  readonly critical = true;

  private readonly config = inject(PLATFORM_CONFIG_TOKEN);

  async execute(ctx: BootContext) {
    const start = performance.now();
    try {
      ctx.config = this.config;

      if (!ctx.config.apiUrl) {
        throw new Error('Platform config: apiUrl is required');
      }
      if (!ctx.config.platformVersion) {
        throw new Error('Platform config: platformVersion is required');
      }
      if (ctx.config.bootTimeoutMs <= 0) {
        throw new Error('Platform config: bootTimeoutMs must be positive');
      }

      return buildStepResult(this.stepId, start, true, {
        metadata: {
          apiUrl: ctx.config.apiUrl,
          production: ctx.config.production,
          platformVersion: ctx.config.platformVersion,
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

  async onError(_ctx: BootContext, _error: Error): Promise<void> {
    // Configuration failure is unrecoverable — no fallback possible
  }
}
