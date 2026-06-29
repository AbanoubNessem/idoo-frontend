# iDoo ERP Platform — Development Guide

---

## 1. Overview

This guide explains how to build a new ERP module (plugin) on the platform. It walks through every step from creating the plugin definition to registering entities, forms, tables, and actions — using the HR Employee module as the reference example.

---

## 2. Prerequisites

- Understand `PluginDef` (`04-plugin-system.md`)
- Understand `EntityDef` (`05-render-engine.md`)
- Understand `FormSchema`, `TableDef`, `ActionDef` (`06-metadata-system.md`)
- Understand the folder structure (`22-folder-structure.md`)

---

## 3. Step 1 — Create the Plugin Folder

```
src/app/plugins/hr/
├── hr.plugin.ts
├── hr.routes.ts
├── entities/
│   └── employee/
│       ├── employee.entity.ts
│       ├── employee-form.ts
│       ├── employee-table.ts
│       ├── employee-actions.ts
│       └── employee-filters.ts
├── api/
│   └── hr-employee.api.ts
└── models/
    └── hr.models.ts
```

---

## 4. Step 2 — Define Employee API Models

**`src/app/plugins/hr/models/hr.models.ts`**

```typescript
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId: string;
  departmentName: string;
  jobTitleId: string;
  jobTitleName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  hireDate: string;
  contractType: 'PERMANENT' | 'FIXED_TERM';
  contractEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId: string;
  jobTitleId: string;
  hireDate: string;
  contractType: 'PERMANENT' | 'FIXED_TERM';
  contractEndDate?: string;
}
```

---

## 5. Step 3 — Create the API Client

**`src/app/plugins/hr/api/hr-employee.api.ts`**

```typescript
@Injectable({ providedIn: 'root' })
export class HrEmployeeApiClient {
  private readonly config = inject(APP_CONFIG);
  private readonly http   = inject(HttpClient);
  private readonly base   = `${this.config.apiUrl}/v1/hr/employees`;

  list(params: Record<string, unknown>) {
    return this.http.get<ApiResponse<PageResponse<Employee>>>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Employee>>(`${this.base}/${id}`);
  }

  create(body: CreateEmployeeRequest) {
    return this.http.post<ApiResponse<Employee>>(this.base, body);
  }

  update(id: string, body: Partial<CreateEmployeeRequest>) {
    return this.http.put<ApiResponse<Employee>>(`${this.base}/${id}`, body);
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
}
```

---

## 6. Step 4 — Define the TableDef

**`src/app/plugins/hr/entities/employee/employee-table.ts`**

```typescript
export const EmployeeTableDef: TableDef<Employee> = {
  columns: [
    { id: 'name',       header: 'Name',       accessor: 'fullName',       type: 'avatar',  sortable: true },
    { id: 'email',      header: 'Email',       accessor: 'email',          type: 'email',   sortable: true },
    { id: 'department', header: 'Department',  accessor: 'departmentName', type: 'text',    sortable: false },
    { id: 'status',     header: 'Status',      accessor: 'status',         type: 'badge',
      badgeConfig: {
        ACTIVE:    { label: 'Active',    color: 'success' },
        INACTIVE:  { label: 'Inactive',  color: 'neutral' },
        SUSPENDED: { label: 'Suspended', color: 'warn' },
      }
    },
    { id: 'hireDate',   header: 'Hire Date',   accessor: 'hireDate',       type: 'date',    sortable: true },
    { id: 'actions',    header: '',            type: 'actions',            sticky: 'end' },
  ],
  defaultSort: { field: 'createdAt', direction: 'desc' },
  pageSize: 20,
  selectable: true,
  searchable: true,
  searchPlaceholder: 'Search employees...',
  exportable: true,
};
```

---

## 7. Step 5 — Define the FormSchema(s)

**`src/app/plugins/hr/entities/employee/employee-form.ts`**

```typescript
export const EmployeeCreateFormSchema: FormSchema = {
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      columns: 3,
      fields: [
        { key: 'firstName', type: 'text',  label: 'First Name', required: true },
        { key: 'lastName',  type: 'text',  label: 'Last Name',  required: true },
        { key: 'email',     type: 'email', label: 'Email',      required: true },
        { key: 'phone',     type: 'phone', label: 'Phone' },
      ],
    },
    {
      id: 'employment',
      title: 'Employment',
      columns: 2,
      fields: [
        { key: 'departmentId', type: 'entity-picker', label: 'Department',
          entityRef: 'hr:department', required: true },
        { key: 'jobTitleId',   type: 'entity-picker', label: 'Job Title',
          entityRef: 'hr:job-title', required: true },
        { key: 'hireDate',     type: 'date',   label: 'Hire Date', required: true },
        { key: 'contractType', type: 'select', label: 'Contract Type', required: true,
          options: [
            { value: 'PERMANENT',  label: 'Permanent' },
            { value: 'FIXED_TERM', label: 'Fixed Term' },
          ]
        },
        { key: 'contractEndDate', type: 'date', label: 'Contract End Date',
          hidden: (m) => m['contractType'] !== 'FIXED_TERM' },
      ],
    },
  ],
};

export const EmployeeEditFormSchema: FormSchema = {
  // Same as create but without password field (if any)
  ...EmployeeCreateFormSchema,
};
```

---

## 8. Step 6 — Define the FilterDef[]

**`src/app/plugins/hr/entities/employee/employee-filters.ts`**

```typescript
export const EmployeeFilterDefs: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'ACTIVE',    label: 'Active' },
      { value: 'INACTIVE',  label: 'Inactive' },
      { value: 'SUSPENDED', label: 'Suspended' },
    ],
  },
  {
    key: 'departmentId',
    label: 'Department',
    type: 'select',
    optionsLoader: () => inject(HrDepartmentApiClient).list({ page: 0, size: 200 })
      .pipe(map(r => r.data.content.map(d => ({ value: d.id, label: d.name })))),
  },
  {
    key: 'hireDate',
    label: 'Hire Date',
    type: 'date-range',
  },
];
```

---

## 9. Step 7 — Define the ActionDef[]

**`src/app/plugins/hr/entities/employee/employee-actions.ts`**

```typescript
export const EmployeeActions: ActionDef[] = [
  {
    id: 'hr:employee:activate',
    label: 'Activate',
    icon: 'check_circle',
    scope: ['row', 'bulk'],
    permission: PERMISSIONS.HR.EMPLOYEES.UPDATE,
    hidden: (ctx) => ctx.row?.['status'] === 'ACTIVE',
    handler: (ctx) => inject(HrEmployeeApiClient).update(ctx.row!['id'] as string, { status: 'ACTIVE' }),
    successMessage: 'Employee activated.',
  },
  {
    id: 'hr:employee:deactivate',
    label: 'Deactivate',
    icon: 'block',
    scope: ['row', 'bulk'],
    permission: PERMISSIONS.HR.EMPLOYEES.UPDATE,
    hidden: (ctx) => ctx.row?.['status'] !== 'ACTIVE',
    confirmBefore: { title: 'Deactivate Employee', message: 'Employee will lose system access.', type: 'warn' },
    handler: (ctx) => inject(HrEmployeeApiClient).update(ctx.row!['id'] as string, { status: 'INACTIVE' }),
  },
];
```

---

## 10. Step 8 — Create the EntityDef

**`src/app/plugins/hr/entities/employee/employee.entity.ts`**

```typescript
export const EmployeeEntityDef: EntityDef = {
  id: 'hr:employee',
  pluginId: 'HR',
  apiPath: '/v1/hr/employees',
  labelSingular: 'Employee',
  labelPlural: 'Employees',
  labelField: 'fullName',
  icon: 'person',
  permissions: {
    list:   PERMISSIONS.HR.EMPLOYEES.READ,
    create: PERMISSIONS.HR.EMPLOYEES.CREATE,
    update: PERMISSIONS.HR.EMPLOYEES.UPDATE,
    delete: PERMISSIONS.HR.EMPLOYEES.DELETE,
    export: PERMISSIONS.HR.EMPLOYEES.EXPORT,
  },
  defaultView: 'table',
  table: EmployeeTableDef,
  form: {
    create: EmployeeCreateFormSchema,
    edit:   EmployeeEditFormSchema,
  },
  filters: EmployeeFilterDefs,
  actions: EmployeeActions,
  searchable: true,
  exportable: true,
  hasSoftDelete: false,
};
```

---

## 11. Step 9 — Define the PluginDef

**`src/app/plugins/hr/hr.plugin.ts`**

```typescript
export const HrPluginDef: PluginDef = {
  id: 'HR',
  name: 'Human Resources',
  version: '1.0.0',
  icon: 'people',
  description: 'Employee management, departments, job titles, and org chart.',
  entities: [
    EmployeeEntityDef,
    DepartmentEntityDef,
    JobTitleEntityDef,
  ],
  menu: [
    { id: 'hr:employees',   label: 'Employees',   icon: 'person',      path: '/app/hr/employees',   order: 1, permission: PERMISSIONS.HR.EMPLOYEES.READ, moduleCode: 'HR' },
    { id: 'hr:departments', label: 'Departments', icon: 'apartment',   path: '/app/hr/departments', order: 2, permission: PERMISSIONS.HR.DEPARTMENTS.READ, moduleCode: 'HR' },
    { id: 'hr:job-titles',  label: 'Job Titles',  icon: 'work_outline', path: '/app/hr/job-titles', order: 3, moduleCode: 'HR' },
  ],
  routes: [
    { path: 'hr/employees',           entityId: 'hr:employee' },
    { path: 'hr/departments',         entityId: 'hr:department' },
    { path: 'hr/job-titles',          entityId: 'hr:job-title' },
  ],
};
```

---

## 12. Step 10 — Register the Plugin

In `src/app/app.config.ts`, add:

```typescript
import { providePlugin } from './core/plugins/plugin.provider';
import { HrPluginDef } from './plugins/hr/hr.plugin';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    providePlugin(HrPluginDef),
  ]
};
```

That's it. The runtime automatically:
- Registers all entities in `EntityRegistry`
- Registers all forms in `FormRegistry`
- Registers all tables in `TableRegistry`
- Registers all actions in `ActionRegistry`
- Builds menu items in `MenuRegistry`
- Registers lazy routes in `RouteRegistry`

The Employee list, detail, create, and edit screens are now fully functional with zero per-entity component code.

---

## 13. Checklist for a New Entity

- [ ] DTO interface in `models/`
- [ ] API client in `api/`
- [ ] `TableDef` with all columns
- [ ] `FormSchema` for create mode
- [ ] `FormSchema` for edit mode (can reuse create)
- [ ] `FilterDef[]`
- [ ] `ActionDef[]` (CRUD + custom)
- [ ] `EntityDef` referencing all above
- [ ] `PluginDef` updated with entity + menu + routes
- [ ] Permission constants added to `permissions.constants.ts`
- [ ] `providePlugin()` added to `app.config.ts`
