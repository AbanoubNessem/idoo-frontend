# iDoo ERP — API Mismatch Report

**Date:** 2026-06-28  
**Source of truth:** `docs/API_CONTRACT.md`

Every mismatch between the frontend implementation and the Backend API Contract is listed below.

---

## CRITICAL Mismatches (would cause runtime failures)

---

### M-C-1 — Base URL missing `/api` prefix on all non-auth API clients

**Affected files:**
- `src/app/core/api/generated/tenant.api.ts`
- `src/app/core/api/generated/user.api.ts`
- `src/app/core/api/generated/role.api.ts`
- `src/app/core/api/generated/permission.api.ts`
- `src/app/core/api/generated/company.api.ts`
- `src/app/core/api/generated/branch.api.ts`
- `src/app/core/api/generated/department.api.ts`
- `src/app/core/api/generated/module.api.ts`

**Contract:** Base URL = `http://localhost:8080/api`, every route is `/v1/{resource}`  
**Before:** `apiUrl = 'http://localhost:8080'` → clients built `http://localhost:8080/v1/tenants` ❌  
**After:** `apiUrl = 'http://localhost:8080/api'` → clients build `http://localhost:8080/api/v1/tenants` ✅  
**Status:** ✅ FIXED

---

### M-C-2 — Wrong effective permissions endpoint called at login

**Affected file:** `src/app/core/context/services/context-initialization.service.ts`

**Contract:** Load user permissions from `GET /v1/users/{id}/permissions/effective`  
**Before:** Called `userApi.getEffectivePermissions(user.id)` → mapped to `GET /v1/users/{id}/permissions` (returns DIRECT permissions, not the merged effective set)  
**After:** Calls `userApi.getEffectivePermissionsByUser(user.id)` → `GET /v1/users/{id}/permissions/effective` ✅  
**Impact:** User would have empty/wrong permissions after login — all permission guards would fail incorrectly  
**Status:** ✅ FIXED

---

### M-C-3 — `UserStatus` enum mismatch

**Affected file:** `src/app/core/api/models/index.ts`

| Value | Frontend (before) | Backend contract |
|---|---|---|
| Suspended user | `LOCKED` | `SUSPENDED` |
| Unverified user | `PENDING` | `PENDING_VERIFICATION` |

**Impact:** Filter queries `GET /v1/users?status=LOCKED` would return 0 results (backend doesn't know `LOCKED`). Status badge display incorrect.  
**Status:** ✅ FIXED — corrected to `'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION'`

---

### M-C-4 — `PermissionAction` enum missing values

**Affected file:** `src/app/core/api/models/index.ts`

**Missing values:** `REJECT`, `ASSIGN`, `REVOKE`  
**Before:** `'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'APPROVE'`  
**After:** Includes all 10 backend values  
**Impact:** Permission filter queries with `action=ASSIGN` would fail TypeScript type checking; permission codes containing `ASSIGN`/`REVOKE`/`REJECT` would not match type  
**Status:** ✅ FIXED

---

## HIGH Mismatches (missing required fields in request DTOs)

---

### M-H-1 — `CreateBranchRequest` missing required fields

**Affected file:** `src/app/core/api/models/index.ts`

**Before:** `{ companyId, code, name, address?, phone?, email? }`  
**After:** Added `isActive: boolean` (required by `@NotNull`) and `isMain: boolean` (required by `@NotNull`)  
**Impact:** `POST /v1/branches` would receive 400 validation error from backend  
**Status:** ✅ FIXED

---

### M-H-2 — `CreateDepartmentRequest` missing required field

**Before:** `{ companyId, branchId, parentId?, code, name, description? }`  
**After:** Added `isActive: boolean` (required by `@NotNull`)  
**Impact:** `POST /v1/departments` would receive 400 validation error  
**Status:** ✅ FIXED

---

### M-H-3 — `RoleRequest` missing required field

**Before:** `{ code, name, description? }`  
**After:** Added `isActive: boolean` (required by `@NotNull`)  
**Impact:** `POST /v1/roles` would receive 400 validation error  
**Status:** ✅ FIXED

---

### M-H-4 — `UserRequest` missing required field `password`

**Before:** `{ companyId, username, email, phone?, firstName, lastName, languageCode?, timezone? }`  
**After:** Added `password: string` (required by `@NotBlank`, `@Size(min=8)`)  
**Impact:** `POST /v1/users` would receive 400 validation error — user creation impossible  
**Status:** ✅ FIXED

---

### M-H-5 — `CreateTenantRequest` missing required and optional fields

**Before:** `{ code, name, domain, maxUsers?, subscriptionPlan? }`  
**Contract requires also:** `isActive: boolean` (required — `@NotNull`), `logoUrl?`, `subscriptionExpiresAt?`, `settings?`  
**After:** Full contract-aligned interface  
**Impact:** `POST /v1/tenants` would receive 400 validation error for `isActive`  
**Status:** ✅ FIXED

---

## MEDIUM Mismatches (incorrect behaviour)

---

### M-M-1 — Context interceptor injected headers into public auth endpoints

**Affected file:** `src/app/core/context/interceptors/context.interceptor.ts`

**Before:** Every request received `X-Tenant-ID` header if context was set, including `POST /v1/auth/login` and `POST /v1/auth/select-tenant`  
**After:** Skip header injection for all `/v1/auth/` requests  
**Impact:** Low (header is ignored by auth endpoints), but violates contract and could confuse debugging  
**Status:** ✅ FIXED

---

### M-M-2 — `ApiResponse.errors` shape wrong

**Affected file:** `src/app/core/api/models/index.ts`

**Before:**
```typescript
errors?: Record<string, string[]>;  // array of strings per field
```

**Contract response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "fieldErrors": { "email": "Must be a valid email address." }
  }
}
```

**After:**
```typescript
error?: { code: string; message: string; fieldErrors?: Record<string, string>; }
```

**Impact:** Field error parsing code would produce wrong results (accessing non-existent `errors` key)  
**Status:** ✅ FIXED

---

### M-M-3 — `LoginResponseData` missing `tenant` field

**Affected file:** `src/app/core/api/models/index.ts`

**Contract:** Case A login response includes `tenant: TenantResponse` in the data  
**Before:** `LoginResponseData` had no `tenant` field; the object was cast to `TokenResponse` which had `tenant?: any`  
**After:** `LoginResponseData.tenant?: TenantInfo` and `TokenResponse.tenant?: TenantInfo` (typed)  
**Impact:** Tenant info from Case A login was discarded; context had to rely solely on `user.tenantId` from JWT decode  
**Status:** ✅ FIXED (type is now correct; context initialization uses the value)

---

### M-M-4 — No global HTTP error interceptor

**Before:** No interceptor handled 403, 409, 422, 500 globally. Each API call needed its own catchError.  
**After:** `errorInterceptor` (new) handles all error codes with structured logging and 403 redirect  
**Status:** ✅ FIXED

---

### M-M-5 — Session not restored on app initialization

**Before:** `AuthFacade.restoreSession()` existed but was never called on startup. Page reload on `/app/dashboard` would redirect to login even with valid tokens in `localStorage`.  
**After:** `APP_INITIALIZER` calls `restoreSession()` before any route activates  
**Status:** ✅ FIXED

---

### M-M-6 — `HasPermissionDirective` did not react to permission signal changes

**Before:** `ngOnInit()` called `updateView()` once. If permissions loaded after directive init, the view was never updated.  
**After:** Uses `effect()` to subscribe to `permissionState.permissions()` signal — re-evaluates on every permission update  
**Status:** ✅ FIXED

---

### M-M-7 — `provideRegistry()` crashed if `MODULE_CONFIG_TOKEN` not provided

**Before:** `deps: [RegistryFacade, MODULE_CONFIG_TOKEN]` — Angular would throw DI error if nothing provided the token.  
**After:** Provides an empty default, uses `Optional` — no crash when no module configs are registered yet  
**Status:** ✅ FIXED

---

## LOW Mismatches (code quality / maintainability)

---

### M-L-1 — Duplicate token storage services with different localStorage keys

**`TokenStorageService`** (keys: `idoo_access_token`, `idoo_refresh_token`, `idoo_user_data`)  
**`SessionManagerService`** (keys: `auth_access_token`, `auth_refresh_token`, `auth_user`)

Both `providedIn: 'root'`. Legacy `AuthService` used `TokenStorageService`; `AuthFacade` used `SessionManagerService`.  
**Action:** `AuthService` replaced with a re-export shim pointing to `AuthFacade`. `TokenStorageService` is now dead code — safe to delete after verifying no feature imports it.  
**Status:** ✅ MITIGATED

---

### M-L-2 — `console.log` / `console.group` calls in guards

**Files:** `auth.guard.ts`, `tenant.guard.ts`  
**Issue:** Raw console calls instead of `LoggerService`. Will log in production.  
**Recommendation:** Replace with `LoggerService.guard()` calls  
**Status:** ⚠️ NOT FIXED (deferred — low risk)

---

### M-L-3 — `loggingInterceptor` runs in production

**File:** `src/app/core/interceptors/logging.interceptor.ts`  
**Issue:** Logs every HTTP request/response to console even in production builds  
**Recommendation:** Wrap logic with `isDevMode()` check  
**Status:** ⚠️ NOT FIXED (deferred)

---

## Missing Backend APIs (frontend cannot fix — must report)

| # | Endpoint | Status | Impact |
|---|---|---|---|
| M1 | `POST /v1/auth/refresh` | ❌ Not implemented | Sessions expire after 15 min; user must re-login |
| M2 | `POST /v1/auth/logout` | ❌ Not implemented | Refresh tokens cannot be revoked server-side |
| M3 | `GET /v1/auth/me` | ❌ Not implemented | Frontend must parse JWT to get user ID on restore |

**These are backend tasks. Frontend handles them gracefully (logout on refresh failure, JWT decode as fallback).**
