# Sprint 3 — Risk Report

---

## Risk Register

### R-001: Cache Unbounded Growth
**Severity:** Medium  
**Probability:** Low (Sprint 3) / High (Sprint 4+)  
**Description:** `RenderCacheService` has no max-size or TTL eviction. In Sprint 4+ with dynamic forms rendering hundreds of field types across many modes, the cache can grow without bound.  
**Mitigation:** Sprint 4 should add an LRU eviction policy (max 500 entries) or TTL-based expiration.

---

### R-002: Expression Evaluation via `new Function()`
**Severity:** Medium  
**Probability:** Low  
**Description:** `hiddenExpression` and `disabledExpression` are evaluated using `new Function('model', ...)`. This evaluates arbitrary strings from metadata definitions.  
**Mitigation:**
- Metadata definitions are authored by platform developers, not end users
- Consider an allowlist-based expression language in Sprint 6 (Security Hardening sprint)
- Current risk is acceptable given the closed authoring environment

---

### R-003: FieldDisplayComponent is a Sprint 3 Placeholder
**Severity:** Low  
**Probability:** Certain (by design)  
**Description:** All 21 field types map to `FieldDisplayComponent`. Edit mode and filter mode will not render actual form controls until Sprint 4 wires real Material components.  
**Mitigation:** This is an intentional scope decision. Sprint 4 registers real components via `MaterialAdapter.registerFieldComponent()`. No architectural changes needed.

---

### R-004: ValidatorResolver Always Returns null
**Severity:** Low  
**Probability:** Certain (by design)  
**Description:** The `resolveValidator` closure in `RenderPipelineService.stageContext()` returns `null` for all validator keys. Validators in render requests are silently ignored until Sprint 5.  
**Mitigation:** Sprint 5 (Validation Engine) injects a real `ValidatorResolverService` and wires it through the pipeline.

---

### R-005: No Header/Footer/Widget Renderer Implementations
**Severity:** Low  
**Probability:** N/A (deferred by design)  
**Description:** `HeaderRenderer`, `FooterRenderer`, `WidgetRenderer` contracts exist but have no built-in implementations. Only `FieldRenderer` has 21 built-in strategies.  
**Mitigation:** Implementations will be provided when Dynamic Tables (header/footer) and Dashboard Engine (widget) are built in their respective sprints.

---

### R-006: Angular Signal Reactivity in Non-Angular Contexts
**Severity:** Low  
**Probability:** Low  
**Description:** `RenderingEngineService.state` and `isReady` are signals. If consumed outside Angular's reactive context (e.g., in a plain class or test), `computed()` behavior may differ.  
**Mitigation:** All production consumers are Angular components or services. Tests use `.()` call syntax on signals which always works.

---

## Risk Summary

| ID | Severity | Status |
|----|----------|--------|
| R-001 | Medium | Open — deferred to Sprint 4 |
| R-002 | Medium | Accepted — platform-controlled metadata |
| R-003 | Low | Closed — by design |
| R-004 | Low | Closed — by design |
| R-005 | Low | Closed — by design |
| R-006 | Low | Monitored |
