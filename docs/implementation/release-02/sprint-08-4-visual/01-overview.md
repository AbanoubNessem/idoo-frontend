# Sprint 8.4 — Visual Experience Engine: Overview

## Purpose

The Visual Experience Engine controls how the application looks and feels across five dimensions:
Typography, Density, Icon Pack, Motion, and Accessibility. It reads from layered configurations
(Platform → Tenant → Company → User → Accessibility → Runtime) and applies the resolved
values as CSS custom properties to `document.documentElement`.

## Location

```
src/app/core/platform/experience/visual/
├── visual.types.ts                        — all TypeScript types
├── visual.constants.ts                    — built-in profiles, CSS prefixes, default IDs
├── visual.tokens.ts                       — InjectionTokens + VisualExperienceProvider interface
├── visual-experience-state.ts             — signal store
├── visual-experience-events.service.ts    — RxJS event bus
├── visual-experience-metrics.service.ts   — performance counters
├── visual-experience-diagnostics.service.ts — diagnostic report
├── visual-experience-registry.service.ts  — profile store
├── visual-experience-resolver.service.ts  — resolution pipeline
├── visual-experience-engine.service.ts    — façade + CSS var application
└── index.ts                               — barrel
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| `typographyId`, `densityId`, `iconPackId` owned by `ExperienceState` | Single source of truth; `VisualExperienceState` reads them as `computed()` |
| Visual-only signals (`motionId`, `accessibilityId`, etc.) owned by `VisualExperienceState` | Not general-purpose; only Visual Engine cares about these |
| CSS vars applied via `effect()` in constructor | Reactive; zero polling; destroyed cleanly via `ngOnDestroy` |
| `VISUAL_AUTO_APPLY = false` in tests | Prevents DOM writes during unit tests |
| Resolution order: Platform → Runtime | Last non-null value wins; accessibility and runtime can always override |
| Fallback to default profile on unknown ID | Prevents white-screen when a tenant profile has not been registered yet |

## Integration Points

- **ExperienceEngineService** — `setTypography()`, `setDensity()`, `setIconPack()` delegate to it
- **ThemeEngineService** (Sprint 8.2) — applies color/spacing/radius/elevation tokens separately
- **LocalizationEngine** (Sprint 8.3) — direction (`ltr`/`rtl`) comes from `ExperienceState.direction`
