# Sprint 6.5 — Demo Shell & Navigation

## DemoShellComponent

**File:** `src/app/features/demo/demo-shell/demo-shell.component.ts`

The outer layout wrapper for the entire Sprint 6.5 demo. It provides:

1. **Top bar** — brand name, sprint badge, architecture category chips
2. **Sidebar navigation** — 7 nav links to demo sections
3. **Main content area** — `<router-outlet>` for lazy-loaded demo pages
4. **Bottom event strip** — live feed of the last 10 form events from `DynamicFormEventsService`

### Navigation Structure

| Path               | Component                     | Purpose                           |
|--------------------|-------------------------------|-----------------------------------|
| `/demo/customer`   | CustomerDemoComponent         | Live customer form demo           |
| `/demo/inspector`  | ArchitectureInspectorComponent| Platform runtime constraint check |
| `/demo/metadata`   | MetadataExplorerComponent     | Entity / form / lookup / action   |
| `/demo/registry`   | RegistryExplorerComponent     | ComponentRegistry browser         |
| `/demo/runtime`    | RuntimeExplorerComponent      | Active instances + metrics        |
| `/demo/components` | ComponentExplorerComponent    | All 19 field components showcase  |
| `/demo/events`     | RuntimeEventLogComponent      | Full event stream                 |

### Bottom Event Strip

- Reads `DynamicFormEventsService.latestEvents` (reactive signal, last 10 events)
- Shows: timestamp, event type, form ID (last 8 chars)
- Color-coded by event category: blue (value changes), green (submit/ready), red (errors/validation), orange (other)
- Clear button calls `eventsService.clear()`

### Route-Level Providers

All demo token overrides are provided at the `DemoShellComponent` route level in `DEMO_ROUTES`. This means the noop defaults (from `form.tokens.ts`) are only overridden within the `/demo` subtree:

```typescript
providers: [
  { provide: FORM_EXPRESSION_EVALUATOR, useClass: DemoExpressionEvaluator },
  { provide: FORM_FIELD_VALIDATOR,      useClass: DemoValidator },
  { provide: FORM_PERMISSION_CHECKER,   useClass: DemoPermissionChecker },
  { provide: FORM_QUERY_PROVIDER,       useClass: DemoQueryProvider },
  MaterialAdapterConnector,
]
```
