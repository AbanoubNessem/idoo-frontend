# iDoo ERP Platform — Metadata System

---

## 1. Overview

The Metadata System is the complete type vocabulary of the platform. Every screen, form, table, action, filter, validation rule, and layout is expressed using these types. This document is the canonical reference for all metadata interfaces.

---

## 2. Core Principles

- All metadata is **pure TypeScript** — strongly typed, checked at compile time
- Metadata is **declarative** — it describes what, not how
- Metadata is **colocated** with its plugin — not centralized
- Metadata objects are **immutable** once registered
- Complex behaviour is expressed via **function properties** (predicates, loaders, handlers)

---

## 3. EntityDef

The master type — see `05-render-engine.md` for the full interface.

---

## 4. FormSchema

Defines the structure and behaviour of a form.

```typescript
interface FormSchema {
  sections: FormSection[];       // sections group fields visually
  columns?: 1 | 2 | 3 | 4;     // default column grid
  readonly?: boolean;            // entire form read-only
  submitLabel?: string;
  cancelLabel?: string;
  submitAction?: string;         // action ID to execute on submit
}

interface FormSection {
  id: string;
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  columns?: 1 | 2 | 3 | 4;     // overrides form-level columns
  fields: FormFieldDef[];
  showWhen?: (model: Record<string, unknown>) => boolean;
}
```

---

## 5. FormFieldDef

The complete definition of a single form field.

```typescript
interface FormFieldDef {
  // Identity
  key: string;                   // maps to the data model property
  type: FieldType;               // see FieldType below
  label?: string;
  placeholder?: string;
  hint?: string;

  // Value
  defaultValue?: unknown;
  
  // Constraints
  required?: boolean | ((model: Record<string, unknown>) => boolean);
  disabled?: boolean | ((model: Record<string, unknown>) => boolean);
  readonly?: boolean | ((model: Record<string, unknown>) => boolean);
  
  // Visibility
  hidden?: boolean | ((model: Record<string, unknown>) => boolean);

  // Layout
  span?: 1 | 2 | 3 | 4;         // column span within section grid
  order?: number;
  
  // Validation
  validators?: ValidatorDef[];
  asyncValidators?: AsyncValidatorDef[];
  errorMessages?: Record<string, string>;
  
  // Select/Autocomplete
  options?: SelectOption[] | ((query: string) => Observable<SelectOption[]>);
  optionValueKey?: string;       // default: 'value'
  optionLabelKey?: string;       // default: 'label'
  
  // Relations (picker fields)
  entityRef?: string;            // entity ID to pick from e.g. 'hr:department'
  
  // Conditional behaviour
  onValueChange?: (value: unknown, form: FormGroup) => void;
}
```

---

## 6. FieldType Enum

```typescript
type FieldType =
  // Text inputs
  | 'text'
  | 'email'
  | 'password'
  | 'phone'
  | 'url'
  | 'textarea'
  | 'rich-text'         // future: WYSIWYG
  
  // Numeric
  | 'number'
  | 'currency'
  | 'percentage'
  
  // Date/Time
  | 'date'
  | 'time'
  | 'datetime'
  | 'date-range'
  
  // Boolean
  | 'checkbox'
  | 'toggle'
  
  // Selection
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'autocomplete'
  | 'chips'
  
  // File
  | 'file'
  | 'image'
  
  // Entity pickers (resolved via FieldRegistry)
  | 'entity-picker'     // generic: uses entityRef
  | string;             // custom types registered via FieldRegistry
```

---

## 7. TableDef

Defines how an entity's list view is displayed.

```typescript
interface TableDef<T = Record<string, unknown>> {
  columns: ColumnDef<T>[];
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  pageSize?: number;              // default: 20
  pageSizeOptions?: number[];     // default: [10, 20, 50, 100]
  selectable?: boolean;           // enables row checkboxes
  searchable?: boolean;
  searchPlaceholder?: string;
  exportable?: boolean;
  density?: 'compact' | 'standard' | 'comfortable';
  rowClass?: (row: T) => string;  // dynamic CSS class
}

interface ColumnDef<T> {
  id: string;
  header: string;
  accessor?: keyof T | string;    // dot-notation path e.g. 'department.name'
  type: ColumnType;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: 'start' | 'end';
  hidden?: boolean;
  valueMapper?: (row: T) => string | number | boolean;
  badgeConfig?: Record<string, BadgeConfig>;
  linkConfig?: LinkConfig<T>;
  permission?: string;            // column visible only if permission held
}

type ColumnType =
  | 'text' | 'number' | 'currency' | 'percentage'
  | 'date' | 'datetime' | 'time'
  | 'badge' | 'boolean' | 'avatar'
  | 'link' | 'email' | 'phone'
  | 'actions' | 'custom';

interface BadgeConfig {
  label: string;
  color: 'primary' | 'accent' | 'warn' | 'success' | 'info' | 'neutral';
}

interface LinkConfig<T> {
  href?: (row: T) => string;
  routerLink?: (row: T) => string[];
  openInNewTab?: boolean;
}
```

---

## 8. ActionDef

Defines a user-executable action.

```typescript
interface ActionDef {
  id: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
  
  // Where the action appears
  scope: ActionScope | ActionScope[];
  
  // Visibility / enablement
  permission?: string;
  hidden?: (context: ActionContext) => boolean;
  disabled?: (context: ActionContext) => boolean;
  
  // Confirmation
  confirmBefore?: ConfirmConfig;
  
  // Execution
  handler: (context: ActionContext) => void | Observable<void> | Promise<void>;
  
  // Display
  showLabel?: boolean;            // default: true in form toolbar, false in table row
  order?: number;
}

type ActionScope =
  | 'list-toolbar'     // appears in table header toolbar (no row context)
  | 'row'              // appears per table row
  | 'bulk'             // appears when rows are selected
  | 'form-toolbar'     // appears in form header
  | 'form-footer'      // appears at bottom of form
  | 'detail-toolbar';  // appears in detail view header

interface ActionContext {
  entityId: string;
  mode: ViewMode;
  row?: Record<string, unknown>;         // null in list-toolbar
  selectedRows?: Record<string, unknown>[];  // null in row/form
  formValue?: Record<string, unknown>;   // null in list/detail
}

interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'confirm' | 'delete' | 'warn';
}
```

---

## 9. FilterDef

Defines one filter control in the filter bar.

```typescript
interface FilterDef {
  key: string;                 // query param name sent to backend
  label: string;
  type: FilterType;
  defaultValue?: unknown;
  options?: SelectOption[];
  optionsLoader?: () => Observable<SelectOption[]>;
  order?: number;
}

type FilterType =
  | 'text'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'date-range'
  | 'boolean'
  | 'number-range';
```

---

## 10. MenuItemDef

```typescript
interface MenuItemDef {
  id: string;
  label: string;
  icon?: string;
  path?: string;           // router path
  permission?: string;
  badge?: BadgeConfig;
  order?: number;
  children?: MenuItemDef[];
  dividerBefore?: boolean;
  moduleCode?: string;     // grayed out / hidden if module not active
}
```

---

## 11. RouteDef

```typescript
interface RouteDef {
  path: string;
  entityId?: string;           // if set, loads EntityViewComponent
  component?: () => Promise<Type<unknown>>;  // if set, loads this component
  layout?: 'list' | 'detail' | 'create' | 'edit' | 'custom';
  permission?: string;
  data?: Record<string, unknown>;
}
```

---

## 12. WorkflowDef

```typescript
interface WorkflowDef {
  statusField: string;          // field that holds current status
  states: WorkflowStateDef[];
  transitions: WorkflowTransitionDef[];
}

interface WorkflowStateDef {
  value: string;                // e.g. 'DRAFT'
  label: string;
  color: BadgeConfig['color'];
  terminal?: boolean;           // no transitions out of this state
}

interface WorkflowTransitionDef {
  id: string;
  from: string | string[];     // source state(s)
  to: string;                  // target state
  label: string;
  icon?: string;
  permission?: string;
  confirmBefore?: ConfirmConfig;
  handler?: (row: Record<string, unknown>) => Observable<void>;
}
```

---

## 13. WidgetDef

```typescript
interface WidgetDef {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  component: Type<unknown> | (() => Promise<Type<unknown>>);
  defaultConfig?: Record<string, unknown>;
  minWidth?: number;            // in grid columns
  minHeight?: number;           // in grid rows
  permission?: string;
}
```

---

## 14. RelationDef

Defines a relationship panel shown in entity detail view.

```typescript
interface RelationDef {
  id: string;
  label: string;
  icon?: string;
  relatedEntityId: string;     // e.g. 'auth:role' for user → roles
  type: 'one-to-many' | 'many-to-many';
  foreignKey?: string;         // query param to filter related entity
  table: TableDef;
  actions?: ActionDef[];
  permission?: string;
  order?: number;
}
```

---

## 15. Metadata Immutability

Once a `PluginDef` is registered, all metadata objects are treated as immutable. The registry stores references — mutations of the original objects after registration have no effect on the rendered output.

For runtime overrides (e.g., tenant-specific field customizations), use the **Override Registry** (Phase 3 feature), which applies patches on top of the base metadata without modifying the original.
