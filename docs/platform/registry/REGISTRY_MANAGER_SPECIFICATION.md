# Registry Manager — Architecture Specification

**Version:** 1.0.0  
**Status:** APPROVED SPECIFICATION  
**Phase:** 2.3  
**Depends on:** `KERNEL_IMPLEMENTATION_SPECIFICATION.md`  
**Date:** 2026-06-28

---

> The Registry Manager is the central metadata authority of the iDoo Platform.  
> Every piece of UI behaviour — every screen, every field, every action, every route —  
> originates as a metadata entry stored in a registry.  
> No engine may ever access plugin metadata directly.  
> All metadata flows through the Registry Manager.

---

## Table of Contents

1. [Philosophy and Principles](#1-philosophy-and-principles)
2. [Class Diagram](#2-class-diagram)
3. [Common RegistryEntry Model](#3-common-registryentry-model)
4. [Registry Lifecycle Diagram](#4-registry-lifecycle-diagram)
5. [Registration Pipeline](#5-registration-pipeline)
6. [Registry Events](#6-registry-events)
7. [Registry Manager API](#7-registry-manager-api)
8. [Registry Diagnostics](#8-registry-diagnostics)
9. [Entity Registry](#9-entity-registry)
10. [Form Registry](#10-form-registry)
11. [Table Registry](#11-table-registry)
12. [Route Registry](#12-route-registry)
13. [Menu Registry](#13-menu-registry)
14. [Action Registry](#14-action-registry)
15. [Permission Registry](#15-permission-registry)
16. [Widget Registry](#16-widget-registry)
17. [Layout Registry](#17-layout-registry)
18. [Validation Registry](#18-validation-registry)
19. [Lookup Registry](#19-lookup-registry)
20. [Workflow Registry](#20-workflow-registry)
21. [Dashboard Registry](#21-dashboard-registry)
22. [Report Registry](#22-report-registry)
23. [Localization Registry](#23-localization-registry)
24. [Theme Registry](#24-theme-registry)
25. [Dependency Diagram](#25-dependency-diagram)
26. [Sequence Diagrams](#26-sequence-diagrams)
27. [Conflict Resolution Model](#27-conflict-resolution-model)
28. [Override and Merge System](#28-override-and-merge-system)
29. [Versioning Strategy](#29-versioning-strategy)
30. [Performance Architecture](#30-performance-architecture)
31. [Hot Reload Compatibility](#31-hot-reload-compatibility)
32. [ADRs](#32-adrs)
33. [Self-Review](#33-self-review)

---

## 1. Philosophy and Principles

### 1.1 Core Mandate

The Registry Manager is a **runtime metadata repository**, not a compile-time configuration system. It receives structured metadata from plugins during the boot pipeline, validates it, resolves it, and publishes a frozen, authoritative state that every engine reads from.

The Registry Manager answers one fundamental question for every engine:

> "What metadata exists for this entity/form/route/action right now, in this tenant's context?"

### 1.2 The Twelve Registry Principles

**P1 — Single Source of Truth**  
No engine holds a private copy of metadata. All reads go through the Registry Manager. If a piece of metadata is not in the registry, it does not exist to the platform.

**P2 — Registration Before Render**  
No engine may render before its required registry is fully published. The kernel boot pipeline enforces this. A registry that is not PUBLISHED is invisible to engines.

**P3 — Immutability After Publish**  
Once a registry is PUBLISHED, its entries are frozen. Write operations after PUBLISHED state throw `RegistryFrozenError`. The only exception is hot-reload mode (Phase 2, v1.1+) which explicitly unfreezes and re-publishes.

**P4 — Plugin Ownership**  
Every registry entry is owned by exactly one plugin (`sourcePluginId`). No entry is anonymous. Ownership governs conflict resolution: a newer plugin version wins over an older one for entries it owns; a different plugin can only `override` an entry, never replace it.

**P5 — Override Without Mutation**  
Tenant-specific or deployment-specific customizations use the Override system. Overrides are merged on top of base entries at publish time. The base entry is never mutated. Overrides from higher-priority plugins win over lower-priority ones.

**P6 — Dependency Integrity**  
An entry that declares a dependency on another entry cannot be published until all its dependencies are registered. Circular dependencies between registries (e.g., EntityRegistry ↔ WorkflowRegistry) are resolved through deferred resolution at publish time.

**P7 — Conflict Transparency**  
All conflicts (duplicate IDs, version mismatches, capability collisions) are surfaced in the diagnostics report, never silently suppressed. The conflict resolution policy is deterministic and documented.

**P8 — Query Efficiency**  
The Registry Manager pre-indexes all entries at publish time. Queries execute in O(1) for ID lookups and O(k) for filtered queries (where k = result set size). No query scans the full registry.

**P9 — Isolation Per Registry**  
Each registry is an independent unit. A failure in one registry (e.g., WorkflowRegistry validation error) must never prevent other registries from publishing. The boot step marks affected registries as DEGRADED and continues.

**P10 — Observable**  
All registry state changes emit typed events through the EventBus. Engines subscribe to registry events to react to state changes. Polling is never required.

**P11 — Diagnostic Completeness**  
The diagnostics API must be able to answer: what is registered, who registered it, when, what its current status is, what dependencies it has, and whether any conflicts exist — for every entry in every registry.

**P12 — Scale Ceiling**  
The Registry Manager is designed to handle 500+ plugins and 10,000+ metadata entries without degrading query performance. Index structures are chosen accordingly.

---

## 2. Class Diagram

```
                     ┌─────────────────────────────────────────────────────┐
                     │                 RegistryManager                      │
                     │  (implements RegistryAPI)                            │
                     │                                                      │
                     │  + entity:     EntityRegistry                        │
                     │  + form:       FormRegistry                          │
                     │  + table:      TableRegistry                         │
                     │  + route:      RouteRegistry                         │
                     │  + menu:       MenuRegistry                          │
                     │  + action:     ActionRegistry                        │
                     │  + permission: PermissionRegistry                    │
                     │  + widget:     WidgetRegistry                        │
                     │  + layout:     LayoutRegistry                        │
                     │  + validation: ValidationRegistry                    │
                     │  + lookup:     LookupRegistry                        │
                     │  + workflow:   WorkflowRegistry                      │
                     │  + dashboard:  DashboardRegistry                     │
                     │  + report:     ReportRegistry                        │
                     │  + locale:     LocalizationRegistry                  │
                     │  + theme:      ThemeRegistry                         │
                     │                                                      │
                     │  + publishAll(): Promise<void>                       │
                     │  + getDiagnostics(): RegistryDiagnosticsReport       │
                     │  + get(name: RegistryName): BaseRegistry             │
                     └───────────────────────┬─────────────────────────────┘
                                             │ owns 16×
                                             │
            ┌────────────────────────────────┼────────────────────────────────┐
            │                                │                                │
  ┌─────────▼──────────────────────────────────────────────────────────────┐  │
  │                         BaseRegistry<TDef, TMeta>                       │  │
  │                                                                         │  │
  │  # entries:      Map<string, RegistryEntry<TDef>>                      │  │
  │  # overrides:    Map<string, RegistryOverride<Partial<TDef>>>          │  │
  │  # indexes:      Map<string, Map<string, string[]>>   (field→value→ids)│  │
  │  # status:       Signal<RegistryStatus>                                 │  │
  │  # pipeline:     RegistrationPipeline<TDef>                            │  │
  │                                                                         │  │
  │  + register(def: TDef, pluginId: string): void                        │  │
  │  + unregister(id: string, pluginId: string): void                     │  │
  │  + getById(id: string): TDef | null                                   │  │
  │  + getAll(): TDef[]                                                    │  │
  │  + query(filter: RegistryQuery<TDef>): TDef[]                         │  │
  │  + exists(id: string): boolean                                         │  │
  │  + publish(): void                                                     │  │
  │  + freeze(): void                                                      │  │
  │  + getEntry(id: string): RegistryEntry<TDef> | null                   │  │
  │  + getDiagnostics(): RegistryDiagnosticsResult                        │  │
  │  + readonly status: Signal<RegistryStatus>                            │  │
  └─────────────────────────────────────────────────────────────────────────┘  │
            △                                                                   │
            │ extends (16 concrete registries)                                  │
  ┌─────────┴──────────┐  ┌───────────────────┐  ┌────────────────────────┐   │
  │   EntityRegistry   │  │   FormRegistry    │  │   RouteRegistry        │   │
  │   TableRegistry    │  │   MenuRegistry    │  │   ActionRegistry       │   │
  │   PermissionReg.   │  │   WidgetRegistry  │  │   LayoutRegistry       │   │
  │   ValidationReg.   │  │   LookupRegistry  │  │   WorkflowRegistry     │   │
  │   DashboardReg.    │  │   ReportRegistry  │  │   LocalizationRegistry │   │
  │   ThemeRegistry    │  └───────────────────┘  └────────────────────────┘   │
  └────────────────────┘                                                        │
                                                                                │
  ┌─────────────────────────────────────────────────────────────────────────┐  │
  │                      RegistrationPipeline<TDef>                          │◄─┘
  │                                                                          │
  │  + run(def, pluginId, context): RegistrationResult<TDef>               │
  │                                                                          │
  │  Steps (in order):                                                       │
  │  1. SchemaValidation                                                     │
  │  2. IdNormalization                                                      │
  │  3. DependencyResolution                                                 │
  │  4. ConflictDetection                                                    │
  │  5. OverrideMerge                                                        │
  │  6. ChecksumGeneration                                                   │
  │  7. IndexUpdate                                                          │
  │  8. EntryFinalization                                                    │
  └──────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────┐    ┌───────────────────────────────────┐
  │  RegistryDiagnostics     │    │       RegistryEventEmitter        │
  │  - detect duplicates     │    │  - emit(event: RegistryEvent)     │
  │  - detect cycles         │    │  - on(type): Observable           │
  │  - detect orphans        │    └───────────────────────────────────┘
  │  - performance metrics   │
  │  - health summary        │
  └──────────────────────────┘
```

---

## 3. Common RegistryEntry Model

Every entry in every registry — regardless of its type — is wrapped in a `RegistryEntry<T>` envelope. The raw definition `T` is accessible as `.definition`. Engines always receive the unwrapped `T` from query APIs; the `RegistryEntry<T>` envelope is internal to the registry.

```
RegistryEntry<TDef>
│
├── id                  string
│     Canonical identifier. Format: '{plugin-id}:{resource-type}:{name}' (lowercase)
│     Examples: 'hr:entity:employee', 'fleet:form:vehicle-create', 'auth:route:login'
│     Validated for uniqueness within the registry at registration time.
│
├── version             string (SemVer)
│     Version of this entry. Populated from the plugin's version if not overridden.
│     Used for conflict detection and upgrade safety.
│
├── sourcePluginId      string
│     The plugin that originally registered this entry.
│     Immutable after registration. Owner has exclusive replace rights.
│
├── overriddenBy        string[]
│     List of plugin IDs that have applied overrides to this entry, in priority order.
│     Populated during OverrideMerge pipeline step.
│
├── dependencies        RegistryDependency[]
│     Explicit dependencies on other registry entries.
│     { registryName: string; entryId: string; optional: boolean }
│     All non-optional dependencies must be registered before this entry publishes.
│
├── capabilities        string[]
│     Declared capabilities of this entry. e.g. ['exportable', 'searchable', 'auditable']
│     Used by engines to check feature availability without reading the definition.
│
├── definition          TDef
│     The merged, finalized metadata definition. Read-only after publish.
│     This is what engines receive from getById() and query().
│
├── rawDefinition       TDef
│     The original unmerged definition as submitted by the source plugin.
│     Preserved for diagnostics and override diffing.
│
├── checksum            string
│     SHA-256 of JSON.stringify(definition). Used to detect unintended mutations
│     and for hot-reload change detection.
│
├── registeredAt        string (ISO 8601)
│     Timestamp when the entry was first submitted to the pipeline.
│
├── publishedAt         string | null (ISO 8601)
│     Timestamp when the entry became available for engine queries. Null if pending.
│
├── status              RegistryEntryStatus
│     'pending'   — submitted, awaiting pipeline
│     'valid'     — passed validation, awaiting publish
│     'published' — available to engines
│     'degraded'  — published with warnings (non-critical validation failures)
│     'override'  — this entry itself IS an override (sourcePluginId ≠ ownerPluginId)
│     'invalid'   — failed validation; not published
│     'removed'   — unregistered at runtime (hot-reload only)
│
├── validationErrors    ValidationError[]
│     Populated during SchemaValidation step. Non-empty → status 'invalid'.
│
├── validationWarnings  ValidationWarning[]
│     Non-fatal validation issues. Entry can publish with warnings → status 'degraded'.
│
└── metadata            Record<string, unknown>
      Arbitrary key-value metadata for tooling, documentation, and diagnostics.
      Not used by engines. Examples: { category, tags, deprecated, since, replaces }
```

### 3.1 RegistryDependency

```
RegistryDependency
├── registryName   string      — which registry (e.g. 'entity', 'permission')
├── entryId        string      — the specific entry this entry depends on
├── optional       boolean     — if true, the dep missing causes 'degraded', not 'invalid'
└── reason         string      — human-readable why this dependency exists
```

### 3.2 RegistryEntryStatus Transitions

```
                  register() called
                       │
                  ┌────▼──────┐
                  │  PENDING  │
                  └────┬──────┘
                       │ pipeline runs
          ┌────────────┼─────────────┐
          │            │             │
     ┌────▼────┐  ┌────▼────┐  ┌────▼──────┐
     │  VALID  │  │ INVALID │  │ DEGRADED  │ (valid with warnings)
     └────┬────┘  └─────────┘  └────┬──────┘
          │                         │
          │   publish() called       │
          └────────────┬────────────┘
                  ┌────▼──────┐
                  │ PUBLISHED │  (frozen, immutable)
                  └────┬──────┘
                       │ unregister() (hot-reload only)
                  ┌────▼──────┐
                  │  REMOVED  │
                  └───────────┘
```

---

## 4. Registry Lifecycle Diagram

```
  Boot Step 03: RegistryInit
       │
       │  RegistryManager.initialize()
       ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │  All 16 registries enter state: INITIALIZING                       │
  └────────────────────────────────────────────────────────────────────┘
       │
       │  All registries ready
       ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │  All 16 registries enter state: OPEN                               │
  │  (accepting registrations, not yet frozen)                         │
  └────────────────────────────────────────────────────────────────────┘
       │
       │  Boot Step 06: PluginRegistration
       │  Each plugin calls register() on applicable registries
       ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │  Registries accumulate entries (all in PENDING → VALID state)      │
  │  Overrides are collected                                           │
  │  Cross-registry dependency declarations are recorded              │
  └────────────────────────────────────────────────────────────────────┘
       │
       │  Boot Step 06 complete (all plugins registered)
       │  RegistryManager.publishAll()
       ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │  Phase A: Cross-registry dependency resolution                     │
  │  Phase B: Global conflict detection across all registries          │
  │  Phase C: Override merge in priority order                         │
  │  Phase D: Index rebuild for all registries                         │
  └────────────────────────────────────────────────────────────────────┘
       │
       │  Per-registry publish()
       ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │  Each registry independently enters: PUBLISHED                     │
  │  Entries frozen — writes throw RegistryFrozenError                │
  │  Engines may now query registries                                  │
  │  RegistryReadyEvent emitted per registry                          │
  └────────────────────────────────────────────────────────────────────┘
       │
       │  All 16 registries PUBLISHED
       ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │  RegistryManager status: READY                                     │
  │  RegistryManagerReadyEvent emitted                                │
  │  Boot Step 06 resolves                                            │
  └────────────────────────────────────────────────────────────────────┘
       │
       │  (v1.1+ hot-reload only)
       ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │  Individual registries may enter: REFRESHING                       │
  │  During refresh: old entries remain live, new entries pending      │
  │  After refresh: registry re-enters PUBLISHED                       │
  └────────────────────────────────────────────────────────────────────┘
       │
       │  Kernel shutdown
       ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │  All registries enter: DISPOSED                                    │
  │  All Maps cleared, signals reset                                   │
  └────────────────────────────────────────────────────────────────────┘
```

**Registry Status values:**

| Status | Description |
|---|---|
| `INITIALIZING` | Registry object constructed, not yet ready to accept registrations |
| `OPEN` | Accepting `register()` calls |
| `PUBLISHING` | Running publishAll() — cross-registry resolution in progress |
| `PUBLISHED` | Frozen, available to engines |
| `DEGRADED` | Published with one or more invalid entries excluded |
| `REFRESHING` | Hot-reload: re-accepting registrations before re-publishing |
| `DISPOSED` | Kernel shutdown complete |

---

## 5. Registration Pipeline

Every call to `registry.register(def, pluginId)` synchronously executes an 8-step pipeline. The pipeline is synchronous because all plugin metadata is available at boot time. The pipeline runs per-entry, per-registry.

```
   register(def, pluginId)
          │
   ┌──────▼─────────────────────────────────────────────────────────────┐
   │  Step 1: Schema Validation                                          │
   │                                                                     │
   │  - Validate def against the registry's TypeScript schema           │
   │  - Check required fields are present and non-empty                 │
   │  - Check field types match expected types                          │
   │  - Check string field formats (IDs, SemVer, paths)                │
   │  - Check enum field values are in allowed set                      │
   │  - Collect all errors and warnings                                 │
   │  - On hard error: entry marked INVALID, pipeline aborted           │
   └──────┬─────────────────────────────────────────────────────────────┘
          │ pass
   ┌──────▼─────────────────────────────────────────────────────────────┐
   │  Step 2: ID Normalization                                           │
   │                                                                     │
   │  - Ensure ID is lowercase                                           │
   │  - Ensure ID matches pattern: ^[a-z0-9_-]+(:[a-z0-9_-]+)*$        │
   │  - Inject pluginId prefix if missing: 'employee' → 'hr:employee'  │
   │  - Resolve aliases (if entry declares 'replaces: oldId')           │
   └──────┬─────────────────────────────────────────────────────────────┘
          │
   ┌──────▼─────────────────────────────────────────────────────────────┐
   │  Step 3: Dependency Resolution                                      │
   │                                                                     │
   │  - Read def.dependencies (explicit) and inferred dependencies     │
   │  - For each dependency: check if already registered in target reg  │
   │  - If not yet registered: add to deferred resolution queue        │
   │  - If missing and non-optional after publishAll(): mark INVALID   │
   │  - Record dependency graph edges                                   │
   └──────┬─────────────────────────────────────────────────────────────┘
          │
   ┌──────▼─────────────────────────────────────────────────────────────┐
   │  Step 4: Conflict Detection                                         │
   │                                                                     │
   │  - Check if entry.id already exists in registry                   │
   │  - If yes, check sourcePluginId:                                   │
   │    SAME plugin: version upgrade → replace if newer, warn if older  │
   │    DIFFERENT plugin: conflict                                       │
   │      → If def declares 'overrides: targetId': route to Step 5     │
   │      → Otherwise: CONFLICT error, entry marked INVALID            │
   │  - Check capability conflicts (two entries claiming same exclusive │
   │    capability)                                                      │
   └──────┬─────────────────────────────────────────────────────────────┘
          │
   ┌──────▼─────────────────────────────────────────────────────────────┐
   │  Step 5: Override Merge                                             │
   │                                                                     │
   │  - If this entry is an override: locate base entry                │
   │  - Apply override using registry-specific merge strategy:          │
   │    SHALLOW: top-level keys replace base keys                       │
   │    DEEP: recursive merge, override wins on leaf conflicts          │
   │    ADDITIVE: override fields are appended (arrays merged)          │
   │    REPLACE: entire definition replaced (only owner may do this)    │
   │  - Record override in base entry's overriddenBy[]                 │
   │  - Assign priority order from plugin manifest.overridePriority    │
   └──────┬─────────────────────────────────────────────────────────────┘
          │
   ┌──────▼─────────────────────────────────────────────────────────────┐
   │  Step 6: Checksum Generation                                        │
   │                                                                     │
   │  - JSON.stringify(mergedDefinition) with sorted keys               │
   │  - Compute SHA-256 → store as entry.checksum                      │
   │  - Compare with previous checksum (if entry existed before):      │
   │    Same → skip re-indexing (idempotent registration)              │
   │    Different → proceed to Step 7                                   │
   └──────┬─────────────────────────────────────────────────────────────┘
          │
   ┌──────▼─────────────────────────────────────────────────────────────┐
   │  Step 7: Index Update                                               │
   │                                                                     │
   │  - Update all secondary indexes for this entry                    │
   │  - Standard indexes: sourcePluginId, status, capabilities         │
   │  - Registry-specific indexes: entityId, formId, routePath, etc.   │
   │  - Trie index update for searchable string fields                 │
   └──────┬─────────────────────────────────────────────────────────────┘
          │
   ┌──────▼─────────────────────────────────────────────────────────────┐
   │  Step 8: Entry Finalization                                         │
   │                                                                     │
   │  - Set entry.status = 'valid' (or 'degraded' if warnings exist)  │
   │  - Set entry.registeredAt = now()                                 │
   │  - Store entry in registry.entries Map                            │
   │  - Emit EntryRegisteredEvent (if OPEN state)                      │
   │  - Return RegistrationResult { success, entryId, warnings }       │
   └─────────────────────────────────────────────────────────────────────┘
```

### 5.1 RegistrationResult

```
RegistrationResult<TDef>
├── success       boolean
├── entryId       string
├── entry         RegistryEntry<TDef> | null
├── warnings      RegistrationWarning[]
└── errors        RegistrationError[]
    ├── code      string  (e.g. 'SCHEMA_INVALID', 'CONFLICT', 'DEP_MISSING')
    ├── field     string | null
    └── message   string
```

### 5.2 Publish Phase — Cross-Registry Resolution

After all plugins complete their `register()` calls, `publishAll()` runs a global resolution pass:

```
publishAll()
     │
     │ 1. Resolve deferred dependencies
     │    For each entry with unresolved deps:
     │    - Check if dep now registered in target registry
     │    - If yes: mark resolved
     │    - If no (and not optional): mark entry INVALID, add to degraded list
     │
     │ 2. Detect cross-registry cycles
     │    Build global dep graph across all registries
     │    Run cycle detection (DFS with WHITE/GRAY/BLACK colouring)
     │    Cycles → all affected entries marked INVALID
     │
     │ 3. Merge overrides in priority order
     │    For each base entry with overrides:
     │    Sort overrides by plugin.overridePriority (desc)
     │    Apply merges in order
     │
     │ 4. Rebuild all indexes
     │
     │ 5. Freeze all entries (set publishedAt)
     │
     │ 6. Per-registry: publish()
     │    Set registry.status = PUBLISHED (or DEGRADED)
     │    Emit RegistryPublishedEvent
     │
     └ 7. RegistryManager.status = READY
          Emit RegistryManagerReadyEvent
```

---

## 6. Registry Events

All registry events are emitted through the platform `EventBus`. They are typed members of the `RegistryEvent` union. Engines subscribe to specific event types using `EventBus.on('registry:entity:registered')`.

### 6.1 Event Union

```typescript
type RegistryEvent =
  // ── Manager-level ──────────────────────────────────────────────────────
  | RegistryManagerReadyEvent
  | RegistryManagerDegradedEvent
  | RegistryManagerDisposedEvent

  // ── Per-registry lifecycle ─────────────────────────────────────────────
  | RegistryPublishedEvent
  | RegistryFrozenEvent
  | RegistryDegradedEvent
  | RegistryRefreshStartedEvent     // v1.1 hot-reload
  | RegistryRefreshCompletedEvent   // v1.1 hot-reload

  // ── Entry lifecycle ────────────────────────────────────────────────────
  | EntryRegisteredEvent
  | EntryValidatedEvent
  | EntryPublishedEvent
  | EntryUpdatedEvent               // override applied or hot-reload update
  | EntryRemovedEvent               // hot-reload only
  | EntryConflictDetectedEvent
  | EntryValidationFailedEvent

  // ── Plugin-scoped ──────────────────────────────────────────────────────
  | PluginEntriesRegisteredEvent    // all entries for one plugin registered
  | PluginEntriesRemovedEvent       // hot-reload: plugin's entries removed

  // ── Diagnostics ────────────────────────────────────────────────────────
  | RegistryHealthDegradedEvent;
```

### 6.2 Event Definitions

```
RegistryManagerReadyEvent
  type:             'registry:manager:ready'
  timestamp:        string
  totalEntries:     number
  publishedRegistries: string[]
  degradedRegistries:  string[]
  durationMs:       number

RegistryManagerDegradedEvent
  type:             'registry:manager:degraded'
  timestamp:        string
  degradedRegistries: Array<{ name: string; invalidCount: number; reason: string }>

RegistryPublishedEvent
  type:             'registry:{name}:published'    e.g. 'registry:entity:published'
  timestamp:        string
  registryName:     string
  entryCount:       number
  invalidCount:     number
  overrideCount:    number
  durationMs:       number

RegistryFrozenEvent
  type:             'registry:{name}:frozen'
  timestamp:        string
  registryName:     string

EntryRegisteredEvent
  type:             'registry:{name}:entry:registered'
  timestamp:        string
  registryName:     string
  entryId:          string
  sourcePluginId:   string
  version:          string

EntryUpdatedEvent
  type:             'registry:{name}:entry:updated'
  timestamp:        string
  registryName:     string
  entryId:          string
  updatedByPluginId: string
  previousChecksum: string
  newChecksum:      string
  changeType:       'override' | 'hot-reload-update'

EntryRemovedEvent
  type:             'registry:{name}:entry:removed'
  timestamp:        string
  registryName:     string
  entryId:          string
  removedByPluginId: string

EntryConflictDetectedEvent
  type:             'registry:{name}:entry:conflict'
  timestamp:        string
  registryName:     string
  entryId:          string
  existingPluginId: string
  conflictingPluginId: string
  resolution:       'existing-wins' | 'newer-wins' | 'manual-required'

PluginEntriesRegisteredEvent
  type:             'registry:plugin:registered'
  timestamp:        string
  pluginId:         string
  entriesByRegistry: Record<string, number>   { entity: 3, form: 3, table: 3, ... }
  totalEntries:     number
```

---

## 7. Registry Manager API

### 7.1 RegistryAPI Interface (implements in RegistryManager)

```
RegistryAPI
│
├── readonly isInitialized: boolean
├── readonly status: Signal<RegistryManagerStatus>
│
├── // Registry accessors
├── readonly entity:     EntityRegistry
├── readonly form:       FormRegistry
├── readonly table:      TableRegistry
├── readonly route:      RouteRegistry
├── readonly menu:       MenuRegistry
├── readonly action:     ActionRegistry
├── readonly permission: PermissionRegistry
├── readonly widget:     WidgetRegistry
├── readonly layout:     LayoutRegistry
├── readonly validation: ValidationRegistry
├── readonly lookup:     LookupRegistry
├── readonly workflow:   WorkflowRegistry
├── readonly dashboard:  DashboardRegistry
├── readonly report:     ReportRegistry
├── readonly locale:     LocalizationRegistry
├── readonly theme:      ThemeRegistry
│
├── // Generic accessor
├── get(name: RegistryName): BaseRegistry<unknown>
│
├── // Lifecycle
├── publishAll(): Promise<void>
├── dispose(): void
│
└── // Diagnostics
    getDiagnostics(): RegistryDiagnosticsReport
    getHealthReport(): RegistryHealthReport
```

### 7.2 BaseRegistry<TDef> API

Every concrete registry inherits this API. Engines call these methods.

```
BaseRegistry<TDef>
│
├── // Status
├── readonly status: Signal<RegistryStatus>
├── readonly isPublished: Signal<boolean>
│
├── // Registration (OPEN state only)
├── register(def: TDef, pluginId: string): RegistrationResult<TDef>
├── unregister(id: string, pluginId: string): void   (REFRESHING state only)
│
├── // Queries (PUBLISHED state — O(1) for getById, O(k) for query)
├── getById(id: string): TDef | null
├── getAll(): TDef[]
├── query(filter: RegistryQuery<TDef>): TDef[]
├── exists(id: string): boolean
├── count(): number
│
├── // Entry inspection (internal + diagnostics)
├── getEntry(id: string): RegistryEntry<TDef> | null
├── getAllEntries(): RegistryEntry<TDef>[]
├── getEntriesByPlugin(pluginId: string): RegistryEntry<TDef>[]
│
├── // Lifecycle (called by RegistryManager)
├── publish(): void
├── freeze(): void
├── dispose(): void
│
└── // Diagnostics
    getDiagnostics(): RegistryDiagnosticsResult
```

### 7.3 RegistryQuery<TDef>

```
RegistryQuery<TDef>
├── where?       Partial<TDef>                    — exact field match
├── filter?      (def: TDef) => boolean           — predicate function
├── pluginId?    string                           — filter by source plugin
├── status?      RegistryEntryStatus | RegistryEntryStatus[]
├── capability?  string | string[]               — must have ALL capabilities
├── limit?       number                           — max results (default: unlimited)
├── offset?      number                           — pagination
└── orderBy?     keyof TDef                       — sort field (ascending)
```

---

## 8. Registry Diagnostics

### 8.1 RegistryDiagnosticsReport (manager-level)

```
RegistryDiagnosticsReport
├── generatedAt:          string
├── managerStatus:        RegistryManagerStatus
├── totalEntries:         number
├── totalPublished:       number
├── totalInvalid:         number
├── totalOverrides:       number
├── perRegistry:          RegistryDiagnosticsResult[]   (one per registry)
├── duplicates:           DuplicateConflict[]
├── versionConflicts:     VersionConflict[]
├── missingDependencies:  MissingDependency[]
├── orphanEntries:        OrphanEntry[]
├── crossRegistryCycles:  DependencyCycle[]
├── performanceMetrics:   RegistryPerformanceMetrics
└── healthSummary:        RegistryHealthSummary
```

### 8.2 RegistryDiagnosticsResult (per-registry)

```
RegistryDiagnosticsResult
├── registryName:       string
├── status:             RegistryStatus
├── totalEntries:       number
├── publishedCount:     number
├── invalidCount:       number
├── degradedCount:      number
├── overrideCount:      number
├── entriesByPlugin:    Record<string, number>
├── invalidEntries:     Array<{ id: string; errors: string[] }>
├── overriddenEntries:  Array<{ id: string; overriddenBy: string[] }>
├── publishDurationMs:  number
└── indexSizes:         Record<string, number>   (index name → entry count)
```

### 8.3 Diagnostic Checks

**Duplicate Detection**  
After all plugins register, scan each registry for entries with the same ID submitted by different plugins without one declaring `overrides`. Any such pair is a `DuplicateConflict`:
```
DuplicateConflict
├── registryName:   string
├── entryId:        string
├── pluginIds:      string[]    — all plugins claiming this ID
└── resolution:     'first-wins' | 'last-wins' | 'manual'
```

**Version Conflicts**  
When the same plugin registers the same entry ID twice with different versions:
```
VersionConflict
├── registryName:   string
├── entryId:        string
├── pluginId:       string
├── versions:       string[]    — all registered versions
└── winner:         string      — which version won (always latest)
```

**Missing Dependencies**  
After publishAll() runs dependency resolution, any entry whose non-optional dependencies are unresolved:
```
MissingDependency
├── registryName:       string
├── entryId:            string
├── missingDeps:        Array<{ registryName: string; entryId: string }>
└── impact:             'entry-invalid' | 'entry-degraded'
```

**Orphan Entries**  
An entry in one registry references a non-existent entry in another registry through an inferred dependency (e.g., a FormEntry whose `entityId` does not exist in EntityRegistry):
```
OrphanEntry
├── registryName:     string
├── entryId:          string
├── missingReference: { registryName: string; entryId: string }
└── fieldPath:        string    — which field created the inferred dep
```

**Dependency Cycles**  
A cycle in the cross-registry dependency graph:
```
DependencyCycle
├── cycle:   string[]   — ordered list of entryIds forming the cycle
└── impact:  string[]   — all entries invalidated due to this cycle
```

**Performance Metrics**

```
RegistryPerformanceMetrics
├── totalRegistrationMs:  number    — time for all register() calls
├── totalPublishMs:       number    — time for publishAll()
├── slowestRegistry:      { name: string; publishMs: number }
├── slowestEntry:         { registryName: string; entryId: string; pipelineMs: number }
├── indexRebuildMs:       Record<string, number>
└── peakMemoryEstimateKb: number    — rough estimate of registry Map sizes
```

---

## 9. Entity Registry

### 9.1 Purpose

The Entity Registry is the master catalog of all data entities in the system. Every screen that lists, creates, views, or edits data does so through an `EntityDef`. The `EntityViewComponent` (the universal screen host) reads from this registry to know how to render.

### 9.2 Responsibilities

- Accept and store `EntityDef` registrations from plugins
- Validate entity IDs, API paths, permission references, and field references
- Index entities by plugin, by module code, and by API path
- Provide the `EntityDef` to `EntityViewComponent` on route activation
- Serve as the root reference for FormRegistry, TableRegistry, and ActionRegistry lookups

### 9.3 Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| `id` must match `^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$` | ERROR | Format: `'{module}:{entity}'` |
| `apiPath` must start with `/v1/` | ERROR | Backend convention |
| `permissions.list` must exist in PermissionRegistry | WARNING | Orphan permission code |
| `table` and `form.create` are both required | ERROR | Entity without table or form is non-functional |
| `labelSingular` and `labelPlural` are required non-empty strings | ERROR | Used in UI breadcrumbs |
| `defaultView` must be `'table'` or `'detail'` | ERROR | Unknown view type |
| Duplicate `id` from same plugin = version upgrade | INFO | Allowed |
| Duplicate `id` from different plugin = CONFLICT | ERROR | Without `overrides` declaration |
| `apiPath` must be unique across all entities | WARNING | Duplicate paths cause request ambiguity |

### 9.4 Public API (Additional)

Beyond `BaseRegistry<EntityDef>`:

```
EntityRegistry extends BaseRegistry<EntityDef>
│
├── getByApiPath(path: string): EntityDef | null
├── getByPluginId(pluginId: string): EntityDef[]
├── getByModuleCode(moduleCode: string): EntityDef[]
├── getSearchable(): EntityDef[]        — entities with searchable: true
├── getExportable(): EntityDef[]        — entities with exportable: true
└── getWithCapability(cap: string): EntityDef[]
```

### 9.5 Secondary Indexes

- `byApiPath`: `Map<apiPath, entryId>`
- `byPluginId`: `Map<pluginId, entryId[]>`
- `byModuleCode`: `Map<moduleCode, entryId[]>`
- `byCapability`: `Map<capability, entryId[]>`

### 9.6 Lifecycle Events

- `registry:entity:registered` — entry accepted
- `registry:entity:published` — registry frozen
- `registry:entity:conflict` — duplicate ID detected

### 9.7 Performance Considerations

- `getById()` → O(1) Map lookup
- `getByApiPath()` → O(1) secondary index lookup
- `getByPluginId()` → O(1) secondary index lookup → O(k) array return
- `getAll()` → O(n) — avoid in hot render paths; use specific index queries

---

## 10. Form Registry

### 10.1 Purpose

The Form Registry stores `FormSchema` definitions. A `FormSchema` describes the sections, fields, layout, validators, and hooks that make up a data entry form. The `FormEngineComponent` reads from this registry to build reactive forms without writing component code.

### 10.2 Responsibilities

- Accept `FormSchema` registrations keyed by `{entityId}:{mode}` (e.g., `hr:employee:create`)
- Validate all field types against FieldRegistry entries (inferred dependency)
- Validate validator references against ValidationRegistry entries (inferred dependency)
- Validate entity-picker `entityRef` values against EntityRegistry entries
- Merge override schemas (e.g., tenant-specific field additions)

### 10.3 Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| ID format: `{entityId}:{mode}` where mode ∈ `{create, edit, view, import}` | ERROR | |
| `entityId` must resolve in EntityRegistry | WARNING | Orphan form |
| `sections` must be non-empty array | ERROR | |
| Each section must have `id` and at least one `field` | ERROR | |
| Field `type` must resolve in FieldRegistry (or be a built-in type) | WARNING | Unresolvable type → field renders as text fallback |
| Field `validators[].type` must resolve in ValidationRegistry | WARNING | Unknown validator silently skipped |
| `entityRef` on entity-picker fields must resolve in EntityRegistry | WARNING | Orphan picker |
| `sections[].columns` must be 1, 2, 3, or 4 | ERROR | Grid constraint |

### 10.4 Public API (Additional)

```
FormRegistry extends BaseRegistry<FormSchema>
│
├── getByEntity(entityId: string): FormSchema[]      — all forms for an entity
├── getByEntityAndMode(entityId: string, mode: FormMode): FormSchema | null
└── getModes(entityId: string): FormMode[]
```

**FormMode:** `'create' | 'edit' | 'view' | 'import'`

### 10.5 Override Strategy

`DEEP` merge — override schemas can add fields to sections, modify field properties, or add new sections. Override fields with matching `key` replace base fields.

### 10.6 Secondary Indexes

- `byEntityId`: `Map<entityId, { [mode: string]: entryId }>`

---

## 11. Table Registry

### 11.1 Purpose

The Table Registry stores `TableDef` definitions. A `TableDef` declares columns, sorting, pagination, selection, and export behaviour for a list view. The `TableEngineComponent` reads from this registry.

### 11.2 Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| ID format: `{entityId}:table` | ERROR | |
| `entityId` must resolve in EntityRegistry | WARNING | |
| `columns` must be non-empty | ERROR | |
| Each column must have `id` and either `accessor` or `type: 'actions'` | ERROR | |
| Column `type` must be a known ColumnType | ERROR | Unknown type → error in table |
| Column `accessor` must be a string (no dot-path in v1 — reserved for v1.2) | WARNING | |
| `defaultSort.field` must match a column `accessor` | WARNING | |
| `pageSize` must be between 5 and 200 | ERROR | Backend Pageable constraint |
| Custom `badgeConfig` keys must be uppercase strings | WARNING | |

### 11.3 Public API (Additional)

```
TableRegistry extends BaseRegistry<TableDef>
│
├── getByEntity(entityId: string): TableDef | null
└── getActionColumns(entityId: string): ColumnDef[]
```

### 11.4 Override Strategy

`ADDITIVE` for `columns` array — overrides can inject additional columns. `SHALLOW` for top-level properties (`pageSize`, `selectable`, etc.).

---

## 12. Route Registry

### 12.1 Purpose

The Route Registry stores `RouteDef` entries that are compiled into Angular `Route[]` at boot Step 08. The wildcard route pattern means all entity screens share a single `EntityViewComponent` host — the RouteRegistry controls what URL maps to which entity and mode.

### 12.2 Responsibilities

- Accept `RouteDef` registrations from plugins
- Detect duplicate path patterns
- Resolve permission guard references
- Compile to Angular `Route[]` via `buildAngularRoutes()` at boot Step 08

### 12.3 RouteDef Structure

```
RouteDef
├── path:           string      — Angular route path (e.g. 'hr/employees')
├── entityId:       string      — EntityRegistry lookup key
├── title?:         string      — page title (defaults to entity.labelPlural)
├── permissions?:   string[]    — required permissions (ANDed)
├── moduleCode?:    string      — used to check if module is active in context
├── canActivate?:   string[]    — named guard IDs from a future GuardRegistry
├── preload?:       boolean     — whether to preload this route's lazy chunk
└── data?:          Record<string, unknown>   — extra Angular route data
```

### 12.4 Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| `path` must not start or end with `/` | ERROR | Angular convention |
| `entityId` must resolve in EntityRegistry | ERROR | Unresolvable entity = broken route |
| Duplicate `path` from different plugins = CONFLICT | ERROR | Two routes at same URL |
| Duplicate `path` from same plugin = version upgrade | INFO | |
| `permissions[]` values should resolve in PermissionRegistry | WARNING | |

### 12.5 Public API (Additional)

```
RouteRegistry extends BaseRegistry<RouteDef>
│
├── getByEntityId(entityId: string): RouteDef[]
├── getByModuleCode(moduleCode: string): RouteDef[]
├── buildAngularRoutes(): Route[]           — called by Boot Step 08
└── getRouteForEntity(entityId: string): string | null   — reverse lookup
```

### 12.6 Angular Route Compilation

`buildAngularRoutes()` produces Angular lazy-loaded routes:

```
For each RouteDef:
  {
    path:           routeDef.path + '/:mode',    // 'hr/employees/:mode'
    loadComponent:  () => import(EntityViewComponent),
    canActivate:    [permissionGuard],
    data: {
      entityId:    routeDef.entityId,
      permissions: routeDef.permissions ?? [],
      moduleCode:  routeDef.moduleCode,
    }
  }
  Plus:
  { path: routeDef.path, redirectTo: routeDef.path + '/list', pathMatch: 'full' }
```

---

## 13. Menu Registry

### 13.1 Purpose

The Menu Registry stores `MenuItemDef` entries. The `MenuEngine` reads from this registry to build the sidebar navigation tree, applying permission filtering reactively through signals.

### 13.2 Responsibilities

- Accept `MenuItemDef` registrations from plugins
- Accept dynamic menu items from backend `/v1/modules` endpoint (loaded at Step 07)
- Build the navigation tree (flat list → tree by `parentId`)
- Support badge registrations (unread count, notification count)

### 13.3 MenuItemDef Structure

```
MenuItemDef
├── id:           string      — 'hr:menu:employees'
├── label:        string
├── icon:         string      — icon identifier
├── path:         string      — navigation path (matches a RouteDef.path)
├── order:        number      — sort weight within parent
├── parentId?:    string      — parent menu item ID (null = root)
├── permission?:  string      — single permission code to guard visibility
├── moduleCode?:  string      — active module check
├── badgeKey?:    string      — key for MenuBadgeService lookup
├── children?:    MenuItemDef[]   — inline children (flattened on registration)
└── source:       'plugin' | 'backend'   — origin of this item
```

### 13.4 Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| `id` must be unique | ERROR | |
| `path` must resolve in RouteRegistry | WARNING | Orphan menu item (no route) |
| `parentId` must resolve to another MenuItemDef | ERROR | Dangling parent |
| `order` must be a positive integer | WARNING | Defaults to 999 |
| `permission` should resolve in PermissionRegistry | WARNING | |

### 13.5 Public API (Additional)

```
MenuRegistry extends BaseRegistry<MenuItemDef>
│
├── getTree(): MenuTreeNode[]           — hierarchical structure, root items
├── getFlatList(): MenuItemDef[]        — pre-ordered flat list
├── getByModuleCode(code: string): MenuItemDef[]
├── getByPath(path: string): MenuItemDef | null
└── setBadge(menuItemId: string, count: number): void
```

### 13.6 Tree Build Algorithm

After `publish()`:
1. Index all items by `id`
2. For each item with `parentId`: attach to parent's `children[]`
3. Sort children by `order` at each level
4. Root items = items with no `parentId`
5. Produce `MenuTreeNode[]` (read-only, frozen)

---

## 14. Action Registry

### 14.1 Purpose

The Action Registry stores `ActionDef` entries. Actions are the operations available to users (create, edit, delete, activate, export, custom workflow transitions). The `ActionEngine` reads from this registry to determine which actions to render and execute.

### 14.2 Responsibilities

- Accept `ActionDef` registrations from plugins
- Index actions by entity ID and scope
- Validate that all referenced permissions exist
- Validate handler signatures
- Detect duplicate action IDs within the same entity

### 14.3 ActionDef Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| `id` format: `{pluginId}:{entity}:{verb}` | ERROR | |
| `scope[]` must contain only valid scopes: `row, bulk, global, header, detail` | ERROR | |
| `permission` should resolve in PermissionRegistry | WARNING | |
| `handler` must be a function | ERROR | |
| `confirmBefore.type` must be `info, warn, danger` | ERROR | |
| Duplicate `id` from same entity in same plugin | WARNING | |

### 14.4 Public API (Additional)

```
ActionRegistry extends BaseRegistry<ActionDef>
│
├── getByEntity(entityId: string): ActionDef[]
├── getByEntityAndScope(entityId: string, scope: ActionScope): ActionDef[]
├── getGlobal(): ActionDef[]        — scope: 'global'
└── getByPermission(permission: string): ActionDef[]
```

### 14.5 Secondary Indexes

- `byEntityId`: `Map<entityId, entryId[]>`
- `byScope`: `Map<ActionScope, entryId[]>`
- `byEntityAndScope`: `Map<'${entityId}:${scope}', entryId[]>`

---

## 15. Permission Registry

### 15.1 Purpose

The Permission Registry is the authoritative catalog of all permission codes in the system. It does NOT store which user has which permissions — that lives in `PlatformContext.permissions` (runtime state). It stores the definition of what each permission code means, its module, and its resource/action breakdown.

### 15.2 Responsibilities

- Accept `PermissionDef` registrations from plugins
- Validate permission code format: `'MODULE:resource:action'`
- Detect duplicate permission codes across plugins
- Serve as the reference for validation warnings in other registries

### 15.3 PermissionDef Structure

```
PermissionDef
├── code:         string      — 'HR:EMPLOYEES:READ' (exact format)
├── moduleCode:   string      — 'HR'
├── resource:     string      — 'EMPLOYEES'
├── action:       string      — 'READ'
├── label:        string      — 'View Employees'
├── description?: string
└── implies?:     string[]    — other permission codes this automatically grants
```

### 15.4 Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| `code` must match `^[A-Z][A-Z0-9_]+:[A-Z][A-Z0-9_]+:[A-Z][A-Z0-9_]+$` | ERROR | |
| `code` must be globally unique | ERROR | |
| `implies[]` entries must resolve in this registry | WARNING | |

### 15.5 Public API (Additional)

```
PermissionRegistry extends BaseRegistry<PermissionDef>
│
├── getByModule(moduleCode: string): PermissionDef[]
├── getByResource(resource: string): PermissionDef[]
├── validate(code: string): boolean        — is code known to registry?
├── getImplied(code: string): string[]     — all codes implied by this code
└── getAllCodes(): string[]
```

---

## 16. Widget Registry

### 16.1 Purpose

The Widget Registry stores `WidgetDef` entries. Widgets are self-contained dashboard components that can be placed on dashboard grids. The `WidgetEngine` reads from this registry to resolve widget components by ID.

### 16.2 Responsibilities

- Accept `WidgetDef` registrations from plugins
- Validate lazy-loaded component references
- Index widgets by category and permission
- Serve as the component catalog for the Dashboard Engine's drag-and-drop picker

### 16.3 WidgetDef Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| `id` format: `{pluginId}:widget:{name}` | ERROR | |
| `component` must be a function returning `Promise<Type<WidgetComponent>>` | ERROR | |
| `minWidth` must be 1–12 | ERROR | 12-column grid constraint |
| `permission` should resolve in PermissionRegistry | WARNING | |
| Duplicate `id` = CONFLICT | ERROR | |

### 16.4 Public API (Additional)

```
WidgetRegistry extends BaseRegistry<WidgetDef>
│
├── getByCategory(category: string): WidgetDef[]
├── getByPermission(permission: string): WidgetDef[]
└── getPickerList(): WidgetPickerEntry[]   — for dashboard widget picker UI
```

---

## 17. Layout Registry

### 17.1 Purpose

The Layout Registry stores `LayoutDef` entries that define page layout templates. Beyond the four built-in layouts (Standard, Split-Pane, Tabs, Dashboard), plugins can register custom layouts.

### 17.2 LayoutDef Structure

```
LayoutDef
├── id:           string      — 'standard', 'split-pane', 'tabs', 'dashboard', or '{plugin}:layout:{name}'
├── name:         string
├── component:    () => Promise<Type<LayoutComponent>>
├── slots:        LayoutSlot[]
│   ├── id:       string
│   ├── name:     string
│   └── optional: boolean
└── previewIcon:  string
```

### 17.3 Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| Built-in IDs (`standard`, `split-pane`, `tabs`, `dashboard`) are pre-registered by kernel | INFO | |
| Plugin layouts must prefix with `{pluginId}:` | ERROR | |
| `slots[]` must have at least one non-optional slot | ERROR | |

### 17.4 Public API

```
LayoutRegistry extends BaseRegistry<LayoutDef>
│
├── getDefault(): LayoutDef
└── getSlots(layoutId: string): LayoutSlot[]
```

---

## 18. Validation Registry

### 18.1 Purpose

The Validation Registry stores `ValidatorDef` and `AsyncValidatorDef` entries. The `FormEngineComponent` resolves validator factories from this registry when building reactive forms.

### 18.2 ValidatorDef Structure

```
ValidatorDef
├── id:             string      — validator type key (e.g. 'egyptianNationalId')
├── factory:        ValidatorFactory    — (params?, message?) => ValidatorFn
├── defaultMessage: string
└── paramSchema?:   Record<string, unknown>   — JSON Schema for params validation
```

### 18.3 Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| `id` must be a valid camelCase identifier | WARNING | |
| Built-in types (required, min, max, email, pattern, …) cannot be overridden | ERROR | |
| `factory` must be a function | ERROR | |

### 18.4 Public API

```
ValidationRegistry extends BaseRegistry<ValidatorDef>
│
├── getFactory(id: string): ValidatorFactory | null
├── getAsyncFactory(id: string): AsyncValidatorFactory | null
├── isBuiltIn(id: string): boolean
└── getAllIds(): string[]
```

---

## 19. Lookup Registry

### 19.1 Purpose

The Lookup Registry stores static and semi-static reference data used in select fields (e.g., country lists, currency codes, status enums). Storing these here avoids hardcoding them in FormSchemas and allows tenant overrides.

### 19.2 LookupDef Structure

```
LookupDef
├── id:           string      — 'platform:countries', 'hr:contract-types'
├── label:        string
├── items:        LookupItem[]
│   ├── value:    string | number
│   ├── label:    string
│   ├── disabled?: boolean
│   └── metadata?: Record<string, unknown>
├── source:       'static' | 'remote'
├── remoteUrl?:   string      — if source='remote', fetched on first use
└── cacheTtlMs?:  number      — how long to cache remote results
```

### 19.3 Public API

```
LookupRegistry extends BaseRegistry<LookupDef>
│
├── getItems(lookupId: string): LookupItem[]
├── getItem(lookupId: string, value: string): LookupItem | null
└── refresh(lookupId: string): Promise<void>   — re-fetch remote lookups
```

### 19.4 Override Strategy

`ADDITIVE` — override plugins can add items or mark items as `disabled: true`. They cannot remove items (use `disabled` instead).

---

## 20. Workflow Registry

### 20.1 Purpose

The Workflow Registry stores `WorkflowDef` entries. A workflow defines the valid states and transitions for an entity (e.g., Employee: ACTIVE → INACTIVE, SUSPENDED ↔ ACTIVE). The `ActionEngine` converts workflow transitions into `ActionDef`-compatible operations.

### 20.2 WorkflowDef Structure

```
WorkflowDef
├── id:           string      — '{entityId}:workflow' e.g. 'hr:employee:workflow'
├── entityId:     string      — which entity this workflow governs
├── states:       WorkflowState[]
│   ├── id:       string
│   ├── label:    string
│   ├── terminal: boolean     — no outgoing transitions
│   └── color:    'success' | 'warn' | 'danger' | 'neutral'
├── transitions:  WorkflowTransition[]
│   ├── id:       string
│   ├── from:     string | string[]   — source state(s)
│   ├── to:       string              — target state
│   ├── label:    string
│   ├── permission: string
│   ├── confirmBefore?: ConfirmConfig
│   └── handler?: ActionHandler       — custom HTTP call (default: PATCH {apiPath}/{id}/status)
└── initialState: string
```

### 20.3 Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| `entityId` must resolve in EntityRegistry | ERROR | Orphan workflow |
| `initialState` must be in `states[].id` | ERROR | |
| All transition `from` and `to` values must be in `states[].id` | ERROR | |
| No state can be both `terminal` and have outgoing transitions | ERROR | |
| Duplicate `entityId` = CONFLICT (entity can only have one workflow) | ERROR | |

### 20.4 Public API

```
WorkflowRegistry extends BaseRegistry<WorkflowDef>
│
├── getByEntity(entityId: string): WorkflowDef | null
├── getTransitions(entityId: string, fromState: string): WorkflowTransition[]
├── canTransition(entityId: string, from: string, to: string): boolean
└── toActionDefs(workflowId: string): ActionDef[]   — used by ActionEngine
```

---

## 21. Dashboard Registry

### 21.1 Purpose

The Dashboard Registry stores default dashboard layouts — the pre-configured widget grids shown to users when they first access the dashboard for a role or module. Users can customize their dashboards; those customizations are stored in the backend (`/v1/users/{id}/dashboard`), not in this registry.

### 21.2 DashboardDef Structure

```
DashboardDef
├── id:           string      — 'hr:default-dashboard', 'platform:home-dashboard'
├── name:         string
├── targetRole?:  string      — if set, shown by default to users with this role
├── moduleCode?:  string      — if set, shown for this module's home
├── layout:       DashboardLayout
│   └── slots:   DashboardSlot[]
│       ├── widgetId:   string    — WidgetRegistry entry ID
│       ├── column:     number    — 1-based
│       ├── row:        number    — 1-based
│       ├── colSpan:    number
│       └── rowSpan:    number
└── locked:       boolean    — if true, user cannot modify (admin override)
```

### 21.3 Public API

```
DashboardRegistry extends BaseRegistry<DashboardDef>
│
├── getDefault(): DashboardDef | null          — platform home dashboard
├── getForModule(moduleCode: string): DashboardDef | null
└── getForRole(roleCode: string): DashboardDef | null
```

---

## 22. Report Registry

### 22.1 Purpose

The Report Registry stores `ReportDef` entries — parameterized report definitions that can be generated on demand. In v1, reports are backend-generated and the frontend provides the parameter form and download trigger.

### 22.2 ReportDef Structure

```
ReportDef
├── id:           string      — '{pluginId}:report:{name}'
├── name:         string
├── description?: string
├── entityId?:    string      — which entity this report is about
├── permission:   string
├── formats:      ('pdf' | 'csv' | 'xlsx')[]
├── endpoint:     string      — POST endpoint that generates the report
├── parameters?:  FormSchema  — parameters form (uses FormEngine)
└── icon?:        string
```

### 22.3 Public API

```
ReportRegistry extends BaseRegistry<ReportDef>
│
├── getByEntity(entityId: string): ReportDef[]
└── getByPermission(permission: string): ReportDef[]
```

---

## 23. Localization Registry

### 23.1 Purpose

The Localization Registry stores translation bundles (`LocaleDef`) contributed by plugins. The platform's i18n service reads from this registry at runtime to resolve translation keys.

### 23.2 LocaleDef Structure

```
LocaleDef
├── id:           string           — '{pluginId}:locale:{lang}' e.g. 'hr:locale:ar'
├── language:     string           — ISO 639-1 code: 'en', 'ar', 'fr'
├── pluginId:     string
├── namespace:    string           — translation key namespace e.g. 'hr'
└── translations: Record<string, string>   — flat key-value map
    Examples:
      'employees.list.title' → 'Employees'
      'employees.create.button' → 'New Employee'
      'employees.status.active' → 'Active'
```

### 23.3 Registration Rules

| Rule | Severity | Detail |
|---|---|---|
| `language` must be a valid ISO 639-1 code | ERROR | |
| Duplicate `namespace` for the same `language` from different plugins = CONFLICT | ERROR | Use `overrides` |
| `translations` must be a non-empty object | ERROR | |

### 23.4 Override Strategy

`SHALLOW` — override translations replace specific keys; all other base keys remain.

### 23.5 Public API

```
LocalizationRegistry extends BaseRegistry<LocaleDef>
│
├── getTranslations(language: string, namespace: string): Record<string, string>
├── getLanguages(): string[]
├── getNamespaces(): string[]
├── getMergedBundle(language: string): Record<string, string>   — all namespaces merged
└── hasLanguage(language: string): boolean
```

---

## 24. Theme Registry

### 24.1 Purpose

The Theme Registry stores `ThemeDef` entries — named sets of CSS custom properties and PrimeNG theme tokens. Multiple themes can be registered; the active theme is controlled by a signal in `PlatformContext`.

### 24.2 ThemeDef Structure

```
ThemeDef
├── id:           string      — 'platform:theme:light', 'platform:theme:dark', '{plugin}:theme:{name}'
├── name:         string      — 'Light', 'Dark', 'iDoo Blue'
├── base:         string      — base theme to extend ('light' | 'dark')
├── cssVars:      Record<string, string>    — CSS custom properties
│   Examples:
│     '--primary-color': '#3b82f6'
│     '--surface-card': '#ffffff'
│     '--text-color': '#1e293b'
├── primengTheme?: Record<string, unknown>   — PrimeNG design token overrides
└── previewColor: string                    — hex color for theme picker swatch
```

### 24.3 Public API

```
ThemeRegistry extends BaseRegistry<ThemeDef>
│
├── getDefault(): ThemeDef
├── getDark(): ThemeDef | null
├── getLight(): ThemeDef | null
└── apply(themeId: string): void    — applies CSS vars to document.documentElement
```

### 24.4 Override Strategy

`DEEP` — theme overrides extend base themes by merging `cssVars`. Use for tenant branding customization.

---

## 25. Dependency Diagram

```
                     ┌─────────────────────────────────────────────────────────────────┐
                     │                    REGISTRY DEPENDENCY GRAPH                     │
                     │                    (resolved during publishAll)                  │
                     └─────────────────────────────────────────────────────────────────┘

                                        ┌──────────────────┐
                                        │  EntityRegistry   │  ← ROOT
                                        │  (no deps)        │
                                        └────────┬─────────┘
                              ┌──────────────────┼───────────────────────┐
                              │                  │                        │
                     ┌────────▼──────┐  ┌────────▼──────┐  ┌────────────▼──────┐
                     │ FormRegistry  │  │ TableRegistry  │  │  RouteRegistry    │
                     │ (entityId)    │  │  (entityId)    │  │  (entityId)       │
                     └────────┬──────┘  └───────────────-┘  └────────┬──────────┘
                              │                                        │
                    ┌─────────▼──────────────────┐         ┌──────────▼──────────┐
                    │  ValidationRegistry         │         │   MenuRegistry       │
                    │  (validator types)          │         │  (path→routeDef)     │
                    └─────────────────────────────┘         └─────────────────────┘

                     ┌──────────────────┐    ┌──────────────────────────────────────┐
                     │ PermissionRegistry│◄───│ ActionRegistry, RouteRegistry,       │
                     │  (no deps)        │    │ FormRegistry, MenuRegistry,          │
                     └──────────────────┘    │ WidgetRegistry, ReportRegistry       │
                                             └──────────────────────────────────────┘

                     ┌──────────────────┐
                     │ WorkflowRegistry  │ ─→ EntityRegistry (entityId)
                     └────────┬─────────┘ ─→ PermissionRegistry (transition permissions)
                              │
                     ┌────────▼─────────┐
                     │  ActionRegistry   │ ← WorkflowRegistry (toActionDefs())
                     │  (entityId)       │ ← EntityRegistry (entityId)
                     └──────────────────┘

                     ┌──────────────────────────┐
                     │   DashboardRegistry       │ ─→ WidgetRegistry (widgetId)
                     └──────────────────────────┘

                     ┌──────────────────────────┐
                     │     LookupRegistry        │  (no deps — base data)
                     └──────────────────────────┘

                     ┌──────────────────────────┐
                     │   LayoutRegistry          │  (no deps)
                     └──────────────────────────┘

                     ┌──────────────────────────┐
                     │  LocalizationRegistry     │  (no deps)
                     └──────────────────────────┘

                     ┌──────────────────────────┐
                     │     ThemeRegistry         │  (no deps)
                     └──────────────────────────┘

                     ┌──────────────────────────┐
                     │     ReportRegistry        │ ─→ EntityRegistry (entityId, optional)
                     └──────────────────────────┘    ─→ PermissionRegistry (permission)

Resolution order for publishAll():
  Tier 0: EntityRegistry, PermissionRegistry, LookupRegistry, LayoutRegistry,
          LocalizationRegistry, ThemeRegistry, ValidationRegistry
  Tier 1: FormRegistry, TableRegistry, RouteRegistry, WorkflowRegistry
  Tier 2: ActionRegistry, MenuRegistry, WidgetRegistry, ReportRegistry
  Tier 3: DashboardRegistry
```

---

## 26. Sequence Diagrams

### 26.1 Plugin Registration Flow

```
  Plugin Manifest    Boot Step 06    EntityRegistry    FormRegistry    PermissionRegistry
       │                  │                │                │                  │
       │  register()      │                │                │                  │
       │─────────────────►│                │                │                  │
       │                  │ entity.register(EmployeeEntityDef, 'HR')           │
       │                  │───────────────►│                │                  │
       │                  │                │ pipeline.run() │                  │
       │                  │                │────────────────►                  │
       │                  │                │ validate schema │                  │
       │                  │                │ normalize id   │                  │
       │                  │                │ resolve deps   │                  │
       │                  │                │  (deferred: permission check)     │
       │                  │                │ detect conflicts                  │
       │                  │                │ gen checksum   │                  │
       │                  │                │ update indexes │                  │
       │                  │                │◄───────────────│                  │
       │                  │                │ entry VALID    │                  │
       │                  │ form.register(EmployeeCreateSchema, 'HR')          │
       │                  │──────────────────────────────►│                   │
       │                  │                │               │ pipeline.run()    │
       │                  │                │               │ validate schema   │
       │                  │                │               │ dep: hr:employee? │
       │                  │                │◄──────────────│ (deferred)        │
       │                  │                │               │ entry VALID       │
       │                  │ permission.register(HR:EMPLOYEES:READ, 'HR')       │
       │                  │───────────────────────────────────────────────────►│
       │                  │                │                │                  │ entry VALID
       │                  │ ...all plugins complete...     │                  │
       │                  │                │                │                  │
       │                  │ publishAll()   │                │                  │
       │                  │               Resolution Phase                     │
       │                  │               - resolve deferred deps (now all exist)
       │                  │               - merge overrides                    │
       │                  │               - rebuild indexes                    │
       │                  │               - freeze entries                     │
       │                  │               - set PUBLISHED status               │
       │                  │◄──────────────────────────────────────────────────-│
       │                  │ RegistryManagerReadyEvent emitted                  │
```

### 26.2 Engine Query Flow (Post-Boot)

```
  EntityViewComponent   EntityRegistry    FormRegistry     ActionRegistry
         │                   │                  │                │
         │ route activated    │                  │                │
         │ data.entityId = 'hr:employee'         │                │
         │                   │                  │                │
         │ getById('hr:employee')                │                │
         │──────────────────►│                  │                │
         │◄───────────────── EntityDef (O(1) Map lookup)
         │                   │                  │                │
         │ form.getByEntityAndMode('hr:employee', 'create')       │
         │──────────────────────────────────────►│                │
         │◄─────────────────────────────────────FormSchema       │
         │                   │                  │                │
         │ action.getByEntityAndScope('hr:employee', 'header')    │
         │──────────────────────────────────────────────────────►│
         │◄─────────────────────────────────────────────────────ActionDef[]
         │                   │                  │                │
         │ render form using FormEngine          │                │
         │ render action bar using ActionEngine  │                │
```

### 26.3 Override Application Flow

```
  TenantPlugin       RegistryManager    EntityRegistry     EventBus
      │                    │                  │               │
      │ entity.register(    │                  │               │
      │   EmployeeOverride, │                  │               │
      │   'TENANT_CONFIG')  │                  │               │
      │───────────────────►│                  │               │
      │                    │ entity.register() │               │
      │                    │─────────────────►│               │
      │                    │                  │ Step 3: resolve dep
      │                    │                  │ 'hr:employee' exists? YES
      │                    │                  │ Step 4: conflict check
      │                    │                  │ different plugin? YES
      │                    │                  │ declares overrides: 'hr:employee'? YES
      │                    │                  │ → route to Step 5 (OverrideMerge)
      │                    │                  │ merge DEEP: EmployeeOverride on EmployeeEntityDef
      │                    │                  │ base.overriddenBy = [..., 'TENANT_CONFIG']
      │                    │                  │ new checksum generated
      │                    │                  │ status: 'valid' (override)
      │                    │◄─────────────────│
      │◄───────────────────│ RegistrationResult { success, entryId: 'hr:employee' }
      │                    │                  │               │
      │                    │ publishAll() → freeze → publish  │
      │                    │─────────────────►│               │
      │                    │                  │ EntryUpdatedEvent
      │                    │                  │──────────────►│
```

---

## 27. Conflict Resolution Model

### 27.1 Conflict Types

**Type 1 — Same-Plugin Version Upgrade**  
Same `sourcePluginId`, same `id`, different `version`. Resolution: latest SemVer wins. Warn if downgrade detected.

**Type 2 — Different-Plugin Override (Declared)**  
Different `sourcePluginId`, same `id`, submitting entry declares `overrides: '{baseEntryId}'`. Resolution: run OverrideMerge pipeline with registry's merge strategy.

**Type 3 — Different-Plugin Conflict (Undeclared)**  
Different `sourcePluginId`, same `id`, no `overrides` declaration. Resolution: `CONFLICT` error. Both entries marked `INVALID`. Neither is published. Surfaced in diagnostics.

**Type 4 — Capability Conflict**  
Two entries claim the same exclusive capability (e.g., two theme entries claiming `is-default: true`). Resolution: first-registered wins; second receives warning; surfaced in diagnostics.

**Type 5 — Circular Dependency**  
Entry A depends on Entry B which depends on Entry A. Resolution: both marked `INVALID`. Cycle listed in diagnostics.

### 27.2 Conflict Resolution Table

| Scenario | Resolution | Diagnostics Entry | Registry Impact |
|---|---|---|---|
| Same plugin, newer version | Replace, keep older in diagnostics | `VersionConflict` (info) | None |
| Same plugin, older version | Keep existing, warn | `VersionConflict` (warn) | None |
| Different plugin, declared override | Run merge pipeline | `EntryUpdatedEvent` | Override recorded |
| Different plugin, no override | Both invalid | `DuplicateConflict` (error) | Entries excluded |
| Exclusive capability collision | First wins | `CapabilityConflict` (warn) | Second loses capability |
| Circular dependency | All in cycle invalid | `DependencyCycle` (error) | All excluded |
| Missing non-optional dep | Entry invalid | `MissingDependency` (error) | Entry excluded |
| Missing optional dep | Entry degraded | `MissingDependency` (warn) | Entry published degraded |

---

## 28. Override and Merge System

### 28.1 Override Declaration

An entry in any registry declares it overrides a base entry:

```
EntityDef (override version)
  id:        'hr:employee'          — same as base
  overrides: 'hr:employee'          — explicit declaration (required)
  // Only fields to override:
  table: {
    columns: [
      // Tenant wants to add a column
      { id: 'branch', header: 'Branch', accessor: 'branchName', type: 'text' }
    ]
  }
```

Without `overrides` declaration, this registration would be a `Type 3 — Conflict` and both entries would be invalidated.

### 28.2 Merge Strategies per Registry

| Registry | Strategy | Description |
|---|---|---|
| EntityRegistry | DEEP | Nested objects recursively merged. Override wins on leaf conflicts. |
| FormRegistry | DEEP | Sections merged by `id`. Fields merged by `key`. Override fields replace base fields. |
| TableRegistry | ADDITIVE for columns, SHALLOW for top-level | Columns array merged (override columns injected at specified `insertAfter` position or at end). |
| RouteRegistry | REPLACE (owner only) | Routes cannot be overridden by other plugins. |
| MenuRegistry | ADDITIVE | Override plugins can inject new menu items as siblings. |
| ActionRegistry | ADDITIVE | Override plugins inject new actions for an entity. Cannot replace existing handlers. |
| PermissionRegistry | NO OVERRIDE | Permissions are not overridable. Use separate permission codes. |
| WidgetRegistry | SHALLOW | Widget metadata overridable; component is not. |
| LayoutRegistry | SHALLOW | Layout properties overridable; slots are not. |
| ValidationRegistry | NO OVERRIDE | Built-in validators are immutable. Plugins can only add new ones. |
| LookupRegistry | ADDITIVE | Override items merged by `value`; existing items get override properties. |
| WorkflowRegistry | DEEP | Transitions can be added; existing transitions' permissions can be overridden. |
| DashboardRegistry | SHALLOW | Dashboard layout overridable by higher-priority plugins. |
| ReportRegistry | SHALLOW | Report metadata overridable; endpoint is not. |
| LocalizationRegistry | SHALLOW | Key-value replacement. Override keys replace base keys. |
| ThemeRegistry | DEEP | CSS variables deeply merged. |

### 28.3 Override Priority

Override priority is determined by `PluginManifest.overridePriority` (integer, default: 0, higher = higher priority). When multiple plugins override the same entry:

1. Sort overrides descending by `overridePriority`
2. Start with base definition
3. Apply overrides in order (first high-priority, down to low-priority)
4. Each application uses the registry's merge strategy

This means the highest-priority override wins on conflicts.

---

## 29. Versioning Strategy

### 29.1 Entry Versioning

Every `RegistryEntry` carries the `version` of the plugin that registered it. Versioning serves two purposes:

1. **Conflict resolution** — newer version of same plugin replacing an entry is allowed
2. **Compatibility checking** — future `MetadataMigrator` (v1.1+) uses version to migrate old entries

### 29.2 Platform API Versioning

The Registry Manager itself is versioned as part of the Platform API. The `RegistryAPI` interface is frozen at v1.0 (per ADR-07). Additive changes (new registry methods) are minor version bumps. Removing or changing existing methods requires a major version bump and a migration guide.

### 29.3 Version Upgrade Path

When a plugin is updated to a newer version and re-registers its entries:

```
Scenario: HR Plugin v1.0.0 → v1.1.0

Boot: HR v1.1.0 registered
  └─ EmployeeEntityDef v1.1.0 submitted
     └─ Step 3 (ConflictDetection): found existing 'hr:employee' from 'HR' v1.0.0
        └─ Same sourcePluginId + newer SemVer → REPLACE
           └─ Old entry archived in diagnostics
              New entry enters pipeline from Step 6 (Checksum)
              EntryUpdatedEvent emitted (changeType: 'version-upgrade')
```

### 29.4 Breaking Change Policy

A plugin update that changes a registry entry in a backwards-incompatible way (removes a required field, changes a field type) must:

1. Bump major version (`1.0.0 → 2.0.0`)
2. Provide `replaces` entry pointing to old ID (if renaming)
3. Run through `MetadataMigrator` (v1.1+ feature)

The Registry Manager in v1.0 validates this only with warnings. The `MetadataMigrator` in v1.1 enforces it.

---

## 30. Performance Architecture

### 30.1 Index Design

Every registry maintains these indexes:

**Primary Index (O(1) reads):**
```
Map<entryId, RegistryEntry<TDef>>
```

**Secondary Indexes (O(1) lookups, O(k) result iteration):**
```
Map<fieldValue, entryId[]>   (one Map per indexed field)
```

Secondary indexes are rebuilt entirely during `publishAll()` and remain frozen thereafter. No incremental updates after freeze — this avoids index drift.

**Full-text Search (v1.1+):**
Trie structure over `label` and `description` fields for the global search feature. Not built in v1.0.

### 30.2 Memory Estimate

At scale (500 plugins, 10,000 entries across 16 registries):

| Registry | Est. Entries | Est. Memory (KB) |
|---|---|---|
| Entity | 1,000 | 2,000 |
| Form | 3,000 | 6,000 |
| Table | 1,000 | 1,500 |
| Route | 1,500 | 500 |
| Menu | 5,000 | 1,000 |
| Action | 8,000 | 3,000 |
| Permission | 5,000 | 1,000 |
| Others (×9) | 10,000 | 5,000 |
| **Total** | **~35,000** | **~20,000 KB (~20 MB)** |

20 MB of registry data is acceptable for an enterprise browser application. All registry data is plain JavaScript objects — no DOM nodes, no observables, no component instances.

### 30.3 Query Performance Targets

| Operation | Target | Implementation |
|---|---|---|
| `getById()` | < 0.1ms | Map lookup |
| `getAll()` | < 5ms for 10,000 entries | Array spread from Map.values() |
| `query({ pluginId })` | < 0.5ms | Secondary index lookup |
| `query({ filter: fn })` | < 10ms | Scan (unavoidable for predicate queries) |
| `publishAll()` (10,000 entries) | < 500ms | Measured in diagnostics |

### 30.4 Publish Optimisation

- Run Tier 0 registries (no dependencies) in parallel
- Run Tier 1 after Tier 0 completes — parallel within tier
- Run Tier 2 after Tier 1 completes — parallel within tier
- Run Tier 3 (DashboardRegistry) last
- Use `Promise.all()` for parallel within-tier publishing

### 30.5 Freeze Efficiency

After `freeze()`, the registry replaces its `entries` Map with a sealed object:
```
Object.freeze(entries)   — prevents accidental mutation
```
Attempts to call `register()` after freeze throw `RegistryFrozenError` synchronously — no async overhead.

---

## 31. Hot Reload Compatibility

Hot reload (runtime plugin loading/unloading without full page reload) is a v1.1 feature. The Registry Manager is designed in v1.0 to be hot-reload-*compatible*, meaning the architecture does not preclude it.

### 31.1 v1.0 Constraints (Accepted)

- Registries are PUBLISHED once per boot and stay frozen for the application lifetime
- Plugin registration is a boot-time-only operation
- No unregister() calls in production

### 31.2 v1.1 Hot Reload Design (Planned)

When a plugin is updated at runtime:

1. `RegistryManager.beginRefresh(pluginId)` → affected registries enter `REFRESHING`
2. Old entries from `pluginId` enter `REMOVING` state (still queryable until replaced)
3. New plugin version calls `register()` on its entries
4. `RegistryManager.commitRefresh(pluginId)` → affected registries re-run publish phase for affected entries only
5. Registries re-enter `PUBLISHED`
6. `EntryUpdatedEvent` emitted for changed entries
7. Engines that subscribe to these events re-render affected components

### 31.3 Freeze/Unfreeze Safety

In `REFRESHING` state, registries temporarily accept `register()` and `unregister()` calls. The checksum system ensures idempotency: if the checksum of a re-registered entry matches the existing checksum, no index update is performed. This makes hot-reload of unchanged entries free.

---

## 32. ADRs

### ADR-R01: Single RegistryEntry<T> Envelope for All Registries

**Status:** ACCEPTED  
**Context:** Should each registry define its own storage model, or should there be a shared envelope?  
**Decision:** All 16 registries share the `RegistryEntry<TDef>` envelope. Only the `definition: TDef` field varies.  
**Consequences:**
- Diagnostics, indexing, checksum, and lifecycle code is written once in `BaseRegistry<TDef>`
- Adding a new field to the envelope (e.g., `auditLog`) immediately benefits all 16 registries
- Tradeoff: generic type signatures require TypeScript discipline to avoid `unknown` leaking

---

### ADR-R02: Synchronous Registration Pipeline

**Status:** ACCEPTED  
**Context:** Should the registration pipeline be async (to support remote validation) or sync?  
**Decision:** Synchronous at boot time. The pipeline does not make HTTP calls. Remote validation (e.g., checking if an entity exists in the backend) is NOT performed at registration time — it is performed at runtime when the engine first uses the definition.  
**Consequences:**
- Boot remains fast and predictable
- No async coordination complexity
- Tradeoff: invalid `apiPath` values only surface at runtime (first HTTP call), not at boot

---

### ADR-R03: Dependency Resolution is Deferred to publishAll()

**Status:** ACCEPTED  
**Context:** Plugins register in sorted order (after DependencyGraphStep). However, registry order within a single plugin's registration calls is not guaranteed. Should dependency resolution happen per-register() or at publishAll()?  
**Decision:** Dependencies are validated at `publishAll()` after all plugins have registered. During the registration pipeline, dependencies are deferred and queued.  
**Consequences:**
- A plugin can register its `FormSchema` before its `EntityDef` — both will resolve correctly at publish time
- Simpler per-entry pipeline (no blocking waits)
- Tradeoff: dependency errors are not surfaced until publishAll(), which is later in the boot sequence

---

### ADR-R04: Freeze After Publish — No Runtime Mutations

**Status:** ACCEPTED  
**Context:** Should engines be able to modify registry entries at runtime for dynamic features (e.g., adding a column to a table based on user preferences)?  
**Decision:** No. Registries are frozen after publish. Runtime UI customizations (column visibility, filter presets) are stored in user preference state, not in the registry.  
**Consequences:**
- Registry reads are safe from race conditions and mutation bugs
- Engines can cache registry reads without invalidation concerns
- Tradeoff: Hot reload requires the REFRESHING mechanism (v1.1); not available in v1.0

---

### ADR-R05: 16 Independent Registries, Not One Monolithic Store

**Status:** ACCEPTED  
**Context:** Should all metadata live in one Map, discriminated by type, or in 16 separate Map instances?  
**Decision:** 16 separate registries, each with its own `Map`, indexes, and lifecycle.  
**Consequences:**
- Type safety: `FormRegistry.getById()` returns `FormSchema | null`, not `unknown`
- Isolation: a broken WorkflowRegistry does not affect EntityRegistry
- Parallelism: registries publish concurrently within dependency tiers
- Tradeoff: some cross-registry queries require joining results from two registries (e.g., "get all forms for entities that have a workflow")

---

### ADR-R06: Override Priority via PluginManifest.overridePriority

**Status:** ACCEPTED  
**Context:** When multiple plugins override the same entry, how is the final value determined?  
**Decision:** `PluginManifest.overridePriority` (integer, default 0) controls priority. Higher integer = applied last = wins.  
**Consequences:**
- Tenant configuration plugins set `overridePriority: 100` to always win
- Plugin authors can declare lower priority overrides
- Deterministic resolution — no random ordering
- Tradeoff: overridePriority conflicts (two plugins with same priority) resolved by registration order (boot sort order)

---

### ADR-R07: No Global Event After Individual Entry Registration (Only After Publish)

**Status:** ACCEPTED  
**Context:** Should `EntryRegisteredEvent` be emitted immediately when `register()` is called, or only after `publishAll()`?  
**Decision:** `EntryRegisteredEvent` is emitted immediately during registration (so tooling can observe boot progress). However, engines MUST NOT query registries until `RegistryManagerReadyEvent` is received. The kernel enforces this via `BootStateMachine`.  
**Consequences:**
- Boot progress monitoring tools can see entries being registered in real time
- Engines cannot accidentally query a partially-built registry
- Tradeoff: engines must handle the case where EventBus delivers `EntryRegisteredEvent` before the registry is published (they must ignore or queue these)

---

### ADR-R08: PermissionRegistry is Read-Only by Engines

**Status:** ACCEPTED  
**Context:** Should engines be able to query PermissionRegistry to check if a permission code is known, or should they simply use the codes as strings?  
**Decision:** `PermissionRegistry` is readable by engines. All other security state (which permissions the current user has) remains in `PlatformContext`. The PermissionRegistry is the dictionary; PlatformContext is the runtime fact.  
**Consequences:**
- Clear separation: registry = "what codes exist", context = "what codes the user has"
- Engines can validate permission codes against the registry for developer tooling
- Tradeoff: two sources of permission truth (registry + context) — must never be confused

---

### ADR-R09: Merge Strategy is Registry-Defined, Not Override-Defined

**Status:** ACCEPTED  
**Context:** Should the merge strategy (DEEP/SHALLOW/ADDITIVE) be chosen by the override plugin, or fixed per registry?  
**Decision:** Each registry defines its merge strategy. Override plugins cannot change the strategy.  
**Consequences:**
- Predictable merge behaviour — developers know exactly how overrides work for each registry
- Prevents plugins from accidentally replacing entire definitions when they only intended to add a field
- Tradeoff: less flexibility for override authors; they must work within the registry's strategy

---

### ADR-R10: Diagnostics Are Always Available, Even If Registry Is Degraded

**Status:** ACCEPTED  
**Context:** If a registry fails to publish correctly, should diagnostics still be available?  
**Decision:** Yes. `getDiagnostics()` is callable in any registry state (`OPEN`, `PUBLISHING`, `PUBLISHED`, `DEGRADED`, `DISPOSED`). It returns whatever information is available at the time.  
**Consequences:**
- Boot failure root cause can always be diagnosed via `window.__idoo.diagnostics()`
- Diagnostics collection must not throw even if internal state is partially corrupt
- Tradeoff: diagnostics may return incomplete data during `PUBLISHING` state — clearly documented

---

## 33. Self-Review

Before this specification is approved, each of the following questions must be answered YES.

---

**Q1: Can the Registry Manager handle 500 plugins and 10,000+ entries without performance degradation?**

YES. The primary index is a `Map<string, RegistryEntry>` — O(1) lookup regardless of size. Secondary indexes are `Map<value, entryId[]>` — O(1) lookup for the index, O(k) for result iteration. `publishAll()` runs in parallel tiers. Memory estimate for 35,000 entries is ~20MB — acceptable. Query performance targets are documented in Section 30.3.

---

**Q2: Is every registry entry traceable to its source plugin?**

YES. `RegistryEntry.sourcePluginId` is required and immutable. `getEntriesByPlugin(pluginId)` is available on every registry. The diagnostics report includes `entriesByPlugin: Record<string, number>` for every registry.

---

**Q3: Can a tenant customize platform metadata without modifying plugin source code?**

YES. The Override system (Section 28) allows a tenant-configuration plugin to register override entries for any base entry, using the `overrides` declaration. Override priority is controlled by `PluginManifest.overridePriority`. The merge strategy per registry ensures base definitions are never mutated.

---

**Q4: Are all conflict types detected and surfaced transparently?**

YES. Section 27 documents 5 conflict types. All conflicts produce diagnostic entries (`DuplicateConflict`, `VersionConflict`, `MissingDependency`, `DependencyCycle`, `CapabilityConflict`). None are silently suppressed. The diagnostics API surfaces all of them. The boot logger also writes conflict warnings.

---

**Q5: Is the registration pipeline deterministic? Given the same inputs, does it always produce the same output?**

YES. The pipeline is synchronous. Conflict resolution is deterministic (SemVer comparison for version conflicts, `overridePriority` for overrides, registration order as tiebreaker). Merge is deterministic (fixed strategy per registry). There are no random or time-dependent decisions except `registeredAt` timestamps (which are metadata only, not used in resolution).

---

**Q6: Can an engine fail to find a registry entry without crashing the platform?**

YES. All `getById()` calls return `TDef | null`. Engines must handle null. The platform's engine components render `EmptyStateComponent` when the EntityDef cannot be resolved. The FormEngine renders nothing if the FormSchema is null. No engine assumes a registry entry exists — they all defensive-check.

---

**Q7: Is the Registry Manager usable before it is fully published?**

NO — and this is correct and intentional. The kernel's `BootStateMachine` prevents any engine from activating before `RegistryManagerReadyEvent` is received. The `APP_INITIALIZER` resolves only after `PlatformKernel.boot()` completes, which only completes after `publishAll()`. Angular's router does not produce its first navigation until after `APP_INITIALIZER` resolves. The enforced sequencing makes early-access impossible.

---

**Q8: Does the Registry Manager support future addition of a 17th or 18th registry without changing the base architecture?**

YES. Adding a new registry means: (a) create a new class extending `BaseRegistry<NewDef>`, (b) add it as a property on `RegistryManager`, (c) add it to `RegistryAPI` interface, (d) add its resolution tier in `publishAll()`, (e) add its `RegistryName` to the `RegistryName` union type. No changes to existing registries, no changes to the pipeline, no changes to the event system.

---

**Q9: Is every registry independently isolated such that a failure in one does not prevent others from publishing?**

YES. `publishAll()` catches errors per-registry and marks failing registries as `DEGRADED` — it does not rethrow. Boot Step 06 receives the degraded registry list and adds it to `BootContext.warnings`. The kernel enters `DEGRADED` state (not `ERROR`) unless a critical step fails. The RegistryManager itself does not treat individual registry degradation as a critical failure — only a complete `publishAll()` crash would be critical.

---

**Q10: Is there a complete audit trail for every registration decision?**

YES. `EntryRegisteredEvent`, `EntryUpdatedEvent`, `EntryConflictDetectedEvent`, and `EntryValidationFailedEvent` provide the event trail. `RegistryEntry.rawDefinition` preserves the original submission. `RegistryEntry.overriddenBy` records all plugins that modified the entry. `RegistryDiagnosticsResult` snapshots the state at any point. In development mode, `window.__idoo.diagnostics()` returns the full report on demand.

---

*End of Registry Manager Specification v1.0.0*

*Next Phase: 2.4 — Plugin System Implementation Specification*
