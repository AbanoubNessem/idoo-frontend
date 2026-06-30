# Sprint 8.4 — Testing Guide

## Test Files

| File | What it tests |
|---|---|
| `visual-experience-state.spec.ts` | Signal projections, visual-only signals, setters, reset |
| `visual-experience-registry.spec.ts` | Built-in counts, retrieval, custom registration, counts() |
| `visual-experience-resolver.spec.ts` | Layer ordering, default fallback, resolveFromState |
| `visual-experience-events.spec.ts` | emit, on() filtering, multi-subscriber, post-destroy |
| `visual-experience-metrics.spec.ts` | applyCount, changeByDimension, errorCount, reset |
| `visual-experience-diagnostics.spec.ts` | report shape, defaults, ISO dates |
| `visual-experience-engine.spec.ts` | All dimension setters, cascading effects, events, reset |
| `typography.spec.ts` | Built-in typography profile invariants |
| `density.spec.ts` | Built-in density profile invariants, ordering |

## Test Configuration

Always provide `VISUAL_AUTO_APPLY = false` to prevent DOM writes:

```typescript
TestBed.configureTestingModule({
  providers: [
    { provide: EXPERIENCE_INITIAL_STATE, useValue: {} },
    { provide: VISUAL_AUTO_APPLY,        useValue: false },
  ],
});
```

## Common Assertions

```typescript
// Reactive signal reads inside TestBed
const eff = TestBed.runInInjectionContext(() => engine.effectiveVisual());

// After setTypography:
engine.setTypography('typography-arabic');
expect(engine.effectiveVisual().typography.id).toBe('typography-arabic');

// After setAccessibility('accessibility-full'):
expect(state.reducedMotion()).toBe(true);
expect(state.largeTypography()).toBe(true);
expect(state.focusVisible()).toBe(true);

// Resolver falls back to default on unknown id:
const result = resolver.resolve({
  typographyByLayer: { runtime: 'non-existent' },
});
expect(result.typography.id).toBe(DEFAULT_TYPOGRAPHY_ID);
```

## Coverage Targets

- Statements: > 90%
- Branches: > 85%
- Functions: > 90%
- Lines: > 90%

Run with: `npx ng test --code-coverage --include='**/visual/**'`
