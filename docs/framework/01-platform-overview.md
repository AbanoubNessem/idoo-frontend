# iDoo ERP Platform — Overview

**Version:** 1.0  
**Classification:** Architecture Specification  
**Status:** Approved Blueprint

---

## 1. Vision

The iDoo ERP Frontend Platform is a **metadata-driven, plugin-based enterprise application framework** built on Angular. It is not a collection of screens. It is an engine that renders any business entity — from HR contracts to Fleet vehicles to Accounting journals — from a single unified metadata description, without writing a new Angular component per entity.

Every business screen in the system is **generated**, not coded.

---

## 2. Guiding Principles

| Principle | Meaning |
|---|---|
| **Metadata over code** | Describe what to render, not how to render it |
| **Plugin isolation** | Each ERP module is a self-contained plugin |
| **Zero-framework-change growth** | New modules add plugins, not framework files |
| **Permission-first** | Every rendered element is permission-aware |
| **Signal-native** | Angular Signals drive all state; no Observable subscriptions in UI |
| **API-contract fidelity** | No invented endpoints; all data shapes match `API_CONTRACT.md` |
| **Progressive disclosure** | Simple cases stay simple; complex cases are supported |

---

## 3. Comparison to Industry Platforms

| Concern | SAP Fiori | MS Dynamics | Odoo | iDoo ERP |
|---|---|---|---|---|
| Metadata format | OData annotations | Power Apps metadata | XML views | TypeScript `EntityDef` |
| Extension model | SAPUI5 extensions | PCF components | Python inheritance | Angular Plugin + `forPlugin()` |
| State | Flux / MVC | React state | Owl signals | Angular Signals |
| Rendering | SAPUI5 controls | React components | Owl templates | Angular standalone components |
| Permission model | PFCG roles | Azure AD roles | ACL groups | Effective permission set (backend-driven) |
| Routing | Hash-based manifest | Modular pages | Action windows | Dynamic Angular routes |

---

## 4. Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  Shell · Sidebar · Topbar · Breadcrumb · Layout Engine      │
├─────────────────────────────────────────────────────────────┤
│                       ENGINE LAYER                           │
│  Render Engine · Form Engine · Table Engine · Action Engine │
│  Dialog Engine · Drawer Engine · Widget Engine · Menu Engine │
│  Filter Engine · Validation Engine · Field Engine           │
├─────────────────────────────────────────────────────────────┤
│                      REGISTRY LAYER                          │
│  AppRegistry · EntityRegistry · PluginRegistry              │
│  FormRegistry · TableRegistry · ActionRegistry              │
│  FieldRegistry · WidgetRegistry · MenuRegistry · RouteRegistry│
├─────────────────────────────────────────────────────────────┤
│                     PLATFORM LAYER                           │
│  Permission Engine · Event Bus · State Management           │
│  Context (Tenant/Company/Branch) · Session · Logger         │
├─────────────────────────────────────────────────────────────┤
│                       API LAYER                              │
│  HTTP Clients · Interceptors · DTOs · Error Handling        │
└─────────────────────────────────────────────────────────────┘
           ↕ REST/JSON  ↕ JWT  ↕ X-Tenant-ID
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Spring Boot — COMPLETED)               │
│          http://localhost:8080/api/v1/{resource}             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. The Plugin Model

Every ERP domain (HR, Fleet, CRM, etc.) is a **Plugin**. A plugin:

- Declares itself with a `PluginDef` object
- Registers entities, forms, tables, actions, menus, widgets
- Provides routes via Angular's `providePlugin()` factory
- Has no dependencies on other plugins (loose coupling via events)
- Can be enabled/disabled at runtime based on backend module activation

```
Core Platform (always loaded)
    ├── AUTH plugin     (users, roles, permissions)
    ├── CORE plugin     (tenants, companies, branches, departments)
    │
    Future plugins (loaded on demand):
    ├── HR plugin
    ├── CRM plugin
    ├── FLEET plugin
    ├── ACCOUNTING plugin
    ├── INVENTORY plugin
    ├── PROCUREMENT plugin
    ├── ASSETS plugin
    ├── POS plugin
    ├── MANUFACTURING plugin
    └── HELPDESK plugin
```

---

## 6. The Metadata Pipeline

```
Developer writes EntityDef
         │
         ▼
Plugin registers EntityDef via forPlugin()
         │
         ▼
AppRegistry stores EntityDef
         │
         ▼
RouteRegistry generates Angular routes
MenuRegistry builds navigation
         │
         ▼
User navigates to /app/hr/employees
         │
         ▼
RenderEngine reads EntityDef.table
         │
         ▼
TableEngine renders paginated data table
         │
         ▼
User clicks "Create"
         │
         ▼
RenderEngine reads EntityDef.form
         │
         ▼
FormEngine renders dynamic reactive form
         │
         ▼
User submits → ActionEngine calls API
         │
         ▼
Response → TableEngine refreshes
```

---

## 7. Module Codes

Each plugin corresponds to a backend `ModuleCode`. Backend `GET /v1/modules` returns active modules. The platform uses this to:

- Enable/disable plugin routes and menu items
- Filter visible menu items for the current user
- Verify `module.isActive` before rendering any entity

| Plugin | Backend ModuleCode | Route Prefix |
|---|---|---|
| Core | `CORE` | `/app/core` |
| Auth | `AUTH` | `/app/auth` |
| HR | `HR` | `/app/hr` |
| CRM | `CRM` | `/app/crm` |
| Fleet | `FLEET` | `/app/fleet` |
| Accounting | `ACCOUNTING` | `/app/accounting` |
| Inventory | `INVENTORY` | `/app/inventory` |
| Procurement | `PROCUREMENT` | `/app/procurement` |
| Assets | `ASSETS` | `/app/assets` |
| POS | `POS` | `/app/pos` |
| Manufacturing | `MFG` | `/app/mfg` |
| Help Desk | `HELPDESK` | `/app/helpdesk` |

---

## 8. Non-Goals

The platform does NOT:

- Manage backend database schema
- Generate backend code
- Build pixel-perfect custom designs per entity
- Replace Angular CLI or Angular Material
- Implement a visual low-code builder (Phase 3+ only)
- Load plugins from a CDN at runtime (Phase 3+)
