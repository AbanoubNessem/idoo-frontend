# Sprint 9.2 — Architecture Review Checklist

## For the Reviewing Architect

Sprint 9.2 implements the rendering layer for the Dynamic Table system. Sprint 9.1 (Table Foundation) was already approved. This review focuses on the rendering pipeline only.

---

## Design Decisions to Review

### 1. Render Plan as immutable snapshot
**Decision:** `TableRenderPlan` is a plain TypeScript object — no signals, no mutable state.
**Rationale:** Components receive the plan as a single `input.required<TableRenderPlan>()`. Angular's signal graph then manages re-rendering via computed signals inside components. Separating the plan (data) from the context (state) keeps the plan serializable and testable.
**Question:** Is there a preference for making `TableRenderPlan` a class with helper methods, or is a plain interface preferable?

### 2. TableRenderContext as non-injectable class
**Decision:** `TableRenderContext` is constructed with `new TableRenderContext()` via `TableRendererService.createContext()`, not via Angular DI.
**Rationale:** Multiple tables on the same page need independent signal state. If it were `@Injectable`, all instances would share a singleton.
**Question:** Approved approach, or should we use a factory provider pattern instead?

### 3. Seven specialized renderer services
**Decision:** One renderer service per concern (header, cell, footer, toolbar, empty, loading, error). Each is `@Injectable({ providedIn: 'root' })`.
**Rationale:** Follows SOLID single-responsibility. Each service is independently testable. The plan builder composes them.
**Question:** No concerns anticipated — but confirm comfort with 7 root-provided singletons for this layer.

### 4. TableCellComponent dispatch: 21-case @switch
**Decision:** All 21 column types dispatched in a single `@switch` block within one component.
**Rationale:** Avoids a dynamic component registry for pure display use. Each case is a simple HTML template — no logic. Adding a new column type requires modifying one file.
**Question:** Acceptable for MVP? Future sprint could introduce `@defer` blocks per type if bundle splitting becomes necessary.

### 5. formatValue using native Intl API
**Decision:** No third-party formatting libraries. `Intl.NumberFormat`, `Intl.DateTimeFormat`.
**Rationale:** Zero bundle cost. Locale-aware by default. Consistent with Sprint 8.3 (Culture/Localization engine).
**Question:** Confirm this is consistent with the broader platform formatting strategy.

---

## Metrics

| Metric | Value |
|--------|-------|
| Source files | 21 |
| Test spec files | 9 |
| Test cases | ~146 |
| Circular dependencies | 0 |
| External runtime dependencies added | 0 |
| Sprint 9.1 files modified | 0 (index.ts only — additive export) |

---

## Approval Gate

- [ ] Render Plan design approved
- [ ] `TableRenderContext` lifecycle approved
- [ ] Component tree structure approved
- [ ] 21-type dispatch approach approved
- [ ] No concerns with test coverage
- [ ] Sprint 9.2 approved — proceed to Sprint 9.3
