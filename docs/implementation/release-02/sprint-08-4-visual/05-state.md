# Sprint 8.4 — VisualExperienceState

File: `src/app/core/platform/experience/visual/visual-experience-state.ts`

## Role

Single signal store for the Visual Engine. Splits responsibilities cleanly:

- **Projected from `ExperienceState`** — `typographyId`, `densityId`, `iconPackId` are `computed()`
  signals that read from the global experience state. No duplication.
- **Owned here** — `motionId`, `accessibilityId`, `reducedMotion`, `largeTypography`, `focusVisible`
  are writable signals that `ExperienceState` does not track.

## Signal Map

| Signal | Type | Source |
|---|---|---|
| `typographyId` | `Signal<string\|null>` | `computed(() => ExperienceState.typographyId())` |
| `densityId` | `Signal<string>` | `computed(() => ExperienceState.densityId())` |
| `iconPackId` | `Signal<string>` | `computed(() => ExperienceState.iconPackId())` |
| `motionId` | `Signal<string>` | own `signal()` — default `'motion-normal'` |
| `accessibilityId` | `Signal<string>` | own `signal()` — default `'accessibility-default'` |
| `reducedMotion` | `Signal<boolean>` | own `signal()` — default `false` |
| `largeTypography` | `Signal<boolean>` | own `signal()` — default `false` |
| `focusVisible` | `Signal<boolean>` | own `signal()` — default `false` |

## Setters

```typescript
setMotion(id: string):              void
setAccessibility(id: string):       void
setReducedMotion(value: boolean):   void
setLargeTypography(value: boolean): void
setFocusVisible(value: boolean):    void
reset(): void  // resets own signals only
```

> Note: `typographyId`, `densityId`, `iconPackId` are read-only projections.
> To change them write to `ExperienceEngineService.setTypography()` etc.
