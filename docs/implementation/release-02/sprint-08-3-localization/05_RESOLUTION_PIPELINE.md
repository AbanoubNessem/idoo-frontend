# Culture Resolution Pipeline

## Resolution Order

```
Platform Default   (app bootstrap config)
    ↓
Tenant             (tenant-specific locale)
    ↓
Company            (company/org override)
    ↓
User               (personal preference, persisted)
    ↓
Browser            (navigator.language auto-detected)
    ↓
Runtime Override   (programmatic, A/B, feature flags)
    ↓
Effective Culture
```

Later layers override earlier ones. Only configured layers are applied.
Skipped layers are recorded with their reason (`not-configured` or `not-registered`).

## Input

```typescript
interface CultureResolutionInput {
  codeByLayer: Partial<Record<CultureLayer, string>>;
  tenantId?:   string;
  companyId?:  string;
  userId?:     string;
}
```

## Result

```typescript
interface CultureResolutionResult {
  effectiveCode:  string | null;
  layerSnapshots: ReadonlyArray<CultureLayerSnapshot>;
  resolvedAt:     string;
}

interface CultureLayerSnapshot {
  layer:   CultureLayer;
  code:    string | null;
  applied: boolean;
  reason?: string;  // 'not-configured' | 'not-registered'
}
```

## Example

```typescript
const resolver = inject(CultureResolverService);

const result = resolver.resolve({
  codeByLayer: {
    platform:  'en-US',     // platform default
    tenant:    'ar-SA',     // tenant wants Arabic
    user:      'de-DE',     // user prefers German
    // browser: auto-detected
    // runtime: not set
  },
});

// result.effectiveCode === 'de-DE'  (user beats browser + tenant)
// Browser layer may further override if user has nothing set
```

## Browser Layer

The browser layer is automatically detected when `CULTURE_BROWSER_DETECTION=true`:

```
navigator.language → 'fr-BE'
  exact match in registry? → apply 'fr-BE'
  no → try language: 'fr' → match 'fr-FR' → apply 'fr-FR'
  no → skip browser layer
```

Disable: `{ provide: CULTURE_BROWSER_DETECTION, useValue: false }`

## Integration with Experience Engine

The resolution pipeline is designed to work with `ExperienceEngineService.setLocale()`.
A typical flow:

1. App bootstrap: `CultureResolver.resolveEffective(input)` → `effectiveCode`
2. Apply: `ExperienceEngine.setLocale(effectiveCode)` → updates `ExperienceState.localeCode()`
3. Engines react: `LocalizationEngine.activeLocale()` and `TranslationEngine.activeLocale()`
   both derive from `ExperienceState.localeCode()`

## Comparison with Theme Resolution

| Aspect | Theme Resolution | Culture Resolution |
|---|---|---|
| Class | `ExperienceResolutionPipeline` | `CultureResolverService` |
| Layers | platform→tenant→company→user→runtime→accessibility | platform→tenant→company→user→browser→runtime |
| Browser layer | ✗ | ✓ (`navigator.language`) |
| Merge semantics | Token deep-merge | Winner-takes-all (last applied wins) |
