# Sprint 9.2 — Render Pipeline

## Pipeline Overview

```
TableDefinition (metadata)
        │
        ▼
 TableEngineService.resolve(tableId)          [Sprint 9.1]
        │
        ▼
 ResolvedTableDefinition                      [Sprint 9.1 contract]
        │
        ▼
 TableRenderEngineService.prepare*()
        │ reads resolved definition
        │ transitions TableRenderContext state
        │
        ▼
 TableRenderPlanBuilderService.build()
        │  calls 7 renderer services
        ├─ TableHeaderRendererService  → TableHeaderCellNode[]
        ├─ TableCellRendererService    → TableBodyCellNode[]
        ├─ TableFooterRendererService  → TableSummaryCellNode[]
        ├─ TableToolbarRendererService → TableToolbarNode | null
        ├─ TableEmptyRendererService   → TableEmptyNode
        ├─ TableLoadingRendererService → TableLoadingNode
        └─ TableErrorRendererService   → TableErrorNode
        │
        ▼
 TableRenderPlan (immutable snapshot)
        │
        ▼
 TableShellComponent [platform-table]
        │  dispatches on plan.state
        ├─ loading  → TableLoadingComponent
        ├─ error    → TableErrorComponent
        ├─ empty    → TableEmptyComponent
        └─ ready/default:
              ├─ TableToolbarComponent (if hasToolbar)
              ├─ TableHeaderComponent
              ├─ TableBodyComponent   →  TableCellComponent (×N per row)
              └─ TableFooterComponent (if hasFooter)
```

## Key Invariant

**Angular components never read from `ResolvedTableDefinition` or `TableDefinition` directly.**
Every component receives a typed node from `TableRenderPlan`. This single invariant means:
- Metadata changes require a new Render Plan — they cannot silently corrupt a live view.
- Components are pure functions of their render node inputs.

## State Transitions (TableRenderContext)

```
idle ──setLoading()──► loading ──setReady(plan)──► ready ⇄ empty
                                └──setEmpty(plan)──►       (applyData toggles)
any ──setError(msg)──► error
```

`applyData(hasData)` is a lightweight toggle between `ready` and `empty` without rebuilding the plan — the existing plan is retained.
