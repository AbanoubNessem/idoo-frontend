# Sprint 9.3 — Architecture Review Checklist

## For the Reviewing Architect

Sprint 9.3 adds the state layer to the Dynamic Table system. Sprints 9.1 (Foundation) and 9.2 (Rendering) are already approved. This review focuses on state design only.

---

## Design Decisions to Review

### 1. One store per table instance (not singleton)
**Decision:** `TableStateStore` is a non-injectable class. `TableStateEngine.createStore(tableId)` creates and registers a new store.
**Rationale:** Multiple tables on the same page need independent state. A singleton would share `hoveredRow`, `focusedCell`, etc. across all tables.
**Question:** Should `tableId` be enforced to be unique at the engine level, or allow multiple stores with the same ID?

### 2. State knows nothing about rendering or metadata
**Decision:** `TableStateStore` imports only from `table.types.ts` (for `TableDensity`, `TableSelectionMode`). It does not import from `rendering/` or from `table-resolver.service.ts`.
**Rationale:** Avoids coupling. State changes don't trigger re-renders directly — consumers decide when to call `TableRendererService.setDensity()` after observing `ctx.asReadonly().density()`.
**Question:** Should the engine provide a convenience method that bridges state and renderer (e.g., `syncDensityToRenderer(store, ctx)`)? Deferred to a future sprint?

### 3. Placeholder sub-states (sort, filter, pagination, selection, editing)
**Decision:** Each placeholder sub-state is defined with `{ active: boolean }` only. The interface comments indicate which sprint will extend them.
**Rationale:** Makes the state model architecturally complete now. Future sprints add fields to the interfaces without breaking the store's signal pattern.
**Question:** Should placeholders use `Record<string, unknown>` instead, to avoid changing TypeScript interfaces in future sprints? Or are interface extensions acceptable?

### 4. Undo/Redo: architecture only
**Decision:** `TableStateHistory` exists with `push()`, `peek()`, `clear()`, signal `canUndo/canRedo/depth`. `undo()` and `redo()` return `null`.
**Rationale:** The data structure is ready; the transition logic needs definition of which state fields participate in undo (e.g., does `hoveredRow` participate? Does `loading`?).
**Question:** Confirm this deferred approach is acceptable. If not, specify which fields are undo-able.

### 5. Event snapshot cost
**Decision:** `_emit()` calls `_serializer.createSnapshot()` for every event, allocating a new frozen object.
**Rationale:** Events carry a state snapshot so handlers don't need to call `engine.snapshot()` separately. Simplicity over micro-optimization.
**Question:** Is this allocation acceptable, or should events carry a lazy getter?

---

## Metrics

| Metric | Value |
|--------|-------|
| Source files | 11 |
| Test spec files | 7 |
| Test cases | ~125 |
| Circular dependencies | 0 |
| External runtime dependencies added | 0 |
| Sprint 9.1/9.2 contracts modified | 0 (table/index.ts additive only) |

---

## Approval Gate

- [ ] Store-per-instance design approved
- [ ] State isolation from rendering/metadata approved
- [ ] Placeholder sub-state approach approved
- [ ] Undo/Redo deferred approach approved
- [ ] No concerns with test coverage
- [ ] Sprint 9.3 approved — proceed to Sprint 9.4
