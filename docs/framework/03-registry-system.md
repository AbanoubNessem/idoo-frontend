# iDoo ERP Platform — Registry System

---

## 1. Overview

The Registry System is the **central nervous system** of the platform. Every piece of metadata — entities, forms, tables, actions, widgets, menus, routes, fields — is stored in a registry. Engines read from registries at render time. Plugins write to registries at initialization time.

There are no direct coupling between plugins and engines. Registries are the sole interface.

---

## 2. Registry Architecture

```
AppRegistry (root coordinator)
    │
    ├── PluginRegistry      — registered plugins
    ├── EntityRegistry      — entity definitions
    ├── FormRegistry        — form schemas per entity
    ├── TableRegistry       — table configs per entity
    ├── ActionRegistry      — action definitions per entity
    ├── MenuRegistry        — navigation menu items
    ├── RouteRegistry       — URL → entity/component mapping
    ├── WidgetRegistry      — dashboard widget definitions
    ├── FieldRegistry       — custom field type renderers
    ├── FilterRegistry      — filter definitions per entity
    └── ValidationRegistry  — named validator functions
```

---

## 3. Registry Pattern

Every registry follows the same contract pattern:

```typescript
interface Registry<K, V> {
  register(key: K, value: V): void;
  get(key: K): V | undefined;
  getAll(): V[];
  has(key: K): boolean;
  clear(): void;
}
```

All registries are Angular services (`providedIn: 'root'`) using `signal<Map<K, V>>()` for reactive storage.

Reading from a registry is reactive — consumers use `computed(() => registry.get(key))` and re-render automatically when the registry changes.

---

## 4. EntityRegistry

The entity registry is the primary registry. An `EntityDef` describes a complete business entity.

**Registration:**
```typescript
entityRegistry.register('hr:employee', EmployeeEntityDef);
```

**Lookup:**
```typescript
const def = entityRegistry.get('hr:employee');
// → EmployeeEntityDef with form, table, actions, etc.
```

**Key format:** `{pluginCode}:{entityName}` (e.g., `hr:employee`, `crm:contact`, `fleet:vehicle`)

---

## 5. PluginRegistry

The plugin registry tracks which plugins have been declared and which are active.

```typescript
interface PluginRegistryEntry {
  def: PluginDef;
  status: 'declared' | 'activating' | 'active' | 'disabled';
  activatedAt?: Date;
  reason?: string;  // reason for 'disabled' status
}
```

A plugin moves from `declared` to `active` during `APP_INITIALIZER` step 4 (see `02-runtime.md`).

---

## 6. FormRegistry

Stores `FormSchema` objects keyed by entity + optional context.

**Registration:**
```typescript
formRegistry.register('hr:employee:create', EmployeeCreateFormSchema);
formRegistry.register('hr:employee:edit',   EmployeeEditFormSchema);
formRegistry.register('hr:employee:view',   EmployeeViewFormSchema);
```

**Lookup:**
```typescript
const schema = formRegistry.get('hr:employee:create');
// Falls back to 'hr:employee' if context-specific form not found
```

The key supports three lookup strategies (in priority order):
1. `{plugin}:{entity}:{mode}` — context-specific (create/edit/view)
2. `{plugin}:{entity}` — entity-level default
3. `{plugin}:default` — plugin-level fallback

---

## 7. TableRegistry

Stores `TableDef` objects keyed by entity.

```typescript
tableRegistry.register('hr:employee', EmployeeTableDef);
tableRegistry.register('hr:employee:compact', EmployeeCompactTableDef);
```

Multiple table configs can be registered per entity for different use cases (list view, embedded table, report view).

---

## 8. ActionRegistry

Stores `ActionDef` objects.

**Scopes:**
- `global` — available in toolbar for the whole entity list
- `row` — available per-row in the table
- `form` — available in the form footer
- `bulk` — available when multiple rows are selected

```typescript
actionRegistry.register('hr:employee:create',      CreateEmployeeActionDef);
actionRegistry.register('hr:employee:activate',    ActivateEmployeeActionDef);
actionRegistry.register('hr:employee:deactivate',  DeactivateEmployeeActionDef);
actionRegistry.register('hr:employee:bulk-delete', BulkDeleteEmployeeActionDef);
```

---

## 9. MenuRegistry

Stores the navigation structure. Each `MenuItemDef` represents one sidebar entry or nested sub-item.

The registry is read by `MenuEngine` which filters by user permissions and active modules.

Menu items are ordered by `order` property within their parent.

---

## 10. RouteRegistry

Maps URL path patterns to entity identifiers or lazy-loaded components.

```typescript
// Entity-based routes (most common)
routeRegistry.register({
  path: 'hr/employees',
  entityId: 'hr:employee',
  layout: 'list'
});

routeRegistry.register({
  path: 'hr/employees/:id',
  entityId: 'hr:employee',
  layout: 'detail'
});

// Custom component routes (special screens)
routeRegistry.register({
  path: 'hr/payroll-run',
  component: () => import('./features/hr/payroll-run.component').then(m => m.PayrollRunComponent),
  permission: 'HR:payroll:run'
});
```

---

## 11. WidgetRegistry

Stores dashboard widget definitions. Each widget is a standalone Angular component paired with a configuration interface.

```typescript
widgetRegistry.register('hr:headcount-kpi', HeadcountKpiWidget);
widgetRegistry.register('hr:turnover-chart', TurnoverChartWidget);
widgetRegistry.register('fleet:utilization-gauge', FleetUtilizationWidget);
```

Dashboard configurations reference widget IDs. The `WidgetEngine` resolves the ID to the component and renders it with its config.

---

## 12. FieldRegistry

Stores custom field type renderers. The built-in field types (`text`, `date`, `select`, etc.) are pre-registered. Plugins register additional types:

```typescript
fieldRegistry.register('currency-picker', CurrencyPickerFieldComponent);
fieldRegistry.register('employee-picker', EmployeePickerFieldComponent);
fieldRegistry.register('cost-center-picker', CostCenterPickerFieldComponent);
fieldRegistry.register('signature-pad', SignaturePadFieldComponent);
```

When the `FormEngine` encounters a field with `type: 'employee-picker'`, it queries `FieldRegistry` to get the renderer component.

---

## 13. AppRegistry (Coordinator)

`AppRegistry` is the single DI token that plugins use to register all their metadata in one call. It internally delegates to each sub-registry.

```typescript
interface AppRegistry {
  registerPlugin(def: PluginDef): void;
  registerEntity(def: EntityDef): void;
  registerForm(key: string, schema: FormSchema): void;
  registerTable(key: string, config: TableDef): void;
  registerAction(key: string, def: ActionDef): void;
  registerMenu(items: MenuItemDef[]): void;
  registerRoutes(routes: RouteDef[]): void;
  registerWidgets(widgets: WidgetDef[]): void;
  registerFields(fields: FieldTypeDef[]): void;
}
```

A plugin calls `appRegistry.registerPlugin(myPluginDef)` once. The `PluginActivator` then cascades the registration to all sub-registries.

---

## 14. Registry State Persistence

Registries are in-memory only. They are repopulated on every application startup from:
1. Static `forPlugin()` declarations (developer-registered metadata)
2. Dynamic backend data (backend module list, tenant-specific configs)

There is no serialization of registry state to localStorage or IndexedDB in Phase 1.

---

## 15. Registry Signals

All registries expose their contents as Angular Signals for reactive consumption:

```typescript
// In any component or service:
readonly employees = computed(() =>
  this.entityRegistry.get('hr:employee')
);

readonly menuItems = computed(() =>
  this.menuRegistry.getFiltered(this.permissionState.permissions())
);
```

When a new plugin is registered (e.g., a hot-reloaded plugin in dev mode), all computed signals automatically re-evaluate.
