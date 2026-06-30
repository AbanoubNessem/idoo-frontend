# Sprint 8.4 — Constants & Built-in Profiles

File: `src/app/core/platform/experience/visual/visual.constants.ts`

## CSS Custom Property Prefixes

| Prefix | Applied to |
|---|---|
| `--platform-font-` | Typography (family, scale, weights, line-heights) |
| `--platform-density-` | Density (heights, padding, gaps) |
| `--platform-motion-` | Motion (durations, easings) |
| `--platform-a11y-` | Accessibility flags (as string values) |
| `--platform-icon-` | Icon pack (pack id, prefix, CDN URL) |

## Default Profile IDs

| Constant | Value |
|---|---|
| `DEFAULT_TYPOGRAPHY_ID` | `'typography-default'` |
| `DEFAULT_DENSITY_ID` | `'density-comfortable'` |
| `DEFAULT_ICON_PACK_ID` | `'material-symbols'` |
| `DEFAULT_MOTION_ID` | `'motion-normal'` |
| `DEFAULT_ACCESSIBILITY_ID` | `'accessibility-default'` |

## Built-in Typography Profiles

| ID | Notes |
|---|---|
| `typography-default` | Inter, 14px base, Latin |
| `typography-arabic` | Cairo/Inter, 15px base, Arabic + Latin |
| `typography-large` | Inter, 16px base, accessibility-sized |

## Built-in Density Profiles

| ID | Level | heightMd |
|---|---|---|
| `density-compact` | compact | 32px |
| `density-comfortable` | comfortable | 40px |
| `density-spacious` | spacious | 48px |

## Built-in Icon Packs

| ID | Type | CDN |
|---|---|---|
| `material-symbols` | material-symbols | Google Fonts |
| `heroicons` | heroicons | (no CDN — SVG sprite) |
| `font-awesome` | font-awesome | (no CDN stub) |
| `custom` | custom | tenant-provided |

## Built-in Motion Profiles

| ID | reducedMotion | durationNormal |
|---|---|---|
| `motion-normal` | false | 200ms |
| `motion-reduced` | true | 0ms |
| `motion-slow` | false | 400ms |

## Built-in Accessibility Profiles

| ID | highContrast | reducedMotion | largeTypography | focusVisible |
|---|---|---|---|---|
| `accessibility-default` | ✗ | ✗ | ✗ | ✗ |
| `accessibility-high-contrast` | ✓ | ✗ | ✗ | ✓ |
| `accessibility-full` | ✓ | ✓ | ✓ | ✓ |
