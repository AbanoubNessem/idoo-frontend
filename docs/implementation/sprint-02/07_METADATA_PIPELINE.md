# Sprint 2 — Metadata Pipeline Design

**Sprint:** Sprint 2 — Metadata Engine  
**Date:** 2026-06-29

---

## Pipeline Overview

```
[RegistryManagerService]
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│                    MetadataPipelineService                         │
│                                                                   │
│  ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌─────────────┐   │
│  │  LOAD   │──▶│ VALIDATE │──▶│ RESOLVE │──▶│    INDEX    │   │
│  │  Stage  │   │  Stage   │   │  Stage  │   │    Stage    │   │
│  └─────────┘   └──────────┘   └─────────┘   └─────────────┘   │
│       │              │              │               │            │
│  entries Map   update isValid  mark isResolved  build index     │
│                                                 + create snap   │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
[MetadataSnapshot] ──▶ [MetadataCacheService]
```

---

## Stage Details

### Stage 1: Load
**Service:** `MetadataLoaderService`  
**Input:** 16 registries via `RegistryManagerService`  
**Output:** `Map<string, MetadataEntry>` where key = `"type:id"`

```
for each registry (entity, form, table, ...):
  for each RegistryEntry<T>:
    convert → MetadataEntry<T>:
      - copy id, version, sourcePluginId, overriddenBy, checksum
      - freeze definition
      - set isResolved = false
      - set isValid = (registryEntry.validationErrors.length === 0)
      - convert registry errors → MetadataValidationError[]
```

**Events emitted:** `metadata:loading:started`, `metadata:loading:completed`  
**Lifecycle transition:** none (engine already set `loading`)

---

### Stage 2: Validate
**Service:** `MetadataValidatorService`  
**Input:** `Map<string, MetadataEntry>`  
**Output:** Same map with updated `validationErrors` and `isValid`

Type-specific validators run per `MetadataType`:
- `entity` → apiPath, labelSingular, labelPlural, permissions.list
- `form` → sections non-empty, field key uniqueness, field label presence
- `table` → columns non-empty, column id uniqueness
- `route` → path required
- `menu` → label required
- `action` → label, type required
- `permission` → code required
- `lookup` → items non-empty (warning)
- `workflow` → initialState exists in states, transition refs valid
- `dashboard` → title (warning)
- `widget` → name required
- `report` → title (warning)
- `validator` → defaultMessage (warning)
- `layout` → type (warning)
- `theme` → name (warning)
- `localization` → locale, translations required

**Events emitted:** `metadata:validation:started`, `metadata:validation:completed`  
**Lifecycle transition:** `loading → validating`

---

### Stage 3: Resolve
**Service:** `MetadataResolverService`  
**Input:** Validated `Map<string, MetadataEntry>`  
**Output:** Same map with updated `isResolved`, `resolvedAt`, additional `validationErrors`

Cross-reference resolution strategy:
```
entity IDs available: Set<"entity:id" | "id">
permission codes available: Set<code | id>
lookup IDs available: Set<"lookup:id" | "id">
menu IDs available: Set<"menu:id" | "id">
widget IDs available: Set<"widget:id" | "id">

for each entry:
  switch (type):
    'form':      check field lookupId (warn) + field entityRef (error)
    'route':     check entityId (error if missing) + permission (warn)
    'action':    check entityId (error if missing) + permission (warn)
    'workflow':  check entityId (error if missing)
    'menu':      check parentId (warn)
    'dashboard': check slot.widgetId (warn)
    others:      mark isResolved = true (no cross-refs)
```

An entry is `isResolved = true` if no resolution errors (severity === 'error') were added.

**Events emitted:** `metadata:resolution:started`, `metadata:resolution:completed`  
**Lifecycle transition:** `validating → resolving`

---

### Stage 4: Index + Snapshot
**Services:** `MetadataIndexerService`, `MetadataStatisticsService`  
**Input:** Resolved `Map<string, MetadataEntry>`  
**Output:** `MetadataSnapshot`

```
MetadataIndex built with 11 sub-indexes:
  byId              → ReadonlyMap<string, MetadataEntry>
  byType            → ReadonlyMap<MetadataType, MetadataEntry[]>
  byPlugin          → ReadonlyMap<string, MetadataEntry[]>
  entityToForms     → ReadonlyMap<string, string[]>  (naming convention)
  entityToTables    → ReadonlyMap<string, string[]>  (naming convention)
  entityToWorkflows → ReadonlyMap<string, string[]>  (definition.entityId)
  entityToActions   → ReadonlyMap<string, string[]>  (definition.entityId)
  entityToRoutes    → ReadonlyMap<string, string[]>  (definition.entityId)
  permissionsByCode → ReadonlyMap<string, MetadataEntry>  (definition.code)
  lookupById        → ReadonlyMap<string, MetadataEntry>
  menuByParent      → ReadonlyMap<string|null, string[]>  (definition.parentId)

MetadataStats computed: totalEntries, byType counts, validEntries, etc.
MetadataSnapshot created: frozen object with unique UUID
```

**Events emitted:** `metadata:indexing:started`, `metadata:indexing:completed`, `metadata:snapshot:created`  
**Lifecycle transition:** `resolving → indexing`

---

## PipelineContext

```typescript
interface PipelineContext {
  entries: Map<string, MetadataEntry>;    // grows through stages
  errors: MetadataValidationError[];       // collected from validate stage
  warnings: string[];                      // collected from resolve stage
  timings: Record<string, number>;         // 'load', 'validate', 'resolve', 'index' ms
  conflicts: MetadataConflict[];           // for future registry conflict detection
  snapshot: MetadataSnapshot | null;       // set in index stage
}
```

The context flows linearly through all 4 stages. No stage needs to read results from a later stage.

---

## Error Handling

- Any exception thrown in any stage propagates to `MetadataEngineService`
- The engine catches and transitions to `error` state
- The `MetadataEventsService` emits `metadata:error` with the message
- Recovery: call `initialize()` again (state `error → loading`)
- Partial pipeline results are discarded — no partial snapshots are cached

---

## Entity–Form Naming Convention

Since `FormDef` has no `entityId` field (W-003, Sprint 1), entity-form associations use a prefix convention:

```
Form ID "hr:employee:create"     → entity prefix "hr:employee"
Form ID "hr:employee:edit"       → entity prefix "hr:employee"
Form ID "accounting:journal:new" → entity prefix "accounting:journal"
Form ID "simpleform"             → no entity association (no ':' separator)
```

The prefix is extracted by: `id.split(':').slice(0, -1).join(':')` when `id.split(':').length >= 3`.

This convention will be formalized in Sprint 3 when `PluginManifest` gains `forms?` support (REC-002 from Sprint 1 audit).
