import { Injectable, inject } from '@angular/core';
import { BootContext, PlatformConfig } from '../kernel.types';
import { PLATFORM_CONFIG_TOKEN } from '../kernel.tokens';
import { BootPipelineService, PipelineResult } from './boot-pipeline.service';

export class BootTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Platform boot timed out after ${timeoutMs}ms`);
    this.name = 'BootTimeoutError';
  }
}

@Injectable({ providedIn: 'root' })
export class BootManagerService {
  private readonly config = inject(PLATFORM_CONFIG_TOKEN);
  private readonly pipeline = inject(BootPipelineService);

  createBootContext(): BootContext {
    return this.buildContextFromConfig(this.config);
  }

  async boot(ctx: BootContext): Promise<PipelineResult> {
    return this.withTimeout(
      this.pipeline.run(ctx),
      this.config.bootTimeoutMs,
    );
  }

  buildContextFromConfig(config: PlatformConfig): BootContext {
    return {
      config,
      discoveredManifestIds: [],
      sortedPluginIds: [],
      loadedPluginIds: [],
      failedPluginIds: [],
      sessionRestored: false,
      stepResults: new Map(),
      warnings: [],
      isDegraded: false,
      startedAt: performance.now(),
    };
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new BootTimeoutError(timeoutMs));
      }, timeoutMs);

      promise.then(
        (value) => { clearTimeout(timer); resolve(value); },
        (err)   => { clearTimeout(timer); reject(err); },
      );
    });
  }
}
