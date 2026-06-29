# Sprint 3 — Architecture Decisions

---

## ADR-001: Adapter Pattern for UI Framework Isolation

**Decision:** The rendering core never imports `@angular/material` (or any UI framework). All component types flow through a `UIAdapter` interface.

**Context:** The platform must support multiple UI frameworks (Material, PrimeNG, Bootstrap, Tailwind). Coupling the core to Material would require massive refactoring to switch frameworks.

**Consequences:**
- MaterialAdapter is the only file that knows about Material components
- Sprint 3 uses `FieldDisplayComponent` as a universal placeholder — replaced per-type in Sprint 4
- Switching adapters at runtime requires only `AdapterManagerService.setActiveAdapter()`

---

## ADR-002: RenderContext as Value Object

**Decision:** `RenderContext` is a plain class, not an `@Injectable` Angular service.

**Context:** Render contexts are per-request, not singletons. Each render operation has its own model, permissions, and mode. Using a service would require manual state reset per render.

**Consequences:**
- `RenderContext.create()` static factory called by pipeline per render
- `withModel()` creates a new context with a different model (immutable pattern)
- No DI overhead; context is garbage-collected after render completes

---

## ADR-003: InjectionToken Multi-Providers for Renderer Extensibility

**Decision:** `FIELD_RENDERER = new InjectionToken<FieldRenderer>('FIELD_RENDERER')` with `multi: true` allows external plugins to register renderers without modifying core.

**Context:** The platform registry (Sprint 1) uses the same pattern. Consistent extensibility model.

**Consequences:**
- Plugins provide `{ provide: FIELD_RENDERER, useClass: MyRenderer, multi: true }`
- `RendererRegistryService.initializeFromInjected()` must be called after DI construction
- `RenderingEngineService.initialize()` calls this as part of startup

---

## ADR-004: AbstractFieldRenderer — Template Method Pattern

**Decision:** 20 built-in renderers extend `AbstractFieldRenderer` and only override `getDefaultConfig()`.

**Context:** All renderers share identical render logic: resolve component from context, build inputs, evaluate expressions. Repeating this in 20 classes would be DRY violation.

**Consequences:**
- New field types need only a 10-line subclass
- `buildInputs()` is protected — overridable if a type needs custom input mapping
- All renderers support all 3 modes by default (`display`, `edit`, `filter`)

---

## ADR-005: Sprint 3 Placeholder Components

**Decision:** `MaterialAdapter` maps all 21 field types to `FieldDisplayComponent` in Sprint 3.

**Context:** Real Material form field components (`MatInput`, `MatSelect`, etc.) belong in Sprint 4 (Dynamic Forms). Implementing them in Sprint 3 would violate the sprint scope boundary.

**Consequences:**
- `FieldDisplayComponent` handles all display formatting (boolean Yes/No, currency Intl.NumberFormat, etc.)
- Sprint 4 calls `MaterialAdapter.registerFieldComponent(fieldType, MatInputComponent)` to override
- Zero regression risk when Sprint 4 registers its components

---

## ADR-006: Pipeline as Async Service

**Decision:** `RenderPipelineService.runField()` is `async` even though all current stages are synchronous.

**Context:** Future stages (remote validator resolution, lazy component loading) will be async. Making the API async now avoids breaking callers in Sprint 5+.

**Consequences:**
- `RenderingEngineService.renderField()` is async — callers `await` it
- Current synchronous stages complete immediately (no observable latency)
- Sprint 5 can add `await` inside pipeline stages without changing the public contract

---

## ADR-007: RendererFactory vs RendererResolver

**Decision:** Two separate services for renderer access:
- `RendererFactoryService` — creates with typed error results (`FactoryResult<T>`)
- `RendererResolverService` — resolves with fallback logic (`ResolutionResult<T>`)

**Context:** Factory and resolution have different failure semantics. Factory returns a structured error. Resolver applies fallback strategies (e.g., fall back to 'text' renderer).

**Consequences:**
- Pipeline uses `RendererResolverService` (needs fallback)
- Diagnostic and registry inspection code uses `RendererFactoryService` (needs error details)
- Both delegate to `RendererRegistryService` — single source of truth
