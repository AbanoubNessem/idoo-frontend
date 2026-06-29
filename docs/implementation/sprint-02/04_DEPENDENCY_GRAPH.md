# Sprint 2 — Dependency Graph

**Sprint:** Sprint 2 — Metadata Engine  
**Date:** 2026-06-29

---

## Service Dependency Tree

```
MetadataEngineService
├── MetadataLifecycleService       (state machine)
├── MetadataPipelineService
│   ├── MetadataLoaderService
│   │   └── RegistryManagerService  (Sprint 1)
│   │       ├── EntityRegistryService
│   │       ├── FormRegistryService
│   │       ├── TableRegistryService
│   │       ├── RouteRegistryService
│   │       ├── MenuRegistryService
│   │       ├── ActionRegistryService
│   │       ├── PermissionRegistryService
│   │       ├── WidgetRegistryService
│   │       ├── WorkflowRegistryService
│   │       ├── DashboardRegistryService
│   │       ├── LookupRegistryService
│   │       ├── ValidationRegistryService
│   │       ├── ReportRegistryService
│   │       ├── LayoutRegistryService
│   │       ├── ThemeRegistryService
│   │       └── LocalizationRegistryService
│   ├── MetadataValidatorService   (no external deps)
│   ├── MetadataResolverService    (no external deps)
│   ├── MetadataIndexerService
│   │   └── metadata-snapshot.ts  (pure functions)
│   ├── MetadataStatisticsService
│   │   └── metadata-snapshot.ts  (pure functions)
│   ├── MetadataEventsService      (no external deps)
│   └── MetadataLifecycleService   (shared with engine)
├── MetadataCacheService           (no external deps)
├── MetadataEventsService          (shared with pipeline)
└── MetadataDiagnosticsService
    ├── MetadataLifecycleService
    ├── MetadataCacheService
    └── MetadataStatisticsService

MetadataManagerService
├── MetadataCacheService
└── MetadataIndexerService
```

---

## Dependency Rules

### Allowed
- `metadata/` → `registry/` (reads from registries)
- `metadata/` → `rxjs` (event bus uses Subject/Observable)
- `metadata/` → `@angular/core` (DI, signals)
- Pure utility functions (metadata-snapshot.ts) → no imports

### Forbidden
- `metadata/` → `@angular/router`
- `metadata/` → `@angular/common/http`
- `metadata/` → `@angular/material`
- `metadata/` → `primeng`
- `metadata/` → `src/app/features/`
- `metadata/` → `sdk/` (metadata engine is below SDK)

---

## No Circular Dependencies

Verified topological order:
1. `metadata.types.ts` — no imports
2. `metadata-snapshot.ts` — imports types only
3. `metadata-events.service.ts` — imports types + rxjs
4. `metadata-lifecycle.service.ts` — imports types
5. `metadata-cache.service.ts` — imports types
6. `metadata-statistics.service.ts` — imports types + metadata-snapshot
7. `metadata-loader.service.ts` — imports types + registry
8. `metadata-validator.service.ts` — imports types
9. `metadata-resolver.service.ts` — imports types
10. `metadata-indexer.service.ts` — imports types + metadata-snapshot
11. `metadata-pipeline.service.ts` — imports services above
12. `metadata-diagnostics.service.ts` — imports lifecycle + cache + statistics
13. `metadata-manager.service.ts` — imports cache + indexer
14. `metadata-engine.service.ts` — imports all above

No file in this list imports from a file with a higher number.

---

## External Dependency Summary

| Package | Usage | Count |
|---------|-------|-------|
| `@angular/core` | DI, signals, Injectable | 11 files |
| `rxjs` | Subject, Observable, filter | 1 file (events) |
| Sprint 1 registry layer | Loading metadata | 1 file (loader) |
