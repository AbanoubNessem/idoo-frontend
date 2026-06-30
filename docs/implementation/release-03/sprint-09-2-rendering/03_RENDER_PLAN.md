# Sprint 9.2 — TableRenderPlan

## Purpose

`TableRenderPlan` is the immutable snapshot that separates the metadata resolution layer (Sprint 9.1) from the Angular rendering layer (Sprint 9.2). Once built, the plan is a plain data object — no services, no Observables, no signals.

## Interface

```typescript
interface TableRenderPlan {
  readonly id:          string;              // unique plan id (auto-incremented)
  readonly tableId:     string;
  readonly plannedAt:   string;              // ISO timestamp
  readonly state:       TableRenderState;    // 'idle'|'loading'|'ready'|'empty'|'error'
  readonly density:     TableDensity;
  readonly headerCells: TableHeaderCellNode[];
  readonly bodyCells:   TableBodyCellNode[];
  readonly footerCells: TableSummaryCellNode[];
  readonly toolbar:     TableToolbarNode | null;
  readonly loading:     TableLoadingNode;
  readonly empty:       TableEmptyNode;
  readonly error:       TableErrorNode;
  readonly columnCount: number;
  readonly hasFooter:   boolean;
  readonly hasToolbar:  boolean;
}
```

## Render Nodes

All nodes share the `TableRenderNode` base:
```typescript
interface TableRenderNode {
  readonly type:    string;   // discriminator
  readonly visible: boolean;
}
```

| Node type              | Discriminator       | Key fields                                              |
|------------------------|---------------------|---------------------------------------------------------|
| `TableHeaderCellNode`  | `'header-cell'`     | `columnId`, `header`, `width`, `sticky`, `order`        |
| `TableBodyCellNode`    | `'body-cell'`       | `columnId`, `field`, `columnType`, `editable`, `cellClass` |
| `TableSummaryCellNode` | `'footer-cell'`     | `field`, `summaryType`, `label`                         |
| `TableToolbarNode`     | `'toolbar'`         | `showSearch`, `showExport`, `toolbarActions[]`          |
| `TableActionNode`      | `'action'`          | `actionId`, `label`, `variant`, `position`             |
| `TableEmptyNode`       | `'empty'`           | `message`, `icon`                                       |
| `TableLoadingNode`     | `'loading'`         | `skeletonRows`, `columnCount`                           |
| `TableErrorNode`       | `'error'`           | `message`, `details`, `retryable`                       |

## TableRenderContext

`TableRenderContext` is a **non-injectable class** (not `@Injectable`) that holds per-instance signal state:

```typescript
const ctx = tableRenderer.createContext();
// ctx.asReadonly() exposes: state, plan, density, errorMessage, isReady, isEmpty, ...
```

Each table instance gets its own `TableRenderContext`. Multiple tables on the same page each have independent state.

## Cell Value Resolution

`TableCellComponent` calls `TableCellRendererService.formatValue(raw, node, locale?)` which returns:

```typescript
interface TableCellValue {
  raw:       unknown;
  formatted: string;
  isEmpty:   boolean;
}
```

The `formatted` string is computed using native `Intl` API: `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat` — no third-party libraries.
