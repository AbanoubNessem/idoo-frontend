# Sprint 9.4 — Sorting

## TableSortConfig

```typescript
interface TableSortConfig {
  fields:      TableSortField[];  // ordered list (primary first)
  multiColumn: boolean;           // allow multiple sort fields
  stable:      boolean;           // preserve original order on equal
}

interface TableSortField {
  columnId:      string;
  field:         string;          // dot-notation path for data access
  direction:     'asc' | 'desc';
  comparatorId?: string;          // named comparator from TableComparatorRegistry
  locale?:       string;          // e.g. 'en-US', used by Intl.Collator
}
```

## Stable Sort

Implemented via original-index tiebreaking:
```typescript
const indexed = rows.map((row, i) => ({ row, i }));
indexed.sort((a, b) => {
  for (const field of config.fields) {
    const result = compare(a.row, b.row, field);
    if (result !== 0) return field.direction === 'asc' ? result : -result;
  }
  return config.stable ? a.i - b.i : 0;
});
return indexed.map(({ row }) => row);
```

This guarantees stability in all environments, not relying on the JS engine's built-in stable sort.

## Default Comparator (auto-detect)

When no `comparatorId` is specified, the engine auto-detects value types:
- Both `number` → `a - b`
- Both `boolean` → `Number(a) - Number(b)`
- With `locale` → `new Intl.Collator(locale).compare(String(a), String(b))`
- Otherwise → string comparison: `String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0`
- `null` / `undefined` → always sorted last (regardless of direction)

## Built-in Named Comparators

| ID | Behavior |
|----|----------|
| `text` | Case-insensitive string comparison |
| `number` | Numeric, nulls at negative infinity |
| `date` | `new Date(a).getTime()` comparison |
| `boolean` | `false < true` |
| `locale-text` | `Intl.Collator(locale).compare()` |

Register custom comparators via `TableComparatorRegistry.register(id, fn)`.

## TableSortContext Signal API

```typescript
const sortCtx = dataEngine.createSortContext();

// Single-column toggle (asc → desc → remove)
sortCtx.toggleField({ columnId: 'name', field: 'name', direction: 'asc' });

// Multi-column
sortCtx.setMultiColumn(true);
sortCtx.addField({ columnId: 'name', field: 'name', direction: 'asc' });
sortCtx.addField({ columnId: 'age',  field: 'age',  direction: 'desc' });

sortCtx.isActive()   // computed Signal<boolean>
sortCtx.fieldCount() // computed Signal<number>
sortCtx.toConfig()   // frozen TableSortConfig snapshot
sortCtx.clear()      // remove all fields
```
