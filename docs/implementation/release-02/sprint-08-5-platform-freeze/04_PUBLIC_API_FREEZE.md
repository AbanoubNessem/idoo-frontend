# Public API Freeze — Sprint 8.5

## Status: FROZEN as of 2026-06-30

The following public APIs are frozen for the Dynamic Table Engine (Sprint 9+) and must not be changed without an Architecture Review.

---

## Experience Core API (Sprint 8.1)

```typescript
// ExperienceEngineService — Public API
apply(profile: ExperienceProfile): void
setTheme(id: string | null): void
setLanguage(code: string): void
setLocale(code: string): void
setDensity(id: string): void
setTypography(id: string): void
setIconPack(id: string): void
setBranding(id: string | null): void
reset(): void
register<D>(dimension, profile, options?): void
has(dimension, id): boolean
getProfile<D>(dimension, id): DimensionProfileMap[D] | null
allProfiles<D>(dimension): ReadonlyArray<DimensionProfileMap[D]>
serialize(profile): string
deserialize(json): ExperienceProfile
exportCurrentState(): string
metricsSnapshot(): ExperienceMetricsSnapshot
diagnosticsReport(): ExperienceDiagnosticsReport

// Signals
readonly themeId:      Signal<string | null>
readonly languageCode: Signal<string>
readonly localeCode:   Signal<string>
readonly direction:    Signal<'ltr' | 'rtl'>
readonly densityId:    Signal<string>
readonly typographyId: Signal<string>
readonly iconPackId:   Signal<string>
readonly brandingId:   Signal<string | null>
```

## Theme Engine API (Sprint 8.2)

```typescript
// ThemeEngineService — Public API
setTheme(id: string): Promise<void>
getTheme(id: string): ThemeDefinition | null
allThemes(): ReadonlyArray<ThemeDefinition>
registerTheme(theme: ThemeDefinition): void

// Signals
readonly activeThemeId: Signal<string | null>
readonly effectiveTheme: Signal<EffectiveTheme>
readonly isDark: Signal<boolean>
readonly isHighContrast: Signal<boolean>
```

## Localization API (Sprint 8.3)

```typescript
// TranslationEngineService — Public API
t(key: string, options?: TranslationOptions): string
translate(key, options?): string | null
has(key, locale?): boolean
registerNamespace(ns: TranslationNamespace): void
mergeNamespace(namespace, locale, data): void
loadNamespace(namespace, locale?): Promise<void>
loadNamespaces(namespaces, locale?): Promise<void>
isLoaded(namespace, locale?): boolean

// Signals
readonly activeLocale: Signal<string>
readonly activeLanguage: Signal<string>

// LocalizationEngineService — Public API
formatDate(date, options?): FormattedDate
formatTime(date, options?): FormattedDate
formatDateTime(date, options?): FormattedDate
formatNumber(value, options?): FormattedNumber
formatCurrency(amount, currency, options?): FormattedCurrency
formatRelativeTime(input, locale?): FormattedRelativeTime
formatRelativeDate(date, locale?): FormattedRelativeTime
plural(count, locale?): PluralCategory
isRtl(locale?): boolean
setLocale(code: string): void
```

## Visual Experience Engine API (Sprint 8.4)

```typescript
// VisualExperienceEngineService — Public API
setTypography(id: string): void
setDensity(id: string): void
setIconPack(id: string): void
setMotion(id: string): void
setAccessibility(id: string): void
setReducedMotion(value: boolean): void
setLargeTypography(value: boolean): void
setFocusVisible(value: boolean): void
resolve(input: VisualResolutionInput): EffectiveVisualExperience
registerTypography(p: TypographyProfile): void
registerDensity(p: DensityProfile): void
registerIconPack(p: IconPackProfile): void
registerMotion(p: MotionProfile): void
registerAccessibility(p: AccessibilityProfile): void
diagnosticsReport(): VisualDiagnosticsReport
metricsSnapshot(): VisualMetricsSnapshot
reset(): void

// Signals
readonly effectiveVisual: Signal<EffectiveVisualExperience>
readonly typography:      Signal<TypographyProfile>
readonly density:         Signal<DensityProfile>
readonly iconPack:        Signal<IconPackProfile>
readonly motion:          Signal<MotionProfile>
readonly accessibility:   Signal<AccessibilityProfile>
readonly reducedMotion:   Signal<boolean>
readonly largeTypography: Signal<boolean>
readonly focusVisible:    Signal<boolean>
```

## Layout Engine API (Sprint 7)

```typescript
// LayoutEngineService — Public API
setLayout(config: LayoutDefinition): void
setDirection(direction: 'ltr' | 'rtl'): void
register(definition: LayoutDefinition): void
getDefinition(id: string): LayoutDefinition | null
allDefinitions(): ReadonlyArray<LayoutDefinition>
render(id: string, target: HTMLElement): void
reset(): void
diagnosticsReport(): LayoutDiagnosticsReport
```

## Dynamic Form Engine API (Sprint 6)

```typescript
// DynamicFormEngineService — Public API
create(config: FormConfig): DynamicFormState
getForm(formId: string): DynamicFormState | null
allForms(): ReadonlyArray<DynamicFormState>
destroyForm(formId: string): void
serialize(config: FormConfig): string
deserialize(json: string): FormConfig
```

## Metadata Engine API (Sprint 2)

```typescript
// MetadataEngineService — Public API
load(entityType: string): Promise<EntityMetadata>
get(entityType: string): EntityMetadata | null
register(metadata: EntityMetadata): void
has(entityType: string): boolean
invalidate(entityType: string): void
```

---

## Injection Tokens — Frozen

All `InjectionToken` constants in `*.tokens.ts` files are frozen. New tokens may be added; existing tokens must not be renamed or have their type signature changed.

| Token | File | Type |
|---|---|---|
| `EXPERIENCE_INITIAL_STATE` | experience.tokens.ts | `Partial<ExperienceStateData>` |
| `EXPERIENCE_STORAGE` | experience.tokens.ts | `ExperienceStorage` |
| `EXPERIENCE_DEFAULT_PROFILE` | experience.tokens.ts | `ExperienceProfile` |
| `THEME_AUTO_APPLY` | theme.tokens.ts | `boolean` |
| `THEME_RESOLUTION_POLICY` | theme.tokens.ts | `ExperienceResolutionPolicy` |
| `THEME_PROVIDERS` | theme.tokens.ts | `ThemeProvider[]` |
| `TRANSLATION_DEFAULT_NAMESPACE` | translation.tokens.ts | `string` |
| `TRANSLATION_FALLBACK_LOCALE` | translation.tokens.ts | `string` |
| `VISUAL_AUTO_APPLY` | visual.tokens.ts | `boolean` |
| `VISUAL_PROVIDERS` | visual.tokens.ts | `VisualExperienceProvider[]` |
| `LAYOUT_DEFAULT_CONFIG` | layout.tokens.ts | `Partial<LayoutDefinition>` |

---

## CSS Custom Properties — Frozen

All `--platform-*` variables are frozen. New variables may be added. Existing names must not change.

| Namespace | Count | Examples |
|---|---|---|
| `--platform-color-*` | ~20 | primary, background, surface, border |
| `--platform-spacing-*` | ~12 | 1, 2, 4, 8, 12, 16 |
| `--platform-radius-*` | ~6 | sm, md, lg, full |
| `--platform-elevation-*` | ~5 | 0, 1, 2, 3, 4 |
| `--platform-font-*` | ~20 | family-base, size-base, weight-normal |
| `--platform-density-*` | ~10 | height-md, padding-md, gap-md |
| `--platform-motion-*` | ~6 | duration-normal, easing-standard |
| `--platform-a11y-*` | ~4 | high-contrast, reduced-motion |
| `--platform-icon-*` | ~3 | pack, prefix |

## HTML Attributes — Frozen

| Attribute | Values | Set by |
|---|---|---|
| `data-theme` | `'light' \| 'dark' \| 'high-contrast'` | ThemeEngineService |
| `data-theme-id` | theme ID string | ThemeEngineService |
| `data-typography` | typography profile ID | VisualExperienceEngineService |
| `data-density` | `'compact' \| 'comfortable' \| 'spacious'` | VisualExperienceEngineService |
| `data-reduced-motion` | `'true' \| 'false'` | VisualExperienceEngineService |
| `data-high-contrast` | `'true' \| 'false'` | VisualExperienceEngineService |
| `data-focus-visible` | `'true' \| 'false'` | VisualExperienceEngineService |
| `data-icon-pack` | icon pack ID | VisualExperienceEngineService |
