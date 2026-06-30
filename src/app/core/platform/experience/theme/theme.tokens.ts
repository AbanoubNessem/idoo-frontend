import { InjectionToken } from '@angular/core';
import { ThemeDefinition, ThemeLoadOptions } from './theme.types';
import { ExperienceResolutionPolicy } from '../resolution/experience-resolution-policy';

// ─── Theme Provider Interface ─────────────────────────────────────────────────

export interface ThemeProvider {
  readonly id:   string;
  readonly name: string;
  canLoad(themeId: string): boolean;
  load(themeId: string, options?: ThemeLoadOptions): Promise<ThemeDefinition>;
  list?(): Promise<ReadonlyArray<{ id: string; name: string }>>;
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

export const THEME_RESOLUTION_POLICY = new InjectionToken<ExperienceResolutionPolicy>(
  'THEME_RESOLUTION_POLICY',
);

export const THEME_DIAGNOSTICS_ENABLED = new InjectionToken<boolean>(
  'THEME_DIAGNOSTICS_ENABLED',
  { factory: () => false },
);

export const THEME_PROVIDERS = new InjectionToken<ThemeProvider[]>(
  'THEME_PROVIDERS',
  { factory: () => [] },
);

export const THEME_INITIAL_ID = new InjectionToken<string | null>(
  'THEME_INITIAL_ID',
  { factory: () => null },
);

export const THEME_AUTO_APPLY = new InjectionToken<boolean>(
  'THEME_AUTO_APPLY',
  { factory: () => true },
);

export const THEME_CACHE_TTL_MS = new InjectionToken<number>(
  'THEME_CACHE_TTL_MS',
  { factory: () => 5 * 60 * 1000 },   // 5 minutes
);
