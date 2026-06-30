# Sprint 8.2 — Architect Self Review

**Date:** 2026-06-29

---

## SOLID

| Principle | Verdict | Evidence |
|---|---|---|
| S — Single Responsibility | ✅ | Registry stores themes. Validator validates. Loader loads. Cache caches. Serializer converts. Engine orchestrates. Each has one job. |
| O — Open/Closed | ✅ | New theme providers via `ThemeProvider` interface without modifying ThemeLoaderService. New resolution strategies via `ResolutionStrategy` union without modifying pipeline. |
| L — Liskov Substitution | ✅ | `ThemeDefinition extends ThemeProfileStub` — any code expecting `ThemeProfileStub` works with a `ThemeDefinition`. |
| I — Interface Segregation | ✅ | `ThemeProvider.list()` is optional. Resolution layer is independent of theme engine. Components only need `ThemeEngineService`. |
| D — Dependency Inversion | ✅ | `ThemeLoaderService` depends on `ThemeProvider` interface, not concrete implementations. `THEME_RESOLUTION_POLICY` token decouples policy from pipeline. `DOCUMENT` token enables SSR compatibility. |

## Signal Architecture

- `ThemeEngineService.effectiveTheme` is a `computed()` — recomputes when `activeThemeId` changes.
- `activeVariant`, `isDark`, `isHighContrast` are all derived `computed()` signals.
- The `effect()` for DOM application is in the service constructor (not a component) because it
  writes global state (`document.documentElement`). This is a deliberate exception to "effects in
  components" — the Document is a legitimate global side-effect target.
- Tests disable `THEME_AUTO_APPLY` to avoid DOM side-effects.

## Design Token Constraints

All token values are CSS strings — no raw numbers anywhere in engine code. This is enforced by
`ThemeColorTokens`, `ThemeSpacingTokens`, etc. all using `TokenValue = string`. The validator
warns on suspicious values.

## No Circular Dependencies

Verified by inspection:
- `ThemeRegistryService` → `ExperienceRegistryService` — NOT vice versa ✅
- `ThemeEngineService` → `ExperienceEngineService` — NOT vice versa ✅
- Resolution layer → `ExperienceState` — NOT vice versa ✅

## Runtime Theme Switching

1. Component calls `engine.setDarkTheme()`
2. → `ExperienceEngineService.setTheme('platform-dark')`
3. → `ExperienceState._themeId.set('platform-dark')`
4. → `ThemeEngineService.effectiveTheme` recomputes (it reads `activeThemeId()`)
5. → `effect()` fires: `_applyToDom(effectiveTheme())`
6. → CSS variables on `:root` updated
7. → Browser re-renders affected elements
8. No page reload. No full change detection sweep needed (CSS cascade handles it).

## Concerns

1. **`effect()` in service constructor** — Angular's `effect()` in a `providedIn: 'root'` service
   runs in the application injector context. This is supported but unusual. The `ngOnDestroy`
   destroys the effect via `effectRef.destroy()`. This is the correct pattern.

2. **`buildContext()` shortcut on ThemeEngine** — `ThemeEngineService.buildContext()` delegates to
   `ExperienceResolverService.buildContext()`. This couples the engine to the resolver. It is a
   convenience method; callers can always inject `ExperienceResolverService` directly.

3. **Parent theme inheritance** — Currently only one level of inheritance (`parentId`). Recursive
   inheritance chains are not supported intentionally (avoids circular dependency risk at runtime).

## Verdict

**APPROVED for Architecture Review.** Resolution layer is policy-driven and testable.
Theme engine is signal-reactive, CSS-first, and plugin-ready. No engine scope leaked (no
localization, no typography, no density). Scope discipline maintained.

## Next Steps (Sprint 8.3+)

- Translation Engine (extends `LanguageProfileStub`)
- Localization Engine (extends `LocaleProfileStub`)
- Density Engine (extends `DensityProfileStub`)
- Typography Engine (extends `TypographyProfileStub`)
- Icon Registry (extends `IconPackProfileStub`)
- Branding Engine (extends `BrandingProfileStub`)
