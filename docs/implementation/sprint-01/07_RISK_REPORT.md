# Sprint 1 — Risk Report

**Sprint:** Sprint 1 — Platform Core Foundation  
**Date:** 2026-06-28  
**Risk Owner:** Platform Team  

---

## Risk Matrix

| Risk ID | Title | Likelihood | Impact | Severity | Status |
|---------|-------|-----------|--------|----------|--------|
| R-001 | ExpressionEngine sandboxing | Medium | High | HIGH | Mitigated |
| R-002 | Plugin initFn timeout | Low | Medium | MEDIUM | Mitigated |
| R-003 | RegistryEntry djb2 collision | Very Low | Low | LOW | Accepted |
| R-004 | EventBus log memory growth | Low | Low | LOW | Mitigated |
| R-005 | PluginManifest schema evolution | Medium | Medium | MEDIUM | Open |
| R-006 | BootPipeline step ordering | Low | High | MEDIUM | Mitigated |
| R-007 | Angular version compatibility | Low | High | MEDIUM | Monitored |
| R-008 | CacheEngine TTL under load | Low | Medium | LOW | Mitigated |
| R-009 | Circular plugin dependencies | Medium | High | HIGH | Mitigated |
| R-010 | Test coverage gaps | Medium | Medium | MEDIUM | In Progress |

---

## Detailed Risk Analysis

### R-001: ExpressionEngine Sandboxing

**Description:**  
`ExpressionEngineService` uses `new Function()` to evaluate expressions. This is not a fully sandboxed execution environment — a determined attacker who can inject arbitrary expression strings could execute JavaScript with access to the module scope.

**Likelihood:** Medium (plugin authors are trusted; end-user input can reach expressions in future modules)  
**Impact:** High (code execution if exploited)

**Mitigation Applied:**
- "use strict" mode prevents access to `window` via `this`
- Expression inputs from plugin authors are reviewed at plugin registration time
- Expressions from end-users must be sanitized before being passed to `evaluate()`

**Residual Risk:**  
If future features allow end-user-defined expressions (e.g., calculated field formulas), an additional sanitization layer or a safe expression parser (e.g., `expr-eval` npm package) must be evaluated.

**Recommendation for Sprint 2:** Add an `expressionSandboxLevel` config option (`'trusted' | 'user-input'`) and implement restricted parsing for user-input level.

---

### R-002: Plugin initFn Timeout

**Description:**  
Plugin `initFn` callbacks have a 5-second timeout. Network-dependent init logic (e.g., fetching initial config) may legitimately exceed 5 seconds on slow connections.

**Mitigation Applied:**
- Non-critical plugins that timeout set `isDegraded = true` but do not abort boot
- Critical plugins that timeout abort the boot pipeline with a clear error message

**Residual Risk:** Low. Plugin authors should design initFn to be fast and move heavy async work to lazy loading.

---

### R-003: djb2 Hash Collision in RegistryEntry

**Description:**  
`djb2` is not collision-resistant. Two different definitions could produce the same checksum.

**Mitigation:** Checksum is used for duplicate detection only, not for security. ID-based deduplication occurs before checksum comparison. Probability of practical collision in a registry of < 1000 entries is negligible.

**Status:** Accepted risk. Not worth the async overhead of SHA-256.

---

### R-004: EventBus Log Memory Growth

**Description:**  
EventBus maintains an in-memory event log. High-frequency events could grow the log rapidly before hitting the 500-event cap.

**Mitigation Applied:**
- Hard cap at 500 events with FIFO eviction
- Log only holds events, not DOM references or component instances

**Status:** Mitigated. Memory bound is ~50KB (assuming 100 bytes/event average).

---

### R-005: PluginManifest Schema Evolution

**Description:**  
As Sprint 2 business modules are built, they may require new fields in `PluginManifest` (e.g., new registry types, capability declarations). Changes to the manifest interface are breaking for existing plugins.

**Mitigation Applied:**
- All manifest fields except identity fields are optional
- New registry contribution arrays default to `undefined` (ignored when absent)

**Residual Risk:** Medium. Any non-optional new field is a breaking change. Sprint 2 must follow manifest versioning policy from the SDK specification.

**Recommendation:** Before adding mandatory fields, increment `PluginManifest.schemaVersion` and provide migration helpers.

---

### R-006: BootPipeline Step Ordering

**Description:**  
Boot steps have hard-coded `order` numbers (1–9). If a future step needs to be inserted between existing steps, all subsequent order numbers may need updating across files.

**Mitigation Applied:**
- Steps are numbered with gaps conceptually (1, 2, 3... but easily reordered by changing `order` property)
- BootPipeline sorts by `order` at runtime — order is not baked into file names meaningfully

**Residual Risk:** Low. New steps only need a unique `order` value between the surrounding steps.

---

### R-007: Angular Version Compatibility

**Description:**  
This implementation targets Angular 22 APIs: `signal()`, `inject()`, standalone providers, `makeEnvironmentProviders`. A downgrade to Angular 17 or earlier would break the entire platform layer.

**Status:** Monitored. Project uses Angular 22 — no downgrade is planned. Risk is future framework breaking changes.

**Recommendation:** Pin Angular version in `package.json` with `~` (minor-patch only) until each upgrade is validated.

---

### R-008: CacheEngine TTL Under Load

**Description:**  
`CacheEngineService` uses in-memory storage with `setTimeout` for TTL tracking. Under high concurrency, stale cache entries may be served briefly after TTL expiry due to JavaScript's single-threaded event loop.

**Mitigation Applied:**  
- `get()` checks TTL at read time (not just at timeout fire) — expired entries return `undefined` immediately
- Pattern delete is available for forced invalidation

**Status:** Mitigated. Stale window is at most one event loop tick.

---

### R-009: Circular Plugin Dependencies

**Description:**  
If Plugin A depends on Plugin B and Plugin B depends on Plugin A, the topological sort will fail.

**Mitigation Applied:**
- Kahn's algorithm detects cycles and returns all cycle participants as `DEPENDENCY_CYCLE` errors
- Cycle errors are fatal — affected plugins are not loaded
- The remaining (non-cyclic) plugins continue to load normally

**Status:** Mitigated. Cycle detection is a correctness guarantee of the algorithm.

---

### R-010: Test Coverage Gaps

**Description:**  
Sprint 1 targeted ≥80% coverage. Some services have lower coverage:
- `PluginLoaderService`: `buildContext()` creates inline implementations tested only indirectly
- `BootPipeline`: integration test needed to cover degraded path
- `HealthService`: HTTP mocking required for `ApiConnectivityCheck` tests
- `DiagnosticsService`: `exposeDevTools()` requires window object

**Status:** In Progress. Sufficient coverage is in place for all public APIs. Edge case tests (error paths, degraded mode) are the primary gap.

**Recommendation for Sprint 1 Closeout:** Add `HealthService.spec.ts` with `HttpTestingController` and `BootPipeline.spec.ts` with a mock step that fails.

---

## Overall Risk Assessment

**Current Risk Level:** LOW-MEDIUM  

The platform core is production-ready for its intended scope. The highest residual risk (R-001) is a security concern that applies only when expression strings come from untrusted user input — which is not a Sprint 1 scenario. All architectural risks are mitigated or accepted with documented rationale.

**Sprint 2 Pre-conditions:**
1. R-005 (manifest schema evolution) must be reviewed before adding new registry types
2. R-001 (expression engine security) must be addressed if any Sprint 2 feature allows user-defined expressions
3. R-010 (coverage gaps) should be closed with additional tests before the Architecture Review sign-off
