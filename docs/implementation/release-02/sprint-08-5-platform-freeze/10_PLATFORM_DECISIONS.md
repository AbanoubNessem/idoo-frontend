# Platform Architecture Decisions — Sprint 8.5

Architectural decisions made during Sprints 2–8.4, recorded for future reference.

---

## ADR-001: Angular Signals as the State Primitive

**Sprint:** 8.1  
**Decision:** Use Angular 22 `signal()` / `computed()` / `effect()` as the exclusive state primitive for all Release 2 engines. No NgRx, BehaviorSubject-as-state, or service-with-property patterns.

**Rationale:**
- Zero external dependencies
- Framework-native; Angular's change detection integrates without `async` pipe or `markForCheck()`
- `computed()` provides automatic memoization
- `effect()` for DOM side-effects runs synchronously after signal changes, in the correct zone

**Consequence:** Pre-R2 `ui/` layer remains non-signal (imperative). This is DEBT-001.

---

## ADR-002: Single Source of Truth in ExperienceState

**Sprint:** 8.1  
**Decision:** `ExperienceState` is the single writable store for all shared experience dimensions (themeId, languageCode, localeCode, densityId, typographyId, iconPackId, brandingId). No engine should maintain its own writable copy.

**Rationale:** Prevents split-brain between engines. ThemeEngine and VisualEngine both read from ExperienceState rather than maintaining separate stores.

**Consequence:** `VisualExperienceState` exposes `typographyId`, `densityId`, `iconPackId` as `computed()` projections, not new writable signals.

---

## ADR-003: CSS Custom Properties as the Token Contract

**Sprint:** 8.2  
**Decision:** All design tokens applied to `document.documentElement` as `--platform-*` CSS custom properties. Components consume tokens via `var(--platform-color-primary)` etc., not via TypeScript service calls.

**Rationale:**
- Zero coupling between component templates and Angular DI
- SSR-compatible (CSS is static; dynamic values overridden at hydration time)
- Supports theming via CSS selector overrides for any CSS technology (Tailwind, SCSS, inline styles)

**Consequence:** Two `effect()` registrations apply tokens reactively (ThemeEngine for colors/spacing, VisualEngine for typography/density/motion).

---

## ADR-004: Resolution Pipeline as the Multi-Tenant Contract

**Sprint:** 8.2  
**Decision:** A layered resolution pipeline (Platform → Tenant → Company → User → Accessibility → Runtime) resolves the effective experience. Each layer can override the previous; later layers win.

**Rationale:** Enterprise SaaS requires multi-tenant theming. The pipeline scales from single-tenant (only platform layer) to full tenant+company+user customization without code changes.

**Consequence:** Resolver must be consulted before applying tokens. `resolveFromState()` is the convenience path for the common case.

---

## ADR-005: Native `Intl` API — No External i18n Library

**Sprint:** 8.3  
**Decision:** All formatting (dates, numbers, currency, relative time, pluralization) uses the native `Intl` API. No external localization library (i18next, ngx-translate, Angular i18n) is used.

**Rationale:**
- Zero bundle weight
- Fully supports Arabic/RTL, Islamic calendars, Arabic numerals
- `Intl.PluralRules` handles plural categories for all supported languages
- Constructor caching makes repeated calls cheap

**Consequence:** The Stage-3 `Intl.Locale.textInfo.direction` API requires `as any` cast. RTL detection falls back to a language code list if the Stage-3 API is unavailable.

---

## ADR-006: No Parent Chain Recursion in Theme Inheritance

**Sprint:** 8.2  
**Decision:** Theme parent inheritance is 1 level deep only. A child theme can reference a `parentId`; the parent's tokens are merged first, then the child overlays. Grandparent chains are not resolved.

**Rationale:** Prevents infinite recursion. 1-level inheritance satisfies all current tenant scenarios (base theme → tenant override).

---

## ADR-007: Translation Load Deduplication via Pending Map

**Sprint:** 8.3  
**Decision:** `TranslationEngineService` maintains a `Map<string, Promise<void>>` to deduplicate in-flight loads. If `loadNamespace('forms', 'en-US')` is called twice concurrently, only one provider request is issued.

**Rationale:** Angular route guards and lazy-loaded modules may call `loadNamespace()` simultaneously. Without deduplication, redundant HTTP requests would occur.

---

## ADR-008: VisualExperienceState Owns motionId/accessibilityId Only

**Sprint:** 8.4  
**Decision:** `typographyId`, `densityId`, `iconPackId` are owned by `ExperienceState` (shared with ExperienceEngine). Only `motionId`, `accessibilityId`, and the boolean override flags (`reducedMotion`, `largeTypography`, `focusVisible`) are owned by `VisualExperienceState`.

**Rationale:** Avoids duplicating the signal store. `ExperienceEngineService.setTypography()` etc. already handle the shared prefs — the VisualEngine should delegate, not duplicate.

---

## ADR-009: VISUAL_AUTO_APPLY Token for Test Isolation

**Sprint:** 8.4  
**Decision:** `VISUAL_AUTO_APPLY = new InjectionToken<boolean>('VISUAL_AUTO_APPLY', { factory: () => true })`. Tests provide `{ provide: VISUAL_AUTO_APPLY, useValue: false }` to disable DOM writes.

**Rationale:** DOM writes in test environments interfere with other tests. The same pattern was established in Sprint 8.2 with `THEME_AUTO_APPLY`.

---

## ADR-010: `providedIn: 'root'` for All Platform Services

**Sprint:** 2–8.4  
**Decision:** All platform services use `@Injectable({ providedIn: 'root' })`. No module-scoped providers.

**Rationale:** Angular 22 standalone application architecture. NgModules are not used. Tree-shaking handles unused services.

**Consequence:** Platform services are singletons for the application lifetime. Services that need per-form or per-component instances use instance classes (e.g., `DynamicFormState`, `DynamicFormHistory`) rather than services.
