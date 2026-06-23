# iDoo ERP - Architecture Review Report

## 1. Project Structure Analysis
The current codebase establishes a strong foundational structure adhering to Clean Architecture principles. The separation into `core/`, `shared/`, `features/`, and `layout/` is well-defined. Dependency direction correctly flows inward from features to shared to core. However, the implementation of several enterprise-grade patterns is either incomplete or entirely missing, which hinders the framework's ability to act as a fully dynamic ERP.

## 2. Missing Enterprise Patterns
Based on the review, the following critical enterprise patterns are missing or incomplete:
- **Centralized Metadata Registry**: The framework lacks a robust registry for entities, routes, forms, and tables. Currently, features might rely on localized configurations rather than a unified registry where dynamic modules can register themselves.
- **Multi-Tenant Context Management**: There is no centralized `ContextStore` or `ContextFacade` for Tenant, Company, and Branch. Changing context should ideally trigger a unified reactivity wave (via Signals) across menus, permissions, and data queries.
- **Advanced Dynamic Engines**:
  - The **Dynamic Form Engine** exists but lacks evidence of advanced field types (Tree Select, Rich Text), dynamic visibility (conditional rendering), and Stepper forms.
  - The **Dynamic Dialog Engine** needs a centralized service facade for diverse dialog types (Form Dialogs, Approvals, Success/Error).
- **Dashboard & Widget Framework**: No infrastructure exists for injecting and rendering metadata-driven dashboard widgets from different modules.
- **Notification & Audit Frameworks**: Missing real-time (WebSocket) notifications, centralized toast/alert architectures, and reusable audit timeline components.
- **Theme & I18n**: No centralized Theme Framework (Light/Dark, Branding) or structural support for RTL/LTR language switching (Arabic/English).

## 3. Architectural Weaknesses
- **Authentication Lifecycle**: The `auth.service.ts` has an incomplete `restoreSession` method (`// Decode user from JWT or fetch from /me if available`). This breaks session persistence on page reload. Additionally, there's no auto-logout mechanism when tokens expire and silent refresh fails.
- **Tenant Context Injection**: The application currently lacks an HTTP Interceptor to automatically append the `X-Tenant-ID`, `X-Company-ID`, and `X-Branch-ID` headers to outgoing API requests based on the active context.
- **API Facade Adherence**: While the architecture document mandates `Component → Facade → API Client`, it's not strictly enforced yet. There's a risk of components directly calling API services if facades are not universally implemented for all entities.

## 4. Scalability Bottlenecks
- **State Management Overhead**: If RxJS is heavily used for simple state that should be Signals, it creates unnecessary subscriptions and memory leak vectors. The system needs to pivot heavily to `signal()`, `computed()`, and `effect()` for state.
- **Menu and Sidebar Rendering**: If the sidebar iterates over a large, deep tree of modules, it needs memoization or `computed` properties to avoid recalculating permissions on every Angular change detection cycle.
- **Dynamic Table Performance**: The table must strictly use `OnPush` and generic `trackBy` functions to prevent unnecessary re-rendering of large datasets.

## 5. Duplicated Code & SOLID Violations
- Without a Metadata Registry, there's a risk of duplicating route guards, permission strings, and menu configurations across different lazy-loaded modules.
- The `AuthService` currently violates the Single Responsibility Principle by directly interacting with the router and token storage. It should delegate these to effects or specialized services to remain focused on authentication logic.

## 6. Implementation Plan
We will proceed with the following incremental implementation steps:
1. **Core Context & Auth Enhancement**: Complete `AuthService` session recovery, implement `MultiTenantContext` (Store + Facade), and inject context headers via HTTP interceptors.
2. **Metadata Registry**: Build the Entity & Module Metadata Registry.
3. **Dynamic Engines Upgrade**: Enhance Form, Table, and Dialog engines to meet all enterprise requirements.
4. **Shared Components & Frameworks**: Implement robust Notifications, Theme, and Dashboard widget infrastructure.
5. **Refactoring & Optimization**: Enforce Facade usage strictly, replace RxJS state with Signals, and verify `OnPush` change detection everywhere.
