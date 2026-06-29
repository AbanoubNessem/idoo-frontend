# Sprint 3 — Dependency Graph

**Module:** `src/app/core/platform/rendering/`

---

## Full Dependency Map

```
rendering/
├── rendering.types.ts                    (no deps)
├── renderer-context.ts                   (rendering.types.ts)
│
├── contracts/
│   ├── field-renderer.ts                 (rendering.types.ts, renderer-context.ts)
│   ├── layout-renderer.ts                (rendering.types.ts, renderer-context.ts)
│   ├── action-renderer.ts                (rendering.types.ts, renderer-context.ts)
│   ├── cell-renderer.ts                  (rendering.types.ts, renderer-context.ts)
│   ├── header-renderer.ts                (rendering.types.ts, renderer-context.ts)
│   ├── footer-renderer.ts                (rendering.types.ts, renderer-context.ts)
│   └── widget-renderer.ts                (rendering.types.ts, renderer-context.ts)
│
├── components/
│   └── field-display.component.ts        (@angular/core, @angular/common)
│
├── component-host.component.ts           (@angular/core, @angular/common)
│
├── adapters/
│   ├── adapter.interface.ts              (rendering.types.ts)
│   ├── material.adapter.ts               (@angular/core, adapter.interface.ts,
│   │                                      components/field-display.component.ts)
│   ├── primeng.adapter.stub.ts           (adapter.interface.ts)
│   ├── bootstrap.adapter.stub.ts         (adapter.interface.ts)
│   └── tailwind.adapter.stub.ts          (adapter.interface.ts)
│
├── renderers/
│   ├── abstract-field.renderer.ts        (contracts/field-renderer.ts)
│   └── [20 concrete renderers]           (abstract-field.renderer.ts)
│
├── render-events.service.ts              (@angular/core, rxjs, rendering.types.ts)
├── render-metrics.service.ts             (@angular/core, rendering.types.ts)
├── render-cache.service.ts               (@angular/core, rendering.types.ts)
├── renderer-registry.service.ts          (@angular/core, contracts/*, render-events.service.ts)
├── renderer-factory.service.ts           (@angular/core, contracts/*, renderer-registry.service.ts)
├── renderer-resolver.service.ts          (@angular/core, contracts/*, renderer-registry.service.ts)
├── adapter-manager.service.ts            (@angular/core, adapters/*, render-events.service.ts)
├── render-pipeline.service.ts            (@angular/core, renderer-resolver.service.ts,
│                                          adapter-manager.service.ts, render-cache.service.ts,
│                                          render-metrics.service.ts, render-events.service.ts,
│                                          renderer-context.ts)
├── render-diagnostics.service.ts         (@angular/core, renderer-registry.service.ts,
│                                          adapter-manager.service.ts, render-cache.service.ts,
│                                          render-metrics.service.ts, render-events.service.ts)
└── rendering-engine.service.ts           (@angular/core, renderer-registry.service.ts,
                                           render-pipeline.service.ts,
                                           render-diagnostics.service.ts,
                                           render-metrics.service.ts, render-cache.service.ts,
                                           render-events.service.ts, adapter-manager.service.ts,
                                           renderers/[all 21])
```

---

## Isolation Boundaries

| Layer | Allowed Imports | Forbidden |
|-------|----------------|-----------|
| Types | none | everything |
| Contracts | types, context | services, material |
| Renderers | contracts, types | services, material, angular/material |
| Adapters | types, @angular/core | HttpClient, Router, FormsModule |
| Services | types, contracts, other services | @angular/material (except MaterialAdapter) |
| Engine | all rendering layers | HttpClient, Router, business modules |

---

## No Circular Dependencies

Verified: the dependency graph is a strict DAG. No cycles exist between any two modules.

---

## External Dependencies

| Package | Used By |
|---------|---------|
| `@angular/core` | All services and components |
| `@angular/common` | FieldDisplayComponent, ComponentHostComponent |
| `rxjs` | RenderEventsService (Subject, Observable, filter) |
| `@angular/material/*` | MaterialAdapter only (currently none — FieldDisplayComponent is placeholder) |
