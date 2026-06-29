# iDoo Platform Architecture Specification

**Version:** 1.0.0  
**Status:** CANONICAL — This document is the constitution of the iDoo Platform  
**Classification:** Internal Architecture Reference  
**Authors:** Chief Software Architect  
**Date:** 2026-06-28  

---

> "The frontend is NOT an Angular application. The frontend is an Enterprise Platform. Angular is only an implementation detail."

---

## Table of Contents

1. [Platform Philosophy](#1-platform-philosophy)
2. [Core Principles](#2-core-principles)
3. [System Topology](#3-system-topology)
4. [Platform Kernel](#4-platform-kernel)
5. [IOC Container](#5-ioc-container)
6. [Registry Manager](#6-registry-manager)
7. [Plugin System](#7-plugin-system)
8. [Metadata System](#8-metadata-system)
9. [Platform Runtime](#9-platform-runtime)
10. [Rendering Pipeline](#10-rendering-pipeline)
11. [UI Adapter Layer](#11-ui-adapter-layer)
12. [Dynamic Engines](#12-dynamic-engines)
13. [Event Bus](#13-event-bus)
14. [Command Bus](#14-command-bus)
15. [State Management](#15-state-management)
16. [Security](#16-security)
17. [Extension Model](#17-extension-model)
18. [Platform SDK](#18-platform-sdk)
19. [Folder Structure](#19-folder-structure)
20. [Naming Conventions](#20-naming-conventions)
21. [Performance](#21-performance)
22. [Testing Strategy](#22-testing-strategy)
23. [Architecture Decision Records](#23-architecture-decision-records)
24. [Future Roadmap](#24-future-roadmap)
25. [Self Review](#25-self-review)

---

## 1. Platform Philosophy

### 1.1 The Fundamental Distinction

Most enterprise frontend projects are Angular applications that contain business modules.

The iDoo platform is the opposite: a **software platform** that uses Angular as one of its implementation details.

This distinction is not semantic. It defines every architectural decision in this document.

| Dimension | Application Mindset | Platform Mindset |
|---|---|---|
| Angular | The framework | An adapter |
| PrimeNG | The UI library | A replaceable component provider |
| Business module | A feature | A plugin |
| Screen | A component | A rendered metadata declaration |
| Permission check | An `if` statement | A platform capability gate |
| Navigation | A router config | A runtime-resolved registry |
| Form | A template | A rendered schema |
| State | A service | A scoped context |

### 1.2 The Three Rings

The platform is organized into three concentric rings of responsibility:

```
┌─────────────────────────────────────────────────────────────────┐
│  RING 3 — Business Domain                                        │
│  (HR, Fleet, CRM, POS, Inventory, Accounting, ...)             │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  RING 2 — Platform Engines                                 │  │
│  │  (Form, Table, Action, Workflow, Dialog, Drawer, ...)     │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  RING 1 — Platform Kernel                            │  │  │
│  │  │  (Kernel, IOC, Registry, Event Bus, Command Bus,    │  │  │
│  │  │   Runtime, Security, State, UI Adapter)             │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Dependency direction:** Ring 3 depends on Ring 2. Ring 2 depends on Ring 1. Ring 1 depends on nothing business-specific. Dependencies never flow inward.

### 1.3 The Platform Contract

The Platform Contract is the public interface through which business modules interact with the platform. It is a stable, versioned TypeScript API surface:

```typescript
interface PlatformAPI {
  readonly kernel:      KernelAPI;
  readonly registry:    RegistryAPI;
  readonly runtime:     RuntimeAPI;
  readonly events:      EventBusAPI;
  readonly commands:    CommandBusAPI;
  readonly state:       StateAPI;
  readonly security:    SecurityAPI;
  readonly engines:     EngineRegistry;
  readonly sdk:         PluginSDK;
}
```

Business modules receive a `PlatformAPI` instance at boot. They never import from `@angular/core`, never import from `primeng`, and never import from sibling plugins.

---

## 2. Core Principles

### P1 — Plugin First

Every business feature is a plugin. Nothing exists outside the plugin model. The platform itself is a plugin host, not a monolith. A feature added as a plugin can be removed without touching any other code.

### P2 — Metadata First

Screens, forms, tables, workflows, permissions, and menus are data — not code. The source of truth for any business screen is a metadata object (`EntityDef`, `FormSchema`, `WorkflowDef`), not a hand-written component. Behaviour is declared, not programmed.

### P3 — Configuration over Code

When a developer needs to add a new entity, the correct path is: write a metadata definition. NOT: write a component. The platform renders from configuration. Code is only written when configuration is insufficient, and that code is isolated in the extension layer.

### P4 — Runtime Rendering

Screens are not compiled into the bundle. They are assembled at runtime from metadata retrieved from registries. This means: the set of screens available in the running application is determined at runtime, not at compile time.

### P5 — Registry Driven

Every artifact — entity definitions, routes, menu items, actions, permissions, form schemas, table definitions, widgets, field types — is registered in a named registry. The platform discovers capabilities through registries, not through hard-coded imports.

### P6 — Event Driven

Components, engines, and plugins communicate through typed domain events on the Event Bus, not through direct method calls or shared mutable state. Events are facts about what happened. Reactions are registered independently of the events that trigger them.

### P7 — Capability Based

A feature is gated not by "is the user an admin?" but by "does the current context have this capability?" Capabilities are declared in plugin manifests and resolved at runtime against the user's effective permission set, active modules, and feature flags.

### P8 — Dependency Inversion

The Platform Kernel does not depend on any engine. Engines do not depend on any plugin. Plugins depend on the Platform API (an abstraction), not on the Kernel implementation. High-level modules never depend on low-level modules. Both depend on abstractions.

### P9 — Open/Closed Principle

The Platform Kernel is **closed for modification** but **open for extension**. Adding a new ERP module requires zero changes to platform code. Adding a new field type requires registering in `FieldRegistry`, not modifying `FormEngineComponent`.

### P10 — Backward Compatibility

The Platform API is semantically versioned. A plugin built against Platform v1.3 must continue to work on Platform v1.9 without modification. Breaking changes are only permitted in major versions and require a published migration guide. The Metadata system includes schema versioning and a migration runner.

### P11 — Extensibility

Every engine provides named extension points. Every registry accepts third-party registrations. Every lifecycle has hooks. No engine or registry is sealed. External developers — not just the iDoo team — can extend every part of the platform.

### P12 — Testability

Every platform service is injectable and replaceable. Every engine is testable in isolation with a mock adapter. Every plugin is testable in a headless platform host. Metadata definitions are unit-testable without a browser.

### P13 — High Performance

The platform is designed for datasets of 100,000+ records, forms with 200+ fields, dashboards with 30+ simultaneous widgets, and 50+ concurrent users in a single browser session. Virtual rendering, lazy loading, streaming, and signal-based change detection are built into the core, not added as afterthoughts.

### P14 — Replaceable UI Framework

Angular is accessed only through the `UIAdapter` interface. Every engine renders through the adapter. If Angular is replaced with React or Vue in 5 years, only the `UIAdapter` implementation changes. All engines, registries, and plugin metadata remain unchanged.

### P15 — Replaceable Component Library

PrimeNG components are never referenced directly in any engine, plugin, or shared component. They are accessed through `PlatformComponent` wrappers defined in the `UIAdapter` layer. If PrimeNG is replaced with Shadcn or Material, only the adapter implementations change.

---

## 3. System Topology

### 3.1 Dependency Graph

```
┌────────────────────────────────────────────────────────────────────────┐
│  Business Plugins (HR, Fleet, CRM, ...)                                │
│  Depend on: Platform API only                                          │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ Platform API
┌──────────────────────────────▼─────────────────────────────────────────┐
│  Platform Engines Layer                                                 │
│  FormEngine  TableEngine  ActionEngine  WorkflowEngine  WidgetEngine   │
│  DialogEngine  DrawerEngine  FilterEngine  SearchEngine  ImportEngine  │
│  ExportEngine  AuditEngine  NotificationEngine  ValidationEngine       │
│  DashboardEngine  ToolbarEngine  LayoutEngine  PermissionEngine        │
│  Depend on: Platform Kernel, UI Adapter                                │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ Kernel API
┌──────────────────────────────▼─────────────────────────────────────────┐
│  Platform Kernel                                                        │
│  Kernel  IOCContainer  RegistryManager  EventBus  CommandBus           │
│  StateManager  SecurityManager  RuntimeContext  PluginHost             │
│  Depend on: UI Adapter (through DI), nothing else platform-specific    │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ UI Adapter API
┌──────────────────────────────▼─────────────────────────────────────────┐
│  UI Adapter Layer                                                       │
│  AngularAdapter → Angular 22  →  PlatformComponents  →  PrimeNG        │
│  [Future: ReactAdapter, VueAdapter]                                     │
│  Depend on: Angular, PrimeNG (isolated here)                           │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Runtime Layer Map

```
Browser
  └── Angular Bootstrap
        └── PlatformKernel.boot()
              ├── IOCContainer.initialize()
              ├── PluginHost.loadAll()                     // loads all registered plugins
              │     └── For each plugin:
              │           ├── validate(manifest)
              │           ├── register(entities, menus, routes, actions, ...)
              │           └── initialize()
              ├── SecurityManager.restoreSession()
              ├── RouteRegistry.build()                    // generates Angular routes
              └── Runtime ready → first navigation
```

---

## 4. Platform Kernel

### 4.1 Responsibilities

The Platform Kernel is the smallest possible core that must be loaded before any screen renders. It has exactly seven responsibilities:

1. **Bootstrap:** Orchestrate the initialization sequence
2. **Dependency Resolution:** Provide the IOC container
3. **Plugin Hosting:** Load, validate, initialize, and unload plugins
4. **Registry Coordination:** Own all registry instances and their lifecycle
5. **Event Bus:** Provide the message backbone
6. **Command Bus:** Provide the command execution pipeline
7. **Runtime Context:** Maintain the current execution context (user, tenant, company, branch, locale, permissions)

The Kernel does NOT render UI. The Kernel does NOT know about forms, tables, or workflows. The Kernel does NOT contain business logic.

### 4.2 Boot Sequence

The boot sequence is an ordered, async pipeline. Each step must complete before the next begins. Any step failure halts the boot and renders the platform error screen.

```
Step 0: Angular Bootstrap
  └── PlatformModule.forRoot(config) loaded

Step 1: IOC Container Initialize
  └── Register all kernel services as singletons

Step 2: Configuration Load
  └── Load environment config (apiUrl, features, etc.)
  └── Validate required config keys

Step 3: UI Adapter Initialize
  └── AngularAdapter registers PlatformComponent implementations

Step 4: Plugin Discovery
  └── Read all PLUGIN_MANIFEST tokens (multi-provider)
  └── Build dependency graph
  └── Validate all manifests (schema, dependencies, version compatibility)

Step 5: Plugin Registration
  └── For each plugin (dependency-ordered):
        ├── Register entities → EntityRegistry
        ├── Register forms → FormRegistry
        ├── Register tables → TableRegistry
        ├── Register actions → ActionRegistry
        ├── Register menu items → MenuRegistry
        ├── Register routes → RouteRegistry
        ├── Register widgets → WidgetRegistry
        ├── Register field types → FieldRegistry
        ├── Register validators → ValidatorRegistry
        ├── Register workflows → WorkflowRegistry
        ├── Register filters → FilterRegistry
        ├── Register permissions → PermissionRegistry
        ├── Register reports → ReportRegistry
        └── Register notifications → NotificationRegistry

Step 6: Security Initialize
  └── Restore session (read tokens from storage)
  └── If session valid: load user profile + effective permissions
  └── If session invalid: clear storage, mark unauthenticated

Step 7: Route Build
  └── RouteRegistry.buildAngularRoutes()
  └── Inject routes into Angular Router

Step 8: Runtime Ready
  └── Emit KernelEvent.READY
  └── First navigation triggers
```

### 4.3 Kernel API

```typescript
interface KernelAPI {
  // Lifecycle
  readonly status: Signal<KernelStatus>;
  onReady(handler: () => void): void;
  onShutdown(handler: () => void): void;

  // Registry access
  readonly registry: RegistryAPI;

  // Plugin management
  readonly plugins: PluginHostAPI;

  // Diagnostics
  getHealthReport(): KernelHealthReport;
  getVersion(): PlatformVersion;
}

type KernelStatus =
  | 'booting'
  | 'ready'
  | 'degraded'      // some plugins failed to load, platform is functional
  | 'error'         // kernel itself failed
  | 'shutting-down';

interface PlatformVersion {
  major: number;
  minor: number;
  patch: number;
  build: string;
}
```

### 4.4 Kernel Events

The Kernel emits these reserved events on the Event Bus:

| Event | When |
|---|---|
| `kernel:booting` | Boot sequence starts |
| `kernel:ready` | All plugins loaded, routing built |
| `kernel:plugin:loaded` | A plugin finishes loading |
| `kernel:plugin:failed` | A plugin fails to load |
| `kernel:plugin:unloaded` | A plugin is unloaded |
| `kernel:shutdown` | Platform is shutting down |
| `kernel:health:degraded` | Health check fails |

### 4.5 Shutdown Sequence

```
PlatformKernel.shutdown()
  ├── Emit kernel:shutdown
  ├── Cancel all pending HTTP requests
  ├── Flush Event Bus queue
  ├── For each plugin (reverse dependency order):
  │     └── plugin.onUnload()
  ├── Clear SecurityManager state
  ├── Clear all registries
  └── Angular destroys application
```

### 4.6 Health Checks

The Kernel exposes a health check API for diagnostics dashboards and monitoring:

```typescript
interface KernelHealthReport {
  status: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  plugins: PluginHealthReport[];
  registries: RegistryHealthReport[];
  apiConnectivity: boolean;
  authStatus: 'authenticated' | 'unauthenticated' | 'expired';
  memoryUsage: MemoryReport;
}
```

---

## 5. IOC Container

### 5.1 Design

The IOC (Inversion of Control) Container manages the lifecycle and resolution of all platform services. It is layered: platform services live at the root scope, plugin services live at the plugin scope, and component services live at the component scope.

The Platform IOC Container wraps Angular's DI system but abstracts it behind a `Container` interface. This ensures that if Angular's DI model changes or a non-Angular adapter is used, no engine code changes.

### 5.2 Service Scopes

```typescript
type ServiceScope =
  | 'singleton'    // One instance per platform runtime (root-level)
  | 'plugin'       // One instance per plugin (plugin-level providers)
  | 'transient'    // New instance per resolution
  | 'request'      // One instance per HTTP request (server-side only)
  | 'component';   // One instance per component tree (Angular injector hierarchy)
```

### 5.3 Registration

Services are registered through the IOC Container during initialization:

```typescript
interface Container {
  register<T>(token: InjectionToken<T>, factory: () => T, scope: ServiceScope): void;
  registerClass<T>(token: InjectionToken<T>, cls: Type<T>, scope: ServiceScope): void;
  registerValue<T>(token: InjectionToken<T>, value: T): void;
  resolve<T>(token: InjectionToken<T>): T;
  createChildScope(name: string): Container;
}
```

### 5.4 Platform Service Registration Map

| Service | Scope | Token |
|---|---|---|
| `KernelService` | singleton | `KERNEL_TOKEN` |
| `EventBusService` | singleton | `EVENT_BUS_TOKEN` |
| `CommandBusService` | singleton | `COMMAND_BUS_TOKEN` |
| `RegistryManager` | singleton | `REGISTRY_MANAGER_TOKEN` |
| `SecurityManager` | singleton | `SECURITY_MANAGER_TOKEN` |
| `StateManager` | singleton | `STATE_MANAGER_TOKEN` |
| `PluginHost` | singleton | `PLUGIN_HOST_TOKEN` |
| `RuntimeContext` | singleton | `RUNTIME_CONTEXT_TOKEN` |
| `UIAdapter` | singleton | `UI_ADAPTER_TOKEN` |
| `FormEngine` | singleton | `FORM_ENGINE_TOKEN` |
| `TableEngine` | singleton | `TABLE_ENGINE_TOKEN` |
| `ActionEngine` | singleton | `ACTION_ENGINE_TOKEN` |
| Plugin services | plugin | Defined by plugin manifest |

### 5.5 Plugin Scope

When a plugin loads, the Kernel creates a child `Container` scoped to that plugin:

```typescript
const pluginContainer = rootContainer.createChildScope(plugin.id);
plugin.manifest.services.forEach(svc => {
  pluginContainer.register(svc.token, svc.factory, svc.scope);
});
```

Services in the plugin scope can resolve root-scope services (upward resolution). Root services cannot resolve plugin services (no downward dependency). This enforces Ring architecture.

### 5.6 Lazy Service Loading

Plugin-scoped services are not instantiated until first resolution. The `Container` supports lazy factories:

```typescript
container.register(TOKEN, () => new HeavyService(dep1, dep2), 'plugin');
// HeavyService is not constructed until container.resolve(TOKEN) is called
```

---

## 6. Registry Manager

### 6.1 Overview

The Registry Manager is the central coordinator for all platform registries. It owns the lifecycle of 15 named registries and provides a unified access API. Each registry is a typed, signal-based collection that supports registration, lookup, enumeration, and change observation.

### 6.2 Registry Base Contract

All registries implement this interface:

```typescript
interface Registry<K, V> {
  readonly name: string;
  readonly version: string;
  
  register(key: K, value: V): void;
  unregister(key: K): void;
  get(key: K): V | null;
  getOrThrow(key: K): V;
  has(key: K): boolean;
  getAll(): Map<K, V>;
  
  readonly entries: Signal<Map<K, V>>;         // reactive enumeration
  readonly count: Signal<number>;
  
  onChange(key: K, handler: (value: V | null) => void): Unsubscribe;
}
```

### 6.3 Registry Catalogue

#### 6.3.1 EntityRegistry

Stores `EntityDef` objects. Key: `'{pluginCode}:{entityName}'` (e.g., `'hr:employee'`).

```typescript
interface EntityRegistry extends Registry<string, EntityDef> {
  getByPluginId(pluginId: string): EntityDef[];
  search(query: string): EntityDef[];         // for global search
  getSearchable(): EntityDef[];               // entities with searchable: true
}
```

#### 6.3.2 RouteRegistry

Stores `RouteDef` objects and builds Angular `Route[]` from them.

```typescript
interface RouteRegistry extends Registry<string, RouteDef> {
  buildAngularRoutes(): Route[];
  getByEntityId(entityId: string): RouteDef | null;
}
```

#### 6.3.3 MenuRegistry

Stores `MenuItemDef` objects. Builds the navigation tree from flat items.

```typescript
interface MenuRegistry extends Registry<string, MenuItemDef> {
  getTree(context: RuntimeContext): MenuItemDef[];   // filtered by permissions + active modules
  setBadge(itemId: string, count: number): void;
  clearBadge(itemId: string): void;
}
```

#### 6.3.4 ActionRegistry

Stores `ActionDef` objects indexed by entity ID and scope.

```typescript
interface ActionRegistry extends Registry<string, ActionDef> {
  getByEntityAndScope(entityId: string, scope: ActionScope): ActionDef[];
  getWorkflowActions(entityId: string, currentStatus: string): ActionDef[];
}
```

#### 6.3.5 PermissionRegistry

Stores the canonical list of all permission codes declared by all plugins. Used for validation and documentation.

```typescript
interface PermissionRegistry extends Registry<string, PermissionDef> {
  validate(permissionCode: string): boolean;
  getByModule(moduleCode: string): PermissionDef[];
  getAll(): PermissionDef[];
}

interface PermissionDef {
  code: string;          // 'HR:employees:create'
  module: string;        // 'HR'
  resource: string;      // 'employees'
  action: PermissionAction;
  label: string;
  description?: string;
}
```

#### 6.3.6 FieldRegistry

Stores `FieldComponentDef` objects for custom and built-in field types.

```typescript
interface FieldRegistry extends Registry<string, FieldComponentDef> {
  resolve(type: string): FieldComponentDef;   // falls back to 'text' if unknown
}
```

#### 6.3.7 WidgetRegistry

Stores `WidgetDef` objects for dashboard widgets.

```typescript
interface WidgetRegistry extends Registry<string, WidgetDef> {
  getByPermission(context: RuntimeContext): WidgetDef[];
}
```

#### 6.3.8 TableRegistry

Stores `TableDef` objects. Key: entity ID.

```typescript
interface TableRegistry extends Registry<string, TableDef> {}
```

#### 6.3.9 FormRegistry

Stores `FormSchema` objects. Key: `'{entityId}:{mode}'` (e.g., `'hr:employee:create'`).

```typescript
interface FormRegistry extends Registry<string, FormSchema> {
  getForEntity(entityId: string, mode: FormMode): FormSchema | null;
}
```

#### 6.3.10 LayoutRegistry

Stores `LayoutDef` objects. Allows plugins to declare custom page layouts.

```typescript
interface LayoutRegistry extends Registry<string, LayoutDef> {
  getDefault(): LayoutDef;
  getForEntity(entityId: string): LayoutDef;
}
```

#### 6.3.11 WorkflowRegistry

Stores `WorkflowDef` objects. Key: entity ID.

```typescript
interface WorkflowRegistry extends Registry<string, WorkflowDef> {
  getTransitions(entityId: string, fromStatus: string): WorkflowTransitionDef[];
  getNextStates(entityId: string, fromStatus: string): string[];
}
```

#### 6.3.12 SearchRegistry

Stores `SearchDef` objects that describe how each entity participates in global search.

```typescript
interface SearchRegistry extends Registry<string, SearchDef> {}

interface SearchDef {
  entityId: string;
  resultLabelField: string;
  resultSubtitleField?: string;
  resultIconField?: string;
  apiSearchPath: string;     // e.g. '/v1/hr/employees?search={query}'
  permission: string;
}
```

#### 6.3.13 NotificationRegistry

Stores `NotificationHandlerDef` objects. Plugins register handlers for specific notification event types.

```typescript
interface NotificationRegistry extends Registry<string, NotificationHandlerDef> {}

interface NotificationHandlerDef {
  eventType: string;
  icon: string;
  labelTemplate: string;     // e.g. 'New ticket: {title}'
  routerLink?: (payload: unknown) => string[];
}
```

#### 6.3.14 ReportRegistry

Stores `ReportDef` objects.

```typescript
interface ReportRegistry extends Registry<string, ReportDef> {
  getByModule(moduleCode: string): ReportDef[];
}

interface ReportDef {
  id: string;
  name: string;
  description?: string;
  permission: string;
  moduleCode: string;
  component?: () => Promise<Type<unknown>>;   // custom report component
  schema?: ReportSchema;                       // metadata-driven report (Phase 2)
}
```

#### 6.3.15 DashboardRegistry

Stores `DashboardDef` objects. Each plugin can declare default dashboards.

```typescript
interface DashboardRegistry extends Registry<string, DashboardDef> {
  getDefault(context: RuntimeContext): DashboardDef;
  getUserDashboard(userId: string): Promise<DashboardDef | null>;
}
```

### 6.4 Registry Manager API

```typescript
interface RegistryAPI {
  entity:       EntityRegistry;
  route:        RouteRegistry;
  menu:         MenuRegistry;
  action:       ActionRegistry;
  permission:   PermissionRegistry;
  field:        FieldRegistry;
  widget:       WidgetRegistry;
  table:        TableRegistry;
  form:         FormRegistry;
  layout:       LayoutRegistry;
  workflow:     WorkflowRegistry;
  search:       SearchRegistry;
  notification: NotificationRegistry;
  report:       ReportRegistry;
  dashboard:    DashboardRegistry;
}
```

---

## 7. Plugin System

### 7.1 Plugin Definition

A plugin is the unit of deployable business capability. Every ERP module is a plugin. The platform itself ships two built-in plugins: `PLATFORM_CORE` and `PLATFORM_AUTH`.

```typescript
interface PluginManifest {
  // Identity
  id: string;                       // Uppercase code: 'HR', 'FLEET', 'CRM'
  name: string;                     // 'Human Resources'
  version: string;                  // SemVer: '1.0.0'
  platformVersion: string;          // Minimum platform version required: '^1.0.0'
  
  // Dependencies
  dependencies?: PluginDependency[];
  optionalDependencies?: PluginDependency[];
  
  // Capabilities
  capabilities: PluginCapability[];  // What this plugin provides
  
  // Registrations
  entities:      EntityDef[];
  menus:         MenuItemDef[];
  routes:        RouteDef[];
  actions:       ActionDef[];
  permissions:   PermissionDef[];
  widgets:       WidgetDef[];
  reports:       ReportDef[];
  dashboards?:   DashboardDef[];
  notifications?: NotificationHandlerDef[];
  
  // Services (IOC registrations)
  services?: ServiceRegistration[];
  
  // Lifecycle
  onInit?:   (platform: PlatformAPI) => Promise<void>;
  onReady?:  (platform: PlatformAPI) => void;
  onUnload?: (platform: PlatformAPI) => Promise<void>;
}

interface PluginDependency {
  pluginId: string;
  version: string;          // SemVer range: '^1.0.0'
}

interface PluginCapability {
  id: string;               // e.g. 'payroll', 'approvals', 'bulk-import'
  description: string;
}
```

### 7.2 Plugin Lifecycle

```
DISCOVERED → VALIDATED → REGISTERING → REGISTERED → INITIALIZING → ACTIVE
                                                                        │
                                                                    UNLOADING → UNLOADED
```

| State | Description |
|---|---|
| `DISCOVERED` | Plugin manifest found via PLUGIN_MANIFEST_TOKEN |
| `VALIDATED` | Manifest schema valid, dependencies satisfied, platform version compatible |
| `REGISTERING` | All registry entries being populated |
| `REGISTERED` | All metadata in registries; routes, menus, actions available |
| `INITIALIZING` | `plugin.onInit()` executing (async services, data loading) |
| `ACTIVE` | Plugin fully operational |
| `UNLOADING` | `plugin.onUnload()` executing (cleanup) |
| `UNLOADED` | Registry entries removed, services destroyed |
| `FAILED` | Any lifecycle step threw — kernel continues without this plugin (degraded) |

### 7.3 Plugin Registration Pattern

Plugins are registered in `app.config.ts` via the `providePlugin()` function:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    providePlatform({ apiUrl: 'http://localhost:8080/api' }),
    providePlugin(HrPluginManifest),
    providePlugin(FleetPluginManifest),
    providePlugin(CrmPluginManifest),
  ]
};

// providePlugin implementation (platform SDK)
export function providePlugin(manifest: PluginManifest): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PLUGIN_MANIFEST_TOKEN, useValue: manifest, multi: true },
  ]);
}
```

The `PLUGIN_MANIFEST_TOKEN` is a multi-provider injection token. The `PluginHost` reads all registered manifests and processes them in dependency order during boot Step 4–5.

### 7.4 Plugin Manifest Validation

Before a plugin is registered, the `PluginValidator` checks:

1. **Schema validity** — manifest matches `PluginManifest` TypeScript interface
2. **ID uniqueness** — no two plugins share the same `id`
3. **Version format** — `version` and `platformVersion` are valid SemVer
4. **Platform compatibility** — current platform version satisfies `platformVersion` range
5. **Dependency resolution** — all `dependencies` are in the discovered plugin set at compatible versions
6. **Permission namespace** — all declared permissions use the plugin's own module code (prevents `HR` plugin from declaring `FLEET:*` permissions)
7. **Entity ID namespace** — all entity IDs start with the plugin's own code (`'hr:...'`)
8. **Route namespace** — all routes begin with the plugin's assigned path prefix

Validation failures at step 1–3 abort boot (configuration error). Failures at step 4–8 log an error and skip that plugin (degraded boot).

### 7.5 Plugin Dependency Resolution

The `PluginHost` performs topological sort on the dependency graph:

```
PLATFORM_CORE (no deps)
  └── PLATFORM_AUTH (depends on: PLATFORM_CORE)
        └── HR (depends on: PLATFORM_AUTH)
        └── FLEET (depends on: PLATFORM_AUTH)
              └── FLEET_TELEMATICS (depends on: FLEET, HR)
```

Plugins are initialized in topological order. Circular dependencies are detected and both plugins enter `FAILED` state with a descriptive error.

### 7.6 Plugin Versioning

Plugin versions follow SemVer:

- **Patch** (`1.0.0 → 1.0.1`): Bug fixes, no metadata schema changes
- **Minor** (`1.0.0 → 1.1.0`): New entities or fields added (backward compatible)
- **Major** (`1.0.0 → 2.0.0`): Metadata schema changes that require migration

When a major version upgrade occurs, the platform runs `MetadataMigrator` to upgrade stored configurations (dashboards, user preferences) to the new schema.

### 7.7 Plugin Capabilities

Capabilities allow plugins to declare what they can do, and other plugins to check if a capability is available before depending on it:

```typescript
// Fleet plugin declares:
capabilities: [
  { id: 'fleet:vehicle-tracking', description: 'Real-time vehicle GPS tracking' },
  { id: 'fleet:maintenance-scheduler', description: 'Automated maintenance scheduling' },
]

// Telematics plugin checks at init:
const hasTracking = platform.plugins.hasCapability('fleet:vehicle-tracking');
if (!hasTracking) {
  logger.warn('fleet:vehicle-tracking not available — map features disabled');
}
```

This is softer than a hard dependency — the plugin loads but disables certain features.

---

## 8. Metadata System

### 8.1 Overview

Metadata is the language of the platform. Every screen, form, table, workflow, permission, and menu item is described by a metadata object. The Metadata System defines the format, validation, versioning, and lifecycle of these objects.

### 8.2 Metadata Format

All metadata is pure TypeScript interfaces. There is no JSON schema, no YAML, no XML. TypeScript provides:
- Compile-time type checking
- IDE autocomplete
- Refactoring support
- Tree-shaking

```typescript
// Metadata is static TypeScript objects — not JSON, not strings
export const EmployeeEntityDef: EntityDef = {
  id: 'hr:employee',
  // ...
};
```

### 8.3 Metadata Schema Version

Every top-level metadata interface carries an implicit schema version tied to the platform version that introduced it. The `MetadataVersionRegistry` tracks which platform version introduced each metadata interface version:

```typescript
interface VersionedMetadata {
  $schemaVersion?: number;   // Optional. Defaults to current platform major version.
                              // Used by MetadataMigrator for stored configurations.
}
```

This field is only relevant for metadata stored in the backend (dashboard layouts, user preferences). Static plugin metadata in TypeScript does not need it — TypeScript types enforce correctness at compile time.

### 8.4 Metadata Validation

The `MetadataValidator` runs during plugin registration and checks:

1. Required fields are present
2. Field types match the interface contract
3. Enum values are within allowed sets
4. Cross-references are resolvable (e.g., `entityRef: 'hr:department'` must exist in EntityRegistry)
5. Permission codes follow the `MODULE:resource:action` format
6. API paths follow the `/v1/{module}/{resource}` format
7. No duplicate action IDs within an entity

Validation errors during plugin registration move the plugin to `FAILED` state with a detailed error report.

### 8.5 Metadata Inheritance

Metadata can extend base definitions:

```typescript
// A "base employee" definition shared across modules:
const BaseEmployeeTableDef: Partial<TableDef> = {
  pageSize: 20,
  selectable: true,
  searchable: true,
};

// Extended for the HR module:
export const HrEmployeeTableDef: TableDef = {
  ...BaseEmployeeTableDef,
  columns: [...],
};
```

This is standard TypeScript spread — no platform-specific inheritance mechanism is needed.

### 8.6 Metadata Overrides

The **Override Registry** (Platform v1.1+) allows tenant-specific or role-specific metadata patches without modifying the base plugin:

```typescript
interface MetadataOverride<T> {
  targetType: 'entity' | 'form' | 'table' | 'action' | 'menu';
  targetId: string;
  condition: OverrideCondition;
  patch: DeepPartial<T>;
}

interface OverrideCondition {
  tenantId?: string;
  roleIds?: string[];
  featureFlag?: string;
}
```

Overrides are applied by the `MetadataOverrideService` at render time. The base metadata is never mutated.

### 8.7 Metadata Caching

Metadata objects are registered in signal-based registries. Since they are immutable references, no caching layer is needed — signal reads are O(1) Map lookups. The only caching concern is `optionsLoader` functions in `FormFieldDef` and `FilterDef`, which call APIs. These are cached in `OptionsCache` for the lifetime of the component that triggered the load.

### 8.8 Metadata Migration

When a plugin is upgraded (major version), stored metadata (dashboard configs, user preferences referencing widget IDs) may reference old schema. The `MetadataMigrator` runs migrations:

```typescript
interface MetadataMigration {
  fromVersion: number;
  toVersion: number;
  migrate: (oldData: unknown) => unknown;
}
```

Migrations are registered in the plugin manifest and run automatically by the platform on first boot after an upgrade.

---

## 9. Platform Runtime

### 9.1 Runtime Context

The `RuntimeContext` is the read-only snapshot of the current execution environment. Every engine reads from it. It is a signal-based object so engines reactively update when context changes.

```typescript
interface RuntimeContext {
  // Authentication
  readonly isAuthenticated: Signal<boolean>;
  readonly currentUser:     Signal<UserProfile | null>;
  
  // Multi-tenancy
  readonly tenantId:   Signal<string | null>;
  readonly companyId:  Signal<string | null>;
  readonly branchId:   Signal<string | null>;
  
  // Permissions
  readonly permissions: Signal<Set<string>>;
  readonly hasPermission: (code: string) => boolean;
  readonly hasAnyPermission: (codes: string[]) => boolean;
  readonly hasAllPermissions: (codes: string[]) => boolean;
  
  // Active modules
  readonly activeModules: Signal<Set<string>>;
  readonly hasModule: (moduleCode: string) => boolean;
  
  // Feature flags
  readonly featureFlags: Signal<Set<string>>;
  readonly hasFeature: (flag: string) => boolean;
  
  // Locale
  readonly locale:    Signal<string>;
  readonly timezone:  Signal<string>;
  readonly currency:  Signal<string>;
  
  // Navigation
  readonly currentRoute: Signal<string>;
  readonly currentEntityId: Signal<string | null>;
  readonly currentRecordId: Signal<string | null>;
  readonly currentViewMode: Signal<ViewMode>;
}
```

### 9.2 Runtime Services

The Platform Runtime provides these services to all engines and plugins:

| Service | Responsibility |
|---|---|
| `HttpService` | Typed HTTP client wrapping platform interceptors |
| `RouterService` | Navigation abstraction over Angular Router |
| `NotificationService` | Toast notifications (success, info, warn, error) |
| `LoggerService` | Structured logging with configurable levels |
| `StorageService` | Typed key-value storage (localStorage / sessionStorage / memory) |
| `I18nService` | Translation and locale formatting |
| `ThemeService` | Theme switching (light / dark / custom) |
| `ClipboardService` | System clipboard access |
| `PrintService` | Print layout activation |

All services are accessed through `PlatformAPI.runtime`. No engine imports them directly from Angular.

### 9.3 Runtime Execution Pipeline

When a route is navigated to:

```
URL Change
  │
  ▼
Angular Router
  │
  ▼
Route Guard: AuthGuard → PermissionGuard
  │ (if denied → /403 or /login)
  ▼
EntityViewComponent (universal screen host)
  │
  ├── RuntimeContext.currentEntityId resolved from URL
  ├── EntityRegistry.get(entityId) → EntityDef
  ├── RuntimeContext.currentViewMode resolved from URL pattern
  │
  ├── [mode = list]
  │     ├── PermissionEngine.check(entity.permissions.list)
  │     ├── TableRegistry.get(entityId) → TableDef
  │     ├── FilterRegistry.get(entityId) → FilterDef[]
  │     ├── ActionRegistry.getByEntityAndScope(entityId, 'list-toolbar') → ActionDef[]
  │     └── TableEngine.render(tableDef, filterDefs, actions)
  │
  └── [mode = create / edit / view]
        ├── PermissionEngine.check(entity.permissions.{mode})
        ├── FormRegistry.getForEntity(entityId, mode) → FormSchema
        ├── ActionRegistry.getByEntityAndScope(entityId, 'form-toolbar') → ActionDef[]
        └── FormEngine.render(formSchema, mode, actions)
```

### 9.4 Runtime Caching

The Platform Runtime does not cache entity data. Entity data is always fetched fresh on route activation. This prevents stale data in a multi-user system where records change between navigations.

What IS cached:
- Metadata (immutable after registration — no cache needed beyond Map lookup)
- `optionsLoader` results — cached per component instance lifetime
- User permissions — cached until explicit refresh or context switch
- Active modules list — cached until tenant context switch
- Dashboard layout — cached per user session, invalidated on save

### 9.5 Runtime Performance

The Runtime is optimized for:

1. **Time to interactive:** Platform boot (Steps 0–8) completes in < 2 seconds on desktop
2. **Route transition:** < 100ms for pre-loaded entities; < 500ms for lazy-loaded
3. **Form render:** < 50ms for forms with < 50 fields
4. **Table initial load:** Skeleton shown within 16ms; data rendered within API response time
5. **Permission check:** O(1) Set lookup — < 0.1ms per check

---

## 10. Rendering Pipeline

### 10.1 Pipeline Stages

The complete path from user action to rendered pixels:

```
Stage 1: Intent
  User navigates / clicks / types
        │
Stage 2: Resolution
  RuntimeContext resolves: entityId → EntityDef → TableDef or FormSchema
        │
Stage 3: Permission Gate
  PermissionEngine validates capability
        │
Stage 4: Data Fetch (async)
  EntityDataSource fetches from API with context headers
        │
Stage 5: Metadata Rendering
  Engine (TableEngine / FormEngine / etc.) reads metadata
  Engine calls UIAdapter to create platform components
        │
Stage 6: UI Adapter
  UIAdapter maps PlatformComponent requests → PrimeNG components
        │
Stage 7: Angular Rendering
  Angular Change Detection (OnPush + Signals) renders to DOM
        │
Stage 8: DOM
  Browser paints pixels
```

### 10.2 Engine Rendering Contract

Engines do not call PrimeNG directly. They call the `UIAdapter` through the `PlatformComponentFactory`:

```typescript
// What an engine does:
const table = this.uiAdapter.createTable({
  columns: resolvedColumns,
  rows: data(),
  pagination: paginationConfig,
});

// What UIAdapter does internally (PrimeNG implementation):
// → creates p-table with [columns] and [value] bindings
```

This is the isolation boundary. Everything above this line is PrimeNG-free.

### 10.3 Rendering Modes

| Mode | Description | Engine |
|---|---|---|
| `table` | Paginated data grid | `TableEngine` |
| `form:create` | New record form | `FormEngine` |
| `form:edit` | Edit existing record | `FormEngine` |
| `form:view` | Read-only record detail | `FormEngine` |
| `kanban` | Card board by status field | `KanbanEngine` (Phase 2) |
| `calendar` | Date-based card layout | `CalendarEngine` (Phase 2) |
| `tree` | Hierarchical tree (org chart) | `TreeEngine` (Phase 2) |
| `dashboard` | Widget canvas | `DashboardEngine` |
| `custom` | Plugin-provided component | Direct component load |

---

## 11. UI Adapter Layer

### 11.1 The Isolation Contract

The UI Adapter Layer is the boundary between the PrimeNG-free platform and the PrimeNG implementation. This boundary is enforced by a strict rule:

> **The string `'primeng'` must not appear anywhere outside the `src/app/adapter/` directory.**

Any violation of this rule is a build error (enforced by ESLint import restriction rule).

### 11.2 UIAdapter Interface

```typescript
interface UIAdapter {
  // Component factory
  readonly components: PlatformComponentFactory;
  
  // Dialog management
  readonly dialogs: DialogAdapterAPI;
  
  // Notifications
  readonly notifications: NotificationAdapterAPI;
  
  // Theme
  readonly theme: ThemeAdapterAPI;
  
  // Icons
  readonly icons: IconAdapterAPI;
}
```

### 11.3 PlatformComponentFactory

Every UI primitive is provided through this factory, which returns PlatformComponent instances. The engine binds to the platform component — never to the PrimeNG component.

```typescript
interface PlatformComponentFactory {
  // Inputs
  createTextInput(config: TextInputConfig): PlatformComponent;
  createSelectInput(config: SelectConfig): PlatformComponent;
  createDatePicker(config: DatePickerConfig): PlatformComponent;
  createFileUpload(config: FileUploadConfig): PlatformComponent;
  // ... all input types
  
  // Data display
  createTable(config: TableConfig): PlatformComponent;
  createTree(config: TreeConfig): PlatformComponent;
  createChart(config: ChartConfig): PlatformComponent;
  
  // Feedback
  createDialog(config: DialogConfig): PlatformDialogRef;
  createDrawer(config: DrawerConfig): PlatformDrawerRef;
  createToast(config: ToastConfig): void;
  
  // Navigation
  createBreadcrumb(config: BreadcrumbConfig): PlatformComponent;
  createPaginator(config: PaginatorConfig): PlatformComponent;
  createTabs(config: TabsConfig): PlatformComponent;
  
  // Layout
  createCard(config: CardConfig): PlatformComponent;
  createSplitter(config: SplitterConfig): PlatformComponent;
}
```

### 11.4 PrimeNG Adapter Implementation

The `PrimeNgAdapter` implements `UIAdapter` using PrimeNG components:

```
PlatformComponentFactory.createTextInput()
  → PrimeNgTextInputComponent (wraps <p-inputText>)

PlatformComponentFactory.createTable()
  → PrimeNgTableComponent (wraps <p-table>)

PlatformComponentFactory.createSelectInput()
  → PrimeNgSelectComponent (wraps <p-dropdown> / <p-multiSelect>)
```

### 11.5 Replacing PrimeNG

To replace PrimeNG with another component library:

1. Create `ShadcnAdapter` (or `MaterialAdapter`, etc.) implementing `UIAdapter`
2. Replace `PrimeNgAdapter` in the IOC container registration
3. All engines, forms, tables, and plugins continue working without modification

No other file in the codebase changes. This is verified by the Self Review checklist (Section 25).

### 11.6 Platform Components

Platform Components (`PlatformComponent`) are thin Angular components that delegate to the UI Adapter. They live in `src/app/adapter/components/` and follow the naming pattern `Pc{Name}Component`:

```typescript
// e.g. PcInputTextComponent — always available platform-wide
// Usage in engine templates:
@Component({
  template: `<pc-input-text [config]="fieldConfig" [control]="control" />`
})
```

Engines use `PcXxx` components, not `p-xxx` or `mat-xxx` components.

---

## 12. Dynamic Engines

Engines are the executable machinery of the platform. They take metadata as input and produce UI as output. Engines are stateless pipelines — they do not hold business data between renders.

### 12.1 Engine Registration

Engines are registered in the IOC Container as singletons. They are accessed via the `EngineRegistry`:

```typescript
interface EngineRegistry {
  form:         FormEngineAPI;
  table:        TableEngineAPI;
  dialog:       DialogEngineAPI;
  drawer:       DrawerEngineAPI;
  layout:       LayoutEngineAPI;
  dashboard:    DashboardEngineAPI;
  workflow:     WorkflowEngineAPI;
  action:       ActionEngineAPI;
  search:       SearchEngineAPI;
  permission:   PermissionEngineAPI;
  validation:   ValidationEngineAPI;
  notification: NotificationEngineAPI;
  audit:        AuditEngineAPI;
  widget:       WidgetEngineAPI;
  filter:       FilterEngineAPI;
  toolbar:      ToolbarEngineAPI;
  import:       ImportEngineAPI;
  export:       ExportEngineAPI;
}
```

### 12.2 Form Engine

**Input:** `FormSchema` + `FormMode` + initial data  
**Output:** Rendered, validated, reactive form connected to API

Key contracts:
- Builds `FormGroup` from `FormSchema` via `FormBuilderService`
- Resolves each `FieldType` through `FieldRegistry`
- Evaluates all predicate functions (`required`, `hidden`, `disabled`) reactively
- Maps server validation errors (`fieldErrors`) to form controls
- Exposes lifecycle hooks (`afterBuild`, `beforeSubmit`, `afterSave`)
- Emits `CommandBus.execute(SubmitFormCommand)` on submit — the Command Bus calls the API

### 12.3 Table Engine

**Input:** `TableDef` + `EntityDef` + context  
**Output:** Paginated, sorted, filtered, selectable data table

Key contracts:
- `EntityDataSource` is signal-reactive: any change to page/sort/filter/search signals triggers re-fetch
- Zero-based pagination matching Spring Data Pageable
- Column type renderers are resolved through `CellRendererRegistry`
- All actions validated through `PermissionEngine` before rendering
- Bulk actions revealed when selection signal is non-empty
- Listens to `EventBus` for `record:created`, `record:updated`, `record:deleted` to auto-refresh

### 12.4 Action Engine

**Input:** `ActionDef[]` + `ActionContext`  
**Output:** Rendered buttons + execution pipeline

Execution pipeline per action:
```
check permission → evaluate hidden → evaluate disabled →
optional confirm dialog → emit CommandBus → loading state →
success: toast + navigate → error: toast
```

### 12.5 Workflow Engine

**Input:** `WorkflowDef` + current entity state  
**Output:** Transition buttons in `detail-toolbar` + status badge

Key contracts:
- Only transitions valid from `currentStatus` are shown
- Each transition is converted to an `ActionDef` and executed through `ActionEngine`
- Status history is tracked in `AuditEngine`

### 12.6 Dialog Engine

**Input:** `DialogConfig` (type: confirm | form | detail | picker | custom)  
**Output:** Modal overlay with appropriate content

Key contracts:
- Returns `Observable<T | null>` — `null` on cancel, typed value on confirm
- Stack-safe: multiple open dialogs managed with z-index stack
- Escape closes top-most dialog only
- `ActionEngine` automatically uses `DialogEngine` for `confirmBefore` in `ActionDef`

### 12.7 Drawer Engine

**Input:** `DrawerConfig`  
**Output:** Sliding side panel

Key contracts:
- Non-blocking: page behind is interactive
- Stack: up to 3 drawers simultaneously
- Default position: right edge, 40% width

### 12.8 Permission Engine

**Input:** Permission code(s)  
**Output:** Boolean — access granted or denied

All permission checks flow through `PermissionEngine`. Direct reads of `PermissionStateService` are forbidden in plugin code:

```typescript
// FORBIDDEN in plugin code:
const state = inject(PermissionStateService);
if (state.has('HR:employees:delete')) { ... }

// REQUIRED — always through Platform API:
if (platform.security.hasPermission('HR:employees:delete')) { ... }
```

### 12.9 Validation Engine

**Input:** `ValidatorDef[]` / `AsyncValidatorDef[]`  
**Output:** Angular `ValidatorFn[]` / `AsyncValidatorFn[]`

Key contracts:
- `ValidatorRegistry` maps type strings to `ValidatorFn` factories
- Custom validators are registered per-plugin without modifying engine code
- Server-side field errors are applied via `FormErrorMapperService`

### 12.10 Search Engine

**Input:** Search query string  
**Output:** Multi-entity search results grouped by entity type

Key contracts:
- Reads `SearchRegistry` to get all searchable entities
- Fans out parallel API requests to all entities the user has `read` permission for
- Aggregates and ranks results
- Navigates to entity detail on result click

### 12.11 Audit Engine

**Input:** Entity actions (create, update, delete, status change)  
**Output:** Audit trail stored via API + audit trail view component

Key contracts:
- `AuditEngine.record()` is called automatically by `ActionEngine` after every successful command
- The audit record includes: `entityId`, `recordId`, `action`, `userId`, `timestamp`, `before` snapshot, `after` snapshot
- Audit view is rendered as a `RelationDef` panel on entity detail screens

### 12.12 Notification Engine

**Input:** Notification events from API (polling or WebSocket)  
**Output:** Toast messages + notification bell badge + notification feed drawer

Key contracts:
- `NotificationRegistry` determines routing link and display template per notification type
- Plugins declare notification handlers, platform delivers them

### 12.13 Dashboard Engine

**Input:** `DashboardDef` (ordered widget slots)  
**Output:** 12-column responsive widget grid

Key contracts:
- Loads `WidgetDef` components from `WidgetRegistry`
- Each widget is self-contained (owns its own data fetch)
- Dashboard layout saved/loaded via `GET/PUT /v1/users/{id}/dashboard`
- Widget configuration via `DrawerEngine`

### 12.14 Layout Engine

**Input:** `LayoutDef` + current `ViewMode`  
**Output:** Page shell with appropriate page layout (standard / split-pane / tabs / dashboard)

### 12.15 Filter Engine

**Input:** `FilterDef[]`  
**Output:** Filter bar UI + signal-based filter state

Key contracts:
- Active filters synchronized to URL query params (bookmarkable)
- Changing any filter resets to page 0

### 12.16 Toolbar Engine

**Input:** `ActionDef[]` scoped to `list-toolbar` or `form-toolbar`  
**Output:** Rendered toolbar with buttons + overflow menu

### 12.17 Import Engine

**Input:** CSV / Excel file + `ImportSchemaDef`  
**Output:** Parsed preview → validation report → bulk API submission

```typescript
interface ImportSchemaDef {
  entityId: string;
  columns: ImportColumnMapping[];
  permission: string;      // 'HR:employees:import'
  endpoint: string;        // '/v1/hr/employees/import'
  maxRows?: number;        // default: 5000
}
```

### 12.18 Export Engine

**Input:** Current `TableDef` + active filters + format  
**Output:** CSV / Excel download

Key contracts:
- CSV export from current page: client-side
- Full export: calls backend export endpoint (`GET {apiPath}/export?{filters}`)
- Shows progress indicator for large exports

---

## 13. Event Bus

### 13.1 Design

The Event Bus is the message backbone of the platform. It provides loose coupling between engines, plugins, and the kernel. No component calls another component's method directly; instead, it emits an event and the other component reacts.

### 13.2 Event Categories

| Category | Prefix | Examples |
|---|---|---|
| Domain Events | `record:` | `record:created`, `record:updated`, `record:deleted` |
| Action Events | `action:` | `action:completed`, `action:failed` |
| Workflow Events | `workflow:` | `workflow:transition:completed` |
| UI Events | `ui:` | `ui:dialog:opened`, `ui:drawer:closed` |
| Kernel Events | `kernel:` | `kernel:ready`, `kernel:plugin:loaded` |
| Application Events | `app:` | `app:route:changed`, `app:context:changed` |
| Plugin Events | `{pluginCode}:` | `hr:headcount:changed`, `fleet:vehicle:assigned` |
| Security Events | `auth:` | `auth:login`, `auth:logout`, `auth:session:expired` |

### 13.3 Event Bus API

```typescript
interface EventBusAPI {
  emit<T extends PlatformEvent>(event: T): void;
  
  on<T extends PlatformEvent>(type: T['type']): Observable<T>;
  onAny(): Observable<PlatformEvent>;
  
  // Priority subscriptions (run before normal)
  onPriority<T extends PlatformEvent>(type: T['type'], priority: number): Observable<T>;
  
  // One-time subscription
  once<T extends PlatformEvent>(type: T['type']): Promise<T>;
}
```

### 13.4 Ordering and Priority

Events are delivered synchronously to all subscribers in the current microtask. Subscribers registered with `onPriority(type, priority)` receive the event before standard `on()` subscribers.

```
Priority 100 (Kernel internal)
Priority 50  (Security checks)
Priority 0   (Normal — default)
Priority -10 (Cleanup / teardown)
```

### 13.5 Async Event Handling

Subscribers that need to perform async work after receiving an event must not block the event delivery:

```typescript
// WRONG — blocks event delivery:
eventBus.on('record:created').subscribe(async (event) => {
  await heavyOperation();  // blocks other subscribers
});

// CORRECT — schedule async work in next tick:
eventBus.on('record:created').subscribe((event) => {
  Promise.resolve().then(() => heavyOperation());
});
```

### 13.6 Error Handling

If a subscriber throws synchronously, the error is caught, logged, and the next subscriber continues. The Event Bus never propagates subscriber errors to the emitter.

### 13.7 Plugin Event Namespace

Each plugin uses its own event prefix to avoid collision:

```typescript
// HR plugin events:
'hr:employee:activated'
'hr:employee:deactivated'
'hr:headcount:changed'

// Fleet plugin events:
'fleet:vehicle:assigned'
'fleet:vehicle:returned'
```

### 13.8 Event Type Registry (Platform v1.2+)

In Platform v1.2, an optional `EventTypeRegistry` will be introduced. Plugins declare their event types:

```typescript
interface HrEmployeeActivatedEvent {
  type: 'hr:employee:activated';
  employeeId: string;
  activatedBy: string;
  timestamp: string;
}
```

The registry enables event discovery, documentation, and tooling support.

---

## 14. Command Bus

### 14.1 Overview

The Command Bus provides the execution layer for write operations. While the Event Bus broadcasts "what happened," the Command Bus executes "what should happen." Every mutation (create, update, delete, status transition) flows through the Command Bus.

### 14.2 Command Pattern

```typescript
interface Command {
  readonly commandId: string;    // UUID — for correlation with audit
  readonly commandType: string;  // 'create-employee', 'deactivate-vehicle', etc.
  readonly timestamp: string;
  readonly userId: string;       // from RuntimeContext
  readonly entityId?: string;
  readonly recordId?: string;
  readonly payload: unknown;
}

interface CommandHandler<C extends Command, R = unknown> {
  handles: C['commandType'];
  execute(command: C): Observable<R>;
}
```

### 14.3 Command Bus API

```typescript
interface CommandBusAPI {
  dispatch<C extends Command, R = unknown>(command: C): Observable<R>;
  register<C extends Command, R>(handler: CommandHandler<C, R>): void;
}
```

### 14.4 Command Execution Pipeline

```
CommandBus.dispatch(command)
  │
  ├── 1. Validate command schema
  ├── 2. Check authorization (PermissionEngine)
  ├── 3. Execute pre-dispatch middleware (logging, rate limiting)
  ├── 4. Resolve handler from CommandHandlerRegistry
  ├── 5. Execute handler.execute(command)
  ├── 6. On success:
  │       ├── AuditEngine.record(command, result)
  │       ├── Emit domain event (EventBus)
  │       └── Return result to caller
  └── 7. On error:
          ├── AuditEngine.recordFailure(command, error)
          ├── Log error
          └── Propagate error to caller
```

### 14.5 Built-in Platform Commands

| Command Type | Handler | Effect |
|---|---|---|
| `platform:entity:create` | `EntityCreateHandler` | POST to `{apiPath}` |
| `platform:entity:update` | `EntityUpdateHandler` | PUT to `{apiPath}/{id}` |
| `platform:entity:delete` | `EntityDeleteHandler` | DELETE to `{apiPath}/{id}` |
| `platform:entity:patch` | `EntityPatchHandler` | PATCH to `{apiPath}/{id}` |
| `platform:workflow:transition` | `WorkflowTransitionHandler` | PATCH status field |
| `platform:bulk:delete` | `BulkDeleteHandler` | DELETE multiple |
| `platform:bulk:update` | `BulkUpdateHandler` | PATCH multiple |

Plugins can register their own command handlers for domain-specific operations.

### 14.6 Undo / Redo (Platform v1.2+)

The Command Bus supports optimistic undo for reversible commands:

```typescript
interface ReversibleCommand extends Command {
  readonly isReversible: true;
  readonly undoCommand: Command;    // Command that reverses this one
}
```

The `UndoManager` maintains a stack of reversible commands. The platform UI shows "Undo" toast after reversible actions (e.g., record deletion with 5-second undo window).

### 14.7 Command Audit

Every dispatched command is recorded in the `AuditLog`:

```typescript
interface AuditLogEntry {
  commandId: string;
  commandType: string;
  entityId: string;
  recordId: string;
  userId: string;
  timestamp: string;
  status: 'success' | 'failed';
  error?: string;
  snapshot?: {
    before: unknown;
    after: unknown;
  };
}
```

The audit log is persisted to the backend: `POST /v1/audit/log`.

---

## 15. State Management

### 15.1 State Philosophy

The platform uses Angular Signals as the state primitive. There is no NgRx, no Redux, no BehaviorSubject-based stores.

State is organized by lifetime:

| State Layer | Lifetime | Storage |
|---|---|---|
| **Application State** | Session | Signal in root service |
| **Module State** | Plugin scope | Signal in plugin-scoped service |
| **Page State** | Route navigation | Signal in component |
| **Dialog State** | Dialog lifetime | Signal in dialog component |
| **Widget State** | Widget lifetime | Signal in widget component |
| **Cache** | Configurable TTL | `CacheManager` |

### 15.2 Application State

Application-level state is owned by singleton services in the root injector:

```typescript
@Injectable({ providedIn: 'root' })
class AuthState {
  readonly isAuthenticated = signal(false);
  readonly currentUser     = signal<UserProfile | null>(null);
  readonly accessToken     = signal<string | null>(null);
}

@Injectable({ providedIn: 'root' })
class ContextState {
  readonly currentTenant  = signal<TenantInfo | null>(null);
  readonly currentCompany = signal<Company | null>(null);
  readonly currentBranch  = signal<Branch | null>(null);
  
  readonly tenantId  = computed(() => this.currentTenant()?.id ?? null);
  readonly companyId = computed(() => this.currentCompany()?.id ?? null);
  readonly branchId  = computed(() => this.currentBranch()?.id ?? null);
}

@Injectable({ providedIn: 'root' })
class PermissionState {
  readonly permissions    = signal<Set<string>>(new Set());
  readonly activeModules  = signal<Set<string>>(new Set());
  readonly featureFlags   = signal<Set<string>>(new Set());
}
```

### 15.3 Module (Plugin) State

Plugin-scoped state is provided at the plugin's lazy route level:

```typescript
@Injectable()  // NOT providedIn: 'root'
class HrModuleState {
  readonly selectedDepartmentId   = signal<string | null>(null);
  readonly employeeListFilters    = signal<Record<string, unknown>>({});
  readonly headcountByDepartment  = signal<Record<string, number>>({});
}

// Provided in HR plugin's lazy route:
const HR_ROUTES: Route[] = [{
  path: 'hr',
  providers: [HrModuleState],
  children: [...]
}];
```

Plugin state is garbage collected when the user navigates away from all plugin routes.

### 15.4 Derived State

All derived values use `computed()` — never manually maintained signals:

```typescript
// BAD:
readonly isAdmin = signal(false);
effect(() => this.isAdmin.set(this.permissions().has('SYSTEM:superadmin')));

// GOOD:
readonly isAdmin = computed(() => this.permissions().has('SYSTEM:superadmin'));
```

### 15.5 Effects — Allowed Use Cases

`effect()` is used only for side effects that cannot be expressed as computed values:

- Persisting signal value to localStorage on change
- Updating a third-party charting library when data changes
- Logging state changes in development
- Synchronizing signal to Angular form control

### 15.6 State Persistence

The `StateManager` provides typed persistence for state that must survive page reloads:

```typescript
interface StateManager {
  persist<T>(key: string, signal: WritableSignal<T>, storage: 'local' | 'session'): void;
  restore<T>(key: string, defaultValue: T, storage: 'local' | 'session'): T;
}
```

What is persisted:
- `accessToken`, `refreshToken` → localStorage
- `selectionToken` → sessionStorage
- Column visibility preferences → localStorage (per entity)
- Dashboard layout → backend API (not localStorage)
- Active theme → localStorage

What is NOT persisted:
- Page state (filters, pagination, search) — always reset on navigation
- Dialog state — dialogs are always fresh on open
- Entity data — always fetched from API

### 15.7 Cache Layer

The `CacheManager` provides TTL-based caching for API responses that are expensive to fetch and rarely change:

```typescript
interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs: number): void;
  invalidate(key: string): void;
  invalidatePrefix(prefix: string): void;
}
```

Cached items:
- Active modules list (TTL: 5 minutes)
- User effective permissions (TTL: until explicit refresh)
- Options loader results (TTL: component lifetime)
- Department/branch picker options (TTL: 5 minutes)

Entity data is NOT cached in the frontend. This is an intentional design decision (see ADR-005).

---

## 16. Security

### 16.1 Authentication

Authentication uses JWT. The flow:

```
Step 1: Login
  POST /v1/auth/login {email, password}
  → { selectionToken } OR { accessToken, refreshToken }

Step 2: Tenant Selection (if multi-tenant)
  POST /v1/auth/select-tenant { tenantId } with Bearer selectionToken
  → { accessToken, refreshToken, user }

Step 3: Session Active
  All non-auth requests carry: Authorization: Bearer {accessToken}

Step 4: Token Refresh
  When accessToken expires (401 response):
  POST /v1/auth/refresh { refreshToken }
  → { accessToken } (new access token)

Step 5: Logout
  POST /v1/auth/logout
  → Clear all tokens, redirect to /login
```

Token storage:
- `selectionToken`: sessionStorage (5-minute TTL)
- `accessToken`: localStorage (15-minute TTL)
- `refreshToken`: localStorage (7-day TTL)

### 16.2 Authorization

Authorization is enforced at five layers:

**Layer 1: Route Guard**
```typescript
// Applied automatically by RouteRegistry based on EntityDef.permissions
const guard = permissionGuard(entity.permissions.list);
```

**Layer 2: Menu Filtering**
```typescript
// MenuEngine filters items where user lacks permission
filteredItems = computed(() => allItems().filter(i => !i.permission || permState.has(i.permission)));
```

**Layer 3: Action Gating**
```typescript
// ActionEngine checks before rendering and before execution
if (!permissionEngine.check(action.permission)) return; // button hidden
```

**Layer 4: Column Visibility**
```typescript
// TableEngine hides columns with permission requirements user lacks
visibleColumns = columns.filter(c => !c.permission || permState.has(c.permission));
```

**Layer 5: API Layer**
```typescript
// Backend enforces — 403 is handled by error interceptor
```

### 16.3 Permission Model

Permission codes: `MODULE:resource:action` (e.g., `HR:employees:delete`)

```typescript
type PermissionAction =
  | 'create' | 'read' | 'update' | 'delete'
  | 'export' | 'import' | 'approve' | 'reject'
  | 'assign' | 'revoke';
```

Effective permissions are loaded from `GET /v1/users/{id}/permissions/effective` — the merged union of all permissions from all roles assigned to the user.

### 16.4 Feature Flags

Feature flags gate experimental or tenant-specific capabilities:

```typescript
// Plugin checks:
if (platform.runtime.context.hasFeature('fleet:beta:telematics')) {
  // show telematics tab
}
```

Feature flags are loaded with the user session and cached for the session lifetime.

### 16.5 Capability Validation

Before executing any action, the platform validates the full capability set:

```typescript
interface CapabilityCheck {
  permission?: string;         // user permission
  feature?: string;            // feature flag
  moduleActive?: string;       // module active for tenant
  custom?: () => boolean;      // arbitrary check
}
```

All conditions must be true for the action to proceed.

### 16.6 Plugin Isolation

Plugins cannot access other plugins' private state. Cross-plugin communication is exclusively through:
- Event Bus (fire-and-forget events)
- Command Bus (request-response commands)
- Platform API (read-only shared platform state)

A plugin that attempts to `inject()` another plugin's private services will receive a `NullInjectorError` at runtime (the other plugin's services are in its own scoped injector, not accessible from outside).

### 16.7 Metadata Validation Against Injection

All metadata function properties (`handler`, `hidden`, `disabled`, `required` predicates) are plain TypeScript functions. They execute in the platform's Angular injection context during rendering. They cannot call `inject()` for arbitrary services — they receive the `ActionContext` or form model as parameters only.

If an action handler needs platform services, it is declared as a method of a plugin service (which uses standard Angular DI), not as an inline arrow function in metadata.

### 16.8 XSS Protection

- All template bindings use Angular's template syntax (`{{ }}` / `[attr]`), never `innerHTML` binding
- The `rich-text` field type (WYSIWYG) uses Angular's `DomSanitizer` for all HTML content
- HTTP responses are never `eval()`-ed or injected as HTML
- User-generated content rendered in tables is escaped by the `CellRenderer`

---

## 17. Extension Model

### 17.1 Overview

The Extension Model defines how external developers (not the iDoo core team) extend the platform. The principle: **extend by addition, never by modification**.

### 17.2 Extension Points

| Extension Point | How to Extend | What You Provide |
|---|---|---|
| New ERP module | `providePlugin(manifest)` | Full `PluginManifest` |
| New entity in existing module | Add to `PluginManifest.entities` | `EntityDef` |
| New field type | `FieldRegistry.register()` | `FieldComponentDef` |
| New validator | `ValidatorRegistry.register()` | `ValidatorFactory` |
| New async validator | `AsyncValidatorRegistry.register()` | `AsyncValidatorFactory` |
| New cell renderer | `CellRendererRegistry.register()` | `CellRendererDef` |
| New widget | `WidgetRegistry.register()` | `WidgetDef` |
| New command handler | `CommandBus.register()` | `CommandHandler<T>` |
| New notification handler | `NotificationRegistry.register()` | `NotificationHandlerDef` |
| Custom screen | `EntityDef.customComponent` | Lazy-loaded component |
| Form lifecycle hook | `FormSchema.hooks` | `FormHooks` |
| Table lifecycle hook | `TableDef.hooks` | `TableHooks` |
| New permission | `PluginManifest.permissions` | `PermissionDef[]` |
| New report | `PluginManifest.reports` | `ReportDef` |
| New dashboard | `PluginManifest.dashboards` | `DashboardDef` |
| Metadata override | `MetadataOverrideRegistry.register()` | `MetadataOverride<T>` |

### 17.3 What Cannot Be Extended (Kernel Stability Guarantee)

The following are sealed and cannot be extended or modified by plugins:

- `KernelAPI` interface contract
- Boot sequence (plugins participate via `onInit()` hook, not by modifying the sequence)
- `UIAdapter` interface (only the implementation is replaceable)
- Event naming convention (`MODULE:category:action`)
- Permission naming convention (`MODULE:resource:action`)
- API response envelope format (`{ success, data, message?, error? }`)
- Pagination format (zero-based Spring Data Pageable)

These guarantees are what make the platform upgradeable without breaking plugins.

### 17.4 Extension Registration Timing

All extensions must be registered during plugin `onInit()`. Registrations after the kernel emits `kernel:ready` are rejected with a warning. This prevents race conditions during rendering.

---

## 18. Platform SDK

### 18.1 Overview

The Platform SDK is the developer toolkit for building iDoo plugins. It provides:
- TypeScript types for all metadata interfaces
- `providePlugin()` and `providePlatform()` functions
- CLI for scaffolding
- Testing utilities
- Development guide (this specification + `23-development-guide.md`)

### 18.2 SDK Package Structure

```
@idoo/platform             — core types, tokens, Platform API interface
@idoo/platform-angular     — AngularAdapter, providePlugin(), providePlatform()
@idoo/platform-testing     — mock platform, testing utilities
@idoo/platform-cli         — scaffolding CLI (idoo new-module hr)
```

### 18.3 SDK Public API Surface

```typescript
// @idoo/platform exports:
export type {
  PlatformAPI, PluginManifest, EntityDef, FormSchema, FormFieldDef,
  TableDef, ColumnDef, ActionDef, ActionScope, FilterDef, WorkflowDef,
  RelationDef, WidgetDef, MenuItemDef, RouteDef, PermissionDef,
  PlatformEvent, Command, CommandHandler, RuntimeContext,
}

export {
  PLUGIN_MANIFEST_TOKEN,
  PLATFORM_API_TOKEN,
}

// @idoo/platform-angular exports:
export { providePlugin, providePlatform }
export { HasPermissionDirective }

// @idoo/platform-testing exports:
export { createMockPlatform, createMockPluginHost, MetadataTestHarness }
```

### 18.4 CLI Scaffolding

```bash
# Create a new ERP module
npx idoo new-module fleet

# Output:
src/app/plugins/fleet/
├── fleet.plugin.ts          # PluginManifest template
├── fleet.routes.ts
├── entities/
│   └── vehicle/
│       ├── vehicle.entity.ts
│       ├── vehicle-form.ts
│       ├── vehicle-table.ts
│       ├── vehicle-actions.ts
│       ├── vehicle-filters.ts
│       └── vehicle.permissions.ts
├── api/
│   └── fleet-vehicle.api.ts
└── models/
    └── fleet.models.ts

# Register in app.config.ts (CLI does this automatically)
```

### 18.5 Testing Utilities

```typescript
// Unit testing a FormSchema:
const harness = MetadataTestHarness.forForm(EmployeeCreateFormSchema);
harness.setValue('contractType', 'FIXED_TERM');
expect(harness.isVisible('contractEndDate')).toBe(true);
harness.setValue('contractType', 'PERMANENT');
expect(harness.isVisible('contractEndDate')).toBe(false);

// Unit testing an EntityDef:
const entityHarness = MetadataTestHarness.forEntity(EmployeeEntityDef);
expect(entityHarness.hasPermission('read')).toBe(true);
expect(entityHarness.hasAction('hr:employee:activate')).toBe(true);

// Integration testing a plugin:
const platform = createMockPlatform();
platform.plugins.register(HrPluginManifest);
await platform.boot();
const employees = platform.registry.entity.get('hr:employee');
expect(employees).toBeDefined();
```

---

## 19. Folder Structure

### 19.1 Root Structure

```
src/
├── app/
│   ├── adapter/             # UI Adapter Layer (ONLY place PrimeNG is imported)
│   ├── core/                # Platform Kernel + Engines
│   ├── shared/              # Platform components (PcXxx), directives, pipes
│   ├── layout/              # Application shell (sidebar, topbar)
│   ├── plugins/             # ERP business modules
│   ├── app.component.ts
│   ├── app.config.ts        # providePlatform() + providePlugin() calls
│   └── app.routes.ts        # Root route (shell + lazy plugin routes)
├── assets/
│   ├── i18n/
│   └── icons/
├── environments/
└── styles/
    ├── _variables.scss
    ├── _themes.scss
    └── styles.scss
```

### 19.2 Core Layer

```
core/
├── kernel/
│   ├── platform-kernel.service.ts
│   ├── boot-sequence.ts
│   └── health-reporter.ts
├── ioc/
│   └── container.service.ts
├── registry/
│   ├── registry.manager.ts
│   ├── registries/
│   │   ├── entity.registry.ts
│   │   ├── route.registry.ts
│   │   ├── menu.registry.ts
│   │   ├── action.registry.ts
│   │   ├── permission.registry.ts
│   │   ├── field.registry.ts
│   │   ├── widget.registry.ts
│   │   ├── table.registry.ts
│   │   ├── form.registry.ts
│   │   ├── layout.registry.ts
│   │   ├── workflow.registry.ts
│   │   ├── search.registry.ts
│   │   ├── notification.registry.ts
│   │   ├── report.registry.ts
│   │   └── dashboard.registry.ts
│   └── providers/
│       └── registry.provider.ts
├── plugin/
│   ├── plugin-host.service.ts
│   ├── plugin-validator.service.ts
│   └── plugin-dependency-resolver.ts
├── engines/
│   ├── form/
│   ├── table/
│   ├── action/
│   ├── workflow/
│   ├── dialog/
│   ├── drawer/
│   ├── layout/
│   ├── dashboard/
│   ├── search/
│   ├── permission/
│   ├── validation/
│   ├── notification/
│   ├── audit/
│   ├── widget/
│   ├── filter/
│   ├── toolbar/
│   ├── import/
│   └── export/
├── events/
│   ├── event-bus.service.ts
│   └── platform-events.ts
├── commands/
│   ├── command-bus.service.ts
│   ├── command-handlers/
│   └── platform-commands.ts
├── state/
│   ├── auth.state.ts
│   ├── context.state.ts
│   ├── permission.state.ts
│   └── registry.state.ts
├── security/
│   ├── security-manager.service.ts
│   └── interceptors/
│       ├── jwt.interceptor.ts
│       ├── context.interceptor.ts
│       ├── logging.interceptor.ts
│       └── error.interceptor.ts
├── runtime/
│   ├── runtime-context.service.ts
│   ├── http.service.ts
│   ├── router.service.ts
│   ├── notification.service.ts
│   ├── logger.service.ts
│   ├── storage.service.ts
│   ├── cache.service.ts
│   └── i18n.service.ts
├── api/
│   ├── generated/
│   │   ├── auth.api.ts
│   │   ├── user.api.ts
│   │   └── tenant.api.ts
│   └── models/
│       └── index.ts
├── models/
│   ├── entity-def.ts
│   ├── form-schema.ts
│   ├── table-def.ts
│   ├── action-def.ts
│   ├── workflow-def.ts
│   ├── widget-def.ts
│   ├── menu-def.ts
│   ├── route-def.ts
│   ├── filter-def.ts
│   ├── permission-def.ts
│   └── index.ts
└── tokens/
    ├── platform-api.token.ts
    ├── plugin-manifest.token.ts
    ├── app-config.token.ts
    └── ui-adapter.token.ts
```

### 19.3 Adapter Layer

```
adapter/
├── ui-adapter.interface.ts      # UIAdapter interface (PrimeNG-free)
├── primeng/                     # PrimeNG implementation
│   ├── primeng-adapter.ts       # Implements UIAdapter
│   ├── components/
│   │   ├── pc-input-text/       # Wraps p-inputText
│   │   ├── pc-dropdown/         # Wraps p-dropdown
│   │   ├── pc-table/            # Wraps p-table
│   │   ├── pc-dialog/           # Wraps p-dialog
│   │   └── ...
│   └── primeng-adapter.provider.ts
└── providers/
    └── ui-adapter.provider.ts   # Registers active adapter
```

### 19.4 Shared Layer

```
shared/
├── components/
│   ├── page-header/
│   ├── breadcrumb/
│   ├── entity-view/              # Universal screen host
│   ├── action-bar/
│   ├── filter-bar/
│   ├── empty-state/
│   ├── error-state/
│   ├── access-denied/
│   └── loading-skeleton/
├── directives/
│   └── has-permission.directive.ts
├── pipes/
│   ├── date-format.pipe.ts
│   ├── currency-format.pipe.ts
│   └── truncate.pipe.ts
└── constants/
    └── permissions.constants.ts
```

### 19.5 Plugin Layer

```
plugins/
├── hr/
│   ├── hr.plugin.ts             # PluginManifest
│   ├── hr.routes.ts
│   ├── entities/
│   │   ├── employee/
│   │   │   ├── employee.entity.ts
│   │   │   ├── employee-form.ts
│   │   │   ├── employee-table.ts
│   │   │   ├── employee-actions.ts
│   │   │   └── employee-filters.ts
│   │   ├── department/
│   │   └── job-title/
│   ├── api/
│   │   ├── hr-employee.api.ts
│   │   └── hr-department.api.ts
│   ├── models/
│   │   └── hr.models.ts
│   ├── state/
│   │   └── hr.state.ts
│   └── permissions/
│       └── hr.permissions.ts
├── fleet/
├── crm/
├── ...
```

---

## 20. Naming Conventions

### 20.1 Files

| Artifact | Pattern | Example |
|---|---|---|
| Plugin manifest | `{module}.plugin.ts` | `hr.plugin.ts` |
| Plugin routes | `{module}.routes.ts` | `hr.routes.ts` |
| Entity definition | `{entity}.entity.ts` | `employee.entity.ts` |
| Form schema | `{entity}-form.ts` | `employee-form.ts` |
| Table definition | `{entity}-table.ts` | `employee-table.ts` |
| Action definitions | `{entity}-actions.ts` | `employee-actions.ts` |
| Filter definitions | `{entity}-filters.ts` | `employee-filters.ts` |
| Permission constants | `{module}.permissions.ts` | `hr.permissions.ts` |
| API client | `{module}-{entity}.api.ts` | `hr-employee.api.ts` |
| State service | `{module}.state.ts` | `hr.state.ts` |
| DTO models | `{module}.models.ts` | `hr.models.ts` |
| Engine service | `{engine}.engine.ts` | `form.engine.ts` |
| Registry | `{name}.registry.ts` | `entity.registry.ts` |
| Interceptor | `{name}.interceptor.ts` | `jwt.interceptor.ts` |
| Guard | `{name}.guard.ts` | `auth.guard.ts` |
| Component | `{name}.component.ts` | `employee-list.component.ts` |
| Platform component | `pc-{name}.component.ts` | `pc-input-text.component.ts` |
| Adapter | `{lib}-adapter.ts` | `primeng-adapter.ts` |

### 20.2 Classes and Interfaces

| Artifact | Pattern | Example |
|---|---|---|
| Service | `{Name}Service` | `FormBuilderService` |
| Engine | `{Name}Engine` | `FormEngine` |
| Registry | `{Name}Registry` | `EntityRegistry` |
| State service | `{Module}State` | `HrState` |
| Facade | `{Name}Facade` | `AuthFacade` |
| API client | `{Module}{Entity}ApiClient` | `HrEmployeeApiClient` |
| Guard | `{Name}Guard` | `AuthGuard` |
| Interceptor | `{name}Interceptor` (function) | `jwtInterceptor` |
| Component | `{Name}Component` | `EntityViewComponent` |
| Platform component | `Pc{Name}Component` | `PcInputTextComponent` |
| Interface | `{Name}` (no prefix) | `EntityDef`, `FormSchema` |
| Injection token | `{NAME}_TOKEN` | `PLUGIN_MANIFEST_TOKEN` |
| Plugin manifest const | `{Module}PluginManifest` | `HrPluginManifest` |
| Entity def const | `{Module}{Entity}EntityDef` | `HrEmployeeEntityDef` |

### 20.3 Metadata Keys

| Key Type | Pattern | Example |
|---|---|---|
| Entity ID | `'{module}:{entity}'` (lowercase) | `'hr:employee'` |
| Form key | `'{entityId}:{mode}'` | `'hr:employee:create'` |
| Action ID | `'{module}:{entity}:{action}'` | `'hr:employee:activate'` |
| Permission code | `'{MODULE}:{resource}:{action}'` (uppercase module) | `'HR:employees:create'` |
| Widget ID | `'{module}:widget:{name}'` | `'hr:widget:headcount'` |
| Event type | `'{module}:{category}:{verb}'` | `'hr:employee:activated'` |
| Command type | `'{module}:{entity}:{command}'` | `'hr:employee:deactivate'` |
| Route path | `/app/{module}/{entity}` | `/app/hr/employees` |
| API path | `/v1/{module}/{resource}` | `/v1/hr/employees` |

### 20.4 CSS / SCSS

- Component-scoped styles use `:host` selectors
- Platform design tokens use `--idoo-{category}-{name}` (e.g., `--idoo-color-primary`)
- Component CSS classes use `idoo-{component}-{element}` (e.g., `idoo-table-header`)
- No global CSS overrides of PrimeNG classes — all PrimeNG theming goes through PrimeNG theme variables in `_themes.scss`

---

## 21. Performance

### 21.1 Startup Optimization

**Target:** Time from URL load to interactive < 2 seconds on a 10Mbps connection.

Strategies:
1. **Split bundles:** Platform kernel in initial bundle (~100KB gzipped). All plugins in lazy bundles loaded on first navigation.
2. **Preloading:** Angular `PreloadAllModules` after initial paint completes.
3. **Boot parallelism:** Steps 4–5 (plugin discovery + registration) process all plugins concurrently. The dependency sort determines init order (step 5), not registration order.
4. **APP_INITIALIZER chain:** Only the minimum required steps run before first paint (security init). Registry building runs in parallel with the first navigation.

### 21.2 Lazy Loading Strategy

| Artifact | Load timing |
|---|---|
| Platform kernel | Initial bundle |
| Angular Router | Initial bundle |
| UI Adapter | Initial bundle |
| All engine components | First use (lazy) |
| Plugin code | First navigation into plugin route |
| Custom field components | First form that uses the type |
| Custom cell renderers | First table that uses the type |
| Dialog content | When dialog is opened |
| Widget components | When dashboard is first navigated to |
| Report components | When report is opened |

### 21.3 Table Performance

For datasets with 100,000+ rows (paginated), the platform ensures:
- Server-side pagination (never loads entire dataset)
- Virtual scrolling for rows within a page (optional, configurable per `TableDef`)
- Column rendering deferred for off-screen columns
- `trackBy` on all `ngFor` loops to prevent DOM recreation

### 21.4 Form Performance

For forms with 200+ fields:
- Sections are lazily rendered (only visible sections fully rendered)
- `ChangeDetectionStrategy.OnPush` on all form components
- Conditional field visibility uses `computed()` signals, not template `*ngIf` with subscription
- Async validators are debounced (default 400ms)

### 21.5 Dashboard Performance

For dashboards with 30+ widgets:
- Widgets are rendered with `IntersectionObserver` — off-screen widgets defer their data fetch
- Widget components use `ChangeDetectionStrategy.OnPush`
- Widget refresh intervals are staggered to prevent simultaneous API bursts

### 21.6 Signal Performance

Angular Signals are O(1) read and O(subscribers) write. The platform ensures:
- No deeply nested `computed()` chains (max 3 levels)
- No `effect()` that triggers another signal write (diamond dependencies)
- Large sets (permissions: 100+ strings) stored as `Set<string>` not `string[]`

### 21.7 Memory Management

- All `effect()` registrations are automatically cleaned up by Angular's `DestroyRef`
- All HTTP `Observable` subscriptions use `takeUntilDestroyed()`
- `EntityDataSource` is per-component (not singleton) — destroyed with the component
- Plugin-scoped services are garbage collected when plugin routes are destroyed

---

## 22. Testing Strategy

### 22.1 Testing Pyramid

```
        ┌─────────────────┐
        │   E2E Tests       │   ~5%  — Playwright — golden paths
        ├─────────────────┤
        │  Integration      │  ~20%  — Platform host + mock API
        ├─────────────────┤
        │   Unit Tests      │  ~75%  — All services, engines, metadata
        └─────────────────┘
```

### 22.2 Unit Testing

**Metadata definitions:**
```typescript
describe('EmployeeEntityDef', () => {
  it('has required permissions defined', () => {
    expect(EmployeeEntityDef.permissions.list).toBe(PERMISSIONS.HR.EMPLOYEES.READ);
  });

  it('has conditional field for contract end date', () => {
    const field = EmployeeCreateFormSchema.sections
      .flatMap(s => s.fields)
      .find(f => f.key === 'contractEndDate')!;
    expect(field.hidden!({ contractType: 'PERMANENT' })).toBe(true);
    expect(field.hidden!({ contractType: 'FIXED_TERM' })).toBe(false);
  });
});
```

**Engine unit tests:**
```typescript
describe('FormBuilderService', () => {
  it('marks required fields as required validators', () => {
    const form = service.build(EmployeeCreateFormSchema, 'create', {});
    const emailControl = form.get('email')!;
    emailControl.setValue('');
    expect(emailControl.hasError('required')).toBe(true);
  });
});
```

**Permission engine:**
```typescript
describe('PermissionEngine', () => {
  it('grants access when permission is in set', () => {
    permissionState.setPermissions(['HR:employees:read']);
    expect(engine.check('HR:employees:read')).toBe(true);
  });

  it('denies access when permission is missing', () => {
    permissionState.setPermissions([]);
    expect(engine.check('HR:employees:delete')).toBe(false);
  });
});
```

### 22.3 Platform Integration Testing

The `createMockPlatform()` test utility creates a full platform host with:
- All registries active
- Mock HTTP client (no real API calls)
- Mock event bus
- Injectable mock permission state

```typescript
describe('HR Plugin Integration', () => {
  let platform: MockPlatform;

  beforeEach(async () => {
    platform = createMockPlatform();
    platform.plugins.register(HrPluginManifest);
    await platform.boot();
  });

  it('registers hr:employee entity', () => {
    const entity = platform.registry.entity.get('hr:employee');
    expect(entity).toBeDefined();
    expect(entity!.apiPath).toBe('/v1/hr/employees');
  });

  it('registers employee list route', () => {
    const routes = platform.registry.route.buildAngularRoutes();
    const employeeRoute = routes.find(r => r.path === 'hr/employees');
    expect(employeeRoute).toBeDefined();
  });
});
```

### 22.4 Metadata Validation Testing

Every plugin's metadata must pass the `MetadataValidator` in CI:

```typescript
describe('HrPluginManifest validation', () => {
  it('passes platform metadata validation', () => {
    const result = MetadataValidator.validate(HrPluginManifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

### 22.5 E2E Testing (Playwright)

Golden path tests cover:
- Login → tenant selection → dashboard render
- Create Employee: fill form → submit → verify in list
- Edit Employee: navigate to edit → change field → save → verify
- Delete Employee: confirm dialog → verify removed
- Permission: logged in as limited user → verify inaccessible screens show 403

### 22.6 Coverage Targets

| Layer | Coverage Target |
|---|---|
| Platform Kernel | 90% |
| Registry Manager | 90% |
| All Engines | 85% |
| UI Adapter | 70% |
| Plugin metadata | 80% |
| Plugin API clients | 60% |

---

## 23. Architecture Decision Records

### ADR-001: Angular Signals Over NgRx

**Decision:** Use Angular Signals exclusively for state management. No NgRx.

**Context:** The platform needs reactive state that is readable in templates without `async` pipe and that integrates with Angular change detection.

**Alternatives Considered:**
- NgRx: Too much boilerplate; actions/reducers/selectors are overkill for a platform where most state is per-component
- RxJS BehaviorSubject: No template integration without `async` pipe; cleanup burden
- MobX: External dependency; not idiomatic Angular

**Trade-offs:**
- Loss: NgRx DevTools time-travel debugging
- Gain: 10x less boilerplate; native Angular integration; no async pipe needed; automatic cleanup

**Consequences:** All platform services expose `Signal<T>` (not `Observable<T>`) for readable state. Write operations return `void` or `Observable<void>`. Angular's `toSignal()` bridges Observables at boundaries.

---

### ADR-002: Metadata as TypeScript, Not JSON

**Decision:** All metadata (EntityDef, FormSchema, TableDef, etc.) is pure TypeScript.

**Context:** Metadata must be validated, autocompleted, and refactored with IDE tooling.

**Alternatives Considered:**
- JSON schemas: No compile-time type checking; string-keyed; no functions (predicates)
- YAML: No types; no IDE autocomplete; no functions
- GraphQL SDL: Heavy dependency; no functions in schema

**Trade-offs:**
- Loss: Runtime-editable configuration (JSON could be fetched and parsed dynamically)
- Gain: Compile-time type safety; IDE autocomplete; tree-shaking; function predicates for conditional logic

**Consequences:** Metadata is code (TypeScript), not data (JSON). Metadata is in the bundle, not fetched from an API. Dynamic metadata overrides (per-tenant customizations) are applied as patches over the base TypeScript metadata.

---

### ADR-003: UI Adapter Pattern for PrimeNG Isolation

**Decision:** PrimeNG components must never be used outside `src/app/adapter/`.

**Context:** PrimeNG has major version releases that break APIs. Replacing PrimeNG should not require touching business code.

**Alternatives Considered:**
- Direct PrimeNG usage everywhere: Fast to build, hard to replace
- Angular Material instead: Same isolation problem
- Build custom components from scratch: Prohibitively expensive

**Trade-offs:**
- Loss: Some PrimeNG-specific features that can't be expressed through the adapter API
- Gain: PrimeNG can be replaced with zero plugin code changes; platform tests are faster (mock adapter)

**Consequences:** Every form field, table, dialog, and button is a `PcXxx` component wrapping a PrimeNG component. The `UIAdapter` interface is the only contract between the platform and its rendering layer.

---

### ADR-004: Event Bus Over Direct Service Injection

**Decision:** Cross-plugin communication uses the Event Bus, not direct service injection.

**Context:** Plugin A should not import from Plugin B. If Plugin B is removed, Plugin A should degrade gracefully.

**Alternatives Considered:**
- Shared service in `core/`: Creates hard coupling; core shouldn't contain business logic
- Direct cross-plugin injection: Circular DI; plugin B removal breaks plugin A
- Observable subjects in a shared state: Acceptable but less discoverable

**Trade-offs:**
- Loss: Direct method call semantics; harder to trace call chains
- Gain: Loose coupling; plugins are independently deployable; events are self-documenting

**Consequences:** Plugins emit events and react to events. They never call each other's methods. The Event Bus is the nervous system of the platform.

---

### ADR-005: No Frontend Entity Data Cache

**Decision:** Entity data fetched from the API is never cached in the frontend between route navigations.

**Context:** iDoo is a multi-user ERP. A record changed by User A must immediately be visible to User B.

**Alternatives Considered:**
- Frontend cache with TTL (30s): Risk of stale data in ERP context (payroll, inventory)
- Optimistic updates only: Reduced round trips but stale data risk
- WebSocket push to invalidate cache: Complex; WebSocket infrastructure needed upfront

**Trade-offs:**
- Loss: Some redundant API calls when navigating back to a previously visited list
- Gain: Data is always fresh; no stale data bugs in critical ERP flows

**Consequences:** `EntityDataSource` always fetches on mount. Route deactivation cancels pending requests. `CacheManager` is only used for metadata that is effectively static (options, dropdowns, permissions).

---

### ADR-006: Plugin-First Architecture

**Decision:** Every business capability is a plugin. Nothing is hard-coded in the platform.

**Context:** The platform must support 10+ ERP modules for 10+ years without the platform itself changing.

**Alternatives Considered:**
- Hard-code first 3 modules (HR, Auth, Tenant); add plugin system later: Technical debt guaranteed
- Feature flags in the platform itself: Platform grows to understand HR concepts — violates separation of concerns

**Trade-offs:**
- Loss: Slightly more complex initial setup (every feature needs a manifest)
- Gain: Platform is genuinely Open/Closed; removing a module is clean (remove the provider)

**Consequences:** Even `PLATFORM_AUTH` (users, roles, tenants) is a plugin. The kernel itself has zero business logic.

---

### ADR-007: Command Bus for All Write Operations

**Decision:** All mutations (create, update, delete) are dispatched as Commands through the Command Bus, not called directly as API calls.

**Context:** Mutations need audit logging, authorization checks, undo capability (future), and event emission — all in a consistent pipeline.

**Alternatives Considered:**
- Direct API calls from action handlers: Inconsistent; audit logging must be added per-action
- NgRx Effects: Too much boilerplate; not idiomatic for imperative operations

**Trade-offs:**
- Loss: One extra indirection for API calls
- Gain: Audit, authorization, undo, event emission are handled by the Command Bus automatically for every operation; action handlers just describe what to do, not how

**Consequences:** `ActionDef.handler` dispatches a command or calls a service method that dispatches a command. The platform `EntityCreateHandler`, `EntityUpdateHandler`, `EntityDeleteHandler` are generic and handle 95% of cases.

---

### ADR-008: Zero-Based Pagination Matching Spring Data Pageable

**Decision:** Frontend pagination is zero-based (page 0 = first page), matching the Spring Data Pageable backend contract.

**Context:** The backend uses Spring Data Pageable with `page=0` as the first page. Frontend pagination libraries (PrimeNG `p-paginator`) typically display page 1 as the first page.

**Trade-offs:**
- Complexity: `PaginatorComponent` adapter must convert between 0-based (wire) and 1-based (display)
- Benefit: No off-by-one bugs in API parameters; backend contract is transparent

**Consequences:** The `PcPaginatorComponent` adapter converts `p-paginator`'s 1-based `page` event to 0-based `page` signal. All `EntityDataSource` query building uses 0-based page numbers directly.

---

## 24. Future Roadmap

### 24.1 Platform v1.0 — Foundation (Current)

Deliverables:
- Platform Kernel + IOC Container
- 15 Registries
- 18 Dynamic Engines
- Event Bus + Command Bus
- Signal-based State Management
- JWT Authentication + Multi-tenancy
- UI Adapter (PrimeNG implementation)
- Plugin System (build-time plugins via PLUGIN_MANIFEST_TOKEN)
- PLATFORM_CORE + PLATFORM_AUTH built-in plugins
- HR module (reference implementation)
- SDK package (`@idoo/platform`, `@idoo/platform-angular`)

### 24.2 Platform v1.1 — ERP Modules

Deliverables:
- Metadata Override Registry (per-tenant metadata patches)
- Fleet, CRM, Inventory, Procurement modules
- Import Engine (CSV bulk import)
- Export Engine (CSV/Excel export)
- Audit Engine + Audit Trail viewer
- Report Engine (metadata-driven reports)
- Notification Engine (polling-based)
- Undo Manager (Command Bus extension)

### 24.3 Platform v1.2 — Advanced Capabilities

Deliverables:
- Remaining ERP modules: Accounting, POS, Assets, Help Desk, Manufacturing
- Global Search Engine (cross-entity search)
- WebSocket real-time notifications
- Workflow Designer (visual workflow editor, generates WorkflowDef)
- Dashboard Layout Editor (drag-and-drop widget placement)
- Internationalization (Arabic RTL, multi-language)
- Offline Mode (Service Worker + IndexedDB queue for offline mutations)
- Screen Designer (Phase 1: metadata editor, generates EntityDef)

### 24.4 Platform v2.0 — Marketplace

Deliverables:
- Remote Plugin System (plugins loaded from URL, not built into bundle)
- Plugin Marketplace (iDoo app store for third-party plugins)
- Plugin Sandbox (isolated iframe-based plugin execution for untrusted plugins)
- Plugin signing and verification
- Hot-reload plugins without page refresh

```typescript
// Remote plugin registration (v2.0):
providePlugin({
  id: 'THIRD_PARTY_HR_EXTENSION',
  source: 'https://marketplace.idoo.io/plugins/hr-extension@2.1.0/manifest.json',
  publicKey: 'sha256:abc123...',
})
```

### 24.5 Platform v2.1 — AI Integration

Deliverables:
- `PlatformAPI.ai` namespace
- AI-powered form field suggestions (based on entity context)
- AI-powered search (natural language → filter params)
- AI-powered anomaly detection (flag unusual records in table)
- AI Workflow Advisor (suggests next workflow step based on entity state)
- Report Copilot (natural language → ReportDef)

```typescript
// AI integration in EntityDef (v2.1):
const EmployeeEntityDef: EntityDef = {
  // ...
  ai: {
    enableSuggestions: true,
    contextFields: ['department', 'jobTitle'],
    suggestionPrompt: 'Suggest salary range based on department and job title',
  }
};
```

### 24.6 Platform v3.0 — Cloud Native

Deliverables:
- Multi-region context switching
- Platform as a Service (PaaS) — iDoo hosted platform runtime
- White-label platform instances
- Plugin federation (plugin teams deploy independently)
- GraphQL API adapter (alongside REST)
- Server-Side Rendering (Angular Universal) for dashboard thumbnails

### 24.7 Long-Term Vision (5–10 years)

- **Screen Designer v2:** Full no-code screen builder that generates plugin code from a visual editor
- **AI-generated plugins:** Natural language plugin specification → generated TypeScript plugin
- **Cross-platform runtime:** Same metadata runs on web, mobile (Ionic/Capacitor), and desktop (Electron)
- **Plugin ecosystem:** Third-party developers selling plugins on the iDoo Marketplace
- **API independence:** Platform runtime that can consume GraphQL, REST, gRPC, or event streams interchangeably through a unified `DataAdapter`

---

## 25. Self Review

Before this specification is finalized, the following questions are answered. All must be "Yes."

---

**Q1: Can Angular be replaced?**

**Yes.** Angular is only referenced inside `src/app/adapter/primeng/` and the Angular bootstrap in `app.config.ts`. All engines use the `UIAdapter` interface. A `ReactAdapter` or `VueAdapter` could replace `AngularAdapter` and all engine/plugin/metadata code would be unchanged.

---

**Q2: Can PrimeNG be replaced?**

**Yes.** PrimeNG is only imported inside `src/app/adapter/primeng/`. The rest of the codebase uses `PcXxx` platform components. Replacing PrimeNG means implementing `UIAdapter` with a different component library and registering the new adapter in the IOC container.

---

**Q3: Can a new ERP module be added without changing the platform?**

**Yes.** Adding a new module requires:
1. Creating a plugin folder in `src/app/plugins/`
2. Writing `PluginManifest` with entities, menus, routes, permissions
3. Adding `providePlugin(NewModuleManifest)` to `app.config.ts`

Zero platform code changes. The platform is genuinely Open/Closed.

---

**Q4: Can plugins be loaded dynamically?**

**Yes (build-time) / Roadmap (runtime).** In v1.0, plugins are discovered from `PLUGIN_MANIFEST_TOKEN` multi-providers at build time. Dynamic remote plugin loading (runtime) is the v2.0 Remote Plugin System.

---

**Q5: Can metadata evolve without breaking compatibility?**

**Yes.** New optional fields can be added to any metadata interface without breaking existing plugins (TypeScript structural typing). Required fields can only be added in major versions with a published migration guide. The `MetadataMigrator` handles stored configuration upgrades.

---

**Q6: Can external developers build plugins?**

**Yes.** The `@idoo/platform` and `@idoo/platform-angular` SDK packages expose the complete public API. The CLI scaffolds new plugin folders. The Testing utilities allow plugin testing without running the full application. The `PluginManifest` validator gives clear error messages on configuration mistakes.

---

**Q7: Is the platform Open/Closed?**

**Yes.** The Platform Kernel, registries, and engines are closed for modification. Every extension point (FieldRegistry, ValidatorRegistry, CellRendererRegistry, CommandBus, EventBus, WidgetRegistry) is open for extension without modifying platform source.

---

**Q8: Is every subsystem loosely coupled?**

**Yes.** Coupling analysis:
- Plugins → Platform API only (no Angular, no PrimeNG, no sibling plugins)
- Engines → UIAdapter + Registries + EventBus (no business logic)
- Registries → Signal-based storage (no business logic, no UI)
- EventBus → No dependencies (pure reactive stream)
- UIAdapter → Angular + PrimeNG (isolated in adapter layer)
- Kernel → UIAdapter (through DI, not direct import)

---

**Q9: Is there any circular dependency?**

**No.** The dependency graph is a DAG:
```
Plugin → Platform API → Engines → Kernel → (nothing business-specific)
                                ↘ UIAdapter → Angular → PrimeNG
```
No arrows point inward (toward Plugin from Kernel). No arrows form cycles.

---

**Q10: Is the architecture suitable for at least 10 years of evolution?**

**Yes, justified by:**

1. **Angular changeability** (P14): If Angular is replaced in 5 years, only the adapter layer changes.
2. **PrimeNG replaceability** (P15): Component library can be upgraded or replaced per major release.
3. **Plugin isolation** (P1, P8): Removing or upgrading a module does not affect others.
4. **Metadata versioning** (ADR-002, §8.6): Metadata schemas can evolve with migrations.
5. **Backward compatibility** (P10): SemVer on Platform API; plugins built for v1 run on v1.9.
6. **Extension model** (§17): New capabilities (AI, WebSocket, offline) added without core changes.
7. **Registry-driven** (P5): New entity types, new engines, new registries can be added without touching existing code.
8. **Command Bus** (ADR-007): New cross-cutting concerns (audit v2, distributed tracing) can be added as middleware without touching command handlers.

---

*End of iDoo Platform Architecture Specification v1.0.0*

*This document is the constitution of the iDoo Platform. It supersedes all prior architecture documents. No implementation should proceed that contradicts this specification without an approved ADR.*
