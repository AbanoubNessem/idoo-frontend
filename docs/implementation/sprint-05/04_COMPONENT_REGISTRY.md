# Sprint 5 — Component Registry

---

## Overview

The `ComponentRegistryService` is the canonical catalog of all platform components. It is not a dependency injection container — it stores metadata (`ComponentEntry`) and type references, not instances.

```
ComponentRegistryService
    ↓ (resolves type)
ComponentResolverService
    ↓ (creates instance)
ComponentFactoryService
```

---

## Registration

### Eager Registration (default)

```typescript
import { ComponentRegistryService } from '@core/platform/components';

const registry = inject(ComponentRegistryService);

registry.register({
  key:         'platform-text-field',
  version:     '5.0',
  category:    'field',
  fieldType:   'text',
  component:   PlatformTextFieldComponent,
  tags:        ['field', 'text', 'material'],
  description: 'Single-line text input',
  registeredAt: new Date().toISOString(),
});
```

### Lazy Registration (factory-based)

```typescript
registry.register({
  key:         'pdf-viewer',
  version:     '1.0',
  category:    'widget',
  component:   null!,  // placeholder
  factory:     () => import('./pdf-viewer.component').then(m => m.PdfViewerComponent),
  tags:        ['widget', 'viewer'],
  description: 'PDF viewer widget',
  registeredAt: new Date().toISOString(),
});
```

The factory is called once on first `resolve()`. Subsequent calls return the cached type.

---

## Registration via MaterialAdapterConnector

At app startup, call `MaterialAdapterConnector.connect()`. This registers all 19 Sprint 5 components in both the `MaterialAdapter` and the `ComponentRegistryService`.

```typescript
// In AppComponent constructor, or APP_INITIALIZER:
const connector = inject(MaterialAdapterConnector);
connector.connect();
```

---

## Querying

```typescript
// By key
const entry = registry.get('platform-text-field');

// By field type
const textEntry = registry.getByFieldType('text');

// By query criteria
const allFields = registry.query({ category: 'field' });
const materialFields = registry.query({ tags: ['material'] });
const v5Fields = registry.query({ version: '5.0', category: 'field' });
```

---

## Reactive Count

```typescript
// In a component:
const registry = inject(ComponentRegistryService);
// Signal — updates when components are registered/unregistered
const count = registry.registeredCount();
```

---

## ComponentEntry Shape

```typescript
interface ComponentEntry extends ComponentDefinition {
  readonly resolved: boolean; // false for lazy-registered until first resolve()
}

interface ComponentDefinition {
  readonly key: string;
  readonly version: string;
  readonly category: ComponentCategory;
  readonly fieldType?: ComponentFieldType;
  readonly component: Type<unknown>;
  readonly factory?: () => Promise<Type<unknown>>;
  readonly tags: string[];
  readonly description: string;
  readonly registeredAt: string;
}
```

---

## Versioning

Components are versioned at registration time (`version: '5.0'`). The registry does not enforce semantic versioning — it's a free-form string. In a multi-version upgrade scenario:

```typescript
// Register a v6 replacement
registry.register({ key: 'platform-text-field', version: '6.0', ... }, { override: true });
```

Consumers that resolve by key will automatically get the latest version. Consumers that resolve by field type will get whichever version was registered first for that type (unless the older one is unregistered first).

---

## Pre-Resolution

For optimal time-to-first-render, pre-resolve all lazy components at startup:

```typescript
const resolver = inject(ComponentResolverService);
await resolver.preResolveAll();
```

Sprint 5 components are all eagerly registered (no factory functions), so `preResolveAll()` is a no-op for them. This is the correct pattern for any Sprint 6+ lazy components.
