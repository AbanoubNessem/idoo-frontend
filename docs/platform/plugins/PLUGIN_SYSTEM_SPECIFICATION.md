# Plugin System — Architecture Specification

**Version:** 1.0.0  
**Status:** OFFICIAL SPECIFICATION  
**Phase:** 2.4  
**Depends on:** `KERNEL_IMPLEMENTATION_SPECIFICATION.md`, `REGISTRY_MANAGER_SPECIFICATION.md`  
**Date:** 2026-06-28

---

> The Plugin System is the contract between the Platform and every ERP module.  
> The Platform provides a runtime. Plugins provide business logic.  
> Neither may reach into the other's domain.  
> Everything the Platform knows about HR, Fleet, CRM, or any other domain  
> comes exclusively through a Plugin Manifest and its declared metadata.

---

## Table of Contents

1. [Plugin Philosophy](#1-plugin-philosophy)
2. [Architecture Overview](#2-architecture-overview)
3. [Class Diagram](#3-class-diagram)
4. [Plugin Manifest](#4-plugin-manifest)
5. [Plugin Lifecycle](#5-plugin-lifecycle)
6. [Plugin API Contract](#6-plugin-api-contract)
7. [Plugin Host](#7-plugin-host)
8. [Plugin Manager](#8-plugin-manager)
9. [Plugin Discovery](#9-plugin-discovery)
10. [Plugin Dependency Resolver](#10-plugin-dependency-resolver)
11. [Plugin Version Resolver](#11-plugin-version-resolver)
12. [Compatibility Checker](#12-compatibility-checker)
13. [Plugin Loader](#13-plugin-loader)
14. [Plugin Registration](#14-plugin-registration)
15. [Plugin Activation](#15-plugin-activation)
16. [Plugin Deactivation](#16-plugin-deactivation)
17. [Plugin Disposal](#17-plugin-disposal)
18. [Plugin Context](#18-plugin-context)
19. [Plugin Capabilities](#19-plugin-capabilities)
20. [Plugin Configuration](#20-plugin-configuration)
21. [Plugin Metadata](#21-plugin-metadata)
22. [Plugin Error Isolation](#22-plugin-error-isolation)
23. [Plugin Health](#23-plugin-health)
24. [Plugin Events](#24-plugin-events)
25. [Plugin Diagnostics](#25-plugin-diagnostics)
26. [Boot Pipeline Integration](#26-boot-pipeline-integration)
27. [Dependency Graph](#27-dependency-graph)
28. [Plugin Ordering](#28-plugin-ordering)
29. [Plugin Licensing (Future-Ready)](#29-plugin-licensing-future-ready)
30. [Runtime Plugin Support (Future-Ready)](#30-runtime-plugin-support-future-ready)
31. [Sequence Diagrams](#31-sequence-diagrams)
32. [State Diagram](#32-state-diagram)
33. [ADRs](#33-adrs)
34. [Self-Review](#34-self-review)

---

## 1. Plugin Philosophy

### 1.1 The Fundamental Contract

The iDoo Platform is an operating environment. Plugins are applications that run inside it. This is the same relationship as an operating system and its applications — the OS provides services, manages resources, and enforces rules; applications declare their needs, implement their logic, and operate within enforced boundaries.

This relationship has six non-negotiable properties:

**Isolation** — A plugin failure cannot crash the platform or any other plugin.

**Declaration** — Plugins declare everything they need through the Manifest. The platform never inspects plugin source code; it reads only the Manifest.

**Dependency** — Plugins depend on the Platform API, never on each other's implementation. Cross-plugin communication uses the Event Bus exclusively.

**Registration** — Plugins contribute metadata (entities, forms, routes, menus) to the Registry Manager. Plugins never render screens directly — the Platform's engines do that.

**Lifecycle** — The Platform controls when plugins are discovered, loaded, registered, activated, and disposed. Plugins do not control their own lifecycle.

**Boundary** — The Platform API is the only interface between Ring 2 (Platform Engines) and Ring 3 (Plugins). Plugins import from `@idoo/platform` only, never from `@angular/core` directly or from each other.

### 1.2 The Three Rings Model — Plugin Perspective

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │  RING 3: PLUGINS                                                        │
  │  HR, Fleet, CRM, GL, Inventory, POS, Payroll, Assets, HelpDesk, ...   │
  │                                                                          │
  │  Plugins contain: Manifest, EntityDefs, FormSchemas, TableDefs,         │
  │  ActionDefs, MenuItemDefs, RouteDefs, WorkflowDefs, WidgetDefs         │
  │  Plugins do NOT contain: Angular components, HTTP calls, state mgmt    │
  │                                                                          │
  │  ──────────────────── PLATFORM API BOUNDARY ──────────────────────────  │
  │                                                                          │
  │  RING 2: PLATFORM ENGINES                                               │
  │  EntityViewComponent, FormEngine, TableEngine, ActionEngine,            │
  │  MenuEngine, FilterEngine, WorkflowEngine, DialogEngine, ...           │
  │                                                                          │
  │  ──────────────────── KERNEL API BOUNDARY ────────────────────────────  │
  │                                                                          │
  │  RING 1: KERNEL                                                          │
  │  PluginHost, PluginManager, RegistryManager, PlatformContext,           │
  │  BootManager, HealthService, DiagnosticsService, EventBus              │
  │                                                                          │
  └────────────────────────────────────────────────────────────────────────┘
```

### 1.3 What a Plugin Is

A Plugin is a TypeScript module that:

1. Exports exactly one `PluginManifest` constant
2. Provides that manifest via `providePlugin(manifest)` in `app.config.ts`
3. Contains metadata definitions (EntityDef, FormSchema, etc.) as pure data objects
4. Optionally contains custom field components, validators, cell renderers, and widgets
5. Optionally contains an optional `PluginInitFn` called once at plugin initialization

A Plugin is NOT:

- A standalone Angular application or module
- An NgModule (the platform is standalone-component-only)
- Allowed to directly inject Angular's Router, HttpClient, or any other Angular service outside of its `PluginInitFn` and its metadata `handler` functions
- Allowed to import from another plugin's source files
- Allowed to register its own `APP_INITIALIZER`

### 1.4 The Platform Provides, The Plugin Consumes

| Platform provides | Plugin consumes |
|---|---|
| HTTP transport with auth + context headers | `apiPath` in EntityDef |
| Form rendering engine | `FormSchema` metadata |
| Table rendering engine | `TableDef` metadata |
| Permission enforcement | Permission codes in ActionDef / RouteDef |
| Navigation | `MenuItemDef` + `RouteDef` |
| Dialog and drawer management | `ActionDef.type: 'form-dialog'` |
| Workflow state machine | `WorkflowDef` |
| Event Bus | `EventBus.emit()` / `EventBus.on()` |
| Command Bus | `CommandBus.dispatch()` |
| Error handling and user feedback | Success/error messages from ActionDef |

### 1.5 Module-as-Plugin Model

Every ERP module is a plugin. There are no special or privileged modules. The HR module is a plugin. The GL module is a plugin. The Auth module is a plugin. The platform does not know about any specific domain — it knows only about plugin manifests.

This model enables:
- Enabling/disabling entire ERP modules per tenant without redeployment
- Shipping new ERP modules without modifying platform code
- Third-party ERP modules from a plugin marketplace (v2.0+)
- Tenant-specific ERP module customizations via override plugins

---

## 2. Architecture Overview

### 2.1 System Map

```
  app.config.ts
       │
       │ providePlugin(HrPluginManifest)
       │ providePlugin(FleetPluginManifest)
       │ providePlugin(CrmPluginManifest)
       │ ...
       │
       │ PLUGIN_MANIFEST_TOKEN (multi-provider, Array<PluginManifest>)
       │
       ▼
  ╔══════════════════════════════════════════════════════════════════╗
  ║                        PLUGIN HOST                               ║
  ║  The authoritative runtime for all plugin lifecycle management   ║
  ║                                                                  ║
  ║  ┌──────────────────┐  ┌────────────────────┐                  ║
  ║  │  PluginManager   │  │  PluginDiscovery   │                  ║
  ║  │  (lifecycle FSM) │  │  (manifest intake) │                  ║
  ║  └──────────────────┘  └────────────────────┘                  ║
  ║  ┌──────────────────┐  ┌────────────────────┐                  ║
  ║  │  DependencyRes.  │  │  VersionResolver   │                  ║
  ║  │  (topological)   │  │  (semver + compat) │                  ║
  ║  └──────────────────┘  └────────────────────┘                  ║
  ║  ┌──────────────────┐  ┌────────────────────┐                  ║
  ║  │  PluginLoader    │  │  CompatChecker     │                  ║
  ║  │  (init + reg)    │  │  (platform compat) │                  ║
  ║  └──────────────────┘  └────────────────────┘                  ║
  ║  ┌──────────────────────────────────────────┐                  ║
  ║  │            PluginDiagnostics              │                  ║
  ║  └──────────────────────────────────────────┘                  ║
  ╚══════════════════════════════════════════════════════════════════╝
       │                         │                        │
       ▼                         ▼                        ▼
  RegistryManager           EventBus               PlatformContext
  (receives plugin         (receives plugin         (provides runtime
   metadata)                lifecycle events)        context to plugins)
```

### 2.2 Plugin Anatomy

```
  src/app/plugins/hr/
  │
  ├── hr.manifest.ts          ← PluginManifest (the only required file)
  │
  ├── entities/               ← Pure metadata — no Angular code
  │   ├── employee/
  │   │   ├── employee.entity.ts    (EntityDef)
  │   │   ├── employee.form.ts      (FormSchema × 2)
  │   │   ├── employee.table.ts     (TableDef)
  │   │   ├── employee.filters.ts   (FilterDef[])
  │   │   └── employee.actions.ts   (ActionDef[])
  │   ├── department/
  │   └── job-title/
  │
  ├── workflows/              ← WorkflowDef[] (pure metadata)
  │   └── employee.workflow.ts
  │
  ├── widgets/                ← Custom dashboard widgets
  │   └── headcount/
  │       ├── headcount.widget.ts   (WidgetDef — metadata)
  │       └── headcount.component.ts (Angular component — lazy loaded)
  │
  ├── fields/                 ← Custom field components (lazy loaded)
  │   └── salary-grade/
  │       └── salary-grade.field.ts
  │
  ├── validators/             ← Custom validator factories (pure functions)
  │   └── national-id.validator.ts
  │
  ├── permissions/
  │   └── hr.permissions.ts   (PERMISSIONS constant + PermissionDef[])
  │
  ├── lookups/
  │   └── hr.lookups.ts       (LookupDef[])
  │
  └── init/
      └── hr.init.ts          ← Optional PluginInitFn
```

---

## 3. Class Diagram

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                           PluginHost                                  │
  │  (implements PluginHostAPI)                                           │
  │                                                                        │
  │  + readonly plugins: Signal<PluginRuntimeEntry[]>                     │
  │  + readonly loadedPlugins: string[]                                   │
  │  + readonly failedPlugins: string[]                                   │
  │  + readonly status: Signal<PluginSystemStatus>                        │
  │                                                                        │
  │  + initialize(manifests: PluginManifest[]): Promise<PluginBootResult> │
  │  + getPlugin(id: string): PluginRuntimeEntry | null                   │
  │  + getPluginStatus(id: string): PluginLifecycleState                  │
  │  + hasCapability(capabilityId: string): boolean                       │
  │  + shutdown(): Promise<void>                                           │
  │  + getDiagnostics(): PluginDiagnosticsReport                          │
  └───────────────────────┬──────────────────────────────────────────────┘
                           │ owns
      ┌────────────────────┼──────────────────────────────────────────────┐
      │                    │                                               │
  ┌───▼────────────┐  ┌────▼──────────────┐  ┌────────────────────────┐  │
  │ PluginDiscovery│  │  PluginManager    │  │  PluginDiagnostics     │  │
  │                │  │                   │  │                         │  │
  │ -readManifests │  │ -lifecycleFSM     │  │ -generateReport()       │  │
  │ -validateSchema│  │ -pluginRegistry   │  │ -getDepGraph()          │  │
  │ -deduplication │  │ -transition(id,s) │  │ -getLoadOrder()         │  │
  └────────────────┘  └────────┬──────────┘  └────────────────────────┘  │
                               │                                            │
              ┌────────────────┼────────────────────┐                      │
              │                │                     │                      │
  ┌───────────▼──────┐  ┌──────▼────────┐  ┌───────▼──────────────────┐  │
  │DependencyResolver│  │VersionResolver│  │  CompatibilityChecker     │  │
  │                  │  │               │  │                            │  │
  │ -buildGraph()    │  │ -resolve()    │  │ -checkPlatformVersion()    │  │
  │ -topologicalSort │  │ -satisfies()  │  │ -checkPeerDeps()           │  │
  │ -detectCycles()  │  │ -latest()     │  │ -getIncompatible()         │  │
  │ -reportMissing() │  │               │  │                            │  │
  └──────────────────┘  └───────────────┘  └────────────────────────────┘  │
                                                                             │
  ┌──────────────────────────────────────────────────────────────────────┐  │
  │                          PluginLoader                                 │◄─┘
  │                                                                        │
  │ -runInitFn(manifest): Promise<void>                                   │
  │ -registerWithRegistries(manifest, registryManager): void              │
  │ -registerExtensions(manifest, registries): void                       │
  │ -activate(manifest, platformContext): void                            │
  └──────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────────┐
  │                       PluginRuntimeEntry                              │
  │  (per-plugin runtime state)                                           │
  │                                                                        │
  │  + id:           string                                               │
  │  + manifest:     PluginManifest                                       │
  │  + state:        Signal<PluginLifecycleState>                         │
  │  + error:        Signal<PluginError | null>                           │
  │  + metrics:      PluginMetrics                                        │
  │  + context:      PluginContext                                         │
  └──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Plugin Manifest

The `PluginManifest` is the complete self-description of a plugin. It is a pure data object — no functions, no Angular services, no observables. All behavioural elements (handlers, component factories) are referenced by type or lazy import, not embedded in the manifest.

```
PluginManifest
│
├── ── Identity ──────────────────────────────────────────────────────────────
│
├── id                    string      (REQUIRED)
│     Unique platform-wide identifier for this plugin.
│     Format: SCREAMING_SNAKE_CASE. Examples: 'HR', 'FLEET', 'CRM', 'GL'
│     Must not contain dots, dashes, or slashes.
│     This is the canonical reference ID used everywhere in the platform.
│
├── name                  string      (REQUIRED)
│     Human-readable plugin name. e.g. 'Human Resources'
│
├── version               string      (REQUIRED)
│     SemVer string. e.g. '1.0.0', '2.3.1-beta.1'
│
├── description           string
│     One-paragraph description of what this plugin provides.
│
├── author                PluginAuthor
│   ├── name:    string
│   ├── email?:  string
│   └── url?:    string
│
├── category              PluginCategory
│     'core'          — built-in platform plugins (Auth, Platform)
│     'erp'           — ERP modules (HR, Fleet, CRM, GL, Inventory)
│     'analytics'     — reporting and BI plugins
│     'integration'   — third-party integrations (Slack, SAP, Salesforce)
│     'tenant-config' — tenant-specific override plugins
│     'marketplace'   — third-party marketplace plugins (v2.0+)
│
├── icon                  string      — icon identifier for plugin picker UI
│
├── ── Platform Compatibility ────────────────────────────────────────────────
│
├── minimumPlatformVersion    string  (REQUIRED)
│     Minimum platform version this plugin requires.
│     SemVer range: '^1.0.0'
│
├── compatiblePlatformVersions  string[]
│     Explicit list of compatible platform version ranges (for use when
│     minimumPlatformVersion alone is insufficient).
│     If empty: minimumPlatformVersion is the only constraint.
│
├── ── Dependencies ──────────────────────────────────────────────────────────
│
├── dependencies          PluginDependency[]
│     Required plugins. All must be present and ACTIVE before this plugin loads.
│   PluginDependency:
│   ├── pluginId:       string       — target plugin's ID
│   ├── version:        string       — SemVer range: '^1.0.0', '>=2.0.0 <3.0.0'
│   └── reason?:        string       — why this dependency exists
│
├── optionalDependencies  PluginDependency[]
│     Optional plugins. Missing optional deps cause DEGRADED state, not failure.
│     Plugin must gracefully handle absent optional dependencies.
│
├── peerDependencies      PluginPeerDependency[]
│     Plugins that must be present in the same deployment, but this plugin
│     does not directly depend on their API. Used for capability validation.
│   PluginPeerDependency:
│   ├── pluginId:       string
│   ├── version:        string
│   └── warning?:       string       — shown in diagnostics if peer is missing
│
├── ── Registrations ─────────────────────────────────────────────────────────
│     All arrays below are registered with the corresponding registry during
│     Boot Step 06 (PluginRegistration). These are references — the actual
│     definition objects are imported lazily when needed.
│
├── entities              EntityDef[]
│     All entity definitions contributed by this plugin.
│     Each EntityDef is registered in EntityRegistry, FormRegistry, TableRegistry.
│
├── routes                RouteDef[]
│     All route definitions. Registered in RouteRegistry.
│     Compiled to Angular Route[] at Boot Step 08.
│
├── menus                 MenuItemDef[]
│     All menu items. Registered in MenuRegistry.
│
├── actions               ActionDef[]
│     Global actions not tied to a specific entity (e.g., 'HR:run-payroll').
│     Entity-specific actions are embedded in EntityDef.actions.
│
├── widgets               WidgetDef[]
│     Dashboard widgets contributed by this plugin. Registered in WidgetRegistry.
│
├── dashboards            DashboardDef[]
│     Default dashboard layouts. Registered in DashboardRegistry.
│
├── workflows             WorkflowDef[]
│     Entity workflow definitions. Registered in WorkflowRegistry.
│
├── reports               ReportDef[]
│     Report definitions. Registered in ReportRegistry.
│
├── lookups               LookupDef[]
│     Static reference data. Registered in LookupRegistry.
│
├── permissions           PermissionDef[]
│     All permission codes declared by this plugin. Registered in PermissionRegistry.
│
├── validators            ValidatorDef[]
│     Custom validator factories. Registered in ValidationRegistry.
│
├── themes                ThemeDef[]
│     Custom themes. Registered in ThemeRegistry.
│
├── locales               LocaleDef[]
│     Translation bundles. Registered in LocalizationRegistry.
│
├── layouts               LayoutDef[]
│     Custom page layouts. Registered in LayoutRegistry.
│
├── ── Capabilities ──────────────────────────────────────────────────────────
│
├── capabilities          string[]
│     Capabilities this plugin declares it provides.
│     Other plugins can check capability existence via PluginHost.hasCapability().
│     Examples: 'payroll-processing', 'fleet-tracking', 'multi-currency'
│     Convention: '{plugin-domain}:{capability-name}' (kebab-case)
│
├── requiredCapabilities  string[]
│     Capabilities this plugin requires from other plugins.
│     Platform validates all required capabilities are available before loading.
│
├── ── Feature Flags ─────────────────────────────────────────────────────────
│
├── featureFlags          PluginFeatureFlag[]
│     Feature flags this plugin contributes. Registered in PlatformContext.
│   PluginFeatureFlag:
│   ├── key:          string       — 'hr.advanced-payroll'
│   ├── label:        string
│   ├── defaultValue: boolean
│   └── description?: string
│
├── ── Override System ───────────────────────────────────────────────────────
│
├── overrides             PluginOverrideDeclaration[]
│     Explicit declarations that this plugin overrides base entries.
│     Required for any entry that uses the same ID as an existing entry.
│   PluginOverrideDeclaration:
│   ├── registryName:   string     — which registry
│   ├── entryId:        string     — the base entry being overridden
│   └── reason?:        string     — why this override is needed
│
├── overridePriority      number    (default: 0)
│     Integer. Higher = applied last = wins in merges.
│     Tenant config plugins use 100. Platform core uses 0.
│     Range: -100 to 1000
│
├── ── Lifecycle ─────────────────────────────────────────────────────────────
│
├── enabledByDefault      boolean   (default: true)
│     Whether the plugin is active when first installed in a tenant.
│     If false: plugin is registered but not activated until tenant opts in.
│
├── initFn                PluginInitFn | null
│     Optional initialization function called once after plugin registration.
│     Receives PluginContext. May register custom field types, validators, etc.
│     Type: (context: PluginContext) => void | Promise<void>
│     Must complete within 5 seconds (configurable).
│
├── ── Licensing ─────────────────────────────────────────────────────────────
│
├── license               PluginLicense
│   ├── type:           'mit' | 'apache-2.0' | 'commercial' | 'proprietary' | 'custom'
│   ├── commercial?:    CommercialLicense
│   │   ├── licenseKey:   string    — validated against LicenseService (v2.0+)
│   │   ├── expiresAt?:   string    — ISO 8601 expiry date
│   │   └── seats?:       number    — max concurrent active users
│   └── text?:          string      — full license text (for audit)
│
├── ── Marketplace (v2.0+) ───────────────────────────────────────────────────
│
├── marketplace           PluginMarketplaceMetadata | null
│   ├── marketplaceId:  string      — marketplace registry identifier
│   ├── publishedAt:    string
│   ├── downloadCount:  number
│   ├── rating:         number      — 1–5
│   └── tags:           string[]
│
└── ── Internal (set by platform, not plugin author) ─────────────────────────
    installedAt          string     — ISO 8601 (set by PluginManager)
    installSource        PluginInstallSource
      'bundled'     — shipped with the platform build
      'tenant'      — installed by tenant admin
      'marketplace' — installed from marketplace (v2.0+)
      'remote'      — loaded from remote URL (v2.0+)
```

### 4.1 Manifest Validation Rules

| Field | Rule | Severity |
|---|---|---|
| `id` | `^[A-Z][A-Z0-9_]*$`, max 50 chars | ERROR |
| `id` | Must be globally unique across all manifests | ERROR |
| `version` | Valid SemVer | ERROR |
| `minimumPlatformVersion` | Valid SemVer range | ERROR |
| `dependencies[].version` | Valid SemVer range | ERROR |
| `capabilities[]` | `^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$` | WARNING |
| `overridePriority` | -100 to 1000 | ERROR |
| `initFn` | Must be a function or null | ERROR |
| `entities` | Must be non-empty array if plugin category is 'erp' | WARNING |
| `permissions` | Must be provided if entities is non-empty | WARNING |
| `license` | Required for category 'marketplace' | ERROR |

### 4.2 Minimal Valid Manifest

```typescript
// The minimal plugin manifest — a configuration-only plugin
const PlatformThemePlugin: PluginManifest = {
  id:                     'CORP_THEME',
  name:                   'Corporate Theme',
  version:                '1.0.0',
  minimumPlatformVersion: '^1.0.0',
  category:               'tenant-config',
  author:                 { name: 'iDoo Dev Team' },
  themes:                 [CorpThemeDef],
  overridePriority:       100,
  enabledByDefault:       true,
};
```

---

## 5. Plugin Lifecycle

### 5.1 Lifecycle State Definition

```
PluginLifecycleState =
  | 'DISCOVERED'    — manifest read from PLUGIN_MANIFEST_TOKEN
  | 'VALIDATED'     — manifest schema valid; ID unique; version format valid
  | 'RESOLVED'      — all required dependencies present and version-compatible
  | 'LOADED'        — all registry metadata registered (but not yet frozen/published)
  | 'INITIALIZED'   — initFn() completed (if any); custom extensions registered
  | 'REGISTERED'    — all entries published by RegistryManager; plugin visible to engines
  | 'READY'         — all optional capabilities confirmed or gracefully degraded
  | 'ACTIVE'        — plugin is fully operational; tenant has it enabled
  | 'FAILED'        — encountered an unrecoverable error; see error signal
  | 'DISABLED'      — deliberately disabled by tenant admin or feature flag
  | 'STOPPED'       — gracefully stopped; resources released (hot-reload pre-step)
  | 'UNLOADED'      — removed from memory; registry entries removed (hot-reload only)
```

### 5.2 State Machine

```
   manifests read
        │
   ┌────▼────────┐
   │ DISCOVERED  │
   └────┬────────┘
        │ manifest schema valid
   ┌────▼────────┐      validation error
   │  VALIDATED  │─────────────────────────────────────────► FAILED
   └────┬────────┘
        │ all required deps present + version-compatible
   ┌────▼────────┐      missing required dep OR version conflict
   │  RESOLVED   │─────────────────────────────────────────► FAILED
   └────┬────────┘
        │ register() — metadata pushed to registries
   ┌────▼────────┐      registry validation error (critical)
   │   LOADED    │─────────────────────────────────────────► FAILED
   └────┬────────┘      registry validation error (non-critical)
        │ initFn() completed                                    │
   ┌────▼──────────┐    initFn() throws                       ▼
   │ INITIALIZED   │──────────────────────────────────────► FAILED
   └────┬──────────┘
        │ publishAll() completes for this plugin's entries
   ┌────▼──────────┐    critical entry invalid after publish
   │  REGISTERED   │──────────────────────────────────────► FAILED
   └────┬──────────┘
        │ optional deps confirmed / gracefully degraded
   ┌────▼──────────┐
   │     READY     │
   └────┬──────────┘
        │ tenant enables plugin (or enabledByDefault: true)
   ┌────▼──────────┐      tenant disables           admin disables
   │    ACTIVE     │◄──────────────────────────────────────────┐
   └────┬──────────┘      ──────────────────────────────────── │
        │ tenant disables │                                     │
   ┌────▼──────────┐      │                                     │
   │   DISABLED    │──────┘                                     │
   └───────────────┘                                           │
                                                                │
   ┌────────────────┐    graceful shutdown requested            │
   │    STOPPED     │◄───────────────────────────────────────── │
   └────┬───────────┘                                           │
        │ hot-reload: remove entries                             │
   ┌────▼───────────┐                                           │
   │    UNLOADED    │                                           │
   └────────────────┘
```

### 5.3 State Transition Table

| From | To | Trigger | Side Effects |
|---|---|---|---|
| `DISCOVERED` | `VALIDATED` | Schema validation passes | — |
| `DISCOVERED` | `FAILED` | Schema validation fails | `PluginFailedEvent` |
| `VALIDATED` | `RESOLVED` | All required deps present + version-compat | — |
| `VALIDATED` | `FAILED` | Missing required dep / version conflict | `PluginFailedEvent` |
| `RESOLVED` | `LOADED` | `register()` completes for all entries | `EntryRegisteredEvent`s emitted |
| `LOADED` | `FAILED` | Critical registry validation error | `PluginFailedEvent` |
| `LOADED` | `INITIALIZED` | `initFn()` completes (or no initFn) | Custom extensions registered |
| `INITIALIZED` | `FAILED` | `initFn()` throws | `PluginFailedEvent` |
| `INITIALIZED` | `REGISTERED` | `publishAll()` includes this plugin's entries | `PluginRegisteredEvent` |
| `REGISTERED` | `FAILED` | Critical entry invalid after publish | `PluginFailedEvent` |
| `REGISTERED` | `READY` | Optional dep checks pass / degrade | `PluginReadyEvent` |
| `READY` | `ACTIVE` | `enabledByDefault: true` OR tenant enables | `PluginActivatedEvent` |
| `ACTIVE` | `DISABLED` | Tenant disables | `PluginDisabledEvent` |
| `DISABLED` | `ACTIVE` | Tenant re-enables | `PluginActivatedEvent` |
| `ACTIVE` | `STOPPED` | Shutdown request | `PluginStoppedEvent` |
| `STOPPED` | `UNLOADED` | Hot-reload remove (v1.1+) | `PluginRemovedEvent` |
| `FAILED` | — | Terminal state (no recovery in v1.0) | — |
| `UNLOADED` | `DISCOVERED` | Hot-reload re-install (v1.1+) | Full lifecycle repeats |

---

## 6. Plugin API Contract

### 6.1 PluginInitFn

The only lifecycle hook plugins may implement. Called once by `PluginLoader` after the plugin reaches `LOADED` state. Receives a `PluginContext` (see Section 18).

```
PluginInitFn = (context: PluginContext) => void | Promise<void>
```

The `initFn` is used exclusively for:
- Registering custom field types with `FieldRegistry`
- Registering custom validators with `ValidationRegistry`
- Registering custom cell renderers with `CellRendererRegistry`
- Registering health checks with `HealthService`
- Subscribing to EventBus events (setup cross-plugin listeners)

The `initFn` must NOT:
- Make HTTP calls
- Access Angular Router
- Modify the DOM
- Register `APP_INITIALIZER`
- Access other plugins' private APIs

**Timeout:** `initFn` must complete within `pluginInitTimeoutMs` (default: 5000ms, configurable in `PlatformConfig`). Timeout causes transition to `FAILED`.

### 6.2 Plugin Deactivation Hook

Future (v1.1+) — when tenant disables a plugin, the platform calls:

```
PluginDeactivateFn = (context: PluginContext) => void | Promise<void>
```

Used to release resources, cancel subscriptions, clear caches.

### 6.3 What the Plugin API Is Not

There is no `Plugin` base class, no `@Plugin()` decorator, no `NgModule`, no Angular lifecycle hook. The Plugin System is data-driven: the platform reads the manifest and does all the work. The `PluginInitFn` is the only imperative escape hatch.

---

## 7. Plugin Host

### 7.1 Purpose

`PluginHost` is the top-level facade for the entire Plugin System. It is the implementation of `PluginHostAPI` (the stub from the Kernel spec). `PlatformKernel` delegates all plugin concerns to `PluginHost` through this interface.

### 7.2 Responsibilities

- Coordinate discovery, validation, resolution, loading, registration, and activation
- Own the `PluginRuntimeEntry` for every plugin (authoritative lifecycle state)
- Be the single point of access for plugin status queries
- Expose aggregate capability lists
- Delegate diagnostics, errors, and events to specialist services

### 7.3 PluginSystemStatus

The overall status of the Plugin System (not per-plugin):

```
PluginSystemStatus =
  | 'idle'           — before initialize() is called
  | 'initializing'   — boot pipeline in progress
  | 'ready'          — all plugins processed (some may be FAILED/DISABLED)
  | 'degraded'       — ready with one or more failed plugins
  | 'shutting-down'  — shutdown() called
  | 'offline'        — shutdown complete
```

### 7.4 PluginBootResult

Returned by `PluginHost.initialize()` — consumed by Boot Step 06:

```
PluginBootResult
├── status:          'success' | 'degraded' | 'failed'
├── loadedPlugins:   string[]     — IDs in ACTIVE state
├── failedPlugins:   PluginFailureSummary[]
│   ├── pluginId:    string
│   ├── state:       PluginLifecycleState    — state at time of failure
│   └── reason:      string
├── skippedPlugins:  string[]     — disabled by default or tenant-disabled
├── durationMs:      number
└── warnings:        string[]
```

---

## 8. Plugin Manager

### 8.1 Purpose

`PluginManager` owns the authoritative map of all `PluginRuntimeEntry` objects and enforces the lifecycle state machine. Every state transition goes through `PluginManager.transition(pluginId, newState)`.

### 8.2 Responsibilities

- Maintain `Map<pluginId, PluginRuntimeEntry>` — the plugin registry
- Validate and enforce lifecycle state transitions (throws on invalid transition)
- Update per-plugin `state` signals on transition
- Emit lifecycle events through EventBus
- Provide query APIs: `getAllInState()`, `getByCapability()`, `getAll()`

### 8.3 PluginRuntimeEntry

The internal runtime record for each plugin:

```
PluginRuntimeEntry
├── id:            string
├── manifest:      PluginManifest            — immutable original manifest
├── state:         Signal<PluginLifecycleState>
├── error:         Signal<PluginError | null>
├── metrics:       PluginMetrics
│   ├── discoveredAt:   string
│   ├── loadedAt:       string | null
│   ├── initializedAt:  string | null
│   ├── registeredAt:   string | null
│   ├── activeAt:       string | null
│   ├── initDurationMs: number | null        — time spent in initFn
│   ├── regDurationMs:  number | null        — time spent in register()
│   └── totalBootMs:    number | null
├── context:       PluginContext              — the context passed to initFn
├── resolvedDeps:  ResolvedDependency[]       — after DependencyResolver runs
│   ├── pluginId:  string
│   ├── version:   string                    — actual resolved version
│   └── optional:  boolean
└── degradedBy:    string[]                  — optional deps that were missing
```

### 8.4 PluginError

```
PluginError
├── code:          PluginErrorCode
│   'MANIFEST_INVALID'      — schema validation failed
│   'DEPENDENCY_MISSING'    — required dependency not found
│   'VERSION_INCOMPATIBLE'  — dependency version constraint not satisfied
│   'PLATFORM_INCOMPATIBLE' — platform version requirement not met
│   'CAPABILITY_MISSING'    — required capability not available
│   'INIT_FAILED'           — initFn() threw or timed out
│   'INIT_TIMEOUT'          — initFn() exceeded timeout
│   'REGISTRY_FAILED'       — critical registry entry invalid
│   'CIRCULAR_DEPENDENCY'   — plugin is part of a dependency cycle
├── message:       string
├── pluginId:      string
├── timestamp:     string
└── cause?:        unknown    — original error if caught from initFn
```

---

## 9. Plugin Discovery

### 9.1 Purpose

`PluginDiscovery` is responsible for reading all plugin manifests from `PLUGIN_MANIFEST_TOKEN` and producing a deduplicated, schema-validated list of manifest candidates for further processing.

### 9.2 Discovery Sources (current + future)

| Source | v1.0 | v1.1 | v2.0 |
|---|---|---|---|
| `PLUGIN_MANIFEST_TOKEN` (bundled) | YES | YES | YES |
| Tenant plugin registry (backend API) | NO | YES | YES |
| Marketplace CDN | NO | NO | YES |
| Remote URL | NO | NO | YES |

### 9.3 Discovery Process

```
1. Read all values from PLUGIN_MANIFEST_TOKEN (multi-provider array)
2. For each manifest:
   a. Check if manifest is a valid object (not null, not array)
   b. Validate 'id' field exists and is non-empty string
   c. Check for ID duplicates within the same discovery batch
      - Same ID, same version: DEDUPLICATE (take first, warn)
      - Same ID, different version: CONFLICT (see Version Resolver)
      - Unique ID: accept
3. Transition each accepted manifest to DISCOVERED state
4. Emit PluginDiscoveredEvent for each
5. Return: DiscoveryResult { discovered, rejected, duplicates }
```

### 9.4 DiscoveryResult

```
DiscoveryResult
├── discovered:  PluginManifest[]   — all unique, schema-valid manifests
├── rejected:    RejectedManifest[] — failed schema check
│   ├── manifest:  unknown
│   └── reason:    string
└── duplicates:  DuplicateManifest[]
    ├── id:      string
    ├── kept:    PluginManifest    — the manifest that was kept
    └── dropped: PluginManifest[]  — the manifests that were dropped
```

---

## 10. Plugin Dependency Resolver

### 10.1 Purpose

Given a set of validated manifests, produces a resolved and sorted list for loading. Detects missing dependencies, version conflicts, circular dependencies, and capability gaps.

### 10.2 Resolution Algorithm

```
Input:  Set of VALIDATED PluginManifest[]
Output: ResolutionResult { sorted, failed, warnings }

Step 1: Build the dependency graph
  For each manifest M:
    For each dep D in M.dependencies:
      Check if D.pluginId exists in manifest set
      Check if available version satisfies D.version range (VersionResolver)
      If missing: add to missingDeps → M transitions FAILED
      If version incompatible: add to versionConflicts → M transitions FAILED
      If satisfied: add directed edge M → D in graph

Step 2: Check required capabilities
  For each manifest M:
    For each cap in M.requiredCapabilities:
      Search all manifests for cap in their capabilities[]
      If not found: add to missingCapabilities → M transitions FAILED

Step 3: Detect cycles using DFS (WHITE/GRAY/BLACK)
  WHITE: not visited
  GRAY:  currently being visited (in stack)
  BLACK: fully visited
  If we encounter a GRAY node while traversing: CYCLE DETECTED
  All nodes in the cycle → FAILED with CIRCULAR_DEPENDENCY code
  Remove cycle nodes from graph

Step 4: Topological sort (Kahn's Algorithm) on remaining valid nodes
  Produces load order: plugins with no deps first, dependents last

Step 5: Validate optional dependencies
  For each manifest M with optional deps:
    If optional dep missing: record in M.degradedBy[]
    M will be loaded in DEGRADED mode for that feature

Step 6: Peer dependency warnings
  For each manifest M with peer deps:
    If peer dep missing: add to warnings (does not block loading)
```

### 10.3 ResolutionResult

```
ResolutionResult
├── sorted:            PluginManifest[]      — in dependency order (load this order)
├── failed:            FailedResolution[]
│   ├── manifest:      PluginManifest
│   ├── reason:        'MISSING_DEP' | 'VERSION_CONFLICT' | 'CYCLE' | 'MISSING_CAPABILITY'
│   └── details:       string
├── cycles:            DependencyCycle[]
│   ├── participants:  string[]              — pluginIds in the cycle
│   └── edges:         Array<[string, string]>
├── missingCapabilities: CapabilityGap[]
│   ├── requiredBy:    string
│   └── capability:    string
└── warnings:          string[]
```

### 10.4 Missing Dependency Cascade

If plugin A is FAILED due to a missing dependency, all plugins that depend on A are also FAILED with code `DEPENDENCY_MISSING`. This cascade prevents partially-initialized dependency chains.

Example:
```
GL (requires CURRENCY)  ─►  CURRENCY (missing)  →  FAILED
PAYROLL (requires GL)   ─►  GL (FAILED)          →  FAILED (cascade)
REPORTS (requires GL)   ─►  GL (FAILED)          →  FAILED (cascade)
```

---

## 11. Plugin Version Resolver

### 11.1 Purpose

`VersionResolver` determines whether a particular plugin version satisfies a declared version constraint. Uses SemVer semantics.

### 11.2 Supported Range Formats

| Format | Example | Meaning |
|---|---|---|
| Exact | `1.0.0` | Exactly version 1.0.0 |
| Caret | `^1.0.0` | Compatible with 1.0.0 (≥1.0.0 <2.0.0) |
| Tilde | `~1.0.0` | Approximately 1.0.0 (≥1.0.0 <1.1.0) |
| Range | `>=1.0.0 <2.0.0` | Between 1.0.0 and 2.0.0 |
| Wildcard | `1.x` | Any 1.x.x |
| Any | `*` | Any version |

### 11.3 Version Resolution API

```
VersionResolver
├── satisfies(version: string, range: string): boolean
│     Returns true if the given version satisfies the range.
│
├── latestSatisfying(versions: string[], range: string): string | null
│     From a list of available versions, returns the newest that satisfies the range.
│
├── compare(a: string, b: string): -1 | 0 | 1
│     Standard SemVer comparison.
│
├── isPreRelease(version: string): boolean
│     Returns true for versions with pre-release identifiers (e.g., '1.0.0-beta.1').
│     Pre-release versions require explicit opt-in — they do NOT satisfy '^1.0.0'.
│
└── parse(version: string): ParsedVersion | null
    ├── major:      number
    ├── minor:      number
    ├── patch:      number
    └── preRelease: string | null
```

### 11.4 Version Conflict Resolution

When the same plugin ID is discovered with two different versions (from two separate `providePlugin()` calls):
1. Parse both versions
2. Keep the higher SemVer
3. Validate the kept version satisfies all declaring constraints
4. Emit `VersionConflictResolvedEvent` with both versions
5. If the kept version does NOT satisfy a dependent's constraint: the dependent is FAILED

---

## 12. Compatibility Checker

### 12.1 Purpose

Validates that a plugin is compatible with the current platform version and with the runtime environment before any loading occurs.

### 12.2 Compatibility Checks

**Check 1: Platform Version Compatibility**
```
Plugin declares:  minimumPlatformVersion = '^1.0.0'
Platform version: 1.2.3
Result: 1.2.3 satisfies '^1.0.0' → COMPATIBLE
```

**Check 2: Explicit Compatible Versions**
```
Plugin declares:  compatiblePlatformVersions = ['^1.0.0', '^1.1.0']
Platform version: 1.2.3
Result: Check each range → 1.2.3 satisfies '^1.1.0' → COMPATIBLE
```

**Check 3: Pre-release Platform**
```
Platform version: 2.0.0-rc.1
Plugin requires:  '^1.0.0' (only stable v1 range)
Result: Major version mismatch → INCOMPATIBLE
Note: Pre-release platforms only run plugins that explicitly list the pre-release version
```

**Check 4: License Validity (v2.0+)**
```
Plugin has:  license.type = 'commercial'
             license.commercial.expiresAt = '2026-01-01'
Current date: 2026-06-28
Result: License expired → FAILED with PLATFORM_INCOMPATIBLE
```

### 12.3 CompatibilityResult

```
CompatibilityResult
├── compatible:    boolean
├── pluginId:      string
├── pluginVersion: string
├── platformVersion: string
├── checks:        CompatibilityCheck[]
│   ├── name:      string
│   ├── passed:    boolean
│   └── details:   string
└── blockingFailures: string[]   — compatibility failures that block loading
```

---

## 13. Plugin Loader

### 13.1 Purpose

`PluginLoader` performs the actual work of transitioning a plugin from `RESOLVED` to `INITIALIZED`. It:
1. Calls `register()` to push all manifest entries into registries
2. Calls `initFn()` if provided
3. Registers any custom extensions (field types, validators, etc.) declared by initFn

### 13.2 Load Process (per plugin)

```
PluginLoader.load(manifest, pluginManager, registryManager):

1. Transition plugin to LOADED state
2. Register all metadata in dependency order:
   a. permissions     → PermissionRegistry
   b. lookups         → LookupRegistry
   c. validators      → ValidationRegistry
   d. themes          → ThemeRegistry
   e. locales         → LocalizationRegistry
   f. layouts         → LayoutRegistry
   g. entities        → EntityRegistry, FormRegistry, TableRegistry
   h. workflows       → WorkflowRegistry
   i. routes          → RouteRegistry
   j. menus           → MenuRegistry
   k. actions         → ActionRegistry
   l. widgets         → WidgetRegistry
   m. dashboards      → DashboardRegistry
   n. reports         → ReportRegistry

3. If any CRITICAL registration fails:
   → Transition to FAILED
   → Emit PluginFailedEvent
   → Return

4. Transition to LOADED state

5. If manifest.initFn is provided:
   a. Create PluginContext for this plugin
   b. Call initFn(context) with timeout wrapper
   c. If initFn throws or times out:
      → Transition to FAILED
      → Emit PluginFailedEvent
      → Return (do not proceed)

6. Transition to INITIALIZED state
7. Emit PluginInitializedEvent
```

### 13.3 Registration Order Rationale

Registrations in Step 2 follow dependency order within the plugin's own metadata:
- Permissions must be registered before any metadata that references them
- Validators must be registered before forms that use them
- Entities must be registered before forms, tables, routes, and menus that reference them
- Workflows must be registered before actions that derive from them

### 13.4 Partial Registration Handling

If a non-critical registration fails (e.g., a `LookupDef` fails validation), the plugin continues loading. The failed entry is recorded in `PluginRuntimeEntry.metrics` and in the diagnostics report. The plugin may still reach `ACTIVE` state with a degraded subset of its functionality.

If a critical registration fails (e.g., an `EntityDef` is invalid, blocking all related forms/tables/routes), the plugin transitions to `FAILED`.

---

## 14. Plugin Registration

### 14.1 What Registration Means

"Registration" in the Plugin System context means: all metadata from a plugin's manifest has been submitted to the Registry Manager's `register()` method. Registration does NOT mean the metadata is published yet — publication happens at `publishAll()` after all plugins have registered.

### 14.2 Plugin Registration Timeline in Boot

```
Boot Step 06 — PluginRegistrationStep (from Kernel spec):

For each plugin in sorted order:
  1. PluginLoader.load(manifest)     → LOADED + INITIALIZED
  2. RegistryManager entries accept all registrations
  3. PluginRuntimeEntry state: INITIALIZED

After all plugins loaded:
  4. RegistryManager.publishAll()    → all entries PUBLISHED
  5. Each plugin's entries verified post-publish
  6. PluginRuntimeEntry state: REGISTERED → READY
```

### 14.3 Registry Registration Order Across Plugins

Because the DependencyResolver produces a topologically sorted list:
- Plugin A's entries are registered before Plugin B's if B depends on A
- This ensures that when Plugin B's `EntityDef` references Plugin A's entities, those entities already exist in EntityRegistry when B's dependency resolution runs

---

## 15. Plugin Activation

### 15.1 Activation vs Registration

A plugin can be `REGISTERED` (its metadata is in the system) but `DISABLED` (it is not active for the current tenant). This distinction enables:

- Showing an "available plugins" list in admin panel before activation
- Tenant-by-tenant module enablement
- Graceful rollout (register globally, activate per-tenant)

### 15.2 Activation Conditions

A plugin transitions from `READY` to `ACTIVE` when:
1. `manifest.enabledByDefault = true` AND the tenant has not explicitly disabled it, OR
2. The tenant admin explicitly enables it through the admin panel (v1.1+)

### 15.3 Activation Effects

When a plugin becomes `ACTIVE`:
- Its menu items become visible in the sidebar (MenuEngine applies permission filter)
- Its routes become navigable (permissionGuard uses PlatformContext which checks active modules)
- Its widgets appear in the dashboard widget picker
- Its capabilities are counted in the capability registry
- The `moduleCode` in its entries becomes available in `PlatformContext.activeModules`

### 15.4 Activation Does Not Re-Register

Activating a plugin does NOT re-register its metadata — all metadata was registered during the boot pipeline. Activation simply updates `PlatformContext.activeModules` to include the plugin's module codes, which the MenuEngine and permissionGuard check reactively through signals.

---

## 16. Plugin Deactivation

### 16.1 Graceful Deactivation (v1.1+)

When a tenant admin disables a plugin:
1. `PluginHost.deactivate(pluginId)` is called
2. `PluginDeactivateFn` is called (if declared in manifest v1.1+)
3. `PlatformContext.activeModules` removes the plugin's module codes
4. MenuEngine reactively hides the plugin's menu items (via signal `computed()`)
5. Route guard blocks access to the plugin's routes
6. Active users on the plugin's screens are redirected to dashboard
7. Plugin transitions: `ACTIVE → DISABLED`
8. `PluginDisabledEvent` emitted

### 16.2 Deactivation Does Not Unregister

Deactivation does NOT remove the plugin's metadata from registries. If the tenant re-enables the plugin, it becomes `ACTIVE` again immediately (no re-registration needed, no re-boot needed).

---

## 17. Plugin Disposal

### 17.1 Boot-Time Disposal

During kernel `shutdown()`, all plugins are disposed in reverse load order:
1. Plugins with no dependents are disposed first
2. Each plugin: `ACTIVE → STOPPED`
3. `PluginStoppedEvent` emitted
4. Resources released (subscriptions cancelled, timers cleared)

### 17.2 Hot-Reload Disposal (v1.1+)

For runtime plugin removal:
1. Plugin transitions: `STOPPED → UNLOADED`
2. All registry entries from this plugin are removed (`registry.unregister()`)
3. `PluginRemovedEvent` emitted
4. `PluginRuntimeEntry` removed from PluginManager

### 17.3 Disposal Safety

The platform guarantees that no engine holds a live reference to plugin metadata after disposal. The freeze mechanism (entries are frozen objects) means they are garbage-collectible once all engine components are destroyed. The signals pattern ensures components that depend on registry entries will re-compute when entries are removed.

---

## 18. Plugin Context

### 18.1 Purpose

`PluginContext` is the sandbox passed to a plugin's `initFn()`. It provides controlled access to platform services without exposing the full Angular injector.

### 18.2 PluginContext API

```
PluginContext
│
├── pluginId:     string             — the ID of the plugin receiving this context
│
├── // Registry access (for registering custom extensions)
├── fieldRegistry:       FieldRegistry        — register custom field types
├── validationRegistry:  ValidationRegistry   — register custom validators
├── cellRendererRegistry: CellRendererRegistry — register custom cell renderers
├── widgetRegistry:      WidgetRegistry       — register additional widgets
├── healthService:       HealthService        — register plugin health checks
│
├── // Platform services (read-only access)
├── platformVersion:     PlatformVersion      — current platform version
├── config:              PlatformConfigResolved  — platform config (read-only)
│
├── // Event Bus (scoped to plugin namespace)
├── events:              PluginEventScope
│   ├── emit(event: PluginEvent): void
│   │     Prefix: event.type is automatically prefixed with '{pluginId.lower()}:'
│   ├── on<T>(type: string): Observable<T>
│   └── off(subscriptionId: string): void
│
├── // Logging (scoped to plugin)
├── logger:              PluginLogger
│   ├── debug(msg: string, ...meta: unknown[]): void
│   ├── info(msg:  string, ...meta: unknown[]): void
│   ├── warn(msg:  string, ...meta: unknown[]): void
│   └── error(msg: string, ...meta: unknown[]): void
│
├── // Capability query
├── hasCapability(capabilityId: string): boolean
│
└── // Feature flags
    featureFlags:        PluginFeatureFlagScope
    ├── isEnabled(key: string): boolean
    └── getAll(): Record<string, boolean>
```

### 18.3 What PluginContext Does NOT Expose

| Excluded | Reason |
|---|---|
| `HttpClient` | HTTP calls belong in `ActionDef.handler`, not in `initFn` |
| `Router` | Routing is the platform's responsibility |
| `RegistryManager.publishAll()` | Only the platform controls the publish phase |
| `BootManager` or `PlatformKernel` | Plugins cannot control boot |
| Other plugin's `PluginContext` | Inter-plugin isolation |
| Angular `Injector` | Would allow circumventing all isolation rules |

---

## 19. Plugin Capabilities

### 19.1 Purpose

Capabilities are named strings that plugins declare they provide. Other plugins can check capability availability without importing from each other. Engines and guards can conditionally enable features based on capability availability.

### 19.2 Capability Convention

```
Format:  '{domain}:{capability-name}'
Examples:
  'hr:employee-management'
  'fleet:vehicle-tracking'
  'gl:multi-currency'
  'payroll:payslip-generation'
  'crm:opportunity-pipeline'
  'auth:sso'
  'auth:2fa'
```

### 19.3 Capability Registry (runtime)

The `PluginHost` maintains a runtime capability map:

```
CapabilityMap: Map<capabilityId, string[]>
  key:   capability string
  value: pluginIds[] that declare this capability
```

After all plugins reach `ACTIVE`, `CapabilityMap` is populated. When a plugin is deactivated, its capabilities are removed.

### 19.4 Capability Queries

```
PluginHost
├── hasCapability(id: string): boolean
│     Returns true if at least one ACTIVE plugin declares this capability.
│
├── getCapabilityProviders(id: string): string[]
│     Returns the pluginIds of all ACTIVE plugins providing this capability.
│
├── getAllCapabilities(): string[]
│     Returns all capabilities provided by all ACTIVE plugins.
│
└── getPluginCapabilities(pluginId: string): string[]
      Returns all capabilities declared by a specific plugin.
```

### 19.5 Exclusive Capabilities

Some capabilities are exclusive — only one plugin should provide them. Examples:
- `platform:theme-provider` — only one active theme can be the default
- `gl:currency-provider` — only one GL plugin provides currency conversion

Exclusive capabilities are declared with `@` prefix:
```
capabilities: ['@gl:currency-provider']
```

The `CompatibilityChecker` detects exclusive capability conflicts and emits a warning (not an error — the first-registered wins, same as ThemeRegistry).

---

## 20. Plugin Configuration

### 20.1 Purpose

Plugins may declare configuration schema — key-value settings that tenant admins can modify through the admin panel without redeployment.

### 20.2 PluginConfig in Manifest

```
PluginManifest.config:  PluginConfigSchema | null
│
├── schema:   FormSchema    — uses FormEngine to render the config UI
│               All fields are string | number | boolean | string[]
│
└── defaults: Record<string, unknown>
```

### 20.3 Config Access in initFn

```typescript
// In plugin's initFn:
const maxUploadSize = context.config.get('maxUploadSizeMb') as number ?? 10;
```

### 20.4 Config Storage

- `defaults` are provided by the plugin manifest
- Overrides are stored in the backend: `GET/PUT /v1/plugins/{pluginId}/config`
- The `PluginContext.config` merges defaults + backend overrides at runtime
- Config changes require the tenant admin panel (v1.1+)

---

## 21. Plugin Metadata

### 21.1 Plugin Metadata vs Registry Entries

| | Plugin Metadata | Registry Entries |
|---|---|---|
| Location | `PluginRuntimeEntry.manifest` | `RegistryManager.*` |
| Purpose | Plugin system information | Engine rendering information |
| Mutable | Never | Never (after publish) |
| Queryable by engines | No (engines use Registry) | Yes |
| Examples | id, version, author, dependencies | EntityDef, FormSchema, TableDef |

### 21.2 Metadata Enrichment

During the boot pipeline, the platform enriches the manifest with runtime metadata:

```
PluginManifest (enriched by platform at runtime):
  installedAt:     string       — when providePlugin() was processed
  installSource:   'bundled'    — in v1.0, always 'bundled'
  resolvedVersion: string       — the version actually used (post version-conflict resolution)
```

### 21.3 Metadata Persistence (v1.1+)

For non-bundled plugins (tenant plugins, marketplace plugins), the platform persists manifest metadata to the backend:
- `POST /v1/platform/plugins` — register a new plugin
- `GET  /v1/platform/plugins` — list all tenant plugins
- `PUT  /v1/platform/plugins/{id}/status` — enable/disable

---

## 22. Plugin Error Isolation

### 22.1 The Isolation Contract

**A plugin failure must never cause:**
- The platform shell to crash (blank screen / uncaught error)
- Another plugin to fail
- The Angular application to unmount
- The PluginHost itself to enter an error state

**A plugin failure WILL cause:**
- The plugin to enter `FAILED` state
- Its menu items to disappear
- Its routes to redirect to a "module unavailable" page
- Its entries to be excluded from the registry (or removed if hot-reload)
- A visible warning in the platform admin diagnostics panel

### 22.2 Error Boundary Points

The platform wraps every plugin interaction at these four boundaries:

**Boundary 1: initFn() execution**
```
try {
  await withTimeout(manifest.initFn(context), pluginInitTimeoutMs)
} catch (err) {
  pluginManager.transition(manifest.id, 'FAILED', createError('INIT_FAILED', err))
  return  // do not proceed — plugin does not reach INITIALIZED
}
```

**Boundary 2: Registry registration**
```
const result = registry.register(def, manifest.id)
if (!result.success && isCriticalEntry(def)) {
  pluginManager.transition(manifest.id, 'FAILED', createError('REGISTRY_FAILED', result.errors))
  return
}
// Non-critical failures: record in degradedBy[], continue
```

**Boundary 3: ActionDef.handler() execution (runtime)**
```
// ActionEngine wraps every handler call:
try {
  await action.handler(context)
} catch (err) {
  // Never propagates to Angular change detection
  eventBus.emit({ type: 'action:failed', actionId, error: String(err) })
  showErrorToast(action.errorMessage ?? 'Action failed.')
}
```

**Boundary 4: Custom component rendering (runtime)**
```
// EntityViewComponent wraps all plugin-contributed components:
@if (entityDef()) {
  <ng-container [ngComponentOutlet]="resolvedComponent()" />
} @else {
  <app-module-unavailable [entityId]="entityId" />
}
```

### 22.3 Error Propagation Rules

```
Error occurs in plugin X:
  │
  ├── During initFn()
  │   └─► X → FAILED
  │       All plugins that depend on X → FAILED (cascade)
  │       Platform: DEGRADED (not ERROR)
  │       Affected menu items: hidden
  │       Affected routes: redirect to /app/module-unavailable
  │
  ├── During registry registration (critical entry)
  │   └─► Same as initFn() failure
  │
  ├── During registry registration (non-critical entry)
  │   └─► X → stays in LOADED state, records degradedEntry
  │       Specific feature is unavailable, rest of plugin works
  │
  ├── During ActionDef.handler() (runtime)
  │   └─► Error toast shown to user
  │       Plugin stays ACTIVE
  │       Other actions work normally
  │
  └── During custom component render (runtime)
      └─► Angular ErrorBoundary catches the error
          Renders <app-component-error> in place of the component
          Plugin stays ACTIVE
          Other components work normally
```

### 22.4 Platform vs Plugin Error Codes

```
Platform errors (halt boot):
  - REGISTRY_INIT_FAILED (Step 03)
  - ROUTE_BUILD_FAILED (Step 08)
  - CONFIG_MISSING (Step 01)

Plugin errors (degrade, never halt):
  - MANIFEST_INVALID
  - DEPENDENCY_MISSING
  - VERSION_INCOMPATIBLE
  - INIT_FAILED
  - REGISTRY_FAILED (critical entry)
```

---

## 23. Plugin Health

### 23.1 Plugin Health Model

Each plugin contributes health checks to `HealthService` through its `initFn`. These checks represent plugin-specific concerns (e.g., "is the HR backend endpoint reachable?", "is the currency rate service responding?").

### 23.2 PluginHealthCheck

Implements `IHealthCheck` (from HealthService spec):

```
PluginHealthCheck (implements IHealthCheck)
├── name:        '{pluginId}:{check-name}'   — namespaced to plugin
├── description: string
├── pluginId:    string
└── check():     Promise<HealthCheckResult>
```

### 23.3 Plugin Health Report

The `PluginDiagnosticsReport` includes a per-plugin health section:

```
PluginHealthSummary
├── pluginId:          string
├── overallStatus:     'healthy' | 'degraded' | 'unhealthy' | 'unknown'
├── checks:            HealthCheckResult[]
└── lastCheckedAt:     string
```

### 23.4 Health Aggregation

`PluginHost.getHealthReport()` aggregates all plugin health checks:
- If any plugin reports `unhealthy`: PluginSystem → `degraded` (platform continues)
- Individual plugin health does not affect other plugins
- Health checks run every 60 seconds in production (configurable), on-demand in dev

---

## 24. Plugin Events

### 24.1 Event Union

```typescript
type PluginSystemEvent =
  // ── Discovery ──────────────────────────────────────────────────────────
  | PluginDiscoveredEvent
  | PluginRejectedEvent
  | PluginDuplicateDetectedEvent

  // ── Validation ─────────────────────────────────────────────────────────
  | PluginValidatedEvent
  | PluginValidationFailedEvent

  // ── Resolution ─────────────────────────────────────────────────────────
  | PluginResolvedEvent
  | PluginDependencyMissingEvent
  | PluginVersionConflictEvent
  | PluginVersionConflictResolvedEvent
  | PluginCircularDependencyEvent
  | PluginCapabilityMissingEvent
  | PluginCompatibilityFailedEvent

  // ── Loading ────────────────────────────────────────────────────────────
  | PluginLoadedEvent
  | PluginInitializedEvent
  | PluginInitTimeoutEvent

  // ── Registration ───────────────────────────────────────────────────────
  | PluginRegisteredEvent

  // ── Readiness ──────────────────────────────────────────────────────────
  | PluginReadyEvent
  | PluginDegradedEvent

  // ── Activation ─────────────────────────────────────────────────────────
  | PluginActivatedEvent
  | PluginDeactivatedEvent

  // ── Runtime ────────────────────────────────────────────────────────────
  | PluginDisabledEvent
  | PluginEnabledEvent
  | PluginStoppedEvent
  | PluginRemovedEvent

  // ── Failure ────────────────────────────────────────────────────────────
  | PluginFailedEvent

  // ── System ─────────────────────────────────────────────────────────────
  | PluginSystemReadyEvent
  | PluginSystemDegradedEvent;
```

### 24.2 Key Event Definitions

```
PluginDiscoveredEvent
  type:            'plugin:discovered'
  timestamp:       string
  pluginId:        string
  pluginName:      string
  pluginVersion:   string
  source:          PluginInstallSource

PluginValidatedEvent
  type:            'plugin:validated'
  timestamp:       string
  pluginId:        string
  warnings:        string[]

PluginValidationFailedEvent
  type:            'plugin:validation:failed'
  timestamp:       string
  pluginId:        string
  errors:          string[]

PluginDependencyMissingEvent
  type:            'plugin:dep:missing'
  timestamp:       string
  pluginId:        string
  missingPluginId: string
  versionRange:    string
  optional:        boolean

PluginCircularDependencyEvent
  type:            'plugin:dep:cycle'
  timestamp:       string
  cycle:           string[]        — ordered list of pluginIds forming the cycle

PluginLoadedEvent
  type:            'plugin:loaded'
  timestamp:       string
  pluginId:        string
  loadDurationMs:  number

PluginInitializedEvent
  type:            'plugin:initialized'
  timestamp:       string
  pluginId:        string
  initDurationMs:  number

PluginRegisteredEvent
  type:            'plugin:registered'
  timestamp:       string
  pluginId:        string
  entryCounts:     Record<string, number>  — { entity: 3, form: 6, route: 3, ... }

PluginReadyEvent
  type:            'plugin:ready'
  timestamp:       string
  pluginId:        string
  degradedBy:      string[]   — optional deps that were missing

PluginActivatedEvent
  type:            'plugin:activated'
  timestamp:       string
  pluginId:        string
  activatedBy:     'default' | 'admin' | 'feature-flag'

PluginDisabledEvent
  type:            'plugin:disabled'
  timestamp:       string
  pluginId:        string
  disabledBy:      'admin' | 'feature-flag' | 'license-expired'

PluginFailedEvent
  type:            'plugin:failed'
  timestamp:       string
  pluginId:        string
  errorCode:       PluginErrorCode
  errorMessage:    string
  state:           PluginLifecycleState   — state at time of failure

PluginRemovedEvent
  type:            'plugin:removed'
  timestamp:       string
  pluginId:        string
  removedBy:       'admin' | 'hot-reload'

PluginSystemReadyEvent
  type:            'plugin-system:ready'
  timestamp:       string
  loadedCount:     number
  failedCount:     number
  disabledCount:   number
  durationMs:      number

PluginSystemDegradedEvent
  type:            'plugin-system:degraded'
  timestamp:       string
  failedPlugins:   string[]
  reason:          string
```

---

## 25. Plugin Diagnostics

### 25.1 PluginDiagnosticsReport

```
PluginDiagnosticsReport
│
├── generatedAt:           string
├── systemStatus:          PluginSystemStatus
├── totalDiscovered:       number
├── totalLoaded:           number       — reached LOADED
├── totalActive:           number       — in ACTIVE state
├── totalFailed:           number
├── totalDisabled:         number
│
├── plugins:               PluginDiagnosticsEntry[]
│   Per-plugin detail:
│   ├── id:                string
│   ├── name:              string
│   ├── version:           string
│   ├── state:             PluginLifecycleState
│   ├── error:             PluginError | null
│   ├── metrics:           PluginMetrics
│   ├── resolvedDeps:      ResolvedDependency[]
│   ├── degradedBy:        string[]
│   ├── entryCounts:       Record<string, number>
│   ├── capabilities:      string[]
│   └── health:            PluginHealthSummary
│
├── dependencyGraph:       DependencyGraphView
│   ├── nodes:    Array<{ id: string; state: PluginLifecycleState }>
│   └── edges:    Array<{ from: string; to: string; optional: boolean }>
│
├── loadOrder:             string[]         — sorted order plugins were loaded
│
├── failedPlugins:         PluginFailureSummary[]
│   ├── pluginId:          string
│   ├── errorCode:         PluginErrorCode
│   ├── errorMessage:      string
│   └── cascadedFrom?:     string          — if this plugin failed due to a dep failure
│
├── versionConflicts:      VersionConflict[]
│   ├── pluginId:          string
│   ├── versions:          string[]
│   └── winner:            string
│
├── missingDependencies:   MissingPluginDependency[]
│   ├── requiredBy:        string
│   ├── missingPluginId:   string
│   └── versionRange:      string
│
├── cycles:                DependencyCycle[]
│   ├── participants:      string[]
│   └── impact:            string[]
│
├── capabilityGaps:        CapabilityGap[]
│   ├── requiredBy:        string
│   └── capability:        string
│
├── performanceMetrics:    PluginSystemMetrics
│   ├── discoveryDurationMs:   number
│   ├── resolutionDurationMs:  number
│   ├── totalLoadDurationMs:   number
│   ├── longestInitPlugin:     { pluginId: string; durationMs: number }
│   ├── longestRegPlugin:      { pluginId: string; durationMs: number }
│   └── totalBootContributionMs: number
│
└── healthSummary:         PluginHealthSummary[]
```

### 25.2 Diagnostics Access Points

| Access Method | Available When |
|---|---|
| `window.__idoo.plugins()` | Development mode, any time |
| `window.__idoo.diagnostics()` | Development mode, any time |
| Admin Panel → Platform → Plugins | ACTIVE state, admin permission |
| `PluginHost.getDiagnostics()` | Any time after boot |
| `GET /v1/platform/diagnostics` | Backend API (admin only) |

---

## 26. Boot Pipeline Integration

The Plugin System integrates into the Kernel Boot Pipeline at three steps:

### 26.1 Full Integrated Boot Sequence

```
Boot Step 01: ConfigurationStep
     │ loads PlatformConfig
     ▼
Boot Step 02: StartupValidationStep
     │ validates environment
     ▼
Boot Step 03: RegistryInitStep
     │ all 16 registries enter OPEN state
     ▼
Boot Step 04: PluginDiscoveryStep
     │
     │ Reads PLUGIN_MANIFEST_TOKEN → Array<PluginManifest>
     │ PluginDiscovery.discover(manifests)
     │   → deduplication
     │   → schema validation
     │   → transition each to DISCOVERED or FAILED(MANIFEST_INVALID)
     │   → emit PluginDiscoveredEvent for each
     │
     │ BootContext.discoveredManifests = validated manifests
     ▼
Boot Step 05: DependencyGraphStep
     │
     │ DependencyResolver.resolve(discoveredManifests)
     │   → build dependency graph
     │   → detect cycles → FAILED(CIRCULAR_DEPENDENCY)
     │   → detect missing required deps → FAILED(DEPENDENCY_MISSING) + cascade
     │   → detect version conflicts → VersionResolver resolves or FAILED
     │   → check required capabilities → FAILED(CAPABILITY_MISSING)
     │   → topological sort (Kahn's)
     │   → validate optional deps (degrade if missing)
     │
     │ BootContext.sortedPluginIds = [array in load order]
     ▼
Boot Step 06: PluginRegistrationStep   ← MAIN PLUGIN BOOT STEP
     │
     │ For each pluginId in sortedPluginIds:
     │   1. CompatibilityChecker.check(manifest) → FAILED if incompatible
     │   2. PluginLoader.load(manifest):
     │      a. Push all metadata to registries (entries: PENDING → VALID)
     │      b. Transition plugin: RESOLVED → LOADED → INITIALIZED
     │      c. Call initFn(context) if present
     │      d. On failure: FAILED, cascade to dependents
     │
     │ After all plugins processed:
     │ RegistryManager.publishAll()
     │   → deferred deps resolved
     │   → overrides merged
     │   → all registries: PUBLISHED
     │
     │ Verify each plugin post-publish:
     │   INITIALIZED → REGISTERED → READY → ACTIVE (if enabledByDefault)
     │
     │ BootContext.loadedPluginIds = active plugins
     │ BootContext.failedPluginIds = failed plugins
     │
     │ PluginSystemReadyEvent emitted
     ▼
Boot Step 07: SecurityInitStep
     │ restore session (uses PlatformContext — now populated with activeModules)
     ▼
Boot Step 08: RouteBuildStep
     │ RouteRegistry.buildAngularRoutes() → Angular Router.resetConfig()
     ▼
Boot Step 09: ReadyStep
     │ kernel:ready or kernel:degraded emitted
```

### 26.2 Boot Performance Budget

The Plugin System's contribution to boot time:

| Phase | Budget | Measurement |
|---|---|---|
| Discovery | < 10ms | Synchronous reads from array |
| Dependency resolution | < 20ms | Graph traversal (linear in plugins) |
| Per-plugin registration | < 50ms/plugin | Registry pushes |
| initFn (all plugins, parallel group) | < 500ms total | Sequential in load order |
| publishAll() | < 200ms | Registry Manager (see Registry spec) |
| Post-publish verification | < 50ms | State transitions |
| **Total Plugin System budget** | **< 1000ms** | For 50 plugins |

The total boot time target (< 2000ms) allocates 1000ms to the Plugin System and 1000ms to everything else (Angular bootstrap, network, rendering).

---

## 27. Dependency Graph

### 27.1 Graph Structure

```
  Nodes: One per plugin manifest
  Edges: Directed, from dependent → dependency
  Properties on each edge:
    required: boolean
    version:  string (the declared range)

  Example graph for a typical ERP deployment:

  PLATFORM_CORE ────── (no deps)
  AUTH          ────── depends on: PLATFORM_CORE
  HR            ────── depends on: AUTH
  PAYROLL       ────── depends on: HR
  GL            ────── depends on: AUTH
  FLEET         ────── depends on: HR (optional: for driver assignment)
  CRM           ────── depends on: AUTH
  INVENTORY     ────── depends on: GL
  POS           ────── depends on: INVENTORY, GL
  REPORTING     ────── depends on: HR, FLEET, GL, CRM, INVENTORY (optional all)

  Sorted load order (Kahn's):
  1. PLATFORM_CORE
  2. AUTH
  3. HR, GL, CRM          (all depend only on AUTH — parallel group)
  4. PAYROLL, FLEET, INVENTORY  (depend on previous tier — parallel group)
  5. POS, REPORTING       (depend on tier 4 — parallel group)
```

### 27.2 Parallel Load Groups

Within each dependency tier (all nodes with the same topological level), plugins can be loaded in parallel in a future optimisation. In v1.0, plugins are loaded sequentially in sorted order for simplicity. v1.1 will introduce `Promise.all()` within each tier.

### 27.3 Dependency Graph Visual Format

```
Directed Acyclic Graph (after cycle removal):

  ┌─────────────────┐
  │  PLATFORM_CORE  │
  └────────┬────────┘
           │
  ┌────────▼────────┐
  │      AUTH       │
  └────────┬────────┘
           │
  ┌────────┼──────────────────────┐
  │        │                      │
  ▼        ▼                      ▼
 HR        GL                    CRM
  │        │
  │   ┌────┴──────┐
  │   │           │
  ▼   ▼           ▼
PAYROLL  INVENTORY  FLEET───(optional)───►HR
              │
         ┌────┤
         │    │
         ▼    ▼
         POS  REPORTING◄────(optional)────HR,CRM,GL
```

### 27.4 Cycle Detection Output

When a cycle is detected:

```
Cycle detected: GL → PAYROLL → GL
All cycle participants: ['GL', 'PAYROLL']
Resolution: Both marked FAILED(CIRCULAR_DEPENDENCY)
Cascade: All plugins that depend on GL or PAYROLL are also FAILED
```

---

## 28. Plugin Ordering

### 28.1 Load Order Rules

1. Dependency topology is the primary ordering criterion
2. Within the same topology level (no mutual deps): order by `overridePriority` descending
3. Within same priority: order by `id` alphabetically (deterministic)
4. Override plugins (high `overridePriority`) load after the plugins they override

### 28.2 Initialization Order vs Registration Order

- **Initialization order** = topological sort result = the order `initFn` is called
- **Registration order** = same as initialization order (initFn is called before registration in the same step)
- **Override application order** = by `overridePriority` descending (higher = applied later = wins)

### 28.3 Why Order Matters for Overrides

If `TENANT_CONFIG` (overridePriority: 100) registers after `HR` (overridePriority: 0):
- HR registers `hr:employee` EntityDef → enters registry as VALID
- TENANT_CONFIG registers override of `hr:employee` → override merge applied
- publishAll() → merged definition is the final state

If TENANT_CONFIG were to load before HR (wrong order), the override would fail because the base entry doesn't exist yet. The override system handles deferred resolution — overrides are queued and applied during publishAll() regardless of registration order — but the deterministic ordering is documented for clarity.

---

## 29. Plugin Licensing (Future-Ready)

### 29.1 Architecture Design (v2.0)

The licensing system is not implemented in v1.0 but the architecture is designed now so that manifests are already license-ready.

```
                    ┌───────────────────────────────────┐
                    │          LicenseService            │
                    │                                    │
                    │  + validate(manifest): LicenseResult
                    │  + getStatus(pluginId): LicenseStatus
                    │  + refresh(): Promise<void>        │
                    └───────────────┬───────────────────┘
                                    │
               ┌────────────────────┼───────────────────────┐
               │                    │                        │
  ┌────────────▼──────┐  ┌──────────▼──────────┐  ┌────────▼──────────┐
  │  LocalValidator   │  │  RemoteValidator      │  │  CacheLayer       │
  │  (expiry dates,   │  │  (calls license API   │  │  (7-day TTL for   │
  │   seat limits)    │  │   for online check)   │  │   offline use)    │
  └───────────────────┘  └─────────────────────-┘  └───────────────────┘
```

### 29.2 License Validation Flow (v2.0)

```
CompatibilityChecker (v2.0):
  1. If manifest.license.type = 'commercial':
     a. Extract license.commercial.licenseKey
     b. Call LicenseService.validate(manifest)
     c. LicenseService:
        - Check expiry date (local, always)
        - Check seat count (local, if available)
        - Try remote validation (LicenseServerAPI)
        - Use cache if offline (7-day grace)
     d. If INVALID: plugin → FAILED(LICENSE_INVALID)
     e. If EXPIRED: plugin → FAILED(LICENSE_EXPIRED)
     f. If SEATS_EXCEEDED: plugin → DEGRADED(LICENSE_SEATS)
```

### 29.3 License Types

| Type | v1.0 | v2.0 | Description |
|---|---|---|---|
| `mit` | Full support | Full support | Open source |
| `apache-2.0` | Full support | Full support | Open source |
| `commercial` | Schema ready | Enforced | Paid license with key |
| `proprietary` | Schema ready | Enforced | No redistribution |
| `custom` | Schema ready | Enforced | Custom EULA |

---

## 30. Runtime Plugin Support (Future-Ready)

### 30.1 Runtime Installation (v1.1)

Allows a tenant admin to install a new plugin without a full page reload.

```
Admin Action: Install Plugin
     │
     │ POST /v1/platform/plugins { manifestUrl, licenseKey }
     ▼
Backend:
  - Download manifest from URL
  - Validate license
  - Store manifest in tenant plugin registry
  - Return: manifest + activation token

Frontend (v1.1):
  - PluginHost.installPlugin(manifest)
  - Runs discovery + validation + resolution
  - PluginLoader.load(manifest)
  - RegistryManager: individual registries enter REFRESHING
  - New entries registered and published
  - Angular Router.resetConfig() adds new routes
  - MenuEngine signal re-computes (new menu items appear)
  - Plugin → ACTIVE
```

### 30.2 Runtime Removal (v1.1)

```
Admin Action: Remove Plugin
     │
     │ DELETE /v1/platform/plugins/{pluginId}
     ▼
Frontend:
  - Check: any other ACTIVE plugin depends on this one?
    YES → refuse removal (show dependents list)
    NO  → proceed
  - PluginHost.removePlugin(pluginId)
  - Plugin: ACTIVE → STOPPED → UNLOADED
  - RegistryManager: remove all entries from this plugin
  - Angular Router.resetConfig() removes routes
  - MenuEngine signal re-computes (items disappear)
  - Active users on this plugin's screens: redirect to /app/dashboard
```

### 30.3 Marketplace Architecture (v2.0)

```
                    ┌─────────────────────────┐
                    │   iDoo Plugin Marketplace│
                    │   marketplace.idoo.io    │
                    └────────────┬────────────┘
                                 │ HTTPS
                    ┌────────────▼────────────┐
                    │  MarketplaceService      │
                    │  + search(query)         │
                    │  + getPlugin(id)         │
                    │  + install(id, license)  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  RemotePluginLoader      │
                    │  + loadFromUrl(url)      │
                    │  + verifySignature(pkg)  │
                    │  + sandboxExecute(fn)    │
                    └─────────────────────────┘
```

### 30.4 Tenant Plugins (v1.1)

Tenant plugins are manifests stored in the backend per-tenant. They are loaded at boot in addition to bundled plugins:

```
Boot Step 04 (v1.1 extended):
  1. Read PLUGIN_MANIFEST_TOKEN (bundled plugins)
  2. GET /v1/platform/plugins?tenantId={tenantId} (tenant plugins)
  3. Merge both sets
  4. Continue with deduplication + validation
```

### 30.5 Hot Reload Architecture (v1.1)

Full hot reload without page refresh:

```
Architecture requirements:
  - RegistryManager supports REFRESHING state (per Section 31 of Registry spec)
  - Angular Router supports resetConfig() at runtime
  - MenuEngine derives from signals (re-renders when registry changes)
  - FormEngine, TableEngine, ActionEngine use signals (re-render when defs change)
  - PluginContext subscriptions cleaned up via takeUntilDestroyed()

Hot reload trigger: webpack HMR (dev) or admin-initiated update (prod v2.0)
  - PluginHost.reloadPlugin(pluginId, newManifest)
  - Old plugin: ACTIVE → STOPPED → UNLOADED
  - Registry entries removed
  - New manifest loaded: full discovery → active lifecycle
  - New entries published
  - Running components using old defs: graceful re-render via signal invalidation
```

---

## 31. Sequence Diagrams

### 31.1 Complete Plugin Boot Sequence

```
  app.config.ts  Angular DI  PlatformKernel  PluginHost  PluginDiscovery  DependencyResolver  PluginLoader  RegistryManager
       │             │              │              │               │                  │                │              │
       │ providePlugin (×N)         │              │               │                  │                │              │
       │─────────────►│             │              │               │                  │                │              │
       │              │ APP_INIT    │              │               │                  │                │              │
       │              │────────────►│              │               │                  │                │              │
       │              │             │ boot()       │               │                  │                │              │
       │              │             │─────────────►│               │                  │                │              │
       │              │             │              │ Step 04       │                  │                │              │
       │              │             │              │──────────────►│                  │                │              │
       │              │             │              │               │ read manifests   │                │              │
       │              │             │              │               │ from DI token    │                │              │
       │              │             │              │               │ validate schemas │                │              │
       │              │             │              │◄──────────────│ DiscoveryResult  │                │              │
       │              │             │              │ Step 05       │                  │                │              │
       │              │             │              │──────────────────────────────────►                │              │
       │              │             │              │               │                  │ buildGraph()   │              │
       │              │             │              │               │                  │ detectCycles() │              │
       │              │             │              │               │                  │ topologicalSort│              │
       │              │             │              │◄──────────────────────────────── ResolutionResult │              │
       │              │             │              │ Step 06       │                  │                │              │
       │              │             │              │               │                  │                │              │
       │              │             │              │ For each pluginId in sorted order:               │              │
       │              │             │              │──────────────────────────────────────────────────►              │
       │              │             │              │               │                  │ compatCheck()  │              │
       │              │             │              │               │                  │ load(manifest) │              │
       │              │             │              │               │                  │ register(entity)──────────────►
       │              │             │              │               │                  │ register(form) ───────────────►
       │              │             │              │               │                  │ register(route)───────────────►
       │              │             │              │               │                  │ register(menu) ───────────────►
       │              │             │              │               │                  │ initFn(context)│              │
       │              │             │              │               │                  │                │              │
       │              │             │              │ (all plugins loaded)             │                │              │
       │              │             │              │               │                  │   publishAll() ──────────────►│
       │              │             │              │               │                  │                │◄─────────────│
       │              │             │              │               │                  │ verify entries │              │
       │              │             │              │               │                  │ REGISTERED→READY→ACTIVE      │
       │              │             │              │◄──────────────────────────────── PluginBootResult │              │
       │              │             │◄─────────────│ step complete │                  │                │              │
       │              │             │ Steps 07,08,09              │                  │                │              │
       │              │◄────────────│ APP_INIT resolved            │                  │                │              │
       │              │ first navigation             │              │                  │                │              │
```

### 31.2 Plugin Failure with Cascade

```
  PluginHost      DependencyResolver    PluginManager     EventBus
      │                   │                   │               │
      │ resolve(manifests)│                   │               │
      │──────────────────►│                   │               │
      │                   │ Check: GL requires CURRENCY       │
      │                   │ CURRENCY not in manifest set      │
      │                   │ GL → FAILED(DEPENDENCY_MISSING)   │
      │                   │ Check: PAYROLL requires GL        │
      │                   │ GL is FAILED → PAYROLL cascade    │
      │                   │ PAYROLL → FAILED(DEPENDENCY_MISSING, cascadedFrom: GL)
      │                   │ Check: REPORTING requires GL (optional)
      │                   │ GL is FAILED, optional → DEGRADED │
      │◄──────────────────│ ResolutionResult                  │
      │                   │   failed: [GL, PAYROLL]           │
      │                   │   sorted: [AUTH, HR, CRM, REPORTING] (without GL/PAYROLL)
      │                   │                                   │
      │ transition(GL, FAILED)           │                    │
      │──────────────────────────────────►                    │
      │                   │                                   │ PluginFailedEvent(GL)
      │                   │                                   │──────────────────────►
      │ transition(PAYROLL, FAILED)       │                   │
      │──────────────────────────────────►                    │
      │                   │                                   │ PluginFailedEvent(PAYROLL)
      │                   │                                   │──────────────────────►
      │ load(REPORTING, degraded)         │                   │
      │──────────────────────────────────►                    │
      │                   │                                   │ PluginDegradedEvent(REPORTING)
      │                   │                                   │──────────────────────►
```

### 31.3 Runtime Plugin Installation (v1.1)

```
  Admin Panel    PluginHost     PluginDiscovery    RegistryManager    Router    MenuEngine
       │               │               │                  │             │            │
       │ installPlugin(manifest)        │                  │             │            │
       │──────────────►│               │                  │             │            │
       │               │ discover([m]) │                  │             │            │
       │               │──────────────►│                  │             │            │
       │               │◄──────────────│ DiscoveryResult  │             │            │
       │               │ resolveDeps() │                  │             │            │
       │               │ compatCheck() │                  │             │            │
       │               │ load(m)       │                  │             │            │
       │               │ register(entries)────────────────►            │            │
       │               │               │                  │ REFRESHING  │            │
       │               │               │           publishNew()        │            │
       │               │               │                  │ PUBLISHED   │            │
       │               │ resetConfig(new routes)──────────────────────►│            │
       │               │ activeModules.update()─────────────────────────────────────►
       │               │               │                  │             │ new routes │ menu recomputes
       │               │               │                  │             │ available  │ new items visible
       │◄──────────────│ installResult  │                  │             │            │
```

---

## 32. State Diagram

### 32.1 Complete Plugin State Machine (Formal)

```
States (S):
  S = { DISCOVERED, VALIDATED, RESOLVED, LOADED, INITIALIZED,
        REGISTERED, READY, ACTIVE, FAILED, DISABLED, STOPPED, UNLOADED }

Terminal states (no outgoing transitions in v1.0):
  T = { FAILED, UNLOADED }

Initial state: DISCOVERED

Transition function δ:
  δ(DISCOVERED,  schema_valid)        = VALIDATED
  δ(DISCOVERED,  schema_invalid)      = FAILED
  δ(VALIDATED,   deps_resolved)       = RESOLVED
  δ(VALIDATED,   dep_missing)         = FAILED
  δ(VALIDATED,   version_conflict)    = FAILED
  δ(VALIDATED,   compat_fail)         = FAILED
  δ(RESOLVED,    loaded)              = LOADED
  δ(RESOLVED,    critical_reg_fail)   = FAILED
  δ(LOADED,      init_complete)       = INITIALIZED
  δ(LOADED,      init_failed)         = FAILED
  δ(LOADED,      init_timeout)        = FAILED
  δ(INITIALIZED, publish_ok)          = REGISTERED
  δ(INITIALIZED, critical_pub_fail)   = FAILED
  δ(REGISTERED,  optional_checked)    = READY
  δ(READY,       enabled)             = ACTIVE
  δ(READY,       disabled_by_default) = DISABLED
  δ(ACTIVE,      disable_request)     = DISABLED
  δ(DISABLED,    enable_request)      = ACTIVE
  δ(ACTIVE,      shutdown)            = STOPPED
  δ(STOPPED,     hot_remove)          = UNLOADED    # v1.1+
  δ(UNLOADED,    hot_install)         = DISCOVERED  # v1.1+

Invalid transitions (throw InvalidPluginStateTransitionError):
  Any transition not listed in δ above.
```

---

## 33. ADRs

### ADR-P01: Data-Driven Plugins — No Base Class, No Decorator

**Status:** ACCEPTED  
**Context:** Should plugins be implemented as TypeScript classes extending a `BasePlugin`, decorated with `@Plugin()`, or as pure data manifests?  
**Decision:** Pure data manifests. A plugin is a `PluginManifest` constant. The only imperative escape hatch is the optional `initFn` function.  
**Consequences:**
- Plugins are serializable — manifests can be stored in the backend, transmitted over the network, and reconstructed from JSON
- No inheritance hierarchy to maintain
- No decorator magic that complicates tree-shaking
- Platform retains full control of the lifecycle — no plugin can override lifecycle methods
- Tradeoff: less familiar to developers coming from NgModule-based architectures. Documentation and examples must compensate.

---

### ADR-P02: PLUGIN_MANIFEST_TOKEN as Multi-Provider InjectionToken

**Status:** ACCEPTED  
**Context:** How should plugins register themselves with the platform? Options: (a) `providePlugin()` pushing to a multi-provider token, (b) a `PluginRegistry` service that plugins call imperatively, (c) a JSON config file.  
**Decision:** Multi-provider `InjectionToken<PluginManifest>`. Each `providePlugin(manifest)` call pushes one manifest into the token array. Angular DI collects all values.  
**Consequences:**
- Registration is compile-time — Angular tree-shakes unused providers
- Registration order follows provider array order in `app.config.ts`
- No imperative calls needed — all configuration is declarative in `app.config.ts`
- Tradeoff: runtime plugin installation (v1.1+) cannot use this mechanism — requires a separate runtime registration API on PluginHost

---

### ADR-P03: initFn is Optional and Isolated

**Status:** ACCEPTED  
**Context:** Should every plugin implement a mandatory lifecycle interface (`initialize()`, `register()`, `activate()`, `dispose()`)?  
**Decision:** Only `initFn` is supported, and it is optional. Plugins that only contribute metadata (EntityDefs, FormSchemas, etc.) need no code at all.  
**Consequences:**
- 80% of plugins will have no `initFn` — they are pure metadata
- The 20% that need custom field types, validators, or event subscriptions use `initFn`
- Platform retains exclusive control of `register()`, `activate()`, and `dispose()` — these are not plugin-facing methods
- Tradeoff: plugins cannot intercept their own registration or activation, which is intentional (the platform is authoritative)

---

### ADR-P04: Plugin Failure is Non-Fatal to the Platform

**Status:** ACCEPTED  
**Context:** Should a plugin registration failure abort the entire boot sequence?  
**Decision:** No. Plugin failures cause the platform to enter `degraded` state. The boot sequence continues loading all remaining plugins. The kernel reaches `READY` (or `DEGRADED`) regardless of individual plugin failures.  
**Consequences:**
- Operators can deploy a broken plugin without bringing down the entire ERP system
- Other tenants (in a multi-tenant deployment) are unaffected
- A syntax error in `initFn` does not cause a blank screen
- Tradeoff: partial platform states are possible — some modules work, others don't. Diagnostics must clearly communicate what failed and why.

---

### ADR-P05: PluginContext is the Only Service Injection Point in initFn

**Status:** ACCEPTED  
**Context:** Should `initFn` receive the Angular `Injector` (full access) or a curated `PluginContext`?  
**Decision:** `PluginContext` — a curated, explicitly-typed API surface. The Angular `Injector` is never passed to plugins.  
**Consequences:**
- Plugins cannot access Angular internals, other plugins' private services, or platform internals
- Adding a new service to `PluginContext` is a deliberate, versioned decision
- `PluginContext` can be mocked in plugin unit tests without instantiating the full Angular DI tree
- Tradeoff: plugins cannot use arbitrary Angular services in their `initFn`. Intentional — if a plugin needs an Angular service, it should declare it as a metadata handler (e.g., ActionDef.handler uses inject()) rather than an init-time dependency.

---

### ADR-P06: Sequential Load Order Within a Dependency Tier

**Status:** ACCEPTED for v1.0  
**Context:** Plugins at the same dependency tier (no mutual deps) can theoretically load in parallel. Should we use `Promise.all()` within a tier?  
**Decision:** Sequential in v1.0. Parallel within tiers in v1.1.  
**Consequences:**
- v1.0 is simpler to debug and reason about (one plugin loading at a time)
- Parallel loading in v1.1 will require `initFn` to be truly free of shared mutable state (enforced by PluginContext design — each plugin gets its own context)
- Tradeoff: v1.0 boot is slightly slower than optimal. Acceptable for initial delivery; the architecture is parallelization-ready.

---

### ADR-P07: Dependency Cascades Fail Silently from User Perspective

**Status:** ACCEPTED  
**Context:** If Plugin A fails and Plugin B depends on A, should B's failure show a separate error or trace back to A?  
**Decision:** Both failures are recorded in diagnostics. The user-facing message for B says "requires HR module (HR failed: missing CURRENCY dependency)". The root cause is always traceable.  
**Consequences:**
- Diagnostics report includes `cascadedFrom` field on each cascade failure
- Support teams can identify root cause immediately
- The UI admin panel shows the full dependency tree so the cascade is visible
- Tradeoff: cascade failures can look alarming (many modules failing) when the root cause is a single missing dependency. Documentation must explain this clearly.

---

### ADR-P08: Capabilities Are Strings, Not TypeScript Types

**Status:** ACCEPTED  
**Context:** Should capabilities be TypeScript union types (compile-time safe) or strings (runtime checked)?  
**Decision:** Strings with documented conventions (`'{domain}:{name}'`). A `PluginCapabilities` constants object is provided for type-safe access.  
**Consequences:**
- Capabilities work across plugin boundaries without TypeScript imports between plugins
- New capabilities can be added by any plugin without modifying platform types
- A `PLUGIN_CAPABILITIES` constants object in `@idoo/platform` documents well-known capabilities
- Tradeoff: typos in capability strings are runtime warnings, not compile-time errors. ESLint rules + the constants object mitigate this.

---

### ADR-P09: Override Priority is Manifest-Level, Not Entry-Level

**Status:** ACCEPTED  
**Context:** Should override priority be declared per-entry (on each EntityDef, FormSchema, etc.) or once on the PluginManifest?  
**Decision:** Once on the PluginManifest (`overridePriority: number`). All entries from the same plugin have the same priority.  
**Consequences:**
- Simpler manifest authoring — one number, not a priority on every override entry
- Consistent priority within a plugin (a tenant config plugin is always high-priority for all its overrides)
- Tradeoff: cannot have per-entry priority variation within a single plugin. If this is needed in the future, `OverrideDeclaration` can be extended with an optional `priority` field.

---

### ADR-P10: No NgModule, No Lazy NgModule Loading

**Status:** ACCEPTED  
**Context:** The platform is Angular 22+ standalone-only. Should plugins use NgModule for lazy loading boundaries?  
**Decision:** No NgModule anywhere. Custom plugin components (widgets, fields) use standalone components loaded via `() => import(...).then(m => m.Component)`. The router lazy-loads via `loadComponent`.  
**Consequences:**
- Bundle splitting still works — each custom plugin component is its own lazy chunk
- No NgModule overhead or bootstrap complexity
- Plugin metadata (EntityDef, FormSchema, etc.) is always eagerly loaded (small, pure data)
- Custom components are lazily loaded on first use
- Tradeoff: tree-shaking of custom components depends on whether the engine ever requests them. If a widget is never placed on a dashboard, its component chunk is never downloaded.

---

## 34. Self-Review

Each question must be answered YES before the specification is approved.

---

**Q1: Can any ERP module (HR, Fleet, CRM, GL, Inventory, POS, Payroll, Assets, HelpDesk, Manufacturing) be implemented as a plugin without any platform code changes?**

YES. Each module provides a `PluginManifest` with `entities`, `routes`, `menus`, `workflows`, `permissions`, and optionally `widgets`, `reports`, and `lookups`. The manifest is registered via `providePlugin()` in `app.config.ts`. No platform source modification is required. The Platform Engines (FormEngine, TableEngine, ActionEngine, etc.) read the metadata and render the UI. If a module requires a custom field type or validator, `initFn` handles the registration.

---

**Q2: Is a plugin failure truly isolated — can it never crash the platform shell or another plugin?**

YES. Four isolation boundaries are defined (Section 22.2): initFn try/catch, registry registration validation (per-entry, not platform-aborting), ActionDef.handler try/catch in ActionEngine, and Angular ErrorBoundary for custom component renders. The cascade model ensures that failing plugins propagate to their dependents (correct — a dependent without its dependency is non-functional) but not to unrelated plugins. The Platform Core (Ring 1) never fails due to plugin errors.

---

**Q3: Is the `PluginManifest` complete enough to describe any ERP module for at least 10 years?**

YES with designed extensibility. The manifest covers: all 16 registry types, dependency management (required/optional/peer), capabilities, feature flags, override system, licensing (future-ready), marketplace (future-ready), and runtime plugin support hooks. The `metadata: Record<string, unknown>` field on `RegistryEntry` provides a forward-compatible escape hatch for future manifest fields. Adding new fields to `PluginManifest` is additive and backwards-compatible.

---

**Q4: Can the system scale to hundreds of plugins without performance degradation?**

YES. The boot pipeline has an explicit performance budget: < 1000ms total for 50 plugins, scaling linearly (< 4000ms for 200 plugins). The Registry Manager (which receives all plugin metadata) has O(1) query performance regardless of entry count. The dependency resolver (Kahn's algorithm) runs in O(V + E) where V = plugins and E = dependency edges — efficient even at 500 plugins. Parallel loading within dependency tiers (v1.1) will further reduce boot time.

---

**Q5: Can tenants enable/disable individual ERP modules without redeployment?**

YES. The ACTIVE/DISABLED lifecycle states (Section 15, 16) allow per-tenant activation control without registry modifications. `PlatformContext.activeModules` is updated reactively, and the MenuEngine, permissionGuard, and RouteRegistry all read from signals — UI updates instantly when a module is disabled. Backend persistence of tenant plugin preferences uses `/v1/platform/plugins/{id}/status` (v1.1+).

---

**Q6: Does the Plugin System support third-party and marketplace plugins in the architecture?**

YES, architected in Section 30. The `PluginManifest.installSource` field, the `MarketplaceService`, the `RemotePluginLoader`, and the `LicenseService` are all designed and documented. The `PluginManifest.license` field is already in the schema in v1.0 so manifests written today are marketplace-ready in v2.0. The `CompatibilityChecker` is designed to run license validation as a check.

---

**Q7: Is there a complete audit trail for every plugin lifecycle event?**

YES. The Plugin Events system (Section 24) defines 25+ typed events covering every state transition. Every event includes `pluginId`, `timestamp`, and state-specific metadata. `PluginDiagnosticsReport` (Section 25) provides a complete snapshot of all plugins, their states, error codes, metrics, dependency resolution results, and health status. `window.__idoo.plugins()` provides on-demand access in development.

---

**Q8: Is the Plugin System compatible with Angular's standalone component model and `inject()` function?**

YES. The Plugin System does not use NgModule, does not inject through component constructors, and does not use module-scoped providers. All plugin metadata handlers (ActionDef.handler, FieldComponent field components) use `inject()` at call time, which is valid in the Angular standalone + signals model. `PluginContext` does not expose the Angular `Injector` — controlled access prevents misuse.

---

**Q9: Is circular dependency detection complete and does it handle both direct and indirect cycles?**

YES. The `DependencyResolver` uses DFS with WHITE/GRAY/BLACK node colouring — the standard algorithm for detecting all cycles in a directed graph, including indirect cycles (A→B→C→A). All participants in a detected cycle are marked FAILED. The cascade algorithm then FAILS all dependents of cycle participants. The diagnostics report includes the exact cycle path and all impacted plugins.

---

**Q10: Is the architecture documented well enough that a new developer can build a new ERP module plugin in under one working day?**

YES. The specification defines: the exact file structure (Section 2.2), the complete `PluginManifest` model with all fields documented (Section 4), the minimal valid manifest example (Section 4.2), the `PluginInitFn` contract (Section 6.1), what `PluginContext` provides (Section 18.2), and what is explicitly forbidden (Sections 1.3, 6.1, 18.3). Combined with the Development Guide (`docs/framework/23-development-guide.md`), a developer has a complete recipe. The platform's data-driven design means 80% of a new ERP module is pure TypeScript data objects with no Angular knowledge required.

---

*End of Plugin System Architecture Specification v1.0.0*

*Next Phase: 2.5 — Event Bus Implementation Specification*
