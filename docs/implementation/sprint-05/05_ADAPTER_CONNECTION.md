# Sprint 5 — Adapter Connection

---

## Why an Adapter?

Sprint 3 established the `MaterialAdapter` pattern: the Rendering Engine asks the adapter for a `Type<unknown>` to render a given field type. Sprint 3 used `FieldDisplayComponent` (display-only placeholder) for all types.

Sprint 5 replaces those placeholders with the real, fully-featured platform components — without changing the Rendering Engine, the adapter interface, or any consumer of `getFieldComponent()`.

---

## MaterialAdapterConnector

```
MaterialAdapterConnector.connect()
    │
    ├── MaterialAdapter.registerFieldComponent('text',  PlatformTextFieldComponent)
    ├── MaterialAdapter.registerFieldComponent('number', PlatformNumberFieldComponent)
    │   ... (all 19 types)
    │
    └── ComponentRegistryService.register({ key: 'platform-text-field', ... })
        ... (all 19 components)
```

### Injection

```typescript
// app.component.ts
@Component({ ... })
export class AppComponent {
  constructor() {
    inject(MaterialAdapterConnector).connect();
    inject(UIContextService).initialize({ themeId: 'light', density: 'comfortable' });
  }
}
```

### Idempotency

`connect()` sets a `_connected` flag. Subsequent calls return immediately. Safe to call in multiple providers or constructors without double-registration.

---

## Field Type Mapping

| Field Type Key | Platform Component |
|---------------|-------------------|
| `text` | `PlatformTextFieldComponent` |
| `number` | `PlatformNumberFieldComponent` |
| `currency` | `PlatformCurrencyFieldComponent` |
| `date` | `PlatformDateFieldComponent` |
| `time` | `PlatformTimeFieldComponent` |
| `boolean` | `PlatformCheckboxFieldComponent` |
| `checkbox` | `PlatformCheckboxFieldComponent` |
| `switch` | `PlatformSwitchFieldComponent` |
| `textarea` | `PlatformTextareaFieldComponent` |
| `select` | `PlatformSelectFieldComponent` |
| `lookup` | `PlatformLookupFieldComponent` |
| `autocomplete` | `PlatformAutocompleteFieldComponent` |
| `file` | `PlatformFileFieldComponent` |
| `image` | `PlatformImageFieldComponent` |
| `avatar` | `PlatformAvatarFieldComponent` |
| `chip` | `PlatformChipFieldComponent` |
| `badge` | `PlatformBadgeFieldComponent` |
| `color` | `PlatformColorFieldComponent` |
| `json` | `PlatformJsonFieldComponent` |
| `markdown` | `PlatformMarkdownFieldComponent` |
| `email` | `PlatformTextFieldComponent` (alias) |
| `phone` | `PlatformTextFieldComponent` (alias) |

---

## API Isolation

Platform components never expose Angular Material APIs externally:

```typescript
// ✅ Correct — business module uses Platform API
import { PlatformTextFieldComponent } from '@core/platform/components';

// ❌ Forbidden — business module must NEVER import Material directly
import { MatInputModule } from '@angular/material/input';
```

The `PlatformTextFieldComponent` imports `MatInputModule` internally (in its `imports` array), but this is implementation detail — the public API is purely `@Input()`/`@Output()`/`model()` signals.

---

## How the Rendering Engine Uses It

```typescript
// RenderPipelineService stage 3 (resolve):
const component = adapter.getFieldComponent(fieldType);
// Returns PlatformTextFieldComponent (not FieldDisplayComponent) after connect()

// ComponentHostComponent then dynamically creates this component
```

The Rendering Engine has no knowledge of platform components — it only knows `Type<unknown>`. The adapter is the seam where framework abstraction happens.

---

## Future Adapters

The adapter pattern makes it possible to add a `PrimeNGAdapter` or `TailwindAdapter` without touching any business module or platform component contract:

1. Create `PrimeNGAdapter implements UIAdapter`
2. Implement `getFieldComponent()` to return PrimeNG-backed equivalents
3. Register with `AdapterManagerService.setActiveAdapter('primeng')`

Business modules continue using `<platform-text-field>` unchanged.
