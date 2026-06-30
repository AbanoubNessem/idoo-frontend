import { InjectionToken } from '@angular/core';
import { CultureDefinition, CultureLayer } from './culture.types';

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface CultureProvider {
  readonly id:   string;
  readonly name: string;
  canProvide(code: string): boolean;
  get(code: string): Promise<CultureDefinition>;
  list?(): Promise<ReadonlyArray<{ code: string; name: string }>>;
}

// ─── Resolution Context ───────────────────────────────────────────────────────

export interface CultureResolutionInput {
  readonly codeByLayer: Partial<Record<CultureLayer, string>>;
  readonly tenantId?:   string;
  readonly companyId?:  string;
  readonly userId?:     string;
}

// ─── Injection Tokens ─────────────────────────────────────────────────────────

export const CULTURE_PROVIDERS = new InjectionToken<CultureProvider[]>(
  'CULTURE_PROVIDERS',
  { factory: () => [] },
);

export const CULTURE_INITIAL_CODE = new InjectionToken<string | null>(
  'CULTURE_INITIAL_CODE',
  { factory: () => null },
);

export const CULTURE_DIAGNOSTICS_ENABLED = new InjectionToken<boolean>(
  'CULTURE_DIAGNOSTICS_ENABLED',
  { factory: () => false },
);

export const CULTURE_BROWSER_DETECTION = new InjectionToken<boolean>(
  'CULTURE_BROWSER_DETECTION',
  { factory: () => true },
);
