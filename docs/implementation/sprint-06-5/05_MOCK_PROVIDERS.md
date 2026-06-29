# Sprint 6.5 — Mock Provider Implementations

## Overview

The Dynamic Form Engine relies on four injection tokens that must be provided at the application or route level. For the demo, four mock implementations replace the noop defaults.

## DemoExpressionEvaluator

**File:** `src/app/features/demo/mock/demo-expression-evaluator.ts`  
**Token:** `FORM_EXPRESSION_EVALUATOR`

Uses `new Function()` to evaluate form expressions against the current model context.

```typescript
evaluate(expression, context): unknown {
  const fn = new Function(...Object.keys(context),
    `"use strict"; try { return (${expression}); } catch { return undefined; }`);
  return fn(...Object.values(context));
}
```

**Security note:** Uses `"use strict"` and inner try/catch. Acceptable for the demo sandbox. Production will use the platform Expression Engine (Sprint 7+).

**Supports:**
- Simple expressions: `firstName + " " + lastName`
- Boolean guards: `customerType === "individual"`
- Ternary: `sameAsBilling === true ? null : shipStreet`
- Context variables: all form field values by key

## DemoValidator

**File:** `src/app/features/demo/mock/demo-validator.ts`  
**Token:** `FORM_FIELD_VALIDATOR`

Async validator supporting 8 built-in validator types:

| Type       | Parameters          | Description                              |
|------------|---------------------|------------------------------------------|
| required   | —                   | Must be non-null, non-empty, non-[]      |
| email      | —                   | Regex: `[^\s@]+@[^\s@]+\.[^\s@]+`       |
| phone      | —                   | Regex: `[\d\s\+\-\(\)\.]{6,20}`        |
| minLength  | `min: number`       | String minimum length                    |
| maxLength  | `max: number`       | String maximum length                    |
| pattern    | `pattern: string`   | Custom regex pattern                     |
| min        | `min: number`       | Numeric minimum value                    |
| max        | `max: number`       | Numeric maximum value                    |

Custom error messages are supported via `spec.message`.

## DemoPermissionChecker

**File:** `src/app/features/demo/mock/demo-permission-checker.ts`  
**Token:** `FORM_PERMISSION_CHECKER`

Signal-based permission store initialized from `DEMO_DEFAULT_PERMISSIONS`:

```
customers:read, customers:write, can_view_financial, can_set_tax_status
```

Exposes `grantPermission()` and `revokePermission()` for the demo permission toggle in CustomerDemoComponent.

## DemoQueryProvider

**File:** `src/app/features/demo/mock/demo-query-provider.ts`  
**Token:** `FORM_QUERY_PROVIDER`

Simulates async query responses with a 150ms delay. Handles:

| queryType | Data Source                            | Returns             |
|-----------|----------------------------------------|---------------------|
| country   | `MOCK_COUNTRIES` (20 countries)        | `{id, label, description}[]` |
| user      | `MOCK_ACCOUNT_MANAGERS` (5 managers)   | `{id, label, description}[]` |
| industry  | Inline list (8 industries)             | `{id, label}[]`     |
| *other*   | —                                      | `[]`                |

Supports both `config.queryType` and `config.lookupType` for query type resolution.

## Mock Data

**File:** `src/app/features/demo/mock/mock-data.ts`

- `MOCK_COUNTRIES` — 20 countries with ISO codes, names, and flag emojis
- `MOCK_ACCOUNT_MANAGERS` — 5 account managers with IDs, names, and roles
- `CUSTOMER_INITIAL_MODEL` — default form state (`customerType: 'business'`, `isActive: true`, etc.)
- `DEMO_DEFAULT_PERMISSIONS` — full permission set for normal demo mode
- `DEMO_RESTRICTED_PERMISSIONS` — reduced set for restriction demo
