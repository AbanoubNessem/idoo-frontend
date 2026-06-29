# Sprint 5 — Field Components Reference

---

## Usage Pattern

All 19 platform field components follow the same API pattern:

```typescript
// In a standalone component or module
import { PlatformTextFieldComponent } from '@core/platform/components';

@Component({
  imports: [PlatformTextFieldComponent],
  template: `
    <platform-text-field
      fieldKey="customer-name"
      label="Customer Name"
      placeholder="Enter name"
      hint="Required for invoicing"
      prefixIcon="person"
      [required]="true"
      [(value)]="model.name"
      [errors]="nameErrors()"
      (blur)="onNameBlur()"
    />
  `
})
```

**Key:**
- `[(value)]` uses Angular's `model()` two-way binding signal
- `[errors]` must be externally computed (from validator or form engine)
- `fieldKey` uniquely identifies the field within its form context
- Never import from `@angular/material` in business modules

---

## Common Inputs (all components)

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `fieldKey` | `string` | `''` | Machine identifier within the form |
| `label` | `string` | `''` | Human-readable label |
| `placeholder` | `string` | `''` | Placeholder text |
| `hint` | `string` | `''` | Helper text below field |
| `prefixIcon` | `string` | `''` | Material icon name for prefix |
| `suffixIcon` | `string` | `''` | Material icon name for suffix |
| `ariaLabel` | `string` | `''` | Overrides label for screen readers |
| `disabled` | `boolean` | `false` | Disables the field |
| `readonly` | `boolean` | `false` | Makes field non-editable |
| `required` | `boolean` | `false` | Marks field as required |
| `loading` | `boolean` | `false` | Shows loading spinner |
| `skeleton` | `boolean` | `false` | Shows skeleton shimmer |
| `errors` | `string[]` | `[]` | Validation error messages |
| `validators` | `ValidatorSpec[]` | `[]` | Validator spec (for Sprint 6) |
| `permissions` | `string[]` | `[]` | Required permissions (disables if not met) |
| `config` | `Record<string, unknown>` | `{}` | Field-type-specific configuration |
| `metadata` | `unknown` | `null` | Raw metadata object binding |
| `hiddenExpression` | `string` | `''` | Expression for conditional hiding |
| `disabledExpression` | `string` | `''` | Expression for conditional disabling |
| `valueExpression` | `string` | `''` | Expression to compute value from model |

## Common Outputs (all components)

| Output | Payload | Description |
|--------|---------|-------------|
| `blur` | `void` | Field lost focus |
| `focus` | `void` | Field gained focus |
| `validationChange` | `ValidationResult` | Validation state changed |
| `(value)` | `T \| null` | Value changed (two-way binding) |

---

## PlatformTextField — Config

```typescript
interface BaseFieldConfig {
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  placeholder?: string;
  autocomplete?: string;  // HTML autocomplete attribute value
}
```

## PlatformNumberField — Config

```typescript
interface NumberFieldConfig extends BaseFieldConfig {
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
}
```

Native spin buttons are hidden by default (CSS reset). Use `step` for increment behavior.

## PlatformCurrencyField — Config

```typescript
interface CurrencyFieldConfig extends NumberFieldConfig {
  currency?: string;     // ISO 4217 code, default 'USD'
  locale?: string;       // overrides context locale
  showSymbol?: boolean;  // default true
}
```

Currency symbol is resolved via `Intl.NumberFormat` — locale-aware, no hard-coded symbol strings.

## PlatformDateField — Config

```typescript
interface DateFieldConfig extends BaseFieldConfig {
  minDate?: string;    // ISO 8601 date string
  maxDate?: string;    // ISO 8601 date string
  dateFormat?: string; // for placeholder display only
}
```

Value is stored as an ISO date string (`YYYY-MM-DD`). MatDatepicker provides the native calendar UI. `MatNativeDateModule` is imported inside the component.

## PlatformTimeField — Config

```typescript
interface TimeFieldConfig extends BaseFieldConfig {
  format?: '12h' | '24h';  // default 24h
}
```

## PlatformSelectField — Config

```typescript
interface SelectFieldConfig extends BaseFieldConfig {
  options: SelectOption[];      // required
  multiple?: boolean;           // default false
  searchable?: boolean;         // default false (future Sprint)
}

interface SelectOption {
  label: string;
  value: unknown;
  disabled?: boolean;
  icon?: string;      // Material icon name
  group?: string;     // Option group label (future Sprint)
}
```

## PlatformLookupField — Config

```typescript
interface LookupFieldConfig extends BaseFieldConfig {
  entityType: string;          // e.g., 'customer', 'product'
  displayField?: string;       // field to show as label
  searchDebounce?: number;     // ms, default 300
  minSearchLength?: number;    // chars before search fires, default 1
}
```

Value is `LookupResult | null`. Parent component must call `component.setResults(results)` with search results (the lookup field itself does not fetch).

## PlatformAutocompleteField — Config

```typescript
interface AutocompleteFieldConfig extends BaseFieldConfig {
  options: SelectOption[];
  freeText?: boolean;     // allow value not in options list
  minSearchLength?: number;
}
```

## PlatformFileField — Config

```typescript
interface FileFieldConfig extends BaseFieldConfig {
  accept?: string;           // MIME or extension list, e.g. 'image/*,.pdf'
  maxSizeBytes?: number;
  multiple?: boolean;
}
```

## PlatformChipField — Config

```typescript
interface ChipFieldConfig extends BaseFieldConfig {
  suggestions?: string[];  // autocomplete suggestions
  separator?: string;      // not currently used (ENTER/COMMA built-in)
  maxChips?: number;
}
```

## PlatformColorField — Config

```typescript
interface ColorFieldConfig extends BaseFieldConfig {
  format?: 'hex' | 'rgb' | 'hsl';  // default 'hex'
  showInput?: boolean;               // default true
  presets?: string[];                // hex color strings
}
```

## PlatformJsonField — Config

```typescript
interface JsonFieldConfig extends BaseFieldConfig {
  expandLevel?: number;    // for future tree view
  readonlyEditor?: boolean;
  height?: string;         // CSS height, default '200px'
}
```

## PlatformMarkdownField — Config

```typescript
interface MarkdownFieldConfig extends BaseFieldConfig {
  toolbar?: string[];   // for future custom toolbar configuration
  preview?: boolean;    // show preview tab, default true
  height?: string;      // CSS height, default '240px'
}
```

The preview renders a subset of Markdown (headings, bold, italic, code, lists, links). Full CommonMark rendering requires a library (e.g., marked.js) and will be added in Sprint 7 if needed.
