# Sprint 8.4 — VisualExperienceResolverService

File: `src/app/core/platform/experience/visual/visual-experience-resolver.service.ts`

## Resolution Algorithm

For each dimension, the resolver iterates `VISUAL_RESOLUTION_ORDER`:

```
['platform', 'tenant', 'company', 'user', 'accessibility', 'runtime']
```

The **last non-null value wins**. This means:
- A `runtime` override always wins
- An `accessibility` override beats `user`, `company`, `tenant`, and `platform`
- If no layer provides a value, the built-in default ID is used

If the resolved ID is not in the registry, the resolver falls back to the built-in default profile
(never returns null for a required dimension).

## API

```typescript
resolve(input: VisualResolutionInput): EffectiveVisualExperience
resolveFromState(): EffectiveVisualExperience
```

### `resolve(input)`

```typescript
const effective = resolver.resolve({
  typographyByLayer: {
    platform: 'typography-default',
    tenant:   'typography-arabic',   // tenant overrides platform
    user:     'typography-large',    // user overrides tenant
  },
  densityByLayer: {
    platform:      'density-comfortable',
    accessibility: 'density-spacious', // a11y override
  },
});

effective.typography.id // 'typography-large'   (user wins)
effective.density.id    // 'density-spacious'    (a11y wins)
```

### `resolveFromState()`

Reads current signal values from `VisualExperienceState` and resolves as the `user` layer.
Used internally by `VisualExperienceEngineService` for its reactive `effectiveVisual` computed signal.

## Layer Snapshots

Each `EffectiveVisualExperience.layers.*` is a `ReadonlyArray<VisualLayerSnapshot>` showing
which layer contributed to the resolution and whether it was the winning layer (`applied: true`).
