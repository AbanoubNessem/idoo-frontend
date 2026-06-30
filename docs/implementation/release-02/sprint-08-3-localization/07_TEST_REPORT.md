# Test Report — Sprint 8.3

## Test Files

| File | Suite | Cases |
|---|---|---|
| `culture/culture-registry.spec.ts` | CultureRegistryService | 17 |
| `culture/culture-resolver.spec.ts` | CultureResolverService | 11 |
| `localization/localization-engine.spec.ts` | LocalizationEngineService | 22 |
| `translation/translation-cache.spec.ts` | TranslationCacheService | 13 |
| `translation/translation-validator.spec.ts` | TranslationValidatorService | 13 |
| `translation/translation-serializer.spec.ts` | TranslationSerializerService | 12 |
| `translation/translation-registry.spec.ts` | TranslationRegistryService | 15 |
| `translation/translation-loader.spec.ts` | TranslationLoaderService | 12 |
| `translation/translation-engine.spec.ts` | TranslationEngineService | 22 |

**Total: 137 test cases**

## Coverage Focus

### Culture Registry

- Auto-registration of 6 built-in cultures
- get() exact match and language-code fallback
- byLanguage(), byRegion(), byTag(), rtlCultures()
- register() error on missing code
- register(isDefault) changes default
- unregister() and count()

### Culture Resolver

- 6-layer resolution order
- User beats tenant; runtime beats user
- Unknown culture → `not-registered` reason
- Unconfigured layer → `not-configured` reason
- resolveEffective() fallback when nothing resolves
- Browser detection disabled in tests

### Localization Engine

- Date formats: short, medium, long, full
- formatTime(), formatDateTime()
- formatNumber() with locale-specific separators
- formatInteger() — no decimals
- formatPercent() — includes %
- formatCurrency() — includes symbol, checks currency field
- formatRelativeTime() — relative wording
- plural() for English count=1/'one' and count=5/'other'
- isRtl() for Arabic and English
- setLocale() emits locale:changed event

### Translation Cache

- TTL expiry (fakeAsync)
- has() eviction, invalidate(ns), invalidate(ns, locale), clear()
- Hit counting in stats()

### Translation Validator

- Valid namespace passes
- Missing namespace/locale → error
- Empty string → warning
- Plural without 'other' → error
- Unbalanced `{{` → warning
- validateMap() keyCount

### Translation Serializer

- JSON round-trip with envelope
- Bare {locale, data} deserialization
- flatten() / unflatten() round-trip
- mergeNamespaces() override and deep merge

### Translation Registry

- Built-in common translations
- Dot-path traversal (nested.deep.value)
- Locale fallback: en-AU → en → en-US
- merge() additive, unregister() by locale and by namespace
- namespaces() and localesForNamespace()

### Translation Loader

- Provider-based loading
- Cache hit on second load (source: 'cache')
- Graceful failure for unknown namespace
- registerProvider / unregisterProvider
- loadMany() with partial failure

### Translation Engine

- t() with namespace:key syntax
- t() interpolation
- t() pluralization (count=1, count=5)
- t() dot-path traversal
- translate() returning null on miss
- has() true/false
- Locale fallback de-DE → en-US
- registerNamespace event
- invalidateNamespace event
- mergeNamespace
- namespaces(), isLoaded()
- Serialization round-trip

## Test Environment Notes

- `TRANSLATION_CACHE_TTL_MS: 200` in cache tests (short TTL for fakeAsync)
- `CULTURE_BROWSER_DETECTION: false` in resolver tests (no navigator access)
- `TRANSLATION_PROVIDERS: []` cleared in loader tests (providers explicitly provided)
- `THEME_AUTO_APPLY: false` not needed here (no theme engine in this sprint)
