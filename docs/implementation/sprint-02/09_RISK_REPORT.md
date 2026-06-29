# Sprint 2 — Risk Report

**Sprint:** Sprint 2 — Metadata Engine  
**Date:** 2026-06-29

---

## Risk Register

### R-001: Entity-Form Naming Convention Dependency
**Severity:** Medium  
**Probability:** Low–Medium  
**Description:** The `entityToForms` and `entityToTables` indexes rely on ID prefix convention (`ns:entity:formname`). If plugin authors register forms without following this convention, the relationships are silently missing from the index.  
**Mitigation:** Document the convention in the platform SDK guide. When Sprint 3 adds `forms?: FormDef[]` to `PluginManifest`, add `entityId` to `FormDef` and update the loader to use it preferentially.  
**Status:** Accepted — low risk until third-party plugins are introduced.

---

### R-002: Lifecycle Coupling Between Pipeline and Lifecycle Service
**Severity:** Low  
**Probability:** Low  
**Description:** `MetadataPipelineService` drives lifecycle transitions (`loading → validating → resolving → indexing`). If a new pipeline stage is added and the developer forgets to update lifecycle transitions, the lifecycle falls out of sync.  
**Mitigation:** The `MetadataLifecycleService.VALID_TRANSITIONS` constant will throw on invalid transitions, immediately surfacing the mismatch in tests. The pipeline spec tests verify the ready state.  
**Status:** Accepted.

---

### R-003: Large Metadata Sets Blocking the JS Thread
**Severity:** Medium  
**Probability:** Low (early sprints)  
**Description:** The pipeline runs synchronously within an `async` function. For very large metadata sets (5,000+ entries), each stage could block the JavaScript thread for 100ms+, causing UI jank during initialization.  
**Mitigation:** Sprint 2 delivers `async run()` which allows other microtasks to interleave. For Sprint 4, each stage can be chunked using `setTimeout` / `scheduler.yield()` when entry count exceeds a threshold.  
**Status:** Accepted for Sprint 2 (<500 entries expected).

---

### R-004: MetadataSnapshot Not Deeply Immutable
**Severity:** Low  
**Probability:** Low  
**Description:** `Object.freeze()` is applied shallowly to the snapshot root. The `entries` Map and index Maps are `ReadonlyMap` at the TypeScript level but could be mutated at runtime by casting.  
**Mitigation:** `ReadonlyMap` enforces immutability at the TypeScript compiler level for all legitimate consumers. Intentional bypassing of TypeScript safety is a developer error, not a framework responsibility.  
**Status:** Accepted. Full deep-freeze would prevent Map iteration (`forEach`, `entries()`).

---

### R-005: No Registry-to-Metadata Change Detection
**Severity:** Low  
**Probability:** Medium (as more plugins are added)  
**Description:** The metadata engine has no mechanism to detect that a registry changed (a new plugin registered entries after the engine initialized). Stale snapshots will be served until `refresh()` is called.  
**Mitigation:** `MetadataEngineService.refresh()` can be called after plugin registration completes. In Sprint 3, `RegistryManagerService` can emit an event when new entries are registered, triggering auto-refresh.  
**Status:** Accepted for Sprint 2. Auto-refresh deferred to Sprint 3.

---

### R-006: Resolver Warnings Are Informational Only
**Severity:** Low  
**Probability:** Medium  
**Description:** Cross-reference resolution produces `warnings` (not errors) for missing lookups, permissions, and menu parents. An entry can be `isResolved = true` even with warnings. Features consuming metadata may silently receive incomplete data.  
**Mitigation:** Warnings are included in `MetadataSnapshot.warnings` and `MetadataDiagnosticsReport.warnings`. The `MetadataDiagnosticsService.isHealthy()` method checks for errors but not warnings (intentional — warnings are non-blocking). Consumers of specific metadata types (e.g., Dynamic Forms) must check for their own requirements.  
**Status:** Accepted — warnings are non-blocking by design.

---

### R-007: Single Snapshot Cache — No Refresh Fallback
**Severity:** Low  
**Probability:** Low  
**Description:** During `refresh()`, the cache is invalidated before the new pipeline completes. If the refresh fails, there is no previous snapshot to fall back to.  
**Mitigation:** The engine signal `_snapshot` retains the last known good snapshot even when the cache is invalidated. Consumers reading `engine.snapshot()` during a refresh will see the stale snapshot (not null). The cache returns null during refresh, but `engine.snapshot()` returns the last good snapshot.

Wait — actually looking at the implementation: `_snapshot` is updated only after the pipeline succeeds. So during refresh: `engine.snapshot()` returns the previous snapshot (still set from last run). Only after the new pipeline completes is `_snapshot.set(ctx.snapshot)` called. This is correct behavior.  
**Status:** Resolved by implementation design.

---

## Mitigated Risks from Sprint 1

| Sprint 1 Risk | Resolution in Sprint 2 |
|--------------|------------------------|
| W-003: No forms/tables in PluginManifest | Metadata engine handles forms via naming convention (R-001) |
| W-004: Version parsing duplication | Not addressed in Sprint 2 (deferred to Sprint 3) |
| W-001: Boot steps not injectable | Not addressed in Sprint 2 (deferred to Sprint 3) |

---

## Sprint 3 Risk Watchlist

1. Integrate `MetadataEngineService` into `APP_INITIALIZER` — ensure it runs after `PluginManagerService` completes registration
2. Add `forms?: FormDef[]` to `PluginManifest` and update `MetadataLoaderService` to prefer explicit `entityId` over naming convention
3. Add auto-refresh trigger when registries are updated (new plugin loaded)
4. Test metadata engine with 1,000+ entries to detect blocking threshold
