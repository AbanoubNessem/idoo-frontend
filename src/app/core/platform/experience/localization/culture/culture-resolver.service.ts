import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CultureDefinition, CultureLayer, EffectiveCulture,
  CultureLayerSnapshot, BrowserCultureInfo, CultureResolutionResult,
} from './culture.types';
import { CultureRegistryService } from './culture-registry.service';
import { CultureResolutionInput, CULTURE_BROWSER_DETECTION } from './culture.tokens';
import { DEFAULT_CULTURE_CODE, FALLBACK_CULTURE_CODE } from './culture.constants';

const RESOLUTION_ORDER: CultureLayer[] = ['platform', 'tenant', 'company', 'user', 'browser', 'runtime'];

@Injectable({ providedIn: 'root' })
export class CultureResolverService {
  private readonly _registry   = inject(CultureRegistryService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _useBrowser = inject(CULTURE_BROWSER_DETECTION);

  // ─── Resolution ───────────────────────────────────────────────────────────

  resolve(input: CultureResolutionInput): CultureResolutionResult {
    const snapshots: CultureLayerSnapshot[] = [];
    let effectiveCode: string | null = null;

    for (const layer of RESOLUTION_ORDER) {
      const code = layer === 'browser'
        ? (this._useBrowser && isPlatformBrowser(this._platformId) ? this._detectBrowser() : null)
        : (input.codeByLayer[layer] ?? null);

      if (!code) {
        snapshots.push({ layer, code: null, applied: false, reason: 'not-configured' });
        continue;
      }

      const exists = this._registry.has(code) || this._registry.get(code) !== null;
      if (!exists) {
        snapshots.push({ layer, code, applied: false, reason: 'not-registered' });
        continue;
      }

      snapshots.push({ layer, code, applied: true });
      effectiveCode = code;
    }

    return { effectiveCode, layerSnapshots: snapshots, resolvedAt: new Date().toISOString() };
  }

  resolveEffective(input: CultureResolutionInput): EffectiveCulture {
    const result = this.resolve(input);
    const code   = result.effectiveCode ?? DEFAULT_CULTURE_CODE;
    const def    = this._registry.get(code) ?? this._registry.get(FALLBACK_CULTURE_CODE)!;
    return this._toEffective(def!, result.layerSnapshots);
  }

  // ─── Browser Detection ────────────────────────────────────────────────────

  detectBrowser(): BrowserCultureInfo | null {
    if (!isPlatformBrowser(this._platformId)) return null;
    return this._buildBrowserInfo();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _detectBrowser(): string | null {
    if (!isPlatformBrowser(this._platformId)) return null;
    const locale = navigator.language ?? navigator.languages?.[0];
    if (!locale) return null;

    // Try exact match first, then language fallback
    if (this._registry.has(locale)) return locale;
    const lang = locale.split('-')[0];
    const match = this._registry.byLanguage(lang)[0];
    return match?.code ?? null;
  }

  private _buildBrowserInfo(): BrowserCultureInfo {
    const primary  = navigator.language ?? 'en-US';
    const all      = Array.from(navigator.languages ?? [primary]);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
    return {
      primaryLocale:   primary,
      allLocales:      all,
      primaryLanguage: primary.split('-')[0],
      timezone,
    };
  }

  private _toEffective(def: CultureDefinition, layers: ReadonlyArray<CultureLayerSnapshot>): EffectiveCulture {
    return {
      code:              def.code,
      language:          def.language,
      region:            def.region,
      direction:         def.direction,
      timezone:          def.timezone,
      calendar:          def.calendar,
      weekStart:         def.weekStart,
      numberSystem:      def.numberSystem,
      measurementSystem: def.measurementSystem,
      currency:          def.currency,
      layers,
      resolvedAt:        new Date().toISOString(),
    };
  }
}
