# Sprint 2 — Architecture Decision Records

**Sprint:** Sprint 2 — Metadata Engine  
**Date:** 2026-06-29

---

## ADR-001: Composite Key for MetadataEntry Map

**Decision:** The primary `Map<string, MetadataEntry>` uses composite key `"type:id"` (e.g., `"entity:hr:employee"`)

**Alternatives Considered:**
1. Use `id` only — conflicts when two types share an ID (e.g., entity `hr:employee` and form `hr:employee`)
2. Nested Map `Map<MetadataType, Map<string, MetadataEntry>>`— adds access complexity

**Rationale:** Composite keys are simple strings, require no nesting, and prevent cross-type ID collisions. The `MetadataIndex.byId` provides an alternative access pattern when only the id is known.

**Consequences:** Consumers must know the composite key format, OR use `MetadataManager.getById(id)` which searches `byId`.

---

## ADR-002: Pipeline Drives Lifecycle Transitions (not Engine)

**Decision:** `MetadataPipelineService` injects `MetadataLifecycleService` and transitions through `validating`, `resolving`, `indexing`. The engine only transitions `uninitialized → loading` and `indexing → ready`.

**Alternatives Considered:**
1. Engine drives all transitions, pipeline just returns data — engine becomes aware of pipeline internals
2. Pipeline uses callbacks to notify engine — over-engineering for 4 fixed stages

**Rationale:** The pipeline IS the thing that produces the validating/resolving/indexing work. Coupling lifecycle to the pipeline keeps state accurate and keeps engine code minimal.

**Consequences:** `MetadataPipelineService` has a dependency on `MetadataLifecycleService`. This is acceptable since both are in the same `metadata/` module.

---

## ADR-003: Entity-Form Association via Naming Convention

**Decision:** Entity-to-form and entity-to-table relationships are inferred from ID prefix: `"ns:entity:suffix"` → entity `"ns:entity"`.

**Alternatives Considered:**
1. Add `entityId` to `FormDef` — requires changing `RegistryEntry<FormDef>` shape (Sprint 1 impact)
2. Register forms inline in entity definition — Sprint 1 W-003 already noted this gap
3. Skip entity-form indexing in Sprint 2 — results in incomplete index

**Rationale:** The naming convention is a non-breaking forward-compatible approach. When Sprint 3 adds `forms?: FormDef[]` to `PluginManifest`, the explicit `entityId` field can be used instead, and this fallback can remain.

**Consequences:** Form IDs must follow the `"ns:entity:name"` pattern for relation indexes to work. This is documented as a platform convention.

---

## ADR-004: MetadataSnapshot is Immutable (Object.freeze)

**Decision:** `createMetadataSnapshot()` calls `Object.freeze()` on the snapshot root, `validationErrors`, and `warnings` arrays.

**Alternatives Considered:**
1. Return a mutable object — risk of accidental mutation by consumers
2. Use TypeScript `readonly` only — compile-time only, runtime mutation possible

**Rationale:** `Object.freeze()` enforces immutability at runtime for the outermost properties. Nested objects (entries Map, index Maps) are inherently read-only via TypeScript `ReadonlyMap` types. A frozen snapshot can be safely shared across multiple services without defensive copying.

**Consequences:** Slightly increased object creation overhead (freeze is O(keys)). Runtime errors if code accidentally tries to mutate the snapshot.

---

## ADR-005: MetadataValidatorService Uses Internal Dispatch Map

**Decision:** Validators are stored in `Map<MetadataType, Validator>` and dispatched with `validators.get(entry.type)`.

**Alternatives Considered:**
1. `switch` statement — works but isn't extensible (new type requires switch modification)
2. Separate validator classes — over-engineering for 16 inline validators

**Rationale:** The Map dispatch is O(1) and allows future extension without modifying the class. New types can be added by calling `validators.set(newType, validator)`.

**Consequences:** Type safety of the Map is `Validator` (a private alias) — TypeScript ensures all validators have the same signature.

---

## ADR-006: Resolver Returns New Entries Map, Not Mutation In-Place

**Decision:** `MetadataResolverService.resolve()` returns `{ entries: Map<string, MetadataEntry>, result }` instead of mutating the input map.

**Alternatives Considered:**
1. Mutate in-place — simpler, but violates immutability principle; makes testing harder
2. Return only `MetadataResolutionResult` — caller can't see updated entries

**Rationale:** Returning a new map preserves the input unchanged. Pipeline stages can each produce new state without shared mutable state. The Map spread is O(n) but acceptable for the one-time pipeline.

**Consequences:** Additional Map allocation per pipeline run. Acceptable at this scale.

---

## ADR-007: MetadataCacheService Holds Single Snapshot

**Decision:** The cache holds exactly one snapshot at a time. Invalidation removes it entirely.

**Alternatives Considered:**
1. Cache multiple versions (N snapshots for rollback) — adds complexity Sprint 2 doesn't need
2. Cache by key (e.g., by plugin version) — over-engineering for MVP

**Rationale:** Sprint 2's use case is: initialize → get snapshot → refresh (occasionally). Multi-version caching is a Sprint 4 concern.

**Consequences:** No rollback support. Refresh replaces the snapshot atomically.

---

## ADR-008: MetadataLoaderService Converts RegistryEntry → MetadataEntry

**Decision:** The loader creates a new `MetadataEntry` object for each `RegistryEntry` rather than extending it.

**Alternatives Considered:**
1. Make `MetadataEntry` extend `RegistryEntry` — creates tight coupling between registry and metadata layers
2. Use `RegistryEntry` directly in the engine — metadata layer inherits all registry concerns

**Rationale:** `MetadataEntry` is the metadata engine's internal representation. It adds `isResolved`, `resolvedAt`, `isValid` (derived from engine validation, not registry validation). Keeping them separate allows the metadata engine to evolve independently.

**Consequences:** Two object allocations per entry at load time. Acceptable.

---

## ADR-009: MetadataIndex Uses ReadonlyMap Types

**Decision:** All `MetadataIndex` sub-maps are typed as `ReadonlyMap<K, V>` to prevent consumer mutation.

**Rationale:** TypeScript's `ReadonlyMap<K, V>` only exposes `get()`, `has()`, `entries()`, `keys()`, `values()`, and `size`. Consumers cannot call `set()`, `delete()`, or `clear()`. Since the actual runtime objects are regular Maps, TypeScript enforcement is sufficient (full deep freeze would prevent iteration).

**Consequences:** Type-safe at compile time. Consumers must cast if they need to work with the Map as mutable (they shouldn't).
