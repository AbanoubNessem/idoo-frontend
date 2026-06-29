# Sprint 4 — UI Foundation Reference

---

## What the UI Foundation Provides

The UI Foundation is the visual infrastructure layer. It does NOT provide:
- Angular components (`<mat-button>`, etc.)
- Dynamic Forms
- Dynamic Tables
- Business screens

It DOES provide:
- A token-based design system
- Runtime theming with CSS custom properties
- Responsive state signals
- Layout configuration → CSS mapping
- Overlay/dialog/drawer/popover/tooltip infrastructure
- Accessibility utilities (ARIA, focus traps, announcements)
- Animation/motion engine

---

## Layer Map

```
╔══════════════════════════════════════════════════════════════╗
║  Business Modules (tenants, hr, finance, ...)                ║
╠══════════════════════════════════════════════════════════════╣
║  Component Library (Sprint 5) — Angular UI components        ║
╠══════════════════════════════════════════════════════════════╣
║  UI Foundation (Sprint 4) — Infrastructure                   ║
║  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐  ║
║  │ Theme Engine  │  │  Responsive  │  │   Overlay Layer  │  ║
║  │ Design Tokens │  │  Layout Eng  │  │   A11y / Motion  │  ║
║  └───────────────┘  └──────────────┘  └──────────────────┘  ║
╠══════════════════════════════════════════════════════════════╣
║  Dynamic Rendering Engine (Sprint 3)                         ║
╠══════════════════════════════════════════════════════════════╣
║  Metadata Engine (Sprint 2)                                  ║
╠══════════════════════════════════════════════════════════════╣
║  Platform Core — Kernel, Registry, Plugin, SDK (Sprint 1)   ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Design Token System

### Categories
| Category | Examples |
|----------|---------|
| `color` | `color.primary`, `color.surface`, `color.error` |
| `typography` | `typography.body-medium.font-size`, `typography.font-family.system` |
| `spacing` | `spacing.4` → 16px, `spacing.8` → 32px |
| `border-radius` | `border-radius.sm` → 4px, `border-radius.full` → 9999px |
| `elevation` | `elevation.card`, `elevation.dialog` |
| `opacity` | `opacity.50` → 0.5, `opacity.90` → 0.9 |
| `motion` | `motion.duration.medium`, `motion.easing.standard` |
| `density` | `density.multiplier`, `density.touch-target` |

### CSS Variable Pattern
```
--platform-{category}-{name}
```

---

## Responsive System

### Breakpoints
| Key | Range | Device |
|-----|-------|--------|
| xs | 0–639px | mobile |
| sm | 640–767px | mobile |
| md | 768–1023px | tablet |
| lg | 1024–1279px | desktop |
| xl | 1280–1535px | desktop |
| 2xl | 1536px+ | desktop |

### Usage Pattern
```typescript
const responsive = inject(ResponsiveEngineService);
responsive.initialize();

// In templates or effects:
// [class.mobile]="responsive.isMobile()"
// [class.tablet]="responsive.isTablet()"
```

---

## Layout Presets

| Preset | CSS Output |
|--------|-----------|
| `grid` | `display: grid; grid-template-columns: repeat(N, 1fr)` |
| `flex` | `display: flex; flex-direction: row` |
| `stack` | `display: flex; flex-direction: column` |
| `section` | `display: block; max-width: 1280px; padding: ...` |
| `container` | `display: block; max-width: 1280px` |
| `card` | `display: block; padding: ...` |
| `panel` | `display: block; padding: ...` |
| `split` | `display: flex; flex-direction: row; gap: 0` |

---

## Overlay System

### Opening a Dialog
```typescript
const dialog = inject(DialogHostService);
const ref = dialog.open(ConfirmComponent, {
  size: 'sm',
  data: { message: 'Are you sure?' },
  disableClose: false,
});
const result = await ref.afterClosed();
```

### Opening a Drawer
```typescript
const drawer = inject(DrawerHostService);
drawer.open(FilterPanelComponent, {
  position: 'end',
  mode: 'over',
});
```

---

## Accessibility Checklist

| Feature | Service | Method |
|---------|---------|--------|
| Screen reader announcement | AccessibilityService | `announce()` |
| Error announcement | AccessibilityService | `announceError()` |
| Focus trap (modal) | FocusManagerService | `trapFocus(el)` |
| Focus restoration | FocusManagerService | `releaseFocus(el)` |
| ARIA role | AccessibilityService | `setAriaRole(el, 'dialog')` |
| ARIA label | AccessibilityService | `setAriaLabel(el, 'Close')` |
| ARIA expanded | AccessibilityService | `setAriaExpanded(el, true)` |
| Skip link | AccessibilityService | `createSkipLink('main')` |
| Keyboard shortcuts | FocusManagerService | `registerShortcut({...})` |
| Reduced motion | MotionEngineService | `reducedMotion()` signal |
| High contrast | AccessibilityService | `highContrast()` signal |

---

## Motion System

### Named Animations (12 built-in)
- `fade-in` / `fade-out`
- `slide-in-up` / `slide-in-down` / `slide-out-up`
- `slide-in-right` / `slide-in-left`
- `scale-in` / `scale-out`
- `dialog-in`
- `drawer-in-right` / `drawer-in-left`

### Usage
```typescript
const motion = inject(MotionEngineService);
const handle = motion.playNamed(element, 'dialog-in');
await handle.finish();
```

All animations are no-ops when `prefers-reduced-motion: reduce` is active.
