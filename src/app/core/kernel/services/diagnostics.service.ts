import { Injectable, inject } from '@angular/core';
import { DiagnosticsReport, KernelState } from '../kernel.types';
import { HealthService } from './health.service';
import { VersionService } from './version.service';

@Injectable({ providedIn: 'root' })
export class DiagnosticsService {
  private readonly healthService = inject(HealthService);
  private readonly versionService = inject(VersionService);
  private latestReport: DiagnosticsReport | null = null;

  async buildReport(
    kernelState: KernelState,
    bootDurationMs: number,
    stepResults: import('../kernel.types').BootStepResult[],
    warnings: string[],
    registeredPluginCount: number,
    failedPluginCount: number,
  ): Promise<DiagnosticsReport> {
    const health = await this.healthService.runAll();

    const report: DiagnosticsReport = {
      kernelState,
      platformVersion: this.versionService.getRaw(),
      bootDurationMs,
      health,
      stepResults,
      warnings,
      registeredPluginCount,
      failedPluginCount,
      generatedAt: new Date().toISOString(),
    };

    this.latestReport = report;
    return report;
  }

  getLatestReport(): DiagnosticsReport | null {
    return this.latestReport;
  }

  exposeDevTools(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)['__IDOO_DIAGNOSTICS__'] = {
        getReport: () => this.latestReport,
        runHealth: () => this.healthService.runAll(),
        getVersion: () => this.versionService.getVersion(),
      };
    }
  }

  clearReport(): void {
    this.latestReport = null;
  }
}
