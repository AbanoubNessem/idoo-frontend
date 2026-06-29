# Sprint 1 — Dependency Graph

**Sprint:** Sprint 1 — Platform Core Foundation  
**Date:** 2026-06-28  

---

## Layer Dependency Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         APPLICATION                              │
│                       (app.config.ts)                           │
│              providePlatform()  providePlugin()                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                          KERNEL                                  │
│  PlatformKernel → BootManager → BootPipeline → BootSteps        │
│  BootStateMachine   PlatformContext   LifecycleManager           │
│  VersionService     HealthService     DiagnosticsService         │
│                                                                  │
│  External: @angular/core, @angular/common/http                   │
└──────────┬──────────────────────────────────────────────────────┘
           │ depends on
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         REGISTRY                                 │
│  BaseRegistry<TDef>                                              │
│  16 concrete registries (Entity, Form, Table, Route, Menu...)    │
│  RegistryManager                                                 │
│                                                                  │
│  External: @angular/core                                         │
└──────────┬──────────────────────────────────────────────────────┘
           │ depends on
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                          PLUGIN                                  │
│  PluginHost → PluginManager → PluginLoader → PluginLifecycle    │
│  PluginResolver   PluginRegistration   PluginDiagnostics         │
│                                                                  │
│  Depends on: Kernel (PlatformContextService, KernelFacade)       │
│              Registry (all 16 registries via RegistryManager)    │
│  External: @angular/core, rxjs                                   │
└──────────┬──────────────────────────────────────────────────────┘
           │ depends on
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                           SDK                                    │
│  define*() functions    Builders    Validators    Helpers         │
│                                                                  │
│  Depends on: Registry types (for define* parameter types)        │
│              Plugin types (for definePlugin, validatePlugin)     │
│  External: @angular/core (IS_DEV detection only)                 │
└──────────┬──────────────────────────────────────────────────────┘
           │ depends on
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         RUNTIME                                  │
│  RuntimeCore → StateEngine, CacheEngine, QueryEngine             │
│             → NavigationEngine, ExpressionEngine                 │
│             → ValidationEngine, RuleEngine, FormulaEngine        │
│  EventBus   RuntimeContext   AbstractDataProvider                 │
│                                                                  │
│  Depends on: Kernel (PlatformContext)                            │
│              Registry (ValidationRegistry for ValidationEngine)  │
│  External: @angular/core, @angular/router, @angular/common/http  │
│            rxjs                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Intra-Layer Dependencies

### Kernel Internal

```
kernel.tokens.ts
  └── kernel.types.ts

platform-context.service.ts
  └── @angular/core (signal, inject)

version.service.ts
  ├── kernel.types.ts
  └── kernel.tokens.ts (PLATFORM_CONFIG_TOKEN)

health.service.ts
  ├── kernel.types.ts
  └── @angular/common/http

lifecycle-manager.service.ts
  └── kernel.types.ts

diagnostics.service.ts
  ├── kernel.types.ts
  └── @angular/core

boot-state-machine.service.ts
  └── kernel.types.ts

boot-step.interface.ts
  └── kernel.types.ts

[each boot step]
  ├── boot-step.interface.ts
  ├── kernel.types.ts
  └── (specific services it needs)

boot-pipeline.service.ts
  ├── boot-step.interface.ts
  └── [all 9 boot steps]

boot-manager.service.ts
  ├── kernel.types.ts
  ├── boot-pipeline.service.ts
  └── boot-state-machine.service.ts

platform-kernel.service.ts
  ├── kernel.types.ts
  ├── kernel.tokens.ts
  ├── boot-manager.service.ts
  ├── boot-state-machine.service.ts
  ├── lifecycle-manager.service.ts
  └── diagnostics.service.ts

kernel-facade.service.ts
  ├── platform-kernel.service.ts
  ├── platform-context.service.ts
  ├── version.service.ts
  ├── health.service.ts
  ├── lifecycle-manager.service.ts
  └── diagnostics.service.ts
```

### Registry Internal

```
registry.types.ts
  └── (no internal deps)

base.registry.ts
  └── registry.types.ts

[each concrete registry]
  └── base.registry.ts

registry-manager.service.ts
  └── [all 16 concrete registries]
```

### Plugin Internal

```
plugin.types.ts
  └── (no internal deps)

plugin-manifest.model.ts
  └── [all 16 registry definition types]

plugin-context.ts
  └── plugin-manifest.model.ts

plugin.events.ts
  └── plugin-manifest.model.ts

plugin.validation.ts
  ├── plugin.types.ts
  └── plugin-manifest.model.ts

plugin-resolver.service.ts
  ├── plugin.types.ts
  └── plugin-manifest.model.ts

plugin-lifecycle.service.ts
  └── plugin.types.ts

plugin-registration.service.ts
  ├── plugin-manifest.model.ts
  └── [all 16 registries via inject()]

plugin-loader.service.ts
  ├── plugin.types.ts
  ├── plugin-manifest.model.ts
  ├── plugin-context.ts
  ├── plugin-lifecycle.service.ts
  └── plugin-registration.service.ts

plugin-manager.service.ts
  ├── plugin.types.ts
  ├── plugin-manifest.model.ts
  ├── plugin.validation.ts
  ├── plugin-resolver.service.ts
  ├── plugin-loader.service.ts
  ├── plugin-lifecycle.service.ts
  └── registry-manager.service.ts

plugin-host.service.ts
  ├── plugin-manager.service.ts
  ├── plugin-lifecycle.service.ts
  └── plugin.diagnostics.ts
```

---

## External Dependencies

| Package | Used By | Purpose |
|---------|---------|---------|
| @angular/core | All layers | DI, signals, providers |
| @angular/common/http | Kernel (HealthService), Runtime (QueryEngine) | HTTP requests |
| @angular/router | Runtime (NavigationEngine) | Route navigation |
| rxjs | Plugin (EventBus, loader), Runtime (EventBus, QueryEngine) | Observables, Subject |

---

## Circular Dependency Analysis

No circular dependencies exist. Import order enforced:

```
types → tokens → services → boot → plugin → sdk → runtime
```

Cross-layer imports are strictly downward:
- Kernel imports nothing from Registry/Plugin/SDK/Runtime
- Registry imports nothing from Plugin/SDK/Runtime
- Plugin imports from Kernel + Registry only
- SDK imports from Registry types + Plugin types only
- Runtime imports from Kernel + Registry only
