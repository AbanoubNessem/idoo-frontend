# Sprint 6.5 — Risk Report

## Risks

### R1 — DemoExpressionEvaluator uses `new Function()` (MEDIUM)

**Description:** `DemoExpressionEvaluator` uses JavaScript's `Function` constructor to evaluate expressions. In production this would be a security risk (XSS, code injection).

**Mitigation:** This is a demo-only provider scoped to the `/demo` route subtree. It is explicitly replaced by the real Expression Engine in Sprint 7. The `"use strict"` pragma and inner try/catch limit scope, but offer no sandbox security.

**Recommendation:** Do NOT use `DemoExpressionEvaluator` outside the demo. Sprint 7 must implement a proper sandboxed expression evaluator.

---

### R2 — Array item field resolver gap (LOW — FIXED)

**Description:** `DynamicFormResolverService._resolveSection()` previously passed `section.arrays` through without resolving `componentType` for array item schema fields. This caused `FormArrayComponent` to receive `undefined` componentType, breaking field rendering inside arrays.

**Status:** FIXED in this sprint. `_resolveArrays()` now resolves item schema fields through `ComponentResolverService`.

---

### R3 — FormSectionComponent missing array rendering (LOW — FIXED)

**Description:** `FormSectionComponent` had `FormArrayComponent` in its imports but lacked the corresponding template block, triggering an IDE warning.

**Status:** FIXED. Arrays block added between groups and subsections in the template.

---

### R4 — No E2E tests (LOW)

**Description:** The demo components are tested at unit level. Integration flow (shell navigation, form instance creation, expression evaluation pipeline end-to-end) is not covered by automated tests.

**Mitigation:** Manual validation via the demo pages. Sprint 7+ should add Cypress/Playwright E2E tests.

---

### R5 — MaterialAdapterConnector must be called at bootstrap (MEDIUM)

**Description:** If `MaterialAdapterConnector.connect()` is not called before the form renders, `ComponentResolverService` will return null for all field types and forms will show empty fields.

**Mitigation:** `MaterialAdapterConnector` is provided in `DEMO_ROUTES` providers. The `connect()` call must be wired into the app bootstrap (APP_INITIALIZER) for production use.

---

### R6 — Sprint 6.5 is a demo layer only — not production-ready (LOW)

**Description:** The demo uses mock providers, simulated delays, and hardcoded data. None of the demo code should be deployed to production.

**Mitigation:** Demo code lives exclusively under `src/app/features/demo/` and is only reachable at `/demo`. The route has no auth guard intentionally (developer tool). Production routes must not include `/demo` in production builds — consider environment-based route exclusion.

## Known Limitations

1. **Array field state management** — Array item values are tracked locally in `FormArrayComponent._items` signal. They are not yet written back into the parent `DynamicFormState` signal by key path. The submit model will miss array field values unless the host form wires array changes back explicitly.

2. **Lookup field in form** — The `PlatformLookupFieldComponent` requires `FORM_QUERY_PROVIDER` to be set. The demo route provides `DemoQueryProvider`, but the form's `lookup` typed fields (not used in CustomerFormDef directly) would need the lookup config to specify `queryType`.

3. **File/Image/Avatar fields** — In the showcase form (ComponentExplorerComponent), file/image/avatar fields render their platform component wrapper but have no backend to upload to. The mock shows the UI only.

4. **Draft persistence** — Draft mode uses `localStorage` with key `df_draft_{formId}`. Multiple tabs will share the draft state if the same form ID is used.
