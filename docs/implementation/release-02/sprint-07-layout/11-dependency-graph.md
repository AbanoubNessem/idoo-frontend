# Sprint 7 — Dependency Graph

No circular dependencies. All arrows point downward.

```
LayoutEngineService (facade / orchestrator)
├── LayoutRegistryService          (stores definitions)
├── LayoutFactoryService           (creates instances)
│   ├── LayoutResolverService
│   │   └── LayoutRendererService  (stateless CSS generation)
│   ├── LayoutMetricsService
│   ├── LayoutLifecycleService
│   │   └── LayoutEventsService
│   └── LayoutEventsService
├── LayoutBuilderService           (fluent API, no deps)
├── LayoutSerializerService
│   └── LayoutRegistryService
├── LayoutMetricsService
├── LayoutDiagnosticsService
│   ├── LayoutMetricsService
│   ├── LayoutRegistryService
│   └── LayoutFactoryService
└── LayoutEventsService

LayoutHostComponent
├── LayoutEngineService
└── LayoutRendererService

FormLayoutAdapter
└── LayoutBuilderService

FormSectionComponent (refactored)
├── FormLayoutAdapter
└── LayoutRendererService

FormTabsContainerComponent (refactored)
└── LayoutState (plain class, no injection)

FormAccordionContainerComponent (refactored)
└── LayoutState (plain class, no injection)
```

## Plain Classes (no Angular DI)

`LayoutContext` and `LayoutState` are instantiated with `new` inside components. They use Angular's `signal()` / `computed()` APIs but are not registered with the DI system. This keeps per-instance state isolated and avoids provider scope conflicts.
