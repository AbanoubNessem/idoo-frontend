# Sprint 6.5 — Platform Playground Components

## CustomerDemoComponent

**File:** `src/app/features/demo/customer-demo/customer-demo.component.ts`  
**Route:** `/demo/customer`

The primary vertical slice demo. Demonstrates a fully functional customer form with zero custom form code.

### Key Features

- **Mode toggle** — Switch between Create and Edit form variants
- **Permission toggle** — Grant/revoke `can_view_financial` and `can_set_tax_status` to show field visibility driven by permission metadata
- **Undo/Redo toggle** — Enables the history toolbar on the form
- **Live model panel** — Right-side panel showing the current form model as JSON (reactive via `valueChanged` output)
- **Submit result panel** — Appears after successful submission

### Architecture Compliance

```
CustomerDemoComponent
  ↓ imports: [DynamicFormComponent]
  ↓ uses:    CustomerFormDef (from defineForm())
  ↓ uses:    CustomerEntity.displayName (metadata only)
  ↓ uses:    CUSTOMER_INITIAL_MODEL (mock data)
  ↓ uses:    DemoPermissionChecker (permission toggle)
  ↓ NEVER:   ReactiveFormsModule, FormBuilder, @angular/material
```

## ComponentExplorerComponent

**File:** `src/app/features/demo/component-explorer/component-explorer.component.ts`  
**Route:** `/demo/components`

Showcases all 19 platform field component types rendered via the Dynamic Form Engine.

The showcase form (`SHOWCASE_FORM`) is defined inline using `defineForm()` with three tabs:
- **Text Inputs** — text, number, currency, textarea, markdown, json
- **Pickers & Selects** — select, date, time, color, chip, autocomplete
- **Toggles & Media** — checkbox, switch, badge, file, image, avatar

All components are resolved via `ComponentResolverService → ComponentRegistryService → MaterialAdapterConnector`. Zero direct component imports in the demo layer.

## ArchitectureInspectorComponent

**File:** `src/app/features/demo/architecture-inspector/architecture-inspector.component.ts`  
**Route:** `/demo/inspector`

Runtime constraint audit panel with 10 automated checks:

1. Material Adapter is connected (not bypassed)
2. Platform Components registered via ComponentRegistry
3. Customer form defined via `defineForm()` (no custom component)
4. Customer entity defined via `defineEntity()` (metadata-driven)
5. Dynamic Form Engine present
6. Form registered in DynamicFormRegistry before render
7. No Angular Material imports in demo layer
8. No direct Angular Forms in demo
9. No business logic in Dynamic Form Engine
10. Everything generated from metadata (tabs/sections/fields)

Shows live count of registered components, active instances, registered forms.

## MetadataExplorerComponent

**File:** `src/app/features/demo/metadata-explorer/metadata-explorer.component.ts`  
**Route:** `/demo/metadata`

Four-tab browser for all customer metadata:
- **Entity** — all 22 fields in a sortable table
- **Forms** — CustomerFormDef and CustomerEditFormDef details
- **Lookups** — Country, Industry, AccountManager lookup definitions
- **Actions** — Save, Discard, Delete, SaveDraft action definitions

## RegistryExplorerComponent

**File:** `src/app/features/demo/registry-explorer/registry-explorer.component.ts`  
**Route:** `/demo/registry`

Live view of `ComponentRegistryService.all()`. Features:
- Search by key or field type
- Filter by category
- Shows registration status (resolved vs lazy)
- Displays version, tags, description per entry

## RuntimeExplorerComponent

**File:** `src/app/features/demo/runtime-explorer/runtime-explorer.component.ts`  
**Route:** `/demo/runtime`

Dashboard for active `DynamicFormEngine` instances:
- Summary stats: instance count, total events, diagnostics on/off
- Per-instance card: phase, valid/invalid, dirty/pristine
- Metrics per instance: renderCount, validationCount, submitCount, fieldCount, initDurationMs
- Last 5 events per instance
- Toggle diagnostics / Destroy All buttons

## RuntimeEventLogComponent

**File:** `src/app/features/demo/runtime-event-log/runtime-event-log.component.ts`  
**Route:** `/demo/events`

Full event stream from `DynamicFormEventsService`. Features:
- Filter by event type (17 types)
- Pause/resume live updates
- Clear all events
- Dark terminal theme with color-coded event types
- Payload preview per event
