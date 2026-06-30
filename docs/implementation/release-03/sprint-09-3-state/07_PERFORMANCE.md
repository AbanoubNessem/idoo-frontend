# Sprint 9.3 — Performance Design

## Signal Granularity

Each state field is an independent `signal()` in `TableStateStore`. This means:
- `update({ loading: true })` only invalidates the `loading` signal — nothing else re-evaluates.
- A component that only reads `density()` is not notified when `hoveredRow` changes.
- Angular's change detection graph is fully utilized — zero redundant checks.

## Defensive Copies on Write

Arrays and objects are defensively copied on write:
```typescript
this._visibleColumns.set([...changes.visibleColumns]);
this._selection.set({ ...changes.selection });
```
Consumers cannot mutate internal store state through an external reference they held before calling `update()`.

## Snapshots: Freeze Once, Share Safely

`TableStateSnapshot` is frozen with `Object.freeze()` recursively. There is no copy-on-read — snapshots are safe to share across components and async code without risk of mutation.

## Metrics: Zero Overhead When Unused

`TableStateMetricsService` only allocates an entry when the first `track*()` call for a given `tableId` is made. Tables that are never updated have zero memory cost.

The `trackedCount` computed uses a `_version` signal bump pattern identical to `TableRegistryService` (Sprint 9.1) — Angular tracks the computed's dependencies and re-evaluates only when something changed.

## History: Bounded Memory

`TableStateHistory` enforces `maxDepth` (default 50) via array slice on every `push()`. Memory is bounded regardless of how long the table stays open.

## Event Dispatch: O(listeners)

The event dispatch in `TableStateEngine._emit()` is a synchronous fan-out to registered handlers. No queue, no scheduler, no async indirection. Handler registration is `O(1)`. Dispatch is `O(handlers for this table + handlers for '*')`.

## Snapshot on Every Emit

Each `_emit()` call creates a fresh `TableStateSnapshot` to attach to the event. This has a small allocation cost proportional to the size of the `TableState`. For typical tables (< 30 columns, < 200 visible rows) this is negligible. If event frequency becomes a concern in a future sprint, snapshot creation can be deferred via a getter on the event object.
