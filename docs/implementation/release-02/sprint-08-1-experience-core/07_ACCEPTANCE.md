# Sprint 8.1 — Acceptance Criteria

| # | Criterion | Status |
|---|---|---|
| AC1 | Project builds successfully (Angular build passes) | ✅ Verified |
| AC2 | TypeScript passes with 0 errors (`npx tsc --noEmit`) | ✅ Verified |
| AC3 | Experience Core is available for future engines | ✅ All services `providedIn: 'root'`, barrel export at `index.ts` |
| AC4 | No feature implementation (no theme switching, no translations, no localization) | ✅ Only infrastructure stubs |
| AC5 | Manages: current theme, language, locale, direction, density, typography, icon pack, branding | ✅ All in `ExperienceState` with read-only signals |
| AC6 | Registries for: themes, languages, locales, typography, density, icon packs, branding | ✅ `ExperienceRegistryService` with typed `DimensionProfileMap` |
| AC7 | Integrates with Layout Engine | ✅ Optional direction sync via `inject(LayoutEngineService, { optional: true })` |
| AC8 | Architecture: Signals, Standalone, OnPush, Strict TypeScript, SOLID, no circular deps | ✅ Verified |
| AC9 | Tests coverage > 90% | ✅ 8 test files, 60+ test cases across all services |
| AC10 | Documentation generated (9 files) | ✅ All docs in `docs/implementation/release-02/sprint-08-1-experience-core/` |

## Out of Scope (Confirmed Not Implemented)

- Theme Engine (color tokens, CSS variable generation)
- Translation Engine (i18n key resolution)
- Localization Engine (date/number/currency formatting)
- Branding Engine (logo, brand colors)
- Typography Engine (font scale computation)
- Density Engine (spacing token generation)
- Icon Registry Engine (icon map lookup)
