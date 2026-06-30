# Sprint 9.3 — State Architecture

## Layer Separation

```
┌─────────────────────────────────────────────────────────────┐
│  Consumer (page component, feature module)                   │
│  ──────────────────────────────────────                      │
│  TableStateEngine.createStore(tableId)     → TableStateStore │
│  TableStateEngine.createContext(store)     → TableStateContext│
│                                                              │
│  engine.update(store, { density: 'compact' })               │
│  engine.snapshot(store)  →  TableStateSnapshot              │
│  engine.restore(store, snapshot)                            │
│                                                              │
│  ctx.asReadonly().density()   ← signal (read-only)          │
│  ctx.asReadonly().isLoading() ← computed                     │
└─────────────────────────────────────────────────────────────┘
              │ state never leaks to metadata or rendering
              ▼
┌─────────────────────────────────────────────────────────────┐
│  TableStateEngine  (Injectable facade)                       │
│  ├─ TableStateValidatorService                               │
│  ├─ TableStateSerializerService                              │
│  └─ TableStateMetricsService                                 │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  TableStateStore  (non-injectable, per table instance)       │
│  private signals → public readonly signals + computed        │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Rules

1. **State knows nothing about rendering.** `TableStateStore` holds `density`, `visibleColumns`, etc. It has no concept of `TableRenderPlan` or `TableRenderContext`. Consumers bridge them.

2. **State knows nothing about metadata internals.** The store holds `visibleColumns: string[]` (column IDs). It never imports `TableColumnDefinition` or `ResolvedTableDefinition`.

3. **One store per table instance.** `TableStateEngine.createStore(tableId)` creates and registers an independent store. Multiple tables on the same page each have their own store.

4. **Clean API only.** All state mutations go through `engine.update()`, `engine.reset()`, or `engine.restore()`. Stores are never mutated directly outside the engine.

5. **Snapshots are immutable.** `Object.freeze()` is applied recursively — the snapshot and its nested objects cannot be mutated after creation.

## Integration Points

| External Engine | How state integrates |
|----------------|----------------------|
| Render Engine (9.2) | Consumer reads `ctx.asReadonly().density()` and passes it to `TableRendererService.setDensity()` |
| Theme Engine (8.2) | Theme `density` value can be written into state via `engine.update(store, { density })` |
| Localization Engine (8.3) | Locale is not stored here — it lives in the localization engine; formatters read it independently |
| Experience Engine (8.1) | Experience `density` preference flows into state initialization |
| Table Foundation (9.1) | State reads column IDs from resolved definition to initialize `visibleColumns` |
