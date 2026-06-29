# iDoo ERP — Architecture Report

**Date:** 2026-06-28  
**Scope:** Frontend Angular application

---

## 1. Current Architecture

```
Bootstrap (main.ts)
    │
    ▼
AppComponent
    │
    ├── APP_INITIALIZER: restoreSession()
    │       └── reads localStorage → restores auth state + workspace context
    │
    ├── Router
    │       ├── /auth/**   (public — AuthLayout)
    │       │       ├── /login       → LoginComponent
    │       │       └── /select-tenant → SelectTenantComponent
    │       │
    │       └── /app/**    (guarded: authGuard + tenantGuard)
    │               └── ShellComponent (sidebar + topbar)
    │                       ├── /dashboard
    │                       ├── /tenants/**
    │                       ├── /companies/**
    │                       ├── /branches/**
    │                       ├── /departments/**
    │                       ├── /users/**
    │                       ├── /roles/**
    │                       └── /permissions/**
    │
    └── HTTP Pipeline (interceptor chain)
            loggingInterceptor
                → errorInterceptor
                    → jwtInterceptor (attaches Bearer token, handles refresh)
                        → contextInterceptor (attaches X-Tenant-ID)
```

### Core Layer Services

```
core/auth/
├── state/
│   ├── AuthStateService       (signal: tokens, user, isAuthenticated)
│   ├── PermissionStateService (signal: effective permissions Set<string>)
│   └── AuthFlowStore         (signal: login step, loading, error)
├── facades/
│   ├── AuthFacade             (login / logout / refresh / restoreSession)
│   └── TenantSelectionFacade  (getAvailableTenants / selectTenant)
├── services/
│   ├── SessionManagerService  (localStorage: tokens + user)
│   └── SelectionTokenStorageService (sessionStorage: selectionToken)
├── guards/
│   ├── authGuard
│   ├── tenantGuard
│   └── permissionGuard
└── interceptors/
    └── jwtInterceptor

core/context/
├── state/     ContextStateService  (signal: tenantId / companyId / branchId)
├── facades/   ContextFacade        (get/set + persist to localStorage)
├── services/  ContextInitializationService (load permissions + set context after login)
└── interceptors/ contextInterceptor

core/api/
├── models/    index.ts             (all DTOs typed from backend Java contracts)
└── generated/ {entity}.api.ts     (one HttpClient wrapper per entity)

core/registry/
├── EntityRegistry, MenuRegistry, RouteRegistry  (foundations for dynamic framework)
├── facades/   RegistryFacade
└── tokens/    MODULE_CONFIG_TOKEN
```

---

## 2. Current Problems

### P-1 — Missing backend endpoints block session management
`POST /v1/auth/refresh` and `POST /v1/auth/logout` are not yet implemented. The frontend handles this gracefully (falls back to logout on 401), but proper token refresh is impossible until the backend ships these endpoints.

### P-2 — Token storage security
`accessToken` is stored in `localStorage`, which is XSS-vulnerable. For a production ERP system the recommended approach is:
- Store `accessToken` in memory (JS variable / signal only)
- Store `refreshToken` in an `httpOnly` `Secure` `SameSite=Strict` cookie (set by the backend)
- On reload, use the cookie-based refresh to get a new access token

This requires backend changes (set-cookie on login/refresh responses).

### P-3 — Permission loading timing
Permissions are loaded after login via `ContextInitializationService`. If the effective-permissions API is slow, there is a brief window where `permissionGuard` would incorrectly deny access. Consider a "permissions loading" gate or a loading state before activating protected routes.

### P-4 — No HTTP caching for read-only, rarely-changing data
`GET /v1/modules` and `GET /v1/permissions` return data that changes only when a backend admin acts. Caching these with an HTTP `Cache-Control` strategy or a simple in-memory TTL cache would reduce unnecessary API calls.

### P-5 — No retry strategy for transient failures
Network hiccups (5xx from gateway, momentary connectivity loss) cause immediate visible errors. A `retry(1)` + exponential backoff for idempotent GET requests would improve UX.

---

## 3. Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Backend refresh endpoint missing | HIGH | Certain | Users re-login every 15 min; report to backend team |
| XSS token theft from localStorage | HIGH | Low | Acceptable for MVP; harden before production launch |
| Permission set empty on fast navigation | MEDIUM | Possible | Add "permissions loaded" gate |
| Future: dynamic registry DI collision | LOW | Low | `MODULE_CONFIG_TOKEN` is multi-provider; safe |

---

## 4. Recommendations

### R-1 — Implement token refresh (backend task)
Backend must implement `POST /v1/auth/refresh` and `POST /v1/auth/logout`. These are documented in the API contract as "Missing APIs" (M1, M2). The frontend interceptor is ready to use them.

### R-2 — Add `/v1/auth/me` endpoint (backend task)
`GET /v1/auth/me` would let the frontend load the current user's profile after restoring tokens from localStorage without having to parse the JWT. Currently the frontend decodes the JWT as a fallback. Documented in API contract as M3.

### R-3 — Migrate to httpOnly cookie for refresh token (future)
When the backend implements secure cookies, update `SessionManagerService` to remove `localStorage` refresh token storage and rely on cookie-based refresh.

### R-4 — Add permissions loading gate
Before activating any `/app/**` route, verify that the permission signal has been populated. This prevents brief incorrect 403 redirects on first navigation after login.

### R-5 — Extract environment configuration
`APP_CONFIG` is currently a hardcoded constant in `app.config.ts`. For production deployments, inject the config from a generated `environment.ts` or a runtime-loaded `config.json` file. This allows deploying the same build to dev/staging/prod by changing only the config.

---

## 5. Enterprise Improvements (Future Phases)

### Dynamic Form Engine
The `dynamic-form` component and `FormSchema` type are scaffolded in `shared/`. The next step is:
- Define `FieldConfig` with type, validation, conditional logic
- Bind to `ReactiveFormsModule`
- Register form schemas in `EntityRegistry` via `formSchemaFactory`

### Dynamic Table Engine
The `dynamic-table` component is scaffolded. Next steps:
- Define `ColumnConfig` with sortable, filterable, format flags
- Integrate paginator with backend `PageResponse`
- Register table configs in `EntityRegistry` via `tableConfigFactory`

### Menu Registry → Dynamic Navigation
`MenuRegistry` is present. Next steps:
- Populate from backend `GET /v1/modules` (active modules)
- Filter by user permissions
- Drive `SidebarComponent` from the registry instead of static config

### Route Registry → Dynamic Routes
`RouteRegistry` is present. Next steps:
- Register feature routes programmatically from `EntityConfig`
- Enable lazy-loading of ERP modules via the registry

---

## 6. Architecture Diagram — Final State After Fixes

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Angular Application                          │
│                                                                     │
│  APP_INITIALIZER ──► AuthFacade.restoreSession()                   │
│                              │                                      │
│                              ▼                                      │
│             ┌────────────────────────────────┐                     │
│             │         Auth State (Signal)     │                     │
│             │  accessToken · user · isAuthed  │                     │
│             └────────────────────────────────┘                     │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                 HTTP Interceptor Chain                        │  │
│  │  logging → error → jwt (Bearer) → context (X-Tenant-ID)     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│  ┌─────────────┐   ┌─────────────────┐   ┌──────────────────────┐ │
│  │ Auth Routes │   │  Shell + Guards  │   │  Feature Routes      │ │
│  │ /auth/login │   │  authGuard       │   │  /app/tenants        │ │
│  │ /auth/select│   │  tenantGuard     │   │  /app/users          │ │
│  │ -tenant     │   │  permissionGuard │   │  /app/roles  ...     │ │
│  └─────────────┘   └─────────────────┘   └──────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Core API Layer                             │  │
│  │  AuthApi · TenantApi · CompanyApi · BranchApi                │  │
│  │  DepartmentApi · UserApi · RoleApi · PermissionApi           │  │
│  │                 http://localhost:8080/api/v1/...              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```
