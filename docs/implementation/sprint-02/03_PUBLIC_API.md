# Sprint 2 — Public API Reference

**Sprint:** Sprint 2 — Metadata Engine  
**Date:** 2026-06-29

---

## MetadataEngineService (Primary Entry Point)

```typescript
class MetadataEngineService implements MetadataEngineAPI {
  // Signals
  readonly state: Signal<MetadataEngineState>;     // current lifecycle state
  readonly isReady: Signal<boolean>;                // true when state === 'ready'
  readonly snapshot: Signal<MetadataSnapshot | null>;

  // Methods
  initialize(): Promise<void>;              // uninitialized/error → ready
  refresh(): Promise<void>;                 // ready → refreshing → ready
  getSnapshot(): MetadataSnapshot | null;
  getDiagnostics(): MetadataDiagnosticsReport;
}
```

---

## MetadataManagerService (Query Facade)

```typescript
class MetadataManagerService {
  // Snapshot
  getSnapshot(): MetadataSnapshot | null;

  // Entry queries
  getById(id: string): MetadataEntry | undefined;
  getByType(type: MetadataType): ReadonlyArray<MetadataEntry>;
  getByPlugin(pluginId: string): ReadonlyArray<MetadataEntry>;
  findByDefinition<T>(type: MetadataType, predicate: (def: T) => boolean): MetadataEntry<T>[];

  // Relation queries
  getFormsForEntity(entityId: string): ReadonlyArray<string>;
  getTablesForEntity(entityId: string): ReadonlyArray<string>;
  getWorkflowsForEntity(entityId: string): ReadonlyArray<string>;
  getActionsForEntity(entityId: string): ReadonlyArray<string>;
  getRoutesForEntity(entityId: string): ReadonlyArray<string>;

  // Permission queries
  getPermissionByCode(code: string): MetadataEntry | undefined;
  hasPermission(code: string): boolean;

  // Lookup queries
  getLookupById(id: string): MetadataEntry | undefined;

  // Menu queries
  getRootMenuItems(): ReadonlyArray<string>;
  getChildMenuItems(parentId: string): ReadonlyArray<string>;

  // Validation
  getAllErrors(): ReadonlyArray<MetadataValidationError>;
  getErrorsForType(type: MetadataType): MetadataValidationError[];
  getErrorsForEntry(id: string): MetadataValidationError[];

  // Counts
  countByType(): Record<string, number>;
  totalEntries(): number;
}
```

---

## MetadataEventsService

```typescript
class MetadataEventsService {
  readonly events$: Observable<MetadataEvent>;
  emit(type: MetadataEventType, payload?: unknown, correlationId?: string): void;
  on(type: MetadataEventType): Observable<MetadataEvent>;
  onAny(...types: MetadataEventType[]): Observable<MetadataEvent>;
  getLog(): ReadonlyArray<MetadataEvent>;
  clearLog(): void;
}
```

Event types: `metadata:loading:started`, `metadata:loading:completed`, `metadata:validation:started`, `metadata:validation:completed`, `metadata:resolution:started`, `metadata:resolution:completed`, `metadata:indexing:started`, `metadata:indexing:completed`, `metadata:snapshot:created`, `metadata:ready`, `metadata:refreshing`, `metadata:error`

---

## MetadataLifecycleService

```typescript
class MetadataLifecycleService {
  readonly state: Signal<MetadataEngineState>;
  readonly isReady: Signal<boolean>;
  readonly isError: Signal<boolean>;
  readonly isBusy: Signal<boolean>;
  readonly errorMessage: Signal<string | null>;

  canTransitionTo(next: MetadataEngineState): boolean;
  transition(next: MetadataEngineState, errorMessage?: string): void;  // throws on invalid transition
  getHistory(): ReadonlyArray<MetadataEngineState>;
  reset(): void;
}
```

States: `uninitialized → loading → validating → resolving → indexing → ready`  
Error path: any state `→ error → loading`  
Refresh path: `ready → refreshing → loading`

---

## MetadataCacheService

```typescript
class MetadataCacheService {
  readonly hasSnapshot: Signal<boolean>;
  readonly snapshotId: Signal<string | null>;

  store(snapshot: MetadataSnapshot): void;
  get(): MetadataSnapshot | null;
  getAgeMs(): number | null;
  invalidate(): void;
  invalidateByType(type: MetadataType): void;
  invalidateByPlugin(pluginId: string): void;
  getStats(): { hits: number; misses: number; hitRate: number };
  resetStats(): void;
}
```

---

## MetadataDiagnosticsService

```typescript
class MetadataDiagnosticsService {
  generate(): MetadataDiagnosticsReport;
  isHealthy(): boolean;
  summarize(): string;
}
```

---

## MetadataStatisticsService

```typescript
class MetadataStatisticsService {
  compute(entries, conflicts, timings): MetadataStats;
  getLast(): MetadataStats | null;
  summarize(stats: MetadataStats): string;
  diffTypes(a: MetadataStats, b: MetadataStats): Partial<Record<MetadataType, number>>;
}
```

---

## MetadataIndexerService

```typescript
class MetadataIndexerService {
  build(entries: Map<string, MetadataEntry>): MetadataIndex;
  getByType(index, type): ReadonlyArray<MetadataEntry>;
  getById(index, id): MetadataEntry | undefined;
  getFormsForEntity(index, entityId): ReadonlyArray<string>;
  getTablesForEntity(index, entityId): ReadonlyArray<string>;
  getWorkflowsForEntity(index, entityId): ReadonlyArray<string>;
  getActionsForEntity(index, entityId): ReadonlyArray<string>;
  getRoutesForEntity(index, entityId): ReadonlyArray<string>;
  getRootMenuItems(index): ReadonlyArray<string>;
  getChildMenuItems(index, parentId): ReadonlyArray<string>;
  getPermissionByCode(index, code): MetadataEntry | undefined;
  getLookupById(index, id): MetadataEntry | undefined;
  summarize(index): Record<string, number>;
}
```

---

## Key Types

```typescript
type MetadataType = 'entity' | 'form' | 'table' | 'route' | 'menu' | 'action' |
  'permission' | 'lookup' | 'widget' | 'dashboard' | 'report' | 'workflow' |
  'validator' | 'layout' | 'theme' | 'localization';

type MetadataEngineState = 'uninitialized' | 'loading' | 'validating' | 'resolving' |
  'indexing' | 'ready' | 'refreshing' | 'error';

interface MetadataEntry<TDef = unknown> {
  readonly id: string;
  readonly type: MetadataType;
  readonly sourcePluginId: string;
  readonly version: string;
  readonly definition: Readonly<TDef>;
  readonly resolvedAt: string | null;
  readonly validationErrors: ReadonlyArray<MetadataValidationError>;
  readonly isResolved: boolean;
  readonly isValid: boolean;
  readonly overriddenBy: string | null;
  readonly checksum: string;
}

interface MetadataSnapshot {
  readonly id: string;
  readonly createdAt: string;
  readonly entries: ReadonlyMap<string, MetadataEntry>;
  readonly index: MetadataIndex;
  readonly statistics: MetadataStats;
  readonly validationErrors: ReadonlyArray<MetadataValidationError>;
  readonly warnings: ReadonlyArray<string>;
}
```
