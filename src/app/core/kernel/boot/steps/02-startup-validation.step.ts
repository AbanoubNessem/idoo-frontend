import { inject } from '@angular/core';
import { BootContext } from '../../kernel.types';
import { IBootStep, buildStepResult } from '../boot-step.interface';
import { VersionService } from '../../services/version.service';

export class StartupValidationStep implements IBootStep {
  readonly stepId = '02-startup-validation';
  readonly stepName = 'Startup Validation';
  readonly order = 2;
  readonly critical = true;

  private readonly versionService = inject(VersionService);

  async execute(ctx: BootContext) {
    const start = performance.now();
    const warnings: string[] = [];

    try {
      const version = this.versionService.parse(ctx.config.platformVersion);
      if (version.major === 0) {
        warnings.push('Running on a pre-release major version (0.x.x).');
      }

      if (ctx.config.production && !window.isSecureContext) {
        warnings.push('Production mode running on an insecure context (HTTP). HTTPS is strongly recommended.');
      }

      const storageAvailable = this.checkStorage();
      if (!storageAvailable) {
        throw new Error('Browser storage (localStorage/sessionStorage) is unavailable — platform cannot boot.');
      }

      return buildStepResult(this.stepId, start, true, {
        warnings,
        metadata: { parsedVersion: version },
      });
    } catch (error) {
      return buildStepResult(this.stepId, start, false, {
        error: error instanceof Error ? error : new Error(String(error)),
        warnings,
      });
    }
  }

  canSkip(_ctx: BootContext): boolean {
    return false;
  }

  async onError(_ctx: BootContext, _error: Error): Promise<void> {
    // Validation failure — unrecoverable
  }

  private checkStorage(): boolean {
    try {
      const probe = '__idoo_boot_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }
}
