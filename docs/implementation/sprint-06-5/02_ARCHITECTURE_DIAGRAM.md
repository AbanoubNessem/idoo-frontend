# Sprint 6.5 — Architecture Diagram

## Data Flow

```
defineEntity() / defineForm() / defineLookup() / defineAction()
        │
        ▼
  Customer Metadata Layer (src/app/features/demo/customer/)
        │
        ▼
  DemoShellComponent  ──── router-outlet ────────────────────────┐
  (layout, nav, events)                                          │
                                                                  │
  ┌───────────────────────────────────────────────────────────────┤
  │                                                               │
  │  CustomerDemoComponent                                        │
  │    └── <dynamic-form [definition]="CustomerFormDef">         │
  │              │                                               │
  │              ▼                                               │
  │        DynamicFormEngine (providedIn: root)                  │
  │              │  .createForm(definition, model, context)       │
  │              ▼                                               │
  │        DynamicFormFactoryService                             │
  │              │  creates: DynamicFormInstance                  │
  │              │    → DynamicFormState (signals)               │
  │              │    → DynamicFormHistory (undo/redo)           │
  │              │    → DynamicFormContext (eval context)        │
  │              ▼                                               │
  │        DynamicFormResolverService                            │
  │              │  resolves: ComponentType per field            │
  │              ▼                                               │
  │        ComponentResolverService                              │
  │              │  delegates to:                                │
  │              ▼                                               │
  │        MaterialAdapterConnector  (adapter layer)             │
  │              │  maps fieldType → PlatformFieldComponent      │
  │              ▼                                               │
  │        ComponentRegistryService                              │
  │              │  returns: Type<PlatformTextFieldComponent>     │
  │              │           Type<PlatformSelectFieldComponent>   │
  │              │           ... (19 field types)                │
  │              ▼                                               │
  │        ResolvedFormModel                                     │
  │              │  passed into:                                 │
  │              ▼                                               │
  │        DynamicFormComponent (renders)                        │
  │              │  @switch layout                               │
  │              ├── FormTabsContainerComponent (tabs layout)    │
  │              ├── FormSectionComponent (each section)         │
  │              │     └── FormFieldHostComponent (each field)   │
  │              │     └── FormArrayComponent (arrays)           │
  │              │           └── FormFieldHostComponent (items)  │
  │              └── FormErrorSummaryComponent                   │
  │                                                               │
  │  Injection Tokens (route-level providers in DEMO_ROUTES):    │
  │    FORM_EXPRESSION_EVALUATOR → DemoExpressionEvaluator       │
  │    FORM_FIELD_VALIDATOR      → DemoValidator                 │
  │    FORM_PERMISSION_CHECKER   → DemoPermissionChecker         │
  │    FORM_QUERY_PROVIDER       → DemoQueryProvider             │
  │                                                               │
  └───────────────────────────────────────────────────────────────┘
```

## Separation of Concerns

| Layer             | Responsibility                              | No…                                 |
|-------------------|---------------------------------------------|-------------------------------------|
| Metadata Layer    | Describe shape, fields, rules, permissions  | No logic, no HTTP, no components    |
| Platform API      | Type-safe factory functions                 | No framework deps                   |
| Dynamic Form Engine | Orchestrate state, lifecycle, events     | No rendering, no business logic     |
| Form Components   | Render resolved model using host component  | No direct Material, no business logic |
| Field Components  | Render single field type                    | No Material API exposure            |
| Material Adapter  | Bridge platform ↔ Material                 | No consumer awareness of Material   |
| Demo Mock Layer   | Provide test implementations of tokens      | No real API calls                   |

## Injection Token Override Pattern

```
providedIn: 'root' (noop defaults)
       │
       └── DEMO_ROUTES providers: [
             { provide: FORM_EXPRESSION_EVALUATOR, useClass: DemoExpressionEvaluator },
             { provide: FORM_FIELD_VALIDATOR,      useClass: DemoValidator },
             { provide: FORM_PERMISSION_CHECKER,   useClass: DemoPermissionChecker },
             { provide: FORM_QUERY_PROVIDER,       useClass: DemoQueryProvider },
           ]
           ↑ Override for /demo subtree only
```
