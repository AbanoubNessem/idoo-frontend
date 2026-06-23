import { APP_INITIALIZER, Provider } from '@angular/core';
import { RegistryFacade } from '../facades/registry.facade';
import { MODULE_CONFIG_TOKEN } from '../tokens/registry.tokens';
import { ModuleConfig } from '../models/registry.models';

export function initializeRegistry(registryFacade: RegistryFacade, moduleConfigs: ModuleConfig[][]) {
  return () => {
    // moduleConfigs could be an array of arrays if provided multiple times
    if (moduleConfigs) {
      moduleConfigs.forEach(configs => {
        if (Array.isArray(configs)) {
          configs.forEach(config => registryFacade.registerModule(config));
        }
      });
    }
  };
}

export const provideRegistry = (): Provider[] => {
  return [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeRegistry,
      deps: [RegistryFacade, MODULE_CONFIG_TOKEN],
      multi: true
    }
  ];
};
