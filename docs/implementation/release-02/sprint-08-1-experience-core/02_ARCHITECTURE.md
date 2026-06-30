# Sprint 8.1 — Architecture

## Design Principles

1. **Signal-first:** All reactive state is `signal()` / `computed()`. No `BehaviorSubject` or `Subject` for UI state.
2. **Global singleton pattern:** Unlike `LayoutState` (per-instance), experience state is inherently global. All services are `providedIn: 'root'`.
3. **Profile stubs:** Each dimension type (`ThemeProfileStub`, `LanguageProfileStub`, etc.) defines only the fields the infrastructure needs. Future engines extend these with domain-specific fields.
4. **Direction auto-derivation:** `ExperienceState.direction` is a `computed()` derived from `languageCode` using `RTL_LANGUAGE_CODES`. No separate "setDirection" setter — direction is always a function of the current language.
5. **Storage abstraction:** Persistence is handled via the `EXPERIENCE_STORAGE` injection token. The core provides no concrete implementation — the host app wires `localStorage`, `sessionStorage`, or a server-synced adapter.
6. **Optional Layout Engine integration:** `ExperienceEngineService` optionally injects `LayoutEngineService` (`{ optional: true }`) to sync document direction. No hard dependency.

## Layer Structure

```
Tokens (InjectionToken declarations)
    ↓
Types (interface definitions, no Angular deps)
Constants (RTL codes, defaults, schema version)
    ↓
ExperienceEventsService     — event bus
ExperienceMetricsService    — counters (opt-in)
ExperienceState             — signal store
    ↓
ExperienceLifecycleService  → Events
ExperienceContext            → State (computed view)
ExperienceRegistryService   — dimension stores
    ↓
ExperienceSerializerService → Registry
ExperienceBuilderService    — fluent builder (no deps)
ExperienceDiagnosticsService → Metrics + Registry + State
    ↓
ExperienceEngineService     — facade (all the above + optional LayoutEngine)
```

## Global vs Per-Instance

| Concern | Pattern |
|---|---|
| Layout state (active tab, splitter ratio) | Per-instance `LayoutState` plain class |
| Experience state (theme, language, density) | Global `ExperienceState` `providedIn: 'root'` service |

Experience is global because a user's theme and language apply to the entire application, not to individual components.

## Profile Design

Profiles are plain objects (no Angular dependencies) fully typed with `as const` discriminator fields (`kind`). The `DimensionProfileMap` type enforces that `register<'theme'>()` only accepts `ThemeProfileStub` objects, preventing dimension/profile mismatches at compile time.
