# iDoo ERP — Backend API Contract

**Version:** 1.0  
**Generated from:** Source code inspection  
**Audience:** Frontend / Integration team  
**Status:** Living document — synchronized with codebase

---

## Critical: Base URL

```
http://localhost:8080/api
```

> The server is deployed with context-path `/api` (configured in `application.yml`).  
> Every URL in this document is **relative to that base**.  
> Angular `HttpClient` base URL must be `http://localhost:8080/api` (or the production equivalent).  
> Calling `/v1/tenants` directly without the `/api` prefix will receive a 404 with **no CORS headers**, causing the browser to report a CORS error.

---

## Table of Contents

1. [API Conventions](#api-conventions)
2. [Authentication Flow](#authentication-flow)
3. [Multi-Tenant Model](#multi-tenant-model)
4. [Standard Response Envelope](#standard-response-envelope)
5. [Error Response Standard](#error-response-standard)
6. [Pagination Standard](#pagination-standard)
7. [Authorization Model](#authorization-model)
8. [Module: Authentication](#module-authentication)
9. [Module: Tenants](#module-tenants)
10. [Module: Companies](#module-companies)
11. [Module: Branches](#module-branches)
12. [Module: Departments](#module-departments)
13. [Module: Users](#module-users)
14. [Module: Roles](#module-roles)
15. [Module: Permissions](#module-permissions)
16. [Module: Modules](#module-modules)
17. [Module: User–Role Assignment](#module-userrole-assignment)
18. [Module: Role–Permission Assignment](#module-rolepermission-assignment)
19. [Module: User Direct Permissions](#module-user-direct-permissions)
20. [Module: User–Branch Assignment](#module-userbranch-assignment)
21. [DTO Reference](#dto-reference)
22. [Enum Reference](#enum-reference)
23. [Frontend Integration Guide](#frontend-integration-guide)
24. [Dependency Graph](#dependency-graph)
25. [API Checklist](#api-checklist)
26. [Missing APIs](#missing-apis)

---

## API Conventions

| Convention | Value |
|---|---|
| Base URL | `http://localhost:8080/api` |
| API Version | `/v1/` prefix on every route |
| Date format | ISO-8601 UTC string: `"2025-06-26T12:00:00Z"` |
| UUID format | Standard UUID v4: `"550e8400-e29b-41d4-a716-446655440000"` |
| Boolean format | JSON `true` / `false` (lowercase) |
| Timezone | All dates are UTC (`Instant` on the server) |
| Content-Type | `application/json` for all request bodies |
| Character encoding | UTF-8 |
| Null fields | Fields with `null` value are **omitted** from the response (`@JsonInclude(NON_NULL)`) |
| Naming | `camelCase` for all JSON fields |
| HTTP verbs | GET (read), POST (create), PUT (full update), PATCH (partial/action), DELETE (delete) |
| Currency | 3-letter ISO-4217 code, e.g. `"USD"`, `"EGP"` |
| Country | 2-letter ISO-3166-1 alpha-2 code, e.g. `"US"`, `"EG"` |

---

## Authentication Flow

### Complete Login Sequence

```
Angular App
    │
    ├─ POST /api/v1/auth/login  { email, password }
    │
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ Case A: User has exactly 1 tenant (non-super-admin)         │
    │  │  Response: { requiresTenantSelection: false,                │
    │  │              accessToken, refreshToken, user, tenant }      │
    │  │  → Skip steps 2 & 3. Store tokens. Done.                   │
    │  └─────────────────────────────────────────────────────────────┘
    │
    │  ┌─────────────────────────────────────────────────────────────┐
    │  │ Case B: User is SUPER_ADMIN or has multiple tenants         │
    │  │  Response: { requiresTenantSelection: true,                 │
    │  │              selectionToken }                               │
    │  └─────────────────────────────────────────────────────────────┘
    │
    ├─ GET /api/v1/auth/available-tenants
    │       Authorization: Bearer {selectionToken}
    │  Response: [{ id, code, name }, ...]
    │
    ├─ User selects a tenant in the UI
    │
    ├─ POST /api/v1/auth/select-tenant
    │       { selectionToken, tenantId }
    │  Response: { success, accessToken, refreshToken, user, tenant }
    │
    ├─ Store accessToken + refreshToken
    │
    └─ All subsequent requests:
           Authorization: Bearer {accessToken}
           X-Tenant-ID: {tenantId}   ← required for all non-auth calls
```

### Token Types

| Token | Lifetime | Purpose | How to send |
|---|---|---|---|
| `selectionToken` | 5 minutes | Identify user during tenant selection step | `Authorization: Bearer {selectionToken}` |
| `accessToken` | 15 minutes | Authenticate API calls | `Authorization: Bearer {accessToken}` |
| `refreshToken` | 7 days | Obtain a new access token | POST body of refresh endpoint |

> **Warning:** The `selectionToken` is NOT an access token. Sending it to protected endpoints will result in a 401.

---

## Multi-Tenant Model

The backend uses a multi-tenant architecture.

### How Frontend Must Send Context

Every API call to a **protected endpoint** (any endpoint outside `/v1/auth/**`) must include:

```http
Authorization: Bearer {accessToken}
X-Tenant-ID: {tenantId}
```

| Header | Required | Description |
|---|---|---|
| `Authorization` | Yes | `Bearer {accessToken}` |
| `X-Tenant-ID` | Yes (for tenant-scoped data) | UUID of the active tenant. Obtained from `selectTenant` response. |
| `Content-Type` | Yes (for POST/PUT/PATCH) | `application/json` |

### Hierarchy

```
Tenant           (top-level SaaS client — managed only by SUPER_ADMIN)
  └─ Company     (legal entity within a tenant)
       └─ Branch (physical or logical branch of a company)
            └─ Department (organizational unit)
```

Users belong to a `Company`. Users can be assigned to multiple `Branches`.

---

## Standard Response Envelope

**Every** API response (success or error) is wrapped in the same envelope:

### Success Response

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "timestamp": "2025-06-26T12:00:00Z"
}
```

### Paginated Success Response

When the endpoint returns a page, the `data` field contains a Spring Page object:

```json
{
  "success": true,
  "data": {
    "content": [ { ... }, { ... } ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": { "sorted": true, "orders": [{ "property": "createdAt", "direction": "DESC" }] }
    },
    "totalElements": 42,
    "totalPages": 3,
    "last": false,
    "first": true,
    "numberOfElements": 20,
    "size": 20,
    "number": 0,
    "empty": false
  },
  "timestamp": "2025-06-26T12:00:00Z"
}
```

### No-Content Success Response (DELETE / action endpoints)

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "timestamp": "2025-06-26T12:00:00Z"
}
```

---

## Error Response Standard

```json
{
  "success": false,
  "message": "Human-readable description",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "fieldErrors": {
      "email": "Must be a valid email address.",
      "password": "Password is required."
    }
  },
  "timestamp": "2025-06-26T12:00:00Z"
}
```

> `fieldErrors` is only present on validation errors (HTTP 400). It is omitted on all other errors.

### Error Codes Reference

| HTTP Status | Error Code | Trigger |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body fails `@Valid` annotation validation |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT token |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 401 | `ACCOUNT_LOCKED` | Too many failed login attempts |
| 401 | `INVALID_TENANT` | Tenant not found or not assigned |
| 403 | `FORBIDDEN` | Authenticated but lacks required role/permission |
| 403 | `ACCESS_DENIED` | Method-level `@PreAuthorize` check failed |
| 404 | `RESOURCE_NOT_FOUND` | Entity not found in database |
| 409 | `DUPLICATE_RESOURCE` | Unique constraint violation |
| 422 | _(business code)_ | Business rule violation (varies by endpoint) |
| 500 | `INTERNAL_ERROR` | Unhandled server exception |

---

## Pagination Standard

Paginated endpoints accept the following query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | Integer | `0` | Zero-based page index |
| `size` | Integer | `20` | Items per page |
| `sort` | String | `createdAt,desc` | Field name and direction, e.g. `name,asc` or `createdAt,desc` |

**Example:**

```
GET /api/v1/tenants?page=0&size=10&sort=createdAt,desc
GET /api/v1/users?page=1&size=20&sort=firstName,asc
```

Multiple sort fields:

```
GET /api/v1/users?sort=lastName,asc&sort=createdAt,desc
```

---

## Authorization Model

### Roles

| Role | Scope | Description |
|---|---|---|
| `SUPER_ADMIN` | Platform-wide | Full access to everything. Manages tenants. |
| `TENANT_ADMIN` | Tenant-wide | Manages companies, users, roles within a tenant. |
| `COMPANY_ADMIN` | Company-wide | Manages branches, departments within a company. |
| _(custom roles)_ | Configurable | Created via the Roles API with specific permission codes. |

> Roles are stored as `ROLE_{code}` internally (e.g. Spring Security grants `ROLE_SUPER_ADMIN`).

### Permission Code Format

```
{MODULE_CODE}:{resource}:{action}
```

Examples:
- `CORE:companies:read`
- `CORE:branches:manage`
- `AUTH:users:manage`
- `AUTH:permissions:assign`

### Permission Actions (Enum: `PermissionAction`)

`CREATE` | `READ` | `UPDATE` | `DELETE` | `EXPORT` | `IMPORT` | `APPROVE` | `REJECT` | `ASSIGN` | `REVOKE`

### Authorization Rules per Module

| Controller | Minimum Access |
|---|---|
| Tenants | `SUPER_ADMIN` only |
| Companies | `SUPER_ADMIN` OR `TENANT_ADMIN` OR `CORE:companies:manage` |
| Branches | `SUPER_ADMIN` OR `COMPANY_ADMIN` OR `CORE:branches:manage` |
| Departments | `SUPER_ADMIN` OR `COMPANY_ADMIN` OR `CORE:departments:manage` |
| Users | `SUPER_ADMIN` OR `TENANT_ADMIN` OR `AUTH:users:manage` |
| Roles | `SUPER_ADMIN` OR `TENANT_ADMIN` OR `AUTH:roles:manage` |
| Permissions | `SUPER_ADMIN` OR `TENANT_ADMIN` OR `AUTH:permissions:read` |
| Modules | `SUPER_ADMIN` only |

---

## Module: Authentication

Base path: `/api/v1/auth`

---

### 1. Login

**POST /api/v1/auth/login**

#### Description

Authenticates the user with email and password. Returns either:
- Immediate access/refresh tokens (single-tenant users), OR
- A short-lived `selectionToken` requiring the user to pick a tenant (SUPER_ADMIN or multi-tenant users).

#### Authentication

Public — no token required.

#### Headers

```http
Content-Type: application/json
```

#### Request Body

```json
{
  "email": "admin@example.com",
  "password": "SecureP@ss123"
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `email` | String | Yes | `@Email`, `@NotBlank` | User's email address |
| `password` | String | Yes | `@NotBlank` | User's password |

#### Validation Rules

- `email`: Must not be blank. Must be a valid email format (`@Email`).
- `password`: Must not be blank.

#### Response — Case A: Single tenant (immediate login)

HTTP 200

```json
{
  "success": true,
  "data": {
    "success": true,
    "requiresTenantSelection": false,
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "user": { ... },
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "ACME",
      "name": "ACME Corp",
      "domain": "acme.example.com",
      "logoUrl": "https://cdn.example.com/logo.png",
      "isActive": true,
      "maxUsers": 100,
      "subscriptionPlan": "ENTERPRISE",
      "subscriptionExpiresAt": "2026-12-31T23:59:59Z",
      "settings": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-06-01T00:00:00Z"
    }
  },
  "timestamp": "2025-06-26T12:00:00Z"
}
```

#### Response — Case B: Requires tenant selection

HTTP 200

```json
{
  "success": true,
  "data": {
    "success": true,
    "requiresTenantSelection": true,
    "selectionToken": "eyJhbGciOiJIUzI1NiJ9..."
  },
  "timestamp": "2025-06-26T12:00:00Z"
}
```

#### Error Status Codes

| Code | Error | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or invalid email/password field |
| 401 | `INVALID_CREDENTIALS` | Email not found or password incorrect |
| 401 | `ACCOUNT_LOCKED` | Account locked after too many failed attempts |
| 422 | `NO_TENANT_ASSIGNED` | User exists but has no active tenant assignments |

#### Business Rules

- Failed login attempts increment the `failedLoginAttempts` counter on the user.
- After 5 failed attempts the account is locked for 30 minutes.
- A successful login resets the `lastLoginAt` timestamp and clears the failed attempt counter.
- Soft-deleted users (`deletedAt IS NOT NULL`) cannot log in.
- Inactive users (`status != ACTIVE`) cannot log in.

#### Frontend Notes

- Always check `requiresTenantSelection` before deciding where to redirect.
- Store the `selectionToken` in memory (NOT localStorage). It expires in 5 minutes.
- If `requiresTenantSelection` is false, store `accessToken` and `refreshToken` and proceed to the main app.
- Never retry login in a tight loop — add a delay after errors.

---

### 2. Get Available Tenants

**GET /api/v1/auth/available-tenants**

#### Description

Returns all tenants the authenticated user is assigned to. Called during the tenant selection step after login.

#### Authentication

Requires `selectionToken` (Bearer).

#### Headers

```http
Authorization: Bearer {selectionToken}
```

#### Response

HTTP 200

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "ACME",
      "name": "ACME Corp"
    },
    {
      "id": "661f9511-f3c0-52e5-b827-557766551111",
      "code": "BETA",
      "name": "Beta Industries"
    }
  ],
  "timestamp": "2025-06-26T12:00:00Z"
}
```

#### Error Status Codes

| Code | Error | When |
|---|---|---|
| 400 | — | Missing `Authorization` header |
| 401 | `UNAUTHORIZED` | Token missing, expired, or invalid type |

#### Frontend Notes

- SUPER_ADMIN sees all tenants in the system, not just assigned ones.
- Present this list as a dropdown/list for the user to choose from.
- Pass the chosen tenant's `id` to `/select-tenant`.

---

### 3. Select Tenant

**POST /api/v1/auth/select-tenant**

#### Description

Exchanges a `selectionToken` + a chosen `tenantId` for a full `accessToken` and `refreshToken`. This is the final step of the login flow for multi-tenant users.

#### Authentication

Public — the `selectionToken` is sent in the request body.

#### Headers

```http
Content-Type: application/json
```

#### Request Body

```json
{
  "selectionToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `selectionToken` | String | Yes | `@NotBlank` | Short-lived token from `/login` response |
| `tenantId` | UUID | Yes | `@NotNull` | UUID of the chosen tenant |

#### Response

HTTP 200

```json
{
  "success": true,
  "data": {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "user": { ... },
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "ACME",
      "name": "ACME Corp",
      "domain": "acme.example.com",
      "logoUrl": "https://cdn.example.com/logo.png",
      "isActive": true,
      "maxUsers": 100,
      "subscriptionPlan": "ENTERPRISE",
      "subscriptionExpiresAt": "2026-12-31T23:59:59Z",
      "settings": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-06-01T00:00:00Z"
    }
  },
  "timestamp": "2025-06-26T12:00:00Z"
}
```

#### Error Status Codes

| Code | Error | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing selectionToken or tenantId |
| 401 | `INVALID_TENANT` | selectionToken invalid/expired or tenantId not found |

#### Business Rules

- `selectionToken` must be a valid JWT of type `tenant-selection` (not an access token).
- The selected tenant must be active.
- For SUPER_ADMIN, any tenant can be selected.
- For regular users, the tenant must be in their assignment list.

#### Frontend Notes

- After receiving `accessToken` and `refreshToken`:
  - Store `accessToken` in memory (Redux/service).
  - Store `refreshToken` in a secure `httpOnly` cookie if possible; or in `localStorage` as a compromise.
  - Store the `tenantId` for inclusion in the `X-Tenant-ID` header on every subsequent call.
- Discard the `selectionToken` immediately after this call.

---

## Module: Tenants

Base path: `/api/v1/tenants`

**Authorization:** `SUPER_ADMIN` role required for all endpoints.

---

### 4. Create Tenant

**POST /api/v1/tenants**

#### Description

Creates a new top-level tenant (SaaS customer).

#### Authentication

JWT Required.

#### Authorization

Role: `SUPER_ADMIN`

#### Headers

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

#### Request Body

```json
{
  "code": "ACME",
  "name": "ACME Corporation",
  "domain": "acme.example.com",
  "logoUrl": "https://cdn.example.com/logo.png",
  "isActive": true,
  "maxUsers": 500,
  "subscriptionPlan": "ENTERPRISE",
  "subscriptionExpiresAt": "2026-12-31T23:59:59Z",
  "settings": null
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `code` | String | Yes | `@NotBlank`, `@Pattern(^[A-Z0-9_]+$)`, `@Size(max=50)` | Unique uppercase identifier |
| `name` | String | Yes | `@NotBlank`, `@Size(max=255)` | Display name |
| `domain` | String | No | `@Size(max=255)` | Custom domain |
| `logoUrl` | String | No | `@Size(max=500)` | Logo URL |
| `isActive` | Boolean | Yes | `@NotNull` | Whether tenant is active |
| `maxUsers` | Integer | No | `@Positive` | Max allowed users |
| `subscriptionPlan` | String | No | `@Size(max=100)` | Plan name |
| `subscriptionExpiresAt` | ISO-8601 | No | — | Expiry date |
| `settings` | String | No | — | JSON settings blob |

#### Response

HTTP 201

```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "ACME",
    "name": "ACME Corporation",
    "domain": "acme.example.com",
    "logoUrl": "https://cdn.example.com/logo.png",
    "isActive": true,
    "maxUsers": 500,
    "subscriptionPlan": "ENTERPRISE",
    "subscriptionExpiresAt": "2026-12-31T23:59:59Z",
    "settings": null,
    "createdAt": "2025-06-26T12:00:00Z",
    "updatedAt": "2025-06-26T12:00:00Z"
  },
  "timestamp": "2025-06-26T12:00:00Z"
}
```

#### Error Status Codes

| Code | When |
|---|---|
| 400 | Validation failure |
| 401 | Missing/invalid token |
| 403 | Not SUPER_ADMIN |
| 409 | Tenant code already exists |

---

### 5. List Tenants

**GET /api/v1/tenants**

#### Description

Returns a paginated list of all tenants with optional filtering.

#### Authentication

JWT Required.

#### Authorization

Role: `SUPER_ADMIN`

#### Headers

```http
Authorization: Bearer {accessToken}
```

#### Query Parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | String | No | — | Filter by name (partial match) |
| `status` | Boolean | No | — | Filter by active status |
| `page` | Integer | No | `0` | Page number (0-based) |
| `size` | Integer | No | `20` | Page size |
| `sort` | String | No | `createdAt,desc` | Sort field and direction |

#### Response

HTTP 200 — paginated (see Pagination Standard).

#### Example Request

```http
GET /api/v1/tenants?page=0&size=10&sort=createdAt,desc
Authorization: Bearer {accessToken}
```

---

### 6. Get Tenant by ID

**GET /api/v1/tenants/{id}**

#### Path Variables

| Name | Type | Description |
|---|---|---|
| `id` | UUID | Tenant UUID |

#### Response

HTTP 200 — single `TenantResponse` object.

---

### 7. Update Tenant

**PUT /api/v1/tenants/{id}**

#### Description

Full update of a tenant. All fields are optional (partial updates accepted).

#### Request Body

Same fields as Create, all optional.

#### Response

HTTP 200 — updated `TenantResponse`.

---

### 8. Activate Tenant

**PATCH /api/v1/tenants/{id}/activate**

Sets `isActive = true`.

#### Response

HTTP 200 — `{ "success": true, "message": "Tenant activated successfully" }`

---

### 9. Deactivate Tenant

**PATCH /api/v1/tenants/{id}/deactivate**

Sets `isActive = false`.

#### Response

HTTP 200 — `{ "success": true, "message": "Tenant deactivated successfully" }`

---

### 10. Delete Tenant

**DELETE /api/v1/tenants/{id}**

#### Response

HTTP 200 — no-content success envelope.

---

## Module: Companies

Base path: `/api/v1/companies`

**Authorization:** `SUPER_ADMIN` OR `TENANT_ADMIN` OR permission `CORE:companies:manage`

---

### 11. Create Company

**POST /api/v1/companies**

#### Request Body

```json
{
  "code": "ACME_EG",
  "name": "ACME Egypt",
  "legalName": "ACME Egypt LLC",
  "taxNumber": "123456789",
  "registrationNumber": "REG-2024-001",
  "countryCode": "EG",
  "currencyCode": "EGP",
  "phone": "+20-100-000-0000",
  "email": "info@acme.eg",
  "address": "123 Nile St, Cairo",
  "logoUrl": "https://cdn.example.com/acme-eg.png",
  "isActive": true,
  "settings": null
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `code` | String | Yes | `@NotBlank`, `^[A-Z0-9_]+$`, `max=50` | Unique uppercase code |
| `name` | String | Yes | `@NotBlank`, `max=255` | Company display name |
| `legalName` | String | No | `max=255` | Official legal name |
| `taxNumber` | String | No | `max=100` | Tax registration number |
| `registrationNumber` | String | No | `max=100` | Commercial registration |
| `countryCode` | String | No | `^[A-Z]{2}$` | ISO-3166-1 alpha-2 |
| `currencyCode` | String | No | `^[A-Z]{3}$` | ISO-4217 currency code |
| `phone` | String | No | `max=50` | Phone number |
| `email` | String | No | `@Email`, `max=255` | Company email |
| `address` | String | No | — | Free-text address |
| `logoUrl` | String | No | `max=500` | Logo URL |
| `isActive` | Boolean | Yes | `@NotNull` | Active status |
| `settings` | String | No | — | JSON settings blob |

#### Response

HTTP 201 — `CompanyResponse`.

---

### 12. List Companies

**GET /api/v1/companies**

Read permission: `CORE:companies:read` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Query Parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | String | No | — | Filter by name |
| `status` | Boolean | No | — | Filter by active status |
| `page` | Integer | No | `0` | — |
| `size` | Integer | No | `20` | — |
| `sort` | String | No | `createdAt,desc` | — |

#### Response

HTTP 200 — paginated list of `CompanyResponse`.

---

### 13. Get Company by ID

**GET /api/v1/companies/{id}**

#### Response

HTTP 200 — single `CompanyResponse`.

---

### 14. Update Company

**PUT /api/v1/companies/{id}**

All fields optional. Same shape as Create.

#### Response

HTTP 200 — updated `CompanyResponse`.

---

### 15. Activate Company

**PATCH /api/v1/companies/{id}/activate**

#### Response

HTTP 200 — success message.

---

### 16. Deactivate Company

**PATCH /api/v1/companies/{id}/deactivate**

#### Response

HTTP 200 — success message.

---

### 17. Delete Company

**DELETE /api/v1/companies/{id}**

#### Response

HTTP 200 — no-content success envelope.

---

## Module: Branches

Base path: `/api/v1/branches`

**Authorization:** `SUPER_ADMIN` OR `COMPANY_ADMIN` OR `CORE:branches:manage`

---

### 18. Create Branch

**POST /api/v1/branches**

#### Request Body

```json
{
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "CAIRO_HQ",
  "name": "Cairo Headquarters",
  "address": "1 Tahrir Square, Cairo",
  "phone": "+20-100-111-2222",
  "email": "cairo@acme.eg",
  "isActive": true,
  "isMain": true,
  "settings": null
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `companyId` | UUID | Yes | `@NotNull` | Parent company |
| `code` | String | Yes | `@NotBlank`, `^[A-Z0-9_]+$`, `max=50` | Unique uppercase code |
| `name` | String | Yes | `@NotBlank`, `max=255` | Branch name |
| `address` | String | No | — | Physical address |
| `phone` | String | No | `max=50` | Contact number |
| `email` | String | No | `@Email`, `max=255` | Contact email |
| `isActive` | Boolean | Yes | `@NotNull` | Active status |
| `isMain` | Boolean | Yes | `@NotNull` | Whether this is the main branch |
| `settings` | String | No | — | JSON settings blob |

#### Response

HTTP 201 — `BranchResponse`.

---

### 19. List Branches

**GET /api/v1/branches**

Read permission: `CORE:branches:read` OR `COMPANY_ADMIN` OR `SUPER_ADMIN`

#### Query Parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `companyId` | UUID | No | — | Filter by company |
| `status` | Boolean | No | — | Filter by active status |
| `page` | Integer | No | `0` | — |
| `size` | Integer | No | `20` | — |
| `sort` | String | No | `createdAt,desc` | — |

#### Response

HTTP 200 — paginated `BranchResponse`.

---

### 20. Get Branch by ID

**GET /api/v1/branches/{id}**

#### Response

HTTP 200 — single `BranchResponse`.

---

### 21. Update Branch

**PUT /api/v1/branches/{id}**

All fields optional.

#### Response

HTTP 200 — updated `BranchResponse`.

---

### 22. Delete Branch

**DELETE /api/v1/branches/{id}**

#### Response

HTTP 200 — no-content success.

---

### 23. Set Main Branch

**PATCH /api/v1/branches/{id}/set-main**

Designates this branch as the main branch for its company.

#### Response

HTTP 200 — success message.

---

## Module: Departments

Base path: `/api/v1/departments`

**Authorization:** `SUPER_ADMIN` OR `COMPANY_ADMIN` OR `CORE:departments:manage`

---

### 24. Create Department

**POST /api/v1/departments**

#### Request Body

```json
{
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "branchId": "661f9511-f3c0-52e5-b827-557766551111",
  "parentId": null,
  "code": "FINANCE",
  "name": "Finance Department",
  "description": "Handles all financial operations",
  "isActive": true
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `companyId` | UUID | Yes | `@NotNull` | Parent company |
| `branchId` | UUID | No | — | Optional branch scope |
| `parentId` | UUID | No | — | Parent department (for hierarchy) |
| `code` | String | Yes | `@NotBlank`, `^[A-Z0-9_]+$`, `max=50` | Unique code |
| `name` | String | Yes | `@NotBlank`, `max=255` | Department name |
| `description` | String | No | — | Description |
| `isActive` | Boolean | Yes | `@NotNull` | Active status |

#### Response

HTTP 201 — `DepartmentResponse`.

---

### 25. List Departments

**GET /api/v1/departments**

Read permission: `CORE:departments:read` OR `COMPANY_ADMIN` OR `SUPER_ADMIN`

#### Query Parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `companyId` | UUID | No | — | Filter by company |
| `branchId` | UUID | No | — | Filter by branch |
| `page` | Integer | No | `0` | — |
| `size` | Integer | No | `20` | — |
| `sort` | String | No | `createdAt,desc` | — |

#### Response

HTTP 200 — paginated `DepartmentResponse`.

---

### 26. Get Department by ID

**GET /api/v1/departments/{id}**

#### Response

HTTP 200 — single `DepartmentResponse`.

---

### 27. Get Department Children

**GET /api/v1/departments/{id}/children**

Returns the immediate children of a department.

#### Response

HTTP 200

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "companyId": "...",
      "branchId": "...",
      "parentId": "{id}",
      "code": "FINANCE_AP",
      "name": "Accounts Payable",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "timestamp": "2025-06-26T12:00:00Z"
}
```

---

### 28. Get Department Tree

**GET /api/v1/departments/tree**

Returns a full recursive tree structure for a company.

#### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `companyId` | UUID | Yes | Company to load tree for |

#### Response

HTTP 200

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "code": "FINANCE",
      "name": "Finance",
      "isActive": true,
      "children": [
        {
          "id": "...",
          "code": "FINANCE_AP",
          "name": "Accounts Payable",
          "isActive": true,
          "children": []
        }
      ]
    }
  ],
  "timestamp": "2025-06-26T12:00:00Z"
}
```

---

### 29. Update Department

**PUT /api/v1/departments/{id}**

All fields optional.

#### Response

HTTP 200 — updated `DepartmentResponse`.

---

### 30. Delete Department

**DELETE /api/v1/departments/{id}**

#### Response

HTTP 200 — no-content success.

---

## Module: Users

Base path: `/api/v1/users`

**Authorization:** `SUPER_ADMIN` OR `TENANT_ADMIN` OR `AUTH:users:manage`

---

### 31. Create User

**POST /api/v1/users**

#### Headers

```http
Authorization: Bearer {accessToken}
X-Tenant-ID: {tenantId}
Content-Type: application/json
```

#### Request Body

```json
{
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john.doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-000-0000",
  "password": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe",
  "languageCode": "en",
  "timezone": "Africa/Cairo"
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `companyId` | UUID | Yes | `@NotNull` | Company the user belongs to |
| `username` | String | Yes | `@NotBlank`, `^[a-zA-Z0-9_.-]+$`, `max=100` | Unique login username |
| `email` | String | Yes | `@NotBlank`, `@Email`, `max=255` | Unique email |
| `phone` | String | No | `max=50` | Phone number |
| `password` | String | Yes | `@NotBlank`, `@Size(min=8)` | Initial password |
| `firstName` | String | Yes | `@NotBlank`, `max=100` | First name |
| `lastName` | String | Yes | `@NotBlank`, `max=100` | Last name |
| `languageCode` | String | No | — | Preferred language (`"en"`, `"ar"`, ...) |
| `timezone` | String | No | — | IANA timezone (`"Africa/Cairo"`) |

#### Response

HTTP 201 — `UserResponse`.

---

### 32. List Users

**GET /api/v1/users**

Read permission: `AUTH:users:read` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Query Parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `status` | `UserStatus` | No | — | Filter: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION` |
| `companyId` | UUID | No | — | Filter by company |
| `branchId` | UUID | No | — | Filter by branch |
| `page` | Integer | No | `0` | — |
| `size` | Integer | No | `20` | — |
| `sort` | String | No | `createdAt,desc` | — |

#### Response

HTTP 200 — paginated `UserResponse`.

---

### 33. Get User by ID

**GET /api/v1/users/{id}**

#### Response

HTTP 200

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "companyId": "661f9511-f3c0-52e5-b827-557766551111",
    "username": "john.doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-000-0000",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": null,
    "status": "ACTIVE",
    "twoFactorEnabled": false,
    "languageCode": "en",
    "timezone": "Africa/Cairo",
    "lastLoginAt": "2025-06-25T08:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-06-01T00:00:00Z",
    "roles": [
      { "id": "...", "code": "TENANT_ADMIN", "name": "Tenant Admin", "isSystem": true }
    ]
  },
  "timestamp": "2025-06-26T12:00:00Z"
}
```

---

### 34. Update User

**PUT /api/v1/users/{id}**

#### Request Body

```json
{
  "firstName": "Jonathan",
  "lastName": "Doe",
  "phone": "+1-555-111-2222",
  "avatarUrl": "https://cdn.example.com/avatar.png",
  "languageCode": "ar",
  "timezone": "Africa/Cairo"
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `firstName` | String | Yes | `@NotBlank`, `max=100` | First name |
| `lastName` | String | Yes | `@NotBlank`, `max=100` | Last name |
| `phone` | String | No | `max=50` | Phone |
| `avatarUrl` | String | No | — | Avatar image URL |
| `languageCode` | String | No | — | Language preference |
| `timezone` | String | No | — | Timezone |

#### Response

HTTP 200 — updated `UserResponse`.

---

### 35. Delete User

**DELETE /api/v1/users/{id}**

Soft-deletes the user.

#### Response

HTTP 200 — no-content success.

---

### 36. Activate User

**PATCH /api/v1/users/{id}/activate**

Sets status to `ACTIVE`.

#### Response

HTTP 200 — success message.

---

### 37. Deactivate User

**PATCH /api/v1/users/{id}/deactivate**

Sets status to `INACTIVE`.

#### Response

HTTP 200 — success message.

---

### 38. Unlock User

**PATCH /api/v1/users/{id}/unlock**

Clears the locked state after failed login attempts.

#### Response

HTTP 200 — success message.

---

### 39. Reset Password

**PATCH /api/v1/users/{id}/reset-password**

Triggers a password reset for the user (admin action).

#### Response

HTTP 200 — success message.

---

### 40. Force Password Change

**PATCH /api/v1/users/{id}/force-password-change**

Forces the user to change their password at next login.

#### Response

HTTP 200 — success message.

---

### 41. Get User Roles

**GET /api/v1/users/{id}/roles**

Read permission: `AUTH:users:read` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Response

HTTP 200

```json
{
  "success": true,
  "data": [
    { "id": "...", "code": "TENANT_ADMIN", "name": "Tenant Admin", "isSystem": true }
  ],
  "timestamp": "2025-06-26T12:00:00Z"
}
```

---

### 42. Get User Effective Permissions

**GET /api/v1/users/{id}/permissions**

Read permission: `AUTH:users:read` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

Returns the merged set of all permissions the user has (from roles + direct grants, minus direct denies).

#### Response

HTTP 200

```json
{
  "success": true,
  "data": [
    {
      "moduleCode": "CORE",
      "resource": "companies",
      "action": "READ",
      "permissionCode": "CORE:companies:read",
      "source": "ROLE",
      "isDenied": false
    },
    {
      "moduleCode": "AUTH",
      "resource": "users",
      "action": "CREATE",
      "permissionCode": "AUTH:users:create",
      "source": "DIRECT",
      "isDenied": false
    }
  ],
  "timestamp": "2025-06-26T12:00:00Z"
}
```

---

## Module: Roles

Base path: `/api/v1/roles`

**Authorization:** `SUPER_ADMIN` OR `TENANT_ADMIN` OR `AUTH:roles:manage`

---

### 43. Create Role

**POST /api/v1/roles**

#### Request Body

```json
{
  "code": "BILLING_MANAGER",
  "name": "Billing Manager",
  "description": "Manages billing and invoices",
  "isActive": true
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `code` | String | Yes | `@NotBlank`, `^[A-Z0-9_]+$`, `max=100` | Unique uppercase role code |
| `name` | String | Yes | `@NotBlank`, `max=255` | Display name |
| `description` | String | No | — | Role description |
| `isActive` | Boolean | Yes | `@NotNull` | Active status |

#### Response

HTTP 201 — `RoleResponse`.

---

### 44. List Roles

**GET /api/v1/roles**

Read permission: `AUTH:roles:read` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Query Parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `includeSystemRoles` | Boolean | No | `false` | Include built-in system roles |
| `page` | Integer | No | `0` | — |
| `size` | Integer | No | `20` | — |
| `sort` | String | No | `createdAt,desc` | — |

#### Response

HTTP 200 — paginated `RoleResponse`.

---

### 45. Get Role by ID

**GET /api/v1/roles/{id}**

#### Response

HTTP 200 — single `RoleResponse`.

---

### 46. Update Role

**PUT /api/v1/roles/{id}**

Same body as Create.

#### Response

HTTP 200 — updated `RoleResponse`.

---

### 47. Delete Role

**DELETE /api/v1/roles/{id}**

#### Response

HTTP 200 — no-content success.

---

## Module: Permissions

Base path: `/api/v1/permissions`

**Authorization:** `SUPER_ADMIN` OR `TENANT_ADMIN` OR `AUTH:permissions:read`

Permissions are **system-seeded** and cannot be created/deleted via API. They can only be read and assigned to roles.

---

### 48. List Permissions

**GET /api/v1/permissions**

#### Query Parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `moduleId` | Long | No | — | Filter by module |
| `resource` | String | No | — | Filter by resource name |
| `action` | `PermissionAction` | No | — | Filter by action enum value |
| `page` | Integer | No | `0` | — |
| `size` | Integer | No | `50` | — |
| `sort` | String | No | `createdAt,desc` | — |

#### Response

HTTP 200 — paginated `PermissionResponse`.

---

### 49. Get Permission by ID

**GET /api/v1/permissions/{id}**

`{id}` is a `Long`, not a UUID.

#### Response

HTTP 200 — single `PermissionResponse`.

---

### 50. Get Permissions by Module

**GET /api/v1/permissions/by-module/{moduleId}**

Returns all permissions belonging to a specific module (non-paginated).

#### Path Variables

| Name | Type | Description |
|---|---|---|
| `moduleId` | Long | Module ID |

#### Response

HTTP 200 — array of `PermissionResponse`.

---

## Module: Modules

Base path: `/api/v1/modules`

**Authorization:** `SUPER_ADMIN` only.

Modules are system-defined ERP modules (CORE, AUTH, FINANCE, etc.). They are seeded and cannot be created via API.

---

### 51. List Modules

**GET /api/v1/modules**

Read permission: `CORE:modules:read` OR `SUPER_ADMIN`

#### Response

HTTP 200 — array of `ModuleResponse`.

---

### 52. Get Module by ID

**GET /api/v1/modules/{id}**

`{id}` is a `Long`.

#### Response

HTTP 200 — single `ModuleResponse`.

---

### 53. Activate Module

**PATCH /api/v1/modules/{id}/activate**

#### Response

HTTP 200 — success message.

---

### 54. Deactivate Module

**PATCH /api/v1/modules/{id}/deactivate**

#### Response

HTTP 200 — success message.

---

## Module: User–Role Assignment

Base path: `/api/v1/users/{userId}/roles`

---

### 55. Get User's Assigned Roles

**GET /api/v1/users/{userId}/roles**

Read permission: `AUTH:roles:read` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Response

HTTP 200

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "roleId": "550e8400-e29b-41d4-a716-446655440000",
      "roleCode": "BILLING_MANAGER",
      "roleName": "Billing Manager",
      "companyId": "661f9511-f3c0-52e5-b827-557766551111",
      "branchId": null,
      "assignedAt": "2025-01-01T00:00:00Z",
      "expiresAt": null
    }
  ],
  "timestamp": "2025-06-26T12:00:00Z"
}
```

---

### 56. Assign Role to User

**POST /api/v1/users/{userId}/roles/assign**

Permission: `AUTH:roles:assign` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Request Body

```json
{
  "roleId": "550e8400-e29b-41d4-a716-446655440000",
  "companyId": "661f9511-f3c0-52e5-b827-557766551111",
  "branchId": null,
  "expiresAt": null
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `roleId` | UUID | Yes | `@NotNull` | Role to assign |
| `companyId` | UUID | No | — | Scope to company |
| `branchId` | UUID | No | — | Scope to branch |
| `expiresAt` | ISO-8601 | No | — | Optional expiry |

#### Response

HTTP 200 — success message.

---

### 57. Revoke Role from User

**POST /api/v1/users/{userId}/roles/revoke**

Permission: `AUTH:roles:assign` OR `SUPER_ADMIN`

#### Request Body

```json
{
  "roleId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response

HTTP 200 — success message.

---

## Module: Role–Permission Assignment

Base path: `/api/v1/roles/{roleId}/permissions`

---

### 58. Get Role's Permissions

**GET /api/v1/roles/{roleId}/permissions**

Permission: `AUTH:permissions:read` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Response

HTTP 200 — array of `PermissionResponse`.

---

### 59. Assign Permissions to Role

**POST /api/v1/roles/{roleId}/permissions/assign**

Permission: `AUTH:permissions:assign` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Request Body

```json
{
  "permissionIds": [1, 2, 3, 14, 22]
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `permissionIds` | Long[] | Yes | `@NotEmpty` | List of permission IDs to add |

#### Response

HTTP 200 — success message.

---

### 60. Revoke Permissions from Role

**POST /api/v1/roles/{roleId}/permissions/revoke**

Permission: `AUTH:permissions:assign` OR `SUPER_ADMIN`

#### Request Body

```json
{
  "permissionIds": [1, 2]
}
```

#### Response

HTTP 200 — success message.

---

### 61. Sync Role Permissions (Replace All)

**PUT /api/v1/roles/{roleId}/permissions/sync**

Permission: `AUTH:permissions:assign` OR `SUPER_ADMIN`

Replaces the role's entire permission set with the provided list. Any existing permission not in the list is removed.

#### Request Body

```json
{
  "permissionIds": [1, 3, 5, 8]
}
```

#### Response

HTTP 200 — success message.

#### Frontend Notes

Use this when building a "permission checkbox list" UI: send the full set of checked boxes.

---

## Module: User Direct Permissions

Base path: `/api/v1/users/{userId}/permissions`

Direct permissions override role-based permissions for a specific user.

---

### 62. Get User's Direct Permissions

**GET /api/v1/users/{userId}/permissions**

Permission: `AUTH:permissions:read` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Response

HTTP 200

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "permissionId": 14,
      "permissionCode": "CORE:companies:delete",
      "permissionName": "Delete Company",
      "resource": "companies",
      "action": "DELETE",
      "isDeny": false,
      "reason": "One-off grant for migration",
      "grantedAt": "2025-06-01T00:00:00Z",
      "expiresAt": "2025-12-31T23:59:59Z"
    }
  ],
  "timestamp": "2025-06-26T12:00:00Z"
}
```

---

### 63. Get User's Effective Permissions

**GET /api/v1/users/{userId}/permissions/effective**

Permission: `AUTH:permissions:read` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

Returns the merged effective permission set (roles + direct grants − direct denies).

#### Response

HTTP 200 — array of `EffectivePermissionResponse`.

---

### 64. Grant Permission to User

**POST /api/v1/users/{userId}/permissions/grant**

Permission: `AUTH:permissions:assign` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Request Body

```json
{
  "permissionId": 14,
  "reason": "Temporary grant for migration project",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `permissionId` | Long | Yes | `@NotNull` | Permission to grant |
| `reason` | String | No | — | Audit reason |
| `expiresAt` | ISO-8601 | No | — | Optional expiry |

#### Response

HTTP 200 — success message.

---

### 65. Deny Permission for User

**POST /api/v1/users/{userId}/permissions/deny**

Permission: `AUTH:permissions:assign` OR `SUPER_ADMIN`

Explicitly denies a permission to the user, overriding any role that would grant it.

#### Request Body

```json
{
  "permissionId": 14,
  "reason": "Conflict of interest — restricted by audit"
}
```

#### Response

HTTP 200 — success message.

---

### 66. Revoke Direct Permission

**POST /api/v1/users/{userId}/permissions/revoke**

Permission: `AUTH:permissions:assign` OR `SUPER_ADMIN`

Removes a direct grant or deny record. User falls back to role-based access.

#### Request Body

```json
{
  "permissionId": 14
}
```

#### Response

HTTP 200 — success message.

---

## Module: User–Branch Assignment

Base path: `/api/v1/users/{userId}/branches`

---

### 67. Get User's Branches

**GET /api/v1/users/{userId}/branches**

Permission: `AUTH:users:read` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Response

HTTP 200

```json
{
  "success": true,
  "data": [
    {
      "branchId": "550e8400-e29b-41d4-a716-446655440000",
      "code": "CAIRO_HQ",
      "name": "Cairo Headquarters",
      "isPrimary": true
    }
  ],
  "timestamp": "2025-06-26T12:00:00Z"
}
```

---

### 68. Assign Branch to User

**POST /api/v1/users/{userId}/branches**

Permission: `AUTH:users:assign` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Request Body

```json
{
  "branchId": "550e8400-e29b-41d4-a716-446655440000",
  "isPrimary": true
}
```

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `branchId` | UUID | Yes | `@NotNull` | Branch to assign |
| `isPrimary` | Boolean | No | `false` | Mark as primary branch |

#### Response

HTTP 200 — success message.

---

### 69. Revoke Branch from User

**POST /api/v1/users/{userId}/branches/revoke**

Permission: `AUTH:users:assign` OR `SUPER_ADMIN`

#### Request Body

```json
{
  "branchId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response

HTTP 200 — success message.

---

### 70. Set Primary Branch

**PATCH /api/v1/users/{userId}/branches/{branchId}/set-primary**

Permission: `AUTH:users:assign` OR `TENANT_ADMIN` OR `SUPER_ADMIN`

#### Path Variables

| Name | Type | Description |
|---|---|---|
| `userId` | UUID | Target user |
| `branchId` | UUID | Branch to set as primary |

#### Response

HTTP 200 — success message.

---

## DTO Reference

### LoginRequest

| Field | Type | Required | Validation | Example |
|---|---|---|---|---|
| `email` | String | Yes | `@NotBlank`, `@Email` | `"admin@example.com"` |
| `password` | String | Yes | `@NotBlank` | `"SecureP@ss123"` |

---

### LoginResponse

| Field | Type | Nullable | Description |
|---|---|---|---|
| `success` | Boolean | No | Always `true` for 200 |
| `requiresTenantSelection` | Boolean | No | `true` → must pick tenant |
| `selectionToken` | String | Yes | Present only when `requiresTenantSelection=true` |
| `accessToken` | String | Yes | Present when selection not required |
| `refreshToken` | String | Yes | Present when selection not required |
| `user` | Object | Yes | User details (when directly logged in) |
| `tenant` | TenantResponse | Yes | Tenant details (when directly logged in) |

---

### SelectTenantRequest

| Field | Type | Required | Validation | Example |
|---|---|---|---|---|
| `selectionToken` | String | Yes | `@NotBlank` | `"eyJhbGci..."` |
| `tenantId` | UUID | Yes | `@NotNull` | `"550e8400-..."` |

---

### SelectTenantResponse

| Field | Type | Nullable | Description |
|---|---|---|---|
| `success` | Boolean | No | Always `true` |
| `accessToken` | String | No | JWT access token |
| `refreshToken` | String | No | JWT refresh token |
| `user` | Object | Yes | User details |
| `tenant` | TenantResponse | No | Selected tenant details |

---

### AvailableTenantDTO

| Field | Type | Nullable | Example |
|---|---|---|---|
| `id` | UUID | No | `"550e8400-..."` |
| `code` | String | No | `"ACME"` |
| `name` | String | No | `"ACME Corp"` |

---

### TenantResponse

| Field | Type | Nullable | Example |
|---|---|---|---|
| `id` | UUID | No | `"550e8400-..."` |
| `code` | String | No | `"ACME"` |
| `name` | String | No | `"ACME Corporation"` |
| `domain` | String | Yes | `"acme.example.com"` |
| `logoUrl` | String | Yes | `"https://cdn.example.com/logo.png"` |
| `isActive` | Boolean | No | `true` |
| `maxUsers` | Integer | Yes | `500` |
| `subscriptionPlan` | String | Yes | `"ENTERPRISE"` |
| `subscriptionExpiresAt` | ISO-8601 | Yes | `"2026-12-31T23:59:59Z"` |
| `settings` | String | Yes | JSON blob or `null` |
| `createdAt` | ISO-8601 | No | `"2025-01-01T00:00:00Z"` |
| `updatedAt` | ISO-8601 | No | `"2025-06-01T00:00:00Z"` |

---

### CompanyResponse

| Field | Type | Nullable | Example |
|---|---|---|---|
| `id` | UUID | No | — |
| `code` | String | No | `"ACME_EG"` |
| `name` | String | No | `"ACME Egypt"` |
| `legalName` | String | Yes | `"ACME Egypt LLC"` |
| `taxNumber` | String | Yes | `"123456789"` |
| `registrationNumber` | String | Yes | `"REG-2024-001"` |
| `countryCode` | String | Yes | `"EG"` |
| `currencyCode` | String | Yes | `"EGP"` |
| `phone` | String | Yes | `"+20-100-000-0000"` |
| `email` | String | Yes | `"info@acme.eg"` |
| `address` | String | Yes | `"123 Nile St, Cairo"` |
| `logoUrl` | String | Yes | — |
| `isActive` | Boolean | No | `true` |
| `settings` | String | Yes | — |
| `createdAt` | ISO-8601 | No | — |
| `updatedAt` | ISO-8601 | No | — |

---

### BranchResponse

| Field | Type | Nullable | Example |
|---|---|---|---|
| `id` | UUID | No | — |
| `companyId` | UUID | No | — |
| `code` | String | No | `"CAIRO_HQ"` |
| `name` | String | No | `"Cairo Headquarters"` |
| `address` | String | Yes | — |
| `phone` | String | Yes | — |
| `email` | String | Yes | — |
| `isActive` | Boolean | No | `true` |
| `isMain` | Boolean | No | `true` |
| `settings` | String | Yes | — |
| `createdAt` | ISO-8601 | No | — |
| `updatedAt` | ISO-8601 | No | — |

---

### DepartmentResponse

| Field | Type | Nullable | Example |
|---|---|---|---|
| `id` | UUID | No | — |
| `companyId` | UUID | No | — |
| `branchId` | UUID | Yes | — |
| `parentId` | UUID | Yes | — |
| `code` | String | No | `"FINANCE"` |
| `name` | String | No | `"Finance"` |
| `description` | String | Yes | — |
| `isActive` | Boolean | No | `true` |
| `createdAt` | ISO-8601 | No | — |
| `updatedAt` | ISO-8601 | No | — |

---

### DepartmentTreeResponse

Same as `DepartmentResponse` plus:

| Field | Type | Nullable | Description |
|---|---|---|---|
| `children` | DepartmentTreeResponse[] | No | Recursive child nodes (empty array if leaf) |

---

### UserResponse

| Field | Type | Nullable | Example |
|---|---|---|---|
| `id` | UUID | No | — |
| `companyId` | UUID | No | — |
| `username` | String | No | `"john.doe"` |
| `email` | String | No | `"john@example.com"` |
| `phone` | String | Yes | `"+1-555-000-0000"` |
| `firstName` | String | No | `"John"` |
| `lastName` | String | No | `"Doe"` |
| `avatarUrl` | String | Yes | — |
| `status` | UserStatus | No | `"ACTIVE"` |
| `twoFactorEnabled` | Boolean | No | `false` |
| `languageCode` | String | Yes | `"en"` |
| `timezone` | String | Yes | `"Africa/Cairo"` |
| `lastLoginAt` | ISO-8601 | Yes | — |
| `createdAt` | ISO-8601 | No | — |
| `updatedAt` | ISO-8601 | No | — |
| `roles` | RoleSummaryResponse[] | No | Assigned roles (may be empty) |

---

### RoleResponse

| Field | Type | Nullable | Example |
|---|---|---|---|
| `id` | UUID | No | — |
| `code` | String | No | `"BILLING_MANAGER"` |
| `name` | String | No | `"Billing Manager"` |
| `description` | String | Yes | — |
| `isSystem` | Boolean | No | `false` |
| `isActive` | Boolean | No | `true` |
| `createdAt` | ISO-8601 | No | — |
| `updatedAt` | ISO-8601 | No | — |

---

### RoleSummaryResponse

| Field | Type | Nullable | Example |
|---|---|---|---|
| `id` | UUID | No | — |
| `code` | String | No | `"TENANT_ADMIN"` |
| `name` | String | No | `"Tenant Admin"` |
| `isSystem` | Boolean | No | `true` |

---

### PermissionResponse

| Field | Type | Nullable | Example |
|---|---|---|---|
| `id` | Long | No | `14` |
| `moduleId` | Long | No | `1` |
| `resource` | String | No | `"companies"` |
| `action` | PermissionAction | No | `"READ"` |
| `code` | String | No | `"CORE:companies:read"` |
| `name` | String | No | `"Read Company"` |
| `description` | String | Yes | — |
| `isActive` | Boolean | No | `true` |
| `createdAt` | ISO-8601 | No | — |
| `updatedAt` | ISO-8601 | No | — |

---

### UserPermissionResponse (direct permission record)

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | Long | No | Record ID |
| `permissionId` | Long | No | Referenced permission |
| `permissionCode` | String | No | `"CORE:companies:delete"` |
| `permissionName` | String | No | `"Delete Company"` |
| `resource` | String | No | `"companies"` |
| `action` | PermissionAction | No | `"DELETE"` |
| `isDeny` | Boolean | No | `true` = explicit deny |
| `reason` | String | Yes | Audit note |
| `grantedAt` | ISO-8601 | No | When recorded |
| `expiresAt` | ISO-8601 | Yes | `null` = permanent |

---

### EffectivePermissionResponse

| Field | Type | Nullable | Description |
|---|---|---|---|
| `moduleCode` | String | No | `"CORE"` |
| `resource` | String | No | `"companies"` |
| `action` | String | No | `"READ"` |
| `permissionCode` | String | No | `"CORE:companies:read"` |
| `source` | String | No | `"ROLE"` or `"DIRECT"` |
| `isDenied` | Boolean | No | `true` = explicitly denied |

---

### UserRoleResponse

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | Long | No | Assignment record ID |
| `roleId` | UUID | No | Role UUID |
| `roleCode` | String | No | `"BILLING_MANAGER"` |
| `roleName` | String | No | `"Billing Manager"` |
| `companyId` | UUID | Yes | Scope (null = global) |
| `branchId` | UUID | Yes | Scope (null = all branches) |
| `assignedAt` | ISO-8601 | No | Assignment timestamp |
| `expiresAt` | ISO-8601 | Yes | Expiry or null = permanent |

---

### BranchSummaryResponse

| Field | Type | Nullable | Description |
|---|---|---|---|
| `branchId` | UUID | No | Branch UUID |
| `code` | String | No | Branch code |
| `name` | String | No | Branch name |
| `isPrimary` | Boolean | No | Whether this is the primary branch |

---

### ModuleResponse

| Field | Type | Nullable | Example |
|---|---|---|---|
| `id` | Long | No | `1` |
| `code` | String | No | `"CORE"` |
| `name` | String | No | `"Core Module"` |
| `description` | String | Yes | — |
| `icon` | String | Yes | — |
| `isActive` | Boolean | No | `true` |
| `sortOrder` | Integer | Yes | `1` |
| `createdAt` | ISO-8601 | No | — |
| `updatedAt` | ISO-8601 | No | — |

---

## Enum Reference

### UserStatus

| Value | Description | When Set |
|---|---|---|
| `ACTIVE` | Normal, can log in | Default or after activation |
| `INACTIVE` | Disabled, cannot log in | After deactivation |
| `SUSPENDED` | Blocked, cannot log in | Security suspension |
| `PENDING_VERIFICATION` | Awaiting email verification | After creation (if verification required) |

Usage: Filter parameter for `GET /api/v1/users?status=ACTIVE`

---

### PermissionAction

| Value | Description |
|---|---|
| `CREATE` | Create new records |
| `READ` | View/list records |
| `UPDATE` | Modify existing records |
| `DELETE` | Remove records |
| `EXPORT` | Export data to file |
| `IMPORT` | Import data from file |
| `APPROVE` | Approve pending items |
| `REJECT` | Reject pending items |
| `ASSIGN` | Assign resources to others |
| `REVOKE` | Revoke assigned resources |

Usage: Filter parameter for `GET /api/v1/permissions?action=READ`

---

## Frontend Integration Guide

### Application Initialization

On application startup (or after page reload):

```
1. Check if accessToken exists in memory/storage
2. If yes → verify not expired (check JWT exp claim client-side)
3. If valid → restore context (tenantId, user, roles)
4. If expired → use refreshToken to get new accessToken
5. If no token or refresh fails → redirect to Login
```

### Login Flow

```
1. POST /api/v1/auth/login  { email, password }
2. If requiresTenantSelection === false:
     → Store accessToken, refreshToken, tenantId
     → Redirect to dashboard
3. If requiresTenantSelection === true:
     → Store selectionToken in memory
     → GET /api/v1/auth/available-tenants  (Bearer selectionToken)
     → Show tenant picker UI
     → POST /api/v1/auth/select-tenant  { selectionToken, tenantId }
     → Store accessToken, refreshToken, tenantId
     → Redirect to dashboard
```

### Token Refresh Flow

```
1. Any API call returns 401
2. Intercept response in HTTP interceptor
3. POST /api/v1/auth/refresh  { refreshToken }  ← endpoint not yet implemented (see Missing APIs)
4. On success: store new accessToken, retry original request
5. On failure (refresh expired): redirect to Login
```

### Setting Up Angular HTTP Interceptor

Every outgoing request (except `/v1/auth/**`) must include:

```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'X-Tenant-ID': tenantId,
  'Content-Type': 'application/json'
}
```

### Logout

```
1. Clear accessToken from memory
2. Clear refreshToken from storage
3. Clear tenantId
4. Redirect to Login
5. (Optional) Call a logout endpoint to invalidate refresh token server-side
   ← this endpoint does not yet exist (see Missing APIs)
```

### Permission-Based Navigation

After login, call `GET /api/v1/users/{userId}/permissions/effective` to get the user's effective permission set. Cache it in state. Use the list to:
- Show/hide menu items
- Enable/disable action buttons
- Guard routes with `canActivate`

```typescript
const canRead = effectivePermissions.some(p =>
  p.permissionCode === 'CORE:companies:read' && !p.isDenied
);
```

### Error Handling

```typescript
// Angular HTTP interceptor pattern
switch (error.status) {
  case 400: // show fieldErrors validation messages
  case 401: // redirect to login (or refresh token)
  case 403: // show "access denied" screen
  case 404: // show "not found" message
  case 409: // show "already exists" message
  case 422: // show business error message
  case 500: // show generic error
}
```

---

## Dependency Graph

```
User opens app
      │
      ▼
   Stored tokens?
      │
   ┌──┴──┐
  Yes    No
   │      │
   │      ▼
   │   POST /api/v1/auth/login
   │      │
   │      ▼
   │   requiresTenantSelection?
   │      │
   │   ┌──┴──┐
   │  Yes    No
   │   │      │
   │   ▼      │
   │  GET /api/v1/auth/available-tenants
   │   │      │
   │   ▼      │
   │  POST /api/v1/auth/select-tenant
   │   │      │
   └───┴──────┘
              │
              ▼
        Store: accessToken
               refreshToken
               tenantId
               user
               tenant
              │
              ▼
        GET /api/v1/users/{id}/permissions/effective
              │
              ▼
        Build permission map
              │
              ▼
        Build navigation menu
              │
              ▼
        Load Dashboard
              │
        (All requests include:
         Authorization + X-Tenant-ID)
```

---

## API Checklist

| # | Endpoint | Implemented | Secured | Validation | Pagination | Notes |
|---|---|---|---|---|---|---|
| 1 | POST /v1/auth/login | ✅ | Public | ✅ | — | |
| 2 | GET /v1/auth/available-tenants | ✅ | selectionToken | — | — | |
| 3 | POST /v1/auth/select-tenant | ✅ | Public (selectionToken in body) | ✅ | — | |
| 4 | POST /v1/auth/refresh | ❌ | — | — | — | **Missing — see below** |
| 5 | POST /v1/tenants | ✅ | SUPER_ADMIN | ✅ | — | |
| 6 | GET /v1/tenants | ✅ | SUPER_ADMIN | — | ✅ | |
| 7 | GET /v1/tenants/{id} | ✅ | SUPER_ADMIN | — | — | |
| 8 | PUT /v1/tenants/{id} | ✅ | SUPER_ADMIN | ✅ | — | |
| 9 | DELETE /v1/tenants/{id} | ✅ | SUPER_ADMIN | — | — | |
| 10 | PATCH /v1/tenants/{id}/activate | ✅ | SUPER_ADMIN | — | — | |
| 11 | PATCH /v1/tenants/{id}/deactivate | ✅ | SUPER_ADMIN | — | — | |
| 12 | POST /v1/companies | ✅ | TENANT_ADMIN | ✅ | — | |
| 13 | GET /v1/companies | ✅ | TENANT_ADMIN | — | ✅ | |
| 14 | GET /v1/companies/{id} | ✅ | TENANT_ADMIN | — | — | |
| 15 | PUT /v1/companies/{id} | ✅ | TENANT_ADMIN | ✅ | — | |
| 16 | DELETE /v1/companies/{id} | ✅ | TENANT_ADMIN | — | — | |
| 17 | PATCH /v1/companies/{id}/activate | ✅ | TENANT_ADMIN | — | — | |
| 18 | PATCH /v1/companies/{id}/deactivate | ✅ | TENANT_ADMIN | — | — | |
| 19 | POST /v1/branches | ✅ | COMPANY_ADMIN | ✅ | — | |
| 20 | GET /v1/branches | ✅ | COMPANY_ADMIN | — | ✅ | |
| 21 | GET /v1/branches/{id} | ✅ | COMPANY_ADMIN | — | — | |
| 22 | PUT /v1/branches/{id} | ✅ | COMPANY_ADMIN | ✅ | — | |
| 23 | DELETE /v1/branches/{id} | ✅ | COMPANY_ADMIN | — | — | |
| 24 | PATCH /v1/branches/{id}/set-main | ✅ | COMPANY_ADMIN | — | — | |
| 25 | POST /v1/departments | ✅ | COMPANY_ADMIN | ✅ | — | |
| 26 | GET /v1/departments | ✅ | COMPANY_ADMIN | — | ✅ | |
| 27 | GET /v1/departments/{id} | ✅ | COMPANY_ADMIN | — | — | |
| 28 | GET /v1/departments/{id}/children | ✅ | COMPANY_ADMIN | — | — | |
| 29 | GET /v1/departments/tree | ✅ | COMPANY_ADMIN | — | — | |
| 30 | PUT /v1/departments/{id} | ✅ | COMPANY_ADMIN | ✅ | — | |
| 31 | DELETE /v1/departments/{id} | ✅ | COMPANY_ADMIN | — | — | |
| 32 | POST /v1/users | ✅ | TENANT_ADMIN | ✅ | — | |
| 33 | GET /v1/users | ✅ | TENANT_ADMIN | — | ✅ | |
| 34 | GET /v1/users/{id} | ✅ | TENANT_ADMIN | — | — | |
| 35 | PUT /v1/users/{id} | ✅ | TENANT_ADMIN | ✅ | — | |
| 36 | DELETE /v1/users/{id} | ✅ | TENANT_ADMIN | — | — | |
| 37 | PATCH /v1/users/{id}/activate | ✅ | TENANT_ADMIN | — | — | |
| 38 | PATCH /v1/users/{id}/deactivate | ✅ | TENANT_ADMIN | — | — | |
| 39 | PATCH /v1/users/{id}/unlock | ✅ | TENANT_ADMIN | — | — | |
| 40 | PATCH /v1/users/{id}/reset-password | ✅ | TENANT_ADMIN | — | — | |
| 41 | PATCH /v1/users/{id}/force-password-change | ✅ | TENANT_ADMIN | — | — | |
| 42 | GET /v1/users/{id}/roles | ✅ | TENANT_ADMIN | — | — | |
| 43 | GET /v1/users/{id}/permissions | ✅ | TENANT_ADMIN | — | — | |
| 44 | POST /v1/roles | ✅ | TENANT_ADMIN | ✅ | — | |
| 45 | GET /v1/roles | ✅ | TENANT_ADMIN | — | ✅ | |
| 46 | GET /v1/roles/{id} | ✅ | TENANT_ADMIN | — | — | |
| 47 | PUT /v1/roles/{id} | ✅ | TENANT_ADMIN | ✅ | — | |
| 48 | DELETE /v1/roles/{id} | ✅ | TENANT_ADMIN | — | — | |
| 49 | GET /v1/permissions | ✅ | TENANT_ADMIN | — | ✅ | |
| 50 | GET /v1/permissions/{id} | ✅ | TENANT_ADMIN | — | — | |
| 51 | GET /v1/permissions/by-module/{id} | ✅ | TENANT_ADMIN | — | — | |
| 52 | GET /v1/modules | ✅ | SUPER_ADMIN | — | — | |
| 53 | GET /v1/modules/{id} | ✅ | SUPER_ADMIN | — | — | |
| 54 | PATCH /v1/modules/{id}/activate | ✅ | SUPER_ADMIN | — | — | |
| 55 | PATCH /v1/modules/{id}/deactivate | ✅ | SUPER_ADMIN | — | — | |
| 56 | GET /v1/users/{id}/roles | ✅ | TENANT_ADMIN | — | — | |
| 57 | POST /v1/users/{id}/roles/assign | ✅ | TENANT_ADMIN | ✅ | — | |
| 58 | POST /v1/users/{id}/roles/revoke | ✅ | SUPER_ADMIN | ✅ | — | |
| 59 | GET /v1/roles/{id}/permissions | ✅ | TENANT_ADMIN | — | — | |
| 60 | POST /v1/roles/{id}/permissions/assign | ✅ | TENANT_ADMIN | ✅ | — | |
| 61 | POST /v1/roles/{id}/permissions/revoke | ✅ | SUPER_ADMIN | ✅ | — | |
| 62 | PUT /v1/roles/{id}/permissions/sync | ✅ | SUPER_ADMIN | ✅ | — | |
| 63 | GET /v1/users/{id}/permissions | ✅ | TENANT_ADMIN | — | — | |
| 64 | GET /v1/users/{id}/permissions/effective | ✅ | TENANT_ADMIN | — | — | |
| 65 | POST /v1/users/{id}/permissions/grant | ✅ | TENANT_ADMIN | ✅ | — | |
| 66 | POST /v1/users/{id}/permissions/deny | ✅ | SUPER_ADMIN | ✅ | — | |
| 67 | POST /v1/users/{id}/permissions/revoke | ✅ | SUPER_ADMIN | ✅ | — | |
| 68 | GET /v1/users/{id}/branches | ✅ | TENANT_ADMIN | — | — | |
| 69 | POST /v1/users/{id}/branches | ✅ | TENANT_ADMIN | ✅ | — | |
| 70 | POST /v1/users/{id}/branches/revoke | ✅ | SUPER_ADMIN | ✅ | — | |
| 71 | PATCH /v1/users/{id}/branches/{id}/set-primary | ✅ | TENANT_ADMIN | — | — | |

---

## Missing APIs

The following endpoints are expected by the login flow and standard session management but are **not yet implemented** in the backend.

---

### M1. Refresh Access Token

**Suggested:** POST /api/v1/auth/refresh

**Purpose:** Exchange a `refreshToken` for a new `accessToken`. Required to maintain session without re-login. The `RefreshTokenRequest` DTO already exists in the codebase, and the endpoint is listed in `PUBLIC_ENDPOINTS` in `SecurityConfig`, but the controller method does not exist.

**Suggested Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Suggested Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
  },
  "timestamp": "2025-06-26T12:00:00Z"
}
```

**Reason it is needed:** Without this, the frontend cannot silently refresh the 15-minute access token. Every 15 minutes the user would have to re-login, which is unacceptable.

---

### M2. Logout

**Suggested:** POST /api/v1/auth/logout

**Purpose:** Invalidate the current refresh token server-side (revoke the session). Without this, stolen refresh tokens remain valid for 7 days.

**Suggested Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Suggested Response:**

```json
{
  "success": true,
  "message": "Logged out successfully.",
  "timestamp": "2025-06-26T12:00:00Z"
}
```

**Reason it is needed:** Security best practice. Prevents session hijacking via stolen refresh tokens.

---

### M3. Get Current User Profile

**Suggested:** GET /api/v1/auth/me

**Purpose:** Returns the currently authenticated user's profile without knowing their ID. Required at app initialization.

**Suggested Response:** `UserResponse` of the authenticated user.

**Reason it is needed:** Angular app needs to know who is logged in after restoring tokens from storage. Calling `GET /v1/users/{id}` requires knowing the ID upfront, which means the frontend must parse the JWT to extract it.

---

*End of document*
