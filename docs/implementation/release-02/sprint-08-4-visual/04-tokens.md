# Sprint 8.4 — Injection Tokens & Provider Interface

File: `src/app/core/platform/experience/visual/visual.tokens.ts`

## VisualExperienceProvider Interface

Implement to supply custom profiles from external sources (API, CDN, tenant configs):

```typescript
export interface VisualExperienceProvider {
  id:   string;
  name: string;

  canLoad(
    type: 'typography' | 'density' | 'icon-pack' | 'motion' | 'accessibility',
    id:   string
  ): boolean;

  loadTypography?(id: string):    Promise<TypographyProfile | null>;
  loadDensity?(id: string):       Promise<DensityProfile | null>;
  loadIconPack?(id: string):      Promise<IconPackProfile | null>;
  loadMotion?(id: string):        Promise<MotionProfile | null>;
  loadAccessibility?(id: string): Promise<AccessibilityProfile | null>;
}
```

## InjectionTokens

| Token | Default | Purpose |
|---|---|---|
| `VISUAL_AUTO_APPLY` | `true` | Apply CSS vars to DOM via `effect()` |
| `VISUAL_DIAGNOSTICS_ENABLED` | `false` | Enable verbose diagnostics |
| `VISUAL_PROVIDERS` | — | Multi-provider array |
| `VISUAL_INITIAL_TYPOGRAPHY_ID` | — | Override at bootstrap |
| `VISUAL_INITIAL_DENSITY_ID` | — | Override at bootstrap |
| `VISUAL_INITIAL_ICON_PACK_ID` | — | Override at bootstrap |
| `VISUAL_INITIAL_MOTION_ID` | — | Override at bootstrap |
| `VISUAL_INITIAL_ACCESSIBILITY_ID` | — | Override at bootstrap |

## Usage Example

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: VISUAL_AUTO_APPLY,        useValue: true },
    { provide: VISUAL_INITIAL_DENSITY_ID, useValue: 'density-compact' },
    {
      provide:  VISUAL_PROVIDERS,
      useValue: [new TenantVisualProvider()],
      multi:    true,
    },
  ],
};
```
