# Sprint 8.3 — Architect Self Review

**Date:** 2026-06-30

---

## SOLID

| Principle | Verdict | Evidence |
|---|---|---|
| S — Single Responsibility | ✅ | CultureRegistry only stores. CultureResolver only resolves. LocalizationEngine only formats. TranslationRegistry only looks up keys. TranslationLoader only loads from providers. TranslationEngine orchestrates, does not store. |
| O — Open/Closed | ✅ | New cultures via `CultureProvider`. New translation sources via `TranslationProvider`. New locales need no code changes — register a CultureDefinition. |
| L — Liskov Substitution | ✅ | No class inheritance. `CultureDefinition` is a plain interface. |
| I — Interface Segregation | ✅ | `CultureProvider.list()` optional. `TranslationProvider.listNamespaces()` optional. `LocalizationEngineService.events$` separate from formatting methods. |
| D — Dependency Inversion | ✅ | `LocalizationEngine` and `TranslationEngine` depend on `ExperienceState` (not `ExperienceEngineService`). `CultureResolver` depends on `PLATFORM_ID` token for SSR. All external behavior via tokens. |

## Signal Architecture

- `LocalizationEngine.activeLocale` = `computed(() => ExperienceState.localeCode())`
- `TranslationEngine.activeLocale`  = `computed(() => ExperienceState.localeCode())`
- No effects in these services — formatting is synchronous and demand-driven.
- No `effect()` means no DOM side-effects to worry about in tests.

## No Circular Dependencies

Verified:
- `LocalizationEngine` → `ExperienceState` — NOT vice versa ✅
- `TranslationEngine`  → `ExperienceState` — NOT vice versa ✅
- `TranslationEngine`  → `TranslationRegistry` + `TranslationLoader` — NOT vice versa ✅
- `CultureResolver`    → `CultureRegistry` — NOT vice versa ✅

## Framework Independence

All localization logic uses standard `Intl` APIs — no Angular-specific i18n.
This means:
- Can be unit-tested without Angular TestBed
- Works in Node.js (SSR)
- Not coupled to Angular's locale data or `LOCALE_ID`

The only Angular dependency is `inject()` for DI and `computed()` for signal reactivity.

## Translation Fallback Chain

The 3-tier fallback (locale → language → en-US) is implemented in `TranslationRegistryService.resolve()`.
This is critical for correctness in multi-locale deployments. Edge cases:
- `en-AU` not registered → `en` not registered → `en-US` → returns value ✅
- Completely missing key → returns `null` (translate()) or key (t()) ✅
- Plural fallback: `other` is always required, preventing null returns ✅

## Plural Implementation

`Intl.PluralRules(locale).select(count)` returns `'one'|'two'|'few'|'many'|'other'|'zero'`.
The translation object is tested with `PLURAL_KEYS.has(k)` to detect plural objects vs nested
namespace objects. This heuristic works because namespace objects will have domain-specific keys,
not plural category names.

Edge case: if a namespace object has keys like `{ one: ..., other: ... }` that happen to be
strings, it would be misidentified as a plural object. This is an accepted limitation.

## Concerns

1. **Plural heuristic** — detecting plural objects by checking all keys are in PLURAL_KEYS
   could fail for legitimate namespace objects with those key names. Mitigation: convention
   (namespace authors should not use `one/other/few/many/zero/two` as namespace keys).

2. **TranslationEngine._interpolate regex** — reconstructs the regex on every call when params
   exist but `iOpen` hasn't changed. Could cache the compiled regex if it becomes a perf concern.
   Current performance is acceptable for translation use cases.

3. **CultureResolver browser layer** — `navigator.language` can be `undefined` in some edge
   environments. Handled with `?? 'en-US'` fallback.

## Verdict

**APPROVED for Architecture Review.** Three engines implemented with clean separation.
Native `Intl` API keeps the engine framework-independent. No feature scope was leaked
(no branding, typography, density, icons). Scope discipline maintained.
