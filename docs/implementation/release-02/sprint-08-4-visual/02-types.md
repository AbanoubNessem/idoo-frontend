# Sprint 8.4 — Visual Types Reference

File: `src/app/core/platform/experience/visual/visual.types.ts`

## Resolution

```typescript
type VisualLayer = 'platform' | 'tenant' | 'company' | 'user' | 'accessibility' | 'runtime';

interface VisualLayerSnapshot {
  layer:   VisualLayer;
  id:      string | null;
  applied: boolean;
  reason?: string;
}

interface VisualResolutionInput {
  typographyByLayer?:    Partial<Record<VisualLayer, string>>;
  densityByLayer?:       Partial<Record<VisualLayer, string>>;
  iconPackByLayer?:      Partial<Record<VisualLayer, string>>;
  motionByLayer?:        Partial<Record<VisualLayer, string>>;
  accessibilityByLayer?: Partial<Record<VisualLayer, string>>;
}
```

## Profiles

```typescript
interface TypographyProfile {
  id, name, fontFamilyBase, fontFamilyArabic?, fontFamilyMono?,
  scale: TypographyScale,     // xs/sm/base/lg/xl/2xl/3xl/4xl
  weights: TypographyWeights, // light/normal/medium/semibold/bold
  lineHeights: TypographyLineHeights,
  letterSpacing?: TypographyLetterSpacing
}

interface DensityProfile {
  id, name, level: 'compact' | 'comfortable' | 'spacious',
  heightSm/Md/Lg, paddingXs/Sm/Md/Lg, gapSm/Md/Lg
}

interface IconPackProfile {
  id, name, type: IconPackType,
  prefix?, cdnUrl?, spriteUrl?, icons?
}

interface MotionProfile {
  id, name, reducedMotion: boolean, durationScale: number,
  durationFast/Normal/Slow, easingStandard/Decelerate/Accelerate
}

interface AccessibilityProfile {
  id, name,
  highContrast, reducedMotion, largeTypography, focusVisible: boolean
}
```

## Effective Visual Experience

```typescript
interface EffectiveVisualExperience {
  typography, density, iconPack, motion, accessibility,
  layers: { typography, density, iconPack, motion, accessibility: VisualLayerSnapshot[] },
  resolvedAt: string
}
```

## Events

```typescript
type VisualEvent =
  | { type: 'typography:changed',    id: string|null, prev: string|null }
  | { type: 'density:changed',       id: string, prev: string }
  | { type: 'icon-pack:changed',     id: string, prev: string }
  | { type: 'motion:changed',        id: string, prev: string }
  | { type: 'accessibility:changed', profile: AccessibilityProfile, prev: AccessibilityProfile }
```
