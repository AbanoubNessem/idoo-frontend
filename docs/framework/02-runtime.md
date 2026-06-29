# iDoo ERP Platform — Runtime & Bootstrap Lifecycle

---

## 1. Overview

The runtime lifecycle defines the exact sequence of operations from browser load to first interactive screen. Every step is ordered and deterministic. Nothing renders until all prerequisites are met.

---

## 2. Bootstrap Sequence

```
Browser loads index.html
         │
         ▼
Angular bootstraps AppComponent (main.ts)
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              APP_INITIALIZER Chain (ordered)             │
│                                                         │
│  [1] restoreSession()          ← AuthFacade             │
│       Read tokens from localStorage                     │
│       Set AuthStateService signals                      │
│       Set ContextStateService signals                   │
│                                                         │
│  [2] loadActiveModules()       ← PlatformRuntimeService │
│       GET /v1/modules                                   │
│       Populate ModuleRegistry signals                   │
│       Determine active plugin set                       │
│                                                         │
│  [3] loadEffectivePermissions()← PlatformRuntimeService │
│       GET /v1/users/{id}/permissions/effective          │
│       Populate PermissionStateService signal            │
│                                                         │
│  [4] initializePlugins()       ← PluginRegistry        │
│       For each registered PluginDef:                    │
│         - Check if module is active (from step 2)       │
│         - Check if user has access (from step 3)        │
│         - Register routes dynamically                   │
│         - Register menus                                │
│         - Register entities, forms, tables, actions     │
│                                                         │
│  [5] buildMenu()               ← MenuEngine             │
│       Read MenuRegistry                                 │
│       Filter by user permissions                        │
│       Populate SidebarComponent signal                  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
Router activates initial route (authGuard → tenantGuard)
         │
         ▼
ShellComponent renders
         │
         ▼
First entity screen rendered by RenderEngine
```

---

## 3. Initializer Ordering

Angular `APP_INITIALIZER` functions run in the order they are declared in `appConfig.providers`. They are Promise-based — each must resolve before the next starts.

```typescript
// Conceptual ordering in app.config.ts
APP_INITIALIZER: [
  restoreSessionFactory,         // #1 — no HTTP calls, sync localStorage read
  loadActiveModulesFactory,      // #2 — GET /v1/modules (requires tokens from #1)
  loadPermissionsFactory,        // #3 — GET /v1/users/permissions (requires tokens from #1)
  initializePluginsFactory,      // #4 — pure in-memory registry population
  buildMenuFactory,              // #5 — derives from registry + permissions
]
```

**If the user is not authenticated** (no tokens in localStorage), steps 2–5 are skipped. The router redirects to `/auth/login`.

**If tokens are present but expired**, step 2 will attempt a token refresh (when backend implements `POST /v1/auth/refresh`). On failure, the session is cleared and login is shown.

---

## 4. Plugin Initialization Detail

Each plugin is registered in `app.config.ts` via `providePlugin(myPluginDef)`.

`providePlugin()` does NOT execute at call time. It registers the plugin definition with the `PluginRegistry` injection token. The actual initialization runs in step [4] of the initializer chain.

```
providePlugin(HrPluginDef)
      │
      ▼
PluginRegistry stores HrPluginDef (not yet activated)
      │
  [at step 4]
      ▼
PlatformRuntimeService.initializePlugins()
      │
      ├── Is 'HR' in active backend modules? → Yes
      ├── Does user have any HR permission? → Yes
      │
      ▼
PluginActivator.activate(HrPluginDef)
      │
      ├── EntityRegistry.register(each entity)
      ├── RouteRegistry.register(each route)
      ├── MenuRegistry.register(each menu item)
      ├── WidgetRegistry.register(each widget)
      └── ActionRegistry.register(global actions)
```

---

## 5. Route Registration Timing

Angular's `provideRouter()` normally requires routes at bootstrap time. The platform solves this by:

1. All routes under `/app/**` use a single wildcard catch-all that loads `EntityViewComponent`
2. `EntityViewComponent` reads the URL, looks up the entity in `EntityRegistry`, and renders dynamically
3. Static named routes (e.g., `/app/dashboard`) are registered statically

This means the platform does NOT need to dynamically add Angular routes at runtime. The routing layer is:

```
/app/** → ShellComponent (guards: authGuard, tenantGuard)
             └── EntityViewComponent (reads URL → EntityRegistry → renders)
```

Custom screens (non-entity pages like Dashboard) use statically declared routes and lazy-loaded components.

---

## 6. Runtime State Signals

After bootstrap, these signal values are available platform-wide:

| Signal | Service | Value |
|---|---|---|
| `accessToken` | `AuthStateService` | JWT string or null |
| `user` | `AuthStateService` | `UserInfo` or null |
| `isAuthenticated` | `AuthStateService` | boolean |
| `tenantId` | `ContextStateService` | string or null |
| `companyId` | `ContextStateService` | string or null |
| `branchId` | `ContextStateService` | string or null |
| `permissions` | `PermissionStateService` | `EffectivePermissionResponse[]` |
| `activeModules` | `ModuleRegistryState` | `ModuleResponse[]` |
| `menuItems` | `MenuEngine` | `MenuItemDef[]` |
| `plugins` | `PluginRegistryState` | `ActivatedPlugin[]` |

---

## 7. Teardown

On logout:

```
AuthFacade.logout()
      │
      ├── POST /v1/auth/logout (fire-and-forget)
      ├── SessionManagerService.clearSession()
      ├── AuthStateService.clearAuth()
      ├── PermissionStateService.clearPermissions()
      ├── ContextFacade.clearContext()
      ├── PluginRegistry.deactivateAll()
      └── Router.navigate(['/auth/login'])
```

On tenant switch (future feature):

```
ContextFacade.switchTenant(newTenantId)
      │
      ├── Update X-Tenant-ID header
      ├── Reload permissions for new tenant
      ├── Re-initialize plugins (some may be inactive in new tenant)
      ├── Rebuild menu
      └── Navigate to dashboard
```

---

## 8. PlatformRuntimeService (to be implemented)

This new service coordinates steps 2–5 of the initializer chain. Its contract:

```typescript
interface PlatformRuntimeService {
  loadActiveModules(): Observable<void>;
  loadEffectivePermissions(): Observable<void>;
  initializePlugins(): void;
  buildMenu(): void;
}
```

It is injected as a dependency of the `APP_INITIALIZER` factory and runs before any route is activated.
