# Sprint 9.5 — Implementation Overview

## Location

```
src/app/core/platform/table/interaction/
```

## Responsibility

Provides Selection and Editing capabilities for the Dynamic Table Platform. No rendering knowledge. No business logic. No API calls.

---

## File Inventory

| File | Type | Purpose |
|------|------|---------|
| `table-interaction.types.ts` | Types | All shared types, interfaces, and enums |
| `table-interaction.constants.ts` | Constants | Built-in editor definitions and column-type mappings |
| `table-selection-context.ts` | Non-injectable class | Signal-based selection state per table instance |
| `table-editing-context.ts` | Non-injectable class | Signal-based editing state per table instance |
| `table-selection-strategy.ts` | Non-injectable class | Selection action application algorithm |
| `table-editing-strategy.ts` | Non-injectable class | Editing keyboard/focus behavior decisions |
| `table-cell-editor-registry.service.ts` | Injectable service | Editor type registry with 11 built-ins |
| `table-editor-resolver.service.ts` | Injectable service | Resolves editor type for a given column type |
| `table-selection-engine.service.ts` | Injectable service | Table-level selection facade |
| `table-editing-engine.service.ts` | Injectable service | Table-level editing facade |
| `table-interaction-events.service.ts` | Injectable service | Event bus for all interaction events |
| `table-interaction-metrics.service.ts` | Injectable service | Per-table interaction metrics |
| `index.ts` | Barrel | Public exports |

---

## Dependency Graph

```
TableSelectionEngine
  └── TableInteractionEvents     (event bus)
  └── TableInteractionMetrics    (metrics)
  └── TableSelectionContext      (per-table, created by engine)
  └── TableSelectionStrategy     (per-table, created by engine)

TableEditingEngine
  └── TableInteractionEvents
  └── TableInteractionMetrics
  └── TableEditorResolver
      └── TableCellEditorRegistry
  └── TableEditingContext        (per-table, created by engine)
  └── TableEditingStrategy       (per-table, created by engine)
```

No circular dependencies. No imports from rendering or metadata layers.

---

## Design Constraints

- Selection must not know rendering details
- Editing must not know rendering details
- Editors resolved through registry — no direct component coupling
- All signals — no RxJS
- `ChangeDetectionStrategy.OnPush` compatible (all signals are signals)
- No business validation
- No API calls
- No persistence
