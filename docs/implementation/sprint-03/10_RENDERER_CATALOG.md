# Sprint 3 — Renderer Catalog

**Built-in Field Renderers: 21**

All renderers extend `AbstractFieldRenderer` and are registered in `RenderingEngineService.registerBuiltInRenderers()`.

---

## Field Renderer Reference

| Field Type | Class | Default Config (props) | Notes |
|-----------|-------|----------------------|-------|
| `text` | `TextRenderer` | `{ maxLength: 255, autoComplete: 'off' }` | Standard single-line text |
| `number` | `NumberRenderer` | `{ min: null, max: null, step: 1, precision: 0 }` | Integer by default |
| `currency` | `CurrencyRenderer` | `{ currency: 'USD', locale: 'en-US', precision: 2 }` | Intl.NumberFormat in display |
| `date` | `DateRenderer` | `{ format: 'YYYY-MM-DD', minDate: null, maxDate: null }` | ISO input |
| `time` | `TimeRenderer` | `{ format: 'HH:mm', step: 60 }` | 24h format, 60s step |
| `datetime` | `DatetimeRenderer` | `{ format: 'YYYY-MM-DDTHH:mm', timezone: 'local' }` | ISO datetime-local |
| `boolean` | `BooleanRenderer` | `{ trueLabel: 'Yes', falseLabel: 'No', indeterminate: false }` | Checkbox in edit, Yes/No in display |
| `email` | `EmailRenderer` | `{ maxLength: 255, autoComplete: 'email' }` | Validates format client-side |
| `phone` | `PhoneRenderer` | `{ maxLength: 20, pattern: null, autoComplete: 'tel' }` | No built-in format masking |
| `textarea` | `TextareaRenderer` | `{ rows: 4, maxLength: 2000, resize: 'vertical' }` | Multi-line text |
| `select` | `SelectRenderer` | `{ multiple: false, clearable: true }` | Options from request.options |
| `lookup` | `LookupRenderer` | `{ multiple: false, clearable: true, searchable: false }` | Remote lookup |
| `autocomplete` | `AutocompleteRenderer` | `{ minChars: 2, debounceMs: 300, maxResults: 10 }` | Type-ahead with debounce |
| `file` | `FileRenderer` | `{ accept: '*/*', multiple: false, maxSizeMb: 10 }` | File upload |
| `image` | `ImageRenderer` | `{ accept: 'image/*', maxSizeMb: 5, preview: true }` | Image upload with preview |
| `avatar` | `AvatarRenderer` | `{ accept: 'image/*', maxSizeMb: 2, shape: 'circle' }` | Profile picture |
| `chip` | `ChipRenderer` | `{ multiple: true, removable: true, addOnBlur: true }` | Tag input |
| `badge` | `BadgeRenderer` | `{ multiple: false, colorMap: {} }` | Status badge with optional color map |
| `color` | `ColorRenderer` | `{ format: 'hex', swatches: [] }` | Color picker |
| `json` | `JsonRenderer` | `{ indent: 2, readOnly: false, maxHeight: '300px' }` | JSON editor/viewer |
| `markdown` | `MarkdownRenderer` | `{ toolbar: true, preview: true, maxLength: 10000 }` | Markdown editor |

---

## Supported Modes

All 21 built-in renderers support all 3 modes:

| Mode | Description |
|------|-------------|
| `display` | Read-only display of the field value |
| `edit` | Editable form control |
| `filter` | Compact filter control (used in table column filters) |

In Sprint 3, all modes render via `FieldDisplayComponent` regardless of mode (placeholder). Sprint 4 will provide mode-specific Material components.

---

## AbstractFieldRenderer Contract

```typescript
abstract class AbstractFieldRenderer implements FieldRenderer {
  abstract readonly fieldType: FieldType;
  abstract readonly displayName: string;
  abstract getDefaultConfig(): FieldRendererConfig;

  readonly supportedModes = ['display', 'edit', 'filter'];

  canRender(fieldType: string): boolean;
  render(request: FieldRenderRequest, context: RenderContext): RenderOutput;

  // Protected: subclasses may override for custom input mapping
  protected buildInputs(request, context): Record<string, unknown>;
}
```

---

## Extension Guide

To add a custom field renderer:

```typescript
// 1. Create the renderer
export class RatingRenderer extends AbstractFieldRenderer {
  readonly fieldType = 'rating';
  readonly displayName = 'Rating';

  getDefaultConfig(): FieldRendererConfig {
    return {
      fieldType: 'rating',
      props: { max: 5, step: 1, icon: 'star' },
    };
  }
}

// 2. Register via InjectionToken (no core modification needed)
providers: [
  { provide: FIELD_RENDERER, useClass: RatingRenderer, multi: true }
]

// 3. Wire a component in the active adapter
materialAdapter.registerFieldComponent('rating', RatingStarComponent);
```

---

## FieldDisplayComponent — Display Formatting

The `FieldDisplayComponent` format map (Sprint 3):

| Field Type | Display Format |
|-----------|----------------|
| `boolean` | 'Yes' / 'No' (trueLabel/falseLabel from config) |
| `date` | `toLocaleDateString(locale)` |
| `datetime` | `toLocaleString(locale)` |
| `time` | Value as-is |
| `currency` | `Intl.NumberFormat(locale, { style: 'currency', currency })` |
| `number` | `toFixed(precision)` |
| `select`, `lookup`, `autocomplete` | Option label lookup from options array |
| `file`, `image`, `avatar` | Filename extracted from path |
| `chip`, `badge` | Array joined with `, ` |
| `json` | `JSON.stringify(value, null, 2)` |
| All others | `String(value)` |
