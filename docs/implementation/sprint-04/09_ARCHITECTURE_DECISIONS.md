# Sprint 4 — Architecture Decisions

---

## ADR-001: Angular CDK as the Only UI Dependency

**Decision:** The entire `ui/` module depends on `@angular/cdk`, never on `@angular/material`.

**Context:** Business modules should be able to swap Angular Material for PrimeNG or a custom component library without touching platform services. If platform services import from `@angular/material`, that swap becomes impossible.

**Consequences:**
- Overlay, focus trapping, and live announcements use CDK primitives
- CSS custom properties handle visual styling — no Material theming required
- Sprint 5 (Component Library) will import both CDK and Material, but only at the component level

---

## ADR-002: CSS Custom Properties for Theme Application

**Decision:** Themes are applied by writing CSS custom properties to `document.documentElement.style`. No JS-in-CSS or styled-components approach.

**Context:** CSS custom properties cascade through the DOM naturally, work in all modern browsers, and are zero-cost to update (no component re-renders). They also work with Angular Material's theming when Material is adopted in Sprint 5.

**Consequences:**
- Theme switching is O(1) regardless of DOM complexity
- Theme variables are accessible to any CSS (not just Angular components)
- Server-side rendering: `apply()` is a no-op; components read defaults from their static stylesheets

---

## ADR-003: Signal-Based UI State

**Decision:** All reactive UI state (active theme, breakpoint, density, motion config) uses Angular signals (`signal()`, `computed()`).

**Context:** The platform is Angular 22. Signals are the preferred reactive primitive. Using `BehaviorSubject` would require RxJS subscriptions everywhere and potential memory leaks.

**Consequences:**
- `effect()` in components reacts to theme/breakpoint changes automatically
- No `.subscribe()` / `.unsubscribe()` patterns needed for UI state
- Testing: signals are synchronously readable via `signal()`

---

## ADR-004: 3-Service Theme Architecture

**Decision:** Theme concerns are split across three services: `ThemeRegistryService`, `ThemeEngineService`, `ThemeManagerService`.

**Context:** A monolithic `ThemeService` would violate SRP. Registry (what themes exist), Engine (how to apply), and Manager (which is active) are distinct concerns.

**Consequences:**
- `ThemeEngineService` can be tested in isolation without registry concerns
- `ThemeRegistryService` is a pure data store — no side effects
- `ThemeManagerService` is the single coordinator — it's the only service business code needs to inject

---

## ADR-005: Density as a First-Class Design Dimension

**Decision:** `DensitySystemService` is a top-level service alongside color and typography.

**Context:** Enterprise ERP systems serve different user profiles: data-entry operators who want compact density, executives who want spacious layouts, tablet users who need larger touch targets. Density should be configurable per deployment or even per user preference.

**Consequences:**
- `density.multiplier` token applies to ALL spacing computations
- `density.touch-target` is available to every interactive component
- Sprint 5 components use `DensitySystemService.scale()` for their internal spacing

---

## ADR-006: FocusTrap Stack (Not Single Trap)

**Decision:** `FocusManagerService` maintains a stack of `FocusTrap` instances, not a single one.

**Context:** Overlays can be nested (e.g., a confirm dialog inside a main dialog). Each overlay needs its own focus trap, and releasing the top overlay should restore focus to the underlying overlay (not the page background).

**Consequences:**
- `releaseFocus(element)` pops the trap for that element and restores focus to the previously focused element (before the trap was created)
- Stack size is proportional to open overlay depth — typically 1-3

---

## ADR-007: Reduced Motion Propagates to All Layers

**Decision:** `AccessibilityService.reducedMotion` is injected by `MotionEngineService`. The `UIContextService.reducedMotion` computed signal derives from the engine.

**Context:** `prefers-reduced-motion: reduce` must affect all animation layers — not just CSS transitions. The Web Animations API, overlay animations, and loading spinners all need to check the same source.

**Consequences:**
- Single source of truth for reduced-motion state
- `MotionEngineService.reducedMotion()` returns `true` if EITHER the media query matches OR `setReducedMotion(true)` was called explicitly
- Explicit override allows programmatic testing or accessibility settings to force reduced motion

---

## ADR-008: Icon SVG Sanitization at Registration Time

**Decision:** `IconRegistryService.register()` sanitizes SVG content (strip `<script>` and `on*` attributes) immediately.

**Context:** SVG XSS is a real attack vector when icons can be registered from plugin code. Sanitizing at registration time means the registry always contains safe content.

**Consequences:**
- No need for consumers to sanitize SVG before rendering via `innerHTML`
- Sanitization is simple (regex-based) — not a full HTML parser, but sufficient for platform-controlled icons
- Malicious plugin code trying to register script-injecting icons will have those stripped silently
