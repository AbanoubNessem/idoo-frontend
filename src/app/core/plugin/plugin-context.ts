import { PluginManifest } from './plugin-manifest.model';

export interface PluginLoggerAPI {
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
  debug(message: string, metadata?: Record<string, unknown>): void;
}

export interface PluginFieldRegistrationAPI {
  register(typeId: string, options: { component: () => Promise<unknown>; label?: string; icon?: string }): void;
  has(typeId: string): boolean;
}

export interface PluginValidatorRegistrationAPI {
  register(id: string, options: {
    factory: import('../registry/registries/validation.registry').ValidatorFactory;
    defaultMessage: string;
    label?: string;
  }): void;
  has(id: string): boolean;
}

export interface PluginRendererRegistrationAPI {
  register(key: string, options: { component: () => Promise<unknown>; label?: string }): void;
  has(key: string): boolean;
}

export interface PluginWidgetRegistrationAPI {
  register(id: string, options: { component: () => Promise<unknown>; name: string; icon: string }): void;
  has(id: string): boolean;
}

export interface PluginHealthRegistrationAPI {
  register(check: import('../kernel/kernel.types').IHealthCheck): void;
}

export interface PluginEventAPI {
  emit<T extends object>(type: string, payload?: T): void;
  on(type: string): import('rxjs').Observable<import('./plugin.events').PluginSystemEvent>;
}

export interface PluginFeatureFlagAPI {
  isEnabled(flag: string): boolean;
}

export interface PluginConfigPublic {
  apiUrl: string;
  production: boolean;
  platformVersion: string;
}

export interface PluginContext {
  readonly pluginId: string;
  readonly manifest: PluginManifest;
  readonly platformVersion: string;
  readonly config: PluginConfigPublic;

  readonly fields: PluginFieldRegistrationAPI;
  readonly validators: PluginValidatorRegistrationAPI;
  readonly renderers: PluginRendererRegistrationAPI;
  readonly widgets: PluginWidgetRegistrationAPI;
  readonly health: PluginHealthRegistrationAPI;
  readonly events: PluginEventAPI;
  readonly features: PluginFeatureFlagAPI;
  readonly logger: PluginLoggerAPI;

  hasCapability(id: string): boolean;
}
