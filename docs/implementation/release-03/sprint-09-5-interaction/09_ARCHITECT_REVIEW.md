# Sprint 9.5 — Architecture Review Checklist

## For the Reviewing Architect

Sprint 9.5 adds the Interaction layer. Sprints 9.1–9.4 are approved. This review focuses on selection, editing, editor registry, and their integration with the event bus.

---

## Design Decisions to Review

### 1. Selection Context uses ReadonlySet<string> in a Signal

**Decision:** `_selected = signal<ReadonlySet<string>>(new Set())`. Each mutation allocates a new Set.
**Rationale:** Angular's signal change detection uses `===` for equality. A mutated Set would not trigger change detection. New Set per mutation guarantees signal propagation.
**Question:** Acceptable memory pattern for datasets with frequent selection changes (e.g., range-select 5,000 rows)?

### 2. Per-row `isSelected(id)` computed signals

**Decision:** `context.isSelected(id)` returns `computed(() => this._selected().has(id))`.
**Rationale:** Allows template-level binding without iterating the whole selection in the component. Each signal is lazy.
**Question:** Should there be a documented limit on how many per-row computed signals should be created (e.g., max 100 rows before using `selectedIds()` directly)?

### 3. Editing context pending values — Map in signal

**Decision:** `_pendingEdits = signal(new Map<string, unknown>())`. New Map per `setValue()`.
**Rationale:** Same rationale as selection — Map mutation is not detectable by signal equality. New Map guarantees propagation.
**Question:** For row editing with many columns (e.g., 50 columns), each `setValue()` allocates a new 50-entry Map. Is this acceptable?

### 4. Validator registration outside context (on engine, not context)

**Decision:** Validators are stored in `TableEditingEngine._validators`, not on `TableEditingContext`.
**Rationale:** Validators are a setup concern (wired at component/page level), not a per-edit-state concern. Keeping them in the engine allows the same validator set to apply across multiple edit cycles on the same table without re-registration.
**Question:** Confirmed. Should validators also be namespaced by column group or just columnId?

### 5. Editor definitions do not hold component tokens

**Decision:** `TableEditorDefinition` has `type`, `displayName`, `supportsNull`, and optional `config`. No Angular component class or injection token.
**Rationale:** Avoids coupling the data layer to the view layer. The rendering layer (future sprint) will maintain its own editor component registry, keyed by `TableEditorType`.
**Question:** Is this two-registry pattern (data metadata registry + component registry) acceptable? Or should there be a single unified registry?

### 6. Events emitted synchronously

**Decision:** `TableInteractionEvents.emit()` calls handlers synchronously in-order.
**Rationale:** No queuing, no microtask delay, no allocation. Guarantees event delivery before the next frame.
**Question:** Any concern about synchronous emission causing re-entrant calls if a handler triggers another engine action?

---

## Metrics

| Metric | Value |
|--------|-------|
| Source files | 13 |
| Non-injectable classes | 4 |
| Injectable services | 8 |
| Test spec files | 10 |
| Test cases | ~178 |
| Circular dependencies | 0 |
| External runtime dependencies | 0 |
| Sprints 9.1–9.4 contracts modified | 0 (table/index.ts additive only) |

---

## Approval Gate

- [ ] `ReadonlySet<string>` signal pattern approved
- [ ] Per-row `isSelected()` computed signal pattern approved
- [ ] Pending edits `Map` signal pattern approved
- [ ] Validator registration on engine (not context) approved
- [ ] Two-registry pattern (data + component) approved
- [ ] Synchronous event emission approved
- [ ] No concerns with test coverage (~178 cases)
- [ ] Sprint 9.5 approved — proceed to Sprint 9.6
