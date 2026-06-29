# Sprint 4 — Dependency Graph

**Module:** `src/app/core/platform/ui/`

---

## Full Dependency Map

```
ui.types.ts                         (no external deps)
│
├── tokens/
│   ├── design-token-registry.service.ts   (@angular/core)
│   ├── color-system.service.ts            (@angular/core, design-token-registry)
│   ├── typography-system.service.ts       (@angular/core, design-token-registry)
│   ├── spacing-system.service.ts          (@angular/core, design-token-registry)
│   └── density-system.service.ts          (@angular/core, design-token-registry)
│
├── theme/
│   ├── themes/
│   │   ├── light.theme.ts                 (ui.types)
│   │   ├── dark.theme.ts                  (ui.types)
│   │   └── brand.theme.ts                 (ui.types)
│   ├── theme-registry.service.ts          (@angular/core, themes/*)
│   ├── theme-engine.service.ts            (@angular/core, @angular/common,
│   │                                       color-system, spacing-system,
│   │                                       typography-system, density-system)
│   └── theme-manager.service.ts           (@angular/core, theme-registry, theme-engine)
│
├── icons/
│   └── icon-registry.service.ts           (@angular/core, ui.types)
│
├── responsive/
│   ├── breakpoint.service.ts              (@angular/core, @angular/common,
│   │                                       @angular/cdk/layout, rxjs)
│   └── responsive-engine.service.ts       (@angular/core, @angular/common,
│                                           breakpoint.service, rxjs)
│
├── layout/
│   └── layout-engine.service.ts           (@angular/core, responsive-engine)
│
├── overlay/
│   ├── overlay-manager.service.ts         (@angular/core, @angular/cdk/overlay,
│   │                                       @angular/cdk/portal)
│   ├── dialog-host.service.ts             (@angular/core, overlay-manager)
│   ├── drawer-host.service.ts             (@angular/core, overlay-manager)
│   ├── popover-host.service.ts            (@angular/core, @angular/cdk/overlay,
│   │                                       @angular/cdk/portal, overlay-manager)
│   └── tooltip-host.service.ts            (@angular/core, @angular/common,
│                                           @angular/cdk/overlay, @angular/cdk/portal)
│
├── accessibility/
│   ├── focus-manager.service.ts           (@angular/core, @angular/common,
│   │                                       @angular/cdk/a11y, ui.types)
│   └── accessibility.service.ts           (@angular/core, @angular/common,
│                                           @angular/cdk/a11y, ui.types)
│
├── motion/
│   ├── animation-registry.service.ts      (@angular/core, ui.types)
│   └── motion-engine.service.ts           (@angular/core, @angular/common,
│                                           animation-registry, accessibility.service)
│
└── ui-context.service.ts                  (@angular/core,
                                            theme-manager, density-system,
                                            responsive-engine, accessibility,
                                            motion-engine)
```

---

## External Package Summary

| Package | Used By |
|---------|---------|
| `@angular/core` | All services |
| `@angular/common` | ThemeEngine, Breakpoint, Responsive, FocusManager, A11y, Motion |
| `@angular/cdk/layout` | BreakpointService |
| `@angular/cdk/overlay` | OverlayManager, PopoverHost, TooltipHost |
| `@angular/cdk/a11y` | FocusManager, AccessibilityService |
| `@angular/cdk/portal` | OverlayManager, PopoverHost, TooltipHost |
| `rxjs` | BreakpointService, ResponsiveEngine, RenderEventsService (Sprint 3) |

**No `@angular/material` imports.**

---

## No Circular Dependencies

All dependencies flow in one direction:

```
types → tokens → theme → [icons, responsive, layout, overlay, a11y, motion] → ui-context
```

No layer imports from a layer above it. No sibling layers cross-import each other (except motion → a11y, which flows downward, not upward).
