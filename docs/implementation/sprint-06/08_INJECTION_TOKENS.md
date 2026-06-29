# Sprint 6 — Injection Tokens

## Overview

The Dynamic Form Engine integrates with four external engine capabilities via injection tokens. Each token has a noop default implementation, so the form engine works out of the box with zero configuration.

## Token Definitions

### `FORM_EXPRESSION_EVALUATOR`

Evaluates template expressions embedded in field definitions.

```typescript
interface FormExpressionEvaluator {
  evaluate(expression: string, context: Record<string, unknown>): unknown;
  evaluateBoolean(expression: string, context: Record<string, unknown>): boolean;
}
```

**Used for:** `hiddenExpression`, `disabledExpression`, `requiredExpression`, `valueExpression`

**Eval context** built by `DynamicFormContext.buildEvalContext()`:
```typescript
{
  ...model,           // all current field values
  __formKey: string,
  __formId:  string,
  __mode:    FormMode,
  __locale:  string,
  __entityType?: string,
  __entityId?:   string,
  ...extra,           // any custom data from FormContextData.extra
}
```

**Wiring a real Expression Engine:**
```typescript
// In your app module or form feature module:
providers: [{
  provide: FORM_EXPRESSION_EVALUATOR,
  useExisting: ExpressionEngineService,
}]
```

### `FORM_FIELD_VALIDATOR`

Validates a field value against an array of `ValidatorSpec` objects.

```typescript
interface FormFieldValidator {
  validate(
    value: unknown,
    validators: ValidatorSpec[],
    context: Record<string, unknown>,
  ): Promise<string[]>; // returns error messages
}
```

**Used during:** `FormInstance.validate()` — called once per non-hidden, non-disabled field.

The form engine adds `{ type: 'required' }` to the validators array when `fieldState.required` is true.

### `FORM_PERMISSION_CHECKER`

Checks whether the current user has a set of permissions.

```typescript
interface FormPermissionChecker {
  hasPermission(permission: string): boolean;
  hasAllPermissions(permissions: string[]): boolean;
}
```

**Used during:** `initialize()` to set `disabled: true` on fields whose `permissions` the user lacks.

### `FORM_QUERY_PROVIDER`

Provides data search for lookup/autocomplete fields.

```typescript
interface FormQueryProvider {
  search(
    query: string,
    config: Record<string, unknown>,
    context: Record<string, unknown>,
  ): Promise<unknown[]>;
}
```

**Used by:** Consuming code that listens to `'field:lookup-triggered'` events, calls the query provider, and passes results back via `FormInstance.setLookupResults(key, results)`.

## Providing Real Implementations

```typescript
// Option 1: useExisting (adapter pattern)
@NgModule({
  providers: [
    { provide: FORM_EXPRESSION_EVALUATOR, useExisting: MyExpressionService },
    { provide: FORM_FIELD_VALIDATOR,     useExisting: MyValidationService },
    { provide: FORM_PERMISSION_CHECKER,  useExisting: MyAuthService },
    { provide: FORM_QUERY_PROVIDER,      useExisting: MyQueryService },
  ]
})

// Option 2: useFactory
providers: [{
  provide: FORM_FIELD_VALIDATOR,
  useFactory: () => new MyValidator(someConfig),
}]
```

## Noop Defaults

If no provider is configured for a token, the default factory is used:

| Token | Default behaviour |
|-------|-------------------|
| `FORM_EXPRESSION_EVALUATOR` | `evaluate()` returns `undefined`; `evaluateBoolean()` returns `false` |
| `FORM_FIELD_VALIDATOR` | Always returns `[]` (no validation errors) |
| `FORM_PERMISSION_CHECKER` | Always returns `true` (all permissions granted) |
| `FORM_QUERY_PROVIDER` | Always returns `[]` (no search results) |
