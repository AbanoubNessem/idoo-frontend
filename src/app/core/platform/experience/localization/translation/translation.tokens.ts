import { InjectionToken } from '@angular/core';
import { TranslationMap, TranslationLoadOptions } from './translation.types';

// ─── Translation Provider Interface ──────────────────────────────────────────

export interface TranslationProvider {
  readonly id:   string;
  readonly name: string;
  canLoad(namespace: string, locale: string): boolean;
  load(namespace: string, locale: string, options?: TranslationLoadOptions): Promise<TranslationMap>;
  listNamespaces?(locale: string): Promise<ReadonlyArray<string>>;
}

// ─── Injection Tokens ─────────────────────────────────────────────────────────

export const TRANSLATION_PROVIDERS = new InjectionToken<TranslationProvider[]>(
  'TRANSLATION_PROVIDERS',
  { factory: () => [] },
);

export const TRANSLATION_DEFAULT_NAMESPACE = new InjectionToken<string>(
  'TRANSLATION_DEFAULT_NAMESPACE',
  { factory: () => 'common' },
);

export const TRANSLATION_FALLBACK_LOCALE = new InjectionToken<string>(
  'TRANSLATION_FALLBACK_LOCALE',
  { factory: () => 'en-US' },
);

export const TRANSLATION_CACHE_TTL_MS = new InjectionToken<number>(
  'TRANSLATION_CACHE_TTL_MS',
  { factory: () => 30 * 60 * 1000 },  // 30 minutes
);

export const TRANSLATION_INTERPOLATION_OPEN = new InjectionToken<string>(
  'TRANSLATION_INTERPOLATION_OPEN',
  { factory: () => '{{' },
);

export const TRANSLATION_INTERPOLATION_CLOSE = new InjectionToken<string>(
  'TRANSLATION_INTERPOLATION_CLOSE',
  { factory: () => '}}' },
);
