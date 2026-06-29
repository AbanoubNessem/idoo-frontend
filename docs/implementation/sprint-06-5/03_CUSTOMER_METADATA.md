# Sprint 6.5 — Customer Metadata Specification

## Customer Entity (`customer.entity.ts`)

Defined via `defineEntity()`. 22 fields covering the complete customer data model.

| Field           | Type      | Required | Validators      | Notes                          |
|-----------------|-----------|----------|-----------------|--------------------------------|
| firstName       | text      | ✓        | required        |                                |
| lastName        | text      | ✓        | required        |                                |
| displayName     | text      |          |                 | Computed from first + last name |
| customerType    | select    | ✓        | required        | individual / business / government |
| industry        | select    |          |                 | Hidden for individuals         |
| email           | text      |          | email           | Required for business/government |
| phone           | text      |          | phone           |                                |
| website         | text      |          |                 | Hidden for individuals         |
| vatNumber       | text      |          |                 | Permission: can_view_financial |
| street          | text      |          |                 |                                |
| city            | text      |          |                 |                                |
| state           | text      |          |                 |                                |
| postcode        | text      |          |                 |                                |
| country         | select    |          |                 | 20 countries via MOCK_COUNTRIES |
| sameAsBilling   | checkbox  |          |                 | Default: true                  |
| currency        | select    |          |                 | Default: USD                   |
| language        | select    |          |                 | Default: en                    |
| isActive        | switch    |          |                 | Default: true                  |
| isTaxExempt     | switch    |          |                 | Permission: can_set_tax_status |
| internalNotes   | textarea  |          |                 |                                |
| tags            | chip      |          |                 | Max 10 chips                   |
| accountManager  | select    |          |                 | From MOCK_ACCOUNT_MANAGERS     |

## Customer Form (`customer.form.ts`)

Defined via `defineForm()`. Layout: **tabs** (4 tabs).

### Tab 1: Basic Info
- Section **identity** (2-column grid):
  - `firstName`, `lastName`, `displayName` (valueExpression), `customerType`, `industry` (hiddenExpression), `accountManager`
- Section **contact-info** (2-column grid):
  - `email` (requiredExpression), `phone`, `website` (hiddenExpression), `vatNumber` (hiddenExpression + permissions)

### Tab 2: Address
- Section **billing-address** (2-column grid): street, city, state, postcode, country
- Section **shipping-address** (collapsible, collapsed, 2-column grid):
  - `sameAsBilling` checkbox with defaultValue: true
  - All ship fields have `hiddenExpression: 'sameAsBilling === true'`

### Tab 3: Contacts
- Section **contact-persons** with **arrays**:
  - `contacts` ArrayField: minItems:0, maxItems:10, sortable:true
  - Item schema: contactFirstName, contactLastName, contactRole, contactEmail, contactPhone

### Tab 4: Advanced
- Section **preferences** (2-column): currency, language, isActive, isTaxExempt
- Section **notes-section** (stack): internalNotes, tags (chip with suggestions)

## Expressions Used

| Expression Type     | Field           | Expression                                                         |
|---------------------|-----------------|---------------------------------------------------------------------|
| valueExpression     | displayName     | `firstName && lastName ? firstName + " " + lastName : displayName` |
| hiddenExpression    | industry        | `customerType === "individual"`                                     |
| hiddenExpression    | website         | `customerType === "individual"`                                     |
| hiddenExpression    | vatNumber       | `customerType !== "business" && customerType !== "government"`      |
| requiredExpression  | email           | `customerType === "business" \|\| customerType === "government"`   |
| hiddenExpression    | sameAsBilling ships | `sameAsBilling === true`                                       |
| hiddenExpression    | isTaxExempt     | `customerType === "individual"`                                     |

## Lookups (`customer.lookups.ts`)

| ID               | Query Type | Label Key | Value Key |
|------------------|------------|-----------|-----------|
| country          | country    | label     | code      |
| industry         | industry   | label     | value     |
| account-manager  | user       | name      | id        |

## Actions (`customer.actions.ts`)

| ID               | Label          | Variant   | Handler  | Permissions        |
|------------------|----------------|-----------|----------|--------------------|
| save-customer    | Save Customer  | primary   | submit   | customers:write    |
| discard-customer | Discard        | ghost     | cancel   |                    |
| delete-customer  | Delete Customer| danger    | delete   | customers:delete   |
| save-draft       | Save Draft     | secondary | draft    | customers:write    |
