# Sprint 7 — Layout Resolver

**File:** `src/app/core/platform/layout/layout-resolver.service.ts`

---

## Responsibility

Applies responsive overrides and evaluates conditions to produce a `ResolvedLayout`. Delegates CSS generation to `LayoutRendererService`.

## Resolution Algorithm

1. **Mobile-first cascade:** For each breakpoint from `xs` up to the current breakpoint, merge any responsive override into the definition.
2. **Slot resolution:** Sort slots by `order`, evaluate `hidden` / `hiddenCondition` per slot.
3. **CSS generation:** Delegate to `LayoutRendererService.render()`.
4. **Recursive children:** Resolve each child definition in the same way.

## Responsive Override Merging

```typescript
// Mobile-first: xs overrides apply at xs and above
// md overrides add on top at md and above, etc.
for (let i = 0; i <= currentBpIndex; i++) {
  const override = responsive[BREAKPOINT_ORDER[i]];
  if (override) merged = mergeDefinition(merged, override);
}
```

Only `config` and `slots` are merged from overrides; `id` and `type` are never overridden.

## Condition Evaluation

`hiddenCondition` on a slot is reserved for expression evaluation (e.g. via a future expression engine). Currently always returns `false` (no condition evaluator wired in). The field is stored so definitions can carry conditions without breaking older resolvers.
