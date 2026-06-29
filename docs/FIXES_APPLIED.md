# iDoo ERP — Fixes Applied

**Date:** 2026-06-28  
**Phase:** 1 — Frontend Infrastructure Only (no business screens)

---

## FIX-1 — Corrected Base URL (CRITICAL)

**What was wrong:**  
`APP_CONFIG.apiUrl` was set to `'http://localhost:8080'`. The `AuthApiClient` compensated by hardcoding `/api` in its base path, giving the correct URL by accident. All other API clients (`TenantApiClient`, `UserApiClient`, `RoleApiClient`, etc.) built URLs as `http://localhost:8080/v1/...` — missing the required `/api` prefix. Every non-auth API call would receive a 404.

**How it was fixed:**
- `src/app/app.config.ts`: Changed `apiUrl` from `'http://localhost:8080'` to `'http://localhost:8080/api'`
- `src/app/core/api/generated/auth.api.ts`: Removed hardcoded `/api` from base path (`/api/v1/auth` → `/v1/auth`)

**Affected files:**
- `src/app/app.config.ts`
- `src/app/core/api/generated/auth.api.ts`

**Potential impact:** All API calls now correctly target `http://localhost:8080/api/v1/{resource}`

---

## FIX-2 — Corrected API Models and DTOs (CRITICAL)

**What was wrong:**  
Multiple DTO mismatches against the backend API contract:

1. `UserStatus` enum: `LOCKED` and `PENDING` do not exist in backend. Should be `SUSPENDED` and `PENDING_VERIFICATION`.
2. `PermissionAction` enum: Missing `REJECT`, `ASSIGN`, `REVOKE` values.
3. `ApiResponse` error shape: Frontend had `errors?: Record<string, string[]>` (wrong key, wrong type). Backend returns `error: { code, message, fieldErrors: Record<string,string> }`.
4. `LoginResponseData`: Missing `tenant` field present in backend Case A response.
5. `TokenResponse.tenant`: Was typed as `any` — now typed as `TenantInfo`.
6. `CreateBranchRequest`: Missing required `isActive: boolean` and `isMain: boolean`.
7. `CreateDepartmentRequest`: Missing required `isActive: boolean`.
8. `RoleRequest`: Missing required `isActive: boolean`.
9. `UserRequest`: Missing required `password: string`.
10. `CreateTenantRequest`: Missing `isActive` (required), `logoUrl`, `subscriptionExpiresAt`, `settings`.
11. `UpdateBranchRequest`: Was using `Omit<CreateBranchRequest, 'companyId'>` which inherited required `isActive`/`isMain` — now a proper partial update interface.
12. `UpdateTenantRequest`: Was `extends CreateTenantRequest` making all fields required — now all fields optional.
13. Added `TenantInfo` interface (minimal tenant response used inside auth tokens).
14. `PageResponse`: Added `numberOfElements` and `empty` fields from backend Spring Page.

**How it was fixed:**  
Complete rewrite of `src/app/core/api/models/index.ts` with all fields verified against `docs/API_CONTRACT.md`.

**Affected files:**
- `src/app/core/api/models/index.ts`

**Potential impact:**  
TypeScript will now catch DTO mismatches at compile time. All API requests will send the required fields. All response parsing will work with correct field names.

---

## FIX-3 — Corrected Effective Permissions Endpoint (CRITICAL)

**What was wrong:**  
`ContextInitializationService.initializeContext()` called `userApi.getEffectivePermissions(user.id)` which maps to `GET /v1/users/{id}/permissions`. This endpoint returns **direct permission overrides** (grants and denies applied to the specific user), NOT the merged effective permission set.

The correct endpoint is `GET /v1/users/{id}/permissions/effective` (method: `getEffectivePermissionsByUser`), which returns the merged set of all permissions from roles + direct grants, minus direct denies.

**How it was fixed:**  
Changed `userApi.getEffectivePermissions(user.id)` → `userApi.getEffectivePermissionsByUser(user.id)` in `initializeContext()`.

**Affected files:**
- `src/app/core/context/services/context-initialization.service.ts`

**Potential impact:**  
Users now receive their correct effective permissions. Previously, a user with only role-based permissions (the common case) would receive an empty permission set, causing every `permissionGuard` to redirect them to `/403`.

---

## FIX-4 — Fixed Context Interceptor Auth Route Exclusion (MEDIUM)

**What was wrong:**  
`contextInterceptor` added `X-Tenant-ID`, `X-Company-ID`, `X-Branch-ID` headers to ALL outgoing requests, including `POST /v1/auth/login`, `POST /v1/auth/select-tenant`, and `GET /v1/auth/available-tenants`. These are public endpoints that must not receive workspace context headers.

**How it was fixed:**  
Added early-exit check at the top of the interceptor function:
```typescript
if (req.url.includes('/v1/auth/')) {
  return next(req);
}
```

**Affected files:**
- `src/app/core/context/interceptors/context.interceptor.ts`

**Potential impact:**  
Auth endpoints now receive clean requests without spurious headers. Backend auth logic is simpler (no unexpected headers to handle).

---

## FIX-5 — Added Global HTTP Error Interceptor (NEW FILE)

**What was wrong:**  
No global HTTP error handling. Each API call needed its own `catchError` to handle network and server errors. 403 responses were never globally intercepted to redirect to the forbidden page.

**How it was fixed:**  
Created `src/app/core/interceptors/error.interceptor.ts` with structured handling for:
- `400` — logs validation errors including fieldErrors
- `401` — logged (JWT interceptor handles the refresh; this handles the post-refresh failure)
- `403` — navigates to `/403`
- `404` — logs missing resource
- `409` — logs conflict
- `422` — logs business rule violation
- `500` — logs internal server error
- `0` — logs network/connection error

Registered in `app.config.ts` as the 2nd interceptor (after logging, before jwt).

**Affected files:**
- `src/app/core/interceptors/error.interceptor.ts` (NEW)
- `src/app/app.config.ts`

---

## FIX-6 — Removed Legacy AuthService Duplicate (LOW)

**What was wrong:**  
`src/app/core/auth/services/auth.service.ts` was a legacy implementation of login/logout/refresh that duplicated `AuthFacade`. It used `TokenStorageService` (keys: `idoo_access_token`, `idoo_refresh_token`, `idoo_user_data`) while `AuthFacade` used `SessionManagerService` (keys: `auth_access_token`, `auth_refresh_token`, `auth_user`). Both were `providedIn: 'root'`, creating two separate storage services with conflicting keys.

**How it was fixed:**  
Replaced `auth.service.ts` with a re-export shim pointing to `AuthFacade`:
```typescript
export { AuthFacade as AuthService } from '../facades/auth.facade';
```
Any lingering import of `AuthService` will now resolve to the correct `AuthFacade`.

**Affected files:**
- `src/app/core/auth/services/auth.service.ts`

---

## FIX-7 — Fixed HasPermissionDirective Signal Reactivity (MEDIUM)

**What was wrong:**  
`HasPermissionDirective.ngOnInit()` called `updateView()` once. If the permission signal hadn't been populated yet (permissions still loading from the API), the view would be created without access, and never updated when permissions arrived.

**How it was fixed:**  
Replaced `ngOnInit` with Angular `effect()` in the constructor. The effect registers a reactive dependency on `permissionState.permissions()` signal and re-evaluates `updateView()` on every permission set change.

**Affected files:**
- `src/app/shared/directives/permission/has-permission.directive.ts`

**Potential impact:**  
UI elements guarded by `*hasPermission` now correctly appear/disappear when the permission set changes (e.g., after login, after logout, after a permission change).

---

## FIX-8 — Fixed provideRegistry() Crash on Missing Token (LOW)

**What was wrong:**  
`provideRegistry()` declared `deps: [RegistryFacade, MODULE_CONFIG_TOKEN]`. If nothing provided `MODULE_CONFIG_TOKEN`, Angular's DI would throw `NullInjectorError` on bootstrap.

**How it was fixed:**  
- Added a default empty `MODULE_CONFIG_TOKEN` provider to `provideRegistry()` itself (multi: true, value: [])
- Changed deps to use `Optional` so the DI system never throws

**Affected files:**
- `src/app/core/registry/providers/registry.provider.ts`

---

## FIX-9 — Added Session Restore APP_INITIALIZER (CRITICAL UX)

**What was wrong:**  
`AuthFacade.restoreSession()` existed and was correctly implemented (reads `localStorage` → sets auth state + context). However, it was **never called**. On a page reload, the auth state was empty, and `authGuard` would redirect to `/auth/login` even with valid tokens in `localStorage`.

**How it was fixed:**  
Added an `APP_INITIALIZER` to `app.config.ts`:
```typescript
{
  provide: APP_INITIALIZER,
  useFactory: restoreSessionFactory,
  deps: [AuthFacade],
  multi: true
}
```
`restoreSessionFactory` calls `authFacade.restoreSession()` synchronously during application init, before the first route navigation. The auth guard now sees the restored state.

**Affected files:**
- `src/app/app.config.ts`

**Potential impact:**  
Page reloads on protected routes no longer bounce to login when valid tokens exist in storage. This is fundamental to any SPA session management.

---

## Summary of All Changes

| # | File | Change Type | Severity |
|---|---|---|---|
| 1 | `app.config.ts` | Modified | CRITICAL |
| 2 | `core/api/generated/auth.api.ts` | Modified | CRITICAL |
| 3 | `core/api/models/index.ts` | Rewritten | CRITICAL |
| 4 | `core/context/services/context-initialization.service.ts` | Modified | CRITICAL |
| 5 | `core/context/interceptors/context.interceptor.ts` | Modified | MEDIUM |
| 6 | `core/interceptors/error.interceptor.ts` | **NEW FILE** | MEDIUM |
| 7 | `core/auth/services/auth.service.ts` | Modified (shim) | LOW |
| 8 | `shared/directives/permission/has-permission.directive.ts` | Modified | MEDIUM |
| 9 | `core/registry/providers/registry.provider.ts` | Modified | LOW |

---

## No Business Screens Were Created

Per Phase 1 requirements, zero business screens, forms, tables, dialogs, or CRUD pages were built. All changes are pure infrastructure.
