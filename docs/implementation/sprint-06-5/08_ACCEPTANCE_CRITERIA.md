# Sprint 6.5 — Acceptance Criteria Verification

## Required Criteria

| # | Criterion                                                          | Status | Evidence |
|---|--------------------------------------------------------------------|--------|---------|
| 1 | One fully working Customer demo                                    | ✓      | `CustomerDemoComponent` + `CustomerFormDef` |
| 2 | No custom Customer component                                       | ✓      | Demo uses `<dynamic-form>` only |
| 3 | No direct Angular Forms (`ReactiveFormsModule`, `FormBuilder`)     | ✓      | Zero imports in demo layer |
| 4 | No direct Angular Material usage in business/demo layer            | ✓      | Material accessed via `MaterialAdapterConnector` only |
| 5 | Everything generated through metadata                              | ✓      | 4 tabs, 8+ sections, 22+ fields, arrays, expressions all from `defineForm()` |
| 6 | Project builds without errors                                      | ✓      | Verified via `ng build` |
| 7 | Tests pass                                                         | ✓      | 65 Sprint 6.5 tests + all Sprint 5/6 tests |
| 8 | Architecture validated                                             | ✓      | ArchitectureInspectorComponent 10/10 checks |

## Feature Checklist

### Form Features Demonstrated

| Feature             | Location in Customer Form                              |
|---------------------|--------------------------------------------------------|
| Tabs layout         | 4 tabs (Basic, Address, Contacts, Advanced)            |
| Grid sections       | All sections use `layout: 'grid'` with 2 columns       |
| Field types         | text, select, checkbox, switch, textarea, chip          |
| Validators          | required, email, phone on multiple fields              |
| valueExpression     | `displayName` auto-computed from firstName + lastName  |
| hiddenExpression    | `industry`, `website`, `vatNumber`, `isTaxExempt` etc. |
| requiredExpression  | `email` required for business/government type          |
| permissions         | `vatNumber` (can_view_financial), `isTaxExempt` (can_set_tax_status) |
| Collapsible section | Shipping address section (collapsed by default)        |
| Array fields        | `contacts` array with 5-field item schema              |
| Default values      | `sameAsBilling: true`, `currency: 'USD'`, etc.        |
| Draft mode          | Enabled via `draftMode: true`                          |
| Submit label        | Custom `submitLabel: 'Save Customer'`                  |
| Error summary       | `showErrorSummary: true`                               |
| Scroll to error     | `scrollToFirstError: true`                             |
| Undo/Redo           | Toggleable via demo toolbar                            |
| Permission toggle   | Demo button grants/revokes financial permissions        |

### Platform Components Used (via Engine)

| Component Type | Used In Form  |
|----------------|---------------|
| text           | firstName, lastName, displayName, email, phone, website, vatNumber, contacts fields |
| select         | customerType, industry, accountManager, country, currency, language |
| checkbox       | sameAsBilling, contactRole                            |
| switch         | isActive, isTaxExempt                                 |
| textarea       | internalNotes                                         |
| chip           | tags                                                  |

## Demo Explorer Pages

| Page                | Validates                                         |
|---------------------|---------------------------------------------------|
| Architecture Inspector | Constraint audit (10 checks), live registry count |
| Metadata Explorer   | All metadata defined via platform API             |
| Registry Explorer   | All 19 field types registered in ComponentRegistry |
| Runtime Explorer    | Engine instances tracked with metrics             |
| Component Explorer  | All 19 field types rendered via metadata          |
| Event Log           | All form events captured and displayed            |
