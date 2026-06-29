import { APP_INITIALIZER, Optional, Provider } from '@angular/core';
import { RegistryFacade } from '../facades/registry.facade';
import { MODULE_CONFIG_TOKEN } from '../tokens/registry.tokens';
import { ModuleConfig } from '../models/registry.models';

export function initializeRegistry(registryFacade: RegistryFacade, moduleConfigs: ModuleConfig[][] | null) {
  return () => {
    if (!moduleConfigs) return;
    moduleConfigs.forEach(configs => {
      if (Array.isArray(configs)) {
        configs.forEach(config => registryFacade.registerModule(config));
      }
    });
  };
}

export const provideRegistry = (): Provider[] => [
  {
    provide: MODULE_CONFIG_TOKEN,
    useValue: [],
    multi: true
  },
  {
    provide: APP_INITIALIZER,
    useFactory: initializeRegistry,
    deps: [RegistryFacade, [new Optional(), MODULE_CONFIG_TOKEN]],
    multi: true
  }
];
