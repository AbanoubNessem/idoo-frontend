# iDoo ERP - Enterprise Technical Design Specification

This document serves as the formal Technical Design Specification for the iDoo ERP Frontend Architecture. It outlines the design for 12 critical enterprise frameworks, defining their structure, boundaries, and implementation patterns using Angular 19+ (Signals, Standalone Components, Clean Architecture).

---

## 1. Metadata Registry & 2. Entity Registry

### Responsibility
The Metadata & Entity Registries form the backbone of the dynamic ERP. They act as central dictionaries where loosely coupled modules register their existence, routes, forms, tables, permissions, and navigation items. This eliminates hardcoded cross-feature dependencies.

### Public API
- `MetadataRegistryFacade.registerModule(config: ModuleConfig)`
- `MetadataRegistryFacade.getModule(moduleId: string): ModuleConfig`
- `EntityRegistryFacade.registerEntity(entityName: string, config: EntityConfig)`
- `EntityRegistryFacade.getEntity(entityName: string): EntityConfig`

### Internal Architecture & Signals Design
- **Stores**: `MetadataStore` and `EntityStore` use Angular Signals (`signal<Map<string, ModuleConfig>>`).
- **Facades**: Expose `computed()` signals to retrieve active modules and entities dynamically.
- **Dependency Flow**: `Features → Facades (Registration) → Registry Store`. `Shared Engines → Facades (Retrieval) → Registry Store`.

### Folder Structure
```text
src/app/core/registry/
├── models/registry.models.ts
├── state/registry.state.ts
├── facades/registry.facade.ts
└── tokens/registry.tokens.ts
```

### Abstract Contracts & Interfaces
```typescript
export interface EntityConfig {
  name: string;
  apiPath: string;
  formSchema: FormSchema;
  tableConfig: TableConfig;
  permissions: { create: string; update: string; delete: string; read: string };
}
```

### Registration & Extension Mechanism
Modules register themselves during `APP_INITIALIZER` or inside their lazy-loaded routing files using a factory function. Custom modules can extend existing entities by retrieving the config and mutating the schema (e.g., adding custom fields).

### Performance & Security Considerations
- **Performance**: `Map` lookups are O(1). The registry avoids deep cloning unless strictly necessary. Signals ensure UI reacts instantly to registry changes.
- **Security**: Registry does not store data, only metadata. Permissions defined here are enforced by the Router and API Layer.

---

## 3. MultiTenant Context Framework

### Responsibility
Manages the active Tenant, Company, and Branch workspace. Automatically propagates this context to API headers, UI menus, and data tables.

### Public API
- `ContextFacade.setTenant(id: string)`
- `ContextFacade.setCompany(id: string)`
- `ContextFacade.setBranch(id: string)`
- `ContextFacade.currentContext()` -> `Signal<WorkspaceContext>`

### Internal Architecture & Sequence Diagrams
**Sequence**: 
1. User selects Branch from Topbar.
2. `TopbarComponent` calls `ContextFacade.setBranch()`.
3. `ContextStateService` updates Signal.
4. `ContextInterceptor` reads new signal state automatically for subsequent HTTP calls.
5. `DynamicTableComponent` effect triggers reload of data.

### Folder Structure
```text
src/app/core/context/
├── models/context.models.ts
├── state/context.state.ts
├── facades/context.facade.ts
└── interceptors/context.interceptor.ts
```

### Registration & Extension Mechanism
Context is initialized at bootstrap via `AuthService.restoreSession()`. Extensions can add parameters like `FiscalYear` or `Warehouse` to the `WorkspaceContext` interface.

### Performance & Security Considerations
- **Performance**: Signals trigger pinpoint updates only where context is used.
- **Security**: The context IDs must match the authenticated user's permissions on the backend. Frontend context switching is merely a convenience; backend enforces real boundary isolation.

---

## 4. Dynamic Form Engine

### Responsibility
Renders metadata-driven Create/Edit/View forms without writing component boilerplate. Supports complex interactions like async validation, conditional visibility, and dynamic sections.

### Public API
- Component: `<app-dynamic-form [schema]="schema" [mode]="mode" (submitted)="onSave($event)"></app-dynamic-form>`
- Field Types: Text, Number, TreeSelect, Autocomplete, RichText, Stepper, etc.

### Internal Architecture
Relies on a single `DynamicFormComponent` that loops over `FormSchema.fields`. Uses Angular Reactive Forms. An `effect()` or `valueChanges` subscription evaluates `showWhen` conditions to hide/show fields dynamically.

### Folder Structure
```text
src/app/shared/components/dynamic-form/
├── dynamic-form.component.ts
├── dynamic-field.directive.ts
├── fields/
│   ├── text-field.component.ts
│   ├── tree-select-field.component.ts
│   └── rich-text-field.component.ts
└── models/form-schema.models.ts
```

### Abstract Contracts
```typescript
export interface FormField {
  key: string;
  type: 'text' | 'tree' | 'stepper';
  label: string;
  validations?: ValidatorFn[];
  showWhen?: (model: any) => boolean;
}
```

### Extension Mechanism
Custom field components can be registered via `ENVIRONMENT_INITIALIZER` mapping a string type (e.g., `custom-map`) to a component class.

### Performance & Security Considerations
- **Performance**: Complex forms with hundreds of fields use `ChangeDetectionStrategy.OnPush`. Field visibility (`showWhen`) is debounced.
- **Security**: Output values are sanitized. File/Image uploads validate MIME types before dispatching API calls.

---

## 5. Dynamic Table Engine

### Responsibility
Renders metadata-driven server-paginated tables with sorting, filtering, row/bulk actions, and column visibility.

### Public API
- `<app-dynamic-table [config]="tableConfig" [data]="dataSignal()" (page)="fetchPage($event)"></app-dynamic-table>`

### Internal Architecture
Delegates rendering to Angular Material Table. Uses a standardized `TableConfig` contract. Bulk actions emit arrays of selected IDs.

### Folder Structure
```text
src/app/shared/components/dynamic-table/
├── dynamic-table.component.ts
├── table-cell.directive.ts
├── formatters/
│   └── currency-formatter.pipe.ts
└── models/table-config.models.ts
```

### Extension Mechanism
Supports cell template overrides via `ng-template` matching the column name, allowing modules to inject fully custom UI into a specific column without rebuilding the table.

### Performance & Security Considerations
- **Performance**: Strict `OnPush`. `trackBy` function is mandatory. Virtual scrolling is conditionally enabled for datasets exceeding 500 rows.
- **Security**: Row actions are evaluated against the `PermissionState` Signal. If a user lacks `AUTH:users:delete`, the delete action is excluded from the DOM.

---

## 6. Dynamic Dialog Engine

### Responsibility
Centralized orchestration of modal overlays (Confirmation, Forms, Success/Error). Prevents stacking issues and standardizes modal UX.

### Public API
- `DialogFacade.confirm(config)` -> `Observable<boolean>`
- `DialogFacade.openForm(schema)` -> `Observable<any>`

### Internal Architecture
Wraps `MatDialog`. The Facade is injected into feature components.

### Folder Structure
```text
src/app/shared/components/dynamic-dialog/
├── dynamic-dialog.component.ts
├── form-dialog.component.ts
└── services/dialog.facade.ts
```

### Security & Performance
- **Performance**: Dialogs are lazily instantiated.
- **Security**: Gated by route/permission guards. Dialog data is strictly typed to prevent XSS via unescaped HTML strings in messages.

---

## 7. Dashboard Widget Framework

### Responsibility
Provides a grid system where modules can inject KPI cards, charts, and data tables. Widgets are customizable per user.

### Internal Architecture & Registration
- `WidgetRegistry`: Modules register widgets (e.g., `SalesModule.registerWidget('daily-sales-chart')`).
- `DashboardEngineComponent`: Reads user's layout config and dynamically instantiates widget components using `ViewContainerRef.createComponent()`.

### Folder Structure
```text
src/app/features/dashboard/
├── dashboard.component.ts
├── widget-grid.component.ts
├── core/
│   ├── widget.registry.ts
│   └── widget.facade.ts
└── components/
    └── widget-wrapper.component.ts
```

---

## 8. Notification Framework

### Responsibility
Handles toast messages, persistent alerts, and real-time WebSocket events (e.g., approval requests).

### Public API
- `NotificationFacade.success(msg)`
- `NotificationFacade.error(msg)`

### Internal Architecture
- **State**: `NotificationStore` holds an array of active notifications.
- **Service**: Interacts with Angular Material `SnackBar` and establishes a WebSocket connection (RxJS `webSocket`).

### Folder Structure
```text
src/app/core/notifications/
├── state/notification.state.ts
├── facades/notification.facade.ts
├── services/websocket.service.ts
└── components/toast.component.ts
```

---

## 9. Theme Framework

### Responsibility
Manages Light/Dark mode, Company-specific branding (primary colors, logos), and RTL (Arabic) / LTR (English) layouts.

### Internal Architecture
- **State**: `ThemeStore` manages `currentTheme` and `currentDir`.
- **Implementation**: Alters CSS variables (`--primary-color`) on the `:root` element. Modifies the `dir` attribute on the `<html>` tag.

### Security & Performance
- Theme preferences are cached in `localStorage` and applied before Angular bootstraps to prevent FOUC (Flash of Unstyled Content).

---

## 10. Audit Framework

### Responsibility
Provides a standard UI to display entity history, user activity timelines, and data change logs.

### Internal Architecture
An abstract `AuditTimelineComponent` that takes an `entityId` and `entityType`, fetches the history from `AuditFacade`, and renders a vertical chronological stepper.

### Folder Structure
```text
src/app/shared/components/audit-timeline/
├── audit-timeline.component.ts
└── services/audit.facade.ts
```

---

## 11. Plugin Architecture

### Responsibility
Allows runtime or build-time injection of external modules (e.g., specific country tax engines) without modifying core ERP code.

### Internal Architecture
Uses Angular's Dependency Injection (`InjectionToken<Plugin[]>`). Plugins provide an array of Menu Items, Routes, and Widget Definitions which the core `AppShell` aggregates upon load.

---

## 12. Workflow / Approval Engine

### Responsibility
Manages multi-tier approval states for entities (e.g., Purchase Orders).

### Internal Architecture
- A shared `ApprovalStatusBadgeComponent` to visualize the state machine.
- `WorkflowFacade.approve(entity, id)` standardizes the API calls.
- Integrates heavily with the Notification Framework to alert managers of pending approvals.

### Folder Structure
```text
src/app/shared/components/workflow/
├── approval-timeline.component.ts
├── status-badge.component.ts
└── services/workflow.facade.ts
```

---
*End of Document. This specification serves as the blueprint for the incremental coding phase.*
