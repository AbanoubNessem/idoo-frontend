# Sprint 6 — Diagnostics & Metrics

## DynamicFormDiagnosticsService

Provides a structured event log for debugging and auditing form lifecycle events. Disabled by default to have zero performance impact in production.

### Enabling

```typescript
const engine = inject(DynamicFormEngine);
engine.enableDiagnostics();   // start recording
engine.disableDiagnostics();  // stop + clear log
```

### Event Types

| Type | Description |
|------|-------------|
| `init` | Form initialized |
| `render` | Field rendered |
| `validate` | Validation run |
| `submit` | Form submitted |
| `error` | Error occurred |
| `lifecycle` | Phase transition |
| `expression` | Expression evaluated |
| `autosave` | Autosave start/complete/error |

### Usage

```typescript
const diag = inject(DynamicFormDiagnosticsService);
diag.enable();

// Record manually
diag.record({ type: 'render', formId: 'f1', fieldKey: 'name', message: 'rendered', durationMs: 3 });

// Use helpers
diag.recordError('f1', 'Lookup failed', { endpoint: '/api/search' });

// Generate report
const report = diag.generateReport('f1');
// report.totalEvents, report.errorCount, report.avgRenderMs
```

### Signals

```typescript
diag.enabled()       // Signal<boolean>
diag.eventCount()    // Signal<number>
diag.latestErrors()  // Signal<FormDiagEvent[]> (last 10 errors)
```

### Cap

Maximum 500 events in memory. Oldest events are dropped when the cap is reached.

---

## DynamicFormMetricsService

Tracks performance and usage metrics per form ID. Always active (unlike diagnostics).

### Initialization

`DynamicFormFactoryService` calls `metrics.init(formId, fieldCount, initDurationMs, resolveDurationMs)` when creating an instance.

### Reading Metrics

```typescript
const metrics = inject(DynamicFormMetricsService);
const m = metrics.get('form-id');
// m.initDurationMs, m.resolveDurationMs, m.fieldCount
// m.renderCount, m.validationCount, m.submitCount, m.errorCount
// m.firstRenderAt, m.lastActivityAt
```

### Reactive Snapshot

```typescript
metrics.snapshot()  // Signal<Record<string, FormRenderMetrics>>
```

### Cleanup

```typescript
metrics.reset('form-id');  // remove specific form
metrics.reset();            // remove all
```

---

## DynamicFormLifecycleService

Tracks which phase each form instance is in. Useful for dashboards and monitoring.

### Signals

```typescript
lifecycle.activeInstances()  // Signal<Map<string, FormLifecyclePhase>>
lifecycle.instanceCount()    // Signal<number>
lifecycle.eventCount()       // Signal<number>
```

### Phase Transitions Called By Factory

```
onCreated → onInitializing → onInitialized → 
  onValidating → (onValid | onInvalid) → 
    onSubmitting → onSubmitted → 
      onDestroyed
```

### Filtering

```typescript
lifecycle.forForm('f1')  // all events for form f1
lifecycle.getPhase('f1') // current phase or null
```
