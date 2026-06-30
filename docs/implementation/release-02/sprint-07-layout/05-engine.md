# Sprint 7 — Layout Engine (Orchestrator)

**File:** `src/app/core/platform/layout/layout-engine.service.ts`

---

## Responsibility

Single facade for all layout operations. Consumers import `LayoutEngineService` and call it; they do not need to know about the registry, factory, or resolver directly.

## API Surface

```typescript
class LayoutEngineService {
  // Registry
  register(definition: LayoutDefinition): void
  registerAll(definitions: ReadonlyArray<LayoutDefinition>): void
  has(id: string): boolean

  // Lifecycle
  create(definitionOrId: LayoutDefinition | string, context?): LayoutInstance
  update(id: string, context?): LayoutInstance | null
  destroy(id: string): void
  getInstance(id: string): LayoutInstance | null

  // Stateless resolution
  resolve(definitionOrId: LayoutDefinition | string, context?): ResolvedLayout | null

  // Direction
  setDirection(dir: LayoutDirection): void
  readonly direction: Signal<LayoutDirection>
  readonly breakpoint: Signal<Breakpoint>

  // Builder
  readonly builder: LayoutBuilderService

  // Serialization
  serialize(definition: LayoutDefinition): string
  deserialize(json: string): LayoutDefinition

  // CSS helpers
  toCssString(definition: LayoutDefinition, context?): string

  // Observability
  metricsSnapshot(id: string): LayoutMetricsSnapshot | null
  diagnosticsReport(): LayoutDiagnosticsReport
  readonly events: LayoutEventsService
}
```

## Viewport Tracking

The engine listens to `window.resize` and updates a `_viewportWidth` signal, which drives the `breakpoint` computed. This is the only place in the platform that reads `window.innerWidth`.

## Direction Sync

`setDirection()` updates the `dir` attribute on `document.documentElement`, ensuring native browser RTL behaviour applies automatically.

## Partial Context

All methods accepting `context?` accept `Partial<LayoutContextData>`. Unspecified fields are filled from the global `LayoutContext` snapshot (current viewport breakpoint, global direction, etc.).
