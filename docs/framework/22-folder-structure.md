# iDoo ERP Platform — Folder Structure

---

## 1. Overview

The folder structure reflects the platform's layered architecture: `core` is the runtime and infrastructure, `shared` is reusable UI, `layout` is the application shell, and `plugins` is where all business modules live. No business logic ever lives in `core` or `shared`.

---

## 2. Top-Level Structure

```
src/
├── app/
│   ├── core/                   # Platform runtime, auth, context, registries
│   ├── shared/                 # Reusable UI components, directives, pipes
│   ├── layout/                 # Application shell (sidebar, topbar)
│   ├── plugins/                # ERP business modules (HR, Fleet, CRM, ...)
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/
│   ├── i18n/                   # Translation files per locale
│   └── icons/                  # SVG icon set
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── styles/
    ├── _variables.scss
    ├── _themes.scss
    └── styles.scss
```

---

## 3. Core Layer (`src/app/core/`)

```
core/
├── api/
│   ├── generated/              # Auto-generated API clients per domain
│   │   ├── auth.api.ts
│   │   ├── tenant.api.ts
│   │   ├── user.api.ts
│   │   └── ...
│   └── models/
│       └── index.ts            # All DTO interfaces (canonical)
│
├── auth/
│   ├── facades/
│   │   └── auth.facade.ts      # AuthFacade (primary auth interface)
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   └── jwt.interceptor.ts
│   ├── services/
│   │   ├── session-manager.service.ts
│   │   └── token-refresh.service.ts
│   └── state/
│       └── auth.state.ts
│
├── context/
│   ├── facades/
│   │   └── context.facade.ts
│   ├── interceptors/
│   │   └── context.interceptor.ts
│   └── services/
│       └── context-initialization.service.ts
│
├── engines/
│   ├── action/
│   │   └── action-engine.service.ts
│   ├── dialog/
│   │   └── dialog-engine.service.ts
│   ├── drawer/
│   │   └── drawer-engine.service.ts
│   ├── field/
│   │   └── field-registry.service.ts
│   ├── filter/
│   │   └── filter-engine.service.ts
│   ├── form/
│   │   ├── form-builder.service.ts
│   │   └── form-error-mapper.service.ts
│   ├── table/
│   │   └── entity-data-source.ts
│   ├── validation/
│   │   ├── validator-registry.service.ts
│   │   └── async-validator-registry.service.ts
│   └── widget/
│       └── widget-data.service.ts
│
├── interceptors/
│   ├── logging.interceptor.ts
│   └── error.interceptor.ts
│
├── logger/
│   └── logger.service.ts
│
├── models/
│   ├── engine-types.ts         # EntityDef, FormSchema, TableDef, etc.
│   ├── framework-types.ts      # Tenant, Company, Branch, etc.
│   └── index.ts
│
├── permissions/
│   └── permission-state.service.ts
│
├── platform/
│   └── platform-runtime.service.ts
│
├── registry/
│   ├── facades/
│   │   └── registry.facade.ts
│   ├── providers/
│   │   └── registry.provider.ts
│   ├── state/
│   │   └── registry.state.ts
│   └── services/
│       ├── entity.registry.ts
│       ├── form.registry.ts
│       ├── table.registry.ts
│       ├── action.registry.ts
│       ├── menu.registry.ts
│       ├── route.registry.ts
│       ├── widget.registry.ts
│       ├── field.registry.ts
│       └── filter.registry.ts
│
├── tokens/
│   ├── app-config.token.ts
│   ├── plugin-def.token.ts
│   └── module-config.token.ts
│
└── event-bus/
    └── event-bus.service.ts
```

---

## 4. Shared Layer (`src/app/shared/`)

```
shared/
├── components/
│   ├── engine/                 # Platform engine components
│   │   ├── entity-view/
│   │   │   └── entity-view.component.ts
│   │   ├── form-engine/
│   │   │   ├── form-engine.component.ts
│   │   │   ├── form-section/
│   │   │   └── field-wrapper/
│   │   ├── table-engine/
│   │   │   ├── table-engine.component.ts
│   │   │   ├── table-skeleton/
│   │   │   ├── empty-state/
│   │   │   └── error-state/
│   │   ├── action-bar/
│   │   │   └── action-bar.component.ts
│   │   ├── filter-bar/
│   │   │   └── filter-bar.component.ts
│   │   └── widget-host/
│   │       └── widget-host.component.ts
│   │
│   └── ui/                     # Generic UI primitives
│       ├── page-header/
│       ├── breadcrumb/
│       ├── notification/
│       ├── avatar/
│       ├── badge/
│       ├── skeleton/
│       └── confirm-dialog/
│
├── directives/
│   └── permission/
│       └── has-permission.directive.ts
│
├── fields/                     # Built-in field components
│   ├── text-field/
│   ├── select-field/
│   ├── date-field/
│   ├── entity-picker-field/
│   └── ...
│
├── models/
│   ├── dynamic-form.models.ts
│   ├── dynamic-table.models.ts
│   └── dynamic-dialog.models.ts
│
├── pipes/
│   ├── date-format.pipe.ts
│   ├── currency-format.pipe.ts
│   └── truncate.pipe.ts
│
└── constants/
    └── permissions.constants.ts
```

---

## 5. Plugin Layer (`src/app/plugins/`)

Each ERP module is a plugin folder. All plugins follow the same internal structure:

```
plugins/
├── hr/
│   ├── hr.plugin.ts                # PluginDef
│   ├── hr.routes.ts                # Lazy routes
│   ├── entities/
│   │   ├── employee/
│   │   │   ├── employee.entity.ts  # EntityDef
│   │   │   ├── employee-form.ts    # FormSchema(s)
│   │   │   ├── employee-table.ts   # TableDef
│   │   │   ├── employee-actions.ts # ActionDef[]
│   │   │   └── employee-filters.ts # FilterDef[]
│   │   └── department/
│   │       └── ...
│   ├── api/
│   │   └── hr-employee.api.ts
│   ├── models/
│   │   └── hr.models.ts
│   └── services/
│       └── hr.state.ts
│
├── fleet/
│   ├── fleet.plugin.ts
│   ├── fleet.routes.ts
│   ├── entities/
│   │   └── vehicle/
│   │       └── ...
│   └── ...
│
├── crm/
├── pos/
├── inventory/
├── accounting/
├── procurement/
├── assets/
└── helpdesk/
```

---

## 6. Layout Layer (`src/app/layout/`)

```
layout/
├── shell/
│   └── shell.component.ts
├── sidebar/
│   └── sidebar.component.ts
├── topbar/
│   └── topbar.component.ts
├── context-bar/
│   └── context-bar.component.ts
└── services/
    ├── layout-engine.service.ts
    ├── menu-badge.service.ts
    └── breadcrumb.service.ts
```

---

## 7. Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Plugin def file | `{module}.plugin.ts` | `hr.plugin.ts` |
| Entity def | `{entity}.entity.ts` | `employee.entity.ts` |
| Form schema | `{entity}-form.ts` | `employee-form.ts` |
| Table def | `{entity}-table.ts` | `employee-table.ts` |
| Actions | `{entity}-actions.ts` | `employee-actions.ts` |
| API client | `{module}-{entity}.api.ts` | `hr-employee.api.ts` |
| State service | `{module}.state.ts` | `hr.state.ts` |
| Component | `{name}.component.ts` | `employee-list.component.ts` |
| Guard | `{name}.guard.ts` | `auth.guard.ts` |
| Interceptor | `{name}.interceptor.ts` | `jwt.interceptor.ts` |

---

## 8. Forbidden Patterns

| Pattern | Why forbidden |
|---|---|
| Business logic in `core/` | Core is platform-only. Modules belong in `plugins/`. |
| Direct API calls in components | Always go through a service or `ActionEngine`. |
| Shared state between plugins via a global singleton | Use `EventBus` for cross-plugin communication. |
| Manual `subscribe()` without `takeUntilDestroyed()` | Memory leak. |
| Hard-coded permission strings (not from `PERMISSIONS` constants) | String typos cause silent security holes. |
| Importing from a sibling plugin | Cross-plugin dependencies create coupling. |
