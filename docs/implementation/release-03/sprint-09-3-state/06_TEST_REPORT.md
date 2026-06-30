# Sprint 9.3 — Test Report

## Test Files

| File | Subject | Cases |
|------|---------|-------|
| `table-state-store.spec.ts` | `TableStateStore` | 21 |
| `table-state-context.spec.ts` | `TableStateContext` | 14 |
| `table-state-history.spec.ts` | `TableStateHistory` | 15 |
| `table-state-validator.service.spec.ts` | `TableStateValidatorService` | 16 |
| `table-state-serializer.service.spec.ts` | `TableStateSerializerService` | 16 |
| `table-state-metrics.service.spec.ts` | `TableStateMetricsService` | 15 |
| `table-state-engine.service.spec.ts` | `TableStateEngine` | 28 |
| **Total** | | **~125** |

## Coverage Areas

### TableStateStore
- Default initialization from `TABLE_STATE_DEFAULTS`
- Constructor initial state application
- `update()` for every field (loading, error, density, visibleColumns, expandedRows, focusedCell, hoveredRow, activeRow, selection, sort, filter, pagination, editing)
- Defensive copy semantics for arrays and objects
- `reset()` restores defaults
- `snapshot()` returns frozen `TableState`
- Snapshot independence from subsequent mutations
- `restore()` applies a snapshot back to signals

### TableStateContext
- `tableId` delegation to store
- `asReadonly()` returns stable reference
- All signal passthroughs track store changes
- `isLoading` computed
- `hasError` computed (true when error ≠ null, false when null)
- `isColumnVisible(id)` computed per column
- `isRowExpanded(id)` computed per row
- `store` getter

### TableStateHistory
- Initial `canUndo=false`, `canRedo=false`, `depth=0`
- `push()` increments depth and enables canUndo
- `push()` keeps canRedo=false
- Multiple pushes accumulate
- `maxDepth` enforcement (oldest entries trimmed)
- `peek()` returns latest snapshot without consuming
- `peek()` returns null on empty history
- `undo()` returns null (deferred)
- `redo()` returns null (deferred)
- `clear()` resets depth, canUndo, and peek

### TableStateValidatorService
- Valid full state passes
- Empty `tableId` fails
- Invalid density fails; all valid densities pass
- Empty `visibleColumns` produces warning (not error)
- Non-array `visibleColumns` fails
- Non-array `expandedRows` fails
- `focusedCell` with empty `columnId` fails
- Non-boolean `loading` fails
- Non-string/null `error` fails
- `validateUpdate()` with empty object passes
- `validateUpdate()` detects invalid density

### TableStateSerializerService
- `createSnapshot()` produces unique IDs
- `createSnapshot()` produces valid ISO `capturedAt`
- `createSnapshot()` sets `tableId`
- Snapshot and nested state are frozen
- `serialize()` produces valid JSON
- Round-trip through `serialize()` + `deserialize()` preserves `tableId` and `visibleColumns`
- `deserialize()` throws on invalid JSON
- `deserialize()` throws on missing `tableId`
- `toObject()` and `fromObject()` round-trip
- `fromObject()` applies defaults for missing fields
- `clone()` produces a deep copy

### TableStateMetricsService
- `trackedCount` starts at 0
- `snapshot()` returns null for unknown table
- Each `track*()` method increments the right counter
- `trackUpdate()` sets `lastUpdatedAt`
- `trackedCount` reactive to table additions
- `all()` returns entries for all tables
- `reset(tableId)` removes specific table
- `resetAll()` clears everything
- Multiple calls accumulate correctly
- `snapshot()` carries the correct `tableId`

### TableStateEngine
- Factory: `createStore` / `createContext` / `createHistory`
- `initialize()` emits `StateInitialized`, applies initial state
- `reset()` restores defaults, emits `StateReset`
- `dispose()` removes store from registry, emits `StateDisposed`
- `update()` mutates store, emits `StateChanged`
- `snapshot()` returns immutable frozen snapshot
- `restore()` applies snapshot, emits `StateChanged`
- `serialize`/`deserialize` round-trip
- Metrics accumulate after updates
- `on()` with wildcard `tableId` catches events from multiple tables
- `on()` with wildcard `type` catches all event types
- Unsubscribe function stops delivery
- `getStore()` / `hasStore()` / `listStores()` lookup
- `validate()` delegates to validator correctly

## Pre-existing Known Issue

`toBeTrue()` / `toBeFalse()` Jasmine matchers produce TS type errors in `tsconfig.spec.json` — a project-wide pre-existing configuration issue present in all sprints. Tests pass at runtime. `tsconfig.app.json` compiles with 0 errors.
