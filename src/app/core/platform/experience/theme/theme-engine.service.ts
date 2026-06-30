import {
  Injectable, inject, signal, computed, effect, OnDestroy, Signal, DOCUMENT,
} from '@angular/core';
import { Subject } from 'rxjs';
import {
  ThemeDefinition, ThemeTokens, EffectiveTheme,
  ThemeLayerSnapshot, ThemeLayer, ThemeEvent, ThemeKind,
} from './theme.types';
import { ThemeRegistryService }           from './theme-registry.service';
import { ThemeLoaderService }             from './theme-loader.service';
import { ThemeCacheService }              from './theme-cache.service';
import { ThemeValidatorService }          from './theme-validator.service';
import { ThemeSerializerService }         from './theme-serializer.service';
import { ExperienceResolverService }      from '../resolution/experience-resolver.service';
import { ExperienceResolutionContext }    from '../resolution/experience-resolution-context';
import { ExperienceResolutionPolicy }     from '../resolution/experience-resolution-policy';
import { ExperienceEngineService }        from '../experience-engine.service';
import {
  THEME_CSS_PREFIX_COLOR, THEME_CSS_PREFIX_SPACING,
  THEME_CSS_PREFIX_RADIUS, THEME_CSS_PREFIX_ELEVATION,
  THEME_CSS_PREFIX_BREAKPOINT, THEME_CSS_PREFIX_CUSTOM,
  DEFAULT_PLATFORM_THEME_ID,
} from './theme.constants';
import { THEME_AUTO_APPLY, THEME_INITIAL_ID } from './theme.tokens';

@Injectable({ providedIn: 'root' })
export class ThemeEngineService implements OnDestroy {
  // ─── Injected ─────────────────────────────────────────────────────────────

  private readonly _registry   = inject(ThemeRegistryService);
  private readonly _loader     = inject(ThemeLoaderService);
  private readonly _cache      = inject(ThemeCacheService);
  private readonly _validator  = inject(ThemeValidatorService);
  private readonly _serializer = inject(ThemeSerializerService);
  private readonly _resolver   = inject(ExperienceResolverService);
  private readonly _experience = inject(ExperienceEngineService);
  private readonly _doc        = inject(DOCUMENT);
  private readonly _autoApply  = inject(THEME_AUTO_APPLY);
  private readonly _initialId  = inject(THEME_INITIAL_ID);

  // ─── Signals ──────────────────────────────────────────────────────────────

  /** The theme ID that is currently active (null = platform default). */
  readonly activeThemeId: Signal<string | null> = this._experience.themeId;

  /** The fully-merged effective theme, recomputed when activeThemeId changes. */
  readonly effectiveTheme = computed<EffectiveTheme>(() => {
    const id = this.activeThemeId();
    return this._resolveEffective(id);
  });

  /** Convenience: variant of the effective theme. */
  readonly activeVariant = computed<ThemeKind>(() => this.effectiveTheme().variant);

  /** True when the active variant is dark. */
  readonly isDark = computed<boolean>(() => this.activeVariant() === 'dark');

  /** True when the active variant is high-contrast. */
  readonly isHighContrast = computed<boolean>(() => this.activeVariant() === 'high-contrast');

  // ─── Events ───────────────────────────────────────────────────────────────

  private readonly _events$ = new Subject<ThemeEvent>();
  readonly events$ = this._events$.asObservable();

  // ─── Internals ────────────────────────────────────────────────────────────

  private _currentResolutionContext: ExperienceResolutionContext | null = null;
  private _effectCleanup: (() => void) | null = null;

  // ─── Init ─────────────────────────────────────────────────────────────────

  constructor() {
    if (this._initialId && !this._experience.themeId()) {
      this._experience.setTheme(this._initialId);
    }

    if (this._autoApply) {
      const ref = effect(() => {
        const theme = this.effectiveTheme();
        this._applyToDom(theme);
        this._events$.next({ type: 'theme:resolved', effective: theme });
      });
      this._effectCleanup = () => ref.destroy();
    }
  }

  ngOnDestroy(): void {
    this._effectCleanup?.();
    this._events$.complete();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  setTheme(id: string | null): void {
    const prev = this.activeThemeId();
    this._experience.setTheme(id);
    const effective = this.effectiveTheme();
    this._events$.next({ type: 'theme:changed', themeId: id, prevId: prev, effective });
  }

  setLightTheme(): void {
    this.setTheme('platform-light');
  }

  setDarkTheme(): void {
    this.setTheme('platform-dark');
  }

  setHighContrastTheme(): void {
    this.setTheme('platform-high-contrast');
  }

  resetToDefault(): void {
    this.setTheme(null);
  }

  // ─── Resolution with Context ──────────────────────────────────────────────

  resolveWithContext(
    context: ExperienceResolutionContext,
    policy?: ExperienceResolutionPolicy,
  ): EffectiveTheme {
    this._currentResolutionContext = context;
    const resolved = this._resolver.resolve(context, policy);
    const themeId  = resolved.effectiveThemeId;
    return this._buildEffectiveFromResolved(themeId, resolved.layerResults.map(lr => ({
      layer:      lr.layer as ThemeLayer,
      themeId:    lr.themeId,
      applied:    lr.resolved,
      tokenCount: 0,
      reason:     lr.reason,
    })));
  }

  // ─── Registry Façade ─────────────────────────────────────────────────────

  register(theme: ThemeDefinition): void {
    this._registry.register(theme);
    this._events$.next({ type: 'theme:registered', themeId: theme.id });
  }

  getDefinition(id: string): ThemeDefinition | null {
    return this._registry.get(id) ?? this._cache.get(id);
  }

  allThemes(): ReadonlyArray<ThemeDefinition> {
    return this._registry.all();
  }

  // ─── Async Load ───────────────────────────────────────────────────────────

  async loadTheme(themeId: string): Promise<ThemeDefinition> {
    const theme = await this._loader.load(themeId);
    this._events$.next({ type: 'theme:loaded', themeId, source: 'provider' });
    return theme;
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  serializeTheme(theme: ThemeDefinition): string {
    return this._serializer.serialize(theme);
  }

  deserializeTheme(json: string): ThemeDefinition {
    return this._serializer.deserialize(json);
  }

  exportEffective(): string {
    return this._serializer.serialize(this._effectiveToDefinition(this.effectiveTheme()));
  }

  // ─── Token Access ─────────────────────────────────────────────────────────

  getToken(category: keyof ThemeTokens, key: string): string | undefined {
    const tokens = this.effectiveTheme().tokens;
    const group  = tokens[category] as Record<string, string> | undefined;
    return group?.[key];
  }

  // ─── DOM Application ──────────────────────────────────────────────────────

  applyThemeNow(id: string | null): void {
    const theme = this._resolveEffective(id);
    this._applyToDom(theme);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private _resolveEffective(themeId: string | null): EffectiveTheme {
    if (this._currentResolutionContext) {
      return this.resolveWithContext(this._currentResolutionContext);
    }

    const layers: ThemeLayerSnapshot[] = [];
    const resolvedDef = this._resolveDefinition(themeId, layers);
    return this._buildEffectiveFromDef(resolvedDef, layers);
  }

  private _resolveDefinition(
    themeId: string | null,
    layers:  ThemeLayerSnapshot[],
  ): ThemeDefinition {
    // 1. Platform default
    const platformDef = this._registry.get(DEFAULT_PLATFORM_THEME_ID) ?? this._registry.defaultTheme();
    layers.push({
      layer:      'platform',
      themeId:    platformDef?.id ?? null,
      applied:    !!platformDef,
      tokenCount: platformDef ? this._countTokens(platformDef.tokens) : 0,
    });

    if (!themeId) return platformDef!;

    // 2. Active theme (treated as user layer)
    const activeDef = this._registry.get(themeId) ?? this._cache.get(themeId);
    if (!activeDef) {
      layers.push({ layer: 'user', themeId, applied: false, reason: 'not-found', tokenCount: 0 });
      return platformDef!;
    }

    if (activeDef.parentId) {
      const parentDef = this._registry.get(activeDef.parentId);
      if (parentDef) {
        layers.push({
          layer:      'tenant',
          themeId:    parentDef.id,
          applied:    true,
          tokenCount: this._countTokens(parentDef.tokens),
        });
      }
    }

    layers.push({
      layer:      'user',
      themeId:    activeDef.id,
      applied:    true,
      tokenCount: this._countTokens(activeDef.tokens),
    });

    return activeDef;
  }

  private _buildEffectiveFromResolved(
    themeId: string | null,
    layers:  ThemeLayerSnapshot[],
  ): EffectiveTheme {
    const def = (themeId ? this._registry.get(themeId) : null)
      ?? this._registry.defaultTheme()
      ?? this._registry.all()[0];

    return this._buildEffectiveFromDef(def!, layers);
  }

  private _buildEffectiveFromDef(
    def:    ThemeDefinition,
    layers: ThemeLayerSnapshot[],
  ): EffectiveTheme {
    const mergedTokens = this._mergeTokens(layers, def);
    return {
      id:         def.id,
      name:       def.name,
      variant:    def.variant,
      tokens:     mergedTokens,
      layers,
      resolvedAt: new Date().toISOString(),
    };
  }

  private _mergeTokens(layers: ThemeLayerSnapshot[], activeDef: ThemeDefinition): ThemeTokens {
    let base: ThemeTokens = activeDef.tokens;

    if (activeDef.parentId) {
      const parent = this._registry.get(activeDef.parentId);
      if (parent) {
        base = this._deepMergeTokens(parent.tokens, activeDef.tokens);
      }
    }

    return base;
  }

  private _deepMergeTokens(base: ThemeTokens, override: ThemeTokens): ThemeTokens {
    return {
      colors:      { ...base.colors,      ...override.colors },
      spacing:     { ...base.spacing,     ...override.spacing },
      radius:      { ...base.radius,      ...override.radius },
      elevation:   { ...base.elevation,   ...override.elevation },
      breakpoints: { ...base.breakpoints, ...override.breakpoints },
      custom:      { ...base.custom,      ...override.custom },
    };
  }

  private _applyToDom(theme: EffectiveTheme): void {
    const root = this._doc.documentElement;

    for (const [key, val] of Object.entries(theme.tokens.colors)) {
      if (val !== undefined) root.style.setProperty(`${THEME_CSS_PREFIX_COLOR}${key}`, val);
    }
    for (const [key, val] of Object.entries(theme.tokens.spacing ?? {})) {
      if (val !== undefined) root.style.setProperty(`${THEME_CSS_PREFIX_SPACING}${key}`, val);
    }
    for (const [key, val] of Object.entries(theme.tokens.radius ?? {})) {
      if (val !== undefined) root.style.setProperty(`${THEME_CSS_PREFIX_RADIUS}${key}`, val);
    }
    for (const [key, val] of Object.entries(theme.tokens.elevation ?? {})) {
      if (val !== undefined) root.style.setProperty(`${THEME_CSS_PREFIX_ELEVATION}${key}`, val);
    }
    for (const [key, val] of Object.entries(theme.tokens.breakpoints ?? {})) {
      if (val !== undefined) root.style.setProperty(`${THEME_CSS_PREFIX_BREAKPOINT}${key}`, val);
    }
    for (const [key, val] of Object.entries(theme.tokens.custom ?? {})) {
      if (val !== undefined) root.style.setProperty(`${THEME_CSS_PREFIX_CUSTOM}${key}`, val);
    }

    // Stamp the variant as a data-attribute for CSS targeting
    root.setAttribute('data-theme', theme.variant);
    root.setAttribute('data-theme-id', theme.id);
  }

  private _countTokens(tokens: ThemeTokens): number {
    return Object.values(tokens).reduce((sum, group) => {
      if (!group || typeof group !== 'object') return sum;
      return sum + Object.values(group).filter(v => v !== undefined).length;
    }, 0);
  }

  private _effectiveToDefinition(effective: EffectiveTheme): ThemeDefinition {
    return {
      id:          effective.id + '-exported',
      name:        effective.name + ' (Exported)',
      kind:        'theme',
      variant:     effective.variant,
      tokens:      effective.tokens,
      description: `Exported effective theme resolved at ${effective.resolvedAt}`,
    };
  }
}
