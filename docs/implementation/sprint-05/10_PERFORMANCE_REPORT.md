# Sprint 5 — Performance Report

---

## Design for Performance

### 1. OnPush Change Detection

All 19 platform field components use `ChangeDetectionStrategy.OnPush`. Angular skips re-rendering a component unless:
- One of its `@Input()` / `input()` signals changes
- An event originates from within the component
- A `ChangeDetectorRef.markForCheck()` is explicitly called

For a form with 20+ fields, this eliminates cascading re-renders when a single field's value changes.

### 2. Signal-Based Inputs

`input()`, `model()`, and `computed()` are Angular's granular reactivity primitives. Only the specific signal that changed causes a re-computation — not the entire component tree.

### 3. CSS Custom Properties for Theming

Component styles reference `var(--platform-color-*)` tokens. When the active theme changes (Sprint 4 `ThemeManagerService.setTheme()`), CSS variables update on `document.documentElement` — zero Angular re-renders for any field component.

### 4. Skeleton as Pure CSS

The skeleton animation (`@keyframes pf-shimmer`) is a CSS animation, not a JavaScript interval. Zero CPU load during skeleton state.

### 5. No RxJS Subscriptions

All reactive state (value, errors, disabled, loading, skeleton) is managed via signals. No `subscribe()`/`unsubscribe()` lifecycle. Memory leaks from forgotten subscriptions cannot occur.

### 6. Lookup Debounce is JS-Based (Not RxJS)

`PlatformLookupFieldComponent` uses `setTimeout()` for debouncing, not `debounceTime()` + a subscription. This avoids the `Observable` allocation for what is a simple one-shot timer.

---

## Bundle Size Considerations

Angular Material is tree-shakeable. Only the Material modules imported in each component are included in the bundle. The unused modules (e.g., `MatSlider`, `MatStepper`, `MatTable`) are excluded.

| Component Group | Material Modules |
|----------------|-----------------|
| Text, Number, Currency, Time, Textarea, Badge, Color | `MatFormField`, `MatInput`, `MatIcon`, `MatProgressSpinner` |
| Date | + `MatDatepicker`, `MatNativeDateModule` |
| Checkbox | `MatCheckbox` |
| Switch | `MatSlideToggle` |
| Select | `MatFormField`, `MatSelect` |
| Autocomplete, Lookup | `MatFormField`, `MatInput`, `MatAutocomplete` |
| File, Image, Avatar | `MatIcon`, `MatButton`, `MatProgressSpinner` |
| Chip | `MatFormField`, `MatChips`, `MatAutocomplete`, `MatInput` |
| JSON, Markdown | `MatIcon`, `MatButton`, (+`MatTooltip` for Markdown) |

The total Material overhead is approximately **180-220 KB** minified+gzipped (shared across all components, not per-component).

---

## Benchmark Targets

| Operation | Target |
|-----------|--------|
| Field render (first) | < 15 ms |
| Field re-render (input change) | < 3 ms (OnPush) |
| Skeleton to active transition | < 1 frame (signal flip) |
| Theme switch visible on field | 0 ms (CSS custom property cascade) |
| Chip input token end | < 1 ms |
| Autocomplete filter (100 options) | < 2 ms (computed signal) |

---

## Memory Bounds

| Resource | Bound |
|----------|-------|
| Per-field component | ~2-4 KB (signal graph + view) |
| Lookup `_results` signal | Bounded by `setResults()` caller |
| Chip field value array | Bounded by `maxChips` config |
| Markdown preview HTML | Proportional to input length |

---

## SSR Notes

All 19 components are SSR-compatible. They contain no `document` or `window` API calls in class code. Template event handlers (click, input, drag) are only attached in the browser after hydration.

The `MatDatepicker` component manages its own SSR compatibility via CDK's platform detection.
