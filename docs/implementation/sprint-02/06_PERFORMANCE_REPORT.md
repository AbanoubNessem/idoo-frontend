# Sprint 2 — Performance Report

**Sprint:** Sprint 2 — Metadata Engine  
**Date:** 2026-06-29

---

## Design Performance Goals

The metadata engine is invoked once during platform initialization and on explicit refresh. Query methods (`MetadataManagerService`) are called frequently by features at runtime.

| Goal | Design Decision |
|------|----------------|
| O(1) entry lookup by ID | `Map<string, MetadataEntry>` (byId index) |
| O(1) type listing | `Map<MetadataType, MetadataEntry[]>` (byType index) |
| O(1) permission check | `Map<string, MetadataEntry>` (permissionsByCode index) |
| O(1) lookup access | `Map<string, MetadataEntry>` (lookupById index) |
| O(1) entity→forms relation | `Map<string, string[]>` (entityToForms index) |
| O(1) menu tree traversal | `Map<string|null, string[]>` (menuByParent index) |
| Immutable snapshot | `Object.freeze()` — zero per-access cost |
| Zero re-computation | `MetadataCacheService` returns the cached snapshot |

---

## Pipeline Performance

The pipeline is a one-time operation (or refresh). Each stage is measured and stored in `MetadataStats`.

### Load Stage

- Iterates 16 registry `getAll()` calls (16 × `Array.from(Map.values())`)
- `RegistryEntry → MetadataEntry` conversion: single pass, O(n) total
- Definition frozen with `Object.freeze({ ...definition })`

**Expected: < 5ms for 500 entries**

### Validate Stage

- Single pass over all entries
- 16 type-specific validators (selected via `Map<MetadataType, Validator>` — O(1) dispatch)
- Workflow transition validation: O(states) per workflow
- Form field deduplication: `Set<string>` — O(fields) per form

**Expected: < 10ms for 500 entries**

### Resolve Stage

- Single pass over all entries
- Lookup set construction (`collectIds`): O(n) once
- Cross-reference checks: O(1) per check (Set lookups)
- No nested iterations except form fields (bounded by section/field count)

**Expected: < 5ms for 500 entries**

### Index Stage

- Single pass over all entries to build all 11 indexes
- No sorting required (caller sorts when needed)
- `buildMetadataStats`: single pass to count valid/resolved

**Expected: < 5ms for 500 entries**

### Total Pipeline

**Expected end-to-end: < 25ms for 500 metadata entries across all types**

---

## Memory Profile

| Structure | Size Estimate (500 entries) |
|-----------|-----------------------------|
| `entries` Map (in snapshot) | ~2MB (includes frozen definitions) |
| `index.byId` | Shares references with entries Map |
| `index.byType` (16 × array) | Shares references, no copies |
| `index.byPlugin` | Shares references |
| `permissionsByCode` | Small (permissions are few) |
| Event log (max 200) | ~100KB |

**Total estimated memory: ~3–5MB for 500 entries**

The snapshot's index arrays hold **references** to `MetadataEntry` objects, not copies. Memory consumption is proportional to entry count, not to the number of indexes.

---

## Reactive Performance

- `MetadataLifecycleService` uses Angular `signal()` + `computed()` — zero cost when not observed
- `MetadataEngineService.state`, `.isReady`, `.snapshot` are signals — Angular change detection skips them when unused
- `MetadataEventsService` uses RxJS Subject — zero cost when no subscribers
- `MetadataCacheService.hasSnapshot` and `.snapshotId` are signals — derived from internal cache signal

---

## Bottleneck Identification

| Potential Bottleneck | Assessment | Mitigation |
|---------------------|------------|------------|
| `Object.freeze()` on large definitions | Low risk — freeze is O(keys) | Shallow freeze only (not deep) |
| 16 registry reads on every refresh | Acceptable — registries are in-memory Maps | Consider delta refresh in Sprint 3 |
| Re-building full index on refresh | Acceptable for 500 entries | Incremental indexing is a Sprint 4 optimization |
| Form field deduplication via Set | O(fields/form) — bounded | No action needed |

---

## Recommendations for Future Sprints

1. **Sprint 4**: Add delta-based refresh — only re-validate/re-resolve entries from changed plugins
2. **Sprint 4**: Add LRU snapshot versioning — keep N previous snapshots for rollback
3. **Sprint 3**: Add `computedSnapshotId` signal that derived consumers can use with `effect()` to react to snapshot changes
