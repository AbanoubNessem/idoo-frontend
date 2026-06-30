import { InjectionToken } from '@angular/core';
import { TypographyProfile, DensityProfile, IconPackProfile, MotionProfile, AccessibilityProfile } from './visual.types';

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface VisualExperienceProvider {
  readonly id:   string;
  readonly name: string;

  /** Whether this provider can supply the given profile type and id */
  canLoad(type: 'typography' | 'density' | 'icon-pack' | 'motion' | 'accessibility', id: string): boolean;

  /** Load a specific profile */
  loadTypography?(id: string):    Promise<TypographyProfile | null>;
  loadDensity?(id: string):       Promise<DensityProfile | null>;
  loadIconPack?(id: string):      Promise<IconPackProfile | null>;
  loadMotion?(id: string):        Promise<MotionProfile | null>;
  loadAccessibility?(id: string): Promise<AccessibilityProfile | null>;
}

// ─── InjectionTokens ─────────────────────────────────────────────────────────

export const VISUAL_AUTO_APPLY = new InjectionToken<boolean>(
  'VISUAL_AUTO_APPLY',
  { providedIn: 'root', factory: () => true },
);

export const VISUAL_DIAGNOSTICS_ENABLED = new InjectionToken<boolean>(
  'VISUAL_DIAGNOSTICS_ENABLED',
  { providedIn: 'root', factory: () => false },
);

export const VISUAL_PROVIDERS = new InjectionToken<ReadonlyArray<VisualExperienceProvider>>(
  'VISUAL_PROVIDERS',
);

export const VISUAL_INITIAL_TYPOGRAPHY_ID = new InjectionToken<string>(
  'VISUAL_INITIAL_TYPOGRAPHY_ID',
);

export const VISUAL_INITIAL_DENSITY_ID = new InjectionToken<string>(
  'VISUAL_INITIAL_DENSITY_ID',
);

export const VISUAL_INITIAL_ICON_PACK_ID = new InjectionToken<string>(
  'VISUAL_INITIAL_ICON_PACK_ID',
);

export const VISUAL_INITIAL_MOTION_ID = new InjectionToken<string>(
  'VISUAL_INITIAL_MOTION_ID',
);

export const VISUAL_INITIAL_ACCESSIBILITY_ID = new InjectionToken<string>(
  'VISUAL_INITIAL_ACCESSIBILITY_ID',
);
