import { Injectable } from '@angular/core';
import {
  TypographyProfile, DensityProfile, IconPackProfile,
  MotionProfile, AccessibilityProfile,
} from './visual.types';
import {
  BUILT_IN_TYPOGRAPHY_PROFILES, BUILT_IN_DENSITY_PROFILES,
  BUILT_IN_ICON_PACK_PROFILES, BUILT_IN_MOTION_PROFILES,
  BUILT_IN_ACCESSIBILITY_PROFILES,
} from './visual.constants';

@Injectable({ providedIn: 'root' })
export class VisualExperienceRegistryService {
  private readonly _typography    = new Map<string, TypographyProfile>();
  private readonly _density       = new Map<string, DensityProfile>();
  private readonly _iconPack      = new Map<string, IconPackProfile>();
  private readonly _motion        = new Map<string, MotionProfile>();
  private readonly _accessibility = new Map<string, AccessibilityProfile>();

  constructor() {
    this._registerBuiltIns();
  }

  // ─── Typography ──────────────────────────────────────────────────────────

  registerTypography(p: TypographyProfile): void     { this._typography.set(p.id, p); }
  getTypography(id: string): TypographyProfile | null { return this._typography.get(id) ?? null; }
  allTypography(): ReadonlyArray<TypographyProfile>   { return Array.from(this._typography.values()); }
  hasTypography(id: string): boolean                  { return this._typography.has(id); }

  // ─── Density ─────────────────────────────────────────────────────────────

  registerDensity(p: DensityProfile): void      { this._density.set(p.id, p); }
  getDensity(id: string): DensityProfile | null  { return this._density.get(id) ?? null; }
  allDensity(): ReadonlyArray<DensityProfile>    { return Array.from(this._density.values()); }
  hasDensity(id: string): boolean               { return this._density.has(id); }

  // ─── Icon Pack ────────────────────────────────────────────────────────────

  registerIconPack(p: IconPackProfile): void      { this._iconPack.set(p.id, p); }
  getIconPack(id: string): IconPackProfile | null  { return this._iconPack.get(id) ?? null; }
  allIconPacks(): ReadonlyArray<IconPackProfile>   { return Array.from(this._iconPack.values()); }
  hasIconPack(id: string): boolean                { return this._iconPack.has(id); }

  // ─── Motion ──────────────────────────────────────────────────────────────

  registerMotion(p: MotionProfile): void      { this._motion.set(p.id, p); }
  getMotion(id: string): MotionProfile | null  { return this._motion.get(id) ?? null; }
  allMotion(): ReadonlyArray<MotionProfile>    { return Array.from(this._motion.values()); }
  hasMotion(id: string): boolean              { return this._motion.has(id); }

  // ─── Accessibility ────────────────────────────────────────────────────────

  registerAccessibility(p: AccessibilityProfile): void      { this._accessibility.set(p.id, p); }
  getAccessibility(id: string): AccessibilityProfile | null  { return this._accessibility.get(id) ?? null; }
  allAccessibility(): ReadonlyArray<AccessibilityProfile>    { return Array.from(this._accessibility.values()); }
  hasAccessibility(id: string): boolean                      { return this._accessibility.has(id); }

  // ─── Counts ──────────────────────────────────────────────────────────────

  counts(): Readonly<Record<string, number>> {
    return {
      typography:    this._typography.size,
      density:       this._density.size,
      'icon-pack':   this._iconPack.size,
      motion:        this._motion.size,
      accessibility: this._accessibility.size,
    };
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _registerBuiltIns(): void {
    for (const p of BUILT_IN_TYPOGRAPHY_PROFILES)    this._typography.set(p.id, p);
    for (const p of BUILT_IN_DENSITY_PROFILES)       this._density.set(p.id, p);
    for (const p of BUILT_IN_ICON_PACK_PROFILES)     this._iconPack.set(p.id, p);
    for (const p of BUILT_IN_MOTION_PROFILES)        this._motion.set(p.id, p);
    for (const p of BUILT_IN_ACCESSIBILITY_PROFILES) this._accessibility.set(p.id, p);
  }
}
