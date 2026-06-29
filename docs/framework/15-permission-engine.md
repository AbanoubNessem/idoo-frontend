# iDoo ERP Platform — Permission Engine

---

## 1. Overview

The Permission Engine enforces authorization at every layer of the platform: routes, menus, table columns, action buttons, form fields, and API calls. It is signal-based and reactive — permission changes are reflected immediately without a page reload.

---

## 2. Permission Model

Permissions are strings in `MODULE:resource:action` format:

```
HR:employees:read
HR:employees:create
HR:employees:update
HR:employees:delete
HR:employees:export
FLEET:vehicles:approve
AUTH:users:assign
AUTH:roles:revoke
```

The full set of `PermissionAction` values: `CREATE | READ | UPDATE | DELETE | EXPORT | IMPORT | APPROVE | REJECT | ASSIGN | REVOKE`.

---

## 3. Permission Sources

The user's effective permission set is loaded at login from:

```
GET /v1/users/{id}/permissions/effective
→ string[]   (flat list of all permission codes the user holds)
```

"Effective" means all permissions from all roles assigned to the user, merged and deduplicated.

---

## 4. PermissionStateService

The single source of truth for permissions in the frontend:

```typescript
@Injectable({ providedIn: 'root' })
class PermissionStateService {
  private readonly _permissions = signal<Set<string>>(new Set());
  
  readonly permissions: Signal<Set<string>> = this._permissions.asReadonly();

  setPermissions(permissions: string[]): void {
    this._permissions.set(new Set(permissions));
  }
  
  has(permission: string): boolean {
    return this._permissions().has(permission);
  }
  
  hasAny(permissions: string[]): boolean {
    return permissions.some(p => this._permissions().has(p));
  }
  
  hasAll(permissions: string[]): boolean {
    return permissions.every(p => this._permissions().has(p));
  }
  
  clear(): void {
    this._permissions.set(new Set());
  }
}
```

---

## 5. Permission Enforcement Layers

| Layer | Mechanism | What happens if denied |
|---|---|---|
| Route | `CanActivateFn` guard | Redirect to `/403` |
| Menu item | `MenuEngine` filter | Item hidden from sidebar |
| Table column | `ColumnDef.permission` check | Column not rendered |
| Action button | `ActionBarComponent` check | Button hidden |
| Form field | `FormFieldDef.hidden` predicate | Field hidden |
| API call | Backend enforces | 403 response, error interceptor handles |

---

## 6. Route Guard

```typescript
export const permissionGuard = (permission: string): CanActivateFn =>
  () => {
    const permState = inject(PermissionStateService);
    const router = inject(Router);
    
    if (permState.has(permission)) {
      return true;
    }
    return router.createUrlTree(['/403']);
  };
```

The `RouteRegistry` attaches the appropriate guard to each `RouteDef` based on the entity's `permissions.list` value.

---

## 7. HasPermissionDirective

The `HasPermissionDirective` is used in templates to show/hide elements based on permissions:

```html
<!-- Single permission -->
<button *hasPermission="'HR:employees:create'">+ Create</button>

<!-- Any of these permissions -->
<div *hasPermission="['HR:employees:update', 'HR:employees:delete']" [mode]="'any'">
  Admin panel
</div>

<!-- All of these permissions -->
<div *hasPermission="['HR:employees:export', 'HR:employees:import']" [mode]="'all'">
  Data tools
</div>
```

The directive uses `effect()` internally so it reacts when `PermissionStateService.permissions` signal changes:

```typescript
@Directive({ selector: '[hasPermission]', standalone: true })
export class HasPermissionDirective {
  private readonly permissionState = inject(PermissionStateService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly tpl = inject(TemplateRef);
  
  @Input() hasPermission!: string | string[];
  @Input() hasPermissionMode: 'any' | 'all' = 'any';

  constructor() {
    effect(() => {
      this.permissionState.permissions(); // register signal dependency
      this.updateView();
    });
  }
  
  private updateView(): void {
    const perms = Array.isArray(this.hasPermission)
      ? this.hasPermission : [this.hasPermission];
    const allowed = this.hasPermissionMode === 'all'
      ? this.permissionState.hasAll(perms)
      : this.permissionState.hasAny(perms);
    
    if (allowed) {
      if (!this.vcr.length) this.vcr.createEmbeddedView(this.tpl);
    } else {
      this.vcr.clear();
    }
  }
}
```

---

## 8. PERMISSIONS Constants

Permission strings are centralized in `src/app/shared/constants/permissions.constants.ts`:

```typescript
export const PERMISSIONS = {
  HR: {
    EMPLOYEES: {
      READ:   'HR:employees:read',
      CREATE: 'HR:employees:create',
      UPDATE: 'HR:employees:update',
      DELETE: 'HR:employees:delete',
      EXPORT: 'HR:employees:export',
    },
    DEPARTMENTS: { ... },
  },
  FLEET: {
    VEHICLES: { ... },
  },
  // ...
} as const;
```

All `EntityDef.permissions`, `ActionDef.permission`, `MenuItemDef.permission`, and `ColumnDef.permission` values must reference constants from this object — never raw strings.

---

## 9. Permission Refresh

In long-running sessions, permissions can change (e.g., an admin modifies roles). The platform refreshes the permission set when:

1. The user switches tenant context
2. The user receives a server-sent event (future: WebSocket push)
3. Manually: `ContextFacade.refreshPermissions()` can be called

After refresh, all signal-reactive elements (menu, buttons, directives) update automatically.

---

## 10. Super-Admin Bypass

Users with the `SYSTEM:superadmin` permission bypass all permission checks. The `PermissionStateService` checks for this permission first and returns `true` for all `has()` calls. This is the only hard-coded permission check in the platform.
