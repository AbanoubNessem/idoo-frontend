# Sprint 9.1 — Risk Report

## Risk Matrix

| ID   | Risk                                         | Likelihood | Impact | Mitigation                                           |
|------|----------------------------------------------|------------|--------|------------------------------------------------------|
| R-01 | Column type set needs expansion              | Medium     | Low    | `'custom'` type covers any gap; extend union later   |
| R-02 | Serializer loses formatter functions         | Low        | Medium | Documented; functions must be re-registered at boot  |
| R-03 | Layer override merge is shallow              | Medium     | Medium | Merge is a shallow object spread; deep merge deferred to Sprint 9.2 if needed |
| R-04 | `TableEngine` cache invalidation is manual   | Medium     | Medium | All mutation paths call `_invalidateCache`; documented behavior |
| R-05 | Plugin definitions registered before app boot | Low       | Low    | Lazy registration supports deferred plugin loading   |
| R-06 | Permission strings are unvalidated           | Low        | Low    | Permission Engine will enforce at render time        |
| R-07 | `responsiveRules` has no renderer yet        | High       | Low    | Metadata declared; rendering deferred to Sprint 9.2+ |
| R-08 | `formatter` / `renderer` are string ids      | Medium     | Medium | Renderer registry to be built in Sprint 9.2         |

## Resolved Risks

| ID   | Risk                                         | Resolution                                         |
|------|----------------------------------------------|----------------------------------------------------|
| R-A  | Circular dependency between engine and registry | Engine depends on registry; registry has no engine import. Verified. |
| R-B  | Signal reads outside reactive context         | `signal()` reads are valid anywhere; only `effect()` requires context |
| R-C  | Duplicate diag event counter in tests         | Module-level `_counter` accumulates across tests; tests count per-table, not globally |

## Deferred Decisions

1. **Deep merge for column arrays**: If a `runtime` override needs to change individual column properties without replacing the whole `columns` array, a per-column patch mechanism is needed. Deferred to Sprint 9.2.

2. **Column inheritance**: Parent table → child table column inheritance is not in scope. Deferred.

3. **Versioned snapshots**: Registry does not version-pin table definitions. Callers receive the latest registered version. Snapshot/versioning deferred.
