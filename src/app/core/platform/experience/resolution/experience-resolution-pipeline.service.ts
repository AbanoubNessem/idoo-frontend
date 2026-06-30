import { Injectable, inject } from '@angular/core';
import {
  ExperienceResolutionContext,
  ResolvedExperience,
  ThemeLayerResult,
} from './experience-resolution-context';
import { ExperienceResolutionPolicy, DEFAULT_RESOLUTION_POLICY } from './experience-resolution-policy';
import { ThemeLayer } from '../theme/theme.types';
import { THEME_RESOLUTION_POLICY } from '../theme/theme.tokens';

@Injectable({ providedIn: 'root' })
export class ExperienceResolutionPipeline {
  private readonly _policy = inject(THEME_RESOLUTION_POLICY, { optional: true })
    ?? DEFAULT_RESOLUTION_POLICY;

  // ─── Resolution ───────────────────────────────────────────────────────────

  resolve(
    context:  ExperienceResolutionContext,
    policy?:  ExperienceResolutionPolicy,
  ): ResolvedExperience {
    const active = policy ?? this._policy;
    const layerResults: ThemeLayerResult[] = [];
    let effectiveThemeId: string | null = null;

    for (const layer of active.order) {
      const result = this._resolveLayer(layer, context, active);
      layerResults.push(result);

      if (result.resolved && result.themeId) {
        if (active.strategy === 'replace') {
          effectiveThemeId = result.themeId;
        } else {
          // merge: highest layer wins
          effectiveThemeId = result.themeId;
        }
      }
    }

    return {
      context,
      effectiveThemeId,
      layerResults,
      resolvedAt: new Date().toISOString(),
    };
  }

  // ─── Single-Layer Resolution ──────────────────────────────────────────────

  private _resolveLayer(
    layer:   ThemeLayer,
    context: ExperienceResolutionContext,
    policy:  ExperienceResolutionPolicy,
  ): ThemeLayerResult {
    if (layer === 'runtime' && !policy.allowRuntimeOverride) {
      return { layer, themeId: null, resolved: false, reason: 'runtime-override-disabled' };
    }
    if (layer === 'accessibility' && !policy.allowAccessibilityOverride) {
      return { layer, themeId: null, resolved: false, reason: 'accessibility-override-disabled' };
    }

    const themeId = context.themeByLayer[layer] ?? null;
    if (!themeId) {
      return { layer, themeId: null, resolved: false, reason: 'not-configured' };
    }

    return { layer, themeId, resolved: true };
  }

  // ─── Policy Access ────────────────────────────────────────────────────────

  getActivePolicy(): ExperienceResolutionPolicy {
    return this._policy;
  }
}
