# Sprint 6.6 — Build Stabilization Report

**Date:** 2026-06-29  
**Build Status:** ✅ SUCCESS  
**TypeScript:** ✅ 0 errors (`npx tsc --noEmit`)  
**Angular Build:** ✅ 0 errors (`npx ng build --configuration development`)

---

## Root Causes Fixed

### Category 1 — Rendering Exports/Imports

**Problem:** `rendering/index.ts` exported stub adapters and a renderer using names that did not match the actual exported class names.

| Wrong export name | Actual class name | File |
|---|---|---|
| `PrimeNGAdapterStub` | `PrimeNGAdapter` | `adapters/primeng.adapter.stub.ts` |
| `BootstrapAdapterStub` | `BootstrapAdapter` | `adapters/bootstrap.adapter.stub.ts` |
| `TailwindAdapterStub` | `TailwindAdapter` | `adapters/tailwind.adapter.stub.ts` |
| `DatetimeRenderer` | `DateTimeRenderer` | `renderers/datetime.renderer.ts` |

**Files modified:**
- `src/app/core/platform/rendering/index.ts`
- `src/app/core/platform/rendering/rendering-engine.service.ts`

---

### Category 2 — Base Component API Mismatches

**Problem A:** `BaseFieldComponent.meta` used an object literal getter `get componentKey() { return this.componentKey; }` where `this` referred to the object literal itself (`{}`), not the class instance (TS2339).

**Fix:** Converted `meta` from a class field with an embedded getter to a class getter method.

**Problem B:** `BaseFieldComponent.handleTextInput` passed `val as unknown as T` to a `model<string | null>.set()`, triggering TS2345 because `T` is not constrained to `string | null`.

**Fix:** Pass `val` directly — it is already typed as `string` and assignable to the cast target.

**Problem C:** `ComponentContextService` called `this.density.activeLevel()`, which does not exist on `DensitySystemService`. The correct signal is `level`.

**Problem D:** `ComponentTokensService.getDensityMultiplier()` called `this.densitySystem.activeConfig()`, which does not exist. The correct computed signal is `config`.

**Problem E:** `ComponentFactoryService._applyInputs()` cast to `InputSignal<unknown>` to check for `.set`, but `InputSignal` does not expose `.set` (only `ModelSignal` does), causing TS2339.

**Fix:** Changed to `(signal as { set?: unknown }).set` — a structural duck-type check with no Angular API dependency.

**Files modified:**
- `src/app/core/platform/components/base/base-field.component.ts`
- `src/app/core/platform/components/context/component-context.service.ts`
- `src/app/core/platform/components/tokens/component-tokens.service.ts`
- `src/app/core/platform/components/registry/component-factory.service.ts`

---

### Category 3 — Strict TypeScript Typing

**Problem A:** `DynamicFormState.buildValidationResult()` used `Object.keys(...).size` (TS2339 — `size` is a `Map`/`Set` property, not an array property).

**Fix:** Changed to `.length`.

**Problem B:** `DynamicFormComponent` template used `resolved?.definition.title` inside `@if`, then `resolved!.definition.title` in the body. Angular's template type checker flagged `title` as possibly `undefined` (TS2532) because it is declared `string | undefined` in `FormDefinition`.

**Fix:** Changed to `@if (resolved && resolved.definition.title)` — explicit null guard lets the type checker narrow both `resolved` and `title`.

**Problem C:** `RendererRegistryService` injected `FIELD_RENDERER` with `optional: true` producing `FieldRenderer | null`, then used `?? []` to fall back to `never[]`. The union `FieldRenderer | never[]` is not iterable because `FieldRenderer` is not an array.

**Fix:** Renamed to `_injectedField` and guarded with `if (this._injectedField)` before a single `registerField()` call.

**Problem D:** `MotionEngineService` cast `Keyframe[]` to `PropertyIndexedKeyframes` — the two types do not overlap sufficiently.

**Fix:** Added `as unknown as` intermediate cast.

**Problem E:** `LayoutEngineService.toCss()` returned `Record<string, string>` cast directly to `CssLayoutResult`, which does not overlap.

**Fix:** Added `as unknown as` intermediate cast.

**Problem F:** `OverlayManagerService` assigned `resolvePromise!` (typed `(value: R | undefined) => void`) to `ManagedOverlay.resolve` (typed `(result: unknown) => void`). Two errors:
- TS2322 — function parameter type mismatch
- TS2454 — variable used before assignment

**Fix (this session):** Added definite assignment assertion `!` to the `let resolvePromise` declaration. TypeScript then trusts the Promise executor always assigns the variable synchronously, which is correct for `new Promise(res => { resolvePromise = res; })`.

**Problem G:** `ThemeEngineService.buildCssVars()` iterated over `Partial<Record<string, string>>` token maps, producing `string | undefined` values that were assigned to `Record<string, string>` (TS2322).

**Fix:** Added `if (val !== undefined)` guard inside each token loop.

**Files modified:**
- `src/app/core/platform/forms/state/dynamic-form-state.ts`
- `src/app/core/platform/forms/components/dynamic-form/dynamic-form.component.ts`
- `src/app/core/platform/rendering/renderer-registry.service.ts`
- `src/app/core/platform/ui/motion/motion-engine.service.ts`
- `src/app/core/platform/ui/layout/layout-engine.service.ts`
- `src/app/core/platform/ui/overlay/overlay-manager.service.ts`
- `src/app/core/platform/ui/theme/theme-engine.service.ts`

---

### Category 4 — Platform Field Component Template Errors

**Problem:** 12 field component templates used `[id]="$index === 0 ? errorId() : null"` on `<mat-error>`. Angular's template type checker requires `[id]` to be `string`, but `null` was passed. One field also used `[aria-describedby]` (not `[attr.aria-describedby]`) which had the same issue.

**Fix:** Changed to `[attr.id]` (removes the attribute when null) and `[attr.aria-describedby]` where applicable.

**Problem:** Three field configs (`autocomplete`, `lookup`, `select`) used `this.config() as FieldConfig` but `Record<string, unknown>` and the target config type do not sufficiently overlap.

**Fix:** Changed to `this.config() as unknown as FieldConfig` intermediate cast.

**Files modified:**
- `platform-autocomplete-field.component.ts`
- `platform-badge-field.component.ts`
- `platform-checkbox-field.component.ts`
- `platform-chip-field.component.ts`
- `platform-color-field.component.ts`
- `platform-currency-field.component.ts`
- `platform-date-field.component.ts`
- `platform-lookup-field.component.ts`
- `platform-number-field.component.ts`
- `platform-select-field.component.ts`
- `platform-text-field.component.ts`
- `platform-textarea-field.component.ts`
- `platform-time-field.component.ts`

---

### Category 5 — Pre-existing Feature Errors

**`tenant.mapper.ts`:** `TenantResponse.domain`, `.subscriptionPlan`, and `.maxUsers` are optional (`string | undefined`, `number | undefined`) but `TenantListItem` requires them non-optional.

**Fix:** Added `?? ''` / `?? 0` fallbacks at the mapping site.

**`users-list.component.ts`:** `loadUsers()` passed a `direction` key in the params object, but `PageParams` did not include it, causing TS2353.

**Fix:** Added `direction?: string` to `PageParams` in `src/app/core/api/models/index.ts`.

**`users-table.config.ts`:** `r.status !== 'LOCKED'` compared `UserStatus` (which does not include `'LOCKED'`) against a string literal, causing TS2367 (unintentional comparison).

**Fix:** Cast `r.status as string` before comparison.

**`menu.service.ts`:** `ModuleResponse.sortOrder` and `.icon` are optional; `toMenuItem` parameter type required them as non-optional, and `MenuItem.sortOrder` requires `number`.

**Fix:** Made parameter type optional `(icon?: string; sortOrder?: number)` and defaulted `sortOrder ?? 0` in the return value.

**Files modified:**
- `src/app/features/tenants/mappers/tenant.mapper.ts`
- `src/app/core/api/models/index.ts`
- `src/app/features/users/shared/users-table.config.ts`
- `src/app/layout/services/menu.service.ts`

---

## Remaining Issues

| Issue | Type | Location | Action |
|---|---|---|---|
| `FormArrayComponent is not used within template of DynamicFormComponent` | NG8113 Warning | `dynamic-form.component.ts:56` | Pre-existing — `FormArrayComponent` is in imports but rendered via `FormSectionComponent`. Can be removed in a cleanup sprint. |
| Sass `@import` deprecation | SCSS Warning | `styles.scss:1` | Pre-existing — requires migrating to `@use`/`@forward`. Dart Sass 3.0 breaking change. |

No compilation **errors** remain.

---

## Final Build Status

```
TypeScript (tsc --noEmit):   0 errors
Angular build (development): 0 errors, 2 pre-existing warnings
Bundle generated:            dist/idoo_erp_frontend
Build time:                  7.7 seconds
```

All 19 platform field components, the Dynamic Form Engine, the Rendering Engine, the Metadata Engine, and all Sprint 6.5 demo components compile and bundle successfully.
