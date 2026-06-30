# Sprint 8.1 — Dependency Graph

No circular dependencies. All arrows point downward.

```
ExperienceEngineService (facade)
├── ExperienceState
│   └── EXPERIENCE_INITIAL_STATE (token)
├── ExperienceContext
│   └── ExperienceState
├── ExperienceEventsService         (no service deps)
├── ExperienceMetricsService
│   └── EXPERIENCE_DIAGNOSTICS_ENABLED (token)
├── ExperienceLifecycleService
│   └── ExperienceEventsService
├── ExperienceRegistryService       (no service deps)
├── ExperienceSerializerService
│   └── ExperienceRegistryService
├── ExperienceBuilderService        (no service deps)
├── ExperienceDiagnosticsService
│   ├── ExperienceMetricsService
│   ├── ExperienceRegistryService
│   └── ExperienceState
├── EXPERIENCE_DEFAULT_PROFILE (token)
├── EXPERIENCE_STORAGE (token, optional)
└── LayoutEngineService (optional — direction sync only)
```

## Cross-Module Dependencies

| From | To | Reason |
|---|---|---|
| `ExperienceEngineService` | `LayoutEngineService` | Sync `dir` attribute on language change |

This is the only cross-module dependency. It is optional (`inject(..., { optional: true })`), so Experience Core can run without the Layout Engine (e.g. in tests).

## Future Engine Extension Pattern

Future engines (Theme Engine, Translation Engine, etc.) will:
1. Extend the corresponding profile stub (e.g. `ThemeProfileStub` → `ThemeProfile` with color tokens)
2. Inject `ExperienceEngineService` to register profiles and subscribe to `theme:changed` events
3. Inject `ExperienceContext` to reactively read current selections via signals

They do NOT modify any Experience Core files.
