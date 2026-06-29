# iDoo ERP Platform — Render Engine

---

## 1. Overview

The Render Engine is the orchestrator that turns an `EntityDef` into a visible screen. It is a single Angular component (`EntityViewComponent`) that reads registry metadata, determines the current context (list/detail/create/edit), and delegates rendering to the appropriate sub-engine (TableEngine, FormEngine, etc.).

No business screen in the ERP is a hand-crafted component. Every screen is a parameterized instance of the Render Engine.

---

## 2. EntityViewComponent

`EntityViewComponent` is the universal screen host. It is loaded for every entity URL.

```
/app/hr/employees          → EntityViewComponent (mode: list)
/app/hr/employees/new      → EntityViewComponent (mode: create)
/app/hr/employees/:id      → EntityViewComponent (mode: detail)
/app/hr/employees/:id/edit → EntityViewComponent (mode: edit)
```

The component:
1. Reads the current URL
2. Resolves the entity ID from `RouteRegistry`
3. Reads the `EntityDef` from `EntityRegistry`
4. Determines the `ViewMode` (`list | detail | create | edit`)
5. Delegates to the appropriate engine component

---

## 3. ViewMode Resolution

```
URL pattern                         ViewMode
─────────────────────────────────   ─────────
/app/{plugin}/{entity}              list
/app/{plugin}/{entity}/new          create
/app/{plugin}/{entity}/:id          detail
/app/{plugin}/{entity}/:id/edit     edit
```

The mode is resolved from the URL, not from route data, so the pattern is consistent across all plugins without any per-entity routing configuration.

---

## 4. Rendering Pipeline

```
EntityViewComponent
        │
        ├── reads entityId from URL
        ├── resolves EntityDef from EntityRegistry
        ├── checks permission (list → entity.permissions.list)
        │       └── if denied → renders AccessDeniedComponent
        │
        ├── mode = 'list'
        │       ├── reads TableDef from TableRegistry
        │       ├── reads ActionDefs (scope: 'global') from ActionRegistry
        │       ├── reads FilterDefs from FilterRegistry
        │       └── renders TableEngineComponent
        │
        ├── mode = 'create'
        │       ├── reads FormSchema (key: '{entityId}:create') from FormRegistry
        │       ├── reads ActionDefs (scope: 'form') from ActionRegistry
        │       └── renders FormEngineComponent (mode=create)
        │
        ├── mode = 'detail'
        │       ├── reads FormSchema (key: '{entityId}:view') from FormRegistry
        │       ├── reads entity data from API
        │       ├── reads ActionDefs (scope: 'form') from ActionRegistry
        │       └── renders FormEngineComponent (mode=view)
        │
        └── mode = 'edit'
                ├── reads FormSchema (key: '{entityId}:edit') from FormRegistry
                ├── reads entity data from API
                ├── reads ActionDefs (scope: 'form') from ActionRegistry
                └── renders FormEngineComponent (mode=edit)
```

---

## 5. Page Layout

Every rendered entity screen is wrapped in a standard page layout:

```
┌────────────────────────────────────────────────────────────┐
│  PageHeaderComponent                                        │
│    title: entity.labelPlural  |  breadcrumb  |  actions   │
├────────────────────────────────────────────────────────────┤
│  FilterBarComponent (list mode only)                        │
│    [filter chips from FilterDefs]                          │
├────────────────────────────────────────────────────────────┤
│  Content Area                                               │
│                                                            │
│  ┌─ TableEngineComponent (list) ─────────────────────────┐ │
│  │  search | columns | paginator | rows | row-actions    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ FormEngineComponent (create/edit/view) ──────────────┐ │
│  │  sections | fields | validation | submit              │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 6. EntityDef Full Type

```typescript
interface EntityDef {
  // Identity
  id: string;               // '{pluginCode}:{entityName}' e.g. 'hr:employee'
  pluginId: string;         // parent plugin code
  apiPath: string;          // REST path e.g. '/v1/hr/employees'
  
  // Labels
  labelSingular: string;
  labelPlural: string;
  labelField?: string;      // field used as display name in pickers e.g. 'fullName'
  icon: string;
  
  // Permissions
  permissions: EntityPermissions;
  
  // Views
  defaultView: 'table' | 'kanban' | 'tree' | 'calendar';
  table: TableDef;
  form: FormSchema | EntityFormMap;
  filters?: FilterDef[];
  actions?: ActionDef[];
  
  // Behaviour
  searchable?: boolean;     // enables global search for this entity
  exportable?: boolean;     // enables CSV/Excel export
  importable?: boolean;     // enables bulk import
  hasSoftDelete?: boolean;  // shows deleted records filter
  hasWorkflow?: boolean;    // entity has workflow/status transitions
  workflow?: WorkflowDef;
  
  // Relations
  relations?: RelationDef[];
}

interface EntityPermissions {
  list:   string;   // permission code e.g. 'HR:employees:read'
  create: string;
  update: string;
  delete: string;
  export?: string;
  import?: string;
  approve?: string;
}

interface EntityFormMap {
  create: FormSchema;
  edit:   FormSchema;
  view?:  FormSchema;  // if omitted, view uses edit schema in readonly mode
}
```

---

## 7. Custom Screens (Override)

Some entities require custom screens that cannot be expressed as metadata. The `EntityDef.customComponent` escape hatch allows this:

```typescript
const PayrollRunEntityDef: EntityDef = {
  id: 'hr:payroll-run',
  // ...
  customComponent: () => import('./payroll-run-screen.component')
                           .then(m => m.PayrollRunScreenComponent),
};
```

When `customComponent` is present, the Render Engine bypasses the standard pipeline and directly loads the component. The custom component still receives the `EntityDef` as an input.

This escape hatch is intentional — for complex workflows, custom visualizations, and one-of-a-kind screens.

---

## 8. Related Panel (Split View)

In `detail` mode, the entity screen optionally shows a related panel:

```
┌────────────────────────────────────────────────────────┐
│  Employee: John Doe                                    │
├─────────────────────────┬──────────────────────────────┤
│  Detail Form (left)     │  Related Panel (right)       │
│  name, email, dept...   │  ┌─ Assigned Roles ────────┐ │
│                         │  │  Role table + assign btn │ │
│                         │  └──────────────────────────┘ │
│                         │  ┌─ Branch Assignments ────┐  │
│                         │  │  Branch table            │  │
│                         │  └──────────────────────────┘ │
└─────────────────────────┴──────────────────────────────┘
```

Related panels are declared in `EntityDef.relations` and rendered automatically by the Render Engine.

---

## 9. Error States

The Render Engine handles all error states:

| Condition | Rendered Component |
|---|---|
| Entity not in registry | `EntityNotFoundComponent` |
| User lacks list permission | `AccessDeniedComponent` |
| API returns 404 | `RecordNotFoundComponent` |
| API returns 500 | `ServerErrorComponent` |
| API unreachable | `NetworkErrorComponent` |
| Loading in progress | `SkeletonLoaderComponent` |
