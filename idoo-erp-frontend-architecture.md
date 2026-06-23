# iDoo ERP — Angular 19+ Enterprise Frontend Architecture

Architecture for a SAP/Oracle/Dynamics-grade dynamic ERP frontend, built against the 13 existing Spring Boot modules (Auth, Tenants, Companies, Branches, Departments, Modules, Users, Roles, Permissions, Role-Permissions, User-Roles, User-Permissions, User-Branch-Assignments).

---

## 1. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                   │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                     APP SHELL (layout/)                          │  │
│  │   Topbar │ Sidebar (dynamic menu from /v1/modules) │ Router-Outlet │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                  │                                      │
│  ┌───────────────────────────────▼──────────────────────────────┐    │
│  │                    FEATURES (lazy-loaded)                      │    │
│  │  auth/ tenants/ companies/ branches/ departments/ users/       │    │
│  │  roles/ permissions/ modules/                                  │    │
│  │  Each feature = list + detail screens built from:              │    │
│  │     TableConfig<T>  +  FormSchema  (declarative, no duplication)│    │
│  └───────────────────────────────┬──────────────────────────────┘    │
│                                  │ uses                                │
│  ┌───────────────────────────────▼──────────────────────────────┐    │
│  │                          SHARED (shared/)                       │    │
│  │  Dynamic Form Engine │ Dynamic Table Engine │ Dynamic Dialog    │    │
│  │  Breadcrumb │ PageHeader │ SearchBar │ EmptyState │ ErrorState  │    │
│  │  *hasPermission directive │ StatusBadge                        │    │
│  └───────────────────────────────┬──────────────────────────────┘    │
│                                  │ depends on                          │
│  ┌───────────────────────────────▼──────────────────────────────┐    │
│  │                           CORE (core/)                          │    │
│  │  Auth (state, guards, interceptor) │ Permission State           │    │
│  │  API Layer: generated clients → Facades → feature consumers     │    │
│  │  DialogFacadeService │ MenuService │ APP_CONFIG token            │    │
│  └───────────────────────────────┬──────────────────────────────┘    │
└──────────────────────────────────┼──────────────────────────────────┘
                                    │ HTTPS + Bearer JWT
                  ┌─────────────────▼─────────────────┐
                  │   Spring Boot 3.5 API (13 modules)  │
                  │   JWT + RBAC + Multi-Tenant/Company  │
                  └───────────────────────────────────┘
```

Dependency direction is strictly one-way: `features → shared → core`. Nothing in `core` or `shared` imports from `features`. This is the Angular equivalent of Clean Architecture's dependency rule — inner layers (core) never know about outer layers (features).

---

## 2. Full Folder Structure

```
src/app/
├── app.routes.ts                         # Root routes — lazy children only
├── app.config.ts                         # Providers: HttpClient, interceptors, Material
│
├── core/                                 # Singleton, app-wide, no UI
│   ├── api/
│   │   ├── generated/                    # One file per backend controller (OpenAPI-shaped)
│   │   │   ├── auth.api.ts
│   │   │   ├── tenant.api.ts
│   │   │   ├── company.api.ts
│   │   │   ├── branch.api.ts
│   │   │   ├── department.api.ts
│   │   │   ├── module.api.ts
│   │   │   ├── permission.api.ts
│   │   │   ├── role.api.ts
│   │   │   └── user.api.ts
│   │   ├── facades/                      # Unwrap ApiResponse<T>, expose domain methods
│   │   │   ├── user.facade.ts
│   │   │   ├── role.facade.ts
│   │   │   ├── company.facade.ts
│   │   │   ├── branch.facade.ts
│   │   │   ├── department.facade.ts
│   │   │   └── tenant.facade.ts
│   │   ├── adapters/                     # DTO ↔ UI-model mapping when shapes diverge
│   │   └── models/
│   │       └── index.ts                  # All typed request/response DTOs
│   ├── auth/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   ├── permission.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── interceptors/
│   │   │   └── jwt.interceptor.ts        # Attaches token, handles 401 + silent refresh
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   └── token-storage.service.ts
│   │   └── state/
│   │       ├── auth.state.ts             # Signals: user, tokens, isAuthenticated
│   │       └── permission.state.ts       # Signal-backed Set<string> for O(1) checks
│   ├── services/
│   │   └── dialog-facade.service.ts
│   ├── tokens/
│   │   └── app-config.token.ts
│   ├── constants/
│   └── utils/
│
├── shared/                               # Reusable, stateless-by-default, no feature knowledge
│   ├── components/
│   │   ├── dynamic-form/                 # Form Engine
│   │   ├── dynamic-table/                # Table Engine
│   │   ├── dynamic-dialog/                # Dialog Engine
│   │   ├── breadcrumb/
│   │   ├── page-header/
│   │   ├── search-bar/
│   │   ├── loading-overlay/
│   │   ├── empty-state/
│   │   ├── error-state/
│   │   └── status-badge/
│   ├── directives/
│   │   ├── permission/has-permission.directive.ts
│   │   └── has-role/
│   ├── pipes/
│   ├── validators/
│   ├── models/
│   │   ├── dynamic-form.models.ts
│   │   ├── dynamic-table.models.ts
│   │   └── dynamic-dialog.models.ts
│   └── constants/
│       └── permissions.constants.ts
│
├── layout/                               # Shell chrome only — no business logic
│   ├── components/
│   │   ├── shell/shell.component.ts
│   │   ├── sidebar/sidebar.component.ts
│   │   └── topbar/topbar.component.ts
│   └── services/
│       ├── menu.models.ts
│       └── menu.service.ts               # Builds menu from /v1/modules + permissions
│
└── features/                             # One folder per backend module — lazy-loaded
    ├── auth/login/
    ├── tenants/
    ├── companies/
    ├── branches/
    ├── departments/ (+ tree view)
    ├── modules/
    ├── users/
    │   ├── list/users-list.component.ts
    │   ├── detail/user-form.component.ts # create/edit/view in ONE component
    │   ├── shared/
    │   │   ├── users-table.config.ts     # TableConfig<UserResponse>
    │   │   └── users-form.schema.ts       # FormSchema
    │   └── users.routes.ts
    ├── roles/        (+ permission-matrix sub-screen)
    └── permissions/
```

Each feature folder is self-contained and lazy-loaded via `loadChildren`/`loadComponent`. No feature imports another feature — cross-feature data (e.g. company list for a dropdown) flows through `core/api/facades`, never through direct feature-to-feature imports.

---

## 3. Dynamic Form Engine

**Problem solved:** 13 modules × 3 screens (create/edit/view) would be 39 hand-built components. Instead: 1 `DynamicFormComponent` + N `FormSchema` objects.

**Design:**
- `FormSchema` (`shared/models/dynamic-form.models.ts`) declares fields, types, validators, layout (1/2/3 columns), conditional visibility (`showWhen`), and per-field error messages.
- `DynamicFormComponent` builds a `FormGroup` from the schema at runtime, switches on `mode: 'create' | 'edit' | 'view'` (disables the form for `view`), and emits `submitted`/`cancelled` events — it never knows about HTTP or routing.
- Per-feature "schema builder" functions (e.g. `buildUserFormSchema(companies)`) inject reference data (dropdown options) and return a pure `FormSchema`. This is the Strategy pattern: behavior (validation, layout) is data, not code.
- A single `user-form.component.ts` handles all three User screens by reading `mode` from route `data`.

**Why this scales:** adding a 14th module's create/edit/view screens costs one schema file (~40 lines) and one thin wrapper component, not three new components with duplicated reactive-forms boilerplate.

---

## 4. Dynamic Table Engine

**Problem solved:** 13 modules' list screens would duplicate pagination, sorting, search, and per-row action-menu logic.

**Design:**
- `TableConfig<T>` declares columns (with `type: 'badge' | 'date' | 'boolean' | ...` for built-in renderers), row `actions` (each gated by `permission`), and `filters`.
- `DynamicTableComponent<T>` is generic over the row type, uses Angular Material's `MatTable` + `MatPaginator` + `MatSort`, and is `ChangeDetectionStrategy.OnPush` with an explicit `trackByFn`.
- Server-side pagination is mandatory: the component never holds more than one page of rows (`pageSize` rows in the DOM), and `pageChange`/`sortChange` outputs let the feature component re-fetch from the facade.
- Row actions render through `*hasPermission` inside a `mat-menu` — a denied action simply doesn't render, it isn't disabled-and-visible (avoids leaking the existence of an action the user can't use).

**Big-O behavior:**
- DOM size per render: **O(pageSize)**, not O(total rows) — pagination is server-side, not client-side array slicing.
- Change detection cost per update: **O(changed rows)** via `trackBy`, not O(pageSize) full re-render.
- Permission check per action per row: **O(1)** — backed by a `Set<string>` in `PermissionStateService`, not an array `.includes()` scan.
- For any screen expected to exceed ~500 rows rendered simultaneously (e.g. a permission matrix), swap in `cdk-virtual-scroll-viewport` (CDK `ScrollingModule` is already imported in the table component) to cap rendered rows at **O(viewport height / row height)** regardless of total dataset size.

---

## 5. Dynamic Dialog Engine

- `DialogConfig` declares `type: 'confirm' | 'delete' | 'approve' | 'reject' | 'info' | 'form'`, title, message, and button labels/colors.
- `DynamicDialogComponent` is the single Material dialog component for all of these; icon and color are derived from `type`.
- `DialogFacadeService.open(config)` returns `Observable<boolean>`; convenience methods `confirmDelete(entityName)` and `confirmApprove(entityName)` cover the two most common ERP confirmation patterns with zero boilerplate at the call site:
  ```typescript
  this.dialogFacade.confirmDelete('User').subscribe(confirmed => {
    if (confirmed) this.userFacade.deleteUser(id).subscribe(() => this.reload());
  });
  ```
- For a future "form dialog" (e.g. quick-create inside a picker), the same `DialogConfig.data` slot can carry a `FormSchema`, reusing the Dynamic Form Engine inside a dialog shell rather than building a new component.

---

## 6. Dynamic Sidebar & Routing Engine

**Sidebar:** `MenuService` calls `GET /v1/modules`, filters to `isActive`, sorts by `sortOrder`, maps each `ModuleResponse` to a `MenuItem` with a route convention `/app/{module-code-lowercase}`, and filters by `PermissionStateService.hasPermission('{MODULE}:view')`. The sidebar component is a 12-line template iterating `menuService.menuItems()` — adding a backend module surfaces it in the UI with zero frontend code changes, provided the route convention is registered.

**Routing:** every feature is `loadChildren`'d (route-based code splitting — Angular emits a separate JS chunk per feature, fetched only on navigation). Every protected route declares:
```typescript
canActivate: [permissionGuard],
data: { permissions: [PERMISSIONS.USERS.CREATE] }
```
`permissionGuard` reads `route.data['permissions']` and checks them against `PermissionStateService` — **the same permission codes drive the sidebar visibility, the route guard, and the `*hasPermission` directive on buttons**. One source of truth (`shared/constants/permissions.constants.ts`), three enforcement points, zero duplication.

---

## 7. Authentication Architecture

| Concern | Implementation |
|---|---|
| Login | `AuthService.login()` → `AuthApiClient.login()` → stores tokens (`TokenStorageService`) → hydrates `AuthStateService` → loads effective permissions into `PermissionStateService` |
| Refresh | `jwtInterceptor` catches `401`, queues concurrent requests behind a `BehaviorSubject` while a single refresh call is in flight (prevents a refresh-storm if 5 requests 401 simultaneously), then replays them with the new token |
| Logout | `AuthApiClient.logout()` → clears tokens, auth state, permission state → redirects to `/auth/login` |
| Current User/Tenant/Company/Branch | Derived as `computed()` selectors off `AuthStateService` (`user`, `tenantId`, `companyId`); current Branch is a separate signal seeded from `UserApiClient.getUserBranches()` since a user can hold multiple branch assignments |
| Guards | `authGuard` (session exists), `permissionGuard` (route-level RBAC), `tenantGuard` (tenant context resolved) — composed in route config, never duplicated in components |

---

## 8. Permission System (RBAC)

- Backend permission codes (`AUTH:users:create`) are the single vocabulary used everywhere on the frontend — never re-encoded into a parallel frontend enum.
- `PermissionStateService` holds `EffectivePermissionResponse[]` from `GET /v1/users/{id}/permissions` and derives a `Set<string>` of allowed codes (denied/`isDenied: true` entries are excluded), giving **O(1)** `hasPermission()` checks instead of repeated array scans on every render.
- `HasPermissionDirective` (`*hasPermission`) structurally adds/removes DOM, mirroring `*ngIf` — denied UI never mounts, so there's no flash-then-hide and no way to inspect a disabled-but-present control in devtools.
  ```html
  <button *hasPermission="'AUTH:users:create'">Create User</button>
  <div *hasPermission="['AUTH:users:create','AUTH:users:update']; mode: 'any'">...</div>
  ```
- `permissionGuard` enforces the same codes at the routing layer — a direct URL hit is blocked even if the sidebar/button were somehow bypassed.
- `shared/constants/permissions.constants.ts` is the only place permission strings are typed by hand; every guard, directive usage, and table-action config references this constant object, eliminating typo-class bugs from hardcoded strings.

---

## 9. State Management (Signals)

No NgRx. Five focused, injectable signal stores, each `providedIn: 'root'`:

| Store | Holds | Key selectors |
|---|---|---|
| `AuthStateService` | tokens, current user | `isAuthenticated`, `user`, `tenantId`, `companyId`, `mustChangePassword` |
| `PermissionStateService` | effective permissions | `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()` |
| Company context store | current company selection (multi-company switch) | `currentCompany` |
| Branch context store | current branch selection (multi-branch switch) | `currentBranch` |
| `MenuService` | sidebar items | `menuItems` |

Each store exposes only `computed()` readonly selectors externally and mutates through named methods (`setUser`, `clearAuth`) — never a raw public `set()`. This is the same encapsulation discipline NgRx forces via reducers/actions, achieved here with far less ceremony. NgRx becomes justified only if cross-cutting concerns emerge that signals can't express cleanly — time-travel debugging requirements, complex undo/redo, or a backend-driven event-sourcing UI. None of the 13 current modules need that.

---

## 10. API Layer

```
Component → Facade → Generated API Client → HttpClient → jwtInterceptor → Backend
```

- **Generated clients** (`core/api/generated/*.api.ts`): one per backend controller, typed 1:1 against the documented endpoints (e.g. `UserApiClient` covers all 12 `/v1/users/**` endpoints including nested roles/branches/permissions sub-resources). These are intentionally "dumb" — no business logic, just typed HTTP calls. In production this layer would be replaced by an OpenAPI-generated SDK (`openapi-generator-cli` against the Swagger spec) with this hand-written version as the interim contract.
- **Facades** (`core/api/facades/*.facade.ts`): unwrap `ApiResponse<T>` → return plain domain types. Components never see `{ success, data, message }` — they see `UserResponse`, `PageResponse<UserResponse>`, etc. This isolates the rest of the app from a backend envelope-format change.
- **Adapters** (`core/api/adapters/`): reserved for cases where backend DTO shape diverges from what the UI needs (e.g. flattening `DepartmentTreeResponse.children` for a flat picklist) — kept separate from facades so facades stay thin and adapters stay testable in isolation.
- **HttpClient is never injected into a component or a `shared/` component.** Every component depends on a facade interface, which is the seam used for unit testing (mock the facade, not `HttpClient`).

---

## 11. Shared Component Library

| Component | Responsibility |
|---|---|
| `DynamicFormComponent` | Renders any `FormSchema` in create/edit/view mode |
| `DynamicTableComponent<T>` | Paginated, sortable, filterable listing with permission-gated row actions |
| `DynamicDialogComponent` | Confirm/delete/approve/reject/info dialogs from one `DialogConfig` |
| `BreadcrumbComponent` | Router-aware breadcrumb trail |
| `PageHeaderComponent` | Title + breadcrumb + permission-gated primary action button |
| `SearchBarComponent` | Debounced (300ms) search input — bounds search API calls to one per pause, not one per keystroke |
| `LoadingOverlayComponent` | Section or fullscreen loading mask |
| `EmptyStateComponent` / `ErrorStateComponent` | Consistent no-data / failure UX across every list screen |
| `StatusBadgeComponent` | Maps any status enum (`ACTIVE`/`LOCKED`/...) to a colored chip via a configurable map |

All are standalone, `OnPush`, and accept configuration via `@Input` — none reach into a global store directly except `HasPermissionDirective`, `PageHeaderComponent` (for the gated action button), and `TopbarComponent`/`SidebarComponent` in `layout/`.

---

## 12. Feature Module Example — Users

```
features/users/
├── list/users-list.component.ts      # <app-dynamic-table> + <app-search-bar> + <app-page-header>
├── detail/user-form.component.ts     # <app-dynamic-form>, mode from route data
├── shared/
│   ├── users-table.config.ts         # buildUsersTableConfig(handlers) → TableConfig<UserResponse>
│   └── users-form.schema.ts          # buildUserFormSchema(companies) → FormSchema
└── users.routes.ts                   # list / create / :id/edit / :id/view, each permission-guarded
```

`UsersListComponent` and `UserFormComponent` together total under 200 lines and contain **zero** Angular Material table/form boilerplate — all of that lives once in `shared/components/`. This is the template every other feature (Roles, Branches, Departments, Companies, Tenants) follows: a table config, a form schema, two thin components, one routes file.

---

## 13. Performance Strategy

| Concern | Technique | Effect |
|---|---|---|
| Initial bundle size | `loadChildren`/`loadComponent` per feature | Only the active feature's JS downloads; root bundle stays small regardless of module count |
| Change detection cost | `ChangeDetectionStrategy.OnPush` on every component | CD skips subtrees whose `@Input`s are referentially unchanged — critical once there are hundreds of screens |
| List rendering | Server-side pagination + `trackBy` | DOM and CD work scale with `pageSize`, not total record count |
| Very large in-page lists (permission matrices, audit logs) | `cdk-virtual-scroll-viewport` | Rendered DOM nodes bounded by viewport height, independent of dataset size |
| Search input | RxJS `debounceTime(300) + distinctUntilChanged()` | One network call per pause in typing, not per keystroke |
| Permission checks | `Set<string>` lookup in `PermissionStateService` | O(1) per check; with hundreds of buttons/menu items per screen this avoids O(n) array scans repeated on every CD cycle |
| Token refresh under load | Single in-flight refresh call gates queued requests via `BehaviorSubject` | Prevents a refresh-storm (N concurrent 401s → N refresh calls) degrading into 1 refresh call |
| Signals vs Zone.js CD | Angular Signals integrate with the upcoming zoneless change detection path | Future-proofs against removing Zone.js entirely for further CD overhead reduction |

---

## 14. Coding Standards & Naming Conventions

- **Files:** `kebab-case.type.ts` — `users-list.component.ts`, `user.facade.ts`, `auth.guard.ts`, `permission.state.ts`.
- **Classes:** `PascalCase` suffixed by role — `UsersListComponent`, `UserFacade`, `AuthStateService`, `HasPermissionDirective`.
- **Permission codes:** `MODULE:resource:action`, lowercase resource/action, uppercase module — matches backend exactly; never hand-typed outside `shared/constants/permissions.constants.ts`.
- **Signals:** private mutable signal (`_state`), public `readonly` exposure via `.asReadonly()` or `computed()` — external code can read, never blind-`set()`.
- **Facades return domain types, never `ApiResponse<T>`** — enforced by convention and code review, not the compiler; consider an ESLint rule banning `ApiResponse` imports outside `core/api/`.
- **No `HttpClient` outside `core/api/generated/`** — enforced by code review / a custom lint rule restricting `HttpClient` injection to files under that path.
- **Forms and tables are config, not components** — a new CRUD screen should never require touching `shared/components/`; if it does, the schema/config model is missing a capability and should be extended there, not bypassed.

---

## 15. Reusable ERP Framework Strategy

The core bet of this architecture: **13 backend modules → 1 form engine + 1 table engine + 1 dialog engine + N small config files**, not 13 sets of bespoke CRUD screens. Concretely, this repository's worked example (Users) is ~200 lines of feature code on top of ~600 lines of shared engine code; the next 12 modules each add roughly 100–150 lines (config + thin wrapper), not another 600.

This is the same principle SAP Fiori, Oracle's ADF metadata-driven UI, and Dynamics' form/view XML customizations all converge on for the same reason: **at ERP scale, the cost center is screen count, not screen complexity** — most CRUD screens are structurally identical and differ only in field/column lists and permission codes. Encoding that difference as data (schemas/configs) rather than code is what keeps hundreds of screens maintainable by a small team.

**Boundary to respect going forward:** when a screen needs something the schema/config model can't express (e.g. the Department tree view, or a drag-and-drop role-permission matrix), build a dedicated component rather than bending `FormSchema`/`TableConfig` into something they're not. The framework should cover the ~80% of screens that are genuinely CRUD-shaped; the remaining ~20% (trees, matrices, dashboards, wizards) are legitimately custom and forcing them through the dynamic engines would be over-engineering in the other direction.

---

## 16. Architecture Risks & Trade-offs

- **Schema-driven forms lose some type safety** at the `submitted` event boundary (`Record<string, unknown>`) — mitigated by casting to the specific Request DTO immediately in the feature component (see `UserFormComponent.onSubmit`), keeping the loose typing contained to the engine itself.
- **No NgRx** means no built-in dev-tools time-travel debugging. Acceptable now; revisit if a module introduces genuinely complex cross-store derived state or undo/redo requirements.
- **localStorage token storage** (`TokenStorageService`) is vulnerable to XSS-based token theft. For a production ERP handling sensitive multi-tenant data, evaluate moving refresh-token storage to an httpOnly cookie issued by the backend, keeping only the short-lived access token in memory.
- **Generated API clients are hand-written here**, not OpenAPI-generated. They should be replaced by `openapi-generator-cli`-produced clients once the Swagger spec is finalized, to eliminate drift between backend DTOs and frontend types as the API evolves.
