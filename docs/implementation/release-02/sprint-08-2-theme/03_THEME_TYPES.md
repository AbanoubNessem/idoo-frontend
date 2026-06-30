# Theme Types Reference

## ThemeLayer

```typescript
type ThemeLayer =
  | 'platform'      // built-in platform default
  | 'tenant'        // tenant-wide theme
  | 'company'       // company-level override
  | 'user'          // individual user preference
  | 'runtime'       // A/B test / feature-flag override
  | 'accessibility'; // OS forced-colors / high-contrast
```

## ThemeKind (variant)

```typescript
type ThemeKind = 'light' | 'dark' | 'high-contrast' | 'custom' | 'tenant' | 'company' | 'user';
```

## ThemeTokens

All token values are CSS strings. Never raw numeric values.

```typescript
interface ThemeTokens {
  colors:       ThemeColorTokens;      // required
  spacing?:     ThemeSpacingTokens;
  radius?:      ThemeRadiusTokens;
  elevation?:   ThemeElevationTokens;
  breakpoints?: ThemeBreakpointTokens;
  custom?:      Record<string, string>;
}
```

### Color Tokens (required keys)

| Token | Purpose |
|---|---|
| `primary` | Brand primary color |
| `primary-dark` | Darker variant for hover/active |
| `primary-light` | Lighter variant for backgrounds |
| `primary-fg` | Foreground on primary (usually white) |
| `secondary` | Brand secondary color |
| `success / warning / error / info` | Semantic status colors |
| `background` | App background |
| `surface` | Card/panel background |
| `surface-alt` | Alternate surface |
| `text-primary` | Main text color |
| `text-secondary` | Subdued text |
| `text-disabled` | Disabled text |
| `border` | Default border color |
| `border-focus` | Focus ring color |

### Spacing Tokens (`--platform-spacing-*`)

Keys: `1` through `16` (maps to 4px grid: `1=4px`, `2=8px`, ..., `16=64px`)

### Radius Tokens (`--platform-radius-*`)

Keys: `none`, `sm`, `md`, `lg`, `xl`, `full`

### Elevation Tokens (`--platform-elevation-*`)

Keys: `none`, `xs`, `sm`, `md`, `lg`, `xl`

### Breakpoint Tokens (`--platform-breakpoint-*`)

Keys: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`

## ThemeDefinition

Extends `ThemeProfileStub` (from Experience Core) with full token set:

```typescript
interface ThemeDefinition extends ThemeProfileStub {
  kind:      'theme';           // always 'theme'
  variant:   ThemeKind;         // light | dark | …
  tokens:    ThemeTokens;
  parentId?: string;            // inherit tokens from parent
  provider?: string;            // plugin ID
  tags?:     ReadonlyArray<string>;
}
```

## EffectiveTheme

Result of the resolution pipeline — a merged, resolved theme ready to apply:

```typescript
interface EffectiveTheme {
  id:         string;
  name:       string;
  variant:    ThemeKind;
  tokens:     ThemeTokens;    // merged from all layers
  layers:     ReadonlyArray<ThemeLayerSnapshot>;
  resolvedAt: string;         // ISO timestamp
}
```

## Theme Events

| Event | Fired when |
|---|---|
| `theme:changed` | `ThemeEngine.setTheme()` is called |
| `theme:loaded` | An async load completes |
| `theme:registered` | `ThemeEngine.register()` is called |
| `theme:resolved` | The effective theme is (re)computed |

All events flow through `ThemeEngineService.events$` (Observable).
