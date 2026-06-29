import { Injectable, inject } from '@angular/core';
import { PluginHostService } from './plugin-host.service';
import { PluginLifecycleService } from './plugin-lifecycle.service';
import { PluginDiagnosticsReport, PluginRuntimeEntry } from './plugin.types';

@Injectable({ providedIn: 'root' })
export class PluginDiagnosticsService {
  private readonly pluginHost = inject(PluginHostService);
  private readonly lifecycle = inject(PluginLifecycleService);

  getReport(): PluginDiagnosticsReport {
    return this.pluginHost.getDiagnostics();
  }

  getPluginEntry(pluginId: string): PluginRuntimeEntry | undefined {
    return this.lifecycle.getEntry(pluginId);
  }

  getFailedPlugins(): PluginRuntimeEntry[] {
    return this.lifecycle.getFailed();
  }

  getActivePlugins(): PluginRuntimeEntry[] {
    return this.lifecycle.getActive();
  }

  summarize(): {
    total: number;
    active: number;
    failed: number;
    disabled: number;
    successRate: number;
  } {
    const entries = this.lifecycle.allEntries();
    const active = entries.filter(e => e.state === 'ACTIVE').length;
    const failed = entries.filter(e => e.state === 'FAILED').length;
    const disabled = entries.filter(e => e.state === 'DISABLED').length;
    const total = entries.length;
    const successRate = total === 0 ? 1 : active / total;

    return { total, active, failed, disabled, successRate };
  }
}
