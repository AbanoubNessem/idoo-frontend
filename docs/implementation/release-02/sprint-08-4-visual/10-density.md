# Sprint 8.4 — Density System

## Density Levels

| Level | Use Case |
|---|---|
| compact | Power users, data-dense screens (tables, logs, audits) |
| comfortable | Default — balanced for most enterprise users |
| spacious | Touch-first interfaces, users who prefer generous spacing |

## Component Size Map

| Token | compact | comfortable | spacious |
|---|---|---|---|
| `--platform-density-height-sm` | 24px | 32px | 40px |
| `--platform-density-height-md` | 32px | 40px | 48px |
| `--platform-density-height-lg` | 40px | 48px | 56px |
| `--platform-density-padding-xs` | 2px | 4px | 8px |
| `--platform-density-padding-sm` | 4px | 8px | 12px |
| `--platform-density-padding-md` | 8px | 12px | 16px |
| `--platform-density-padding-lg` | 12px | 16px | 24px |
| `--platform-density-gap-sm` | 4px | 8px | 12px |
| `--platform-density-gap-md` | 8px | 12px | 16px |
| `--platform-density-gap-lg` | 12px | 16px | 24px |

## CSS Data Attribute

```html
<html data-density="comfortable">
```

Use for CSS selector targeting:

```scss
[data-density="compact"] .btn { height: var(--platform-density-height-sm); }
[data-density="spacious"]  .btn { height: var(--platform-density-height-lg); }
.btn { height: var(--platform-density-height-md); }
```

## Switching Density at Runtime

```typescript
engine.setDensity('density-compact');
// → ExperienceEngineService.setDensity() is called
// → CSS vars are reapplied via effect()
// → data-density attribute is updated on <html>
```
