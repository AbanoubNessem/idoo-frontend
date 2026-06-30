# Sprint 8.1 — Architect Self Review

**Date:** 2026-06-29

---

## SOLID

| Principle | Verdict | Evidence |
|---|---|---|
| S — Single Responsibility | ✅ | Each service has exactly one job: State stores signals, Registry stores profiles, Serializer converts to/from JSON, Builder constructs profiles, Events broadcasts changes, Metrics counts operations |
| O — Open/Closed | ✅ | Future engines extend profile stubs without modifying core. New dimensions require only adding to `ExperienceDimension` union and `DimensionProfileMap` |
| L — Liskov Substitution | ✅ | No class inheritance used; profile stubs compose via interface extension |
| I — Interface Segregation | ✅ | `ExperienceStorageAdapter` exposes only `save/load/clear`. `ExperienceProfileBuilder` exposes only builder methods. Consumers inject only what they need |
| D — Dependency Inversion | ✅ | `ExperienceEngineService` depends on abstractions (all via injection). `EXPERIENCE_STORAGE` token decouples persistence strategy |

## Signal Architecture

- `ExperienceState` uses `signal()` for all mutable state.
- `ExperienceState.direction` is a `computed()` — never set directly.
- `ExperienceContext.snapshot` is a `computed()` over `ExperienceState.snapshot`.
- No `effect()` in the infrastructure layer — effects belong in components.

## No Circular Dependencies

Verified by inspection:
- `ExperienceEngineService` → `ExperienceDiagnosticsService` → `ExperienceState`
- `ExperienceEngineService` → `ExperienceState`
- `ExperienceState` does NOT import `ExperienceDiagnosticsService` ✅

## RTL Design

Direction is a `computed()` from language code — never a manually settable field. This prevents state inconsistency (e.g. setting language to 'ar' but direction to 'ltr'). The only way to change direction is to change the language.

## Profile Stub Design

Stubs are intentionally minimal — only the fields the infrastructure itself needs. This follows the "you aren't gonna need it" principle. The Theme Engine will add color tokens when it is implemented. The core registry stores and retrieves them without knowing their structure.

## Concerns

1. **`inject()` in `builder` getter**: `ExperienceEngineService.builder` uses `inject(ExperienceBuilderService)` inside a getter, which requires an injection context. This should be called from component constructors or factories, not from outside the DI context. Could be made more explicit.

2. **`new Date().toISOString()` in computed**: `ExperienceContext.snapshot` includes `resolvedAt: new Date().toISOString()` inside a `computed()`. This is correct (computed is memoized until signals change) but may surprise readers expecting computed signals to be pure.

## Verdict

**APPROVED for Architecture Review.** All constraints satisfied. No feature implementations slipped in. Infrastructure is clean, extensible, and ready for Theme, Translation, Localization, Branding, Typography, Density, and Icon Registry engines.
