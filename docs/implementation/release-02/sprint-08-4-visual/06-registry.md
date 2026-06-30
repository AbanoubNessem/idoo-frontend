# Sprint 8.4 — VisualExperienceRegistryService

File: `src/app/core/platform/experience/visual/visual-experience-registry.service.ts`

## Role

In-memory profile store for all five visual dimensions. Pre-loaded with built-in profiles
at construction; accepts custom profiles via `register*()` methods.

## API

### Typography

```typescript
registerTypography(p: TypographyProfile): void
getTypography(id: string): TypographyProfile | null
allTypography(): ReadonlyArray<TypographyProfile>
hasTypography(id: string): boolean
```

### Density

```typescript
registerDensity(p: DensityProfile): void
getDensity(id: string): DensityProfile | null
allDensity(): ReadonlyArray<DensityProfile>
hasDensity(id: string): boolean
```

### Icon Pack

```typescript
registerIconPack(p: IconPackProfile): void
getIconPack(id: string): IconPackProfile | null
allIconPacks(): ReadonlyArray<IconPackProfile>
hasIconPack(id: string): boolean
```

### Motion

```typescript
registerMotion(p: MotionProfile): void
getMotion(id: string): MotionProfile | null
allMotion(): ReadonlyArray<MotionProfile>
hasMotion(id: string): boolean
```

### Accessibility

```typescript
registerAccessibility(p: AccessibilityProfile): void
getAccessibility(id: string): AccessibilityProfile | null
allAccessibility(): ReadonlyArray<AccessibilityProfile>
hasAccessibility(id: string): boolean
```

### Cross-dimension

```typescript
counts(): Readonly<Record<string, number>>
// Returns: { typography, density, 'icon-pack', motion, accessibility }
```

## Registering at Bootstrap

```typescript
// app.config.ts
{
  provide: APP_INITIALIZER,
  useFactory: (registry: VisualExperienceRegistryService) => () => {
    registry.registerTypography({
      id:             'tenant-brand',
      name:           'Tenant Brand Font',
      fontFamilyBase: "'Poppins', sans-serif",
      // ...
    });
  },
  deps: [VisualExperienceRegistryService],
  multi: true,
}
```
