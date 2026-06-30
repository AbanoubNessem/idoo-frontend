import { InjectionToken } from '@angular/core';
import { LocalizationConfig } from './localization.types';

export const LOCALIZATION_CONFIG = new InjectionToken<Partial<LocalizationConfig>>(
  'LOCALIZATION_CONFIG',
  { factory: () => ({}) },
);

export const LOCALIZATION_DEFAULT_LOCALE = new InjectionToken<string>(
  'LOCALIZATION_DEFAULT_LOCALE',
  { factory: () => 'en-US' },
);

export const LOCALIZATION_FALLBACK_LOCALE = new InjectionToken<string>(
  'LOCALIZATION_FALLBACK_LOCALE',
  { factory: () => 'en-US' },
);
