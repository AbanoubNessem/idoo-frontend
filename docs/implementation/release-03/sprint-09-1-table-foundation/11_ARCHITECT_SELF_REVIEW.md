# Sprint 9.1 — Architect Self-Review

## Review Summary

The Sprint 9.1 implementation is reviewed against the Platform Core v1.0 patterns established in Sprints 2–8.5.

---

## Pattern Conformance

### ✔ Naming Conventions

All services follow `{Domain}Service` naming. `TableEngine` (no "Service" suffix) follows the engine pattern established by `DynamicFormEngine`. Filenames are kebab-case matching the Angular style guide.

### ✔ Injectable Pattern

Every service uses `@Injectable({ providedIn: 'root' })`. No NgModule, no `providers` array. Consistent with all Sprint 2–8 services.

### ✔ Signal Reactivity

All mutable state uses `signal()`. All derived reads use `computed()`. No `BehaviorSubject` or `EventEmitter`. Consistent with the platform-wide signals approach.

### ✔ Readonly Interfaces

All `interface` members are `readonly`. All services expose computed signals as `readonly` via `.asReadonly()`. Mutation is encapsulated in private state.

### ✔ SOLID

| Principle              | Applied                                                     |
|------------------------|-------------------------------------------------------------|
| Single Responsibility  | Each service does exactly one thing                         |
| Open/Closed            | `TableDefinition` is extended via metadata overrides        |
| Liskov Substitution    | `ResolvedTableColumn extends TableColumnDefinition`         |
| Interface Segregation  | Validation, serialization, metrics are separate services    |
| Dependency Inversion   | Engine depends on service abstractions via `inject()`       |

### ✔ No Circular Dependencies

Dependency graph:
```
Engine → Registry, MetadataRegistry, Resolver, Validator, Serializer, Diagnostics, Metrics
Resolver → Registry, MetadataRegistry
(all others have no dependencies on each other or on Engine)
```

No cycles.

---

## Concerns / Notes for Architecture Review

### 1. Shallow Column Overrides

`TableMetadataRegistryService.mergeInto()` performs a shallow object spread. If a `runtime` override specifies `columns: [...]`, it replaces the entire columns array rather than patching individual columns. This is intentional for Sprint 9.1 but should be revisited in Sprint 9.2 if fine-grained column patching is needed.

### 2. Serializer Drops Functions

`formatter`, function-typed `cellClass`, and function-typed `disabled`/`visible` on actions are dropped during serialization. This is the correct behavior — functions cannot be JSON-serialized. Callers that need to persist behavior must re-register formatters by id.

### 3. Event System is Synchronous

`TableEngine._emit()` notifies subscribers synchronously. For Sprint 9.1 (pure metadata) this is fine. If the event system grows to support cross-process or async consumers, it should be upgraded to an RxJS `Subject` or Angular `outputToObservable()`.

### 4. Cache Invalidation Scope

`applyOverride()` calls `_invalidateCache(tableId)` which only removes the cached entry for that specific table. If future sprints introduce table inheritance or table groups, a broader invalidation strategy may be needed.

---

## Verdict

Sprint 9.1 is architecturally sound and ready for Architecture Review. The metadata foundation is complete, consistent with the platform, and provides a clean contract for Sprint 9.2 (rendering engine).
