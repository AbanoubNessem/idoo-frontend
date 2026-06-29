# Sprint 4 — Performance Report

**Module:** UI Foundation

---

## Design for Performance

### 1. Signal-Based Reactivity

All mutable UI state (active theme, breakpoint, density level, motion config) is stored in `signal()`. Angular's change detection only re-renders components that consume a given signal when that signal's value changes. There is no polling or dirty checking.

### 2. CSS Custom Properties for Theming

Theme switching writes CSS custom properties to `document.documentElement` once. No component re-renders are triggered — the browser's cascade applies changes automatically. This makes theme switching O(1) in the number of components on screen.

### 3. CDK BreakpointObserver

`BreakpointService` uses `@angular/cdk/layout`'s `BreakpointObserver`, which batches `matchMedia` events internally. A single subscription covers all 6 breakpoints. Changes are emitted only when a breakpoint boundary is crossed.

### 4. Token Registry — Map Lookup

All token lookups are O(1) Map operations. The `DesignTokenRegistryService` never iterates except for `getAll()` and `getByCategory()`, which are diagnostic/offline operations.

### 5. Icon Registry — Deferred SVG

`IconRegistryService` stores SVG strings (not DOM elements). Parsing to DOM nodes is deferred until the consuming component renders. This avoids unnecessary DOM work at registry time.

### 6. Animation — Web Animations API

`MotionEngineService` uses the native Web Animations API (`element.animate()`), which runs on the compositor thread for CSS transform and opacity animations. JavaScript frame budget is not consumed during animation playback.

### 7. Overlay — CDK Lazy Creation

CDK Overlay panels are created on demand (when `open()` is called) and disposed immediately on close. There are no pre-rendered hidden panels consuming memory or layout.

---

## Benchmark Targets

| Operation | Target |
|-----------|--------|
| Theme switch (CSS vars) | <2 ms |
| Token lookup | <0.01 ms |
| Breakpoint query | <0.5 ms |
| Dialog open (CDK create) | <10 ms |
| Animation start (Web Animations) | <1 ms |
| UIContext snapshot generation | <0.1 ms |

---

## Memory Bounds

| Resource | Bound |
|----------|-------|
| Token registry | Unbounded (platform tokens only, ~100-200 entries typical) |
| Icon registry | Unbounded; SVG strings are small (~1-5 KB each) |
| Animation registry | 12 built-in + N custom |
| Running animations | Unbounded; cleaned up on cancel/finish |
| Open overlays | Unbounded; typically 1-3 at a time |

---

## SSR / Server-Side Rendering Compatibility

All services that access browser APIs are guarded by `isPlatformBrowser(this.platformId)`:

- `ThemeEngineService.apply()` — no-op on server
- `BreakpointService.initialize()` — no-op on server
- `ResponsiveEngineService.initialize()` — no-op on server
- `AccessibilityService.initialize()` — no-op on server
- `MotionEngineService.play()` — returns noop handle on server
- `FocusManagerService.trapFocus()` — returns null on server

This makes the entire UI Foundation compatible with Angular Universal / SSR.
