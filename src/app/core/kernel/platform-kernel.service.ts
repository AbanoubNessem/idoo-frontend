import { Injectable, inject, signal, computed } from '@angular/core';
import { KernelAPI, KernelHealthReport, KernelState, DiagnosticsReport, PlatformVersion, BootContext } from './kernel.types';
import { BootManagerService } from './boot/boot-manager.service';
import { BootStateMachineService, InvalidKernelStateTransitionError } from './boot/boot-state-machine.service';
import { HealthService } from './services/health.service';
import { DiagnosticsService } from './services/diagnostics.service';
import { VersionService } from './services/version.service';
import { LifecycleManagerService } from './services/lifecycle-manager.service';

export class KernelAlreadyBootedError extends Error {
  constructor() {
    super('PlatformKernel.boot() was called more than once. The kernel can only boot once per application lifecycle.');
    this.name = 'KernelAlreadyBootedError';
  }
}

@Injectable({ providedIn: 'root' })
export class PlatformKernelService implements KernelAPI {
  private readonly bootManager = inject(BootManagerService);
  private readonly stateMachine = inject(BootStateMachineService);
  private readonly healthService = inject(HealthService);
  private readonly diagnosticsService = inject(DiagnosticsService);
  private readonly versionService = inject(VersionService);
  private readonly lifecycleManager = inject(LifecycleManagerService);

  private bootContext: BootContext | null = null;
  private bootDurationMs = 0;
  private readonly _bootError = signal<Error | null>(null);

  readonly state = computed<KernelState>(() => this.stateMachine.state());
  readonly isReady = computed(() => this.stateMachine.isReady());
  readonly isDegraded = computed(() => this.stateMachine.isDegraded());
  readonly bootError = computed(() => this._bootError());

  async boot(): Promise<void> {
    if (this.stateMachine.state() !== 'idle') {
      throw new KernelAlreadyBootedError();
    }

    this.stateMachine.transition('booting', 'PlatformKernel.boot()');

    await this.lifecycleManager.emit('beforeBoot');

    const ctx = this.bootManager.createBootContext();
    this.bootContext = ctx;

    try {
      const result = await this.bootManager.boot(ctx);

      this.bootDurationMs = result.totalDurationMs;

      if (!result.success) {
        this._bootError.set(
          ctx.stepResults.get(result.failedCriticalStep!)?.error ??
          new Error(`Critical boot step failed: ${result.failedCriticalStep}`)
        );
        this.stateMachine.transition('error', `critical-step-failed:${result.failedCriticalStep}`);
        await this.lifecycleManager.emit('onError');
        return;
      }

      if (result.isDegraded) {
        this.stateMachine.transition('degraded', 'non-critical-failures');
        await this.lifecycleManager.emit('onDegraded');
      } else {
        this.stateMachine.transition('ready', 'boot-complete');
      }

      await this.lifecycleManager.emit('afterBoot');

      if (!this.bootContext.config.production) {
        this.diagnosticsService.exposeDevTools();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this._bootError.set(error);

      try {
        this.stateMachine.transition('error', 'boot-exception');
      } catch (transitionErr) {
        if (!(transitionErr instanceof InvalidKernelStateTransitionError)) throw transitionErr;
      }

      await this.lifecycleManager.emit('onError');
    }
  }

  async shutdown(): Promise<void> {
    const currentState = this.stateMachine.state();
    if (currentState !== 'ready' && currentState !== 'degraded') {
      return;
    }

    await this.lifecycleManager.emit('beforeShutdown');
    this.stateMachine.transition('shutting-down', 'PlatformKernel.shutdown()');
    this.stateMachine.transition('offline', 'shutdown-complete');
    await this.lifecycleManager.emit('afterShutdown');
  }

  getVersion(): PlatformVersion {
    return this.versionService.getVersion();
  }

  async getHealth(): Promise<KernelHealthReport> {
    return this.healthService.runAll();
  }

  getDiagnostics(): DiagnosticsReport {
    const existing = this.diagnosticsService.getLatestReport();
    if (existing) return existing;

    const ctx = this.bootContext;
    return {
      kernelState: this.stateMachine.state(),
      platformVersion: this.versionService.getRaw(),
      bootDurationMs: this.bootDurationMs,
      health: {
        overallStatus: 'unhealthy',
        checks: [],
        generatedAt: new Date().toISOString(),
        platformVersion: this.versionService.getRaw(),
      },
      stepResults: ctx ? Array.from(ctx.stepResults.values()) : [],
      warnings: ctx?.warnings ?? [],
      registeredPluginCount: ctx?.loadedPluginIds.length ?? 0,
      failedPluginCount: ctx?.failedPluginIds.length ?? 0,
      generatedAt: new Date().toISOString(),
    };
  }

  getBootContext(): BootContext | null {
    return this.bootContext;
  }
}
