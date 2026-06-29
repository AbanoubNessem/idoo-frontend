import { InjectionToken } from '@angular/core';
import { KernelAPI, PlatformConfig } from './kernel.types';

export const KERNEL_TOKEN = new InjectionToken<KernelAPI>('KERNEL_TOKEN');

export const PLATFORM_CONFIG_TOKEN = new InjectionToken<PlatformConfig>('PLATFORM_CONFIG_TOKEN', {
  factory: () => ({
    apiUrl: 'http://localhost:8080/api',
    production: false,
    platformVersion: '1.0.0',
    bootTimeoutMs: 10_000,
    enableHotReload: false,
    featureFlags: [],
  }),
});

export const EXTRA_BOOT_STEP_TOKEN = new InjectionToken<unknown>('EXTRA_BOOT_STEP_TOKEN');
