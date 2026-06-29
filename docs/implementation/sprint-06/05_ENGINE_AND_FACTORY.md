# Sprint 6 — DynamicFormEngine & DynamicFormFactory

## DynamicFormEngine

The primary public-facing service for all form operations. It is a **facade** that:
- Manages the lifecycle of all active `FormInstance` objects
- Provides access to all sub-services via named getters
- Delegates creation to `DynamicFormFactoryService`
- Exposes reactive `instanceCount` and `activeIds` signals

### Injection

```typescript
// In any component or service:
readonly engine = inject(DynamicFormEngine);
```

### Creating Forms

```typescript
// From a definition object:
const instance = await engine.createForm(definition, { name: 'Alice' });

// From a registry key:
engine.registerForm(myFormDef, ['crm']);
const instance = await engine.createFormByKey('contact-form', initialModel);

// With context data:
const instance = await engine.createForm(def, model, {
  locale: 'ar',
  permissions: ['can_edit'],
  entityType: 'Customer',
  entityId: '42',
});
```

### Managing Instances

```typescript
const instance = engine.getInstance(id);  // null if not found
engine.destroyInstance(id);               // destroys + cleans up metrics/events
engine.destroyAll();                      // clean shutdown
engine.getSummary();                      // [{id, valid, dirty, phase}]
```

### Sub-Service Access

```typescript
engine.Registry    // DynamicFormRegistryService
engine.Lifecycle   // DynamicFormLifecycleService
engine.Diagnostics // DynamicFormDiagnosticsService
engine.Metrics     // DynamicFormMetricsService
engine.Events      // DynamicFormEventsService
engine.Snapshots   // DynamicFormSnapshotService
engine.Serializer  // DynamicFormSerializerService
```

### Events

```typescript
const off = engine.on('form-id', 'field:value-changed', event => {
  console.log(event.payload);
});
off(); // unsubscribe
```

## DynamicFormFactoryService

Creates `DynamicFormInstance` objects. Called internally by `DynamicFormEngine`.

### What `create()` does

1. Generates a unique form ID (`form-N-timestamp`)
2. Calls `DynamicFormLifecycleService.onCreated()`
3. Calls `DynamicFormResolverService.resolve(definition)` to get `ResolvedFormModel`
4. Creates `DynamicFormContext` and populates it with `contextData`
5. Constructs `DynamicFormInstance` (not injectable — plain class)
6. Records metrics via `DynamicFormMetricsService.init()`
7. Returns the instance (caller then calls `.initialize()`)

### DynamicFormInstance

The concrete implementation of `FormInstance`. Not exported publicly — use the `FormInstance` interface.

Key responsibilities of `DynamicFormInstance`:
- `initialize()` — initializes all field states, evaluates initial expressions, pushes first history snapshot
- `validate()` — delegates to `FORM_FIELD_VALIDATOR` token; never contains validation logic itself
- `submit()` — validates, then transitions phase through `submitting → submitted`
- `_evaluateAllExpressions()` — calls `FORM_EXPRESSION_EVALUATOR` token for each field's hidden/disabled/required/value expressions
- `_runAutosave()` — calls the user-provided `AutosaveConfig.onSave()` callback; form engine does NOT know what "save" means

## Form Instance Isolation

Each `FormInstance` owns:
- Its own `DynamicFormState` (no shared state between forms)
- Its own `DynamicFormHistory` (independent undo/redo stacks)
- Its own `DynamicFormContext` (locale, permissions, model)
- Its own autosave timer

Global services (`Events`, `Diagnostics`, `Metrics`, `Lifecycle`, `Snapshots`) use `formId` to partition their data.
