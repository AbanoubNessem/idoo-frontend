# Sprint 6.5 — Test Report

## Test Coverage Summary

| File                                | Tests | Description                                   |
|-------------------------------------|-------|-----------------------------------------------|
| `tests/platform-api.spec.ts`        | 8     | Factory function type checks and identity      |
| `tests/customer-entity.spec.ts`     | 8     | Entity field count, required fields, validators|
| `tests/customer-form.spec.ts`       | 9     | Form structure, tabs, arrays, expressions      |
| `tests/demo-validator.spec.ts`      | 14    | All 8 validator types + multiple validators    |
| `tests/demo-expression-evaluator.spec.ts` | 10 | evaluate() and evaluateBoolean() coverage   |
| `tests/demo-permission-checker.spec.ts`   | 8  | Grant, revoke, hasPermission, hasAll          |
| `tests/demo-query-provider.spec.ts` | 8     | Country, user, industry, unknown, fallback     |
| **Total**                           | **65**| —                                             |

## Test Strategy

### Platform API Tests
- Pure unit tests with no Angular TestBed required
- Verify `__type` discriminant on each factory function
- Verify all config properties are preserved

### Customer Entity Tests
- Verify metadata shape: id, displayName, field count
- Verify required field flags
- Verify validator types on email/phone fields

### Customer Form Tests
- Verify tab structure (4 tabs)
- Verify array field presence in contacts tab
- Verify expressions present on displayName, industry
- Verify permission guard on vatNumber

### Mock Provider Tests

**DemoValidator:**
- All 8 rule types tested for both pass and fail cases
- Custom message support verified
- Empty-string pass-through for non-required validators

**DemoExpressionEvaluator:**
- `evaluate()` — arithmetic, context vars, string concat, ternary
- `evaluateBoolean()` — truthy/falsy, empty → false
- Error safety — invalid expressions return undefined, do not throw
- Real expressions from CustomerFormDef tested (displayName valueExpression, industry hiddenExpression)

**DemoPermissionChecker:**
- Uses Angular TestBed for signal reactivity
- Grant/revoke round-trip verified
- `hasAllPermissions()` with partial match

**DemoQueryProvider:**
- All three data types (country, user, industry)
- Unknown type returns empty array
- `lookupType` fallback for legacy config key
- Filter query works (partial name match)

## Coverage Gaps

The following items are not unit-tested but are validated via integration through the Customer Demo:

- `DemoShellComponent` — router/navigation testing requires full E2E
- `CustomerDemoComponent` — form lifecycle tested through DynamicFormEngine specs (Sprint 6)
- Explorer components — display-only; rendering verified manually
- `MaterialAdapterConnector.connect()` — covered by Sprint 5 specs
