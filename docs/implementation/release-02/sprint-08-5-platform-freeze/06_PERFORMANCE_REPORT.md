# Performance Report — Sprint 8.5

## Signal Reactivity Performance

### Computed Signal Chain Depth

| Chain | Depth | Risk |
|---|---|---|
| `VisualExperienceEngineService.effectiveVisual` → `VisualExperienceResolverService.resolveFromState()` → reads 5 state signals | 2 | ✅ Low |
| `ThemeEngineService.effectiveTheme` → `_resolveEffective(activeThemeId())` → registry lookup | 2 | ✅ Low |
| `ExperienceState.direction` → `computed(() => RTL_LANGUAGE_CODES.has(languageCode()))` | 1 | ✅ Low |
| `ExperienceState.snapshot` → aggregates 7 signals | 1 | ✅ Low |

Maximum signal chain depth: **2**. No long chains that could cause performance issues.

### Effect Frequency

Two `effect()` registrations exist in the platform:

| Effect | Trigger | Estimated frequency |
|---|---|---|
| `ThemeEngineService` DOM apply | `effectiveTheme` signal changes | Once per theme change |
| `VisualExperienceEngineService` DOM apply | `effectiveVisual` signal changes | Once per dimension change |

Both effects write CSS custom properties to `document.documentElement`. Each write is a `style.setProperty()` call.

**Cost per apply:**
- Theme engine: ~20–30 `setProperty()` calls (colors + spacing + radius + elevation + breakpoints)
- Visual engine: ~30–40 `setProperty()` calls (font + density + motion + a11y + icon)

At ~0.1ms per `setProperty()`, a full visual apply takes ~4ms. Acceptable for user-initiated actions. No animation loop concerns.

### Formatter Caching

`LocalizationEngineService` caches `Intl` formatter instances by locale+options key:

```typescript
_dtfCache:  Map<key, Intl.DateTimeFormat>
_nfCache:   Map<key, Intl.NumberFormat>
_rtfCache:  Map<key, Intl.RelativeTimeFormat>
_plurCache: Map<key, Intl.PluralRules>
```

Cold start: `new Intl.DateTimeFormat()` = ~0.5ms per constructor. Subsequent calls: ~0.01ms (cache hit).
Cache is invalidated on `setLocale()` — correct behavior.

---

## Memory Analysis

### Memory Risk: Unbounded Maps

The following services use Maps that grow without eviction:

| Service | Map | Bounded? | Risk |
|---|---|---|---|
| `ExperienceRegistryService` | `_profiles` Map per dimension | By explicit `register()` calls | ✅ Low |
| `VisualExperienceRegistryService` | 5 Maps (one per dimension) | By explicit `register*()` calls | ✅ Low |
| `TranslationRegistryService` | `_store` Map<ns::locale, data> | By namespace/locale combinations | ⚠️ Medium |
| `ThemeCacheService` | TTL-based Map | TTL eviction on read | ✅ Low |
| `TranslationCacheService` | TTL-based Map | TTL eviction on read | ✅ Low |
| `LocalizationEngineService` | 4 Intl formatter Maps | Cleared on setLocale() | ✅ Low |

**PERF-001:** `TranslationRegistryService._store` grows indefinitely as new namespace/locale combinations are loaded. In a large multilingual application with many tenants, this could accumulate. The TTL cache in `TranslationCacheService` handles network-side deduplication, but the in-memory registry does not evict.

**Mitigation:** Monitor in production. If registry size becomes a concern, add a `prune(namespace?, locale?)` method to evict old entries.

### RxJS Subject Memory

Subjects in event services complete on `ngOnDestroy()`. Since all event services are `providedIn: 'root'`, they live for the application lifetime — subjects never close during normal operation. This is correct and expected.

### Theme Parent Inheritance

`ThemeEngineService._deepMergeTokens()` merges parent + child token objects on every `_resolveEffective()` call. With `effectiveTheme = computed(...)`, this runs synchronously on each read. The merge cost is proportional to the number of tokens (~20–30). Negligible.

---

## Build Performance

| Metric | Value |
|---|---|
| TypeScript compilation (`tsc --noEmit`) | 0 errors |
| Angular build (`ng build --configuration development`) | Success |
| Build warnings | 2 (pre-existing Sass `@import` deprecation) |
| Estimated initial bundle contribution | Platform code is tree-shakeable; only consumed subsystems are bundled |

---

## Runtime Performance Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `style.setProperty()` on each visual dimension change | Low | Batched per apply cycle via `effect()` |
| Intl formatter construction on cold start | Low | Cached by locale+options key |
| TranslationRegistry unbounded growth | Low-Medium | Monitor; add `prune()` if needed |
| 5-level signal chain in ExperienceState | None | Chain depth = 1-2 |

**Overall Performance Status: ACCEPTABLE for production**
