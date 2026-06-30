# Sprint 9.2 — Test Coverage

## Test Files

| File | Service / Class under test | Cases |
|------|----------------------------|-------|
| `table-render-context.spec.ts` | `TableRenderContext` | 16 |
| `table-header-renderer.service.spec.ts` | `TableHeaderRendererService` | 15 |
| `table-cell-renderer.service.spec.ts` | `TableCellRendererService` | 20 |
| `table-footer-renderer.service.spec.ts` | `TableFooterRendererService` | 14 |
| `table-toolbar-renderer.service.spec.ts` | `TableToolbarRendererService` | 14 |
| `table-empty-loading-error-renderer.service.spec.ts` | `TableEmptyRendererService`, `TableLoadingRendererService`, `TableErrorRendererService` | 22 |
| `table-render-plan-builder.service.spec.ts` | `TableRenderPlanBuilderService` | 18 |
| `table-render-engine.service.spec.ts` | `TableRenderEngineService` | 10 |
| `table-renderer.service.spec.ts` | `TableRendererService` (facade) | 17 |
| **Total** | | **~146** |

## Coverage Areas

### TableRenderContext
- Initial state is `'idle'`
- State transitions: `setLoading`, `setReady`, `setEmpty`, `setError`, `setDensity`, `reset`
- Computed helpers: `isReady`, `isEmpty`, `isError`, `hasPlan`
- Plan is set on `setReady` and preserved through `setEmpty`
- `reset()` returns to idle with null plan

### TableHeaderRendererService
- One header cell per visible column
- Sorted by `order` ascending
- `sticky` and `stickyEnd` mapped correctly
- Width binding included when column has `width`
- Hidden columns excluded

### TableCellRendererService
- One body cell per column, sorted by `order`
- `formatValue` for all 21 column types
- Native `Intl` API formatting (number, date, percentage, currency)
- `isEmpty` flag for null, undefined, empty string
- `resolveCellClasses`: string, array, function variants

### TableFooterRendererService
- Footer cells only for visible columns
- Summaries for non-visible columns are skipped
- `computeSummaryValue` for sum/average/count/min/max
- Returns `null` for empty row set
- Skips non-numeric values

### TableToolbarRendererService
- Returns `null` when no toolbar definition and no actions
- Builds node from toolbar definition
- Default search placeholder is `'Search...'`
- All boolean flags mapped correctly
- Actions with `visible:false` excluded
- Function `visible` evaluated at build time

### TableEmptyRendererService / TableLoadingRendererService / TableErrorRendererService
- Default messages
- Override via argument and via `configure()`
- `reset()` returns to defaults
- `fromHttpStatus` built-in messages for 401/403/404/500/unknown

### TableRenderPlanBuilderService
- Unique incremental plan IDs across calls
- State defaults to `'ready'`
- Error message forces state to `'error'`
- `hasFooter` / `hasToolbar` reflect presence of summaries / toolbar

### TableRenderEngineService
- `prepareFromResolved` with `hasData=true` → state `'ready'`
- `prepareFromResolved` with `hasData=false` → state `'empty'`
- Plan is set on context after prepare
- `applyData` toggles ready/empty without rebuilding plan
- `applyError` sets error state; subsequent `applyData` is ignored
- `prepareFromId` with unknown tableId → rejects

### TableRendererService (facade)
- `createContext` returns distinct instances
- `prepare` delegates state and plan
- `buildPlan` returns plan with correct tableId and headerCells
- `applyData`, `setError`, `setDensity` delegate correctly
- `formatValue` delegates to cell renderer
- All sub-service getters accessible

## Known Non-Issue

`toBeTrue()` / `toBeFalse()` Jasmine matchers produce TypeScript type errors in `tsconfig.spec.json`. This is a pre-existing project-wide issue present in all earlier sprints (forms, experience, localization). The tests pass at runtime. `tsconfig.app.json` compiles with zero errors.
