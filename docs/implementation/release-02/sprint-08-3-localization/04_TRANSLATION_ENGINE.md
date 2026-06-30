# Translation Engine

## Purpose

The Translation Engine provides a complete namespace-based, lazy-loaded translation system
with interpolation, pluralization, fallback chaining, and external provider support.

## Core API

```typescript
const t = inject(TranslationEngineService);
```

## t() — Primary Translation Method

```typescript
t(key: string, options?: TranslationOptions): string
```

### Key Formats

| Format | Namespace | Key |
|---|---|---|
| `'save'` | default (`common`) | `save` |
| `'forms:submit.label'` | `forms` | `submit.label` |
| `'errors.required'` | default (`common`) | `errors.required` |

### Options

```typescript
interface TranslationOptions {
  namespace?: string;           // override namespace
  count?:     number;           // trigger pluralization
  params?:    Record<string, string | number | boolean>; // interpolation
  fallback?:  string;           // default if key missing (defaults to key itself)
  locale?:    string;           // override active locale
}
```

## Interpolation

```typescript
// Translation: 'Hello, {{name}}! You have {{count}} messages.'
t('greeting', { params: { name: 'Alice', count: 3 } })
// Result: 'Hello, Alice! You have 3 messages.'
```

Custom delimiters:
```typescript
{ provide: TRANSLATION_INTERPOLATION_OPEN,  useValue: '%{' }
{ provide: TRANSLATION_INTERPOLATION_CLOSE, useValue: '}' }
```

## Pluralization

Plural translation objects use `Intl.PluralRules` category keys:

```json
{
  "items": {
    "zero":  "No items",
    "one":   "{{count}} item",
    "other": "{{count}} items"
  }
}
```

```typescript
t('items', { count: 0 }) // 'No items'
t('items', { count: 1 }) // '1 item'
t('items', { count: 5 }) // '5 items'
```

Arabic has 6 plural forms: `zero`, `one`, `two`, `few`, `many`, `other`.

## Fallback Chain

When a key is missing in `de-DE`:
1. Look up in `de-DE`
2. Fall back to `de` (language only)
3. Fall back to `en-US` (platform default)
4. Return `options.fallback ?? key`

## Namespace Registration

```typescript
t.registerNamespace({
  namespace: 'forms',
  locale:    'en-US',
  data: {
    email:    { label: 'Email', placeholder: 'Enter email' },
    password: { label: 'Password' },
  },
});
```

## Merging

```typescript
t.mergeNamespace('forms', 'en-US', { submit: 'Submit Form' });
```

## Lazy Loading

```typescript
// Via providers (auto-loaded on demand)
await t.loadNamespace('reports');
await t.loadNamespaces(['nav', 'dashboard', 'reports'], 'de-DE');

t.isLoaded('reports', 'en-US')  // boolean
```

Concurrent `loadNamespace()` calls for the same namespace/locale are deduplicated.

## Translation Providers

```typescript
{ provide: TRANSLATION_PROVIDERS, useValue: [myHttpProvider] }

// Or register at runtime:
inject(TranslationLoaderService).registerProvider(myHttpProvider);
```

```typescript
interface TranslationProvider {
  id:   string;
  name: string;
  canLoad(namespace: string, locale: string): boolean;
  load(namespace: string, locale: string): Promise<TranslationMap>;
  listNamespaces?(locale: string): Promise<string[]>;
}
```

## Events

```typescript
t.events$.subscribe(e => {
  switch (e.type) {
    case 'translations:loaded':      // namespace, locale, keyCount
    case 'translations:invalidated': // namespace, locale?
  }
});
```

## Serialization

```typescript
const json = t.serializeNamespace(ns);     // JSON envelope
const back = t.deserializeNamespace(json); // TranslationNamespace
```

## Built-in Common Translations

The following keys are pre-loaded in `common::en-US` and `common::en`:

`save`, `cancel`, `delete`, `confirm`, `close`, `back`, `next`, `submit`,
`edit`, `loading`, `error`, `success`, `warning`, `required`, `invalid`
