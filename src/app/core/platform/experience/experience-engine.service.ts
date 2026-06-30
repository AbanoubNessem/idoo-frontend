import { Injectable, inject, OnDestroy, Signal } from '@angular/core';
import {
  ExperienceProfile, ExperienceDimension, ExperienceStateData,
  ExperiencePhase, AnyExperienceProfile, DimensionProfileMap,
  ExperienceDiagnosticsReport, ExperienceMetricsSnapshot,
} from './experience.types';
import { ExperienceState }           from './experience-state';
import { ExperienceContext }          from './experience-context';
import { ExperienceRegistryService }  from './experience-registry.service';
import { ExperienceEventsService }    from './experience-events.service';
import { ExperienceMetricsService }   from './experience-metrics.service';
import { ExperienceLifecycleService } from './experience-lifecycle.service';
import { ExperienceSerializerService }from './experience-serializer.service';
import { ExperienceBuilderService }   from './experience-builder.service';
import { ExperienceDiagnosticsService } from './experience-diagnostics.service';
import { EXPERIENCE_DEFAULT_PROFILE, EXPERIENCE_STORAGE } from './experience.tokens';
import { EXPERIENCE_SCHEMA_VERSION } from './experience.constants';
import { LayoutEngineService } from '../layout/layout-engine.service';

@Injectable({ providedIn: 'root' })
export class ExperienceEngineService implements OnDestroy {
  // ─── Dependencies ────────────────────────────────────────────────────────

  readonly state       = inject(ExperienceState);
  readonly context     = inject(ExperienceContext);
  readonly events      = inject(ExperienceEventsService);

  private readonly _registry    = inject(ExperienceRegistryService);
  private readonly _metrics     = inject(ExperienceMetricsService);
  private readonly _lifecycle   = inject(ExperienceLifecycleService);
  private readonly _serializer  = inject(ExperienceSerializerService);
  private readonly _diagnostics = inject(ExperienceDiagnosticsService);
  private readonly _storage     = inject(EXPERIENCE_STORAGE, { optional: true });
  private readonly _defaultProfile = inject(EXPERIENCE_DEFAULT_PROFILE);
  private readonly _layoutEngine   = inject(LayoutEngineService, { optional: true });

  get builder(): ExperienceBuilderService {
    return inject(ExperienceBuilderService);
  }

  private _phase: ExperiencePhase = 'created';

  // ─── Init ────────────────────────────────────────────────────────────────

  constructor() {
    this._initialize();
  }

  ngOnDestroy(): void {
    // Nothing to tear down at the root level
  }

  // ─── Registry API ────────────────────────────────────────────────────────

  register<D extends ExperienceDimension>(
    dimension: D,
    profile: DimensionProfileMap[D],
    options: { isDefault?: boolean; version?: string; tags?: ReadonlyArray<string> } = {},
  ): void {
    this._registry.register(dimension, profile, options);
    this.events.emit('profile:registered', { dimension, id: profile.id });
  }

  has(dimension: ExperienceDimension, id: string): boolean {
    return this._registry.has(dimension, id);
  }

  getProfile<D extends ExperienceDimension>(dimension: D, id: string): DimensionProfileMap[D] | null {
    return this._registry.get(dimension, id);
  }

  allProfiles<D extends ExperienceDimension>(dimension: D): ReadonlyArray<DimensionProfileMap[D]> {
    return this._registry.all(dimension);
  }

  // ─── Apply API ────────────────────────────────────────────────────────────

  apply(profile: ExperienceProfile): void {
    const start = performance.now();
    const prev  = this.state.snapshot();

    this._setPhase('applying');

    try {
      this.state.applySnapshot({
        themeId:      profile.themeId      ?? prev.themeId,
        languageCode: profile.languageCode ?? prev.languageCode,
        localeCode:   profile.localeCode   ?? prev.localeCode,
        densityId:    profile.densityId    ?? prev.densityId,
        typographyId: profile.typographyId ?? prev.typographyId,
        iconPackId:   profile.iconPackId   ?? prev.iconPackId,
        brandingId:   profile.brandingId   ?? prev.brandingId,
      });

      this._syncLayoutDirection();
      this._persistState();

      this._metrics.recordApply(performance.now() - start);
      this.events.emit('experience:applied', this.state.snapshot(), prev);
    } catch (err) {
      this._metrics.recordError();
      this._setPhase('error');
      this.events.emit('experience:error', err);
      throw err;
    }

    this._setPhase('ready');
  }

  // ─── Dimension Setters ────────────────────────────────────────────────────

  setTheme(id: string | null): void {
    const prev = this.state.themeId();
    this.state.setTheme(id);
    this._metrics.recordChange('theme');
    this._persist();
    this.events.emit('theme:changed', id, prev);
  }

  setLanguage(code: string): void {
    const prev = this.state.languageCode();
    this.state.setLanguage(code);
    this._syncLayoutDirection();
    this._metrics.recordChange('language');
    this._persist();
    this.events.emit('language:changed', code, prev);
    this.events.emit('direction:changed', this.state.direction(), prev);
  }

  setLocale(code: string): void {
    const prev = this.state.localeCode();
    this.state.setLocale(code);
    this._metrics.recordChange('locale');
    this._persist();
    this.events.emit('locale:changed', code, prev);
  }

  setDensity(id: string): void {
    const prev = this.state.densityId();
    this.state.setDensity(id);
    this._metrics.recordChange('density');
    this._persist();
    this.events.emit('density:changed', id, prev);
  }

  setTypography(id: string): void {
    const prev = this.state.typographyId();
    this.state.setTypography(id);
    this._metrics.recordChange('typography');
    this._persist();
    this.events.emit('typography:changed', id, prev);
  }

  setIconPack(id: string): void {
    const prev = this.state.iconPackId();
    this.state.setIconPack(id);
    this._metrics.recordChange('icon-pack');
    this._persist();
    this.events.emit('icon-pack:changed', id, prev);
  }

  setBranding(id: string | null): void {
    const prev = this.state.brandingId();
    this.state.setBranding(id);
    this._metrics.recordChange('branding');
    this._persist();
    this.events.emit('branding:changed', id, prev);
  }

  reset(): void {
    const prev = this.state.snapshot();
    this.state.reset();
    this._syncLayoutDirection();
    this._storage?.clear();
    this.events.emit('experience:reset', this.state.snapshot(), prev);
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  serialize(profile: ExperienceProfile): string {
    return this._serializer.serialize(profile);
  }

  deserialize(json: string): ExperienceProfile {
    return this._serializer.deserialize(json);
  }

  exportCurrentState(): string {
    const snap = this.state.snapshot();
    const profile: ExperienceProfile = {
      id:           'exported',
      name:         'Exported Experience',
      themeId:      snap.themeId      ?? undefined,
      languageCode: snap.languageCode,
      localeCode:   snap.localeCode,
      densityId:    snap.densityId,
      typographyId: snap.typographyId,
      iconPackId:   snap.iconPackId,
      brandingId:   snap.brandingId   ?? undefined,
    };
    return this._serializer.serialize(profile);
  }

  // ─── Observability ────────────────────────────────────────────────────────

  metricsSnapshot(): ExperienceMetricsSnapshot {
    return this._metrics.snapshot();
  }

  diagnosticsReport(): ExperienceDiagnosticsReport {
    return this._diagnostics.report();
  }

  get phase(): ExperiencePhase {
    return this._phase;
  }

  // ─── Signal Accessors ─────────────────────────────────────────────────────

  get themeId():      Signal<string | null> { return this.state.themeId; }
  get languageCode(): Signal<string>        { return this.state.languageCode; }
  get localeCode():   Signal<string>        { return this.state.localeCode; }
  get direction():    Signal<'ltr' | 'rtl'> { return this.state.direction; }
  get densityId():    Signal<string>        { return this.state.densityId; }
  get typographyId(): Signal<string>        { return this.state.typographyId; }
  get iconPackId():   Signal<string>        { return this.state.iconPackId; }
  get brandingId():   Signal<string | null> { return this.state.brandingId; }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _initialize(): void {
    this._setPhase('initializing');

    // Restore from storage
    const stored = this._storage?.load();
    if (stored) this.state.applySnapshot(stored);

    // Apply default profile if provided
    if (this._defaultProfile) {
      this.apply(this._defaultProfile);
    }

    this._syncLayoutDirection();
    this._setPhase('ready');
  }

  private _setPhase(phase: ExperiencePhase): void {
    const from = this._phase;
    if (this._lifecycle.transition(from, phase)) {
      this._phase = phase;
      this._diagnostics.setPhase(phase);
    }
  }

  private _syncLayoutDirection(): void {
    if (this._layoutEngine) {
      this._layoutEngine.setDirection(this.state.direction());
    }
  }

  private _persist(): void {
    this._persistState();
  }

  private _persistState(): void {
    this._storage?.save(this.state.snapshot());
  }
}
