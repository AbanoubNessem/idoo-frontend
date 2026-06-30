# Built-in Themes

Three themes ship with the platform out of the box. All are registered on app startup by
`ThemeRegistryService` constructor.

## platform-light (default)

```
variant: light
CSS class: data-theme="light"
```

| Category | Notes |
|---|---|
| Primary | `#1976d2` (Material Blue 700) |
| Background | `#f5f5f5` |
| Surface | `#ffffff` |
| Text primary | `rgba(0,0,0,0.87)` |
| Border | `rgba(0,0,0,0.12)` |
| Elevation | `rgba(0,0,0,0.08-0.16)` shadows |

## platform-dark

```
variant: dark
CSS class: data-theme="dark"
```

| Category | Notes |
|---|---|
| Primary | `#90caf9` (lightened for dark backgrounds) |
| Background | `#0d1117` (GitHub-dark style) |
| Surface | `#161b22` |
| Text primary | `rgba(255,255,255,0.87)` |
| Border | `rgba(255,255,255,0.12)` |
| Elevation | Higher opacity shadows for depth perception |

## platform-high-contrast

```
variant: high-contrast
CSS class: data-theme="high-contrast"
tags: ['built-in', 'accessibility', 'high-contrast']
```

Meets WCAG 2.1 AAA contrast ratios.

| Category | Notes |
|---|---|
| Primary | `#0000ff` (pure blue) |
| Background | `#ffffff` |
| Text primary | `#000000` |
| Border | `#000000` |
| Elevation | `none` everywhere (shadows removed for clarity) |

## Extending a Built-in Theme

Use `parentId` to inherit and selectively override:

```typescript
const brandTheme: ThemeDefinition = {
  id:       'acme-brand',
  name:     'Acme Brand',
  kind:     'theme',
  variant:  'light',
  parentId: 'platform-light',  // inherits all light tokens
  tokens: {
    colors: {
      primary:       '#e91e63',  // override only what differs
      'primary-dark': '#c2185b',
    },
  },
  tags: ['tenant', 'brand'],
};
engine.register(brandTheme);
```

The engine merges parent tokens first, then applies the child's tokens on top.

## CSS Usage in Components

Components never reference a theme ID directly. They use CSS variables:

```scss
.button {
  background:   var(--platform-color-primary);
  color:        var(--platform-color-primary-fg);
  padding:      var(--platform-spacing-3) var(--platform-spacing-4);
  border-radius: var(--platform-radius-md);
  box-shadow:   var(--platform-elevation-sm);
}
```

CSS variables are written to `:root` (`<html>`) so they cascade everywhere.
Switching theme at runtime triggers `effect()` → variables update → Angular re-renders.
No page reload required.
