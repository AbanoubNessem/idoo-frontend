# Sprint 4 — Theme Architecture

---

## Overview

The theme system is a 3-layer architecture:

```
ThemeManagerService   ← public API (what/when to switch)
      ↓
ThemeEngineService    ← mechanism (how to apply)
      ↓
CSS Custom Properties ← result (what the browser sees)
```

---

## Theme Definition

A `Theme` is an immutable data object:

```typescript
interface Theme {
  readonly id: string;                  // Unique identifier
  readonly name: string;                // Human-readable name
  readonly mode: ThemeMode;             // 'light' | 'dark'
  readonly tokens: ThemeTokenOverrides; // Token overrides
  readonly cssClass?: string;           // Optional <html> class
}

interface ThemeTokenOverrides {
  colors?: Partial<ColorTokenMap>;
  typography?: Partial<Record<string, string>>;
  spacing?: Partial<Record<string, string>>;
  borderRadius?: Partial<Record<string, string>>;
  elevation?: Partial<Record<string, string>>;
  motion?: Partial<Record<string, string>>;
}
```

---

## CSS Custom Property Naming

All design tokens become CSS custom properties with the naming pattern:

```
--platform-{category}-{name}
```

Examples:
```css
--platform-color-primary:         #2563eb;
--platform-color-text-secondary:  #64748b;
--platform-color-surface:         #ffffff;
--platform-spacing-4:             1rem;
--platform-border-radius-md:      0.375rem;
--platform-elevation-card:        0 1px 3px rgba(0,0,0,0.1);
--platform-density-multiplier:    1;
--platform-theme-mode:            light;
```

---

## Token Resolution Order

When building CSS vars for a theme:

1. **Base semantic colors** from mode (light → `LIGHT_SEMANTIC`, dark → `DARK_SEMANTIC`)
2. **Theme token overrides** from `theme.tokens.colors` (override step 1)
3. **Density tokens** from active `DensitySystemService` config
4. **Mode flag** `--platform-theme-mode`

This gives themes full control: they can override any semantic color without defining all of them.

---

## Built-in Themes

### Light Theme
- Mode: `light`
- Primary: Material Blue 600 (#2563eb)
- Background: Slate 50 (#f8fafc)
- Border radius: 0.375rem

### Dark Theme
- Mode: `dark`
- Primary: Material Blue 400 (#60a5fa) — lighter for dark backgrounds
- Background: Slate 950 (#020617)
- Border radius: 0.375rem

### Brand Theme (iDoo)
- Mode: `light`
- Primary: Violet 700 (#6d28d9) — iDoo brand purple
- Background: Violet 50 (#f5f3ff)
- Border radius: 0.5rem — slightly more rounded

---

## Custom Theme Registration

```typescript
const oceanTheme: Theme = {
  id: 'ocean',
  name: 'Ocean',
  mode: 'dark',
  cssClass: 'platform-theme-ocean',
  tokens: {
    colors: {
      primary: '#0ea5e9',
      'primary-hover': '#0284c7',
      accent: '#06b6d4',
    },
    borderRadius: { default: '0.75rem' },
  },
};

// Option A: ThemeRegistry + ThemeManager
const registry = inject(ThemeRegistryService);
const manager  = inject(ThemeManagerService);
registry.register(oceanTheme);
manager.setTheme('ocean');

// Option B: registerAndApply (convenience)
inject(ThemeManagerService).registerAndApply(oceanTheme);
```

---

## Runtime Theme Switching

```typescript
const manager = inject(ThemeManagerService);

// Switch by ID
manager.setTheme('dark');

// Switch by mode (uses first registered theme for that mode)
manager.setMode('dark');

// Toggle
manager.toggleMode();

// Follow system preference (prefers-color-scheme)
manager.useSystemPreference();
```

---

## How Components Consume the Theme

Business components should NEVER import from `theme/` directly. Instead, they use CSS custom properties in their styles:

```scss
.my-card {
  background: var(--platform-color-surface);
  border: 1px solid var(--platform-color-border);
  border-radius: var(--platform-border-radius-md, 0.375rem);
  box-shadow: var(--platform-elevation-card);
  color: var(--platform-color-text-primary);
}
```

When the theme changes, all components using these variables update automatically — zero component re-renders.

---

## ThemeState Signal

`ThemeManagerService.themeState` is a `Signal<ThemeState>`:

```typescript
interface ThemeState {
  activeThemeId: string;
  mode:          ThemeMode;
  cssVars:       Record<string, string>;  // snapshot of all applied vars
  appliedAt:     string;                  // ISO timestamp
}
```

Consumers can react to theme changes via the signal:

```typescript
effect(() => {
  const state = inject(ThemeManagerService).themeState();
  console.log('Theme changed to', state.activeThemeId);
});
```
