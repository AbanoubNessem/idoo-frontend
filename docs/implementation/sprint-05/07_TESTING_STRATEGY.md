# Sprint 5 — Testing Strategy

---

## Coverage Target

> **> 90%** code coverage across `src/app/core/platform/components/`

---

## Test File Inventory

| File | What It Tests | Test Count |
|------|--------------|-----------|
| `component-registry.service.spec.ts` | Registration, resolution, query, unregister, lazy factory | ~18 |
| `component-metrics.service.spec.ts` | Render recording, averages, error count, reset, snapshot | ~14 |
| `component-diagnostics.service.spec.ts` | Event log, enable/disable, filtering, report generation, cap | ~15 |
| `component-context.service.spec.ts` | Locale, permissions, model, entity, context snapshot, reset | ~14 |
| `component-tokens.service.spec.ts` | Token sets, resolution, density overrides, CSS style generation | ~11 |
| `component-lifecycle.service.spec.ts` | Phase events, instance tracking, destroy, multi-instance, cap | ~13 |
| `component-resolver.service.spec.ts` | Async resolution, caching, pre-resolve, lazy factory, state | ~12 |
| `platform-text-field.component.spec.ts` | Inputs, skeleton, errors, disabled, blur/focus, value, ARIA | ~18 |
| `platform-select-field.component.spec.ts` | Options, selection, skeleton, errors, disabled, validationChange | ~12 |
| `platform-checkbox-field.component.spec.ts` | Check/uncheck, label, hint, errors, disabled, validation | ~13 |
| `platform-json-field.component.spec.ts` | JSON parse, invalid JSON error, skeleton, hint, errors, rawText | ~14 |
| `material-adapter-connector.spec.ts` | connect(), idempotency, adapter mapping, registry registration | ~11 |
| **Total** | | **~155 tests** |

---

## Testing Patterns

### Service Tests

Services are stateless singletons tested with `TestBed.inject()`. No DOM setup required.

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({});
  service = TestBed.inject(ComponentRegistryService);
});
```

### Component Tests

Standalone components are tested with `TestBed.createComponent()` and `NoopAnimationsModule` to prevent animation timing issues.

```typescript
await TestBed.configureTestingModule({
  imports: [PlatformTextFieldComponent, NoopAnimationsModule],
}).compileComponents();
```

Inputs are set via `fixture.componentRef.setInput()` (Angular 22 signal-safe approach).

### Signal Assertions

Signal values are read synchronously in tests — no `fakeAsync` or `tick()` required:

```typescript
fixture.componentRef.setInput('disabled', true);
fixture.detectChanges();
expect(component.isDisabled()).toBeTrue();  // signal read directly
```

### Output/Event Testing

```typescript
let emitted = false;
component.blur.subscribe(() => emitted = true);
(component as any).onBlur();  // call protected method
expect(emitted).toBeTrue();
```

### Template Queries

```typescript
const el = fixture.nativeElement as HTMLElement;
expect(el.querySelector('.pf-skeleton-wrap')).toBeTruthy();
expect(el.querySelector('mat-form-field')).toBeFalsy();
```

---

## What Is Not Tested in Unit Tests

| Concern | Why Deferred |
|---------|-------------|
| Real Angular Material rendering | JSDOM limitations; E2E tests in Sprint 8 |
| MatDatepicker calendar UI | Requires real DOM interactions; E2E |
| File drag-and-drop (`DragEvent`) | Synthetic events; E2E |
| Markdown preview HTML | Basic logic tested; full render in E2E |
| Responsive breakpoint changes | Requires real viewport; E2E |
| RTL directionality rendering | Visual; E2E with BrowserStack |
| Web Animations API | JSDOM noop; unit tests verify handle shape |

---

## Coverage Excluded

The following files are intentionally excluded from coverage reporting:

- `playground/platform-playground.component.ts` — test tool, not production logic
- `docs/` — documentation only

---

## Future Tests (Sprint 6)

When Dynamic Forms implements `hiddenExpression`, `disabledExpression`, and `valueExpression`, integration tests should verify:

1. Field hides when expression evaluates to `true`
2. Field disables when expression evaluates to `true`
3. Field value is computed from model expression
4. Permission check disables field when permissions not met (already unit-tested in base class)
