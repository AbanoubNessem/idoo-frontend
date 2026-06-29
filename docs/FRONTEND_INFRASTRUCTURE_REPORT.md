# iDoo ERP — Frontend Infrastructure Report

**Date:** 2026-06-28  
**Auditor:** Lead Angular Enterprise Architect  
**Source of truth:** `docs/API_CONTRACT.md`

---

## 1. Architecture Review

The project follows a **layered enterprise architecture**:

```
src/app/
├── core/                   ← Singletons: auth, context, interceptors, guards, registry
│   ├── api/                ← API clients (generated layer) + DTOs/models
│   ├── auth/               ← Auth state, facades, guards, interceptors, services
│   ├── context/            ← Workspace context (tenant/company/branch)
│   ├── interceptors/       ← Logging, error, (JWT lives under auth)
│   ├── logger/             ← Structured console logger
│   ├── models/             ← Framework-level types
│   ├── registry/           ← Module/entity/menu/route registries
│   └── tokens/             ← DI tokens (APP_CONFIG)
├── features/               ← Lazy-loaded feature modules
├── layout/                 ← Shell, sidebar, topbar, auth layout
└── shared/                 ← Reusable UI components, directives, models
```

**Assessment:** The layering is sound. API clients are separate from business facades, signal-based state is used throughout, lazy loading is correctly applied to all feature routes.

---

## 2. Folder Structure Review

| Area | Status | Notes |
|---|---|---|
| `core/api/generated/` | ✅ Good | One client per entity; all `providedIn: 'root'` |
| `core/auth/` | ✅ Good | Separated: state / facades / guards / services / interceptors |
| `core/context/` | ✅ Good | Clean context state + facade + interceptor pattern |
| `core/registry/` | ✅ Good | Foundation for future dynamic framework |
| `features/` | ✅ Good | All lazy-loaded via `loadChildren` / `loadComponent` |
| `shared/` | ✅ Good | Standalone components, correct export structure |
| `layout/` | ✅ Good | Shell + Auth layout separation is correct |

---

## 3. API Layer Review

### Base URL
- **Before:** `apiUrl = 'http://localhost:8080'` with inconsistent `/api` prefixing per client.
- **After (fixed):** `apiUrl = 'http://localhost:8080/api'`; all clients use `${apiUrl}/v1/{resource}`.
- All 8 API clients now build consistent, correct URLs.

### API Clients Coverage

| Client | Base Path | Status |
|---|---|---|
| `AuthApiClient` | `/v1/auth` | ✅ Complete |
| `TenantApiClient` | `/v1/tenants` | ✅ Complete |
| `CompanyApiClient` | `/v1/companies` | ✅ Complete |
| `BranchApiClient` | `/v1/branches` | ✅ Complete |
| `DepartmentApiClient` | `/v1/departments` | ✅ Complete |
| `UserApiClient` | `/v1/users` | ✅ Complete |
| `RoleApiClient` | `/v1/roles` | ✅ Complete |
| `PermissionApiClient` | `/v1/permissions` | ✅ Complete |
| `ModuleApiClient` | `/v1/modules` | ✅ Complete |

---

## 4. Authentication Review

### Login Flow
✅ `POST /v1/auth/login` handled by `AuthFacade.login()`  
✅ Case A (single tenant): tokens stored, dashboard redirect  
✅ Case B (multi-tenant): `selectionToken` stored in `sessionStorage` via `SelectionTokenStorageService`  
✅ `GET /v1/auth/available-tenants` handled by `TenantSelectionFacade.getAvailableTenants()`  
✅ `POST /v1/auth/select-tenant` handled by `TenantSelectionFacade.selectTenant()`  
✅ Final login state finalized in `AuthFacade.finalizeLogin()` then `ContextInitializationService.initializeContext()`

### Token Storage
✅ `selectionToken`: `sessionStorage` (correct — expires in 5 min, must not survive page reload)  
✅ `accessToken` / `refreshToken` / user: `localStorage` via `SessionManagerService`  
⚠️ `accessToken` in localStorage is a security trade-off. Ideal storage is memory + httpOnly cookie for refresh. Noted as acceptable for MVP.

### Session Restore
✅ `APP_INITIALIZER` now calls `AuthFacade.restoreSession()` on bootstrap, before route activation. Auth guards see correct state immediately.

### Token Refresh
⚠️ `POST /v1/auth/refresh` is marked **NOT YET IMPLEMENTED** in the API contract. The JWT interceptor handles 401s by calling this endpoint — it will fail gracefully (logout is triggered). This must be implemented on the backend before production.

### Logout
⚠️ `POST /v1/auth/logout` is marked **NOT YET IMPLEMENTED** in the API contract. Client-side session clearing is correct (tokens removed, state cleared, redirect to login). Server-side token invalidation is deferred.

---

## 5. Tenant Flow Review

✅ `selectionToken` stored in sessionStorage, cleared after use  
✅ Context interceptor injects `X-Tenant-ID` on all non-auth requests  
✅ Context interceptor **now skips** `/v1/auth/` routes (was injecting headers on public endpoints — fixed)  
✅ `ContextFacade` persists tenantId / companyId / branchId to `localStorage` under `workspace_context`  
✅ `ContextFacade.restoreContext()` called from `AuthFacade.restoreSession()`

---

## 6. Permission Review

✅ `PermissionStateService` uses a `Set<string>` for O(1) permission lookups  
✅ `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()` all correct  
✅ `HasPermissionDirective` now uses `effect()` to react to permission signal changes  
✅ `permissionGuard` reads `route.data['permissions']` and checks `hasAllPermissions()`  
✅ Effective permissions loaded from correct endpoint: `GET /v1/users/{id}/permissions/effective`  

**Before fix:** `ContextInitializationService` called `userApi.getEffectivePermissions()` → `/v1/users/{id}/permissions` (returns DIRECT permissions, not merged effective set).  
**After fix:** Now calls `userApi.getEffectivePermissionsByUser()` → `/v1/users/{id}/permissions/effective` (returns fully merged effective set).

---

## 7. State Management Review

✅ Angular Signals used throughout (`signal()`, `computed()`, `effect()`)  
✅ No NgRx / third-party state library needed at this scale  
✅ `AuthStateService`: authentication state  
✅ `AuthFlowStore`: login flow UI state (loading, step, error, tenants)  
✅ `PermissionStateService`: effective permission set  
✅ `ContextStateService`: workspace context (tenantId / companyId / branchId)

---

## 8. Interceptors Review

| Interceptor | Order | Status |
|---|---|---|
| `loggingInterceptor` | 1st | ✅ Logs all requests + responses |
| `errorInterceptor` | 2nd (new) | ✅ Handles 400/401/403/404/409/422/500 globally |
| `jwtInterceptor` | 3rd | ✅ Attaches Bearer token; handles 401 + refresh |
| `contextInterceptor` | 4th | ✅ Injects X-Tenant-ID; now skips auth routes |

---

## 9. Guards Review

| Guard | Applied To | Checks | Status |
|---|---|---|---|
| `authGuard` | `/app/**` | `authState.isAuthenticated()` | ✅ |
| `tenantGuard` | `/app/**` | `authState.tenantId()` | ✅ |
| `permissionGuard` | Individual routes | `route.data['permissions']` | ✅ |

---

## 10. Performance Review

✅ Lazy loading on ALL feature routes  
✅ Standalone components throughout — no `NgModule` overhead  
✅ Signal-based reactivity — no unnecessary CD cycles  
✅ O(1) permission checks via `Set<string>` lookup  
⚠️ No HTTP caching layer (e.g., for `/v1/modules`, `/v1/permissions`) — consider adding for read-heavy, rarely-changing data  
⚠️ `loggingInterceptor` runs in production — should check `isDevMode()` before logging

---

## 11. Security Review

✅ JWT never sent to auth endpoints (interceptor correctly excludes `/v1/auth/`)  
✅ `selectionToken` stored in `sessionStorage` (correct — short-lived, tab-scoped)  
✅ Logger sanitizes sensitive fields (`token`, `password`, `secret`, etc.)  
⚠️ `accessToken` in `localStorage` is XSS-vulnerable; acceptable for MVP, migrate to memory + httpOnly cookie when backend implements secure cookie refresh  
⚠️ Token refresh endpoint missing (backend) — sessions expire every 15 min without re-login  
⚠️ Logout endpoint missing (backend) — stolen refresh tokens cannot be revoked server-side

---

## 12. Coding Standards Review

✅ `inject()` function API used everywhere (no constructor injection)  
✅ `providedIn: 'root'` on all services  
✅ Standalone components and interceptors  
✅ `HttpInterceptorFn` functional interceptors  
✅ `CanActivateFn` functional guards  
⚠️ Legacy `AuthService` was a duplicate of `AuthFacade` with different storage keys — replaced with re-export shim  
⚠️ Some `console.log/group` calls remain in guards — should use `LoggerService`

---

## 13. Overall Score

| Category | Score | Notes |
|---|---|---|
| Architecture | 9/10 | Clean layering, solid separation of concerns |
| API Layer | 9/10 | All clients complete; URL fixed |
| Authentication | 8/10 | Correct flow; pending backend refresh/logout endpoints |
| State Management | 9/10 | Signals used correctly throughout |
| Interceptors | 9/10 | Full chain now correct |
| Guards | 9/10 | All present and correct |
| DTOs / Models | 9/10 | Fixed enums + missing required fields |
| Security | 6/10 | localStorage tokens + missing backend security endpoints |
| Performance | 8/10 | No HTTP caching; logging in prod |
| **Overall** | **8.5/10** | Production-ready infrastructure after fixes applied |
