# Sprint 8.1 — Public API

## Primary Entry Point: `ExperienceEngineService`

```typescript
// Registry
engine.register(dimension, profile, options?)
engine.has(dimension, id)
engine.getProfile(dimension, id)
engine.allProfiles(dimension)

// Apply a full profile
engine.apply(profile: ExperienceProfile)

// Individual dimension setters
engine.setTheme(id)
engine.setLanguage(code)
engine.setLocale(code)
engine.setDensity(id)
engine.setTypography(id)
engine.setIconPack(id)
engine.setBranding(id)

// Reset to defaults
engine.reset()

// Signal accessors (read-only)
engine.themeId:      Signal<string | null>
engine.languageCode: Signal<string>
engine.localeCode:   Signal<string>
engine.direction:    Signal<'ltr' | 'rtl'>
engine.densityId:    Signal<string>
engine.typographyId: Signal<string>
engine.iconPackId:   Signal<string>
engine.brandingId:   Signal<string | null>

// Serialization
engine.serialize(profile): string
engine.deserialize(json): ExperienceProfile
engine.exportCurrentState(): string

// Builder
engine.builder.create(id?)
engine.builder.rtlArabic(id)
engine.builder.default(id)

// Observability
engine.events.events$: Observable<ExperienceEvent>
engine.events.on(type): Observable<ExperienceEvent>
engine.metricsSnapshot(): ExperienceMetricsSnapshot
engine.diagnosticsReport(): ExperienceDiagnosticsReport
engine.phase: ExperiencePhase
```

## Secondary Entry Points

### `ExperienceContext` (injectable computed view)
```typescript
ctx.snapshot():  Signal<ExperienceContextData>
ctx.themeId:     Signal<string | null>
ctx.direction:   Signal<'ltr' | 'rtl'>
ctx.isRtl():     boolean
ctx.isLanguage(code): boolean
ctx.isLocale(code):   boolean
```

### `ExperienceState` (injectable signal store)
Direct injection for services that need to read signals without going through the engine.

### `ExperienceBuilderService` (standalone)
```typescript
builder.create(id?): ExperienceProfileBuilder
// Fluent: .theme(id).language(code).locale(code).density(id)...build()
```

## Injection Tokens

| Token | Type | Default |
|---|---|---|
| `EXPERIENCE_DIAGNOSTICS_ENABLED` | `boolean` | `false` |
| `EXPERIENCE_INITIAL_STATE` | `Partial<ExperienceStateData>` | `{}` |
| `EXPERIENCE_DEFAULT_PROFILE` | `ExperienceProfile \| null` | `null` |
| `EXPERIENCE_STORAGE` | `ExperienceStorageAdapter` | *(not provided — optional)* |

## ExperienceStorageAdapter Interface
```typescript
interface ExperienceStorageAdapter {
  save(state: ExperienceStateData): void;
  load(): Partial<ExperienceStateData> | null;
  clear(): void;
}
```
Wire a concrete implementation in `app.config.ts` to enable persistence.
