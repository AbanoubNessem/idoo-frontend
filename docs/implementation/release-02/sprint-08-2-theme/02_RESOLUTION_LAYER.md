# Experience Resolution Layer

## Problem

An application has multiple stakeholders who each want to control the experience:
- The platform team ships sensible defaults.
- A tenant (client company) can apply their brand theme.
- A company within the tenant can have a sub-brand.
- An individual user can override to their preference.
- Runtime code (A/B tests, feature flags) can override programmatically.
- Accessibility requirements (OS-level high-contrast, forced-colors) must win last.

The resolution layer converts these inputs into a single effective choice.

## Resolution Order

```
Platform Default
    ↓
Tenant Theme
    ↓
Company Theme
    ↓
User Preference
    ↓
Runtime Override
    ↓
Accessibility Override
    ↓
→ Effective Theme
```

In `merge` mode (default) the highest layer that has a value wins.
In `replace` mode only the single top-most configured layer is used.

## ExperienceResolutionPolicy

Controls which layers participate and how they combine:

```typescript
interface ExperienceResolutionPolicy {
  order:                    ReadonlyArray<ThemeLayer>; // customizable
  strategy:                 'merge' | 'replace' | 'merge-deep';
  fallbackToDefault:        boolean;
  allowRuntimeOverride:     boolean;
  allowAccessibilityOverride: boolean;
}
```

Three built-in policies:
- `DEFAULT_RESOLUTION_POLICY` — merge, all overrides allowed
- `REPLACE_RESOLUTION_POLICY` — replace strategy
- `STRICT_RESOLUTION_POLICY`  — runtime/accessibility overrides disabled

Use `ResolutionPolicyBuilder` for custom policies:

```typescript
const policy = new ResolutionPolicyBuilder()
  .order(['platform', 'tenant', 'user'])
  .noRuntimeOverride()
  .build();
```

## ExperienceResolutionContext

Input to the pipeline. Maps each layer to a theme ID:

```typescript
interface ExperienceResolutionContext {
  tenantId?:   string;
  companyId?:  string;
  userId?:     string;
  themeByLayer: Partial<Record<ThemeLayer, string>>;
}
```

Use `ExperienceResolutionContextBuilder` for fluent construction:

```typescript
const ctx = new ExperienceResolutionContextBuilder()
  .forTenant('acme')
  .platformTheme('platform-light')
  .tenantTheme('acme-brand')
  .userTheme('platform-dark')
  .build();
```

## ExperienceResolutionPipeline

Applies the policy to a context and returns `ResolvedExperience`:

```typescript
@Injectable({ providedIn: 'root' })
class ExperienceResolutionPipeline {
  resolve(context, policy?): ResolvedExperience;
}
```

`ResolvedExperience`:
- `effectiveThemeId` — the winning theme ID (null if nothing resolved)
- `layerResults` — per-layer diagnostics with `resolved: boolean` and `reason`
- `resolvedAt` — ISO timestamp

## ExperienceResolverService

Façade that integrates the pipeline with `ExperienceState`:

```typescript
@Injectable({ providedIn: 'root' })
class ExperienceResolverService {
  resolve(context, policy?): ResolvedExperience;
  resolveFromState(policy?): ResolvedExperience;  // Uses current themeId as user layer
  buildContext(): ExperienceResolutionContextBuilder;
}
```
