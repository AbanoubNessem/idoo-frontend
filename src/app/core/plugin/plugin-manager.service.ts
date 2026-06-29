import { Injectable, inject, signal, computed } from '@angular/core';
import { PluginManifest, PLUGIN_MANIFEST_TOKEN } from './plugin-manifest.model';
import { PluginResolverService } from './plugin-resolver.service';
import { PluginLoaderService } from './plugin-loader.service';
import { PluginLifecycleService } from './plugin-lifecycle.service';
import { validateManifest } from './plugin.validation';
import { PluginBootResult, PluginSystemStatus, PluginError } from './plugin.types';
import { RegistryManagerService } from '../registry/registry-manager.service';

@Injectable({ providedIn: 'root' })
export class PluginManagerService {
  private readonly resolver = inject(PluginResolverService);
  private readonly loader = inject(PluginLoaderService);
  private readonly lifecycle = inject(PluginLifecycleService);
  private readonly registryManager = inject(RegistryManagerService);

  private manifests: PluginManifest[] = [];

  private readonly _systemStatus = signal<PluginSystemStatus>('idle');
  readonly systemStatus = computed(() => this._systemStatus());

  readonly events$ = this.loader.events$;

  async initialize(manifests: PluginManifest[]): Promise<PluginBootResult[]> {
    this.manifests = manifests;
    this._systemStatus.set('discovering');

    const results: PluginBootResult[] = [];

    // 1. Validate all manifests
    const valid: PluginManifest[] = [];
    for (const manifest of manifests) {
      const validation = validateManifest(manifest);
      this.lifecycle.initialize(manifest);

      if (!validation.valid) {
        const error: PluginError = {
          code: 'MANIFEST_INVALID',
          pluginId: manifest.id,
          message: validation.errors.join('; '),
          timestamp: new Date().toISOString(),
        };
        this.lifecycle.transition(manifest.id, 'FAILED', error);
        results.push({
          pluginId: manifest.id,
          success: false,
          state: 'FAILED',
          durationMs: 0,
          error,
          warnings: validation.warnings,
        });
      } else {
        this.lifecycle.transition(manifest.id, 'VALIDATED');
        valid.push(manifest);
      }
    }

    // 2. Resolve dependency order
    this._systemStatus.set('loading');
    const resolution = this.resolver.resolve(valid);

    for (const error of resolution.errors) {
      const manifest = valid.find(m => m.id === error.pluginId);
      if (manifest) {
        this.lifecycle.transition(manifest.id, 'FAILED', error);
        results.push({
          pluginId: error.pluginId,
          success: false,
          state: 'FAILED',
          durationMs: 0,
          error,
          warnings: [],
        });
      }
    }

    // 3. Mark resolved
    for (const pluginId of resolution.sortedOrder) {
      this.lifecycle.transition(pluginId, 'RESOLVED');
    }

    // 4. Load in topological order
    this._systemStatus.set('registering');
    for (const pluginId of resolution.sortedOrder) {
      const manifest = valid.find(m => m.id === pluginId);
      if (!manifest) continue;

      const result = await this.loader.load(manifest);
      results.push(result);
    }

    // 5. Publish all registries
    this.registryManager.publishAll();

    this._systemStatus.set('ready');

    return results;
  }

  getManifest(pluginId: string): PluginManifest | undefined {
    return this.manifests.find(m => m.id === pluginId);
  }

  getAllManifests(): PluginManifest[] {
    return [...this.manifests];
  }

  isLoaded(pluginId: string): boolean {
    return this.lifecycle.isInState(pluginId, 'ACTIVE');
  }

  hasCapability(id: string): boolean {
    return this.loader.hasCapability(id);
  }
}
