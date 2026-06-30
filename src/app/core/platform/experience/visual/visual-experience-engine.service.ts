import {
  Injectable, inject, computed, effect, OnDestroy,
  Signal, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import {
  EffectiveVisualExperience,
  TypographyProfile, DensityProfile, MotionProfile, AccessibilityProfile, IconPackProfile,
  VisualDiagnosticsReport, VisualMetricsSnapshot, VisualResolutionInput,
} from './visual.types';
import { VisualExperienceState }           from './visual-experience-state';
import { VisualExperienceEventsService }   from './visual-experience-events.service';
import { VisualExperienceRegistryService } from './visual-experience-registry.service';
import { VisualExperienceResolverService } from './visual-experience-resolver.service';
import { VisualExperienceMetricsService }  from './visual-experience-metrics.service';
import { VisualExperienceDiagnosticsService } from './visual-experience-diagnostics.service';
import { ExperienceEngineService }         from '../experience-engine.service';
import { VISUAL_AUTO_APPLY }               from './visual.tokens';
import {
  VISUAL_CSS_FONT_PREFIX, VISUAL_CSS_DENSITY_PREFIX,
  VISUAL_CSS_MOTION_PREFIX, VISUAL_CSS_A11Y_PREFIX, VISUAL_CSS_ICON_PREFIX,
  DEFAULT_TYPOGRAPHY_ID, DEFAULT_DENSITY_ID, DEFAULT_ICON_PACK_ID,
  DEFAULT_MOTION_ID, DEFAULT_ACCESSIBILITY_ID,
} from './visual.constants';

@Injectable({ providedIn: 'root' })
export class VisualExperienceEngineService implements OnDestroy {
  // ─── Dependencies ────────────────────────────────────────────────────────

  private readonly _state       = inject(VisualExperienceState);
  private readonly _events      = inject(VisualExperienceEventsService);
  private readonly _registry    = inject(VisualExperienceRegistryService);
  private readonly _resolver    = inject(VisualExperienceResolverService);
  private readonly _metrics     = inject(VisualExperienceMetricsService);
  private readonly _diagnostics = inject(VisualExperienceDiagnosticsService);
  private readonly _experience  = inject(ExperienceEngineService);
  private readonly _doc         = inject(DOCUMENT);
  private readonly _platformId  = inject(PLATFORM_ID);
  private readonly _autoApply   = inject(VISUAL_AUTO_APPLY);

  // ─── Computed Signals ─────────────────────────────────────────────────────

  /** The fully resolved visual experience, recomputed reactively when any active id changes. */
  readonly effectiveVisual: Signal<EffectiveVisualExperience> = computed(() =>
    this._resolver.resolveFromState(),
  );

  readonly typography:    Signal<TypographyProfile>    = computed(() => this.effectiveVisual().typography);
  readonly density:       Signal<DensityProfile>       = computed(() => this.effectiveVisual().density);
  readonly iconPack:      Signal<IconPackProfile>      = computed(() => this.effectiveVisual().iconPack);
  readonly motion:        Signal<MotionProfile>        = computed(() => this.effectiveVisual().motion);
  readonly accessibility: Signal<AccessibilityProfile> = computed(() => this.effectiveVisual().accessibility);

  // Convenience booleans
  readonly reducedMotion:   Signal<boolean> = computed(() => this._state.reducedMotion());
  readonly largeTypography: Signal<boolean> = computed(() => this._state.largeTypography());
  readonly focusVisible:    Signal<boolean> = computed(() => this._state.focusVisible());

  // ─── DOM auto-apply ──────────────────────────────────────────────────────

  private _effectCleanup: (() => void) | null = null;

  constructor() {
    if (this._autoApply && isPlatformBrowser(this._platformId)) {
      const ref = effect(() => {
        const visual = this.effectiveVisual();
        const start  = performance.now();
        try {
          this._applyToDom(visual);
          this._metrics.recordApply(performance.now() - start);
        } catch (err) {
          this._metrics.recordError();
          console.error('[VisualExperienceEngine] DOM apply error:', err);
        }
      });
      this._effectCleanup = () => ref.destroy();
    }
  }

  ngOnDestroy(): void {
    this._effectCleanup?.();
  }

  // ─── Typography API ───────────────────────────────────────────────────────

  setTypography(id: string): void {
    const prev = this._state.typographyId() ?? DEFAULT_TYPOGRAPHY_ID;
    this._experience.setTypography(id);  // writes to ExperienceState
    this._metrics.recordChange('typography');
    this._events.emit({ type: 'typography:changed', id, prev });
  }

  // ─── Density API ─────────────────────────────────────────────────────────

  setDensity(id: string): void {
    const prev = this._state.densityId();
    this._experience.setDensity(id);  // writes to ExperienceState
    this._metrics.recordChange('density');
    this._events.emit({ type: 'density:changed', id, prev });
  }

  // ─── Icon Pack API ────────────────────────────────────────────────────────

  setIconPack(id: string): void {
    const prev = this._state.iconPackId();
    this._experience.setIconPack(id);  // writes to ExperienceState
    this._metrics.recordChange('icon-pack');
    this._events.emit({ type: 'icon-pack:changed', id, prev });
  }

  // ─── Motion API ───────────────────────────────────────────────────────────

  setMotion(id: string): void {
    const prev = this._state.motionId();
    this._state.setMotion(id);
    this._metrics.recordChange('motion');
    this._events.emit({ type: 'motion:changed', id, prev });

    // Sync reducedMotion flag from the profile
    const profile = this._registry.getMotion(id);
    if (profile) this._state.setReducedMotion(profile.reducedMotion);
  }

  // ─── Accessibility API ────────────────────────────────────────────────────

  setAccessibility(id: string): void {
    const prevProfile = this._registry.getAccessibility(this._state.accessibilityId());
    const nextProfile = this._registry.getAccessibility(id);
    if (!nextProfile) return;

    const prev = prevProfile ?? nextProfile;
    this._state.setAccessibility(id);
    this._state.setReducedMotion(nextProfile.reducedMotion);
    this._state.setLargeTypography(nextProfile.largeTypography);
    this._state.setFocusVisible(nextProfile.focusVisible);

    if (nextProfile.largeTypography) {
      this._experience.setTypography('typography-large');
    }

    this._metrics.recordChange('accessibility');
    this._events.emit({ type: 'accessibility:changed', profile: nextProfile, prev });
  }

  setReducedMotion(value: boolean): void {
    this._state.setReducedMotion(value);
    const motionId = value ? 'motion-reduced' : DEFAULT_MOTION_ID;
    if (this._registry.hasMotion(motionId)) {
      this.setMotion(motionId);
    }
  }

  setLargeTypography(value: boolean): void {
    this._state.setLargeTypography(value);
    if (value) {
      this.setTypography('typography-large');
    } else {
      this.setTypography(DEFAULT_TYPOGRAPHY_ID);
    }
  }

  setFocusVisible(value: boolean): void {
    this._state.setFocusVisible(value);
    if (isPlatformBrowser(this._platformId)) {
      this._doc.documentElement.setAttribute('data-focus-visible', String(value));
    }
  }

  // ─── Resolution API ───────────────────────────────────────────────────────

  resolve(input: VisualResolutionInput): EffectiveVisualExperience {
    return this._resolver.resolve(input);
  }

  // ─── Profile Registration ─────────────────────────────────────────────────

  registerTypography(p: Parameters<VisualExperienceRegistryService['registerTypography']>[0]): void {
    this._registry.registerTypography(p);
  }

  registerDensity(p: Parameters<VisualExperienceRegistryService['registerDensity']>[0]): void {
    this._registry.registerDensity(p);
  }

  registerIconPack(p: Parameters<VisualExperienceRegistryService['registerIconPack']>[0]): void {
    this._registry.registerIconPack(p);
  }

  registerMotion(p: Parameters<VisualExperienceRegistryService['registerMotion']>[0]): void {
    this._registry.registerMotion(p);
  }

  registerAccessibility(p: Parameters<VisualExperienceRegistryService['registerAccessibility']>[0]): void {
    this._registry.registerAccessibility(p);
  }

  // ─── Observability ───────────────────────────────────────────────────────

  diagnosticsReport(): VisualDiagnosticsReport {
    return this._diagnostics.report();
  }

  metricsSnapshot(): VisualMetricsSnapshot {
    return this._metrics.snapshot();
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  reset(): void {
    this._state.reset();
    this._experience.setTypography(DEFAULT_TYPOGRAPHY_ID);
    this._experience.setDensity(DEFAULT_DENSITY_ID);
    this._experience.setIconPack(DEFAULT_ICON_PACK_ID);
  }

  // ─── DOM Application ─────────────────────────────────────────────────────

  private _applyToDom(visual: EffectiveVisualExperience): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const root = this._doc.documentElement;

    this._applyTypography(root, visual.typography);
    this._applyDensity(root, visual.density);
    this._applyMotion(root, visual.motion);
    this._applyAccessibility(root, visual.accessibility);
    this._applyIconPack(root, visual.iconPack);
  }

  private _applyTypography(root: HTMLElement, t: TypographyProfile): void {
    root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}family-base`,    t.fontFamilyBase);
    if (t.fontFamilyArabic) {
      root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}family-arabic`, t.fontFamilyArabic);
    }
    if (t.fontFamilyMono) {
      root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}family-mono`,   t.fontFamilyMono);
    }

    // Scale
    const scale = t.scale;
    if (scale.xs)    root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}size-xs`,    scale.xs);
    if (scale.sm)    root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}size-sm`,    scale.sm);
                     root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}size-base`,  scale.base);
    if (scale.lg)    root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}size-lg`,    scale.lg);
    if (scale.xl)    root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}size-xl`,    scale.xl);
    if (scale['2xl']) root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}size-2xl`, scale['2xl']);
    if (scale['3xl']) root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}size-3xl`, scale['3xl']);
    if (scale['4xl']) root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}size-4xl`, scale['4xl']);

    // Weights
    if (t.weights.light)    root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}weight-light`,    t.weights.light);
                            root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}weight-normal`,   t.weights.normal);
                            root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}weight-medium`,   t.weights.medium);
    if (t.weights.semibold) root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}weight-semibold`, t.weights.semibold);
                            root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}weight-bold`,     t.weights.bold);

    // Line heights
    root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}leading-tight`,   t.lineHeights.tight);
    root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}leading-normal`,  t.lineHeights.normal);
    root.style.setProperty(`${VISUAL_CSS_FONT_PREFIX}leading-relaxed`, t.lineHeights.relaxed);

    root.setAttribute('data-typography', t.id);
  }

  private _applyDensity(root: HTMLElement, d: DensityProfile): void {
    root.style.setProperty(`${VISUAL_CSS_DENSITY_PREFIX}height-sm`,   d.heightSm);
    root.style.setProperty(`${VISUAL_CSS_DENSITY_PREFIX}height-md`,   d.heightMd);
    root.style.setProperty(`${VISUAL_CSS_DENSITY_PREFIX}height-lg`,   d.heightLg);
    root.style.setProperty(`${VISUAL_CSS_DENSITY_PREFIX}padding-xs`,  d.paddingXs);
    root.style.setProperty(`${VISUAL_CSS_DENSITY_PREFIX}padding-sm`,  d.paddingSm);
    root.style.setProperty(`${VISUAL_CSS_DENSITY_PREFIX}padding-md`,  d.paddingMd);
    root.style.setProperty(`${VISUAL_CSS_DENSITY_PREFIX}padding-lg`,  d.paddingLg);
    root.style.setProperty(`${VISUAL_CSS_DENSITY_PREFIX}gap-sm`,      d.gapSm);
    root.style.setProperty(`${VISUAL_CSS_DENSITY_PREFIX}gap-md`,      d.gapMd);
    root.style.setProperty(`${VISUAL_CSS_DENSITY_PREFIX}gap-lg`,      d.gapLg);
    root.setAttribute('data-density', d.level);
  }

  private _applyMotion(root: HTMLElement, m: MotionProfile): void {
    root.style.setProperty(`${VISUAL_CSS_MOTION_PREFIX}duration-fast`,     m.durationFast);
    root.style.setProperty(`${VISUAL_CSS_MOTION_PREFIX}duration-normal`,   m.durationNormal);
    root.style.setProperty(`${VISUAL_CSS_MOTION_PREFIX}duration-slow`,     m.durationSlow);
    root.style.setProperty(`${VISUAL_CSS_MOTION_PREFIX}easing-standard`,   m.easingStandard);
    root.style.setProperty(`${VISUAL_CSS_MOTION_PREFIX}easing-decelerate`, m.easingDecelerate);
    root.style.setProperty(`${VISUAL_CSS_MOTION_PREFIX}easing-accelerate`, m.easingAccelerate);
    root.setAttribute('data-reduced-motion', String(m.reducedMotion));
  }

  private _applyAccessibility(root: HTMLElement, a: AccessibilityProfile): void {
    root.style.setProperty(`${VISUAL_CSS_A11Y_PREFIX}high-contrast`,    String(a.highContrast));
    root.style.setProperty(`${VISUAL_CSS_A11Y_PREFIX}reduced-motion`,   String(a.reducedMotion));
    root.style.setProperty(`${VISUAL_CSS_A11Y_PREFIX}large-typography`, String(a.largeTypography));
    root.style.setProperty(`${VISUAL_CSS_A11Y_PREFIX}focus-visible`,    String(a.focusVisible));
    root.setAttribute('data-high-contrast',    String(a.highContrast));
    root.setAttribute('data-focus-visible',    String(a.focusVisible));
  }

  private _applyIconPack(root: HTMLElement, i: IconPackProfile): void {
    root.style.setProperty(`${VISUAL_CSS_ICON_PREFIX}pack`,   i.id);
    root.style.setProperty(`${VISUAL_CSS_ICON_PREFIX}prefix`, i.prefix ?? '');
    if (i.cdnUrl) {
      root.style.setProperty(`${VISUAL_CSS_ICON_PREFIX}cdn-url`, `"${i.cdnUrl}"`);
    }
    root.setAttribute('data-icon-pack', i.id);
  }
}
