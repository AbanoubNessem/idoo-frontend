# Sprint 9.4 — Architecture Review Checklist

## For the Reviewing Architect

Sprint 9.4 adds the data operations layer. Sprints 9.1–9.3 (Foundation, Rendering, State) are already approved. This review focuses on sorting, filtering, pagination, and the pipeline.

---

## Design Decisions to Review

### 1. Pipeline order: Filter → Sort → Paginate
**Decision:** Filtering happens before sorting so that the sort only processes the visible dataset. Sorting happens before pagination so that the correct rows appear on each page.
**Rationale:** Standard data grid processing order. Alternatives (e.g., sort then filter) would produce incorrect page assignments.
**Question:** Confirm this order matches the expected UX behavior.

### 2. totalCount derived from rows.length inside the engine
**Decision:** `TablePaginationEngine.paginate(rows, config)` uses `rows.length` as `totalCount`, not a value in the config.
**Rationale:** At paginate-time, `rows` has already been filtered. Using `rows.length` guarantees `totalCount` always reflects the filtered dataset. This eliminates a common source of bugs (stale totalCount).
**Question:** For server-side pagination (future sprint), the `totalCount` will come from the API. At that point, the config should carry a `serverTotalCount` field. Design approved now?

### 3. Stable sort via indexed tiebreaking
**Decision:** Original-index tiebreaking rather than relying on the JS engine's native stability.
**Rationale:** Guaranteed stable in all environments. Negligible memory cost (`O(n)` wrapper objects).
**Question:** Acceptable trade-off vs. relying on ES2019 stable sort?

### 4. FilterRegistry holds only custom predicates; built-in operators in the engine
**Decision:** The 12 built-in operators are handled by a `switch` in `TableFilteringEngine`. The `TableFilterRegistry` is for `custom` operator predicates only.
**Rationale:** Built-in operators are fast, predictable, and have no registry lookup overhead. The registry extensibility is only needed for domain-specific predicates.
**Question:** Should built-in operators also be overridable via the registry?

### 5. ComparatorRegistry holds both built-in and custom comparators
**Decision:** Built-in comparators (text, number, date, boolean, locale-text) are pre-registered in `TableComparatorRegistry` constructor.
**Rationale:** Allows overriding built-ins if needed (e.g., a project-specific text comparator). Keeps the sorting engine's lookup logic uniform.
**Question:** Confirmed.

### 6. Dot-notation field paths in both engines
**Decision:** Both `TableSortingEngine` and `TableFilteringEngine` support `field: 'address.city'`.
**Rationale:** Consistent with Sprint 9.2 `TableBodyComponent.getFieldValue()`. Supports nested data without flattening.
**Question:** Max nesting depth? Currently unbounded — consider a depth limit to prevent prototype chain traversal abuse.

---

## Metrics

| Metric | Value |
|--------|-------|
| Source files | 13 |
| Test spec files | 10 |
| Test cases | ~171 |
| Circular dependencies | 0 |
| External runtime dependencies | 0 |
| Sprint 9.1–9.3 contracts modified | 0 (table/index.ts additive only) |

---

## Approval Gate

- [ ] Pipeline order (filter→sort→paginate) approved
- [ ] `totalCount` from `rows.length` approved
- [ ] Stable sort implementation approved
- [ ] Custom vs. built-in operator design approved
- [ ] Dot-notation field paths approved
- [ ] No concerns with test coverage (~171 cases)
- [ ] Sprint 9.4 approved — proceed to Sprint 9.5
