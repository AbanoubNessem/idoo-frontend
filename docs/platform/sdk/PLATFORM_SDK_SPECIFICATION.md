# Platform SDK — Architecture Specification

**Version:** 1.0.0  
**Status:** OFFICIAL SPECIFICATION  
**Phase:** 2.5  
**Depends on:** `PLUGIN_SYSTEM_SPECIFICATION.md`, `REGISTRY_MANAGER_SPECIFICATION.md`  
**Date:** 2026-06-28

---

> The Platform SDK is the contract between the iDoo Platform and every developer  
> who builds on top of it. It is the only door into the platform.  
> Everything outside the SDK is private. Everything inside the SDK is guaranteed.

---

## Table of Contents

1. [SDK Philosophy](#1-sdk-philosophy)
2. [Package Architecture](#2-package-architecture)
3. [Public Platform API](#3-public-platform-api)
4. [Contracts](#4-contracts)
5. [Factory Functions — define\*()](#5-factory-functions--define)
6. [Builder APIs](#6-builder-apis)
7. [Validators](#7-validators)
8. [Metadata Helpers](#8-metadata-helpers)
9. [Default Values](#9-default-values)
10. [Type Safety Architecture](#10-type-safety-architecture)
11. [Versioning and Compatibility](#11-versioning-and-compatibility)
12. [Extension APIs](#12-extension-apis)
13. [Development Workflow](#13-development-workflow)
14. [CLI Architecture](#14-cli-architecture)
15. [Code Generators](#15-code-generators)
16. [Templates](#16-templates)
17. [Testing Helpers](#17-testing-helpers)
18. [Documentation Helpers](#18-documentation-helpers)
19. [IDE Support](#19-ide-support)
20. [Future SDK Evolution](#20-future-sdk-evolution)
21. [ADRs](#21-adrs)
22. [Self-Review](#22-self-review)

---

## 1. SDK Philosophy

### 1.1 The Single Door Principle

The Platform SDK is the only public API surface of the iDoo Platform. Every ERP module — every plugin developer, every tenant customizer, every third-party integrator — interacts with the platform exclusively through this SDK. Nothing else is public. Nothing else is stable.

This is not a restriction for its own sake. It is an architectural guarantee:

> **If it is in the SDK, it is stable, versioned, and documented.**  
> **If it is not in the SDK, it can change at any time without notice.**

A plugin that imports directly from `src/app/core/kernel/` or `src/app/core/registry/` will break on the next platform update. A plugin that imports only from `@idoo/platform` will continue working across minor platform versions.

### 1.2 The Five SDK Guarantees

**G1 — Stability:** Public API surface is frozen per major version. Minor versions add; they never remove or break.

**G2 — Type Safety:** Every SDK function returns a fully typed result. TypeScript errors from incorrect usage are surfaced at compile time, not at runtime.

**G3 — Validation:** Every `define*()` factory validates its input at call time (in development mode) and throws a typed `SDKValidationError` with a clear message pointing to the invalid field.

**G4 — Discoverability:** The SDK is self-documenting through TypeScript intellisense, JSDoc annotations, and generated API reference documentation.

**G5 — Developer Velocity:** A new ERP module can be scaffolded, typed, and validated in under 30 minutes. The SDK removes all boilerplate. Developers write only domain logic.

### 1.3 What the SDK Is

- A set of `define*()` factory functions that validate and produce typed metadata objects
- A set of `Builder` classes for complex metadata construction
- A set of `Contract` interfaces that define exactly what each metadata object must contain
- A set of `validate*()` functions for runtime metadata validation
- A set of testing utilities (`createMockPlatform`, `createTestPlugin`, etc.)
- A CLI (`idoo`) for scaffolding, generation, and validation
- Type definitions for the entire Platform API surface

### 1.4 What the SDK Is NOT

- The platform implementation (that is in `src/app/core/`)
- A runtime (the platform is the runtime)
- An Angular library (the SDK has no Angular dependencies in its contract layer)
- A UI component library (that is the Adapter layer — `PcXxx` components)

### 1.5 Developer Experience Benchmark

The SDK is designed to feel like the best parts of:

| Inspiration | What We Borrow |
|---|---|
| **Angular** | Decorator-free fluent configuration, typed injection tokens, signal-based state |
| **NestJS** | Self-documenting decorators (as JSDoc), module-based organization, clear layering |
| **Spring Boot** | Convention over configuration, sensible defaults, opinionated structure |
| **tRPC** | End-to-end type safety from metadata definition to rendered UI |
| **Zod** | Schema validation with clear error messages at the call site |

---

## 2. Package Architecture

### 2.1 Package Map

```
@idoo/platform                    ← Main SDK package (umbrella re-export)
│
├── @idoo/platform/contracts      ← Contract interfaces (TypeScript types only)
│   No runtime code. Tree-shakes to zero bytes.
│
├── @idoo/platform/define         ← define*() factory functions
│   Validates input, returns typed metadata.
│   Development-only validation (stripped in production build).
│
├── @idoo/platform/builders       ← Fluent Builder classes
│   EntityBuilder, FormBuilder, TableBuilder, etc.
│
├── @idoo/platform/validators     ← validate*() functions and ValidationError
│
├── @idoo/platform/helpers        ← Metadata helper utilities
│   withDefaults(), merge(), pick(), omit(), etc.
│
├── @idoo/platform/permissions    ← Permission code helpers
│   createPermissions(), PERMISSIONS constants structure
│
├── @idoo/platform/testing        ← Test utilities (test environments only)
│   createMockPlatform(), createTestPlugin(), etc.
│
└── @idoo/platform/tokens         ← Public InjectionTokens
    PLATFORM_CONFIG_TOKEN, PLUGIN_MANIFEST_TOKEN, KERNEL_TOKEN, etc.
```

### 2.2 Import Convention

```typescript
// Correct — all imports from the SDK
import { defineEntity }    from '@idoo/platform/define';
import { EntityContract }  from '@idoo/platform/contracts';
import { EntityBuilder }   from '@idoo/platform/builders';
import { createPermissions } from '@idoo/platform/permissions';
import { createMockPlatform } from '@idoo/platform/testing';

// FORBIDDEN — direct platform internals
import { EntityRegistry }  from '../../../core/registry/entity.registry';   // ❌
import { PlatformKernel }  from '../../../core/kernel/platform-kernel.service'; // ❌
```

### 2.3 Re-export Barrel

The main `@idoo/platform` package re-exports everything:

```typescript
// @idoo/platform index
export * from '@idoo/platform/contracts';
export * from '@idoo/platform/define';
export * from '@idoo/platform/builders';
export * from '@idoo/platform/validators';
export * from '@idoo/platform/helpers';
export * from '@idoo/platform/permissions';
export * from '@idoo/platform/tokens';
// Note: @idoo/platform/testing is NOT re-exported here (test-only)
```

### 2.4 Bundle Impact

| Package | Production bytes (est.) | Notes |
|---|---|---|
| `contracts` | 0 KB | Types only |
| `define` | ~8 KB | Validation stripped in prod |
| `builders` | ~15 KB | Builder classes |
| `validators` | ~5 KB | Validation utils |
| `helpers` | ~3 KB | Pure utility functions |
| `permissions` | ~2 KB | Constants + factory |
| `tokens` | ~1 KB | InjectionTokens |
| **Total SDK** | **~34 KB** | Minified + gzipped: ~10 KB |

---

## 3. Public Platform API

### 3.1 The PlatformAPI Interface

The `PlatformAPI` is the runtime object available to plugins during their `initFn`. It is the entire platform as seen from a plugin. It maps 1:1 with the `PluginContext` from the Plugin System spec.

```typescript
// @idoo/platform/contracts
interface PlatformAPI {
  // ── Identity ─────────────────────────────────────────────────────────
  readonly pluginId:       string;
  readonly platformVersion: PlatformVersion;
  readonly config:         PlatformConfigPublic;

  // ── Registry Access (write — only in initFn) ─────────────────────────
  readonly fields:         FieldRegistryAPI;
  readonly validators:     ValidationRegistryAPI;
  readonly renderers:      CellRendererRegistryAPI;
  readonly widgets:        WidgetRegistryAPI;
  readonly health:         HealthRegistryAPI;

  // ── Events ───────────────────────────────────────────────────────────
  readonly events:         PluginEventAPI;

  // ── Capabilities ─────────────────────────────────────────────────────
  hasCapability(id: string): boolean;

  // ── Feature Flags ────────────────────────────────────────────────────
  readonly features:       FeatureFlagAPI;

  // ── Logging ──────────────────────────────────────────────────────────
  readonly logger:         PluginLoggerAPI;
}
```

### 3.2 PlatformConfigPublic

The subset of `PlatformConfig` that is safe to expose to plugins:

```typescript
interface PlatformConfigPublic {
  readonly apiUrl:          string;
  readonly production:      boolean;
  readonly platformVersion: string;
  readonly featureFlags:    readonly string[];
}
```

### 3.3 FieldRegistryAPI (write surface)

```typescript
interface FieldRegistryAPI {
  register(typeId: string, options: CustomFieldRegistration): void;
  has(typeId: string): boolean;
  getAll(): string[];
}

interface CustomFieldRegistration {
  component: () => Promise<Type<any>>;
  label?:    string;
  icon?:     string;
}
```

### 3.4 PluginEventAPI

```typescript
interface PluginEventAPI {
  emit<T extends object>(event: PluginEvent<T>): void;
  on<T extends object>(eventType: string): Observable<T>;
  off(subscriptionId: string): void;
}

interface PluginEvent<T extends object = object> {
  type:      string;   // automatically prefixed: '{pluginId}:{type}'
  payload?:  T;
  timestamp?: string;  // auto-set if omitted
}
```

---

## 4. Contracts

Contracts are TypeScript interfaces that precisely define what each metadata object must contain. They serve three purposes:
1. Compile-time type checking for plugin authors
2. Runtime validation schema for `validate*()` functions
3. Documentation of the exact API surface

### 4.1 PluginContract

```typescript
// @idoo/platform/contracts
interface PluginContract {
  // Required
  id:                      string;
  name:                    string;
  version:                 string;
  minimumPlatformVersion:  string;
  category:                PluginCategory;
  author:                  AuthorContract;

  // Registry contributions
  entities?:     EntityContract[];
  routes?:       RouteContract[];
  menus?:        MenuContract[];
  widgets?:      WidgetContract[];
  workflows?:    WorkflowContract[];
  dashboards?:   DashboardContract[];
  reports?:      ReportContract[];
  permissions?:  PermissionContract[];
  validators?:   ValidatorContract[];
  lookups?:      LookupContract[];
  themes?:       ThemeContract[];
  locales?:      LocaleContract[];
  layouts?:      LayoutContract[];

  // Behaviour
  capabilities?:          string[];
  requiredCapabilities?:  string[];
  featureFlags?:          FeatureFlagContract[];
  overrides?:             OverrideContract[];
  overridePriority?:      number;
  enabledByDefault?:      boolean;
  initFn?:                PluginInitFn;
  description?:           string;
  icon?:                  string;
  license?:               LicenseContract;
}
```

### 4.2 EntityContract

```typescript
interface EntityContract {
  id:               string;          // '{module}:{entity}' e.g. 'hr:employee'
  apiPath:          string;          // '/v1/hr/employees'
  labelSingular:    string;
  labelPlural:      string;
  labelField:       string;          // which field to use as display name
  icon:             string;
  permissions:      EntityPermissions;
  table:            TableContract;
  form: {
    create:  FormContract;
    edit?:   FormContract;          // defaults to create schema if omitted
    view?:   FormContract;          // defaults to create schema (read-only)
    import?: FormContract;
  };
  filters?:         FilterContract[];
  actions?:         ActionContract[];
  defaultView?:     'table' | 'detail';
  searchable?:      boolean;
  exportable?:      boolean;
  hasSoftDelete?:   boolean;
  customComponent?: () => Promise<Type<any>>;
}

interface EntityPermissions {
  list:     string;
  create?:  string;
  update?:  string;
  delete?:  string;
  export?:  string;
}
```

### 4.3 FormContract

```typescript
interface FormContract {
  sections:   FormSectionContract[];
  hooks?:     FormHooksContract;
  layout?:    'single-column' | 'two-column' | 'tabbed';
}

interface FormSectionContract {
  id:       string;
  title?:   string;
  columns?: 1 | 2 | 3 | 4;
  fields:   FieldContract[];
  hidden?:  (model: Record<string, unknown>) => boolean;
  collapsible?: boolean;
}

interface FieldContract {
  key:           string;
  type:          FieldType | string;  // string allows custom field types
  label:         string;
  required?:     boolean;
  disabled?:     boolean;
  hidden?:       (model: Record<string, unknown>) => boolean;
  defaultValue?: unknown;
  placeholder?:  string;
  hint?:         string;
  validators?:   FieldValidatorContract[];
  options?:      SelectOption[];
  optionsLoader?: () => Observable<SelectOption[]>;
  entityRef?:    string;             // for entity-picker type
  accept?:       string;             // for file-upload type
  min?:          number;
  max?:          number;
  step?:         number;
  rows?:         number;             // for textarea type
  multiple?:     boolean;            // for multi-select, file-upload
  colSpan?:      1 | 2 | 3 | 4;
}

interface FormHooksContract {
  beforeSubmit?:  (value: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;
  afterSave?:     (record: Record<string, unknown>) => void | Promise<void>;
  onValueChange?: (field: string, value: unknown, model: Record<string, unknown>) => void;
}
```

### 4.4 TableContract

```typescript
interface TableContract {
  columns:          ColumnContract[];
  defaultSort?:     { field: string; direction: 'asc' | 'desc' };
  pageSize?:        number;
  selectable?:      boolean;
  searchable?:      boolean;
  searchPlaceholder?: string;
  exportable?:      boolean;
  rowClickBehavior?: 'navigate-detail' | 'navigate-edit' | 'open-drawer' | 'open-dialog' | 'none';
  hooks?:           TableHooksContract;
}

interface ColumnContract {
  id:             string;
  header:         string;
  accessor?:      string;
  type:           ColumnType | 'custom' | 'actions';
  sortable?:      boolean;
  filterable?:    boolean;
  sticky?:        'start' | 'end';
  width?:         string;
  hidden?:        boolean;
  badgeConfig?:   Record<string, BadgeConfig>;
  customRenderer?: string;         // CellRendererRegistry key
}

type ColumnType =
  | 'text' | 'number' | 'currency' | 'date' | 'datetime'
  | 'boolean' | 'badge' | 'avatar' | 'email' | 'phone'
  | 'link' | 'image' | 'progress' | 'rating' | 'tags';

interface BadgeConfig {
  label:  string;
  color:  'success' | 'warn' | 'danger' | 'info' | 'neutral' | 'primary';
  icon?:  string;
}
```

### 4.5 RouteContract

```typescript
interface RouteContract {
  path:          string;
  entityId:      string;
  title?:        string;
  permissions?:  string[];
  moduleCode?:   string;
  preload?:      boolean;
  data?:         Record<string, unknown>;
}
```

### 4.6 MenuContract

```typescript
interface MenuContract {
  id:           string;
  label:        string;
  icon:         string;
  path:         string;
  order:        number;
  parentId?:    string;
  permission?:  string;
  moduleCode?:  string;
  badgeKey?:    string;
  children?:    MenuContract[];
}
```

### 4.7 ActionContract

```typescript
interface ActionContract {
  id:              string;
  label:           string;
  icon?:           string;
  scope:           ActionScope[];
  permission?:     string;
  type?:           ActionType;
  handler:         ActionHandler;
  hidden?:         (ctx: ActionContext) => boolean;
  disabled?:       (ctx: ActionContext) => boolean;
  confirmBefore?:  ConfirmConfig;
  successMessage?: string;
  errorMessage?:   string;
  navigateAfter?:  'list' | 'detail' | 'none';
  hotkey?:         string;
  variant?:        'primary' | 'secondary' | 'danger' | 'ghost';
  order?:          number;
}

type ActionScope = 'row' | 'bulk' | 'global' | 'header' | 'detail';
type ActionType  = 'http' | 'navigate' | 'form-dialog' | 'confirm-only' | 'custom';

interface ConfirmConfig {
  title:    string;
  message:  string;
  type:     'info' | 'warn' | 'danger';
  confirmLabel?: string;
  cancelLabel?:  string;
}
```

### 4.8 PermissionContract

```typescript
interface PermissionContract {
  code:         string;    // 'MODULE:RESOURCE:ACTION' uppercase
  moduleCode:   string;
  resource:     string;
  action:       string;
  label:        string;
  description?: string;
  implies?:     string[];
}
```

### 4.9 WidgetContract

```typescript
interface WidgetContract {
  id:           string;    // '{pluginId}:widget:{name}'
  name:         string;
  icon:         string;
  component:    () => Promise<Type<any>>;
  permission?:  string;
  minWidth?:    number;
  defaultWidth?: number;
  defaultHeight?: number;
  category?:    string;
  configSchema?: FormContract;
  description?: string;
}
```

### 4.10 WorkflowContract

```typescript
interface WorkflowContract {
  id:           string;    // '{entityId}:workflow'
  entityId:     string;
  initialState: string;
  states:       WorkflowStateContract[];
  transitions:  WorkflowTransitionContract[];
}

interface WorkflowStateContract {
  id:       string;
  label:    string;
  terminal: boolean;
  color:    'success' | 'warn' | 'danger' | 'neutral' | 'info';
  icon?:    string;
}

interface WorkflowTransitionContract {
  id:             string;
  from:           string | string[];
  to:             string;
  label:          string;
  permission:     string;
  confirmBefore?: ConfirmConfig;
  handler?:       ActionHandler;
  icon?:          string;
}
```

### 4.11 DashboardContract

```typescript
interface DashboardContract {
  id:          string;
  name:        string;
  targetRole?: string;
  moduleCode?: string;
  locked?:     boolean;
  slots:       DashboardSlotContract[];
}

interface DashboardSlotContract {
  widgetId: string;
  column:   number;
  row:      number;
  colSpan:  number;
  rowSpan?: number;
}
```

### 4.12 LookupContract

```typescript
interface LookupContract {
  id:        string;
  label:     string;
  items:     LookupItemContract[];
  source?:   'static' | 'remote';
  remoteUrl?: string;
  cacheTtlMs?: number;
}

interface LookupItemContract {
  value:     string | number;
  label:     string;
  disabled?: boolean;
  icon?:     string;
  color?:    string;
  metadata?: Record<string, unknown>;
}
```

### 4.13 ValidatorContract

```typescript
interface ValidatorContract {
  id:             string;
  factory:        ValidatorFactory;
  defaultMessage: string;
  paramSchema?:   Record<string, unknown>;
  label?:         string;
  description?:   string;
}

type ValidatorFactory =
  (params?: unknown, message?: string) => (control: AbstractControl) => ValidationErrors | null;
```

### 4.14 ReportContract

```typescript
interface ReportContract {
  id:           string;
  name:         string;
  permission:   string;
  formats:      ('pdf' | 'csv' | 'xlsx')[];
  endpoint:     string;
  entityId?:    string;
  parameters?:  FormContract;
  description?: string;
  icon?:        string;
}
```

### 4.15 FilterContract

```typescript
interface FilterContract {
  key:            string;
  label:          string;
  type:           FilterType;
  options?:       SelectOption[];
  optionsLoader?: () => Observable<SelectOption[]>;
  defaultValue?:  unknown;
  queryParam?:    string;
}

type FilterType =
  | 'text' | 'select' | 'multi-select' | 'date'
  | 'date-range' | 'number-range' | 'boolean' | 'lookup';
```

---

## 5. Factory Functions — define*()

Factory functions are the primary authoring API. They validate inputs, apply defaults, and return fully typed, immutable metadata objects. In development mode, invalid inputs throw `SDKValidationError` immediately at the call site. In production, validation is skipped for performance.

### 5.1 SDKValidationError

```typescript
class SDKValidationError extends Error {
  readonly factoryName:  string;     // 'defineEntity'
  readonly fieldPath:    string;     // 'form.sections[0].fields[2].type'
  readonly invalidValue: unknown;
  readonly expectedType: string;
  readonly hint?:        string;
}
```

### 5.2 definePlugin()

```typescript
function definePlugin(config: PluginContract): PluginManifest

// Usage
export const HrPlugin = definePlugin({
  id:                     'HR',
  name:                   'Human Resources',
  version:                '1.0.0',
  minimumPlatformVersion: '^1.0.0',
  category:               'erp',
  author:                 { name: 'iDoo Dev Team' },
  entities:               [EmployeeEntity, DepartmentEntity, JobTitleEntity],
  routes:                 [EmployeeRoute, DepartmentRoute, JobTitleRoute],
  menus:                  [HrMenuGroup],
  workflows:              [EmployeeWorkflow],
  permissions:            [HrPermissions.all],
  enabledByDefault:       true,
});

// Validation rules applied:
// ✓ id: uppercase, alphanumeric + underscore, unique
// ✓ version: valid SemVer
// ✓ minimumPlatformVersion: valid SemVer range
// ✓ entities: array of valid EntityContract
// ✓ routes: paths match entity IDs in entities array
// ✓ menus: paths resolve in routes array
// ✓ permissions: all codes match MODULE:RESOURCE:ACTION pattern
```

### 5.3 defineEntity()

```typescript
function defineEntity<TRecord extends object = Record<string, unknown>>(
  config: EntityContract
): EntityDef<TRecord>

// Usage
export const EmployeeEntity = defineEntity({
  id:            'hr:employee',
  apiPath:       '/v1/hr/employees',
  labelSingular: 'Employee',
  labelPlural:   'Employees',
  labelField:    'fullName',
  icon:          'person',
  permissions: {
    list:   HR.EMPLOYEES.READ,
    create: HR.EMPLOYEES.CREATE,
    update: HR.EMPLOYEES.UPDATE,
    delete: HR.EMPLOYEES.DELETE,
    export: HR.EMPLOYEES.EXPORT,
  },
  table:   EmployeeTable,
  form:    { create: EmployeeCreateForm, edit: EmployeeEditForm },
  filters: EmployeeFilters,
  actions: EmployeeActions,
  searchable: true,
  exportable: true,
});

// Validation rules applied:
// ✓ id: lowercase, matches '{module}:{entity}' pattern
// ✓ apiPath: starts with '/v1/'
// ✓ labelField: must be a string (validated at runtime against API response)
// ✓ table: valid TableContract
// ✓ form.create: valid FormContract
// ✓ permissions.list: required
```

### 5.4 defineForm()

```typescript
function defineForm(config: FormContract): FormSchema

// Usage
export const EmployeeCreateForm = defineForm({
  sections: [
    {
      id:      'personal',
      title:   'Personal Information',
      columns: 3,
      fields: [
        { key: 'firstName', type: 'text',  label: 'First Name', required: true },
        { key: 'lastName',  type: 'text',  label: 'Last Name',  required: true },
        { key: 'email',     type: 'email', label: 'Email',      required: true },
      ],
    },
    {
      id:      'employment',
      title:   'Employment',
      columns: 2,
      fields: [
        {
          key:       'departmentId',
          type:      'entity-picker',
          label:     'Department',
          entityRef: 'hr:department',
          required:  true,
        },
        {
          key:       'contractType',
          type:      'select',
          label:     'Contract Type',
          required:  true,
          options: [
            { value: 'PERMANENT',  label: 'Permanent' },
            { value: 'FIXED_TERM', label: 'Fixed Term' },
          ],
        },
        {
          key:    'contractEndDate',
          type:   'date',
          label:  'Contract End Date',
          hidden: (m) => m['contractType'] !== 'FIXED_TERM',
        },
      ],
    },
  ],
  hooks: {
    beforeSubmit: (value) => ({
      ...value,
      fullName: `${value['firstName']} ${value['lastName']}`,
    }),
  },
});

// Validation rules applied:
// ✓ sections: non-empty array
// ✓ each section.id: unique within form
// ✓ each field.key: unique within section
// ✓ each field.type: known type or registered custom type
// ✓ columns: 1 | 2 | 3 | 4
// ✓ options: present when type is 'select' or 'multi-select'
// ✓ entityRef: present when type is 'entity-picker'
```

### 5.5 defineTable()

```typescript
function defineTable(config: TableContract): TableDef

// Usage
export const EmployeeTable = defineTable({
  columns: [
    { id: 'name',       header: 'Name',       accessor: 'fullName',       type: 'avatar',  sortable: true },
    { id: 'email',      header: 'Email',       accessor: 'email',          type: 'email' },
    { id: 'department', header: 'Department',  accessor: 'departmentName', type: 'text',    sortable: true },
    {
      id:      'status',
      header:  'Status',
      accessor:'status',
      type:    'badge',
      badgeConfig: {
        ACTIVE:    { label: 'Active',    color: 'success' },
        INACTIVE:  { label: 'Inactive',  color: 'neutral' },
        SUSPENDED: { label: 'Suspended', color: 'warn' },
      },
    },
    { id: 'hireDate', header: 'Hire Date', accessor: 'hireDate', type: 'date', sortable: true },
    { id: 'actions',  header: '',          type: 'actions', sticky: 'end' },
  ],
  defaultSort:         { field: 'createdAt', direction: 'desc' },
  pageSize:            20,
  selectable:          true,
  searchable:          true,
  searchPlaceholder:   'Search employees...',
  exportable:          true,
  rowClickBehavior:    'navigate-detail',
});

// Validation rules applied:
// ✓ columns: non-empty array
// ✓ each column.id: unique within table
// ✓ each column.type: known ColumnType or 'custom' or 'actions'
// ✓ customRenderer: present when type is 'custom'
// ✓ badgeConfig: present when type is 'badge'
// ✓ pageSize: 5–200
// ✓ defaultSort.field: matches a column.accessor
```

### 5.6 defineAction()

```typescript
function defineAction(config: ActionContract): ActionDef

// Usage
export const ActivateEmployeeAction = defineAction({
  id:         'hr:employee:activate',
  label:      'Activate',
  icon:       'check_circle',
  scope:      ['row', 'bulk'],
  permission: HR.EMPLOYEES.UPDATE,
  hidden:     (ctx) => ctx.row?.['status'] === 'ACTIVE',
  handler:    (ctx) => inject(HrEmployeeApiClient)
                         .update(ctx.row!['id'] as string, { status: 'ACTIVE' }),
  successMessage: 'Employee activated.',
  variant:    'primary',
  order:      1,
});

export const DeactivateEmployeeAction = defineAction({
  id:         'hr:employee:deactivate',
  label:      'Deactivate',
  icon:       'block',
  scope:      ['row', 'bulk'],
  permission: HR.EMPLOYEES.UPDATE,
  hidden:     (ctx) => ctx.row?.['status'] !== 'ACTIVE',
  confirmBefore: {
    title:   'Deactivate Employee',
    message: 'This employee will lose system access immediately.',
    type:    'warn',
  },
  handler: (ctx) => inject(HrEmployeeApiClient)
                      .update(ctx.row!['id'] as string, { status: 'INACTIVE' }),
  variant: 'danger',
  order:   2,
});
```

### 5.7 definePermission()

```typescript
function definePermission(config: PermissionContract): PermissionDef

// Usage
export const EmployeeReadPermission = definePermission({
  code:       'HR:EMPLOYEES:READ',
  moduleCode: 'HR',
  resource:   'EMPLOYEES',
  action:     'READ',
  label:      'View Employees',
  description: 'Allows viewing the employee list and individual employee profiles.',
});
```

### 5.8 defineMenu()

```typescript
function defineMenu(config: MenuContract): MenuItemDef

// Usage
export const HrMenuGroup = defineMenu({
  id:     'hr:menu:group',
  label:  'Human Resources',
  icon:   'people',
  path:   '/app/hr',
  order:  2,
  children: [
    defineMenu({ id: 'hr:menu:employees',   label: 'Employees',   icon: 'person',       path: '/app/hr/employees',   order: 1, permission: HR.EMPLOYEES.READ,   moduleCode: 'HR' }),
    defineMenu({ id: 'hr:menu:departments', label: 'Departments', icon: 'apartment',    path: '/app/hr/departments', order: 2, permission: HR.DEPARTMENTS.READ, moduleCode: 'HR' }),
    defineMenu({ id: 'hr:menu:job-titles',  label: 'Job Titles',  icon: 'work_outline', path: '/app/hr/job-titles',  order: 3, moduleCode: 'HR' }),
  ],
});
```

### 5.9 defineRoute()

```typescript
function defineRoute(config: RouteContract): RouteDef

// Usage
export const EmployeeRoute = defineRoute({
  path:        'hr/employees',
  entityId:    'hr:employee',
  title:       'Employees',
  permissions: [HR.EMPLOYEES.READ],
  moduleCode:  'HR',
  preload:     true,
});
```

### 5.10 defineWidget()

```typescript
function defineWidget(config: WidgetContract): WidgetDef

// Usage
export const HeadcountWidget = defineWidget({
  id:           'hr:widget:headcount',
  name:         'Headcount',
  icon:         'people',
  permission:   HR.EMPLOYEES.READ,
  component:    () => import('./headcount.component').then(m => m.HeadcountWidgetComponent),
  minWidth:     2,
  defaultWidth: 3,
  category:     'HR',
  configSchema: defineForm({
    sections: [{
      id: 'config',
      fields: [
        { key: 'period', type: 'select', label: 'Period',
          options: [
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
          ]
        }
      ]
    }]
  }),
  description: 'Shows current employee headcount and trends.',
});
```

### 5.11 defineWorkflow()

```typescript
function defineWorkflow(config: WorkflowContract): WorkflowDef

// Usage
export const EmployeeWorkflow = defineWorkflow({
  id:           'hr:employee:workflow',
  entityId:     'hr:employee',
  initialState: 'ACTIVE',
  states: [
    { id: 'ACTIVE',    label: 'Active',    terminal: false, color: 'success' },
    { id: 'INACTIVE',  label: 'Inactive',  terminal: false, color: 'neutral' },
    { id: 'SUSPENDED', label: 'Suspended', terminal: false, color: 'warn' },
    { id: 'TERMINATED',label: 'Terminated',terminal: true,  color: 'danger' },
  ],
  transitions: [
    {
      id:         'hr:employee:deactivate',
      from:       'ACTIVE',
      to:         'INACTIVE',
      label:      'Deactivate',
      permission: HR.EMPLOYEES.UPDATE,
      confirmBefore: { title: 'Deactivate Employee', message: 'Employee loses access.', type: 'warn' },
    },
    {
      id:         'hr:employee:activate',
      from:       ['INACTIVE', 'SUSPENDED'],
      to:         'ACTIVE',
      label:      'Activate',
      permission: HR.EMPLOYEES.UPDATE,
    },
    {
      id:         'hr:employee:suspend',
      from:       'ACTIVE',
      to:         'SUSPENDED',
      label:      'Suspend',
      permission: HR.EMPLOYEES.UPDATE,
      confirmBefore: { title: 'Suspend Employee', message: 'Employee loses access pending review.', type: 'danger' },
    },
    {
      id:         'hr:employee:terminate',
      from:       ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      to:         'TERMINATED',
      label:      'Terminate',
      permission: HR.EMPLOYEES.DELETE,
      confirmBefore: { title: 'Terminate Employment', message: 'This action cannot be undone.', type: 'danger' },
    },
  ],
});
```

### 5.12 defineLookup()

```typescript
function defineLookup(config: LookupContract): LookupDef

// Usage
export const ContractTypeLookup = defineLookup({
  id:    'hr:contract-types',
  label: 'Contract Types',
  items: [
    { value: 'PERMANENT',  label: 'Permanent' },
    { value: 'FIXED_TERM', label: 'Fixed Term' },
    { value: 'PART_TIME',  label: 'Part Time' },
    { value: 'INTERN',     label: 'Internship' },
  ],
  source: 'static',
});
```

### 5.13 defineReport()

```typescript
function defineReport(config: ReportContract): ReportDef

// Usage
export const EmployeeRosterReport = defineReport({
  id:          'hr:report:employee-roster',
  name:        'Employee Roster',
  permission:  HR.EMPLOYEES.EXPORT,
  formats:     ['pdf', 'csv', 'xlsx'],
  endpoint:    '/v1/hr/reports/employee-roster',
  entityId:    'hr:employee',
  parameters:  defineForm({
    sections: [{
      id: 'params',
      fields: [
        { key: 'status',       type: 'select',     label: 'Status',       options: [{ value: 'ACTIVE', label: 'Active' }] },
        { key: 'departmentId', type: 'entity-picker', label: 'Department', entityRef: 'hr:department' },
        { key: 'asOfDate',     type: 'date',        label: 'As of Date', required: true },
      ]
    }]
  }),
  description: 'Complete list of employees with contact and employment details.',
  icon:        'description',
});
```

### 5.14 defineValidator()

```typescript
function defineValidator(config: ValidatorContract): ValidatorDef

// Usage
export const EgyptianNationalIdValidator = defineValidator({
  id:             'egyptianNationalId',
  defaultMessage: 'Must be a valid 14-digit Egyptian National ID.',
  label:          'Egyptian National ID',
  factory:        (_params, message) => (control) => {
    if (!control.value) return null;
    const valid = /^\d{14}$/.test(control.value);
    return valid ? null : { egyptianNationalId: message ?? 'Invalid National ID format.' };
  },
});
```

### 5.15 defineDashboard()

```typescript
function defineDashboard(config: DashboardContract): DashboardDef

// Usage
export const HrDefaultDashboard = defineDashboard({
  id:          'hr:dashboard:default',
  name:        'HR Overview',
  moduleCode:  'HR',
  slots: [
    { widgetId: 'hr:widget:headcount',         column: 1, row: 1, colSpan: 3 },
    { widgetId: 'hr:widget:status-distribution',column: 4, row: 1, colSpan: 3 },
    { widgetId: 'platform:widget:activity-feed', column: 7, row: 1, colSpan: 6 },
    { widgetId: 'hr:widget:upcoming-birthdays', column: 1, row: 2, colSpan: 4 },
    { widgetId: 'hr:widget:headcount-trend',    column: 5, row: 2, colSpan: 8 },
  ],
});
```

---

## 6. Builder APIs

Builders provide a fluent, chainable alternative to the `define*()` factory functions. They are useful for:
- Programmatic metadata generation (e.g., creating entities based on API schema)
- Complex conditional metadata construction
- Code generation scripts

All builders return the same typed contracts as `define*()` via their `.build()` method.

### 6.1 EntityBuilder

```typescript
class EntityBuilder<TRecord extends object = Record<string, unknown>> {

  static create(id: string): EntityBuilder
  static from(existing: EntityContract): EntityBuilder   // clone + modify

  // Required
  .withApiPath(path: string): this
  .withLabels(singular: string, plural: string): this
  .withLabelField(field: string): this
  .withIcon(icon: string): this
  .withPermissions(permissions: EntityPermissions): this

  // Metadata
  .withTable(table: TableContract): this
  .withCreateForm(form: FormContract): this
  .withEditForm(form: FormContract): this
  .withViewForm(form: FormContract): this
  .withFilters(filters: FilterContract[]): this
  .withActions(actions: ActionContract[]): this
  .addAction(action: ActionContract): this

  // Flags
  .searchable(value?: boolean): this
  .exportable(value?: boolean): this
  .withSoftDelete(): this
  .withDefaultView(view: 'table' | 'detail'): this
  .withCustomComponent(loader: () => Promise<Type<any>>): this

  // Terminal
  .build(): EntityDef<TRecord>
  .validate(): ValidationResult

  // Usage
  const EmployeeEntity = EntityBuilder.create('hr:employee')
    .withApiPath('/v1/hr/employees')
    .withLabels('Employee', 'Employees')
    .withLabelField('fullName')
    .withIcon('person')
    .withPermissions({ list: HR.EMPLOYEES.READ, create: HR.EMPLOYEES.CREATE })
    .withTable(EmployeeTable)
    .withCreateForm(EmployeeCreateForm)
    .withFilters(EmployeeFilters)
    .addAction(ActivateEmployeeAction)
    .addAction(DeactivateEmployeeAction)
    .searchable()
    .exportable()
    .build();
}
```

### 6.2 FormBuilder

```typescript
class FormBuilder {

  static create(): FormBuilder
  static from(existing: FormContract): FormBuilder

  // Sections
  .addSection(section: FormSectionContract): this
  .addSection(config: {
    id:       string;
    title?:   string;
    columns?: 1 | 2 | 3 | 4;
    fields:   FieldContract[];
    hidden?:  (m: Record<string, unknown>) => boolean;
  }): this

  // Fields (added to last section or specified section)
  .addField(field: FieldContract, sectionId?: string): this
  .addTextField(config: Omit<FieldContract, 'type'>, sectionId?: string): this
  .addSelectField(config: Omit<FieldContract, 'type'>, sectionId?: string): this
  .addDateField(config: Omit<FieldContract, 'type'>, sectionId?: string): this
  .addEntityPicker(config: Omit<FieldContract, 'type'> & { entityRef: string }, sectionId?: string): this
  .removeField(key: string): this
  .modifyField(key: string, updates: Partial<FieldContract>): this

  // Hooks
  .withBeforeSubmit(fn: FormHooksContract['beforeSubmit']): this
  .withAfterSave(fn: FormHooksContract['afterSave']): this
  .withOnValueChange(fn: FormHooksContract['onValueChange']): this

  // Layout
  .withLayout(layout: 'single-column' | 'two-column' | 'tabbed'): this

  // Terminal
  .build(): FormSchema
  .validate(): ValidationResult

  // Usage: extend an existing form
  const EmployeeEditForm = FormBuilder.from(EmployeeCreateForm)
    .removeField('email')
    .addField({ key: 'exitDate', type: 'date', label: 'Exit Date', hidden: (m) => m['status'] !== 'TERMINATED' })
    .build();
}
```

### 6.3 TableBuilder

```typescript
class TableBuilder {

  static create(): TableBuilder
  static from(existing: TableContract): TableBuilder

  .addColumn(col: ColumnContract): this
  .insertColumn(col: ColumnContract, afterId: string): this
  .removeColumn(id: string): this
  .modifyColumn(id: string, updates: Partial<ColumnContract>): this
  .withDefaultSort(field: string, direction?: 'asc' | 'desc'): this
  .withPageSize(size: number): this
  .selectable(value?: boolean): this
  .searchable(placeholder?: string): this
  .exportable(value?: boolean): this
  .withRowClick(behavior: TableContract['rowClickBehavior']): this
  .addActionsColumn(sticky?: boolean): this

  // Terminal
  .build(): TableDef
  .validate(): ValidationResult
}
```

### 6.4 WorkflowBuilder

```typescript
class WorkflowBuilder {

  static create(id: string, entityId: string): WorkflowBuilder
  static from(existing: WorkflowContract): WorkflowBuilder

  .withInitialState(stateId: string): this
  .addState(state: WorkflowStateContract): this
  .addTransition(transition: WorkflowTransitionContract): this
  .removeState(stateId: string): this
  .removeTransition(transitionId: string): this

  // Terminal
  .build(): WorkflowDef
  .validate(): ValidationResult
}
```

### 6.5 DashboardBuilder

```typescript
class DashboardBuilder {

  static create(id: string, name: string): DashboardBuilder
  static from(existing: DashboardContract): DashboardBuilder

  .forModule(moduleCode: string): this
  .forRole(roleCode: string): this
  .locked(value?: boolean): this
  .addSlot(slot: DashboardSlotContract): this
  .addWidget(widgetId: string, column: number, row: number, colSpan: number): this
  .removeSlot(widgetId: string): this
  .moveSlot(widgetId: string, column: number, row: number): this

  // Terminal
  .build(): DashboardDef
  .validate(): ValidationResult
}
```

### 6.6 WidgetBuilder

```typescript
class WidgetBuilder {

  static create(id: string): WidgetBuilder

  .withName(name: string): this
  .withIcon(icon: string): this
  .withComponent(loader: () => Promise<Type<any>>): this
  .withPermission(permission: string): this
  .withMinWidth(cols: number): this
  .withDefaultSize(cols: number, rows?: number): this
  .withCategory(category: string): this
  .withConfigSchema(schema: FormContract): this
  .withDescription(desc: string): this

  // Terminal
  .build(): WidgetDef
  .validate(): ValidationResult
}
```

### 6.7 PluginBuilder

```typescript
class PluginBuilder {

  static create(id: string): PluginBuilder

  .withName(name: string): this
  .withVersion(version: string): this
  .withCategory(category: PluginCategory): this
  .withAuthor(author: AuthorContract): this
  .withMinimumPlatformVersion(range: string): this
  .requiresPlugin(pluginId: string, version: string, reason?: string): this
  .optionalPlugin(pluginId: string, version: string): this
  .declaresCapability(capability: string): this
  .requiresCapability(capability: string): this
  .addEntity(entity: EntityContract): this
  .addEntities(...entities: EntityContract[]): this
  .addRoute(route: RouteContract): this
  .addMenu(menu: MenuContract): this
  .addWidget(widget: WidgetContract): this
  .addWorkflow(workflow: WorkflowContract): this
  .addDashboard(dashboard: DashboardContract): this
  .addReport(report: ReportContract): this
  .addPermissions(permissions: PermissionContract[]): this
  .addValidator(validator: ValidatorContract): this
  .addLookup(lookup: LookupContract): this
  .overrides(registryName: string, entryId: string, reason?: string): this
  .withOverridePriority(priority: number): this
  .enabledByDefault(value?: boolean): this
  .withInitFn(fn: PluginInitFn): this
  .withDescription(desc: string): this
  .withIcon(icon: string): this

  // Terminal
  .build(): PluginManifest
  .validate(): ValidationResult
}
```

---

## 7. Validators

### 7.1 validate*() Functions

Each validate function checks a metadata object against its contract rules and returns a `ValidationResult`.

```typescript
interface ValidationResult {
  valid:    boolean;
  errors:   ValidationIssue[];
  warnings: ValidationIssue[];
}

interface ValidationIssue {
  path:     string;       // 'sections[0].fields[2].type'
  message:  string;
  code:     string;       // 'INVALID_TYPE', 'REQUIRED', 'PATTERN_MISMATCH', etc.
  value?:   unknown;
  hint?:    string;
}
```

### 7.2 Individual Validators

```typescript
// @idoo/platform/validators
function validatePlugin(manifest: unknown):   ValidationResult
function validateEntity(def: unknown):        ValidationResult
function validateForm(schema: unknown):       ValidationResult
function validateTable(def: unknown):         ValidationResult
function validateAction(def: unknown):        ValidationResult
function validateRoute(def: unknown):         ValidationResult
function validateMenu(def: unknown):          ValidationResult
function validateWidget(def: unknown):        ValidationResult
function validateWorkflow(def: unknown):      ValidationResult
function validateDashboard(def: unknown):     ValidationResult
function validatePermission(def: unknown):    ValidationResult
function validateLookup(def: unknown):        ValidationResult
function validateReport(def: unknown):        ValidationResult
function validateValidator(def: unknown):     ValidationResult
```

### 7.3 Aggregate Validator

```typescript
// Validate an entire plugin manifest and all its contributed metadata
function validatePluginFull(manifest: unknown): PluginValidationReport

interface PluginValidationReport {
  pluginResult:   ValidationResult;
  entityResults:  Map<string, ValidationResult>;
  formResults:    Map<string, ValidationResult>;
  tableResults:   Map<string, ValidationResult>;
  routeResults:   Map<string, ValidationResult>;
  menuResults:    Map<string, ValidationResult>;
  actionResults:  Map<string, ValidationResult>;
  widgetResults:  Map<string, ValidationResult>;
  workflowResults:Map<string, ValidationResult>;
  summary: {
    totalIssues:   number;
    totalErrors:   number;
    totalWarnings: number;
    isValid:       boolean;
  };
}
```

### 7.4 CI Validator

For use in build pipelines:

```bash
# Validate all plugins before build
npx idoo validate --plugins src/app/plugins/*/

# Validate a specific plugin
npx idoo validate --plugin src/app/plugins/hr/hr.manifest.ts

# Output formats
npx idoo validate --plugin hr --format json    # Machine-readable
npx idoo validate --plugin hr --format table   # Human-readable table
npx idoo validate --plugin hr --format junit   # CI test report format
```

### 7.5 Built-in Validation Rules Reference

| Rule Code | Applies To | Description |
|---|---|---|
| `REQUIRED` | All | Required field is missing |
| `INVALID_TYPE` | All | Field has wrong TypeScript type |
| `PATTERN_MISMATCH` | id, code | Value doesn't match expected pattern |
| `INVALID_SEMVER` | version | Not a valid SemVer string |
| `INVALID_SEMVER_RANGE` | minimumPlatformVersion | Not a valid SemVer range |
| `DUPLICATE_ID` | All | ID already used in same context |
| `EMPTY_ARRAY` | sections, columns, items | Required array is empty |
| `INVALID_COLUMN_TYPE` | TableContract | Unknown column type |
| `MISSING_OPTIONS` | FieldContract (select) | Select field without options |
| `MISSING_ENTITY_REF` | FieldContract (picker) | Entity-picker without entityRef |
| `INVALID_PAGE_SIZE` | TableContract | pageSize outside 5–200 |
| `INVALID_COLUMNS` | FormSectionContract | columns not in 1,2,3,4 |
| `MISSING_HANDLER` | ActionContract | Action without handler function |
| `INVALID_SCOPE` | ActionContract | Unknown ActionScope value |
| `INVALID_PERM_FORMAT` | PermissionContract | Code not UPPER:UPPER:UPPER |
| `ORPHAN_WORKFLOW` | WorkflowContract | entityId not found in same plugin |
| `INVALID_STATE_REF` | WorkflowTransitionContract | from/to references unknown state |
| `TERMINAL_STATE_HAS_TRANSITION` | WorkflowStateContract | terminal state has outgoing transitions |
| `INVALID_WIDGET_WIDTH` | WidgetContract | minWidth outside 1–12 |
| `MISSING_COMPONENT` | WidgetContract | component loader not a function |
| `INVALID_API_PATH` | EntityContract | apiPath doesn't start with /v1/ |
| `INVALID_ENTITY_ID` | EntityContract | id doesn't match module:entity pattern |
| `MISSING_LIST_PERMISSION` | EntityContract | permissions.list is required |
| `MISSING_OVERRIDE_DECL` | PluginContract | Override without declaration |

---

## 8. Metadata Helpers

### 8.1 withDefaults()

Apply default values to a partial metadata object:

```typescript
// @idoo/platform/helpers
function withDefaults<T>(partial: Partial<T>, defaults: T): T

// Usage
const table = withDefaults<TableContract>(userConfig, {
  columns:             [],
  pageSize:            20,
  selectable:          true,
  searchable:          true,
  searchPlaceholder:   'Search...',
  exportable:          false,
  rowClickBehavior:    'navigate-detail',
});
```

### 8.2 merge()

Deep-merge two metadata objects (override wins on conflict):

```typescript
function merge<T extends object>(base: T, override: DeepPartial<T>): T

// Usage: apply tenant-specific form override
const tenantForm = merge(EmployeeCreateForm, {
  sections: [{
    id:     'personal',
    fields: [{ key: 'nationalId', type: 'text', label: 'National ID', required: true }],
  }]
});
// → Merges the nationalId field into the personal section
```

### 8.3 pick() and omit()

```typescript
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>
function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>

// Usage
const minimalPermissions = pick(HR.EMPLOYEES, ['READ', 'CREATE']);
const permissionsWithoutDelete = omit(HR.EMPLOYEES, ['DELETE']);
```

### 8.4 extendForm()

Create a new form by extending an existing one:

```typescript
function extendForm(base: FormContract, extensions: FormExtension): FormContract

interface FormExtension {
  addSections?:    FormSectionContract[];
  addFields?:      Array<{ sectionId: string; fields: FieldContract[] }>;
  modifyFields?:   Array<{ key: string; updates: Partial<FieldContract> }>;
  removeFields?:   string[];
  removeSections?: string[];
  hooks?:          Partial<FormHooksContract>;
}

// Usage: extend the standard create form for a specific tenant
const TenantEmployeeForm = extendForm(EmployeeCreateForm, {
  addFields: [{ sectionId: 'personal', fields: [
    { key: 'nationalId', type: 'text', label: 'National ID', required: true },
  ]}],
  modifyFields: [{ key: 'email', updates: { required: false } }],
});
```

### 8.5 extendTable()

```typescript
function extendTable(base: TableContract, extensions: TableExtension): TableContract

interface TableExtension {
  addColumns?:     ColumnContract[];
  insertColumns?:  Array<{ column: ColumnContract; afterId: string }>;
  removeColumns?:  string[];
  modifyColumns?:  Array<{ id: string; updates: Partial<ColumnContract> }>;
  withDefaultSort?: { field: string; direction: 'asc' | 'desc' };
  withPageSize?:   number;
}
```

### 8.6 createActionGroup()

Bundle related actions together:

```typescript
function createActionGroup(
  entityId: string,
  actions:  ActionContract[],
): ActionDef[]

// Usage
export const EmployeeActions = createActionGroup('hr:employee', [
  ActivateEmployeeAction,
  DeactivateEmployeeAction,
  SuspendEmployeeAction,
  TerminateEmployeeAction,
]);
```

### 8.7 createFormSection()

```typescript
function createFormSection(config: FormSectionContract): FormSectionContract
// Simple pass-through with type checking + defaults for optional fields
```

### 8.8 createColumn()

```typescript
function createColumn(config: ColumnContract): ColumnContract
function createBadgeColumn(config: Omit<ColumnContract, 'type'> & { badges: BadgeConfig[] }): ColumnContract
function createActionsColumn(sticky?: boolean): ColumnContract
function createAvatarColumn(config: Omit<ColumnContract, 'type'>): ColumnContract
```

---

## 9. Default Values

### 9.1 Platform Defaults Catalogue

All defaults are centralized and importable:

```typescript
// @idoo/platform/helpers
export const PLATFORM_DEFAULTS = {
  table: {
    pageSize:          20,
    selectable:        true,
    searchable:        true,
    exportable:        false,
    rowClickBehavior:  'navigate-detail' as const,
  },
  form: {
    layout:   'two-column' as const,
    columns:  2,
  },
  action: {
    variant:       'secondary' as const,
    type:          'http' as const,
    navigateAfter: 'none' as const,
    order:         99,
  },
  route: {
    preload: false,
  },
  widget: {
    minWidth:     2,
    defaultWidth: 4,
    defaultHeight:3,
  },
  plugin: {
    overridePriority: 0,
    enabledByDefault: true,
  },
  workflow: {
    initialState: 'DRAFT',
  },
} as const;
```

### 9.2 Entity Defaults

When using `defineEntity()` without specifying optional fields:

```
defaultView:    'table'
searchable:     false
exportable:     false
hasSoftDelete:  false
form.edit:      → same as form.create
form.view:      → same as form.create (all fields read-only)
```

### 9.3 Form Defaults

```
section.columns:   2
field.required:    false
field.disabled:    false
field.colSpan:     1
```

---

## 10. Type Safety Architecture

### 10.1 Generics on EntityDef

`EntityDef<TRecord>` carries the TypeScript type of the backend record as a generic parameter:

```typescript
interface Employee {
  id:         string;
  firstName:  string;
  lastName:   string;
  fullName:   string;
  email:      string;
  status:     'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
  hireDate:   string;
}

export const EmployeeEntity = defineEntity<Employee>({
  id:         'hr:employee',
  labelField: 'fullName',   // TypeScript: must be keyof Employee
  // ...
  table: defineTable({
    columns: [
      { id: 'name', accessor: 'fullName', type: 'text' },
      // accessor: TypeScript checks it exists on Employee
    ]
  }),
});
```

### 10.2 TypeScript Conditional Types in Contracts

```typescript
// FieldContract uses conditional types to enforce correct fields per type:
type FieldContractFor<T extends FieldType> =
  T extends 'select' | 'multi-select' ? FieldContractWithOptions :
  T extends 'entity-picker'           ? FieldContractWithEntityRef :
  T extends 'number'                  ? FieldContractWithRange :
  T extends 'textarea'                ? FieldContractWithRows :
  BaseFieldContract;

// So this would be a TypeScript error:
{ key: 'status', type: 'select', label: 'Status' }
//  ↑ TypeScript error: 'options' or 'optionsLoader' is required for type 'select'
```

### 10.3 ActionContext Typing

```typescript
interface ActionContext<TRecord = Record<string, unknown>> {
  row?:      TRecord;
  rows?:     TRecord[];   // for bulk actions
  entityId:  string;
  mode:      'row' | 'bulk' | 'global' | 'header' | 'detail';
}

// Typed action for Employee:
const ActivateAction = defineAction({
  id:      'hr:employee:activate',
  scope:   ['row'],
  handler: (ctx: ActionContext<Employee>) => {
    // ctx.row is typed as Employee | undefined
    return inject(HrEmployeeApiClient).update(ctx.row!.id, { status: 'ACTIVE' });
  },
});
```

### 10.4 Permission Type Safety

```typescript
// Permission codes are typed as string literals via the constants structure:
type HrPermissionCode = typeof HR[keyof typeof HR][keyof typeof HR[keyof typeof HR]];
// = 'HR:EMPLOYEES:READ' | 'HR:EMPLOYEES:CREATE' | 'HR:EMPLOYEES:UPDATE' | ...

// defineAction enforces this:
const action = defineAction({
  permission: 'HR:EMPLOYEES:READ',   // ✓ valid
  // permission: 'hr:employee:read', // TypeScript error (wrong case format)
});
```

### 10.5 Branded Types for IDs

```typescript
// Entity IDs, plugin IDs, and registry IDs use branded types to prevent misuse:
type EntityId  = string & { readonly __brand: 'EntityId' };
type PluginId  = string & { readonly __brand: 'PluginId' };
type WidgetId  = string & { readonly __brand: 'WidgetId' };

// The define*() functions return objects with branded IDs:
const entity = defineEntity({ id: 'hr:employee', ... });
entity.id  // type: EntityId — not interchangeable with PluginId
```

---

## 11. Versioning and Compatibility

### 11.1 SDK Version Policy

The SDK follows Semantic Versioning strictly:

| Change | Version Bump | Examples |
|---|---|---|
| New `define*()` function | Minor (1.0.0 → 1.1.0) | `defineLocale()` added |
| New optional field in Contract | Minor | `ActionContract.hotkey` added |
| New Builder method | Minor | `FormBuilder.addSection()` added |
| Removing a field | Major (1.x.x → 2.0.0) | Requires migration guide |
| Changing a field type | Major | Requires migration guide |
| Breaking change to any Contract | Major | Migration guide + codemod |

### 11.2 @deprecated Annotation Strategy

Before any field is removed in a major version, it is deprecated for one full minor version cycle with a JSDoc `@deprecated` annotation:

```typescript
interface TableContract {
  /**
   * @deprecated Use `rowClickBehavior` instead. Will be removed in SDK v2.0.
   */
  clickable?: boolean;

  rowClickBehavior?: 'navigate-detail' | 'navigate-edit' | 'open-drawer' | 'none';
}
```

The `validate*()` functions emit `DEPRECATED_FIELD` warnings for deprecated fields.

### 11.3 SDK ↔ Platform Compatibility Matrix

```
SDK Version    Compatible Platform Versions    Notes
-----------    ----------------------------    -----
1.0.x          1.0.x                           Initial release
1.1.x          1.0.x, 1.1.x                   Backwards-compatible additions
1.2.x          1.0.x, 1.1.x, 1.2.x
2.0.x          2.0.x                           Breaking changes (with migration guide)
```

A plugin compiled against SDK 1.1 will work on Platform 1.0 but the 1.1-only fields will be ignored (graceful degradation). A plugin compiled against SDK 2.0 will NOT work on Platform 1.x.

### 11.4 SDK Version Declaration in Manifest

```typescript
const HrPlugin = definePlugin({
  id: 'HR',
  // ...
  // Automatically injected by definePlugin() from package.json:
  // sdkVersion: '1.0.0'
});
```

The `CompatibilityChecker` in the Plugin System reads `sdkVersion` and validates compatibility.

### 11.5 Codemods

Major version migrations ship with codemods (automated code transformations):

```bash
# Migrate from SDK 1.x to 2.0
npx @idoo/codemod sdk-1-to-2 src/app/plugins/

# Preview changes (dry run)
npx @idoo/codemod sdk-1-to-2 src/app/plugins/ --dry-run

# Migrate specific plugin
npx @idoo/codemod sdk-1-to-2 src/app/plugins/hr/
```

---

## 12. Extension APIs

### 12.1 Custom Field Type Registration

```typescript
// In plugin's initFn:
export const HrInitFn: PluginInitFn = async (platform: PlatformAPI) => {
  platform.fields.register('salary-grade', {
    component: () => import('./fields/salary-grade.field')
                       .then(m => m.SalaryGradeFieldComponent),
    label: 'Salary Grade',
    icon:  'attach_money',
  });
};
```

### 12.2 Custom Validator Registration

```typescript
platform.validators.register('egyptianNationalId', {
  factory: (_, message) => (control) => {
    if (!control.value) return null;
    return /^\d{14}$/.test(control.value) ? null
      : { egyptianNationalId: message ?? 'Invalid National ID.' };
  },
  defaultMessage: 'Must be a valid 14-digit Egyptian National ID.',
  label: 'Egyptian National ID',
});
```

### 12.3 Custom Cell Renderer Registration

```typescript
platform.renderers.register('vehicle-status', {
  component: () => import('./renderers/vehicle-status.cell')
                     .then(m => m.VehicleStatusCellComponent),
  label: 'Vehicle Status Badge',
});
```

### 12.4 Plugin Health Check Registration

```typescript
platform.health.register({
  name:        'hr:api-connectivity',
  description: 'Checks that the HR backend service is reachable',
  check: async () => {
    try {
      const resp = await fetch(`${platform.config.apiUrl}/v1/hr/health`);
      return resp.ok
        ? { name: 'hr:api-connectivity', status: 'healthy', message: 'HR API OK' }
        : { name: 'hr:api-connectivity', status: 'degraded', message: `HTTP ${resp.status}` };
    } catch {
      return { name: 'hr:api-connectivity', status: 'unhealthy', message: 'HR API unreachable' };
    }
  },
});
```

### 12.5 Event Bus Usage in initFn

```typescript
platform.events.on<{ vehicleId: string; driverId: string }>('fleet:vehicle:assigned')
  .pipe(takeUntilDestroyed())
  .subscribe(event => {
    // React to fleet event in HR plugin
    platform.logger.info(`Driver ${event.driverId} assigned to vehicle ${event.vehicleId}`);
  });
```

### 12.6 Feature Flag Checks

```typescript
if (platform.features.isEnabled('hr.advanced-payroll')) {
  platform.fields.register('salary-band-picker', {
    component: () => import('./fields/salary-band.field').then(m => m.SalaryBandPickerComponent),
  });
}
```

---

## 13. Development Workflow

### 13.1 Standard Plugin Development Flow

```
Step 1: Scaffold
  $ idoo create plugin HR "Human Resources"
  → Creates complete file structure with all boilerplate

Step 2: Define Permissions
  Edit: src/app/plugins/hr/permissions/hr.permissions.ts
  Use: createPermissions('HR', { EMPLOYEES: ['READ','CREATE','UPDATE','DELETE','EXPORT'] })

Step 3: Define Lookups (reference data)
  Edit: src/app/plugins/hr/lookups/hr.lookups.ts
  Use: defineLookup({ id: 'hr:contract-types', ... })

Step 4: Define Entities
  $ idoo create entity hr employee
  → Scaffolds: entity.ts, form.ts, table.ts, filters.ts, actions.ts
  Edit each file with domain-specific fields

Step 5: Define Workflows
  Edit: src/app/plugins/hr/workflows/employee.workflow.ts
  Use: defineWorkflow({ ... })

Step 6: Assemble Plugin Manifest
  Edit: src/app/plugins/hr/hr.manifest.ts
  Use: definePlugin({ entities: [...], routes: [...], menus: [...] })

Step 7: Register in app.config.ts
  Add: providePlugin(HrPlugin)

Step 8: Validate
  $ idoo validate --plugin hr
  → Runs validatePluginFull() and reports issues

Step 9: Start Dev Server
  $ ng serve

Step 10: Test
  $ ng test --include src/app/plugins/hr/**/*.spec.ts
```

### 13.2 Plugin File Conventions

```
Plugin file naming:
  {entity}.entity.ts       → EntityDef + exports
  {entity}.form.ts         → FormSchema(s) + exports
  {entity}.table.ts        → TableDef + exports
  {entity}.filters.ts      → FilterDef[] + exports
  {entity}.actions.ts      → ActionDef[] + exports
  {plugin}.manifest.ts     → PluginManifest (the only file registered in app.config.ts)
  {plugin}.permissions.ts  → Permission constants + PermissionDef[]
  {plugin}.init.ts         → PluginInitFn (if needed)

Variable naming:
  EmployeeEntity           → EntityDef (PascalCase + 'Entity')
  EmployeeCreateForm       → FormSchema (PascalCase + mode + 'Form')
  EmployeeTable            → TableDef (PascalCase + 'Table')
  EmployeeFilters          → FilterDef[] (PascalCase + 'Filters')
  EmployeeActions          → ActionDef[] (PascalCase + 'Actions')
  EmployeeWorkflow         → WorkflowDef (PascalCase + 'Workflow')
  HrPlugin                 → PluginManifest (PascalCase + 'Plugin')
```

### 13.3 Import Ordering Convention

```typescript
// 1. Platform SDK imports
import { defineEntity, defineForm, defineTable } from '@idoo/platform/define';
import { EntityContract }                         from '@idoo/platform/contracts';

// 2. Platform helpers
import { createPermissions }                      from '@idoo/platform/permissions';

// 3. Sibling module imports (same plugin only)
import { HR }                                     from '../permissions/hr.permissions';
import { HrEmployeeApiClient }                   from '../api/hr-employee.api';

// FORBIDDEN:
// import { EntityRegistry } from '@core/registry/entity.registry';   ❌
// import { DepartmentEntity } from '../../fleet/entities/vehicle';    ❌ (cross-plugin)
```

---

## 14. CLI Architecture

### 14.1 CLI Overview

The `idoo` CLI is a Node.js command-line tool distributed as `@idoo/cli`. It provides scaffolding, code generation, validation, and build utilities.

```
idoo <command> [options]

Commands:
  create    — scaffold new plugins, entities, widgets, etc.
  generate  — generate code from existing metadata
  validate  — validate plugin metadata
  check     — run compatibility checks
  list      — list registered plugins, entities, routes
  docs      — generate documentation from metadata
  migrate   — run SDK migration codemods
  dev       — development utilities (mock server, mock data)
```

### 14.2 CLI Architecture Diagram

```
                        ┌─────────────────────────────────────────┐
                        │               idoo CLI                   │
                        │         (Node.js / commander.js)         │
                        └────────────────────┬────────────────────┘
                                             │
        ┌──────────────────┬─────────────────┼─────────────────┬──────────────────┐
        │                  │                 │                 │                  │
  ┌─────▼──────┐  ┌────────▼────────┐  ┌────▼───────┐  ┌─────▼──────┐  ┌────────▼────────┐
  │  Scaffold   │  │    Validator    │  │ Generator  │  │   Checker  │  │    Doc Gen      │
  │  Engine     │  │    Runner       │  │  Engine    │  │   Engine   │  │    Engine       │
  │             │  │                 │  │            │  │            │  │                 │
  │ -templates  │  │ -validatePlugin │  │ -fromMeta  │  │ -compat    │  │ -markdown       │
  │ -prompts    │  │ -validateAll    │  │ -api-client│  │ -versions  │  │ -openapi        │
  │ -file gen   │  │ -ciFormat       │  │ -mock-data │  │ -breaking  │  │ -schema         │
  └─────────────┘  └─────────────────┘  └────────────┘  └────────────┘  └─────────────────┘
        │
  ┌─────▼──────────────────────────────────────────────────────────────────────┐
  │                          Template Engine (Handlebars/EJS)                   │
  │  Templates live in: @idoo/cli/templates/                                    │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 14.3 Command: create plugin

```bash
idoo create plugin <id> [name]

Options:
  --category    erp|analytics|integration|tenant-config  (default: erp)
  --no-entity   Skip generating a default entity
  --no-init     Skip generating an initFn file
  --author      Author name
  --version     Initial version (default: 1.0.0)
  --dry-run     Show files that would be created without creating them

Example:
  $ idoo create plugin FLEET "Fleet Management"

Generated files:
  src/app/plugins/fleet/
  ├── fleet.manifest.ts
  ├── permissions/
  │   └── fleet.permissions.ts
  ├── entities/
  │   └── vehicle/
  │       ├── vehicle.entity.ts
  │       ├── vehicle.form.ts
  │       ├── vehicle.table.ts
  │       ├── vehicle.filters.ts
  │       └── vehicle.actions.ts
  ├── workflows/
  │   └── vehicle.workflow.ts
  └── init/
      └── fleet.init.ts
```

### 14.4 Command: create entity

```bash
idoo create entity <plugin-id> <entity-name>

Options:
  --no-form       Skip form generation
  --no-table      Skip table generation
  --no-filters    Skip filter generation
  --no-actions    Skip action generation
  --no-workflow   Skip workflow generation
  --fields        Comma-separated field definitions: 'name:text,status:select,date:date'

Example:
  $ idoo create entity hr department --fields "name:text,parentId:entity-picker:hr:department"

Generated files:
  src/app/plugins/hr/entities/department/
  ├── department.entity.ts
  ├── department.form.ts
  ├── department.table.ts
  ├── department.filters.ts
  └── department.actions.ts
  (also updates hr.manifest.ts to include the new entity)
```

### 14.5 Command: create widget

```bash
idoo create widget <plugin-id> <widget-name>

Options:
  --category    Widget category label
  --min-width   Minimum column span (default: 2)
  --no-config   Skip config schema generation

Example:
  $ idoo create widget hr headcount --category "HR" --min-width 3

Generated files:
  src/app/plugins/hr/widgets/headcount/
  ├── headcount.widget.ts      (WidgetDef)
  └── headcount.component.ts   (Angular standalone component)
```

### 14.6 Command: create dashboard

```bash
idoo create dashboard <plugin-id> <dashboard-id> [name]

Example:
  $ idoo create dashboard hr default "HR Overview"

Generated files:
  src/app/plugins/hr/dashboards/
  └── hr-default.dashboard.ts
```

### 14.7 Command: validate

```bash
idoo validate [options]

Options:
  --plugin      Path or plugin ID to validate
  --plugins     Glob pattern to validate multiple plugins
  --format      table|json|junit  (default: table)
  --strict      Treat warnings as errors (for CI)
  --watch       Re-validate on file changes

Examples:
  $ idoo validate --plugin hr
  $ idoo validate --plugins "src/app/plugins/*/*.manifest.ts"
  $ idoo validate --plugin hr --format junit > test-results/plugin-validation.xml
```

### 14.8 Command: generate api-client

```bash
idoo generate api-client <entity-id>

Reads the entity's apiPath from the plugin manifest and generates
a typed API client class with CRUD methods.

Example:
  $ idoo generate api-client hr:employee

Generated:
  src/app/plugins/hr/api/hr-employee.api.ts
  (with full CRUD + pagination methods typed to EmployeeRecord interface)
```

### 14.9 Command: check compatibility

```bash
idoo check compatibility [options]

Options:
  --plugin          Plugin to check
  --platform-version  Platform version to check against (default: current)

Output:
  ✓ HR plugin v1.2.0 is compatible with Platform v1.0.0
  ✓ All dependencies satisfied
  ✗ FLEET plugin requires 'hr:employee-management' capability
    → Install HR plugin to provide this capability
```

### 14.10 Command: docs generate

```bash
idoo docs generate [options]

Options:
  --plugin      Plugin to document
  --format      markdown|html|json  (default: markdown)
  --output      Output directory (default: docs/plugins/{pluginId}/)

Generates:
  - Plugin overview (entities, routes, permissions)
  - Entity documentation (fields, columns, actions, workflow)
  - Permission reference
  - API endpoint listing
```

---

## 15. Code Generators

### 15.1 Generator Architecture

Code generators are TypeScript modules in `@idoo/cli/generators/` that take a metadata contract as input and produce TypeScript source code as output.

```
Generator<TInput, TOutput>
├── name:     string
├── template: string (path to Handlebars template)
├── generate(input: TInput): GeneratorOutput
└── validate(input: TInput): ValidationResult

GeneratorOutput
├── files:   GeneratedFile[]
│   ├── path:     string
│   ├── content:  string
│   └── overwrite: boolean
└── postActions: PostAction[]
    ├── type: 'update-manifest' | 'run-prettier' | 'run-eslint'
    └── payload: unknown
```

### 15.2 Built-in Generators

| Generator | Input | Output |
|---|---|---|
| `plugin-scaffold` | PluginContract partial | Complete plugin file structure |
| `entity-scaffold` | EntityId + field list | entity.ts, form.ts, table.ts, filters.ts, actions.ts |
| `widget-scaffold` | WidgetContract | widget.ts + component.ts |
| `api-client` | EntityDef | Typed HttpClient wrapper class |
| `mock-data` | EntityDef | Fake data factory using faker.js |
| `permission-constants` | PermissionDef[] | PERMISSIONS constants object |
| `permission-module` | PermissionDef[] | TYPE.MODULE.RESOURCE.ACTION constant tree |
| `test-spec` | EntityDef | Unit test spec file for entity metadata |
| `storybook-story` | WidgetDef | Storybook story for the widget |

### 15.3 Generator Output — Entity Scaffold (example)

For `$ idoo create entity hr employee`:

**entity.ts** template output:
```typescript
import { defineEntity } from '@idoo/platform/define';
import { HR }           from '../permissions/hr.permissions';
import { EmployeeCreateForm, EmployeeEditForm } from './employee.form';
import { EmployeeTable }   from './employee.table';
import { EmployeeFilters } from './employee.filters';
import { EmployeeActions } from './employee.actions';

export const EmployeeEntity = defineEntity({
  id:            'hr:employee',
  apiPath:       '/v1/hr/employees',
  labelSingular: 'Employee',
  labelPlural:   'Employees',
  labelField:    'fullName',
  icon:          'person',
  permissions: {
    list:   HR.EMPLOYEES.READ,
    create: HR.EMPLOYEES.CREATE,
    update: HR.EMPLOYEES.UPDATE,
    delete: HR.EMPLOYEES.DELETE,
    export: HR.EMPLOYEES.EXPORT,
  },
  table:   EmployeeTable,
  form: {
    create: EmployeeCreateForm,
    edit:   EmployeeEditForm,
  },
  filters: EmployeeFilters,
  actions: EmployeeActions,
  searchable: true,
  exportable: true,
});
```

---

## 16. Templates

### 16.1 Template System

Templates are Handlebars (`.hbs`) files stored in `@idoo/cli/templates/`. Each template produces one TypeScript file.

### 16.2 Template Variables

All templates receive a standard context:

```typescript
interface TemplateContext {
  pluginId:      string;        // 'HR'
  pluginName:    string;        // 'Human Resources'
  entityId:      string;        // 'hr:employee'
  entityName:    string;        // 'Employee'
  entityNamePlural: string;     // 'Employees'
  entityCamel:   string;        // 'employee'
  entityPascal:  string;        // 'Employee'
  moduleCode:    string;        // 'HR'
  apiPath:       string;        // '/v1/hr/employees'
  fields:        TemplateField[];
  timestamp:     string;        // generation timestamp
  sdkVersion:    string;        // '@idoo/platform' version
}
```

### 16.3 Template Directory Structure

```
@idoo/cli/templates/
├── plugin/
│   ├── manifest.ts.hbs
│   ├── permissions.ts.hbs
│   └── init.ts.hbs
├── entity/
│   ├── entity.ts.hbs
│   ├── form.ts.hbs
│   ├── table.ts.hbs
│   ├── filters.ts.hbs
│   └── actions.ts.hbs
├── widget/
│   ├── widget.ts.hbs
│   └── component.ts.hbs
├── api/
│   └── api-client.ts.hbs
├── dashboard/
│   └── dashboard.ts.hbs
└── test/
    ├── entity.spec.ts.hbs
    └── plugin.spec.ts.hbs
```

### 16.4 Custom Templates

Developers can override built-in templates in their project:

```
.idoo/
└── templates/
    └── entity/
        └── entity.ts.hbs    ← overrides the built-in entity template
```

Custom templates are detected automatically by the CLI.

---

## 17. Testing Helpers

### 17.1 Testing Philosophy

Plugin metadata should be unit-tested. The `@idoo/platform/testing` package provides utilities to test that metadata is valid and produces the expected behaviour when processed by the platform engines.

### 17.2 createMockPlatform()

Creates a minimal in-memory platform instance for testing plugins without Angular:

```typescript
// @idoo/platform/testing
function createMockPlatform(config?: Partial<PlatformConfigPublic>): MockPlatformAPI

interface MockPlatformAPI extends PlatformAPI {
  // All PlatformAPI methods + test utilities:
  getRegisteredFields():    string[];
  getRegisteredValidators():string[];
  getEmittedEvents():       PluginEvent[];
  clearEvents():            void;
  triggerEvent<T>(type: string, payload: T): void;
}

// Usage in test:
describe('HrPlugin initFn', () => {
  it('registers salary-grade field type', async () => {
    const platform = createMockPlatform();
    await HrPlugin.initFn!(platform);
    expect(platform.getRegisteredFields()).toContain('salary-grade');
  });
});
```

### 17.3 createTestPlugin()

Creates a minimal plugin manifest for testing purposes:

```typescript
function createTestPlugin(overrides?: Partial<PluginContract>): PluginManifest

// Usage:
const testPlugin = createTestPlugin({
  id:       'TEST',
  entities: [EmployeeEntity],
});
```

### 17.4 validatePlugin Test Utility

```typescript
function expectValidPlugin(manifest: PluginManifest): void
function expectValidEntity(def: EntityDef): void
function expectValidForm(schema: FormSchema): void
function expectValidTable(def: TableDef): void
function expectValidWorkflow(def: WorkflowDef): void

// Usage:
describe('HR Plugin metadata', () => {
  it('should produce a valid plugin manifest', () => {
    expectValidPlugin(HrPlugin);
  });

  it('should have a valid EmployeeEntity', () => {
    expectValidEntity(EmployeeEntity);
  });

  it('should have a valid EmployeeWorkflow', () => {
    expectValidWorkflow(EmployeeWorkflow);
    // Also checks: initialState exists, all transition states exist
  });
});
```

### 17.5 createMockActionContext()

```typescript
function createMockActionContext<T extends object>(
  overrides?: Partial<ActionContext<T>>
): ActionContext<T>

// Usage:
describe('EmployeeActions', () => {
  it('should hide activate action for ACTIVE employees', () => {
    const ctx = createMockActionContext<Employee>({
      row: { ...mockEmployee, status: 'ACTIVE' },
      mode: 'row',
    });
    expect(ActivateEmployeeAction.hidden!(ctx)).toBe(true);
  });
});
```

### 17.6 Schema Snapshot Testing

```typescript
function toMatchPluginSnapshot(manifest: PluginManifest): jest.CustomMatcher
function toMatchEntitySnapshot(def: EntityDef): jest.CustomMatcher

// Usage:
it('HR plugin manifest should match snapshot', () => {
  expect(HrPlugin).toMatchPluginSnapshot();
});
// Generates/checks: __snapshots__/hr.plugin.snap
```

### 17.7 Test Utilities for Forms

```typescript
// Simulate a form value change and check hidden field visibility
function createFormModel(schema: FormSchema, initialValues?: Record<string, unknown>): FormModelSimulator

interface FormModelSimulator {
  setValue(key: string, value: unknown): void;
  getValue(key: string): unknown;
  isFieldVisible(key: string): boolean;
  isFieldRequired(key: string): boolean;
  getModel(): Record<string, unknown>;
}

// Usage:
it('should hide contractEndDate for PERMANENT contracts', () => {
  const model = createFormModel(EmployeeCreateForm, { contractType: 'PERMANENT' });
  expect(model.isFieldVisible('contractEndDate')).toBe(false);

  model.setValue('contractType', 'FIXED_TERM');
  expect(model.isFieldVisible('contractEndDate')).toBe(true);
});
```

---

## 18. Documentation Helpers

### 18.1 SDK Self-Documentation

Every `define*()` function and Contract is annotated with JSDoc. TypeScript's language server surfaces these annotations as hover documentation in the IDE.

### 18.2 Metadata-to-Markdown Generator

```typescript
// @idoo/platform/helpers
function generateEntityDocs(entity: EntityDef): string     // Markdown
function generatePluginDocs(plugin: PluginManifest): string // Markdown
function generatePermissionDocs(plugin: PluginManifest): string // Markdown table

// Used by: idoo docs generate
```

### 18.3 Permission Reference Generation

```bash
$ idoo docs generate --plugin hr --format markdown

Generates:
  docs/plugins/hr/
  ├── README.md          — Plugin overview
  ├── ENTITIES.md        — All entities with fields
  ├── PERMISSIONS.md     — All permission codes in a table
  ├── WORKFLOWS.md       — All workflow state machines
  └── API.md             — All API endpoints derived from entityDefs
```

### 18.4 Changelog Generation

The CLI can generate changelogs from plugin version diffs:

```bash
$ idoo docs changelog --plugin hr --from 1.0.0 --to 1.1.0

Generated:
  CHANGELOG.md with sections for:
  - New entities
  - Added fields
  - New actions
  - New permissions
  - Breaking changes (removed fields, renamed IDs)
```

---

## 19. IDE Support

### 19.1 VS Code Extension — `idoo-platform`

The `idoo-platform` VS Code extension provides:

**Code Actions:**
- "Create entity from here" — scaffolds entity files from cursor position
- "Validate plugin" — runs `idoo validate` and shows inline errors
- "Go to entity definition" — navigates from an entity ID string to its `defineEntity()` call

**Hover Information:**
- Hover over an entity ID string (`'hr:employee'`) → shows entity label, apiPath, field count
- Hover over a permission code (`'HR:EMPLOYEES:READ'`) → shows permission label and which actions use it
- Hover over a field type (`'entity-picker'`) → shows the EntityRef it points to

**Diagnostics:**
- Real-time validation of `defineEntity()`, `defineForm()`, etc. as you type
- Red underlines on invalid field types, missing required fields, pattern mismatches
- Warning underlines on deprecated fields

**Snippets:**
```
Trigger         → Expansion
idoo-entity     → defineEntity({ ... }) skeleton
idoo-form       → defineForm({ sections: [...] }) skeleton
idoo-table      → defineTable({ columns: [...] }) skeleton
idoo-action     → defineAction({ id, scope, handler }) skeleton
idoo-permission → definePermission({ code, module, resource, action }) skeleton
idoo-plugin     → definePlugin({ id, name, version, ... }) skeleton
```

**Commands (Command Palette):**
- `iDoo: Create Plugin` — runs `idoo create plugin` with interactive prompts
- `iDoo: Create Entity` — runs `idoo create entity` with interactive prompts
- `iDoo: Validate All Plugins` — validates all plugins and shows results in Problems panel
- `iDoo: Show Dependency Graph` — opens a visual dependency graph in a webview

### 19.2 TypeScript Language Service Plugin

A TypeScript language service plugin (`@idoo/typescript-plugin`) provides:
- Type checking for permission codes (string literals validated against the registry)
- Type checking for entity IDs in routes, menus, and form `entityRef` fields
- Auto-complete for entity IDs and permission codes across plugin boundaries

### 19.3 ESLint Plugin — `eslint-plugin-idoo`

```javascript
// .eslintrc.js
{
  "plugins": ["idoo"],
  "rules": {
    // Error: importing from platform internals
    "idoo/no-internal-imports": "error",

    // Error: importing from another plugin's source
    "idoo/no-cross-plugin-imports": "error",

    // Error: using Angular services directly in metadata (outside handlers)
    "idoo/no-angular-in-metadata": "error",

    // Error: entity ID not matching pattern
    "idoo/entity-id-format": "error",

    // Warning: permission code not in UPPER:UPPER:UPPER format
    "idoo/permission-code-format": "warn",

    // Warning: deprecated SDK field used
    "idoo/no-deprecated-fields": "warn",

    // Info: missing label on field
    "idoo/field-label-required": "warn",
  }
}
```

---

## 20. Future SDK Evolution

### 20.1 Version 1.1 Additions (Planned)

| Addition | Description |
|---|---|
| `defineLocale()` | Locale/translation bundle factory |
| `defineTheme()` | Theme definition factory |
| `defineLayout()` | Custom layout factory |
| `FormBuilder.addConditionalSection()` | Sections that appear/hide based on model |
| `EntityBuilder.withRelations()` | Define entity relations (parent-child, many-to-many) |
| `defineFeatureFlag()` | Plugin feature flag factory |
| `createMockApiServer()` | Fake backend server for plugin development |
| Builder `.clone()` method | Deep clone a builder's current state |

### 20.2 Version 1.2 Additions (Planned)

| Addition | Description |
|---|---|
| `defineView()` | Custom view factory beyond table and form |
| `EntityBuilder.withSubEntities()` | Inline child entity list panels |
| `TableBuilder.withGrouping()` | Column grouping configuration |
| `FormBuilder.withRepeatingSection()` | Dynamically add/remove section instances |
| `defineKanban()` | Kanban board view configuration |
| `defineCalendar()` | Calendar view for date-based entities |
| `SchemaInferrer.fromBackendSchema()` | Auto-generate metadata from OpenAPI schema |

### 20.3 Version 2.0 Breaking Changes (Architecture Only)

| Change | Migration Path |
|---|---|
| `defineForm.sections[].columns` → `defineForm.sections[].grid` | Codemod provided |
| `ActionContract.handler` signature generalized | Codemod + type narrowing |
| `TableContract.badgeConfig` moved inside `ColumnContract.badge` | Codemod |
| Permission code type narrows to branded `PermissionCode` type | TypeScript generics addition |

### 20.4 Version 3.0 Vision (Architecture-Ready)

| Capability | Description |
|---|---|
| `@idoo/ai-forms` | AI-assisted form completion based on entity schema |
| `SchemaRegistry.infer()` | Auto-generate full plugin from REST API introspection |
| `defineRelationalView()` | Multi-entity joined views (SQL-like joins at metadata level) |
| `PluginMarketplace.publish()` | SDK-level marketplace publish command |
| `defineAIAssistant()` | Plugin-specific AI assistant configurations |

### 20.5 SDK Stability Promise

**Frozen forever (will never change without major version):**
- All `Contract` interface names and their required fields
- All `define*()` function names and their required parameters
- The `PluginInitFn` signature
- The `PlatformAPI` interface
- `PLUGIN_MANIFEST_TOKEN` and `PLATFORM_CONFIG_TOKEN`
- The `providePlugin()` function signature

**Stable but extensible (may add optional fields in minor versions):**
- All `Contract` optional fields (new optional fields can appear)
- `Builder` methods (new methods can appear)
- CLI commands (new commands can appear, existing ones are stable)

**Private — never stable outside SDK:**
- All `@idoo/platform/internal` (if ever created)
- Everything in `src/app/core/`
- Angular service implementations

---

## 21. ADRs

### ADR-S01: define*() Functions Over Object Literals

**Status:** ACCEPTED  
**Context:** Should plugin authors write raw object literals (e.g., `const def: EntityDef = {...}`) or use factory functions (e.g., `defineEntity({...})`)?  
**Decision:** Factory functions are the recommended path. Object literals are still valid TypeScript (the contracts are exported interfaces) but are not validated at dev-time.  
**Consequences:**
- `defineEntity()` runs validation in dev mode, giving immediate feedback
- Factory functions can apply defaults, normalize IDs, and annotate with metadata
- Tree-shaking: factory functions can be stripped in test environments that use mock contracts
- Tradeoff: additional function call overhead (negligible); the functions return plain objects

---

### ADR-S02: Builders Are Optional — Not Required

**Status:** ACCEPTED  
**Context:** Should all plugin authoring go through Builder classes, or should `define*()` functions be the primary API?  
**Decision:** `define*()` functions are the primary API. Builders are supplementary for complex or programmatic cases.  
**Consequences:**
- 90% of plugin code is simpler and more readable with direct `define*()` calls
- Builders shine for: extending inherited schemas, programmatic generation, code generators
- Both APIs produce identical output types — engines see no difference
- Tradeoff: two ways to do the same thing. Documented clearly in style guide

---

### ADR-S03: Contracts Are Interfaces, Not Classes

**Status:** ACCEPTED  
**Context:** Should `EntityContract` be a TypeScript interface or an abstract class?  
**Decision:** Interface. The `@idoo/platform/contracts` package has zero runtime code.  
**Consequences:**
- Bundle impact: 0 bytes from contracts
- Contracts can be implemented by any plain object
- No inheritance hierarchy — plugins never extend platform classes
- Tradeoff: cannot use `instanceof` checks. Use type guards instead.

---

### ADR-S04: CLI Uses Node.js, Not Angular CLI

**Status:** ACCEPTED  
**Context:** Should the CLI be a schematic (Angular CLI extension) or a standalone Node.js CLI?  
**Decision:** Standalone Node.js CLI (`idoo` command), supplemented by Angular schematics for Angular-specific operations.  
**Consequences:**
- CLI works in non-Angular projects (e.g., backend tooling, CI scripts)
- No dependency on Angular CLI version for basic scaffolding
- Angular schematics (`ng generate @idoo/platform:entity`) are provided additionally for IDE integration
- Tradeoff: two scaffolding paths (idoo CLI + ng generate). Documented clearly.

---

### ADR-S05: No Runtime Reflection — SDK is Build-Time Only

**Status:** ACCEPTED  
**Context:** Should the SDK use TypeScript decorators (`@Entity()`, `@Field()`) that produce metadata through runtime reflection?  
**Decision:** No decorators. All metadata is defined through `define*()` factory functions that return plain objects.  
**Consequences:**
- No dependency on `reflect-metadata` or `experimentalDecorators`
- Metadata is regular JavaScript objects — serializable, loggable, testable without Angular
- Full tree-shaking of unused metadata (unused entity definitions are eliminated)
- Tradeoff: less familiar to developers from NestJS/TypeORM backgrounds. JSDoc + excellent IntelliSense compensates.

---

### ADR-S06: Validation is Development-Only by Default

**Status:** ACCEPTED  
**Context:** Should `define*()` validation run in production builds?  
**Decision:** Validation is stripped from production builds. The `define*()` functions in production are identity functions (pass-through with type annotation only).  
**Consequences:**
- Production bundle size reduced by ~8KB (validation code)
- Validation runs in development, test, and CI — where it matters
- The `validate*()` functions from `@idoo/platform/validators` always run (they are used in CI scripts)
- Tradeoff: a production-only bug in metadata would not surface early. Mitigated by: CI validation step, comprehensive unit tests, type checking.

---

### ADR-S07: Permission Codes as Typed String Constants, Not Enums

**Status:** ACCEPTED  
**Context:** Should permission codes be TypeScript enums (`enum HR { EMPLOYEES_READ = 'HR:EMPLOYEES:READ' }`) or typed string constants (`const HR = { EMPLOYEES: { READ: 'HR:EMPLOYEES:READ' } as const }`)?  
**Decision:** Typed `as const` objects via `createPermissions()` factory.  
**Consequences:**
- Better type inference: `typeof HR.EMPLOYEES.READ` is `'HR:EMPLOYEES:READ'` exactly, not `string`
- More natural dot-notation access: `HR.EMPLOYEES.READ` vs `HR.EMPLOYEES_READ`
- Tree-shakeable: unused permission constants are eliminated
- No enum reverse-mapping overhead at runtime
- Tradeoff: less familiar than enums for developers from Java/C# backgrounds. Documentation shows both the constant and the string to aid understanding.

---

### ADR-S08: Testing Utilities are a Separate Sub-Package

**Status:** ACCEPTED  
**Context:** Should test utilities be in the main `@idoo/platform` package or separate?  
**Decision:** `@idoo/platform/testing` is a separate sub-path export, never included in production bundles.  
**Consequences:**
- Production builds cannot accidentally import test utilities
- Test utilities can depend on `devDependencies` (jest, fake data libraries) without polluting the production dependency tree
- `tsconfig.json` can exclude `@idoo/platform/testing` from production compilation
- Tradeoff: developers must remember to import from `@idoo/platform/testing` not `@idoo/platform` in tests.

---

## 22. Self-Review

**Q1: Is the SDK sufficient to build any ERP module without touching platform internals?**

YES. Every piece of metadata needed to deliver a complete ERP module (entities, forms, tables, routes, menus, actions, workflows, widgets, dashboards, reports, lookups, permissions, validators) has a corresponding `define*()` function and `Contract` interface. Custom field types, validators, and cell renderers are supported through the Extension APIs in `PlatformAPI`. The only import needed is `from '@idoo/platform'`.

---

**Q2: Does the SDK provide compile-time type safety that catches errors before runtime?**

YES. Generic types on `EntityDef<TRecord>` carry the backend record type through to column `accessor` fields and action context `row` typing. Conditional types on `FieldContract` enforce required fields per field type (e.g., `options` required for `select`). Branded types on IDs prevent substituting an `EntityId` where a `PluginId` is expected. TypeScript errors from incorrect usage surface in the IDE immediately.

---

**Q3: Is the developer experience genuinely fast — can a new entity be delivered in under 30 minutes?**

YES. `$ idoo create entity hr employee` generates the complete file structure in seconds. The developer edits pure TypeScript data objects — no Angular knowledge required for the metadata layer. `$ idoo validate --plugin hr` gives immediate feedback on any issues. The VS Code extension provides real-time validation, hover documentation, and code completion. The entire flow from scaffold to working entity screen should take under 30 minutes for an experienced developer.

---

**Q4: Is the Builder API genuinely useful — not just a redundant copy of define*()?**

YES. Builders provide unique value in three scenarios: (1) `FormBuilder.from(existing)` for extending an inherited form without duplicating all fields; (2) `TableBuilder.insertColumn()` for injecting a column at a specific position; (3) programmatic generation where a loop builds entities from an API schema. These scenarios cannot be elegantly expressed with `define*()` alone.

---

**Q5: Is the CLI complete enough to eliminate all manual boilerplate?**

YES for the common cases. `create plugin`, `create entity`, `create widget`, `create dashboard` cover the 95% use case. `generate api-client` eliminates the boilerplate of writing typed HTTP wrappers. `generate permission-constants` generates the type-safe permission constants from `PermissionDef[]`. The only remaining manual work is: writing the actual domain logic in `handler` functions and implementing custom Angular components (widget, field type).

---

**Q6: Is the versioning strategy clear enough that SDK consumers can upgrade with confidence?**

YES. The Semantic Versioning policy is explicit: minor = additive, major = breaking with codemod. The `@deprecated` annotation appears one full minor version before removal. The `idoo check compatibility` command verifies a plugin against a target platform version. The SDK ↔ Platform compatibility matrix documents which combinations work. Codemods automate the mechanical parts of major version upgrades.

---

**Q7: Is the testing story complete enough to achieve high confidence in plugin metadata?**

YES. `createMockPlatform()` enables unit testing `initFn` without Angular. `createFormModel()` enables unit testing form visibility logic without rendering. `expectValidPlugin()` and friends enable snapshot and validation testing. The `idoo validate` command integrates into CI. Together, these enable a complete test pyramid for plugin metadata: unit tests for individual defs, integration tests via mock platform, and CI validation gates.

---

**Q8: Can the SDK evolve to v2.0 without requiring a complete rewrite of existing plugins?**

YES. All planned v2.0 changes are addressed by codemods. The `@deprecated` annotation strategy gives one full minor version of warning before any field is removed. The "Frozen Forever" list in Section 20.5 guarantees that the most critical parts of the API (`define*()` names, `Contract` required fields, `PluginInitFn` signature, `providePlugin()`) will never change without a major version. The codemod infrastructure ensures mechanical changes can be automated.

---

**Q9: Is there a clear separation between the SDK (public) and the platform implementation (private)?**

YES. The package architecture enforces this at the import level: `@idoo/platform/*` is public and stable; `src/app/core/*` is private and subject to change at any time. The ESLint rule `idoo/no-internal-imports` enforces this at the code level. The TypeScript language service plugin enforces it with IDE-level warnings. The architectural principle "Single Door" is reflected in the package structure.

---

**Q10: Is the SDK self-documenting — can developers understand it without reading this specification?**

YES for the happy path. Every `define*()` function has JSDoc annotations covering purpose, parameters, validation rules, and examples. Every `Contract` interface has JSDoc on each field explaining its format and default. The VS Code extension shows hover documentation. The `idoo docs generate` command produces Markdown documentation from the metadata itself. The templates produced by `idoo create` are commented with guides for what to change. Developers who follow the scaffolded structure and IDE hints should be productive without reading this document.

---

*End of Platform SDK Architecture Specification v1.0.0*

*Next Phase: 2.6 — Metadata Engine Implementation Specification*
