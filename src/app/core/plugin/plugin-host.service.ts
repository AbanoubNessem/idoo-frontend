import { Injectable, inject, signal, computed, Optional } from '@angular/core';
import { PluginManifest, PLUGIN_MANIFEST_TOKEN } from './plugin-manifest.model';
import { PluginManagerService } from './plugin-manager.service';
import { PluginBootResult, PluginDiagnosticsReport, PluginSystemStatus } from './plugin.types';
import { PluginLifecycleService } from './plugin-lifecycle.service';

@Injectable({ providedIn: 'root' })
export class PluginHostService {
  private readonly pluginManager = inject(PluginManagerService);
  private readonly lifecycle = inject(PluginLifecycleService);

  private readonly _bootResults = signal<PluginBootResult[]>([]);
  private readonly _initialized = signal(false);

  readonly bootResults = computed(() => this._bootResults());
  readonly initialized = computed(() => this._initialized());
  readonly systemStatus = this.pluginManager.systemStatus;

  readonly events$ = this.pluginManager.events$;

  async initializeAll(manifests: PluginManifest[]): Promise<PluginBootResult[]> {
    if (this._initialized()) {
      console.warn('PluginHostService.initializeAll() called more than once.');
      return this._bootResults();
    }

    const results = await this.pluginManager.initialize(manifests);
    this._bootResults.set(results);
    this._initialized.set(true);

    return results;
  }

  getManifest(pluginId: string): PluginManifest | undefined {
    return this.pluginManager.getManifest(pluginId);
  }

  getAllManifests(): PluginManifest[] {
    return this.pluginManager.getAllManifests();
  }

  isActive(pluginId: string): boolean {
    return this.pluginManager.isLoaded(pluginId);
  }

  hasCapability(id: string): boolean {
    return this.pluginManager.hasCapability(id);
  }

  getDiagnostics(): PluginDiagnosticsReport {
    const entries = this.lifecycle.allEntries();
    const results = this._bootResults();

    return {
      totalDiscovered: entries.length,
      totalLoaded: entries.filter(e => e.state === 'ACTIVE').length,
      totalFailed: entries.filter(e => e.state === 'FAILED').length,
      totalDisabled: entries.filter(e => e.state === 'DISABLED').length,
      plugins: entries,
      systemStatus: this.systemStatus() as PluginSystemStatus,
      generatedAt: new Date().toISOString(),
    };
  }

  getSuccessful(): PluginBootResult[] {
    return this._bootResults().filter(r => r.success);
  }

  getFailed(): PluginBootResult[] {
    return this._bootResults().filter(r => !r.success);
  }

  getLoadedPluginIds(): string[] {
    return this.lifecycle.getActive().map(e => e.manifest.id);
  }

  getFailedPluginIds(): string[] {
    return this.lifecycle.getFailed().map(e => e.manifest.id);
  }
}
