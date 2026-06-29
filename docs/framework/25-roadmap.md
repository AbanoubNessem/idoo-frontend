# iDoo ERP Platform — Roadmap

---

## 1. Overview

This document tracks the phased implementation plan for the iDoo ERP Frontend Platform. The architecture described in this blueprint is complete. This document translates it into a concrete delivery sequence.

---

## 2. Phase 0 — Foundation (COMPLETE)

Infrastructure built and verified. All items below are done:

- [x] Angular 22+ project structure
- [x] Authentication flow (login → tenant selection → session restore)
- [x] JWT interceptor + token refresh
- [x] Context interceptor (X-Tenant-ID, X-Company-ID, X-Branch-ID)
- [x] Error interceptor (401/403/404/500 handling)
- [x] Logging interceptor
- [x] API base URL unified (`http://localhost:8080/api`)
- [x] DTO models aligned to backend contract
- [x] PermissionStateService + HasPermissionDirective
- [x] RegistryFacade with signal-based RegistryState
- [x] APP_INITIALIZER chain (registry → session restore)
- [x] Shell layout (sidebar, topbar, router-outlet)
- [x] Dashboard page (placeholder)
- [x] 4 infrastructure documentation files generated

---

## 3. Phase 1 — Platform Engine Core (NEXT)

**Goal:** All platform engines implemented and working with a single reference entity.
**Target entity:** HR Employee (used as the reference test case for every engine)

### 1.1 Registry System
- [ ] Implement signal-based `EntityRegistry`, `FormRegistry`, `TableRegistry`
- [ ] Implement `ActionRegistry`, `MenuRegistry`, `RouteRegistry`
- [ ] Implement `WidgetRegistry`, `FieldRegistry`, `FilterRegistry`
- [ ] Implement `AppRegistry` coordinator
- [ ] Implement `providePlugin()` function
- [ ] Write `PLUGIN_DEF_TOKEN` multi-provider wiring

### 1.2 Render Engine
- [ ] Implement `EntityViewComponent` (URL→mode resolution)
- [ ] Implement `PageHeaderComponent`
- [ ] Implement `BreadcrumbService`

### 1.3 Table Engine
- [ ] Implement `EntityDataSource` (signals-based, pagination/sort/search/filter)
- [ ] Implement `TableEngineComponent` (all column types)
- [ ] Implement `TableSkeletonComponent`
- [ ] Implement `EmptyStateComponent`
- [ ] Implement `ErrorStateComponent`
- [ ] Implement `PaginationStateService`
- [ ] Implement `CellRendererRegistry`
- [ ] Implement `TableSelectionManager`
- [ ] Implement `ExportService` (CSV)

### 1.4 Form Engine
- [ ] Implement `FormBuilderService`
- [ ] Implement `FormEngineComponent` (sections, grid, conditional fields)
- [ ] Implement `FieldEngine` + `FieldWrapperComponent`
- [ ] Implement all built-in field components (20+ types)
- [ ] Implement `FormErrorMapperService`
- [ ] Implement `UnsavedChangesGuard`

### 1.5 Filter Engine
- [ ] Implement `FilterBarComponent`
- [ ] Implement `FilterEngineService`
- [ ] Implement `FilterUrlSyncService`
- [ ] Implement all filter type renderers

### 1.6 Action Engine
- [ ] Implement `ActionEngine` (permission → confirm → execute → feedback)
- [ ] Implement `ActionBarComponent`
- [ ] Implement `BulkActionBarComponent`
- [ ] Implement `HotkeyService`

### 1.7 Validation Engine
- [ ] Implement `ValidatorRegistry` + all built-in validators
- [ ] Implement `AsyncValidatorRegistry`
- [ ] Implement `FieldErrorComponent`

### 1.8 Dialog Engine
- [ ] Implement `DialogEngine` service
- [ ] Implement `DialogShellComponent`
- [ ] Implement `ConfirmDialogComponent`
- [ ] Implement `FormDialogComponent`
- [ ] Implement `PickerDialogComponent`

### 1.9 Drawer Engine
- [ ] Implement `DrawerEngine` service
- [ ] Implement `DrawerShellComponent`

### 1.10 Event Bus
- [ ] Implement `EventBus` service
- [ ] Wire `ActionEngine` → `EventBus` → `TableEngine` refresh

### 1.11 Menu Engine
- [ ] Wire `MenuEngine` to `MenuRegistry` + permission filter
- [ ] Implement badge counts
- [ ] Implement `MenuBadgeService`
- [ ] Implement collapsed sidebar icon mode

**Milestone:** HR Employee full CRUD working end-to-end (list, create, view, edit, delete) using only `EmployeeEntityDef` metadata — zero per-entity component code.

---

## 4. Phase 2 — HR Module Complete

With engines stable, implement all HR entities:

- [ ] Employee (full CRUD + workflow: ACTIVE/INACTIVE/SUSPENDED)
- [ ] Department (CRUD)
- [ ] Job Title (CRUD)
- [ ] Branch Assignment (relation panel on Employee)
- [ ] Role Assignment (relation panel on Employee)
- [ ] Employee Dashboard (headcount widget, status distribution widget)

---

## 5. Phase 3 — Auth Module Complete

- [ ] Users (CRUD + role assignment)
- [ ] Roles (CRUD + permission assignment)
- [ ] Tenants (CRUD)
- [ ] Companies (CRUD per tenant)
- [ ] Branches (CRUD per company)

---

## 6. Phase 4 — Widget Engine + Dashboard

- [ ] Implement `WidgetEngine` + `DashboardGridComponent`
- [ ] Implement `WidgetHostComponent`
- [ ] Implement all core widgets (KPI card, charts, activity feed, quick links)
- [ ] Implement dashboard persistence (`GET/PUT /v1/users/{id}/dashboard`)
- [ ] Implement widget configuration via `DrawerEngine`

---

## 7. Phase 5 — Fleet Module

- [ ] Vehicles (CRUD + workflow: AVAILABLE/IN_USE/MAINTENANCE/RETIRED)
- [ ] Maintenance records (relation panel on Vehicle)
- [ ] Driver assignment (action + Event Bus → HR)
- [ ] Fleet utilization dashboard widget
- [ ] Custom `vehicle-status` cell renderer

---

## 8. Phase 6 — Remaining ERP Modules

Implement one module per sprint using the established pattern:

| Sprint | Module |
|---|---|
| 6 | CRM (Customers, Opportunities, Activities) |
| 7 | Inventory (Products, Warehouses, Stock) |
| 8 | Procurement (Purchase Orders, Vendors, Receipts) |
| 9 | Accounting (Chart of Accounts, Journals, Reports) |
| 10 | POS (Products, Sessions, Transactions) |
| 11 | Assets (Fixed Assets, Depreciation, Disposal) |
| 12 | Help Desk (Tickets, SLA, Escalation) |
| 13 | Manufacturing (BOMs, Production Orders) |

---

## 9. Phase 7 — Platform Hardening

- [ ] Internationalization (i18n) via Angular i18n + locale-aware pipes
- [ ] Dark mode theming
- [ ] Print layout service
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] E2E test suite (Playwright) for all engine flows
- [ ] Unit tests for all engine services (>80% coverage)
- [ ] Performance audit (bundle size, Lighthouse)
- [ ] Override Registry (tenant-specific metadata customizations)
- [ ] Mobile responsive audit

---

## 10. Phase 8 — Advanced Features

- [ ] Global search (across all entities)
- [ ] Real-time notifications (WebSocket / SSE)
- [ ] Offline mode (Service Worker + IndexedDB queue)
- [ ] Report builder (drag-and-drop report columns)
- [ ] Data import UI (CSV upload → validation → preview → commit)
- [ ] Audit trail viewer (per-record history)
- [ ] Multi-language support (Arabic RTL layout)

---

## 11. Architecture Stability Contract

The following are frozen after Phase 1 and must NOT be changed without a formal breaking-change review:

1. `EntityDef` interface
2. `FormSchema` / `FormFieldDef` interfaces
3. `TableDef` / `ColumnDef` interfaces
4. `ActionDef` / `ActionScope` types
5. `PluginDef` interface and `providePlugin()` signature
6. `PLUGIN_DEF_TOKEN` injection token
7. Permission string format (`MODULE:resource:action`)
8. API response envelope (`{ success, data, message?, error?, timestamp? }`)
9. Pagination format (zero-based, Spring Data Pageable)

Changes to these interfaces require:
- Migration guide written
- All existing plugins updated
- Version bump of `@idoo/platform`
