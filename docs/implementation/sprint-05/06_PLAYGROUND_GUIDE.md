# Sprint 5 — Playground Guide

---

## Purpose

`PlatformPlaygroundComponent` is an internal development tool that renders all 19 platform field components simultaneously under 11 test scenarios. It exists to:

1. Visually verify component behavior without a real form or backend
2. Catch regressions when platform tokens or Angular Material versions change
3. Demo components to the Architecture Review team

---

## Accessing the Playground

Add the route in any development environment:

```typescript
// In app.routes.ts (dev only)
{
  path: 'playground',
  loadComponent: () =>
    import('@core/platform/components').then(m => m.PlatformPlaygroundComponent),
}
```

Navigate to `/playground`.

---

## 11 Test Scenarios

### 1. Default
All fields are editable with no pre-set errors. Shows standard UX with example hint text.

### 2. Readonly
`readonly=true` — fields display their current value but cannot be edited. Input elements get `readOnly` attribute; checkbox/switch are visually non-interactive.

### 3. Disabled
`disabled=true` — fields are not focusable. Material form fields and checkboxes receive their native disabled styling (38% opacity per Material Design 3).

### 4. Required
`required=true` — labels show the asterisk marker (`*`). No form submit is involved in the playground.

### 5. Error
`errors` array populated with two sample error messages. All error strings display below the field via `<mat-error>` or custom `.pf-error` divs.

### 6. Loading
`loading=true` — replaces the suffix icon with `<mat-progress-spinner diameter="18">`. For file/image/avatar fields, shows a centered spinner over the drop zone.

### 7. Skeleton
`skeleton=true` — replaces the entire form field with a shimmer animation. Indicates initial data fetch before values are available.

### 8. RTL
`dir="rtl"` on the playground host element. Angular Material form fields, autocomplete panels, and chip grids inherit directionality from the nearest `[dir]` ancestor via CDK's `Directionality`.

### 9. Dark Theme
`.platform-dark` class applied to the host. Components use CSS custom properties (`--platform-color-*`) that resolve to dark-mode values when the `ThemeManagerService.setMode('dark')` has been called.

### 10. Mobile
Host constrained to `max-width: 360px`. Demonstrates how the responsive grid collapses to single-column.

### 11. Desktop
Full-width grid (`repeat(auto-fill, minmax(360px, 1fr))`). Standard viewport layout.

---

## Extending the Playground

To add a new field component to the playground:

1. Import the component in `PlatformPlaygroundComponent.imports`
2. Add a `<section class="pg-card">` in the template grid
3. Wire all state signals from the `state()` computed signal

The `state()` computed signal automatically derives `disabled`, `readonly`, `required`, `loading`, `skeleton`, `errors`, and `hint` from the active scenario — no per-component scenario logic is needed.

---

## Usage in Architecture Reviews

The playground provides a single URL to demonstrate the complete component library. During an Architecture Review:

1. Run the application: `ng serve`
2. Navigate to `/playground`
3. Click through all 11 scenarios
4. Check that every component responds correctly in each scenario
5. Test RTL and Dark Theme for visual correctness

No test data setup or backend connection is required.
