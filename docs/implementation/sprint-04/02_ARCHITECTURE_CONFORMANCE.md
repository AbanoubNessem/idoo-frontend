# Sprint 4 — Architecture Conformance Report

**Sprint:** 4 — UI Foundation  
**Date:** 2026-06-29

---

## SOLID Principles

### Single Responsibility
- `DesignTokenRegistryService` — token CRUD only
- `ThemeEngineService` — CSS var application only (no state)
- `ThemeManagerService` — active theme state only (delegates application to engine)
- `AnimationRegistryService` — animation definition storage only
- `MotionEngineService` — animation playback only
- `AccessibilityService` — ARIA helpers + announcements only

### Open/Closed
- `ThemeRegistryService.register()` — add custom themes without modifying core
- `AnimationRegistryService.register()` — add custom animations without modifying core
- `IconRegistryService.register()` — add icon packs without modifying core
- `LayoutEngineService.register()` — add named layout configs without modifying core
- `AdapterManagerService.registerAdapter()` (from Sprint 3) — adapter extensibility

### Liskov Substitution
- All overlay hosts (`DialogHost`, `DrawerHost`, `PopoverHost`, `TooltipHost`) return `OverlayRef<R>` — interchangeable from caller perspective
- `Theme` interface is the contract — any object satisfying it is a valid theme

### Interface Segregation
- Overlay hosts expose only the methods relevant to their type — `DialogHost` has `open/closeAll/isOpen`, not drawer-specific methods
- `UIContextService` exposes only computed signals — no mutation methods

### Dependency Inversion
- `UIContextService` depends on abstractions (`ThemeManagerService`, `ResponsiveEngineService`, etc.), not DOM APIs directly
- `MotionEngineService` depends on `AnimationRegistryService` (abstraction), not on inline animation specs
- `ThemeEngineService` uses `PLATFORM_ID` + `isPlatformBrowser()` to invert browser dependency

---

## Angular CDK vs Angular Material

| Feature | Tool Used | Rationale |
|---------|-----------|-----------|
| Breakpoint detection | `@angular/cdk/layout` BreakpointObserver | Framework-level, no Material dep |
| Overlay positioning | `@angular/cdk/overlay` | Platform primitive, not Material-specific |
| Focus trapping | `@angular/cdk/a11y` FocusTrapFactory | Accessibility standard |
| Screen reader | `@angular/cdk/a11y` LiveAnnouncer | WCAG 2.1 requirement |
| Portal hosting | `@angular/cdk/portal` ComponentPortal | Generic component projection |

No `@angular/material` import exists in any file under `src/app/core/platform/ui/`.

---

## No Circular Dependencies

Dependency order (strict DAG):

```
ui.types.ts
  ↓
tokens/* (DesignTokenRegistry, ColorSystem, TypographySystem, SpacingSystem, DensitySystem)
  ↓
theme/* (ThemeRegistry → ThemeEngine → ThemeManager)
  ↓
[parallel layers]
icons/            responsive/       layout/
  ↓                 ↓                ↓
overlay/*    accessibility/*    motion/*
  ↓               ↓              ↓
          UIContextService
```

---

## Angular Conventions

| Convention | Status |
|-----------|--------|
| `@Injectable({ providedIn: 'root' })` | ✅ All 22 services |
| `inject()` for DI | ✅ All services |
| `signal()` / `computed()` | ✅ Active theme, breakpoint, density, motion config |
| `PLATFORM_ID` + `isPlatformBrowser` | ✅ ThemeEngine, BreakpointService, A11y, Motion |
| `OnDestroy` cleanup | ✅ BreakpointService, ResponsiveEngineService |
| No `ngDoCheck` | ✅ |
| No impure pipes | ✅ (no pipes in this layer) |

---

## Violations

None detected.
