# Sprint 6 — Testing Guide

## Test Coverage

| Test File | Subject | Tests |
|-----------|---------|-------|
| `dynamic-form-registry.service.spec.ts` | Registry: register, resolve, query, lazy | 13 |
| `dynamic-form-state.spec.ts` | State: field init, mutations, computed, snapshot | 22 |
| `dynamic-form-history.spec.ts` | History: push, undo, redo, maxSize, clear | 14 |
| `dynamic-form-events.service.spec.ts` | Events: emit, listen, filter, unsubscribe | 14 |
| `dynamic-form-diagnostics.service.spec.ts` | Diagnostics: enable/disable, record, report | 13 |
| `dynamic-form-metrics.service.spec.ts` | Metrics: init, record, reset, snapshot | 13 |
| `dynamic-form-serializer.service.spec.ts` | Serializer: serialize, deserialize, patch, JSON | 11 |
| `dynamic-form-snapshot.service.spec.ts` | Snapshot: capture, restore, draft, clear | 12 |
| `dynamic-form-lifecycle.service.spec.ts` | Lifecycle: phases, active instances, filter | 12 |
| `dynamic-form-context.spec.ts` | Context: init, permissions, model, eval context | 15 |
| `dynamic-form-engine.service.spec.ts` | Engine: create, destroy, registry, summary | 15 |
| `dynamic-form-component.spec.ts` | Component: render, load, submit, outputs | 13 |

**Total: ~157 tests**

## Running Tests

```bash
# All Sprint 6 tests
ng test --include="src/app/core/platform/forms/tests/**/*.spec.ts"

# Specific test file
ng test --include="**/dynamic-form-state.spec.ts"
```

## Testing Patterns

### Testing `DynamicFormState` (plain class)

```typescript
let state: DynamicFormState;
beforeEach(() => { state = new DynamicFormState(); });

it('should set value and mark dirty', () => {
  state.initField('name', { value: 'old' });
  state.setValue('name', 'new');
  expect(state.getField('name').value).toBe('new');
  expect(state.getField('name').dirty).toBeTrue();
});
```

### Testing `@Injectable` services

```typescript
let service: DynamicFormEventsService;
beforeEach(() => {
  TestBed.configureTestingModule({});
  service = TestBed.inject(DynamicFormEventsService);
});
```

### Testing DynamicFormEngine (async)

```typescript
it('should create instance', async () => {
  const instance = await engine.createForm(definition, {});
  expect(instance).toBeTruthy();
  // always destroy in afterEach to prevent leaks
  engine.destroyAll();
});
```

### Testing DynamicFormComponent

```typescript
await TestBed.configureTestingModule({
  imports: [DynamicFormComponent, NoopAnimationsModule],
}).compileComponents();

fixture.componentRef.setInput('definition', myDef);
fixture.detectChanges();
await fixture.whenStable(); // wait for async initialization
fixture.detectChanges();
```

## Mock Engine Implementations

To test without resolving real components:

```typescript
// Provide a stub resolver
providers: [{
  provide: DynamicFormResolverService,
  useValue: {
    resolve: async (def: FormDefinition) => ({
      definition: def,
      sections: [], tabs: [], steps: [],
      allFields: [],
      fieldIndex: new Map(),
      resolvedAt: new Date().toISOString(),
    }),
  },
}]
```

## Coverage Targets

- State classes: **>95%** (pure functions, easy to cover)
- Services: **>90%** (testable with TestBed)
- Components: **>80%** (async initialization makes some paths harder)
- Injection tokens / noop defaults: **100%** (simple classes)
