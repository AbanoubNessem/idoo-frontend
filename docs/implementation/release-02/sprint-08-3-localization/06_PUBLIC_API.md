# Public API Reference

## Injection Tokens

### Culture

| Token | Type | Default |
|---|---|---|
| `CULTURE_PROVIDERS` | `CultureProvider[]` | `[]` |
| `CULTURE_INITIAL_CODE` | `string \| null` | `null` |
| `CULTURE_BROWSER_DETECTION` | `boolean` | `true` |
| `CULTURE_DIAGNOSTICS_ENABLED` | `boolean` | `false` |

### Localization

| Token | Type | Default |
|---|---|---|
| `LOCALIZATION_DEFAULT_LOCALE` | `string` | `'en-US'` |
| `LOCALIZATION_FALLBACK_LOCALE` | `string` | `'en-US'` |
| `LOCALIZATION_CONFIG` | `Partial<LocalizationConfig>` | `{}` |

### Translation

| Token | Type | Default |
|---|---|---|
| `TRANSLATION_PROVIDERS` | `TranslationProvider[]` | `[]` |
| `TRANSLATION_DEFAULT_NAMESPACE` | `string` | `'common'` |
| `TRANSLATION_FALLBACK_LOCALE` | `string` | `'en-US'` |
| `TRANSLATION_CACHE_TTL_MS` | `number` | `1_800_000` (30 min) |
| `TRANSLATION_INTERPOLATION_OPEN` | `string` | `'{{'` |
| `TRANSLATION_INTERPOLATION_CLOSE` | `string` | `'}}'` |

## Service Summary

### CultureRegistryService

| Method | Returns |
|---|---|
| `register(culture, options?)` | `void` |
| `unregister(code)` | `void` |
| `get(code)` | `CultureDefinition \| null` |
| `has(code)` | `boolean` |
| `all()` | `ReadonlyArray<CultureDefinition>` |
| `byLanguage(lang)` | `ReadonlyArray<CultureDefinition>` |
| `byRegion(region)` | `ReadonlyArray<CultureDefinition>` |
| `byTag(tag)` | `ReadonlyArray<CultureDefinition>` |
| `rtlCultures()` | `ReadonlyArray<CultureDefinition>` |
| `defaultCulture()` | `CultureDefinition \| null` |
| `count()` | `number` |

### CultureResolverService

| Method | Returns |
|---|---|
| `resolve(input, policy?)` | `CultureResolutionResult` |
| `resolveEffective(input)` | `EffectiveCulture` |
| `detectBrowser()` | `BrowserCultureInfo \| null` |

### LocalizationEngineService

| Method | Returns |
|---|---|
| `formatDate(date, options?)` | `FormattedDate` |
| `formatDateStyle(date, style)` | `string` |
| `formatTime(date, options?)` | `FormattedDate` |
| `formatDateTime(date, options?)` | `FormattedDate` |
| `formatNumber(value, options?)` | `FormattedNumber` |
| `formatInteger(value)` | `string` |
| `formatPercent(value, decimals?)` | `string` |
| `formatCurrency(amount, currency, options?)` | `FormattedCurrency` |
| `formatRelativeTime(input, locale?)` | `FormattedRelativeTime` |
| `formatRelativeDate(date, locale?)` | `FormattedRelativeTime` |
| `plural(count, locale?)` | `PluralCategory` |
| `detectLocale()` | `string` |
| `isRtl(locale?)` | `boolean` |
| `setLocale(code)` | `void` |

### TranslationEngineService

| Method | Returns |
|---|---|
| `t(key, options?)` | `string` |
| `translate(key, options?)` | `string \| null` |
| `has(key, locale?)` | `boolean` |
| `registerNamespace(ns)` | `void` |
| `mergeNamespace(ns, locale, data)` | `void` |
| `invalidateNamespace(ns, locale?)` | `void` |
| `loadNamespace(ns, locale?)` | `Promise<void>` |
| `loadNamespaces(nss, locale?)` | `Promise<void>` |
| `isLoaded(ns, locale?)` | `boolean` |
| `getMap(ns, locale?)` | `TranslationMap \| null` |
| `namespaces()` | `ReadonlyArray<string>` |
| `serializeNamespace(ns)` | `string` |
| `deserializeNamespace(json)` | `TranslationNamespace` |

## Events

All services expose `events$: Observable<Event>`.

| Engine | Events |
|---|---|
| LocalizationEngine | `locale:changed` |
| TranslationEngine | `translations:loaded`, `translations:invalidated` |
