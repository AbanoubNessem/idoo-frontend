# Sprint 6 — Risk Report

## Architecture Risks

### R1 — Two-Way Value Binding Loop (MITIGATED)
**Risk:** When `FormFieldHostComponent` detects a signal change and calls `FormInstance.setValue()`, the form state update could trigger `_applyInputs()` which sets the field's value input again, creating a loop.

**Mitigation:** The `_lastEmittedValue` sentinel in `FormFieldHostComponent`. `_applyInputs()` skips `setInput('value', v)` when the value equals `_lastEmittedValue`. The effect's `untracked()` wrapper prevents the emit itself from becoming a reactive dependency.

**Residual risk:** If `setValue()` is called externally with the same value the field already holds, the guard protects against a loop. If a coercion occurs (e.g., string → number), values may not be strictly equal and the guard may not fire. Low probability; field components should coerce consistently.

### R2 — Effect in Dynamic Component Context (MITIGATED)
**Risk:** `effect()` in `FormFieldHostComponent._wireOutputs()` is created with `{ injector: this.injector }`. If the component is destroyed before the effect resolves, it could fire with a stale reference.

**Mitigation:** `_effectRef?.destroy()` is called in `_destroy()` which is invoked in `ngOnDestroy()`. The `EffectRef` cleanup prevents post-destroy firings.

### R3 — Noop Defaults Hide Missing Engine Integrations (LOW)
**Risk:** When no `FORM_EXPRESSION_EVALUATOR` is provided, all expressions evaluate to `false` / `undefined` silently. A developer may not notice that expressions aren't working until QA.

**Mitigation:** `DynamicFormDiagnosticsService.recordExpression()` logs each evaluated expression when diagnostics are enabled. Teams should enable diagnostics during development.

### R4 — `structuredClone` Availability (LOW)
**Risk:** `buildSnapshot()` uses `structuredClone()` which requires Node 17+ / Chrome 98+. May fail in older test environments.

**Mitigation:** `structuredClone` is available in all modern browsers supported by Angular 22. CI environments should be updated to Node 18+.

### R5 — localStorage for Draft Persistence (ACCEPTABLE)
**Risk:** `DynamicFormSnapshotService.saveDraft()` uses `localStorage`. This fails in SSR contexts, private browsing with storage blocked, or when localStorage quota is exceeded.

**Mitigation:** All localStorage calls are wrapped in try/catch. Failure is silently swallowed. A future sprint can add pluggable persistence via injection token. Not blocking for Sprint 6.

### R6 — Array Item Key Composition (KNOWN LIMITATION)
**Risk:** Array item field states are stored with composite keys like `arrayKey[0].itemKey`. If the form's field index is queried for `'arrayKey[0].itemKey'`, it won't be found in `fieldIndex` (which only has top-level field keys).

**Mitigation:** Array items are managed separately by `FormArrayComponent` and do not require `fieldIndex` lookup. The composite key scheme is an internal convention of `FormArrayComponent`. Documented as a known pattern.

## Performance Notes

- `DynamicFormState` uses shallow object spreading for immutable updates. For forms with 100+ fields, each `setValue()` copies the entire `fieldStates` record. If performance becomes an issue, a field-level map approach should be evaluated.
- Expression re-evaluation runs for all fields after each `setValue()`. For forms with many expression-heavy fields, this could be slow. Future optimization: dependency tracking (only re-evaluate expressions that reference the changed field).
- History debounce (300ms) prevents excessive snapshots during typing but may feel laggy on very fast users. Configurable in a future sprint.

## Constraints Honoured

- Dynamic Form Engine contains **zero business logic** ✓
- Dynamic Form Engine does **not render components directly** ✓ (delegates to `FormFieldHostComponent` → `ViewContainerRef`)
- All external integrations are via **injection tokens** with safe defaults ✓
- Sprint 6 stops here. **Dynamic Table Engine** is blocked until Architecture Review ✓
