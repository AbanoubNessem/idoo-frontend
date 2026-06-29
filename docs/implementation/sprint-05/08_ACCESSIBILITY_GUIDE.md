# Sprint 5 — Accessibility Guide

---

## WCAG 2.1 AA Compliance

All 19 platform field components are designed to meet WCAG 2.1 Level AA.

---

## ARIA Attributes

Every field component sets these attributes automatically:

| Attribute | Value | Notes |
|-----------|-------|-------|
| `aria-label` | `ariaLabel()` or `label()` | Falls back to label if ariaLabel not provided |
| `aria-required` | `required()` | Boolean attribute on the native input |
| `aria-invalid` | `hasErrors()` | True when errors array is non-empty |
| `aria-describedby` | `errorId()` or `hintId()` | Points to the error message element when errors exist; falls back to hint |

### Error IDs

The first `<mat-error>` or `.pf-error` element receives `[id]="errorId()"` so `aria-describedby` creates the correct association:

```html
<!-- Generated DOM structure -->
<input
  aria-invalid="true"
  aria-describedby="pf-error-customer-name"
/>
<mat-error id="pf-error-customer-name">Name is required.</mat-error>
```

### Hint IDs

When no errors exist but a hint is present:

```html
<input
  aria-invalid="false"
  aria-describedby="pf-hint-customer-name"
/>
<mat-hint id="pf-hint-customer-name">Enter your legal name.</mat-hint>
```

---

## Focus Management

- All interactive elements are focusable via Tab (native browser behavior)
- Disabled fields have `tabindex="-1"` or `[disabled]="true"` preventing focus
- Drop zones (file, image, avatar) are given `role="button"` and `tabindex="0"` for keyboard access
- `keydown.enter` and `keydown.space` trigger the click handler on drop zones

---

## Keyboard Navigation

| Component | Keyboard Behavior |
|-----------|------------------|
| Text / Number / Currency / Time | Standard input keyboard |
| Date | Date input keyboard + Enter to open picker |
| Checkbox | Space to toggle |
| Switch | Space to toggle |
| Select | Arrow keys to navigate options, Enter/Space to select |
| Autocomplete | Arrow keys to navigate suggestions, Enter to select |
| Lookup | Same as Autocomplete |
| Chip | Backspace removes last chip, Enter/Comma adds chip |
| File / Image / Avatar | Enter or Space to open file dialog |
| Color | Standard text input for hex; native color picker opened by clicking swatch |
| JSON | Standard textarea |
| Markdown | Standard textarea in Write tab |

---

## Screen Reader Announcements

When validation state changes, the `validationChange` output fires. Consumers can use `AccessibilityService.announceError()` to announce error messages:

```typescript
component.validationChange.subscribe(result => {
  if (!result.valid) {
    inject(AccessibilityService).announceError(result.errors[0]);
  }
});
```

Sprint 6 Dynamic Forms will wire this automatically.

---

## Required Field Indicator

Required fields show an asterisk in the label:
```html
<mat-label>Customer Name<span class="pf-required" aria-hidden="true"> *</span></mat-label>
```

The asterisk is `aria-hidden` because the `aria-required="true"` attribute on the input element communicates required state to screen readers independently.

---

## Skeleton State

Skeleton containers receive `role="status"` and `aria-label="Loading field"`:

```html
<div class="pf-skeleton-wrap" role="status" aria-label="Loading field">
  ...
</div>
```

---

## Loading Spinner

Spinner elements are `aria-hidden="true"` — they are decorative. If the loading state requires a screen reader announcement, use `AccessibilityService.announce('Saving...')` from the caller.

---

## RTL Support

All components support RTL via the CSS `[dir="rtl"]` attribute on an ancestor element. Angular Material's CDK `Directionality` propagates `dir` to overlays, autocomplete panels, and select dropdowns automatically.

Field layouts (label + prefix icon + input + suffix icon) use CSS Flexbox which reverses correctly under `dir="rtl"`.

---

## High Contrast Mode

Components use `var(--platform-color-*)` tokens. In forced-colors mode (`@media (forced-colors: active)`), the OS overrides these tokens with system colors. No custom high-contrast hacks are added — relying on the browser's forced-colors adaptation is the recommended approach.

The `AccessibilityService.forcedColors()` signal can be used in Sprint 6 if additional forced-colors targeting is needed.
