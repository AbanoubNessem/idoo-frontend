# Sprint 9.1 — Performance

## Design Choices for Performance

### 1. Signal-Based Reactivity

All mutable state uses Angular `signal()` and `computed()`. Updates are fine-grained: only components subscribed to a specific signal re-evaluate. A registration does not cause the entire app to re-render.

### 2. Resolution Cache

`TableEngine.resolve()` caches `ResolvedTableDefinition` by `tableId`. Subsequent calls return the cached object in O(1). The cache is invalidated only when:
- `applyOverride()` / `removeOverride()` is called for the same table
- `invalidateCache(tableId)` or `invalidateCache()` is called explicitly

### 3. Lazy Registration

`registerLazy()` stores only a factory stub. The full `TableDefinition` is only fetched the first time `resolve()` is called. After the first resolve, the factory is replaced with the resolved definition so it is never called again.

### 4. O(1) Lookups

`TableRegistryService._entries` is a `Map<string, TableRegistryEntry>`. `has()`, `get()`, `remove()` are all O(1).

`TableResolverService._buildResolved` builds a `Map<string, ResolvedTableColumn>` (the `columnIndex`), so future column lookups by id are also O(1).

### 5. Diagnostics Off by Default

`TableDiagnosticsService` is disabled by default. When disabled, `record()` returns immediately with no array mutations. Zero overhead in production.

### 6. Serializer Avoids Closures

`TableSerializerService.serialize()` skips `formatter` and function-typed `cellClass`/`disabled`/`visible` fields — they are not serializable and excluding them avoids JSON.stringify exceptions.

## Benchmarks (estimated)

| Operation                    | Cost          | Notes                             |
|------------------------------|---------------|-----------------------------------|
| `register()` (eager)         | < 1ms         | Map insert + signal bump          |
| `resolve()` (cached)         | < 0.1ms       | Map lookup                        |
| `resolve()` (cold)           | < 2ms         | Registry + merge + column resolve |
| `validate()` (200 columns)   | < 5ms         | O(n) column scan                  |
| `serialize()` (200 columns)  | < 5ms         | JSON.stringify                    |
| `applyOverride()`            | < 0.5ms       | Array filter + set + signal bump  |

## Memory

Each `TableRegistryEntry` stores a reference to the original `TableDefinition` (not a copy). Resolved definitions cache a derived object with the same column references plus two boolean fields per column. Memory footprint is proportional to the number of columns, not the number of registrations.

## Scalability

The platform is expected to register at most a few hundred table definitions per application. The current O(n) operations (validate columns, list, query) are well within limits for this scale.
