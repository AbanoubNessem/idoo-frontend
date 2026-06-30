import { Injectable, inject } from '@angular/core';
import {
  VisualLayer, VisualLayerSnapshot, EffectiveVisualExperience, VisualResolutionInput,
  TypographyProfile, DensityProfile, IconPackProfile, MotionProfile, AccessibilityProfile,
} from './visual.types';
import { VisualExperienceRegistryService } from './visual-experience-registry.service';
import { VisualExperienceState }           from './visual-experience-state';
import {
  DEFAULT_TYPOGRAPHY_ID, DEFAULT_DENSITY_ID, DEFAULT_ICON_PACK_ID,
  DEFAULT_MOTION_ID, DEFAULT_ACCESSIBILITY_ID, VISUAL_RESOLUTION_ORDER,
} from './visual.constants';

@Injectable({ providedIn: 'root' })
export class VisualExperienceResolverService {
  private readonly _registry = inject(VisualExperienceRegistryService);
  private readonly _state    = inject(VisualExperienceState);

  /**
   * Resolve the effective visual experience from a layered input.
   * Layers are traversed in VISUAL_RESOLUTION_ORDER; last non-null value wins.
   */
  resolve(input: VisualResolutionInput = {}): EffectiveVisualExperience {
    const typographyId    = this._resolveId(input.typographyByLayer,    DEFAULT_TYPOGRAPHY_ID);
    const densityId       = this._resolveId(input.densityByLayer,       DEFAULT_DENSITY_ID);
    const iconPackId      = this._resolveId(input.iconPackByLayer,      DEFAULT_ICON_PACK_ID);
    const motionId        = this._resolveId(input.motionByLayer,        DEFAULT_MOTION_ID);
    const accessibilityId = this._resolveId(input.accessibilityByLayer, DEFAULT_ACCESSIBILITY_ID);

    const typography    = this._registry.getTypography(typographyId)
                       ?? this._registry.getTypography(DEFAULT_TYPOGRAPHY_ID)!;
    const density       = this._registry.getDensity(densityId)
                       ?? this._registry.getDensity(DEFAULT_DENSITY_ID)!;
    const iconPack      = this._registry.getIconPack(iconPackId)
                       ?? this._registry.getIconPack(DEFAULT_ICON_PACK_ID)!;
    const motion        = this._registry.getMotion(motionId)
                       ?? this._registry.getMotion(DEFAULT_MOTION_ID)!;
    const accessibility = this._registry.getAccessibility(accessibilityId)
                       ?? this._registry.getAccessibility(DEFAULT_ACCESSIBILITY_ID)!;

    return {
      typography,
      density,
      iconPack,
      motion,
      accessibility,
      layers: {
        typography:    this._buildSnapshots(input.typographyByLayer,    typographyId),
        density:       this._buildSnapshots(input.densityByLayer,       densityId),
        iconPack:      this._buildSnapshots(input.iconPackByLayer,      iconPackId),
        motion:        this._buildSnapshots(input.motionByLayer,        motionId),
        accessibility: this._buildSnapshots(input.accessibilityByLayer, accessibilityId),
      },
      resolvedAt: new Date().toISOString(),
    };
  }

  /**
   * Resolve from current VisualExperienceState (the live signals).
   */
  resolveFromState(): EffectiveVisualExperience {
    const typId = this._state.typographyId() ?? DEFAULT_TYPOGRAPHY_ID;
    return this.resolve({
      typographyByLayer:    { user: typId },
      densityByLayer:       { user: this._state.densityId() },
      iconPackByLayer:      { user: this._state.iconPackId() },
      motionByLayer:        { user: this._state.motionId() },
      accessibilityByLayer: { user: this._state.accessibilityId() },
    });
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _resolveId(
    byLayer: Partial<Record<VisualLayer, string>> | undefined,
    defaultId: string,
  ): string {
    if (!byLayer) return defaultId;
    let resolved = defaultId;
    for (const layer of VISUAL_RESOLUTION_ORDER) {
      const id = byLayer[layer];
      if (id) resolved = id;
    }
    return resolved;
  }

  private _buildSnapshots(
    byLayer: Partial<Record<VisualLayer, string>> | undefined,
    resolvedId: string,
  ): ReadonlyArray<VisualLayerSnapshot> {
    return VISUAL_RESOLUTION_ORDER.map<VisualLayerSnapshot>(layer => {
      const id = byLayer?.[layer] ?? null;
      return {
        layer,
        id,
        applied: id === resolvedId,
        reason:  id ? undefined : 'not set',
      };
    });
  }
}
