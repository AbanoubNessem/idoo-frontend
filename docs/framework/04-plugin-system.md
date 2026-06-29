# iDoo ERP Platform — Plugin System

---

## 1. Overview

A **Plugin** is a self-contained package that adds one ERP domain to the platform. It is the unit of modularity. Adding a plugin to the application requires only one line of code in `app.config.ts` — no modifications to the framework.

---

## 2. Plugin Definition

Every plugin is described by a `PluginDef` object:

```typescript
interface PluginDef {
  // Identity
  id: string;           // unique, matches backend ModuleCode (e.g. 'HR', 'CRM')
  name: string;         // display name ('Human Resources')
  description?: string;
  version: string;      // semver
  icon: string;         // Material icon name

  // Activation
  moduleCode: string;   // backend module code — must be active for plugin to activate
  requiredPermissions?: string[];  // at least one must be held for plugin to activate

  // Content
  entities: EntityDef[];
  routes?: RouteDef[];        // additional non-entity routes
  menu: MenuItemDef[];
  widgets?: WidgetDef[];
  fields?: FieldTypeDef[];    // custom field types contributed by this plugin
  validators?: NamedValidatorDef[];

  // Lifecycle hooks
  onActivate?: () => void | Promise<void>;
  onDeactivate?: () => void;
}
```

---

## 3. Plugin Registration

Plugins are registered in `app.config.ts` using `providePlugin()`:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // ... core providers ...
    providePlugin(CorePluginDef),
    providePlugin(AuthPluginDef),
    // Future:
    // providePlugin(HrPluginDef),
    // providePlugin(CrmPluginDef),
    // providePlugin(FleetPluginDef),
  ]
};
```

`providePlugin()` is a helper function that returns Angular `Provider[]`:

```typescript
function providePlugin(def: PluginDef): Provider[] {
  return [
    {
      provide: PLUGIN_DEF_TOKEN,
      useValue: def,
      multi: true
    }
  ];
}
```

`PLUGIN_DEF_TOKEN` is an `InjectionToken<PluginDef[]>` with `multi: true`. The `PlatformRuntimeService` injects all registered plugins and activates them during step 4 of the initializer chain.

---

## 4. Plugin Activation Lifecycle

```
providePlugin(HrPluginDef) declared in app.config.ts
        │
        ▼ (at APP_INITIALIZER step 4)
PluginActivator.activate(HrPluginDef)
        │
        ├── Check: Is 'HR' module active in backend?    → abort if not
        ├── Check: Does user have any HR permission?    → abort if not
        │
        ├── PluginRegistry.setStatus('HR', 'activating')
        │
        ├── For each entity in HrPluginDef.entities:
        │       EntityRegistry.register(entity)
        │       FormRegistry.register(entity.forms)
        │       TableRegistry.register(entity.table)
        │       ActionRegistry.register(entity.actions)
        │       FilterRegistry.register(entity.filters)
        │
        ├── MenuRegistry.registerAll(HrPluginDef.menu)
        ├── RouteRegistry.registerAll(HrPluginDef.routes)
        ├── WidgetRegistry.registerAll(HrPluginDef.widgets)
        ├── FieldRegistry.registerAll(HrPluginDef.fields)
        │
        ├── HrPluginDef.onActivate?.()   ← optional hook
        │
        └── PluginRegistry.setStatus('HR', 'active')
```

---

## 5. Plugin Directory Structure

Each plugin lives in its own directory under `src/app/plugins/`:

```
src/app/plugins/hr/
├── index.ts                ← exports HrPluginDef
├── hr.plugin.ts            ← PluginDef declaration
├── entities/
│   ├── employee/
│   │   ├── employee.entity.ts       ← EntityDef
│   │   ├── employee.form.ts         ← FormSchema(s)
│   │   ├── employee.table.ts        ← TableDef
│   │   ├── employee.actions.ts      ← ActionDef[]
│   │   └── employee.filters.ts      ← FilterDef[]
│   ├── department/
│   ├── contract/
│   └── payroll/
├── widgets/
│   ├── headcount-kpi.widget.ts
│   └── turnover-chart.widget.ts
├── fields/
│   └── employee-picker.field.ts
└── menu/
    └── hr.menu.ts
```

---

## 6. Entity Registration via Plugin

An `EntityDef` inside a plugin is the single source of truth for that entity:

```typescript
// hr/entities/employee/employee.entity.ts
export const EmployeeEntityDef: EntityDef = {
  id: 'hr:employee',
  pluginId: 'HR',
  apiPath: '/v1/hr/employees',
  labelSingular: 'Employee',
  labelPlural: 'Employees',
  icon: 'person',
  permissions: {
    list:   'HR:employees:read',
    create: 'HR:employees:create',
    update: 'HR:employees:update',
    delete: 'HR:employees:delete',
  },
  defaultView: 'table',
  form: EmployeeFormSchema,
  table: EmployeeTableDef,
  actions: EmployeeActionDefs,
  filters: EmployeeFilterDefs,
};
```

---

## 7. Plugin Dependencies

Plugins may declare soft dependencies on other plugins:

```typescript
const CrmPluginDef: PluginDef = {
  id: 'CRM',
  dependsOn: ['CORE', 'AUTH'],   // must be active first
  // ...
};
```

The `PluginActivator` respects dependency order. Hard circular dependencies are rejected at development time (TypeScript compile error via type constraint).

---

## 8. Cross-Plugin Communication

Plugins communicate via the **Event Bus** (see `20-event-bus.md`), never via direct imports of each other's services. This prevents tight coupling.

Example: When HR creates a new employee, it emits `hr:employee:created`. The CRM plugin may listen for this event to create a linked contact automatically.

---

## 9. Plugin-Level Permissions

A plugin is activated only if the user has at least one of the plugin's `requiredPermissions`. This is checked during step 4 of the initializer chain.

If a plugin is deactivated mid-session (e.g., tenant admin revokes the HR module), the platform:
1. Emits `platform:module:deactivated` event
2. Removes the plugin's routes from the router
3. Removes menu items
4. Navigates to dashboard if user is on an HR route

---

## 10. Platform Plugins (Always Active)

Two plugins are always active regardless of backend module status:

| Plugin | ID | Routes |
|---|---|---|
| CORE | `CORE` | tenants, companies, branches, departments |
| AUTH | `AUTH` | users, roles, permissions |

These are declared in `app.config.ts` and are never disabled.

---

## 11. Example: Minimal Plugin Declaration

```typescript
export const FleetPluginDef: PluginDef = {
  id: 'FLEET',
  name: 'Fleet Management',
  version: '1.0.0',
  icon: 'directions_car',
  moduleCode: 'FLEET',
  requiredPermissions: ['FLEET:vehicles:read'],
  entities: [
    VehicleEntityDef,
    DriverEntityDef,
    MaintenanceEntityDef,
    FuelLogEntityDef,
  ],
  menu: [
    {
      id: 'fleet',
      label: 'Fleet',
      icon: 'directions_car',
      order: 50,
      children: [
        { id: 'fleet:vehicles', label: 'Vehicles', path: '/app/fleet/vehicles', permission: 'FLEET:vehicles:read', order: 1 },
        { id: 'fleet:drivers',  label: 'Drivers',  path: '/app/fleet/drivers',  permission: 'FLEET:drivers:read',  order: 2 },
      ]
    }
  ],
  widgets: [
    FleetUtilizationWidget,
    MaintenanceDueWidget,
  ],
};
```
