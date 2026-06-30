# Test Coverage — Sprint 8.2

## Test Files

| File | Cases | Coverage Focus |
|---|---|---|
| `resolution/experience-resolution-policy.spec.ts` | 13 | Policy shape, builder chaining, built-in policies |
| `resolution/experience-resolution-context.spec.ts` | 11 | Builder API, immutability, all layer setters |
| `resolution/experience-resolution-pipeline.spec.ts` | 12 | Merge logic, layer skipping, policy enforcement |
| `theme/theme-validator.spec.ts` | 11 | Required tokens, CSS values, error reporting |
| `theme/theme-serializer.spec.ts` | 10 | Round-trip, envelope, bare objects, flat tokens |
| `theme/theme-cache.spec.ts` | 11 | TTL expiry, hit counts, invalidation, stats |
| `theme/theme-registry.spec.ts` | 12 | Built-in themes, registration, queries by kind/tag |
| `theme/theme-loader.spec.ts` | 12 | Provider resolution, cache, loadMany, timeout |
| `theme/theme-engine.spec.ts` | 22 | Signals, switching, CSS vars, events, serialization |

**Total: ~104 test cases**

## Key Test Patterns

### Signal Reactivity

```typescript
engine.setDarkTheme();
expect(engine.isDark()).toBeTrue();
expect(engine.effectiveTheme().variant).toBe('dark');
```

### TTL Expiry (fakeAsync)

```typescript
fakeAsync(() => {
  svc.set(PLATFORM_LIGHT_THEME);
  tick(300);               // advance past TTL=200ms
  expect(svc.get('platform-light')).toBeNull();
})
```

### Policy Enforcement

```typescript
const result = pipeline.resolve(ctx, STRICT_RESOLUTION_POLICY);
const runtimeLayer = result.layerResults.find(r => r.layer === 'runtime');
expect(runtimeLayer?.resolved).toBeFalse();
expect(runtimeLayer?.reason).toBe('runtime-override-disabled');
```

### CSS Variable Application

```typescript
engine.applyThemeNow('platform-dark');
expect(doc.documentElement.getAttribute('data-theme')).toBe('dark');
```

### Provider Integration

```typescript
const provider = makeProvider('p1', [PLATFORM_LIGHT_THEME]);
svc.registerProvider(provider);
const loaded = await svc.load('platform-light');
expect(loaded.id).toBe('platform-light');
```

## Test Environment

- `THEME_AUTO_APPLY: false` in all ThemeEngine tests (no DOM side-effects during unit tests)
- `THEME_CACHE_TTL_MS: 200` in cache tests (short TTL for `fakeAsync` tests)
- `THEME_PROVIDERS: []` cleared in loader tests unless explicitly provided

## What Is NOT Tested (by design)

- HTTP network calls (providers are interfaces; actual HTTP tested in integration/E2E)
- `effect()` auto-apply loop (integration test territory — DOM would need full Angular test harness)
- CSS variable values being read by child components (CSS cascade; browser-level concern)
