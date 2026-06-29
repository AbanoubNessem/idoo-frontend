import { Injectable, inject } from '@angular/core';
import { Subject, filter } from 'rxjs';
import { PluginManifest } from './plugin-manifest.model';
import { PluginContext } from './plugin-context';
import { PluginRegistrationService } from './plugin-registration.service';
import { PluginLifecycleService } from './plugin-lifecycle.service';
import { PluginSystemEvent } from './plugin.events';
import { PluginBootResult, PluginError } from './plugin.types';
import { RegistryManagerService } from '../registry/registry-manager.service';
import { HealthService } from '../kernel/services/health.service';
import { PLATFORM_CONFIG_TOKEN } from '../kernel/kernel.tokens';

const INIT_FN_TIMEOUT_MS = 5_000;

@Injectable({ providedIn: 'root' })
export class PluginLoaderService {
  private readonly registrationService = inject(PluginRegistrationService);
  private readonly lifecycleService = inject(PluginLifecycleService);
  private readonly registryManager = inject(RegistryManagerService);
  private readonly healthService = inject(HealthService);
  private readonly platformConfig = inject(PLATFORM_CONFIG_TOKEN);

  private readonly _events = new Subject<PluginSystemEvent>();
  readonly events$ = this._events.asObservable();

  private readonly customFieldTypes = new Map<string, unknown>();
  private readonly customValidators = new Map<string, unknown>();
  private readonly customRenderers = new Map<string, unknown>();
  private readonly activeCapabilities = new Map<string, string>();

  async load(manifest: PluginManifest): Promise<PluginBootResult> {
    const start = performance.now();
    const pluginId = manifest.id;

    try {
      this.lifecycleService.transition(pluginId, 'LOADED');
      this.emitEvent(pluginId, 'plugin:loaded', 'LOADED');

      if (manifest.initFn) {
        const ctx = this.buildContext(manifest);
        this.lifecycleService.transition(pluginId, 'INITIALIZED');
        this.emitEvent(pluginId, 'plugin:initialized', 'INITIALIZED');

        await this.runInitFnWithTimeout(manifest, ctx);
      } else {
        this.lifecycleService.transition(pluginId, 'INITIALIZED');
      }

      const regResult = this.registrationService.register(manifest);

      if (regResult.errors.length > 0) {
        const error: PluginError = {
          code: 'REGISTRATION_FAILED',
          pluginId,
          message: regResult.errors.join('; '),
          timestamp: new Date().toISOString(),
        };
        this.lifecycleService.transition(pluginId, 'FAILED', error);
        this.emitEvent(pluginId, 'plugin:failed', 'FAILED', error.message);

        return {
          pluginId,
          success: false,
          state: 'FAILED',
          durationMs: performance.now() - start,
          error,
          warnings: [],
        };
      }

      this.lifecycleService.transition(pluginId, 'REGISTERED');
      this.emitEvent(pluginId, 'plugin:registered', 'REGISTERED');

      this.registerCapabilities(manifest);

      this.lifecycleService.transition(pluginId, 'READY');
      this.lifecycleService.transition(pluginId, 'ACTIVE');
      this.emitEvent(pluginId, 'plugin:active', 'ACTIVE');

      return {
        pluginId,
        success: true,
        state: 'ACTIVE',
        durationMs: performance.now() - start,
        warnings: [],
      };
    } catch (err) {
      const error: PluginError = {
        code: 'INIT_FAILED',
        pluginId,
        message: err instanceof Error ? err.message : String(err),
        cause: err instanceof Error ? err : undefined,
        timestamp: new Date().toISOString(),
      };
      this.lifecycleService.transition(pluginId, 'FAILED', error);
      this.emitEvent(pluginId, 'plugin:failed', 'FAILED', error.message);

      return {
        pluginId,
        success: false,
        state: 'FAILED',
        durationMs: performance.now() - start,
        error,
        warnings: [],
      };
    }
  }

  private buildContext(manifest: PluginManifest): PluginContext {
    const config = this.platformConfig;
    const validationRegistry = this.registryManager.validation;
    const widgetRegistry = this.registryManager.widget;
    const health = this.healthService;
    const activeCapabilities = this.activeCapabilities;
    const eventSubject = this._events;
    const customFieldTypes = this.customFieldTypes;
    const customRenderers = this.customRenderers;

    return {
      pluginId: manifest.id,
      manifest,
      platformVersion: config.platformVersion,
      config: {
        apiUrl: config.apiUrl,
        production: config.production,
        platformVersion: config.platformVersion,
      },
      fields: {
        register(typeId, options) { customFieldTypes.set(typeId, options); },
        has(typeId) { return customFieldTypes.has(typeId); },
      },
      validators: {
        register(id, options) {
          validationRegistry.register(id, {
            id,
            factory: options.factory,
            defaultMessage: options.defaultMessage,
            label: options.label,
          }, manifest.id, manifest.version);
        },
        has(id) { return validationRegistry.has(id); },
      },
      renderers: {
        register(key, options) { customRenderers.set(key, options); },
        has(key) { return customRenderers.has(key); },
      },
      widgets: {
        register(id, options) {
          widgetRegistry.register(id, {
            id,
            name: options.name,
            icon: options.icon,
            component: options.component as () => Promise<import('@angular/core').Type<unknown>>,
          }, manifest.id, manifest.version);
        },
        has(id) { return widgetRegistry.has(id); },
      },
      health: {
        register(check) { health.register(check); },
      },
      events: {
        emit(type, payload) {
          eventSubject.next({
            type: `${manifest.id.toLowerCase()}:${type}` as import('./plugin.events').PluginEventType,
            pluginId: manifest.id,
            state: 'ACTIVE',
            timestamp: new Date().toISOString(),
            metadata: payload as Record<string, unknown>,
          });
        },
        on(type) {
          return eventSubject.pipe(filter(e => e.type === type));
        },
      },
      features: {
        isEnabled(flag) { return config.featureFlags.includes(flag); },
      },
      logger: {
        info: (msg, meta) => console.info(`[${manifest.id}] ${msg}`, meta ?? ''),
        warn: (msg, meta) => console.warn(`[${manifest.id}] ${msg}`, meta ?? ''),
        error: (msg, meta) => console.error(`[${manifest.id}] ${msg}`, meta ?? ''),
        debug: (msg, meta) => console.debug(`[${manifest.id}] ${msg}`, meta ?? ''),
      },
      hasCapability(id) { return activeCapabilities.has(id); },
    };
  }

  private async runInitFnWithTimeout(manifest: PluginManifest, ctx: PluginContext): Promise<void> {
    const initFn = manifest.initFn!;

    await Promise.race([
      Promise.resolve(initFn(ctx)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Plugin ${manifest.id} initFn timed out after ${INIT_FN_TIMEOUT_MS}ms`)), INIT_FN_TIMEOUT_MS)
      ),
    ]);
  }

  private registerCapabilities(manifest: PluginManifest): void {
    for (const cap of manifest.capabilities ?? []) {
      this.activeCapabilities.set(cap, manifest.id);
    }
  }

  private emitEvent(
    pluginId: string,
    type: import('./plugin.events').PluginEventType,
    state: import('./plugin.types').PluginLifecycleState,
    error?: string,
  ): void {
    this._events.next({ type, pluginId, state, timestamp: new Date().toISOString(), error });
  }

  getRegisteredCapabilities(): Map<string, string> {
    return new Map(this.activeCapabilities);
  }

  hasCapability(id: string): boolean {
    return this.activeCapabilities.has(id);
  }

  getCustomFieldTypes(): string[] {
    return Array.from(this.customFieldTypes.keys());
  }
}
