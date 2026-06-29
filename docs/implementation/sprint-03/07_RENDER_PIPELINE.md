# Sprint 3 — Render Pipeline

**Service:** `RenderPipelineService`

---

## Pipeline Overview

The render pipeline transforms a `FieldRenderRequest` into a `RenderResult` through 7 sequential stages.

```
FieldRenderRequest
        │
        ▼
┌──────────────────┐
│   1. NORMALIZE   │  Normalize field type, defaults
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   2. RESOLVE     │  Resolve renderer via RendererResolverService
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  3. PERMISSIONS  │  Check required permissions against context
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  4. EXPRESSIONS  │  Evaluate hiddenExpression / disabledExpression
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  5. VALIDATORS   │  Resolve validator keys to ResolvedValidator objects
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   6. CONTEXT     │  Build RenderContext value object
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   7. RENDER      │  Call renderer.render(request, context)
└────────┬─────────┘
         │
         ▼
    RenderResult
```

---

## Stage Details

### Stage 1: Normalize
- Validates that `fieldType` is a non-empty string
- Currently a passthrough (extensible for future normalization)

### Stage 2: Resolve
- Calls `RendererResolverService.resolveField(fieldType)`
- Falls back to `text` renderer for unknown types
- Returns `RENDERER_NOT_FOUND` error if no fallback available

### Stage 3: Permissions
- Checks `request.permissions` array against `contextData.permissions` Set
- All required permissions must be present
- Returns `PERMISSION_DENIED` error with field key if check fails
- Skipped if `request.permissions` is empty

### Stage 4: Expressions
- Evaluates `hiddenExpression` and `disabledExpression` using `new Function()` sandboxed evaluation
- Evaluated result overrides static `hidden` / `disabled` fields
- Handled in `AbstractFieldRenderer.buildInputs()` during render stage

### Stage 5: Validators
- Resolves validator keys to `ResolvedValidator` objects via `RenderContext.resolveValidator()`
- In Sprint 3: `ValidatorResolver` always returns `null` (wired in Sprint 5 with Validation Engine)

### Stage 6: Context
- Constructs `RenderContext` value object with:
  - `contextData` (userId, tenantId, permissions, locale, adapter, mode, model)
  - `getComponent` closure via active `UIAdapter`
  - `evaluateExpression` closure using `new Function()`
  - `resolveValidator` closure (null in Sprint 3)

### Stage 7: Render
- Calls `renderer.render(request, context)` → `RenderOutput`
- Gets component `Type<unknown>` from adapter (overrides renderer's returned component)
- Builds final `RenderResult`

---

## Cache Integration

Before Stage 1, the pipeline checks the cache:
```
cacheKey = `${fieldType}:${adapter}:${mode}`
if (cache.get(cacheKey)) → return cached result immediately
```

After Stage 7, successful results are stored:
```
cache.set(cacheKey, result)
```

---

## Error Handling

Any stage can short-circuit by returning a `RenderError`. The pipeline returns a failed `RenderResult` immediately without executing subsequent stages.

```typescript
interface RenderResult {
  success: false;
  component: null;
  inputs: {};
  errors: RenderError[];
  durationMs: number;
  fromCache: false;
  adapter: AdapterType;
}
```

---

## Observability

| Event | Emitted When |
|-------|-------------|
| `render:started` | Pipeline begins |
| `render:cache:hit` | Cache hit before stage 1 |
| `render:cache:miss` | Cache miss before stage 1 |
| `render:completed` | Stage 7 succeeds |
| `render:error` | Any stage fails |

Metrics are recorded via `RenderMetricsService` at pipeline exit (success or failure).
