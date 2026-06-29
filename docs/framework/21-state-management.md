# iDoo ERP Platform — State Management

---

## 1. Overview

The platform uses Angular Signals as its sole state management solution. There is no NgRx, no BehaviorSubject-based stores, and no third-party state library. State is organized into injectable services layered from global → plugin → component.

---

## 2. State Layers

```
┌─────────────────────────────────────────────┐
│  Global Platform State                       │
│  (Session, Context, Permissions, Registry)   │
│  Provided in: root                           │
├─────────────────────────────────────────────┤
│  Plugin State                               │
│  (HR module state, Fleet module state, etc.) │
│  Provided in: plugin lazy-loaded route       │
├─────────────────────────────────────────────┤
│  Component State                            │
│  (Table filter state, Form dirty state)     │
│  Created per component instance             │
└─────────────────────────────────────────────┘
```

---

## 3. Global State Services

### 3.1 SessionState (AuthFacade)

```typescript
@Injectable({ providedIn: 'root' })
class AuthFacade {
  readonly isAuthenticated = signal(false);
  readonly currentUser     = signal<UserProfile | null>(null);
  readonly accessToken     = signal<string | null>(null);
  readonly selectionToken  = signal<string | null>(null);
  readonly refreshToken    = signal<string | null>(null);
  readonly isLoggingIn     = signal(false);
  readonly authError       = signal<string | null>(null);
}
```

### 3.2 ContextState (ContextFacade)

```typescript
@Injectable({ providedIn: 'root' })
class ContextFacade {
  readonly currentTenant   = signal<TenantInfo | null>(null);
  readonly currentCompany  = signal<Company | null>(null);
  readonly currentBranch   = signal<Branch | null>(null);
  
  // Derived
  readonly tenantId  = computed(() => this.currentTenant()?.id ?? null);
  readonly companyId = computed(() => this.currentCompany()?.id ?? null);
  readonly branchId  = computed(() => this.currentBranch()?.id ?? null);
}
```

### 3.3 PermissionState

```typescript
@Injectable({ providedIn: 'root' })
class PermissionStateService {
  readonly permissions = signal<Set<string>>(new Set());
}
```

### 3.4 RegistryState

```typescript
@Injectable({ providedIn: 'root' })
class RegistryState {
  readonly entities  = signal<Map<string, EntityDef>>(new Map());
  readonly forms     = signal<Map<string, FormSchema>>(new Map());
  readonly tables    = signal<Map<string, TableDef>>(new Map());
  readonly actions   = signal<Map<string, ActionDef[]>>(new Map());
  readonly menus     = signal<Map<string, MenuItemDef>>(new Map());
  readonly routes    = signal<Map<string, RouteDef>>(new Map());
  readonly widgets   = signal<Map<string, WidgetDef>>(new Map());
  readonly fields    = signal<Map<string, FieldComponentDef>>(new Map());
  readonly filters   = signal<Map<string, FilterDef[]>>(new Map());
}
```

---

## 4. Plugin State

Each ERP module can define its own state service. Plugins must:

1. Define a `{ModuleCode}State` service with `providedIn: null` (not root)
2. Provide it in the plugin's lazy route: `providers: [ModuleState]`
3. Use it only within that plugin's components

This keeps plugin state isolated and automatically garbage-collected when the plugin's routes are destroyed.

**Example: HR plugin state**

```typescript
@Injectable()
class HrState {
  readonly selectedDepartmentId = signal<string | null>(null);
  readonly employeeListFilters  = signal<Record<string, unknown>>({});
  readonly headcountByDept      = signal<Record<string, number> | null>(null);
}
```

---

## 5. Component-Level State

Component state lives as signals or computed values directly in the component class. It is not shared outside the component:

```typescript
@Component({ ... })
class TableEngineComponent {
  readonly currentPage = signal(0);
  readonly pageSize    = signal(20);
  readonly sortField   = signal<string | null>(null);
  readonly sortDir     = signal<'asc' | 'desc'>('asc');
  readonly searchTerm  = signal('');
  
  readonly queryParams = computed(() => ({
    page: this.currentPage(),
    size: this.pageSize(),
    sort: this.sortField() ? `${this.sortField()},${this.sortDir()}` : undefined,
    search: this.searchTerm() || undefined,
  }));
}
```

---

## 6. Derived State with computed()

Derived values use `computed()` — they are never stored as signals that are manually updated:

```typescript
// BAD — manual derivation:
readonly isLoggedIn = signal(false);
effect(() => {
  this.isLoggedIn.set(this.currentUser() !== null);  // WRONG
});

// GOOD — computed derivation:
readonly isAuthenticated = computed(() => this.currentUser() !== null);
```

---

## 7. Effects and Side Effects

`effect()` is used only for side effects — never for state derivation:

Appropriate `effect()` uses:
- Persisting to `localStorage` when a signal changes
- Logging when state changes
- Updating non-Signal UI state (e.g., third-party chart library)
- Synchronizing form values to a signal

Inappropriate `effect()` uses:
- Computing derived values (use `computed()` instead)
- Triggering HTTP calls directly (use `toObservable()` + `switchMap`)

---

## 8. HTTP State Pattern

For async data that comes from HTTP, the platform uses this pattern:

```typescript
class SomeService {
  private readonly _data    = signal<SomeType | null>(null);
  private readonly _loading = signal(false);
  private readonly _error   = signal<string | null>(null);
  
  readonly data    = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error   = this._error.asReadonly();
  
  load(id: string): void {
    this._loading.set(true);
    this._error.set(null);
    this.api.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:  data  => { this._data.set(data); this._loading.set(false); },
      error: err   => { this._error.set(err.message); this._loading.set(false); },
    });
  }
}
```

---

## 9. No Global "Store" Pattern

The platform deliberately avoids a centralized store (NgRx pattern) because:

1. ERP data is not global — it's per-entity, per-page
2. Caching entity data globally creates stale-data bugs (user edits in tab A, tab B still shows old data)
3. The registry (metadata) is global, but it is write-once at bootstrap and read-many afterward

Entity data is always fetched fresh on route activation. The `EntityDataSource` is the per-list data pipeline, not a global cache.

---

## 10. State Debugging

In development mode, the platform exposes all global state signals on the `window` object:

```javascript
// In browser console:
window.__idoo.authState.currentUser()
window.__idoo.contextState.currentBranch()
window.__idoo.permissionState.permissions()
```

This is disabled in production builds.
