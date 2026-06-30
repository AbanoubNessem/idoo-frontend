# Sprint 8.2 — Experience Resolution Layer & Theme Engine

## Purpose

Sprint 8.2 delivers two foundational capabilities:

1. **Experience Resolution Layer** — a policy-driven pipeline that determines the effective experience
   configuration from multiple layered sources (platform → tenant → company → user → runtime →
   accessibility override).

2. **Theme Engine** — the first concrete engine built on the Experience Core infrastructure.
   Implements design-token-based theming with signal-driven runtime switching, CSS variable
   application, and plugin provider support.

## Scope

| In Scope | Out of Scope |
|---|---|
| Experience Resolution Policy/Context/Pipeline | Localization / Translations |
| ExperienceResolverService | Branding Engine |
| ThemeDefinition types & design tokens | Typography Engine |
| ThemeEngine, ThemeRegistry, ThemeLoader | Density Engine |
| ThemeCache, ThemeValidator, ThemeSerializer | Icon Registry |
| 3 built-in themes (light, dark, high-contrast) | HTTP theme loading (provider interface only) |
| >90% test coverage, 10 docs | UI components |

## Design Principles

- **Design tokens only** — no hardcoded color/spacing values anywhere in engine code.
  All values live in `ThemeDefinition.tokens.*`.
- **Signals-first** — `effectiveTheme` is a `computed()` signal. No subscriptions needed.
- **Resolution is configurable** — the policy determines which layers participate and in what order.
- **CSS-first application** — tokens are applied as CSS custom properties to
  `document.documentElement`. All components read `var(--platform-color-*)` etc.
- **Plugin-ready** — `ThemeProvider` interface allows external marketplace themes.

## File Locations

```
src/app/core/platform/experience/
├── resolution/
│   ├── experience-resolution-policy.ts      — policy types + builder
│   ├── experience-resolution-context.ts     — per-request inputs + builder
│   ├── experience-resolution-pipeline.service.ts — pipeline logic
│   └── experience-resolver.service.ts       — façade + state integration
└── theme/
    ├── theme.types.ts          — all types: Theme, EffectiveTheme, events
    ├── theme.constants.ts      — built-in themes, CSS prefixes, token lists
    ├── theme.tokens.ts         — InjectionTokens + ThemeProvider interface
    ├── theme-cache.service.ts  — TTL-based in-memory cache
    ├── theme-validator.service.ts — token completeness + CSS value checks
    ├── theme-serializer.service.ts — JSON serialization with envelope
    ├── theme-loader.service.ts — async loading via providers
    ├── theme-registry.service.ts — thin wrapper over ExperienceRegistry
    ├── theme-engine.service.ts — central façade, applies CSS variables
    └── index.ts                — barrel export
```
