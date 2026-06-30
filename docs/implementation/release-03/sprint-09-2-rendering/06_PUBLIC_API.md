# Sprint 9.2 — Public API

## Entry Point

```typescript
// All rendering exports are available from the table barrel:
import { ... } from '@app/core/platform/table';

// Or directly from the rendering sub-barrel:
import { ... } from '@app/core/platform/table/rendering';
```

## Services (Injectable)

### `TableRendererService` — Primary facade

```typescript
class TableRendererService {
  // Sub-service accessors
  get header():  TableHeaderRendererService
  get cell():    TableCellRendererService
  get footer():  TableFooterRendererService
  get toolbar(): TableToolbarRendererService
  get empty():   TableEmptyRendererService
  get loading(): TableLoadingRendererService
  get error():   TableErrorRendererService

  // Context factory
  createContext(): TableRenderContext

  // Async path (resolves from registry by id)
  prepareFromId(tableId: string, ctx: TableRenderContext, hasData: boolean): Promise<void>

  // Sync path (resolved definition already available)
  prepare(resolved: ResolvedTableDefinition, ctx: TableRenderContext, hasData: boolean): void

  // Plan assembly
  buildPlan(resolved: ResolvedTableDefinition, state?: TableRenderState, error?: string): TableRenderPlan

  // State helpers
  applyData(ctx: TableRenderContext, hasData: boolean): void
  setError(ctx: TableRenderContext, message: string): void
  setDensity(ctx: TableRenderContext, density: TableDensity): void

  // Value formatting (delegates to TableCellRendererService)
  formatValue(value: unknown, node: TableBodyCellNode, locale?: string): TableCellValue
}
```

### `TableRenderEngineService`

```typescript
class TableRenderEngineService {
  prepareFromId(tableId: string, ctx: TableRenderContext, hasData: boolean): Promise<void>
  prepareFromResolved(resolved: ResolvedTableDefinition, ctx: TableRenderContext, hasData: boolean): void
  applyData(ctx: TableRenderContext, hasData: boolean): void
  applyError(ctx: TableRenderContext, message: string): void
}
```

### `TableRenderPlanBuilderService`

```typescript
class TableRenderPlanBuilderService {
  build(resolved: ResolvedTableDefinition, state?: TableRenderState, errorMsg?: string): TableRenderPlan
}
```

## Classes (Non-Injectable)

### `TableRenderContext`

```typescript
class TableRenderContext {
  // Read-only signal surface
  asReadonly(): {
    state:        Signal<TableRenderState>
    plan:         Signal<TableRenderPlan | null>
    density:      Signal<TableDensity>
    errorMessage: Signal<string>
    isIdle:       Signal<boolean>
    isLoading:    Signal<boolean>
    isReady:      Signal<boolean>
    isEmpty:      Signal<boolean>
    isError:      Signal<boolean>
    hasPlan:      Signal<boolean>
  }
  // Transition methods (called by engine only)
  setLoading(): void
  setReady(plan: TableRenderPlan): void
  setEmpty(plan: TableRenderPlan): void
  setError(message: string): void
  setDensity(density: TableDensity): void
  reset(): void
}
```

## Angular Components

| Selector                  | Component                   | Required inputs                        |
|---------------------------|-----------------------------|----------------------------------------|
| `platform-table`          | `TableShellComponent`       | `plan`                                 |
| `platform-table-header`   | `TableHeaderComponent`      | `cells`                                |
| `platform-table-body`     | `TableBodyComponent`        | `bodyCells`                            |
| `platform-table-cell`     | `TableCellComponent`        | `node`                                 |
| `platform-table-footer`   | `TableFooterComponent`      | `cells`                                |
| `platform-table-toolbar`  | `TableToolbarComponent`     | `node`                                 |
| `platform-table-empty`    | `TableEmptyComponent`       | `node`                                 |
| `platform-table-loading`  | `TableLoadingComponent`     | `node`                                 |
| `platform-table-error`    | `TableErrorComponent`       | `node`                                 |

## Minimum Usage Example

```typescript
// In a feature component or page
const ctx   = tableRenderer.createContext();
const rows  = signal<Record<string, unknown>[]>([]);
const plan  = computed(() => ctx.asReadonly().plan());

await tableRenderer.prepareFromId('orders', ctx, rows().length > 0);

// In template:
// <platform-table [plan]="plan()" [rows]="rows()" />
```
