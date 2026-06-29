# Sprint 5 — Risk Report

---

## Risk Register

### R-001: MatDatepicker Requires a Date Adapter
**Severity:** Low  
**Probability:** Medium  
**Description:** `PlatformDateFieldComponent` imports `MatNativeDateModule` which provides the native `Date` adapter. If the application already provides a different date adapter (e.g., `MatMomentDateModule` for moment.js, or a Luxon adapter), conflicts can occur.  
**Mitigation:** `MatNativeDateModule` is imported inside the standalone component's `imports[]` array — it is scoped to that component and does not conflict with app-level providers. If the application uses a different adapter, replace `MatNativeDateModule` with the appropriate module inside the component.

---

### R-002: Markdown Preview HTML Is Not DOMPurify-Sanitized
**Severity:** Medium  
**Probability:** Low  
**Description:** `PlatformMarkdownFieldComponent` uses `[innerHTML]` to render preview HTML. The content is HTML-encoded before Markdown pattern replacement (preventing raw HTML injection), but a crafted Markdown input could potentially produce unexpected HTML output.  
**Mitigation:** Input undergoes HTML entity encoding (`&`, `<`, `>`) before Markdown transformation. No `<script>` tags, event attributes, or raw HTML can survive this preprocessing. Angular's `SecurityContext.HTML` trust model applies to `[innerHTML]` — if Angular's DomSanitizer is active, it further strips unsafe patterns. For Sprint 7, replace the regex renderer with `marked` + `DOMPurify` for full CommonMark compliance and sanitization.

---

### R-003: Lookup Field Has No Built-In Search Throttle Beyond Debounce
**Severity:** Low  
**Probability:** Low  
**Description:** `PlatformLookupFieldComponent` debounces search with `setTimeout`. If the caller's `setResults()` arrives after the component is destroyed, a signal mutation on a destroyed component occurs.  
**Mitigation:** `setResults()` is a public method — callers should guard with component life-check or use Angular's `takeUntilDestroyed()` on their search observable before calling `setResults()`. Sprint 6 Dynamic Forms will own the lookup data lifecycle and will apply this guard.

---

### R-004: File Drop Zone Uses `URL.createObjectURL()` Without Revoke
**Severity:** Low  
**Probability:** Medium  
**Description:** `PlatformImageFieldComponent` and `PlatformAvatarFieldComponent` call `URL.createObjectURL(file)` to generate preview URLs. If the component is destroyed or the value is replaced without revoking the previous object URL, memory is leaked.  
**Mitigation:** Sprint 5 preview URLs are short-lived (form editing session). The risk is minimal for typical form interactions. Sprint 7 should add an `effect()` in the base image component that revokes the previous object URL when value changes. Alternatively, use `FileReader.readAsDataURL()` (data URI — no revoke needed).

---

### R-005: MaterialAdapterConnector Must Be Called Before First Render
**Severity:** Medium  
**Probability:** Low  
**Description:** If the Rendering Engine renders a field before `MaterialAdapterConnector.connect()` is called, it will use the Sprint 3 placeholder `FieldDisplayComponent`. Fields will render as empty boxes.  
**Mitigation:** Document that `connect()` must be called in `AppComponent`'s constructor or an `APP_INITIALIZER`. The Angular DI system guarantees `APP_INITIALIZER` completes before the first component renders. Add a runtime guard in `connect()` that warns if called after any field has already been rendered.

---

### R-006: `model()` Signal and Angular Lifecycle
**Severity:** Low  
**Probability:** Low  
**Description:** `BaseFieldComponent` uses `effect()` to emit `validationChange` whenever `validationResult` changes. An `effect()` that calls `output.emit()` during initialization could trigger unexpected `ExpressionChangedAfterItHasBeenChecked` errors if the parent component reads the output during its `AfterViewInit`.  
**Mitigation:** The `effect()` uses `untracked()` for the emit call — it does not create a reactive dependency on the output. Angular 22's `effect()` scheduling ensures this runs outside the current change detection cycle.

---

### R-007: Chip Field Separator Keys Conflict With Form Submission
**Severity:** Low  
**Probability:** Low  
**Description:** `PlatformChipFieldComponent` listens to `ENTER` as a chip separator key. If the chip field is inside an HTML `<form>`, pressing Enter could submit the form before the chip is added.  
**Mitigation:** The `MatChipInput` directive calls `event.preventDefault()` on separator key events. Business modules that embed chip fields in a `<form>` element should use `(submit)` event binding rather than the native form submit behavior.

---

## Risk Summary

| ID | Severity | Status |
|----|----------|--------|
| R-001 | Low | Mitigated — scoped import, documented |
| R-002 | Medium | Accepted for Sprint 5; DOMPurify deferred to Sprint 7 |
| R-003 | Low | Mitigated by Sprint 6 lookup data lifecycle |
| R-004 | Low | Accepted for Sprint 5; URL.revokeObjectURL deferred to Sprint 7 |
| R-005 | Medium | Mitigated by documented startup requirement + runtime warning |
| R-006 | Low | Mitigated by `untracked()` in effect |
| R-007 | Low | Mitigated by MatChipInput preventDefault |
