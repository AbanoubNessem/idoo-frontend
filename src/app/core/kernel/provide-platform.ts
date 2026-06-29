import { EnvironmentProviders, makeEnvironmentProviders, APP_INITIALIZER } from '@angular/core';
import { PLATFORM_CONFIG_TOKEN } from './kernel.tokens';
import { PlatformConfig } from './kernel.types';
import { PlatformKernelService } from './platform-kernel.service';

export function providePlatform(config: Partial<PlatformConfig> = {}): EnvironmentProviders {
  const mergedConfig: PlatformConfig = {
    apiUrl: 'http://localhost:8080/api',
    production: false,
    platformVersion: '1.0.0',
    bootTimeoutMs: 10_000,
    enableHotReload: false,
    featureFlags: [],
    ...config,
  };

  return makeEnvironmentProviders([
    { provide: PLATFORM_CONFIG_TOKEN, useValue: mergedConfig },
    {
      provide: APP_INITIALIZER,
      useFactory: (kernel: PlatformKernelService) => () => kernel.boot(),
      deps: [PlatformKernelService],
      multi: true,
    },
  ]);
}
