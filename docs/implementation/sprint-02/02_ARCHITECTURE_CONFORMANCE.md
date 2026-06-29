# Sprint 2 — Architecture Conformance

**Sprint:** Sprint 2 — Metadata Engine  
**Date:** 2026-06-29

---

## Layer Position

```
kernel → registry → plugin → sdk → runtime
                                        ↑
                             platform/metadata (Sprint 2)
```

The metadata layer sits alongside `runtime` in the platform hierarchy. It depends on the `registry` layer (to read from registries) and `kernel` (for configuration, future). It does NOT depend on `sdk` or any UI layer.

---

## Dependency Rules

| Rule | Verified |
|------|----------|
| No imports from `src/app/features/` | ✓ |
| No imports from Angular `@angular/router` | ✓ |
| No imports from `@angular/common/http` | ✓ |
| No imports from `@angular/material` | ✓ |
| No imports from `primeng` | ✓ |
| No circular imports within metadata/ | ✓ |
| All service imports from `core/registry/` only | ✓ |

---

## SOLID Compliance

### Single Responsibility
Each service has one clearly bounded responsibility:
- `MetadataLoaderService` — reads registries, produces `MetadataEntry` map
- `MetadataValidatorService` — validates entries by type
- `MetadataResolverService` — resolves cross-references
- `MetadataIndexerService` — builds O(1) lookup indexes
- `MetadataPipelineService` — sequences the 4 stages
- `MetadataEngineService` — exposes the public API

### Open/Closed
- `MetadataValidatorService` uses an internal `Map<MetadataType, Validator>` — new types are added by registering a new validator function without modifying existing ones.
- `MetadataPipelineService` stages are separate private methods — new stages are added without touching existing ones.

### Liskov Substitution
- `MetadataEngineService` implements `MetadataEngineAPI` interface — consumers can depend on the interface.

### Interface Segregation
- `MetadataEngineAPI` exposes only the public contract (4 methods + 3 signals).
- `MetadataManagerService` exposes a separate query API — consumers of query data don't need the engine.

### Dependency Inversion
- `MetadataEngineService` depends on `MetadataLifecycleService`, `MetadataPipelineService`, `MetadataCacheService` — all abstractions.
- No concrete registry types are imported into the engine or pipeline.

---

## Angular Best Practices

| Practice | Status |
|----------|--------|
| `@Injectable({ providedIn: 'root' })` on all services | ✓ |
| `signal()` and `computed()` for reactive state | ✓ |
| `inject()` for DI (no constructor injection) | ✓ |
| No `ngOnInit` / lifecycle hooks (services, not components) | ✓ |
| No `NgModule` required (standalone-ready) | ✓ |

---

## Conformance to Sprint 2 Spec

| Requirement | Conformance |
|-------------|-------------|
| MetadataEngine implemented | ✓ |
| MetadataManager implemented | ✓ |
| MetadataLoader implemented | ✓ |
| MetadataValidator implemented | ✓ |
| MetadataResolver implemented | ✓ |
| MetadataIndexer implemented | ✓ |
| MetadataSnapshot implemented | ✓ (factory in metadata-snapshot.ts) |
| MetadataCache implemented | ✓ |
| MetadataDiagnostics implemented | ✓ |
| MetadataEvents implemented | ✓ |
| MetadataStatistics implemented | ✓ |
| MetadataLifecycle implemented | ✓ |
| MetadataPipeline implemented | ✓ |
| 16 metadata types supported | ✓ |
| >85% test coverage | ✓ |
| No TODOs in production code | ✓ |
