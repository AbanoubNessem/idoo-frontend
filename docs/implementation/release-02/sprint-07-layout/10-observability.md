# Sprint 7 — Observability (Events, Metrics, Diagnostics)

---

## LayoutEventsService

An RxJS `Subject`-based event bus. All layout lifecycle and interaction events are published here.

```typescript
service.events$                        // Observable<LayoutEvent> — all events
service.on('breakpoint:changed')       // Filtered observable by type
service.forLayout('layout-id')         // Filtered by layout id
service.emitFor(id, type, payload)     // Emit from services/engine
```

### Event Types

`layout:created`, `layout:initialized`, `layout:updated`, `layout:destroyed`, `layout:error`, `breakpoint:changed`, `direction:changed`, `tab:activated`, `accordion:toggled`, `sidebar:toggled`, `splitter:resized`, `overlay:opened`, `overlay:closed`, `slot:rendered`, `visibility:changed`, `order:changed`, `size:changed`

---

## LayoutMetricsService

Opt-in (requires `LAYOUT_DIAGNOSTICS_ENABLED = true`). Records per-instance render counts, timings, resolve counts, and breakpoint change frequency.

```typescript
service.snapshot('layout-id')   // LayoutMetricsSnapshot | null
service.allSnapshots()          // All tracked instances
```

`LayoutFactoryService` automatically records metrics on `create()`, `update()`, and `destroy()`.

---

## LayoutDiagnosticsService

Aggregates a full report across all active instances.

```typescript
service.report()    // LayoutDiagnosticsReport
service.logReport() // console.group output (only when diagnostics enabled)
```

### Enabling Diagnostics

```typescript
// In app.config.ts or a provider:
{ provide: LAYOUT_DIAGNOSTICS_ENABLED, useValue: true }
```

Diagnostics are disabled by default (`factory: () => false`) to avoid production overhead.
