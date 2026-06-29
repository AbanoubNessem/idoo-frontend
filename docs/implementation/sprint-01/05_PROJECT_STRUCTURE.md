# Sprint 1 — Project Structure

**Sprint:** Sprint 1 — Platform Core Foundation  
**Date:** 2026-06-28  

---

## Directory Tree

```
src/app/core/
├── kernel/
│   ├── index.ts                               # Barrel export
│   ├── kernel.types.ts                        # All kernel TypeScript types
│   ├── kernel.tokens.ts                       # InjectionToken declarations
│   ├── platform-kernel.service.ts             # Main kernel orchestrator
│   ├── kernel-facade.service.ts               # Public kernel facade
│   ├── provide-platform.ts                    # providePlatform() factory
│   ├── boot/
│   │   ├── boot-step.interface.ts             # IBootStep + buildStepResult
│   │   ├── boot-state-machine.service.ts      # 7-state machine
│   │   ├── boot-pipeline.service.ts           # Ordered step executor
│   │   ├── boot-manager.service.ts            # Boot + timeout control
│   │   └── steps/
│   │       ├── 01-configuration.step.ts
│   │       ├── 02-startup-validation.step.ts
│   │       ├── 03-registry-init.step.ts
│   │       ├── 04-plugin-discovery.step.ts
│   │       ├── 05-dependency-graph.step.ts
│   │       ├── 06-plugin-registration.step.ts
│   │       ├── 07-security-init.step.ts
│   │       ├── 08-route-build.step.ts
│   │       └── 09-ready.step.ts
│   ├── context/
│   │   └── platform-context.service.ts        # Auth, tenant, permissions
│   └── services/
│       ├── version.service.ts                 # SemVer parsing + range check
│       ├── health.service.ts                  # Health checks
│       ├── lifecycle-manager.service.ts       # Hook registration + emit
│       ├── diagnostics.service.ts             # Report builder
│       └── configuration.service.ts           # Config accessor
│
├── registry/
│   ├── index.ts
│   ├── registry.types.ts                      # All registry types
│   ├── base.registry.ts                       # Abstract BaseRegistry<TDef>
│   ├── registry-manager.service.ts            # Aggregates 16 registries
│   └── registries/
│       ├── entity.registry.ts
│       ├── form.registry.ts
│       ├── table.registry.ts
│       ├── route.registry.ts
│       ├── menu.registry.ts
│       ├── action.registry.ts
│       ├── permission.registry.ts
│       ├── widget.registry.ts
│       ├── workflow.registry.ts
│       ├── dashboard.registry.ts
│       ├── lookup.registry.ts
│       ├── validation.registry.ts
│       ├── report.registry.ts
│       ├── layout.registry.ts
│       ├── theme.registry.ts
│       └── localization.registry.ts
│
├── plugin/
│   ├── index.ts
│   ├── plugin.types.ts                        # Plugin type system
│   ├── plugin-manifest.model.ts               # PluginManifest + PLUGIN_MANIFEST_TOKEN
│   ├── plugin-context.ts                      # PluginContext interface tree
│   ├── plugin.events.ts                       # Plugin event types
│   ├── plugin.validation.ts                   # Manifest validator
│   ├── plugin.diagnostics.ts                  # Diagnostics report builder
│   ├── plugin-resolver.service.ts             # Kahn's topological sort
│   ├── plugin-registration.service.ts         # Registry contribution dispatcher
│   ├── plugin-lifecycle.service.ts            # 12-state lifecycle machine
│   ├── plugin-loader.service.ts               # Load + init + build context
│   ├── plugin-manager.service.ts              # Orchestrator
│   ├── plugin-host.service.ts                 # Public facade + guard
│   └── provide-plugin.ts                      # providePlugin() factory
│
├── sdk/
│   ├── index.ts
│   ├── contracts/
│   │   └── index.ts                           # Re-exports all contracts
│   ├── define/
│   │   └── define-functions.ts                # 14 define*() functions
│   ├── builders/
│   │   ├── index.ts
│   │   ├── entity.builder.ts
│   │   └── form.builder.ts
│   ├── validators/
│   │   ├── sdk-validation-error.ts
│   │   └── metadata-validators.ts
│   └── helpers/
│       ├── permissions.helper.ts
│       └── metadata.helpers.ts
│
└── runtime/
    ├── index.ts
    ├── runtime.types.ts                       # All runtime types
    ├── runtime-core.service.ts               # Aggregates all engines
    ├── runtime-context.service.ts            # Combined context facade
    ├── events/
    │   └── event-bus.service.ts
    ├── engines/
    │   ├── state-engine.service.ts
    │   ├── cache-engine.service.ts
    │   ├── query-engine.service.ts
    │   ├── navigation-engine.service.ts
    │   ├── expression-engine.service.ts
    │   ├── validation-engine.service.ts
    │   ├── rule-engine.service.ts
    │   └── formula-engine.service.ts
    └── providers/
        └── data-provider.ts
```

---

## Test File Locations

Test files co-located with implementation:

```
src/app/core/
├── kernel/
│   ├── services/
│   │   ├── version.service.spec.ts
│   │   └── lifecycle-manager.service.spec.ts
│   ├── boot/
│   │   └── boot-state-machine.service.spec.ts
│   └── context/
│       └── platform-context.service.spec.ts
├── registry/
│   ├── base.registry.spec.ts
│   └── registry-manager.service.spec.ts
├── plugin/
│   ├── plugin.validation.spec.ts
│   ├── plugin-resolver.service.spec.ts
│   └── plugin-lifecycle.service.spec.ts
├── sdk/
│   ├── define/
│   │   └── define-functions.spec.ts
│   ├── validators/
│   │   └── metadata-validators.spec.ts
│   └── helpers/
│       ├── permissions.helper.spec.ts
│       └── metadata.helpers.spec.ts
└── runtime/
    ├── events/
    │   └── event-bus.service.spec.ts
    ├── engines/
    │   ├── state-engine.service.spec.ts
    │   ├── cache-engine.service.spec.ts
    │   ├── rule-engine.service.spec.ts
    │   ├── formula-engine.service.spec.ts
    │   └── expression-engine.service.spec.ts
```

---

## Documentation

```
docs/
├── platform/
│   ├── sdk/
│   │   └── PLATFORM_SDK_SPECIFICATION.md      # Phase 2.5 specification
│   └── framework/
│       └── [Phase 2.2-2.4 architecture specs]
└── implementation/
    └── sprint-01/
        ├── 01_IMPLEMENTATION_REPORT.md
        ├── 02_ARCHITECTURE_CONFORMANCE.md
        ├── 03_DECISIONS_LOG.md
        ├── 04_PUBLIC_API.md
        ├── 05_PROJECT_STRUCTURE.md            # (this file)
        ├── 06_DEPENDENCY_GRAPH.md
        └── 07_RISK_REPORT.md
```

---

## File Count Summary

| Layer | Source Files | Test Files |
|-------|-------------|------------|
| Kernel | 18 | 4 |
| Registry | 19 | 2 |
| Plugin | 13 | 3 |
| SDK | 9 | 4 |
| Runtime | 13 | 6 |
| **Total** | **72** | **19** |
