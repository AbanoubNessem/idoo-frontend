// ─── Dimensions ───────────────────────────────────────────────────────────────

export type ExperienceDimension =
  | 'theme'
  | 'language'
  | 'locale'
  | 'density'
  | 'typography'
  | 'icon-pack'
  | 'branding';

export type ExperienceDirection = 'ltr' | 'rtl';

// ─── Profile Stubs ────────────────────────────────────────────────────────────
// These are intentionally minimal. Each future engine will extend them.

export interface ExperienceProfileBase {
  readonly id: string;
  readonly name: string;
  readonly kind: ExperienceDimension;
  readonly version?: string;
  readonly description?: string;
  readonly metadata?: unknown;
}

export interface ThemeProfileStub extends ExperienceProfileBase {
  readonly kind: 'theme';
  // Color tokens, elevation, radius — added by Theme Engine
}

export interface LanguageProfileStub extends ExperienceProfileBase {
  readonly kind: 'language';
  readonly code: string;
  readonly nativeName: string;
  readonly direction: ExperienceDirection;
}

export interface LocaleProfileStub extends ExperienceProfileBase {
  readonly kind: 'locale';
  readonly code: string;           // e.g. 'en-US', 'ar-EG'
  readonly languageCode: string;   // e.g. 'en', 'ar'
  readonly currency?: string;
  readonly dateFormat?: string;
  readonly numberFormat?: string;
}

export interface DensityProfileStub extends ExperienceProfileBase {
  readonly kind: 'density';
  readonly level: 'compact' | 'comfortable' | 'spacious';
  // Spacing scale tokens — added by Density Engine
}

export interface TypographyProfileStub extends ExperienceProfileBase {
  readonly kind: 'typography';
  // Font families, scale, line-heights — added by Typography Engine
}

export interface IconPackProfileStub extends ExperienceProfileBase {
  readonly kind: 'icon-pack';
  readonly prefix?: string;
  // Icon map — added by Icon Registry Engine
}

export interface BrandingProfileStub extends ExperienceProfileBase {
  readonly kind: 'branding';
  readonly organizationId?: string;
  // Logo, colors, fonts — added by Branding Engine
}

export type AnyExperienceProfile =
  | ThemeProfileStub
  | LanguageProfileStub
  | LocaleProfileStub
  | DensityProfileStub
  | TypographyProfileStub
  | IconPackProfileStub
  | BrandingProfileStub;

// ─── Profile Map ──────────────────────────────────────────────────────────────

export type DimensionProfileMap = {
  readonly theme:      ThemeProfileStub;
  readonly language:   LanguageProfileStub;
  readonly locale:     LocaleProfileStub;
  readonly density:    DensityProfileStub;
  readonly typography: TypographyProfileStub;
  readonly 'icon-pack': IconPackProfileStub;
  readonly branding:   BrandingProfileStub;
};

// ─── Experience Profile (full bundle) ────────────────────────────────────────

export interface ExperienceProfile {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly themeId?: string;
  readonly languageCode?: string;
  readonly localeCode?: string;
  readonly densityId?: string;
  readonly typographyId?: string;
  readonly iconPackId?: string;
  readonly brandingId?: string;
  readonly metadata?: unknown;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export interface ExperienceRegistryEntry<T extends ExperienceProfileBase = ExperienceProfileBase> {
  readonly profile: T;
  readonly dimension: ExperienceDimension;
  readonly registeredAt: string;
  readonly version?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly isDefault?: boolean;
}

// ─── State Snapshot ───────────────────────────────────────────────────────────

export interface ExperienceStateData {
  readonly themeId: string | null;
  readonly languageCode: string;
  readonly localeCode: string;
  readonly direction: ExperienceDirection;
  readonly densityId: string;
  readonly typographyId: string;
  readonly iconPackId: string;
  readonly brandingId: string | null;
}

// ─── Context Snapshot (includes resolved profiles) ────────────────────────────

export interface ExperienceContextData {
  readonly state: ExperienceStateData;
  readonly resolvedAt: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type ExperienceEventType =
  | 'experience:initialized'
  | 'experience:applied'
  | 'experience:reset'
  | 'theme:changed'
  | 'language:changed'
  | 'locale:changed'
  | 'direction:changed'
  | 'density:changed'
  | 'typography:changed'
  | 'icon-pack:changed'
  | 'branding:changed'
  | 'profile:registered'
  | 'profile:unregistered'
  | 'experience:error';

export interface ExperienceEvent {
  readonly type: ExperienceEventType;
  readonly timestamp: string;
  readonly payload: unknown;
  readonly previous?: unknown;
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export type ExperiencePhase =
  | 'created'
  | 'initializing'
  | 'ready'
  | 'applying'
  | 'error';

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface ExperienceMetricsSnapshot {
  readonly applyCount: number;
  readonly changeCount: Record<ExperienceDimension, number>;
  readonly lastApplyMs: number;
  readonly avgApplyMs: number;
  readonly errorCount: number;
  readonly initializedAt: string;
  readonly lastActivityAt: string;
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

export interface ExperienceDiagnosticsReport {
  readonly phase: ExperiencePhase;
  readonly currentState: ExperienceStateData;
  readonly registeredProfiles: Record<ExperienceDimension, number>;
  readonly totalProfiles: number;
  readonly metrics: ExperienceMetricsSnapshot;
  readonly diagnosticsEnabled: boolean;
  readonly generatedAt: string;
}

// ─── Serialization ────────────────────────────────────────────────────────────

export interface SerializedExperienceProfile {
  readonly schema: '1.0';
  readonly profile: ExperienceProfile;
  readonly serializedAt: string;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export interface ExperienceProfileBuilder {
  theme(id: string): ExperienceProfileBuilder;
  language(code: string): ExperienceProfileBuilder;
  locale(code: string): ExperienceProfileBuilder;
  density(id: string): ExperienceProfileBuilder;
  typography(id: string): ExperienceProfileBuilder;
  iconPack(id: string): ExperienceProfileBuilder;
  branding(id: string): ExperienceProfileBuilder;
  name(n: string): ExperienceProfileBuilder;
  version(v: string): ExperienceProfileBuilder;
  metadata(m: unknown): ExperienceProfileBuilder;
  build(): ExperienceProfile;
}
