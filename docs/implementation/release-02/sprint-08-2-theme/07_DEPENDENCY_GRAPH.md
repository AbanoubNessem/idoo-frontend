# Dependency Graph — Sprint 8.2

## Resolution Layer

```
experience-resolution-policy.ts       (no deps)
    ↓ imports ThemeLayer
experience-resolution-context.ts      → theme.types (ThemeLayer)
    ↓
experience-resolution-pipeline.service.ts  → context, policy, theme.types, theme.tokens (THEME_RESOLUTION_POLICY)
    ↓
experience-resolver.service.ts        → pipeline, experience-state
```

## Theme Engine

```
theme.types.ts                 → experience.types (ThemeProfileStub)
theme.constants.ts             → theme.types, resolution-policy
theme.tokens.ts                → theme.types, resolution-policy

theme-validator.service.ts     → theme.types, theme.constants
theme-serializer.service.ts    → theme.types, theme.constants
theme-cache.service.ts         → theme.types, theme.tokens (THEME_CACHE_TTL_MS)
theme-loader.service.ts        → theme.types, theme.tokens, theme-cache.service
theme-registry.service.ts      → theme.types, theme.constants, experience-registry.service, theme-validator

theme-engine.service.ts        → all of the above
                                → experience-engine.service (for setTheme/themeId)
                                → experience-resolver.service
                                → DOCUMENT (from @angular/common)
                                → THEME_AUTO_APPLY, THEME_INITIAL_ID tokens
```

## Cross-Module Dependencies

```
Sprint 8.1 (Experience Core)          Sprint 8.2 (Resolution + Theme)
─────────────────────────────         ──────────────────────────────────
ExperienceState             ←── used by ExperienceResolverService
ExperienceRegistryService   ←── used by ThemeRegistryService
ExperienceEngineService     ←── used by ThemeEngineService (setTheme, themeId)
experience.types            ←── ThemeProfileStub extended by ThemeDefinition
```

## No Circular Dependencies

Verified:
- `ThemeRegistryService` → `ExperienceRegistryService` ✅ (not vice versa)
- `ThemeEngineService` → `ExperienceEngineService` ✅ (not vice versa)
- `ExperienceResolverService` → `ExperienceState` ✅ (not vice versa)

## Angular DI Scope

All services are `providedIn: 'root'` — application singletons.
`ThemeProvider` implementations are registered at runtime; they are not services.

## Optional Dependencies

None in Sprint 8.2. All dependencies are hard requirements (unlike Layout Engine → Theme
Engine which is optional in both directions).
