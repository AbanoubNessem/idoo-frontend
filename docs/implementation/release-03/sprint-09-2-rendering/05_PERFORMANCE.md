# Sprint 9.2 — Performance Design

## Signal-First Reactivity

All component inputs use Angular signal-based APIs (`input.required<T>()`, `input<T>(default)`). Derived state uses `computed()`. This means Angular's change-detection graph is fully informed — no `markForCheck()` calls, no manual subscriptions.

## OnPush Everywhere

Every component uses `ChangeDetectionStrategy.OnPush`. Angular will only re-check a component subtree when:
1. A signal it reads changes, or
2. An event it emits fires.

This eliminates the default zone-triggered traversal for all 9 components.

## TrackBy in TableBodyComponent

```typescript
trackRow(index: number, row: Record<string, unknown>): unknown {
  return row['id'] ?? index;
}
```

Using entity identity (`row['id']`) means Angular preserves DOM nodes during row reorder or partial refresh. Falls back to `index` for rows without an `id` field.

## Render Plan Immutability

`TableRenderPlan` is a plain object — no signals, no Observables. Once built it never mutates. Components that receive the plan via `input.required<TableRenderPlan>()` are re-checked only when the reference changes (new plan built). Lightweight operations like `applyData()` do not rebuild the plan.

## formatValue Locality

`TableCellComponent.cellValue` is a `computed()` that calls `TableCellRendererService.formatValue()`. Because `formatValue` is a pure function and is called inside `computed()`, Angular tracks exactly which signal reads it depends on. If the cell node or value changes independently, only that cell re-evaluates.

## No Unnecessary Allocations

- `TableHeaderRendererService` / `TableCellRendererService` return sorted arrays once at plan-build time; components iterate pre-sorted arrays without re-sorting.
- `TableFooterComponent.computedValues` is a `computed()` Map — recomputed only when `cells()` or `rows()` signal changes.
- `TableToolbarComponent.toolbarActions` is a `computed()` — the filter over toolbar actions runs only on plan change.

## Lazy Plan Preparation

`TableRenderEngineService.prepareFromId()` is async. The context starts in `'idle'` state; calling code transitions it to `'loading'` before the async resolve, so the shell immediately renders a skeleton while the plan is being assembled.
