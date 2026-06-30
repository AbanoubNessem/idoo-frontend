# Sprint 9.4 — Filtering

## TableFilterConfig

```typescript
interface TableFilterConfig {
  root: TableFilterGroup;
}

interface TableFilterGroup {
  logic:      'and' | 'or';
  conditions: TableFilterCondition[];
  groups?:    TableFilterGroup[];      // nested compound groups
}

interface TableFilterCondition {
  columnId:       string;
  field:          string;              // dot-notation path for data access
  operator:       TableFilterOperator;
  value:          unknown;
  value2?:        unknown;             // second bound for 'between'
  predicateId?:   string;             // named predicate for 'custom' operator
  caseSensitive?: boolean;            // default: false
}
```

## Supported Operators

| Operator | Description | Value | Value2 | Notes |
|----------|-------------|-------|--------|-------|
| `contains` | Row value includes substring | string | — | Case-insensitive by default |
| `startsWith` | Prefix match | string | — | Case-insensitive by default |
| `endsWith` | Suffix match | string | — | Case-insensitive by default |
| `equals` | Exact match | any | — | String: respects caseSensitive |
| `notEquals` | Not equal | any | — | Negation of equals |
| `greaterThan` | `rowValue > value` | number | — | Falls back to string compare |
| `lessThan` | `rowValue < value` | number | — | Falls back to string compare |
| `between` | `value <= rowValue <= value2` | number | number | Inclusive boundaries |
| `in` | Array membership | array | — | `(value as unknown[]).includes(rowValue)` |
| `boolean` | Boolean equivalence | boolean | — | Handles string 'true'/'false' |
| `date` | Same calendar day | Date/string/number | — | `toDateString()` comparison |
| `custom` | Custom predicate | any | any | Looks up `predicateId` in `TableFilterRegistry` |

## Compound Filters (AND/OR Groups)

A `TableFilterGroup` evaluates all its `conditions` and nested `groups` with the specified `logic`:

```
AND group: all conditions AND all nested groups must match
OR  group: at least one condition OR nested group must match

Example:
{
  logic: 'and',
  conditions: [{ field: 'active', operator: 'boolean', value: true }],
  groups: [{
    logic: 'or',
    conditions: [
      { field: 'score', operator: 'greaterThan', value: 85 },
      { field: 'role',  operator: 'equals',      value: 'admin' },
    ]
  }]
}
→ active=true AND (score>85 OR role='admin')
```

## TableFilterContext Signal API

```typescript
const filterCtx = dataEngine.createFilterContext();

filterCtx.addCondition({ columnId: 'name', field: 'name', operator: 'contains', value: 'ali' });
filterCtx.setLogic('or');
filterCtx.removeCondition('name');
filterCtx.clear();

filterCtx.isActive()       // computed Signal<boolean>
filterCtx.conditionCount() // computed Signal<number>
filterCtx.toConfig()       // frozen TableFilterConfig snapshot
```

## Custom Predicates

```typescript
// Register
dataEngine.registerFilter('score-tier-a', (value) => Number(value) >= 90);

// Use
filterCtx.addCondition({
  columnId: 'score', field: 'score',
  operator: 'custom', value: null,
  predicateId: 'score-tier-a',
});
```
