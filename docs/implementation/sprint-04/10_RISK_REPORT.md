# Sprint 4 — Risk Report

---

## Risk Register

### R-001: CDK Overlay Lifecycle in Tests
**Severity:** Low  
**Probability:** Medium  
**Description:** `OverlayManagerService` depends on CDK `Overlay`, which creates DOM elements. Unit tests for overlay hosts require `OverlayContainer` cleanup or they leave orphaned DOM nodes between tests.  
**Mitigation:** Tests for `DialogHostService`, `DrawerHostService`, etc. should inject and clean up `OverlayContainer` with `afterEach`. Sprint 5 component tests will handle this pattern. Sprint 4 unit tests mock CDK at the service level.

---

### R-002: FocusTrapFactory Requires Rendered DOM
**Severity:** Low  
**Probability:** Low  
**Description:** `FocusManagerService.trapFocus()` requires a real `HTMLElement` in the DOM. Calling it with a detached element will create a trap but focus behavior will be undefined.  
**Mitigation:** All callers (overlay hosts) create the focus trap after CDK Overlay attaches the component, ensuring the element is in the DOM.

---

### R-003: SVG Sanitization is Regex-Based (Not Full Parser)
**Severity:** Medium  
**Probability:** Low  
**Description:** `IconRegistryService` strips `<script>` tags and `on*` attributes via regex. Sophisticated XSS payloads using CSS injection or non-standard event attributes may slip through.  
**Mitigation:** Platform icons are authored by the development team, not end users. External plugin icons should be reviewed before registration. A full DOM-parser-based sanitizer (e.g., DOMPurify) can replace the regex in Sprint 7 (Security Hardening).

---

### R-004: ThemeEngine Writes to `document.documentElement`
**Severity:** Low  
**Probability:** Low  
**Description:** `ThemeEngineService.apply()` without a target writes to `document.documentElement.style`. Multiple concurrent `apply()` calls could interleave. In practice this cannot happen (theme switches are synchronous), but it's a theoretical concern.  
**Mitigation:** `ThemeManagerService.setTheme()` is the only entry point for theme switching. It calls `apply()` exactly once per switch. No concurrency issue in practice.

---

### R-005: BreakpointService Requires `initialize()` Before Use
**Severity:** Low  
**Probability:** Medium  
**Description:** `BreakpointService` and `ResponsiveEngineService` start with a default breakpoint of `lg`. If a consumer reads `responsive.breakpoint()` before `UIContextService.initialize()` is called, they see a stale default.  
**Mitigation:** `UIContextService.initialize()` should be called at application bootstrap (in `app.component.ts` or `APP_INITIALIZER`). Document this as a startup requirement in Sprint 5 integration guide.

---

### R-006: Overlay Stacking Context
**Severity:** Low  
**Probability:** Low  
**Description:** CDK overlays are appended to the `OverlayContainer` element (usually `<body>`). If the consuming application has a CSS stacking context on a parent element with a lower `z-index`, overlays may appear behind other elements.  
**Mitigation:** Instruct consuming teams to not set `z-index` on `<body>` or `<html>`. CDK's default `z-index` of 1000 handles most cases. Custom `panelClass` allows per-overlay z-index override.

---

### R-007: Web Animations API Not Available in JSDOM
**Severity:** Low  
**Probability:** Certain  
**Description:** JSDOM (Karma/Jest test environment) does not implement the Web Animations API (`element.animate()`). Tests that call `MotionEngineService.play()` will hit the `catch` branch and return a noop handle.  
**Mitigation:** The noop handle is a valid return value. Tests verify the handle shape and behavior, not the actual animation. Real animation behavior is verified in browser-based E2E tests (Sprint 8).

---

## Risk Summary

| ID | Severity | Status |
|----|----------|--------|
| R-001 | Low | Open — CDK cleanup pattern documented |
| R-002 | Low | Mitigated by CDK Overlay lifecycle |
| R-003 | Medium | Accepted for Sprint 4; full sanitizer deferred to Sprint 7 |
| R-004 | Low | No real risk — synchronous single-caller pattern |
| R-005 | Low | Documented startup requirement |
| R-006 | Low | CSS stacking context best practice documented |
| R-007 | Low | Mitigated by noop animation handle |
