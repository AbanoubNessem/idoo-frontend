# Sprint 9.2 — Angular Components

## Component Tree

```
platform-table                    (TableShellComponent)
├── platform-table-toolbar        (TableToolbarComponent)       [if hasToolbar]
├── platform-table-header         (TableHeaderComponent)
├── platform-table-body           (TableBodyComponent)
│   └── platform-table-cell ×N   (TableCellComponent)          [per row × per column]
├── platform-table-footer         (TableFooterComponent)        [if hasFooter]
├── platform-table-empty          (TableEmptyComponent)         [state=empty]
├── platform-table-loading        (TableLoadingComponent)       [state=loading]
└── platform-table-error          (TableErrorComponent)         [state=error]
```

All components:
- `ChangeDetectionStrategy.OnPush`
- Standalone (no NgModules)
- Signal inputs / outputs

## TableShellComponent (`platform-table`)

**Inputs:** `plan: TableRenderPlan`, `rows: Record<string, unknown>[]`

**Outputs:** `actionClicked`, `refreshClicked`, `densityClicked`, `columnPickerClicked`, `exportClicked`, `printClicked`, `searchChanged`, `retryClicked`

Dispatches on `plan().state` via `@switch`. Imports all 8 sub-components.

## TableHeaderComponent (`platform-table-header`)

**Input:** `cells: TableHeaderCellNode[]`

Renders `<thead>` with sticky start/end column support and optional width binding.

## TableBodyComponent (`platform-table-body`)

**Inputs:** `bodyCells: TableBodyCellNode[]`, `rows: Record<string, unknown>[]`

Outer `@for` over rows tracked by `row['id'] ?? index`. Inner `@for` over `bodyCells`. Delegates field-value extraction to `getFieldValue(row, field)` which supports dot-notation paths (e.g. `address.city`).

## TableCellComponent (`platform-table-cell`)

**Inputs:** `node: TableBodyCellNode`, `value: unknown`

Injects `TableCellRendererService`. `cellValue = computed(() => service.formatValue(value(), node()))`. Dispatches on `node().columnType` via `@switch` (21 cases):

| Type group            | Rendered as                        |
|-----------------------|------------------------------------|
| `text`, `textarea`, `longtext` | plain text              |
| `number`, `currency`, `percentage` | formatted string    |
| `date`, `datetime`, `time` | Intl-formatted string        |
| `boolean`             | ✓ / ✗                              |
| `email`               | `<a href="mailto:…">`              |
| `phone`               | `<a href="tel:…">`                 |
| `link`                | `<a href="…" target="_blank">`     |
| `image`               | `<img>`                            |
| `avatar`              | `<img class="avatar">`             |
| `progress`            | `<div>` progress bar               |
| `badge`, `chip`, `status`, `tag` | `<span class="…">`  |
| `icon`                | `<span class="icon">`              |
| `rating`              | `<span class="rating">`            |
| `custom`              | raw string fallback                |

## TableFooterComponent (`platform-table-footer`)

**Inputs:** `cells: TableSummaryCellNode[]`, `rows: Record<string, unknown>[]`

`computedValues = computed(() => Map<columnId, string>)` — calls `TableFooterRendererService.computeSummaryValue()` for each cell, then formats the result.

## TableToolbarComponent (`platform-table-toolbar`)

**Input:** `node: TableToolbarNode`

**Outputs:** `actionClicked<string>`, `refreshClicked`, `densityClicked`, `columnPickerClicked`, `exportClicked`, `printClicked`, `searchChanged<string>`

Maintains `searchValue = signal('')`. `toolbarActions()` computes `node().toolbarActions` filtered by `position === 'toolbar'`.

## TableEmptyComponent / TableLoadingComponent / TableErrorComponent

Simple display components that accept their typed node and surface content. `TableLoadingComponent` generates skeleton rows and cols as computed number arrays for `@for` iteration. `TableErrorComponent` emits `retry = output<void>()`.
