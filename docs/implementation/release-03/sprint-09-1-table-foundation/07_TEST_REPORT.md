# Sprint 9.1 — Test Report

## Summary

| Service                        | Spec File                                   | Cases |
|-------------------------------|---------------------------------------------|-------|
| `TableRegistryService`         | `table-registry.service.spec.ts`            | 21    |
| `TableMetadataRegistryService` | `table-metadata-registry.service.spec.ts`   | 17    |
| `TableValidatorService`        | `table-validator.service.spec.ts`           | 20    |
| `TableSerializerService`       | `table-serializer.service.spec.ts`          | 18    |
| `TableDiagnosticsService`      | `table-diagnostics.service.spec.ts`         | 16    |
| `TableMetricsService`          | `table-metrics.service.spec.ts`             | 14    |
| `TableResolverService`         | `table-resolver.service.spec.ts`            | 17    |
| `TableEngine`                  | `table-engine.service.spec.ts`              | 35    |
| **Total**                      |                                             | **158** |

Target coverage: **> 90%**

---

## Test Framework

- Angular `TestBed` for DI
- Jasmine assertions
- All services tested in isolation using `TestBed.inject()`
- No mocks: services are tested with real DI
- Async tests use `async/await`

---

## Key Test Scenarios

### TableRegistryService
- Register, overwrite, throw on duplicate
- Lazy registration and factory call-once behavior
- Resolve, null for unknown id
- Remove, list by layer, query by tags
- Signal reactivity (`registeredCount`, `all`)

### TableMetadataRegistryService
- Apply and replace layer overrides
- Resolution order (platform < runtime)
- `mergeInto` produces correct merged definition
- `id` and `name` are protected from overrides
- `clearForTable`, `clearAll`, `listTableIds`

### TableValidatorService
- Valid definition passes with 0 errors
- Required fields: `id`, `name`, `columns`
- Column count limits (min 1, max 200)
- Invalid `selectionMode`, `density`
- Duplicate column `id` (error) and `field` (warning)
- All 21 column types accepted
- Custom column warns when no renderer specified

### TableSerializerService
- Serialize to JSON string
- Pretty print option
- Hidden columns excluded by default
- `omitColumns` respected
- Permissions excluded by default
- Deserialize from valid JSON
- Strict mode validates required fields
- Roundtrip serialize → deserialize

### TableDiagnosticsService
- Disabled by default, no events recorded
- Events cleared on disable
- All event type helpers (`recordRegister`, `recordResolve`, etc.)
- `generateReport` aggregates correctly
- `clearTable`, `clearAll`

### TableMetricsService
- Track registration, resolve (with duration), error
- Average resolve duration calculation
- Independent tracking per tableId
- `reset`, `resetAll`
- `trackedCount` signal

### TableResolverService
- Returns null for unknown tableId
- Resolves visible / hidden columns
- Builds `columnIndex` map
- Applies column defaults
- Sets `effectiveVisible`, `effectiveEditable`
- Preserves or assigns column `order`
- Applies metadata overrides before resolution
- `resolveSync` for synchronous path

### TableEngine
- All service facades exposed
- `register` validates before saving
- `register` emits `TableRegistered`
- `remove` clears cache and emits `TableRemoved`
- `resolve` uses cache; bypass with `useCache: false`
- `applyOverride` invalidates cache, emits `TableMetadataChanged`
- Event `on` / unsubscribe / wildcard listeners
- `serialize` / `deserialize` roundtrip
- `enableDiagnostics`, `disableDiagnostics`
- Metrics tracked on register and resolve
