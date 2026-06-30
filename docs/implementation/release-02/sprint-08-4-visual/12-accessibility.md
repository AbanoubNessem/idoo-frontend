# Sprint 8.4 — Accessibility System

## Built-in Accessibility Profiles

| Profile | highContrast | reducedMotion | largeTypography | focusVisible |
|---|---|---|---|---|
| `accessibility-default` | ✗ | ✗ | ✗ | ✗ |
| `accessibility-high-contrast` | ✓ | ✗ | ✗ | ✓ |
| `accessibility-full` | ✓ | ✓ | ✓ | ✓ |

## Profile Cascading Effects

When `setAccessibility(id)` is called:

1. `reducedMotion` flag is synced from the profile → `setReducedMotion(profile.reducedMotion)`
2. `largeTypography` flag is synced → `setLargeTypography(profile.largeTypography)`
3. `focusVisible` flag is synced → `setFocusVisible(profile.focusVisible)`
4. If `largeTypography === true`, `setTypography('typography-large')` is called automatically

## Individual Toggles

Fine-grained control without switching the full profile:

```typescript
engine.setReducedMotion(true);     // switches to motion-reduced profile
engine.setLargeTypography(true);   // switches to typography-large
engine.setFocusVisible(true);      // sets data-focus-visible on <html>
```

## CSS Variables & Attributes

```html
<html
  data-high-contrast="false"
  data-focus-visible="false"
  data-reduced-motion="false"
>
```

```scss
// High contrast overrides
[data-high-contrast="true"] {
  --platform-color-border: #000000;
  outline: 3px solid #000000;
}

// Focus ring enhancement
[data-focus-visible="true"] *:focus-visible {
  outline: 3px solid var(--platform-color-primary);
  outline-offset: 2px;
}
```

## CSS Custom Properties

```
--platform-a11y-high-contrast     'true' | 'false'
--platform-a11y-reduced-motion    'true' | 'false'
--platform-a11y-large-typography  'true' | 'false'
--platform-a11y-focus-visible     'true' | 'false'
```

## OS Preference Detection (Consumer Responsibility)

The engine does not auto-detect `prefers-reduced-motion` or `prefers-contrast` from the OS —
the host application should detect these on startup and call:

```typescript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  engine.setReducedMotion(true);
}
if (window.matchMedia('(prefers-contrast: more)').matches) {
  engine.setAccessibility('accessibility-high-contrast');
}
```
