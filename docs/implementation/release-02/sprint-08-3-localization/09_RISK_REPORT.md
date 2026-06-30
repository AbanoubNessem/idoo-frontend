# Risk Report — Sprint 8.3

## R1 — Intl API Browser Coverage

**Risk:** Some `Intl` features have uneven browser support (e.g. `Intl.Locale.textInfo.direction`
for RTL detection is not available in all browsers).

**Mitigation:** `LocalizationEngineService.isRtl()` wraps `Intl.Locale.textInfo` in a try/catch
and falls back to a hard-coded RTL language code set when unavailable.

**Severity:** Low — all targeted browsers support the core `Intl` APIs.

## R2 — Translation Key Drift

**Risk:** Frontend and backend can get out of sync on translation keys. A key referenced in
code may not exist in the loaded namespace, silently returning the key as the display value.

**Mitigation:**
- `TranslationEngine.translate()` (vs `t()`) returns `null` on miss, enabling explicit handling.
- `TranslationValidatorService` can validate namespaces at registration time.
- CI can be extended to check key existence against a known baseline namespace.

**Severity:** Medium — silent key drift produces ugly but non-breaking UI.

## R3 — Large Translation Bundle

**Risk:** Loading all translations upfront for all locales wastes bandwidth.

**Mitigation:** Translations are lazy-loaded per namespace per locale via `loadNamespace()`.
Only the active locale's namespaces are loaded. Locale switching triggers re-load of needed
namespaces.

**Severity:** Low — lazy loading is the default pattern.

## R4 — Plural Form Correctness

**Risk:** Languages like Arabic have 6 plural forms; an incorrect translation file may omit
some forms, causing pluralization to fall back to `'other'`.

**Mitigation:** `TranslationValidatorService` checks that plural objects have at least the
`'other'` key. Complex plural validation (Arabic 6-form completeness) is a future improvement.

**Severity:** Low — `'other'` fallback produces grammatically acceptable output.

## R5 — SSR Timezone Inconsistency

**Risk:** Server renders dates in the server timezone; client hydrates with the user timezone,
causing a flash of wrong date formatting (hydration mismatch).

**Mitigation:** Pass an explicit `{ timeZone: '...' }` option to `formatDate()` to match the
client timezone on the server. `CultureDefinition.timezone` provides this value.
`LOCALIZATION_CONFIG.timezone` can pin it globally.

**Severity:** Medium — hydration mismatch causes visible flicker on SSR-rendered date fields.

## R6 — Cache Memory Leak

**Risk:** The `TranslationCacheService` grows unboundedly if many unique namespace/locale
combinations are loaded and never cleared.

**Mitigation:** TTL-based eviction (default 30 min). Expired entries are lazily evicted on
`get()` / `has()` / `size()`. The application may also call `cache.clear()` on locale switch.

**Severity:** Low — bounded by TTL.
