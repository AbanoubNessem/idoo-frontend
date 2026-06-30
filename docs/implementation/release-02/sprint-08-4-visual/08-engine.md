# Sprint 8.4 — VisualExperienceEngineService

File: `src/app/core/platform/experience/visual/visual-experience-engine.service.ts`

## Role

Main façade for the Visual Engine. Orchestrates all five visual dimensions, applies CSS custom
properties to `document.documentElement` via a reactive `effect()`, and emits change events.

## Signals

```typescript
effectiveVisual: Signal<EffectiveVisualExperience>  // recomputed on any id change
typography:      Signal<TypographyProfile>
density:         Signal<DensityProfile>
iconPack:        Signal<IconPackProfile>
motion:          Signal<MotionProfile>
accessibility:   Signal<AccessibilityProfile>
reducedMotion:   Signal<boolean>
largeTypography: Signal<boolean>
focusVisible:    Signal<boolean>
```

## Dimension Setters

```typescript
setTypography(id: string): void      // delegates to ExperienceEngineService
setDensity(id: string): void         // delegates to ExperienceEngineService
setIconPack(id: string): void        // delegates to ExperienceEngineService
setMotion(id: string): void          // writes to VisualExperienceState + syncs reducedMotion
setAccessibility(id: string): void   // applies all profile flags + largeTypography → typography
setReducedMotion(value: boolean): void    // switches motion profile + updates flag
setLargeTypography(value: boolean): void  // switches to/from typography-large
setFocusVisible(value: boolean): void     // updates DOM data-focus-visible attr
```

## CSS Variable Mapping

### Typography (`--platform-font-*`)
```
--platform-font-family-base    → fontFamilyBase
--platform-font-family-arabic  → fontFamilyArabic (if present)
--platform-font-family-mono    → fontFamilyMono (if present)
--platform-font-size-{xs..4xl} → scale tokens
--platform-font-weight-{light..bold}
--platform-font-leading-{tight,normal,relaxed}
```

### Density (`--platform-density-*`)
```
--platform-density-height-{sm,md,lg}
--platform-density-padding-{xs,sm,md,lg}
--platform-density-gap-{sm,md,lg}
```

### Motion (`--platform-motion-*`)
```
--platform-motion-duration-{fast,normal,slow}
--platform-motion-easing-{standard,decelerate,accelerate}
```

### Accessibility (`--platform-a11y-*`)
```
--platform-a11y-high-contrast    → 'true'|'false'
--platform-a11y-reduced-motion   → 'true'|'false'
--platform-a11y-large-typography → 'true'|'false'
--platform-a11y-focus-visible    → 'true'|'false'
```

### Icon Pack (`--platform-icon-*`)
```
--platform-icon-pack       → icon pack id
--platform-icon-prefix     → CSS class prefix
--platform-icon-cdn-url    → URL string (if present)
```

## HTML Attributes

The engine stamps these attributes on `<html>` for CSS selector targeting:

```html
<html
  data-typography="typography-default"
  data-density="comfortable"
  data-reduced-motion="false"
  data-high-contrast="false"
  data-focus-visible="false"
  data-icon-pack="material-symbols"
>
```

## DOM Auto-Apply Toggle

```typescript
// Disable DOM writes (tests, SSR):
{ provide: VISUAL_AUTO_APPLY, useValue: false }
```

## SSR Safety

All DOM writes are guarded by `isPlatformBrowser(PLATFORM_ID)`. The engine is safe to construct
in server-side rendering contexts.
