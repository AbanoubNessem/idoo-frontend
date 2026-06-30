import { ThemeLayer } from '../theme/theme.types';

// ─── Resolution Context ───────────────────────────────────────────────────────

export interface ExperienceResolutionContext {
  readonly tenantId?:              string;
  readonly companyId?:             string;
  readonly userId?:                string;
  /** The theme ID to use at each layer (undefined = skip layer). */
  readonly themeByLayer:           Partial<Record<ThemeLayer, string>>;
}

// ─── Layer Result ─────────────────────────────────────────────────────────────

export interface ThemeLayerResult {
  readonly layer:    ThemeLayer;
  readonly themeId:  string | null;
  readonly resolved: boolean;
  readonly reason?:  string;
}

// ─── Resolved Experience ──────────────────────────────────────────────────────

export interface ResolvedExperience {
  readonly context:        ExperienceResolutionContext;
  readonly effectiveThemeId: string | null;
  readonly layerResults:   ReadonlyArray<ThemeLayerResult>;
  readonly resolvedAt:     string;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export class ExperienceResolutionContextBuilder {
  private _ctx: {
    tenantId?:   string;
    companyId?:  string;
    userId?:     string;
    themeByLayer: Partial<Record<ThemeLayer, string>>;
  } = { themeByLayer: {} };

  forTenant(id: string): this {
    this._ctx = { ...this._ctx, tenantId: id };
    return this;
  }

  forCompany(id: string): this {
    this._ctx = { ...this._ctx, companyId: id };
    return this;
  }

  forUser(id: string): this {
    this._ctx = { ...this._ctx, userId: id };
    return this;
  }

  platformTheme(id: string): this {
    this._ctx = { ...this._ctx, themeByLayer: { ...this._ctx.themeByLayer, platform: id } };
    return this;
  }

  tenantTheme(id: string): this {
    this._ctx = { ...this._ctx, themeByLayer: { ...this._ctx.themeByLayer, tenant: id } };
    return this;
  }

  companyTheme(id: string): this {
    this._ctx = { ...this._ctx, themeByLayer: { ...this._ctx.themeByLayer, company: id } };
    return this;
  }

  userTheme(id: string): this {
    this._ctx = { ...this._ctx, themeByLayer: { ...this._ctx.themeByLayer, user: id } };
    return this;
  }

  runtimeOverride(id: string): this {
    this._ctx = { ...this._ctx, themeByLayer: { ...this._ctx.themeByLayer, runtime: id } };
    return this;
  }

  accessibilityOverride(id: string): this {
    this._ctx = { ...this._ctx, themeByLayer: { ...this._ctx.themeByLayer, accessibility: id } };
    return this;
  }

  build(): ExperienceResolutionContext {
    return { ...this._ctx, themeByLayer: { ...this._ctx.themeByLayer } };
  }
}
