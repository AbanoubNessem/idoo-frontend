# Platform Kernel — Implementation Specification

**Version:** 1.0.0  
**Status:** IMPLEMENTATION GUIDE  
**Depends on:** `IDOO_PLATFORM_ARCHITECTURE_SPECIFICATION.md`  
**Date:** 2026-06-28

---

> This document is the complete implementation guide for the Platform Kernel.  
> The Kernel is Ring 1. Nothing in Ring 2 or Ring 3 exists before the Kernel is READY.

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [Class Diagram](#2-class-diagram)
3. [Boot State Machine](#3-boot-state-machine)
4. [Boot Sequence Diagram](#4-boot-sequence-diagram)
5. [Injection Tokens](#5-injection-tokens)
6. [Kernel Interfaces (Stubs)](#6-kernel-interfaces-stubs)
7. [Kernel Events](#7-kernel-events)
8. [Boot Step Interface](#8-boot-step-interface)
9. [Boot Steps — Concrete Implementations](#9-boot-steps--concrete-implementations)
10. [BootStateMachine](#10-bootstatemachine)
11. [BootLogger](#11-bootlogger)
12. [BootMetrics](#12-bootmetrics)
13. [BootPipeline](#13-bootpipeline)
14. [BootManager](#14-bootmanager)
15. [LifecycleHooksService](#15-lifecyclehooksservice)
16. [VersionService](#16-versionservice)
17. [HealthService](#17-healthservice)
18. [DiagnosticsService](#18-diagnosticsservice)
19. [PlatformContext](#19-platformcontext)
20. [PlatformKernel](#20-platformkernel)
21. [Kernel Provider](#21-kernel-provider)
22. [APP_INITIALIZER Wiring](#22-app_initializer-wiring)
23. [Error Recovery Model](#23-error-recovery-model)

---

## 1. Folder Structure

```
src/app/core/kernel/
│
├── platform-kernel.service.ts          # PlatformKernel — the top-level orchestrator
│
├── tokens/
│   └── kernel.tokens.ts                # All InjectionTokens for the kernel
│
├── interfaces/
│   ├── kernel-api.interface.ts         # Public KernelAPI surface
│   ├── registry-api.interface.ts       # RegistryAPI stub (implemented later)
│   ├── plugin-host-api.interface.ts    # PluginHostAPI stub
│   ├── event-bus-api.interface.ts      # EventBusAPI stub
│   └── command-bus-api.interface.ts    # CommandBusAPI stub
│
├── events/
│   └── kernel-events.ts                # KernelEvent union type + all event interfaces
│
├── boot/
│   ├── boot-manager.service.ts         # BootManager — owns the pipeline execution
│   ├── boot-pipeline.ts                # BootPipeline — ordered step registry
│   ├── boot-state-machine.ts           # BootStateMachine — explicit state transitions
│   ├── boot-logger.ts                  # BootLogger — structured boot logging
│   ├── boot-metrics.ts                 # BootMetrics — per-step timing collection
│   │
│   └── steps/
│       ├── boot-step.interface.ts      # IBootStep contract
│       ├── 01-configuration.step.ts    # Load + validate platform config
│       ├── 02-startup-validation.step.ts  # Validate environment, tokens, config
│       ├── 03-registry-init.step.ts    # Initialize all 15 registries
│       ├── 04-plugin-discovery.step.ts # Read PLUGIN_MANIFEST_TOKEN multi-providers
│       ├── 05-dependency-graph.step.ts # Build + validate plugin dependency graph
│       ├── 06-plugin-registration.step.ts # Register all plugin metadata
│       ├── 07-security-init.step.ts    # Restore session, load permissions
│       ├── 08-route-build.step.ts      # Build Angular routes from RouteRegistry
│       └── 09-ready.step.ts            # Emit kernel:ready, mark status
│
├── lifecycle/
│   └── lifecycle-hooks.service.ts      # LifecycleHooksService
│
├── health/
│   ├── health.service.ts               # HealthService
│   └── health-check.interface.ts       # IHealthCheck contract
│
├── diagnostics/
│   └── diagnostics.service.ts          # DiagnosticsService
│
├── version/
│   └── version.service.ts              # VersionService
│
├── context/
│   └── platform-context.service.ts     # PlatformContext (RuntimeContext impl)
│
└── providers/
    └── kernel.provider.ts              # providePlatformKernel() factory
```

---

## 2. Class Diagram

```
                        ┌──────────────────────────────────┐
                        │         PlatformKernel            │
                        │  - status: Signal<KernelStatus>  │
                        │  - boot(): Promise<void>          │
                        │  - shutdown(): Promise<void>      │
                        │  - getHealthReport()              │
                        └──────────────┬───────────────────┘
                                       │ owns
              ┌────────────────────────┼──────────────────────┐
              │                        │                       │
    ┌─────────▼──────────┐  ┌──────────▼─────────┐  ┌────────▼────────┐
    │    BootManager      │  │   HealthService     │  │ DiagnosticsService│
    │  - run(): Promise   │  │  - check()          │  │ - getReport()   │
    │  - abort()          │  │  - getReport()      │  │ - getMetrics()  │
    └─────────┬──────────┘  └────────────────────-┘  └─────────────────┘
              │ owns
    ┌─────────▼──────────────────────────────────────┐
    │                  BootPipeline                    │
    │  steps: IBootStep[]  (ordered 01–09)            │
    └─────────┬──────────────────────────────────────-┘
              │ executes
    ┌─────────▼──────────┐    ┌──────────────────────┐
    │   BootStateMachine  │    │      BootLogger       │
    │  transition(event)  │    │  log(level, message)  │
    │  state: Signal<S>   │    │  getEntries()         │
    └─────────────────────┘    └──────────────────────┘

    ┌─────────────────────┐    ┌──────────────────────┐
    │     BootMetrics      │    │  LifecycleHooksService│
    │  startStep(name)     │    │  register(hook, fn)  │
    │  endStep(name)       │    │  run(hook): Promise  │
    │  getSummary()        │    └──────────────────────┘
    └─────────────────────┘

    ┌─────────────────────┐    ┌──────────────────────┐
    │    VersionService    │    │    PlatformContext    │
    │  getPlatformVersion()│    │  (RuntimeContext)    │
    │  isCompatible(range) │    │  signals: user/tenant│
    └─────────────────────┘    └──────────────────────┘

    IBootStep (interface — implemented by each boot step)
    ┌─────────────────────────────────────────────────┐
    │  readonly stepId: string                        │
    │  readonly stepName: string                      │
    │  readonly order: number                         │
    │  readonly critical: boolean                     │
    │  execute(ctx: BootContext): Promise<StepResult> │
    │  canSkip(ctx: BootContext): boolean             │
    │  onError(err: unknown, ctx: BootContext): void  │
    └─────────────────────────────────────────────────┘
```

---

## 3. Boot State Machine

```
                     boot() called
                         │
                    ┌────▼─────┐
          ┌─────────┤   IDLE   │
          │         └────┬─────┘
          │              │ BOOT_STARTED
          │         ┌────▼─────┐
          │         │ BOOTING  │◄──────────────────────┐
          │         └────┬─────┘                       │
          │              │                             │
          │    ┌─────────┴──────────┐                  │
          │    │ step result        │                  │
          │    ▼                    ▼                  │
          │  STEP_OK           STEP_FAILED             │
          │    │              (critical?)              │
          │    │              /         \              │
          │    │         YES /           \ NO          │
          │    │            ▼             ▼            │
          │    │       ┌────────┐    CONTINUE ─────────┘
          │    │       │ ERROR  │    (degraded mode)
          │    │       └────────┘
          │    │
          │    │ all steps done
          │    ▼
          │  ┌────────────┐
          │  │   READY    │   (healthy or degraded)
          │  └────────────┘
          │
          │ shutdown() called
          │  ┌──────────────────┐
          └─►│  SHUTTING_DOWN   │
             └────────┬─────────┘
                      │ complete
                  ┌───▼───────┐
                  │  OFFLINE  │
                  └───────────┘
```

**State definitions:**

```typescript
type KernelStatus =
  | 'idle'           // before boot() is called
  | 'booting'        // boot pipeline executing
  | 'ready'          // all critical steps passed
  | 'degraded'       // some non-critical steps failed; platform functional
  | 'error'          // a critical step failed; platform non-functional
  | 'shutting-down'  // shutdown() called, cleanup in progress
  | 'offline';       // shutdown complete
```

**Valid transitions:**

| From | To | Trigger |
|---|---|---|
| `idle` | `booting` | `boot()` called |
| `booting` | `ready` | all steps complete, 0 critical failures |
| `booting` | `degraded` | all steps complete, 1+ non-critical failures |
| `booting` | `error` | 1+ critical step failure |
| `ready` | `shutting-down` | `shutdown()` called |
| `degraded` | `shutting-down` | `shutdown()` called |
| `error` | `shutting-down` | `shutdown()` called |
| `shutting-down` | `offline` | shutdown complete |

Invalid transitions throw `InvalidKernelStateTransitionError`.

---

## 4. Boot Sequence Diagram

```
  app.config.ts          Angular         PlatformKernel    BootManager     IBootStep(s)
       │                    │                  │                │                │
       │ providePlatform()  │                  │                │                │
       │──────────────────►│                  │                │                │
       │                   │ APP_INITIALIZER  │                │                │
       │                   │─────────────────►│                │                │
       │                   │                  │ boot()         │                │
       │                   │                  │───────────────►│                │
       │                   │                  │                │ validateEnv()  │
       │                   │                  │                │────────────────►(01-config)
       │                   │                  │                │◄──────────────  StepResult
       │                   │                  │                │────────────────►(02-validation)
       │                   │                  │                │◄──────────────  StepResult
       │                   │                  │                │────────────────►(03-registry-init)
       │                   │                  │                │◄──────────────  StepResult
       │                   │                  │                │────────────────►(04-plugin-discovery)
       │                   │                  │                │◄──────────────  StepResult
       │                   │                  │                │────────────────►(05-dependency-graph)
       │                   │                  │                │◄──────────────  StepResult
       │                   │                  │                │────────────────►(06-plugin-registration)
       │                   │                  │                │◄──────────────  StepResult
       │                   │                  │                │────────────────►(07-security-init)
       │                   │                  │                │◄──────────────  StepResult
       │                   │                  │                │────────────────►(08-route-build)
       │                   │                  │                │◄──────────────  StepResult
       │                   │                  │                │────────────────►(09-ready)
       │                   │                  │                │◄──────────────  StepResult
       │                   │                  │◄──────────────  boot complete
       │                   │◄─────────────────│ APP_INITIALIZER resolves
       │                   │ first navigation │
       │                   │─────────────────►│
```

---

## 5. Injection Tokens

**`src/app/core/kernel/tokens/kernel.tokens.ts`**

```typescript
import { InjectionToken } from '@angular/core';
import type { KernelAPI }        from '../interfaces/kernel-api.interface';
import type { PlatformConfig }   from '../interfaces/platform-config.interface';
import type { RegistryAPI }      from '../interfaces/registry-api.interface';
import type { EventBusAPI }      from '../interfaces/event-bus-api.interface';
import type { CommandBusAPI }    from '../interfaces/command-bus-api.interface';
import type { PluginHostAPI }    from '../interfaces/plugin-host-api.interface';
import type { PluginManifest }   from '../interfaces/plugin-manifest.interface';

// ─── Kernel ──────────────────────────────────────────────────────────────────

/** The singleton PlatformKernel instance. */
export const KERNEL_TOKEN =
  new InjectionToken<KernelAPI>('PLATFORM_KERNEL');

/** Platform-wide configuration (apiUrl, production, features, etc.). */
export const PLATFORM_CONFIG_TOKEN =
  new InjectionToken<PlatformConfig>('PLATFORM_CONFIG');

// ─── Plugin Registration ─────────────────────────────────────────────────────

/**
 * Multi-provider token. Every call to providePlugin() pushes one manifest here.
 * The PluginHost reads all manifests from this token at boot Step 4.
 */
export const PLUGIN_MANIFEST_TOKEN =
  new InjectionToken<PluginManifest>('PLUGIN_MANIFEST', {
    providedIn: 'root',
    factory: () => [],
  });

// ─── Subsystem Tokens ────────────────────────────────────────────────────────

export const REGISTRY_API_TOKEN =
  new InjectionToken<RegistryAPI>('REGISTRY_API');

export const EVENT_BUS_TOKEN =
  new InjectionToken<EventBusAPI>('EVENT_BUS');

export const COMMAND_BUS_TOKEN =
  new InjectionToken<CommandBusAPI>('COMMAND_BUS');

export const PLUGIN_HOST_TOKEN =
  new InjectionToken<PluginHostAPI>('PLUGIN_HOST');

// ─── Boot ────────────────────────────────────────────────────────────────────

/**
 * Multi-provider token. Third-party boot steps can inject here to participate
 * in the boot pipeline without modifying BootPipeline.
 */
export const EXTRA_BOOT_STEP_TOKEN =
  new InjectionToken<IBootStep>('EXTRA_BOOT_STEP');
```

---

## 6. Kernel Interfaces (Stubs)

These interfaces define the contracts that Registry, Plugin System, Event Bus, and Command Bus must implement. The Kernel depends on these interfaces — not on the concrete implementations.

**`src/app/core/kernel/interfaces/platform-config.interface.ts`**

```typescript
export interface PlatformConfig {
  /** Base URL of the backend API. e.g. 'http://localhost:8080/api' */
  readonly apiUrl: string;

  /** Whether this is a production build. */
  readonly production: boolean;

  /** Platform version string. Must match PlatformVersion semver. */
  readonly platformVersion: string;

  /** Optional feature flags active for this deployment. */
  readonly featureFlags?: string[];

  /** Boot timeout in ms. Default: 30000. */
  readonly bootTimeoutMs?: number;

  /** Whether to collect boot performance metrics. Default: !production. */
  readonly collectBootMetrics?: boolean;

  /** Log level during boot. Default: 'info'. */
  readonly bootLogLevel?: 'debug' | 'info' | 'warn' | 'error';
}
```

**`src/app/core/kernel/interfaces/kernel-api.interface.ts`**

```typescript
import { Signal } from '@angular/core';
import type { KernelStatus }       from '../boot/boot-state-machine';
import type { KernelHealthReport } from '../health/health.service';
import type { DiagnosticsReport }  from '../diagnostics/diagnostics.service';
import type { PlatformVersion }    from '../version/version.service';
import type { RegistryAPI }        from './registry-api.interface';
import type { PluginHostAPI }      from './plugin-host-api.interface';

/**
 * The public surface of the Platform Kernel.
 * Consumed by engines and plugins through KERNEL_TOKEN.
 * Concrete implementation: PlatformKernel.
 */
export interface KernelAPI {
  // ─── Status ──────────────────────────────────────────────────────────────
  readonly status: Signal<KernelStatus>;
  readonly isReady: Signal<boolean>;

  // ─── Boot ────────────────────────────────────────────────────────────────
  boot(): Promise<void>;
  shutdown(): Promise<void>;

  // ─── Subsystem Access ────────────────────────────────────────────────────
  readonly registry: RegistryAPI;
  readonly plugins:  PluginHostAPI;

  // ─── Diagnostics ─────────────────────────────────────────────────────────
  getHealthReport(): KernelHealthReport;
  getDiagnosticsReport(): DiagnosticsReport;
  getVersion(): PlatformVersion;

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  onReady(handler: () => void | Promise<void>): void;
  onShutdown(handler: () => void | Promise<void>): void;
}
```

**`src/app/core/kernel/interfaces/registry-api.interface.ts`**

```typescript
/**
 * STUB — implemented in Phase 2.3 (Registry Manager).
 * The Kernel holds a reference typed to this interface.
 * At boot Step 3, RegistryInitStep injects the concrete RegistryManager
 * and assigns it here.
 */
export interface RegistryAPI {
  readonly isInitialized: boolean;

  // Typed sub-registry accessors are added in the Registry Implementation.
  // All sub-registries return `unknown` here to avoid circular imports.
  get(registryName: string): unknown;
}
```

**`src/app/core/kernel/interfaces/plugin-host-api.interface.ts`**

```typescript
/**
 * STUB — implemented in Phase 2.4 (Plugin System).
 */
export interface PluginHostAPI {
  readonly loadedPlugins: string[];
  readonly failedPlugins: string[];
  hasCapability(capabilityId: string): boolean;
  getPluginStatus(pluginId: string): PluginStatus;
}

export type PluginStatus =
  | 'discovered' | 'validated' | 'registering'
  | 'registered' | 'initializing' | 'active'
  | 'unloading' | 'unloaded' | 'failed';
```

**`src/app/core/kernel/interfaces/event-bus-api.interface.ts`**

```typescript
import { Observable } from 'rxjs';

/**
 * STUB — implemented in Phase 2.5 (Event Bus).
 * The Kernel emits KernelEvents through this interface at boot steps.
 */
export interface EventBusAPI {
  emit(event: { type: string; [key: string]: unknown }): void;
  on<T extends { type: string }>(type: string): Observable<T>;
}
```

**`src/app/core/kernel/interfaces/command-bus-api.interface.ts`**

```typescript
import { Observable } from 'rxjs';

/**
 * STUB — implemented in Phase 2.6 (Command Bus).
 */
export interface CommandBusAPI {
  dispatch<R = unknown>(command: { commandType: string; [key: string]: unknown }): Observable<R>;
}
```

**`src/app/core/kernel/interfaces/plugin-manifest.interface.ts`**

```typescript
/**
 * STUB — full definition lives in Phase 2.4 (Plugin System).
 * The Kernel's boot steps only need the minimal shape for discovery + ordering.
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  platformVersion: string;
  dependencies?: Array<{ pluginId: string; version: string }>;
  // All other fields typed as unknown here — Plugin System provides the full type.
  [key: string]: unknown;
}
```

---

## 7. Kernel Events

**`src/app/core/kernel/events/kernel-events.ts`**

```typescript
// ─── Kernel Event Union ───────────────────────────────────────────────────────

export type KernelEvent =
  | KernelBootingEvent
  | KernelReadyEvent
  | KernelDegradedEvent
  | KernelErrorEvent
  | KernelShutdownEvent
  | KernelOfflineEvent
  | KernelPluginLoadedEvent
  | KernelPluginFailedEvent
  | KernelPluginUnloadedEvent
  | KernelHealthDegradedEvent
  | KernelStepStartedEvent
  | KernelStepCompletedEvent
  | KernelStepFailedEvent
  | KernelStepSkippedEvent;

// ─── Boot Lifecycle ───────────────────────────────────────────────────────────

export interface KernelBootingEvent {
  readonly type: 'kernel:booting';
  readonly timestamp: string;
  readonly platformVersion: string;
}

export interface KernelReadyEvent {
  readonly type: 'kernel:ready';
  readonly timestamp: string;
  readonly bootDurationMs: number;
  readonly loadedPlugins: string[];
  readonly failedPlugins: string[];
}

export interface KernelDegradedEvent {
  readonly type: 'kernel:degraded';
  readonly timestamp: string;
  readonly bootDurationMs: number;
  readonly failedSteps: string[];
  readonly failedPlugins: string[];
  readonly reason: string;
}

export interface KernelErrorEvent {
  readonly type: 'kernel:error';
  readonly timestamp: string;
  readonly failedStep: string;
  readonly error: string;
}

export interface KernelShutdownEvent {
  readonly type: 'kernel:shutdown';
  readonly timestamp: string;
  readonly initiatedBy: 'user' | 'error' | 'system';
}

export interface KernelOfflineEvent {
  readonly type: 'kernel:offline';
  readonly timestamp: string;
  readonly shutdownDurationMs: number;
}

// ─── Step Events ──────────────────────────────────────────────────────────────

export interface KernelStepStartedEvent {
  readonly type: 'kernel:step:started';
  readonly stepId: string;
  readonly stepName: string;
  readonly stepOrder: number;
  readonly timestamp: string;
}

export interface KernelStepCompletedEvent {
  readonly type: 'kernel:step:completed';
  readonly stepId: string;
  readonly stepName: string;
  readonly durationMs: number;
  readonly timestamp: string;
}

export interface KernelStepFailedEvent {
  readonly type: 'kernel:step:failed';
  readonly stepId: string;
  readonly stepName: string;
  readonly critical: boolean;
  readonly error: string;
  readonly timestamp: string;
}

export interface KernelStepSkippedEvent {
  readonly type: 'kernel:step:skipped';
  readonly stepId: string;
  readonly stepName: string;
  readonly reason: string;
  readonly timestamp: string;
}

// ─── Plugin Events ────────────────────────────────────────────────────────────

export interface KernelPluginLoadedEvent {
  readonly type: 'kernel:plugin:loaded';
  readonly pluginId: string;
  readonly pluginName: string;
  readonly pluginVersion: string;
  readonly timestamp: string;
}

export interface KernelPluginFailedEvent {
  readonly type: 'kernel:plugin:failed';
  readonly pluginId: string;
  readonly error: string;
  readonly timestamp: string;
}

export interface KernelPluginUnloadedEvent {
  readonly type: 'kernel:plugin:unloaded';
  readonly pluginId: string;
  readonly timestamp: string;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface KernelHealthDegradedEvent {
  readonly type: 'kernel:health:degraded';
  readonly failedChecks: string[];
  readonly timestamp: string;
}

// ─── Type Guards ──────────────────────────────────────────────────────────────

export const KernelEventTypes = {
  BOOTING:          'kernel:booting',
  READY:            'kernel:ready',
  DEGRADED:         'kernel:degraded',
  ERROR:            'kernel:error',
  SHUTDOWN:         'kernel:shutdown',
  OFFLINE:          'kernel:offline',
  STEP_STARTED:     'kernel:step:started',
  STEP_COMPLETED:   'kernel:step:completed',
  STEP_FAILED:      'kernel:step:failed',
  STEP_SKIPPED:     'kernel:step:skipped',
  PLUGIN_LOADED:    'kernel:plugin:loaded',
  PLUGIN_FAILED:    'kernel:plugin:failed',
  PLUGIN_UNLOADED:  'kernel:plugin:unloaded',
  HEALTH_DEGRADED:  'kernel:health:degraded',
} as const;
```

---

## 8. Boot Step Interface

**`src/app/core/kernel/boot/steps/boot-step.interface.ts`**

```typescript
import { InjectionToken } from '@angular/core';

export const BOOT_STEP_TOKEN =
  new InjectionToken<IBootStep>('BOOT_STEP');

// ─── Step Result ──────────────────────────────────────────────────────────────

export type StepOutcome = 'success' | 'skipped' | 'failed';

export interface StepResult {
  readonly stepId:     string;
  readonly outcome:    StepOutcome;
  readonly durationMs: number;
  readonly message?:   string;
  readonly error?:     unknown;
  readonly metadata?:  Record<string, unknown>;
}

// ─── Boot Context ─────────────────────────────────────────────────────────────

/**
 * Shared mutable context passed through the boot pipeline.
 * Each step reads from and writes to this context.
 * Steps communicate only through BootContext — not through direct injection.
 */
export interface BootContext {
  /** Platform configuration loaded at Step 1. */
  config: PlatformConfigResolved | null;

  /** Manifests discovered at Step 4. */
  discoveredManifests: PluginManifestRaw[];

  /** Sorted manifest IDs after dependency resolution (Step 5). */
  sortedPluginIds: string[];

  /** Plugins that successfully registered (Step 6). */
  loadedPluginIds: string[];

  /** Plugins that failed to register (Step 6). */
  failedPluginIds: string[];

  /** Whether the security session was restored (Step 7). */
  sessionRestored: boolean;

  /** Results of all completed steps. */
  stepResults: StepResult[];

  /** Warnings accumulated during boot (non-fatal). */
  warnings: string[];

  /** Whether at least one non-critical step has failed. */
  isDegraded: boolean;
}

export interface PlatformConfigResolved {
  apiUrl: string;
  production: boolean;
  platformVersion: string;
  featureFlags: string[];
  bootTimeoutMs: number;
  collectBootMetrics: boolean;
  bootLogLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface PluginManifestRaw {
  id: string;
  name: string;
  version: string;
  platformVersion: string;
  dependencies?: Array<{ pluginId: string; version: string }>;
  [key: string]: unknown;
}

// ─── IBootStep ───────────────────────────────────────────────────────────────

/**
 * Contract every boot step must implement.
 *
 * Steps are stateless — they receive all context through BootContext.
 * Steps are async — they return a Promise<StepResult>.
 * Steps declare whether they are critical — a critical step failure aborts boot.
 */
export interface IBootStep {
  /** Unique identifier. Convention: '{order:02d}-{kebab-name}'. e.g. '01-configuration' */
  readonly stepId:   string;

  /** Human-readable name for logging. */
  readonly stepName: string;

  /** Execution order. Lower numbers run first. Range: 1–99. */
  readonly order: number;

  /**
   * Whether this step is required for the platform to function.
   * A critical step failure transitions the kernel to 'error' and aborts.
   * A non-critical step failure transitions to 'degraded' and continues.
   */
  readonly critical: boolean;

  /**
   * Main execution method.
   * The step reads from ctx, performs its work, writes results back to ctx,
   * and returns a StepResult describing the outcome.
   */
  execute(ctx: BootContext): Promise<StepResult>;

  /**
   * Whether this step can be safely skipped given the current context.
   * Called before execute(). If true, the step is skipped with a SKIPPED result.
   */
  canSkip(ctx: BootContext): boolean;

  /**
   * Called when execute() throws or rejects.
   * The step can attempt cleanup here.
   * The BootManager uses the step's `critical` flag to decide what to do next.
   */
  onError?(error: unknown, ctx: BootContext): void;
}
```

---

## 9. Boot Steps — Concrete Implementations

### Step 01 — ConfigurationStep

**`src/app/core/kernel/boot/steps/01-configuration.step.ts`**

**Purpose:** Load and normalize the platform configuration from `PLATFORM_CONFIG_TOKEN`. Resolve defaults for optional fields.

**Responsibilities:**
- Read `PLATFORM_CONFIG_TOKEN` from the injector
- Apply default values for missing optional fields
- Write resolved config to `BootContext.config`

**Critical:** YES — platform cannot boot without config.

```typescript
import { inject, Injectable } from '@angular/core';
import { IBootStep, BootContext, StepResult } from './boot-step.interface';
import { PLATFORM_CONFIG_TOKEN } from '../../tokens/kernel.tokens';
import type { PlatformConfig } from '../../interfaces/platform-config.interface';

@Injectable()
export class ConfigurationStep implements IBootStep {
  readonly stepId   = '01-configuration';
  readonly stepName = 'Platform Configuration';
  readonly order    = 1;
  readonly critical = true;

  private readonly rawConfig = inject(PLATFORM_CONFIG_TOKEN, { optional: true });

  canSkip(_ctx: BootContext): boolean {
    return false; // always run
  }

  async execute(ctx: BootContext): Promise<StepResult> {
    const start = performance.now();

    if (!this.rawConfig) {
      return this.fail(start, ctx, 'PLATFORM_CONFIG_TOKEN is not provided. Call providePlatform() in app.config.ts.');
    }

    if (!this.rawConfig.apiUrl) {
      return this.fail(start, ctx, 'PlatformConfig.apiUrl is required.');
    }

    if (!this.rawConfig.platformVersion) {
      return this.fail(start, ctx, 'PlatformConfig.platformVersion is required.');
    }

    ctx.config = {
      apiUrl:              this.rawConfig.apiUrl.replace(/\/$/, ''), // strip trailing slash
      production:          this.rawConfig.production ?? false,
      platformVersion:     this.rawConfig.platformVersion,
      featureFlags:        this.rawConfig.featureFlags ?? [],
      bootTimeoutMs:       this.rawConfig.bootTimeoutMs ?? 30_000,
      collectBootMetrics:  this.rawConfig.collectBootMetrics ?? !this.rawConfig.production,
      bootLogLevel:        this.rawConfig.bootLogLevel ?? 'info',
    };

    return {
      stepId:     this.stepId,
      outcome:    'success',
      durationMs: performance.now() - start,
      message:    `Config loaded. API: ${ctx.config.apiUrl}`,
      metadata:   { apiUrl: ctx.config.apiUrl, production: ctx.config.production },
    };
  }

  onError(error: unknown, _ctx: BootContext): void {
    console.error('[Kernel] ConfigurationStep failed:', error);
  }

  private fail(start: number, ctx: BootContext, message: string): StepResult {
    ctx.warnings.push(message);
    return { stepId: this.stepId, outcome: 'failed', durationMs: performance.now() - start, error: message };
  }
}
```

---

### Step 02 — StartupValidationStep

**`src/app/core/kernel/boot/steps/02-startup-validation.step.ts`**

**Purpose:** Validate the runtime environment before any platform subsystem is initialized.

**Responsibilities:**
- Check required browser APIs are available (localStorage, sessionStorage, fetch)
- Validate platform version format
- Check for duplicate plugin IDs pre-discovery (if available)
- Emit warnings for deprecated config keys

**Critical:** YES.

```typescript
import { Injectable } from '@angular/core';
import { IBootStep, BootContext, StepResult } from './boot-step.interface';
import { VersionService } from '../../version/version.service';
import { inject } from '@angular/core';

@Injectable()
export class StartupValidationStep implements IBootStep {
  readonly stepId   = '02-startup-validation';
  readonly stepName = 'Startup Validation';
  readonly order    = 2;
  readonly critical = true;

  private readonly versionService = inject(VersionService);

  canSkip(_ctx: BootContext): boolean {
    return false;
  }

  async execute(ctx: BootContext): Promise<StepResult> {
    const start  = performance.now();
    const errors: string[] = [];

    // Browser API checks
    if (typeof localStorage === 'undefined') {
      errors.push('localStorage is not available. Platform requires localStorage.');
    }
    if (typeof sessionStorage === 'undefined') {
      errors.push('sessionStorage is not available.');
    }
    if (typeof fetch === 'undefined') {
      errors.push('fetch API is not available. A polyfill is required.');
    }

    // Platform version format
    const versionValid = this.versionService.isValidSemver(ctx.config!.platformVersion);
    if (!versionValid) {
      errors.push(`PlatformConfig.platformVersion '${ctx.config!.platformVersion}' is not valid SemVer.`);
    }

    if (errors.length > 0) {
      errors.forEach(e => ctx.warnings.push(e));
      return {
        stepId:     this.stepId,
        outcome:    'failed',
        durationMs: performance.now() - start,
        error:      errors.join(' | '),
      };
    }

    return {
      stepId:     this.stepId,
      outcome:    'success',
      durationMs: performance.now() - start,
      message:    'Environment validated.',
    };
  }
}
```

---

### Step 03 — RegistryInitStep

**`src/app/core/kernel/boot/steps/03-registry-init.step.ts`**

**Purpose:** Initialize all 15 platform registries. The concrete RegistryManager is injected here — this is the only step that knows about the Registry implementation.

**Critical:** YES — no registrations possible without registries.

```typescript
import { inject, Injectable } from '@angular/core';
import { IBootStep, BootContext, StepResult } from './boot-step.interface';
import { REGISTRY_API_TOKEN } from '../../tokens/kernel.tokens';

@Injectable()
export class RegistryInitStep implements IBootStep {
  readonly stepId   = '03-registry-init';
  readonly stepName = 'Registry Initialization';
  readonly order    = 3;
  readonly critical = true;

  // The RegistryAPI stub is sufficient here.
  // The concrete RegistryManager is injected through this token.
  private readonly registry = inject(REGISTRY_API_TOKEN, { optional: true });

  canSkip(_ctx: BootContext): boolean {
    return false;
  }

  async execute(ctx: BootContext): Promise<StepResult> {
    const start = performance.now();

    if (!this.registry) {
      return {
        stepId:     this.stepId,
        outcome:    'failed',
        durationMs: performance.now() - start,
        error:      'REGISTRY_API_TOKEN not provided. Call provideRegistry() alongside providePlatform().',
      };
    }

    // Registry initialization is handled internally by the RegistryManager
    // on first injection (via Angular DI constructor). This step validates
    // that it happened correctly.
    if (!this.registry.isInitialized) {
      return {
        stepId:     this.stepId,
        outcome:    'failed',
        durationMs: performance.now() - start,
        error:      'RegistryManager failed to initialize.',
      };
    }

    return {
      stepId:     this.stepId,
      outcome:    'success',
      durationMs: performance.now() - start,
      message:    'All 15 registries initialized.',
    };
  }
}
```

---

### Step 04 — PluginDiscoveryStep

**`src/app/core/kernel/boot/steps/04-plugin-discovery.step.ts`**

**Purpose:** Read all plugin manifests from `PLUGIN_MANIFEST_TOKEN` multi-provider. Perform lightweight schema validation on each manifest.

**Critical:** NO — a platform with zero plugins is functional (though not useful).

```typescript
import { inject, Injectable } from '@angular/core';
import { IBootStep, BootContext, StepResult, PluginManifestRaw } from './boot-step.interface';
import { PLUGIN_MANIFEST_TOKEN } from '../../tokens/kernel.tokens';
import { BootLogger } from '../boot-logger';

@Injectable()
export class PluginDiscoveryStep implements IBootStep {
  readonly stepId   = '04-plugin-discovery';
  readonly stepName = 'Plugin Discovery';
  readonly order    = 4;
  readonly critical = false;

  private readonly manifests = inject(PLUGIN_MANIFEST_TOKEN, { optional: true }) ?? [];
  private readonly logger    = inject(BootLogger);

  canSkip(_ctx: BootContext): boolean {
    return false;
  }

  async execute(ctx: BootContext): Promise<StepResult> {
    const start    = performance.now();
    const valid:   PluginManifestRaw[] = [];
    const invalid: string[]             = [];

    for (const manifest of this.manifests) {
      const err = this.validate(manifest);
      if (err) {
        invalid.push(`${manifest.id ?? 'unknown'}: ${err}`);
        this.logger.warn(`[PluginDiscovery] Rejected manifest: ${err}`);
        ctx.isDegraded = true;
      } else {
        valid.push(manifest as PluginManifestRaw);
        this.logger.debug(`[PluginDiscovery] Found plugin: ${manifest.id}@${manifest.version}`);
      }
    }

    ctx.discoveredManifests = valid;
    invalid.forEach(e => ctx.warnings.push(e));

    return {
      stepId:     this.stepId,
      outcome:    'success',
      durationMs: performance.now() - start,
      message:    `Discovered ${valid.length} valid plugin(s). ${invalid.length} rejected.`,
      metadata:   {
        discovered: valid.map(m => `${m.id}@${m.version}`),
        rejected:   invalid,
      },
    };
  }

  private validate(m: unknown): string | null {
    if (!m || typeof m !== 'object') return 'Manifest is not an object.';
    const manifest = m as Record<string, unknown>;
    if (!manifest['id'] || typeof manifest['id'] !== 'string')      return 'Missing required field: id';
    if (!manifest['name'] || typeof manifest['name'] !== 'string')  return 'Missing required field: name';
    if (!manifest['version'])                                         return 'Missing required field: version';
    if (!manifest['platformVersion'])                                 return 'Missing required field: platformVersion';
    return null;
  }
}
```

---

### Step 05 — DependencyGraphStep

**`src/app/core/kernel/boot/steps/05-dependency-graph.step.ts`**

**Purpose:** Build the plugin dependency graph and produce a topologically sorted initialization order. Detect cycles and missing dependencies.

**Critical:** YES — incorrect initialization order causes undefined behaviour.

```typescript
import { inject, Injectable } from '@angular/core';
import { IBootStep, BootContext, StepResult } from './boot-step.interface';
import { BootLogger } from '../boot-logger';

@Injectable()
export class DependencyGraphStep implements IBootStep {
  readonly stepId   = '05-dependency-graph';
  readonly stepName = 'Dependency Graph Validation';
  readonly order    = 5;
  readonly critical = true;

  private readonly logger = inject(BootLogger);

  canSkip(ctx: BootContext): boolean {
    return ctx.discoveredManifests.length === 0;
  }

  async execute(ctx: BootContext): Promise<StepResult> {
    const start     = performance.now();
    const manifests = ctx.discoveredManifests;

    const idSet = new Set(manifests.map(m => m.id));

    // Validate all declared dependencies exist
    const missingDeps: string[] = [];
    for (const m of manifests) {
      for (const dep of m.dependencies ?? []) {
        if (!idSet.has(dep.pluginId)) {
          missingDeps.push(`${m.id} requires ${dep.pluginId}@${dep.version} (not found)`);
        }
      }
    }

    if (missingDeps.length > 0) {
      missingDeps.forEach(d => ctx.warnings.push(d));
      return {
        stepId:     this.stepId,
        outcome:    'failed',
        durationMs: performance.now() - start,
        error:      `Unresolved plugin dependencies: ${missingDeps.join('; ')}`,
      };
    }

    // Kahn's Algorithm — topological sort
    const sorted = this.topologicalSort(manifests);
    if (sorted === null) {
      return {
        stepId:     this.stepId,
        outcome:    'failed',
        durationMs: performance.now() - start,
        error:      'Circular dependency detected in plugin graph.',
      };
    }

    ctx.sortedPluginIds = sorted;
    this.logger.info(`[DependencyGraph] Init order: ${sorted.join(' → ')}`);

    return {
      stepId:     this.stepId,
      outcome:    'success',
      durationMs: performance.now() - start,
      message:    `Dependency graph valid. ${sorted.length} plugin(s) ordered.`,
      metadata:   { order: sorted },
    };
  }

  /**
   * Kahn's Algorithm for topological sort.
   * Returns null if a cycle is detected.
   */
  private topologicalSort(manifests: BootContext['discoveredManifests']): string[] | null {
    const inDegree = new Map<string, number>();
    const adj      = new Map<string, string[]>(); // id → ids that depend on it

    for (const m of manifests) {
      if (!inDegree.has(m.id)) inDegree.set(m.id, 0);
      if (!adj.has(m.id))      adj.set(m.id, []);
    }

    for (const m of manifests) {
      for (const dep of m.dependencies ?? []) {
        adj.get(dep.pluginId)!.push(m.id);
        inDegree.set(m.id, (inDegree.get(m.id) ?? 0) + 1);
      }
    }

    const queue:  string[] = [];
    const result: string[] = [];

    inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });

    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);
      for (const neighbor of adj.get(node) ?? []) {
        const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    return result.length === manifests.length ? result : null; // null = cycle
  }
}
```

---

### Step 06 — PluginRegistrationStep

**`src/app/core/kernel/boot/steps/06-plugin-registration.step.ts`**

**Purpose:** Iterate plugins in sorted order and register their metadata into all applicable registries. Plugins that fail registration are skipped (non-critical failure per plugin).

**Critical:** NO — individual plugin failures degrade rather than abort.

```typescript
import { inject, Injectable } from '@angular/core';
import { IBootStep, BootContext, StepResult } from './boot-step.interface';
import { PLUGIN_HOST_TOKEN, REGISTRY_API_TOKEN } from '../../tokens/kernel.tokens';
import { BootLogger } from '../boot-logger';

@Injectable()
export class PluginRegistrationStep implements IBootStep {
  readonly stepId   = '06-plugin-registration';
  readonly stepName = 'Plugin Registration';
  readonly order    = 6;
  readonly critical = false;

  private readonly registry   = inject(REGISTRY_API_TOKEN,  { optional: true });
  private readonly pluginHost = inject(PLUGIN_HOST_TOKEN,   { optional: true });
  private readonly logger     = inject(BootLogger);

  canSkip(ctx: BootContext): boolean {
    return ctx.sortedPluginIds.length === 0;
  }

  async execute(ctx: BootContext): Promise<StepResult> {
    const start = performance.now();

    if (!this.pluginHost) {
      ctx.warnings.push('PLUGIN_HOST_TOKEN not provided — plugins will not be registered.');
      ctx.isDegraded = true;
      return {
        stepId:  this.stepId, outcome: 'skipped',
        durationMs: performance.now() - start,
        message: 'PluginHost not available.',
      };
    }

    const manifestMap = new Map(ctx.discoveredManifests.map(m => [m.id, m]));

    for (const pluginId of ctx.sortedPluginIds) {
      const manifest = manifestMap.get(pluginId);
      if (!manifest) continue;

      try {
        // The PluginHost handles the actual registration into registries.
        // This step orchestrates the loop and handles per-plugin failures.
        // Concrete implementation of PluginHost is in Phase 2.4.
        this.logger.info(`[PluginRegistration] Registering: ${pluginId}@${manifest.version}`);
        // await this.pluginHost.register(manifest, this.registry!);
        ctx.loadedPluginIds.push(pluginId);
        this.logger.info(`[PluginRegistration] ✓ ${pluginId}`);
      } catch (err) {
        ctx.failedPluginIds.push(pluginId);
        ctx.isDegraded = true;
        const msg = `Plugin ${pluginId} registration failed: ${String(err)}`;
        ctx.warnings.push(msg);
        this.logger.error(`[PluginRegistration] ✗ ${msg}`);
      }
    }

    const outcome = ctx.failedPluginIds.length > 0 ? 'success' : 'success';
    return {
      stepId:     this.stepId,
      outcome,
      durationMs: performance.now() - start,
      message:    `Loaded: ${ctx.loadedPluginIds.length}. Failed: ${ctx.failedPluginIds.length}.`,
      metadata:   {
        loaded: ctx.loadedPluginIds,
        failed: ctx.failedPluginIds,
      },
    };
  }
}
```

---

### Step 07 — SecurityInitStep

**`src/app/core/kernel/boot/steps/07-security-init.step.ts`**

**Purpose:** Restore the user session from storage. If a valid access token + refresh token exist, load the user profile and effective permissions. If not, mark the session as unauthenticated (not an error — the user simply needs to log in).

**Critical:** NO — an unauthenticated state is valid; the auth guard redirects to `/login`.

```typescript
import { inject, Injectable } from '@angular/core';
import { IBootStep, BootContext, StepResult } from './boot-step.interface';
import { BootLogger } from '../boot-logger';

// AuthFacade is the concrete service (already implemented in Phase 1).
// The step imports only its token to keep coupling loose.
import { AUTH_FACADE_TOKEN } from '../../../../auth/tokens/auth.tokens';

@Injectable()
export class SecurityInitStep implements IBootStep {
  readonly stepId   = '07-security-init';
  readonly stepName = 'Security Initialization';
  readonly order    = 7;
  readonly critical = false;

  private readonly authFacade = inject(AUTH_FACADE_TOKEN, { optional: true });
  private readonly logger     = inject(BootLogger);

  canSkip(_ctx: BootContext): boolean {
    return false;
  }

  async execute(ctx: BootContext): Promise<StepResult> {
    const start = performance.now();

    if (!this.authFacade) {
      ctx.warnings.push('AUTH_FACADE_TOKEN not provided. Security features disabled.');
      ctx.isDegraded = true;
      return {
        stepId:     this.stepId,
        outcome:    'skipped',
        durationMs: performance.now() - start,
        message:    'AuthFacade not available.',
      };
    }

    try {
      await this.authFacade.restoreSession();
      const authenticated = this.authFacade.isAuthenticated();
      ctx.sessionRestored = authenticated;

      this.logger.info(
        authenticated
          ? `[Security] Session restored for user: ${this.authFacade.currentUser()?.email}`
          : '[Security] No active session. User must log in.'
      );

      return {
        stepId:     this.stepId,
        outcome:    'success',
        durationMs: performance.now() - start,
        message:    authenticated ? 'Session restored.' : 'No session — unauthenticated.',
        metadata:   { authenticated },
      };
    } catch (err) {
      this.logger.warn(`[Security] Session restore failed: ${String(err)}`);
      ctx.sessionRestored = false;
      ctx.isDegraded      = true;
      ctx.warnings.push(`Session restore failed: ${String(err)}`);

      return {
        stepId:     this.stepId,
        outcome:    'success', // Still 'success' — unauthenticated is a valid state
        durationMs: performance.now() - start,
        message:    'Session restore failed. Starting unauthenticated.',
      };
    }
  }
}
```

---

### Step 08 — RouteBuildStep

**`src/app/core/kernel/boot/steps/08-route-build.step.ts`**

**Purpose:** Tell the RouteRegistry to compile all registered `RouteDef` objects into Angular `Route[]` and inject them into the Angular Router via `resetConfig()`.

**Critical:** YES — without routes the application is unnavigable.

```typescript
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IBootStep, BootContext, StepResult } from './boot-step.interface';
import { REGISTRY_API_TOKEN } from '../../tokens/kernel.tokens';
import { BootLogger } from '../boot-logger';

@Injectable()
export class RouteBuildStep implements IBootStep {
  readonly stepId   = '08-route-build';
  readonly stepName = 'Route Build';
  readonly order    = 8;
  readonly critical = true;

  private readonly router   = inject(Router);
  private readonly registry = inject(REGISTRY_API_TOKEN, { optional: true });
  private readonly logger   = inject(BootLogger);

  canSkip(ctx: BootContext): boolean {
    // Skip if no plugins were loaded — shell routes still need to be built
    return false;
  }

  async execute(ctx: BootContext): Promise<StepResult> {
    const start = performance.now();

    if (!this.registry) {
      return {
        stepId:     this.stepId,
        outcome:    'failed',
        durationMs: performance.now() - start,
        error:      'RegistryAPI not available — cannot build routes.',
      };
    }

    try {
      const routeRegistry = this.registry.get('route') as any;
      const pluginRoutes  = routeRegistry?.buildAngularRoutes?.() ?? [];

      // Merge plugin routes into the existing router config
      const existingConfig = this.router.config;
      this.router.resetConfig([...existingConfig, ...pluginRoutes]);

      this.logger.info(`[RouteBuild] Registered ${pluginRoutes.length} plugin route(s).`);

      return {
        stepId:     this.stepId,
        outcome:    'success',
        durationMs: performance.now() - start,
        message:    `${pluginRoutes.length} routes registered.`,
        metadata:   { routeCount: pluginRoutes.length },
      };
    } catch (err) {
      return {
        stepId:     this.stepId,
        outcome:    'failed',
        durationMs: performance.now() - start,
        error:      String(err),
      };
    }
  }
}
```

---

### Step 09 — ReadyStep

**`src/app/core/kernel/boot/steps/09-ready.step.ts`**

**Purpose:** Final step. Emits `kernel:ready` or `kernel:degraded` event. Logs the boot summary.

**Critical:** NO — this step only emits events. Failure here does not stop the platform.

```typescript
import { inject, Injectable } from '@angular/core';
import { IBootStep, BootContext, StepResult } from './boot-step.interface';
import { EVENT_BUS_TOKEN } from '../../tokens/kernel.tokens';
import { BootLogger } from '../boot-logger';
import { BootMetrics } from '../boot-metrics';
import { KernelEventTypes } from '../../events/kernel-events';

@Injectable()
export class ReadyStep implements IBootStep {
  readonly stepId   = '09-ready';
  readonly stepName = 'Platform Ready';
  readonly order    = 9;
  readonly critical = false;

  private readonly eventBus = inject(EVENT_BUS_TOKEN, { optional: true });
  private readonly logger   = inject(BootLogger);
  private readonly metrics  = inject(BootMetrics);

  canSkip(_ctx: BootContext): boolean {
    return false;
  }

  async execute(ctx: BootContext): Promise<StepResult> {
    const start       = performance.now();
    const bootDuration = this.metrics.totalDurationMs();

    if (ctx.isDegraded) {
      this.logger.warn(
        `[Kernel] ⚠ Platform DEGRADED after ${bootDuration}ms. ` +
        `Warnings: ${ctx.warnings.length}`
      );
      this.eventBus?.emit({
        type:            KernelEventTypes.DEGRADED,
        timestamp:       new Date().toISOString(),
        bootDurationMs:  bootDuration,
        failedSteps:     ctx.stepResults.filter(r => r.outcome === 'failed').map(r => r.stepId),
        failedPlugins:   ctx.failedPluginIds,
        reason:          ctx.warnings.join('; '),
      });
    } else {
      this.logger.info(
        `[Kernel] ✓ Platform READY in ${bootDuration}ms. ` +
        `Plugins: ${ctx.loadedPluginIds.length}`
      );
      this.eventBus?.emit({
        type:            KernelEventTypes.READY,
        timestamp:       new Date().toISOString(),
        bootDurationMs:  bootDuration,
        loadedPlugins:   ctx.loadedPluginIds,
        failedPlugins:   ctx.failedPluginIds,
      });
    }

    return {
      stepId:     this.stepId,
      outcome:    'success',
      durationMs: performance.now() - start,
      message:    ctx.isDegraded ? 'Degraded.' : 'Ready.',
    };
  }
}
```

---

## 10. BootStateMachine

**`src/app/core/kernel/boot/boot-state-machine.ts`**

**Purpose:** Enforce valid state transitions for the kernel lifecycle. Prevents invalid state changes (e.g., boot() called twice).

**Responsibilities:**
- Hold the current `KernelStatus` as a writable signal
- Validate transitions before applying them
- Throw `InvalidKernelStateTransitionError` on invalid transitions

```typescript
import { Injectable, signal, Signal } from '@angular/core';

export type KernelStatus =
  | 'idle'
  | 'booting'
  | 'ready'
  | 'degraded'
  | 'error'
  | 'shutting-down'
  | 'offline';

// Valid transitions: from → set of valid 'to' states
const VALID_TRANSITIONS: Record<KernelStatus, KernelStatus[]> = {
  'idle':         ['booting'],
  'booting':      ['ready', 'degraded', 'error'],
  'ready':        ['shutting-down'],
  'degraded':     ['shutting-down'],
  'error':        ['shutting-down'],
  'shutting-down':['offline'],
  'offline':      [],
};

export class InvalidKernelStateTransitionError extends Error {
  constructor(from: KernelStatus, to: KernelStatus) {
    super(`Invalid kernel state transition: ${from} → ${to}`);
    this.name = 'InvalidKernelStateTransitionError';
  }
}

@Injectable()
export class BootStateMachine {
  // ─── Purpose ─────────────────────────────────────────────────────────────
  // Owns the authoritative KernelStatus signal.
  // All status reads go through this service — never through a local signal.

  private readonly _status = signal<KernelStatus>('idle');

  // ─── Public API ──────────────────────────────────────────────────────────

  readonly status: Signal<KernelStatus> = this._status.asReadonly();

  get current(): KernelStatus {
    return this._status();
  }

  transition(to: KernelStatus): void {
    const from   = this._status();
    const allowed = VALID_TRANSITIONS[from];

    if (!allowed.includes(to)) {
      throw new InvalidKernelStateTransitionError(from, to);
    }

    this._status.set(to);
  }

  canTransitionTo(to: KernelStatus): boolean {
    return VALID_TRANSITIONS[this._status()].includes(to);
  }

  // ─── Extension Points ────────────────────────────────────────────────────
  // Future: allowExtraTransition(from, to) for test environments that need
  // to reset the state machine without a full platform restart.
}
```

---

## 11. BootLogger

**`src/app/core/kernel/boot/boot-logger.ts`**

**Purpose:** Structured, level-filtered logging during the boot sequence. All boot steps log through this service, not directly to `console`.

**Responsibilities:**
- Collect log entries with timestamp, level, and message
- Filter by configured log level
- Write to console in development
- Expose all entries for DiagnosticsService

```typescript
import { inject, Injectable } from '@angular/core';
import { PLATFORM_CONFIG_TOKEN } from '../tokens/kernel.tokens';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly level:     LogLevel;
  readonly message:   string;
  readonly timestamp: string;
  readonly stepId?:   string;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3,
};

@Injectable()
export class BootLogger {
  // ─── Purpose ─────────────────────────────────────────────────────────────
  // Structured logging for the boot pipeline.
  // Output: console (dev) + in-memory buffer (always).

  private readonly entries:   LogEntry[] = [];
  private readonly minLevel:  LogLevel;

  constructor() {
    const config = inject(PLATFORM_CONFIG_TOKEN, { optional: true });
    this.minLevel = config?.bootLogLevel ?? 'info';
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  debug(message: string, stepId?: string): void { this.log('debug', message, stepId); }
  info (message: string, stepId?: string): void { this.log('info',  message, stepId); }
  warn (message: string, stepId?: string): void { this.log('warn',  message, stepId); }
  error(message: string, stepId?: string): void { this.log('error', message, stepId); }

  getEntries(): ReadonlyArray<LogEntry> {
    return this.entries;
  }

  getEntriesForStep(stepId: string): LogEntry[] {
    return this.entries.filter(e => e.stepId === stepId);
  }

  clear(): void {
    this.entries.length = 0;
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private log(level: LogLevel, message: string, stepId?: string): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.minLevel]) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      stepId,
    };

    this.entries.push(entry);
    this.writeToConsole(entry);
  }

  private writeToConsole(entry: LogEntry): void {
    const prefix = `[iDoo Kernel ${entry.timestamp}]`;
    switch (entry.level) {
      case 'debug': console.debug(prefix, entry.message); break;
      case 'info':  console.info (prefix, entry.message); break;
      case 'warn':  console.warn (prefix, entry.message); break;
      case 'error': console.error(prefix, entry.message); break;
    }
  }
}
```

---

## 12. BootMetrics

**`src/app/core/kernel/boot/boot-metrics.ts`**

**Purpose:** Collect per-step timing metrics during boot. Used by DiagnosticsService for performance reporting.

```typescript
import { Injectable } from '@angular/core';

export interface StepTiming {
  readonly stepId:     string;
  readonly stepName:   string;
  readonly startMs:    number;
  readonly endMs:      number;
  readonly durationMs: number;
  readonly outcome:    'success' | 'failed' | 'skipped';
}

export interface BootMetricsSummary {
  readonly totalDurationMs:  number;
  readonly stepTimings:      StepTiming[];
  readonly slowestStep:      StepTiming | null;
  readonly fastestStep:      StepTiming | null;
  readonly failedStepCount:  number;
  readonly skippedStepCount: number;
}

@Injectable()
export class BootMetrics {
  // ─── Purpose ─────────────────────────────────────────────────────────────
  // Measures wall-clock time per boot step.
  // Data is diagnostic only — it does not affect boot behaviour.

  private readonly timings:  StepTiming[] = [];
  private bootStartMs = 0;
  private bootEndMs   = 0;

  // ─── Public API ──────────────────────────────────────────────────────────

  markBootStart(): void {
    this.bootStartMs = performance.now();
    this.timings.length = 0;
  }

  markBootEnd(): void {
    this.bootEndMs = performance.now();
  }

  recordStep(
    stepId:     string,
    stepName:   string,
    startMs:    number,
    endMs:      number,
    outcome:    StepTiming['outcome'],
  ): void {
    this.timings.push({
      stepId, stepName, startMs, endMs,
      durationMs: endMs - startMs,
      outcome,
    });
  }

  totalDurationMs(): number {
    return this.bootEndMs - this.bootStartMs;
  }

  getSummary(): BootMetricsSummary {
    const successful = this.timings.filter(t => t.outcome === 'success');
    return {
      totalDurationMs:  this.totalDurationMs(),
      stepTimings:      [...this.timings],
      slowestStep:      successful.reduce<StepTiming | null>(
        (max, t) => (!max || t.durationMs > max.durationMs) ? t : max, null
      ),
      fastestStep:      successful.reduce<StepTiming | null>(
        (min, t) => (!min || t.durationMs < min.durationMs) ? t : min, null
      ),
      failedStepCount:  this.timings.filter(t => t.outcome === 'failed').length,
      skippedStepCount: this.timings.filter(t => t.outcome === 'skipped').length,
    };
  }

  reset(): void {
    this.timings.length = 0;
    this.bootStartMs = 0;
    this.bootEndMs   = 0;
  }
}
```

---

## 13. BootPipeline

**`src/app/core/kernel/boot/boot-pipeline.ts`**

**Purpose:** Owns the ordered, complete list of boot steps. Provides the sorted sequence to BootManager.

**Extension Point:** `EXTRA_BOOT_STEP_TOKEN` allows third-party boot steps to be injected.

```typescript
import { inject, Injectable, Optional } from '@angular/core';
import { IBootStep } from './steps/boot-step.interface';
import { EXTRA_BOOT_STEP_TOKEN } from '../tokens/kernel.tokens';

// Built-in steps
import { ConfigurationStep }       from './steps/01-configuration.step';
import { StartupValidationStep }   from './steps/02-startup-validation.step';
import { RegistryInitStep }        from './steps/03-registry-init.step';
import { PluginDiscoveryStep }     from './steps/04-plugin-discovery.step';
import { DependencyGraphStep }     from './steps/05-dependency-graph.step';
import { PluginRegistrationStep }  from './steps/06-plugin-registration.step';
import { SecurityInitStep }        from './steps/07-security-init.step';
import { RouteBuildStep }          from './steps/08-route-build.step';
import { ReadyStep }               from './steps/09-ready.step';

@Injectable()
export class BootPipeline {
  // ─── Purpose ─────────────────────────────────────────────────────────────
  // Assembles the ordered list of boot steps from built-in + injected extras.
  // BootManager calls getOrderedSteps() and executes them in sequence.

  private readonly extraSteps: IBootStep[];

  constructor() {
    this.extraSteps = inject(EXTRA_BOOT_STEP_TOKEN, { optional: true }) ?? [];
  }

  // Injected step instances (from Angular DI — each is a singleton)
  private readonly step01 = inject(ConfigurationStep);
  private readonly step02 = inject(StartupValidationStep);
  private readonly step03 = inject(RegistryInitStep);
  private readonly step04 = inject(PluginDiscoveryStep);
  private readonly step05 = inject(DependencyGraphStep);
  private readonly step06 = inject(PluginRegistrationStep);
  private readonly step07 = inject(SecurityInitStep);
  private readonly step08 = inject(RouteBuildStep);
  private readonly step09 = inject(ReadyStep);

  // ─── Public API ──────────────────────────────────────────────────────────

  getOrderedSteps(): IBootStep[] {
    const all: IBootStep[] = [
      this.step01, this.step02, this.step03,
      this.step04, this.step05, this.step06,
      this.step07, this.step08, this.step09,
      ...this.extraSteps,
    ];
    return [...all].sort((a, b) => a.order - b.order);
  }

  // ─── Extension Points ────────────────────────────────────────────────────
  // Third-party steps injected via EXTRA_BOOT_STEP_TOKEN.
  // They must use an order value outside the 1–9 built-in range (10–98).
  // Order 99 is reserved for future platform use.
}
```

---

## 14. BootManager

**`src/app/core/kernel/boot/boot-manager.service.ts`**

**Purpose:** Executes the boot pipeline. Manages the interaction between `BootPipeline`, `BootStateMachine`, `BootLogger`, and `BootMetrics`. Implements timeout, error recovery, and graceful degradation.

```typescript
import { inject, Injectable } from '@angular/core';
import { BootPipeline }      from './boot-pipeline';
import { BootStateMachine }  from './boot-state-machine';
import { BootLogger }        from './boot-logger';
import { BootMetrics }       from './boot-metrics';
import { BootContext, IBootStep, StepResult } from './steps/boot-step.interface';
import { EVENT_BUS_TOKEN, PLATFORM_CONFIG_TOKEN } from '../tokens/kernel.tokens';
import { KernelEventTypes } from '../events/kernel-events';

export class BootTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Platform boot timed out after ${timeoutMs}ms.`);
    this.name = 'BootTimeoutError';
  }
}

@Injectable()
export class BootManager {
  // ─── Purpose ─────────────────────────────────────────────────────────────
  // Orchestrates the boot pipeline from first step to kernel:ready.
  // Is the ONLY class that calls step.execute().

  // ─── Dependencies ────────────────────────────────────────────────────────
  private readonly pipeline    = inject(BootPipeline);
  private readonly stateMachine= inject(BootStateMachine);
  private readonly logger      = inject(BootLogger);
  private readonly metrics     = inject(BootMetrics);
  private readonly eventBus    = inject(EVENT_BUS_TOKEN, { optional: true });
  private readonly config      = inject(PLATFORM_CONFIG_TOKEN, { optional: true });

  // ─── State ───────────────────────────────────────────────────────────────
  private aborted = false;

  // ─── Public API ──────────────────────────────────────────────────────────

  async run(): Promise<BootContext> {
    if (!this.stateMachine.canTransitionTo('booting')) {
      throw new Error(`Cannot boot: kernel is in '${this.stateMachine.current}' state.`);
    }

    this.stateMachine.transition('booting');
    this.metrics.markBootStart();
    this.aborted = false;

    this.eventBus?.emit({
      type:            KernelEventTypes.BOOTING,
      timestamp:       new Date().toISOString(),
      platformVersion: this.config?.platformVersion ?? 'unknown',
    });

    this.logger.info('[BootManager] Boot pipeline started.');

    const ctx = this.createFreshContext();
    const steps = this.pipeline.getOrderedSteps();
    const timeoutMs = this.config?.bootTimeoutMs ?? 30_000;

    try {
      await this.runWithTimeout(
        () => this.executeSteps(steps, ctx),
        timeoutMs,
      );
    } catch (err) {
      if (err instanceof BootTimeoutError) {
        this.logger.error(`[BootManager] ${err.message}`);
      }
      this.stateMachine.transition('error');
      this.metrics.markBootEnd();
      throw err;
    }

    this.metrics.markBootEnd();
    this.finalize(ctx);
    return ctx;
  }

  abort(): void {
    this.aborted = true;
    this.logger.warn('[BootManager] Boot aborted externally.');
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private async executeSteps(steps: IBootStep[], ctx: BootContext): Promise<void> {
    for (const step of steps) {
      if (this.aborted) break;

      const stepStart = performance.now();
      this.eventBus?.emit({
        type:      KernelEventTypes.STEP_STARTED,
        stepId:    step.stepId,
        stepName:  step.stepName,
        stepOrder: step.order,
        timestamp: new Date().toISOString(),
      });

      let result: StepResult;

      try {
        if (step.canSkip(ctx)) {
          result = {
            stepId: step.stepId, outcome: 'skipped',
            durationMs: performance.now() - stepStart,
            message: 'Skipped (canSkip returned true)',
          };
          this.logger.info(`[BootManager] ⊘ Step ${step.stepId} skipped.`);
        } else {
          result = await step.execute(ctx);
          this.logger.info(
            `[BootManager] ${result.outcome === 'success' ? '✓' : '✗'} ` +
            `Step ${step.stepId} ${result.outcome} in ${result.durationMs.toFixed(1)}ms. ` +
            `${result.message ?? ''}`
          );
        }
      } catch (err) {
        step.onError?.(err, ctx);
        result = {
          stepId:     step.stepId,
          outcome:    'failed',
          durationMs: performance.now() - stepStart,
          error:      String(err),
        };
        this.logger.error(`[BootManager] ✗ Step ${step.stepId} threw: ${String(err)}`);
      }

      ctx.stepResults.push(result);
      this.metrics.recordStep(step.stepId, step.stepName, stepStart, performance.now(), result.outcome);

      if (result.outcome === 'failed') {
        this.eventBus?.emit({
          type:      KernelEventTypes.STEP_FAILED,
          stepId:    step.stepId,
          stepName:  step.stepName,
          critical:  step.critical,
          error:     String(result.error),
          timestamp: new Date().toISOString(),
        });

        if (step.critical) {
          this.logger.error(`[BootManager] Critical step ${step.stepId} failed. Aborting.`);
          this.stateMachine.transition('error');
          this.eventBus?.emit({
            type:       KernelEventTypes.ERROR,
            timestamp:  new Date().toISOString(),
            failedStep: step.stepId,
            error:      String(result.error),
          });
          return; // abort remaining steps
        } else {
          ctx.isDegraded = true;
          this.logger.warn(`[BootManager] Non-critical step ${step.stepId} failed. Continuing degraded.`);
        }
      } else {
        this.eventBus?.emit({
          type:       KernelEventTypes.STEP_COMPLETED,
          stepId:     step.stepId,
          stepName:   step.stepName,
          durationMs: result.durationMs,
          timestamp:  new Date().toISOString(),
        });
      }
    }
  }

  private finalize(ctx: BootContext): void {
    const isError = this.stateMachine.current === 'error';
    if (!isError) {
      this.stateMachine.transition(ctx.isDegraded ? 'degraded' : 'ready');
    }
    this.logger.info(
      `[BootManager] Boot complete. Status: ${this.stateMachine.current}. ` +
      `Duration: ${this.metrics.totalDurationMs().toFixed(1)}ms.`
    );
  }

  private createFreshContext(): BootContext {
    return {
      config:               null,
      discoveredManifests:  [],
      sortedPluginIds:      [],
      loadedPluginIds:      [],
      failedPluginIds:      [],
      sessionRestored:      false,
      stepResults:          [],
      warnings:             [],
      isDegraded:           false,
    };
  }

  private async runWithTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new BootTimeoutError(ms)), ms);
      fn().then(
        result => { clearTimeout(timer); resolve(result); },
        error  => { clearTimeout(timer); reject(error);   },
      );
    });
  }
}
```

---

## 15. LifecycleHooksService

**`src/app/core/kernel/lifecycle/lifecycle-hooks.service.ts`**

**Purpose:** Allow engines, plugins, and application code to register callbacks for kernel lifecycle events without subscribing to the EventBus directly.

```typescript
import { Injectable } from '@angular/core';

export type LifecycleHook =
  | 'beforeBoot'
  | 'afterBoot'
  | 'beforeShutdown'
  | 'afterShutdown'
  | 'onDegraded'
  | 'onError';

export type HookHandler = () => void | Promise<void>;

@Injectable({ providedIn: 'root' })
export class LifecycleHooksService {
  // ─── Purpose ─────────────────────────────────────────────────────────────
  // Registry of lifecycle callbacks. BootManager calls run() at the
  // appropriate moment. Simpler than EventBus for one-time callbacks.

  private readonly hooks = new Map<LifecycleHook, HookHandler[]>();

  // ─── Public API ──────────────────────────────────────────────────────────

  register(hook: LifecycleHook, handler: HookHandler): () => void {
    if (!this.hooks.has(hook)) this.hooks.set(hook, []);
    this.hooks.get(hook)!.push(handler);

    // Return unregister function
    return () => {
      const handlers = this.hooks.get(hook) ?? [];
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    };
  }

  async run(hook: LifecycleHook): Promise<void> {
    const handlers = this.hooks.get(hook) ?? [];
    for (const handler of handlers) {
      try {
        await handler();
      } catch (err) {
        console.error(`[LifecycleHooks] Handler for '${hook}' threw:`, err);
        // Individual handler failures do not stop other handlers
      }
    }
  }

  clear(hook?: LifecycleHook): void {
    if (hook) {
      this.hooks.delete(hook);
    } else {
      this.hooks.clear();
    }
  }

  // ─── Extension Points ────────────────────────────────────────────────────
  // Future: hook priorities (run order within a single hook event).
  // Future: hook metadata (handler name, registration time) for diagnostics.
}
```

---

## 16. VersionService

**`src/app/core/kernel/version/version.service.ts`**

**Purpose:** Owns the platform version and provides SemVer compatibility checks for plugin manifests.

```typescript
import { Injectable } from '@angular/core';

export interface PlatformVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly build: string;
  readonly full:  string;  // '1.0.0+20260628'
}

@Injectable({ providedIn: 'root' })
export class VersionService {
  // ─── Platform Version (updated each release) ─────────────────────────────
  private static readonly VERSION: PlatformVersion = {
    major: 1,
    minor: 0,
    patch: 0,
    build: '20260628',
    full:  '1.0.0+20260628',
  };

  // ─── Public API ──────────────────────────────────────────────────────────

  getPlatformVersion(): PlatformVersion {
    return VersionService.VERSION;
  }

  /**
   * Checks whether the current platform version satisfies a SemVer range.
   * Range format: '^1.0.0' (compatible), '>=1.0.0 <2.0.0', '~1.0.0', etc.
   *
   * NOTE: This is a simplified implementation for Phase 1.
   * Phase 2: Replace with a full SemVer library (semver npm package).
   */
  isCompatible(range: string): boolean {
    const v = VersionService.VERSION;

    // Handle '^major.minor.patch' — compatible if major matches and version >=
    const caretMatch = range.match(/^\^(\d+)\.(\d+)\.(\d+)$/);
    if (caretMatch) {
      const [, major, minor, patch] = caretMatch.map(Number);
      if (v.major !== major) return false;
      if (v.minor < minor)   return false;
      if (v.minor === minor && v.patch < patch) return false;
      return true;
    }

    // Handle '>=major.minor.patch' — exact minimum
    const gteMatch = range.match(/^>=(\d+)\.(\d+)\.(\d+)$/);
    if (gteMatch) {
      const [, major, minor, patch] = gteMatch.map(Number);
      return this.compare(v, { major, minor, patch }) >= 0;
    }

    // Exact match
    const exactMatch = range.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (exactMatch) {
      const [, major, minor, patch] = exactMatch.map(Number);
      return v.major === major && v.minor === minor && v.patch === patch;
    }

    return false; // unknown range format
  }

  isValidSemver(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  compare(
    a: Pick<PlatformVersion, 'major' | 'minor' | 'patch'>,
    b: Pick<PlatformVersion, 'major' | 'minor' | 'patch'>,
  ): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    return a.patch - b.patch;
  }
}
```

---

## 17. HealthService

**`src/app/core/kernel/health/health.service.ts`**

**Purpose:** Run named health checks and produce a `KernelHealthReport`. Consumed by PlatformKernel and the diagnostics dashboard.

```typescript
import { Injectable } from '@angular/core';

// ─── Health Check Contract ────────────────────────────────────────────────────

export interface IHealthCheck {
  readonly name: string;
  readonly description: string;
  check(): Promise<HealthCheckResult>;
}

export interface HealthCheckResult {
  readonly name:    string;
  readonly status:  'healthy' | 'degraded' | 'unhealthy';
  readonly message: string;
  readonly latencyMs?: number;
  readonly metadata?: Record<string, unknown>;
}

// ─── Health Report ────────────────────────────────────────────────────────────

export interface KernelHealthReport {
  readonly status:      'healthy' | 'degraded' | 'unhealthy';
  readonly timestamp:   string;
  readonly checks:      HealthCheckResult[];
  readonly summary: {
    total:     number;
    healthy:   number;
    degraded:  number;
    unhealthy: number;
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class HealthService {
  // ─── Purpose ─────────────────────────────────────────────────────────────
  // Maintains a registry of named health checks.
  // Any subsystem can register a health check.
  // PlatformKernel.getHealthReport() delegates here.

  private readonly checks = new Map<string, IHealthCheck>();

  // ─── Public API ──────────────────────────────────────────────────────────

  register(check: IHealthCheck): void {
    this.checks.set(check.name, check);
  }

  unregister(name: string): void {
    this.checks.delete(name);
  }

  async runAll(): Promise<KernelHealthReport> {
    const results: HealthCheckResult[] = await Promise.all(
      Array.from(this.checks.values()).map(c => this.runSafe(c))
    );

    const healthy   = results.filter(r => r.status === 'healthy').length;
    const degraded  = results.filter(r => r.status === 'degraded').length;
    const unhealthy = results.filter(r => r.status === 'unhealthy').length;

    const overallStatus: KernelHealthReport['status'] =
      unhealthy > 0 ? 'unhealthy' :
      degraded  > 0 ? 'degraded'  :
      'healthy';

    return {
      status:    overallStatus,
      timestamp: new Date().toISOString(),
      checks:    results,
      summary: { total: results.length, healthy, degraded, unhealthy },
    };
  }

  async runOne(name: string): Promise<HealthCheckResult | null> {
    const check = this.checks.get(name);
    if (!check) return null;
    return this.runSafe(check);
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private async runSafe(check: IHealthCheck): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      const result = await check.check();
      return { ...result, latencyMs: performance.now() - start };
    } catch (err) {
      return {
        name:      check.name,
        status:    'unhealthy',
        message:   `Health check threw: ${String(err)}`,
        latencyMs: performance.now() - start,
      };
    }
  }
}
```

### Built-in Health Checks

```typescript
// src/app/core/kernel/health/checks/api-connectivity.check.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { IHealthCheck, HealthCheckResult } from '../health.service';
import { PLATFORM_CONFIG_TOKEN } from '../../tokens/kernel.tokens';

@Injectable({ providedIn: 'root' })
export class ApiConnectivityCheck implements IHealthCheck {
  readonly name        = 'api-connectivity';
  readonly description = 'Checks that the backend API is reachable';

  private readonly http   = inject(HttpClient);
  private readonly config = inject(PLATFORM_CONFIG_TOKEN, { optional: true });

  async check(): Promise<HealthCheckResult> {
    if (!this.config) {
      return { name: this.name, status: 'degraded', message: 'Config not available.' };
    }
    try {
      await firstValueFrom(
        this.http.get(`${this.config.apiUrl}/actuator/health`, { observe: 'response' }).pipe(
          timeout(5000),
          catchError(() => of(null)),
        )
      );
      return { name: this.name, status: 'healthy', message: 'API is reachable.' };
    } catch {
      return { name: this.name, status: 'unhealthy', message: 'API is not reachable.' };
    }
  }
}

// src/app/core/kernel/health/checks/storage-availability.check.ts
@Injectable({ providedIn: 'root' })
export class StorageAvailabilityCheck implements IHealthCheck {
  readonly name        = 'storage-availability';
  readonly description = 'Checks that localStorage and sessionStorage are available and writable';

  async check(): Promise<HealthCheckResult> {
    try {
      const key = '__idoo_health_check__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      sessionStorage.setItem(key, '1');
      sessionStorage.removeItem(key);
      return { name: this.name, status: 'healthy', message: 'Storage available.' };
    } catch (err) {
      return { name: this.name, status: 'unhealthy', message: `Storage unavailable: ${String(err)}` };
    }
  }
}
```

---

## 18. DiagnosticsService

**`src/app/core/kernel/diagnostics/diagnostics.service.ts`**

**Purpose:** Aggregates all diagnostic information about the platform runtime. Used by the developer diagnostics panel and for remote error reporting.

```typescript
import { inject, Injectable } from '@angular/core';
import { BootMetrics, BootMetricsSummary } from '../boot/boot-metrics';
import { BootLogger, LogEntry } from '../boot/boot-logger';
import { BootStateMachine, KernelStatus } from '../boot/boot-state-machine';
import { VersionService, PlatformVersion } from '../version/version.service';
import { HealthService, KernelHealthReport } from '../health/health.service';

export interface DiagnosticsReport {
  readonly generatedAt:    string;
  readonly kernelStatus:   KernelStatus;
  readonly platformVersion: PlatformVersion;
  readonly bootMetrics:    BootMetricsSummary;
  readonly health:         KernelHealthReport | null;
  readonly bootLog:        ReadonlyArray<LogEntry>;
  readonly loadedPlugins:  string[];
  readonly failedPlugins:  string[];
  readonly warnings:       string[];
  readonly environment: {
    userAgent:       string;
    language:        string;
    online:          boolean;
    memory?:         unknown;
  };
}

@Injectable({ providedIn: 'root' })
export class DiagnosticsService {
  // ─── Purpose ─────────────────────────────────────────────────────────────
  // Snapshot of the complete platform runtime state at the moment of the call.
  // Useful for: support tickets, error reporting, developer panel.

  private readonly metrics      = inject(BootMetrics);
  private readonly logger       = inject(BootLogger);
  private readonly stateMachine = inject(BootStateMachine);
  private readonly versionService = inject(VersionService);
  private readonly healthService  = inject(HealthService);

  // Populated by PlatformKernel after boot completes
  loadedPlugins: string[] = [];
  failedPlugins: string[] = [];
  bootWarnings:  string[] = [];

  // ─── Public API ──────────────────────────────────────────────────────────

  async getReport(): Promise<DiagnosticsReport> {
    let health: KernelHealthReport | null = null;
    try {
      health = await this.healthService.runAll();
    } catch { /* health check failure should not prevent diagnostics report */ }

    return {
      generatedAt:      new Date().toISOString(),
      kernelStatus:     this.stateMachine.current,
      platformVersion:  this.versionService.getPlatformVersion(),
      bootMetrics:      this.metrics.getSummary(),
      health,
      bootLog:          this.logger.getEntries(),
      loadedPlugins:    [...this.loadedPlugins],
      failedPlugins:    [...this.failedPlugins],
      warnings:         [...this.bootWarnings],
      environment: {
        userAgent: navigator.userAgent,
        language:  navigator.language,
        online:    navigator.onLine,
        memory:    (performance as any).memory ?? undefined,
      },
    };
  }

  /** Expose diagnostics on window object in development mode. */
  exposeDevTools(apiUrl?: string): void {
    if (typeof window === 'undefined') return;
    (window as any).__idoo = {
      diagnostics: () => this.getReport(),
      health:      () => this.healthService.runAll(),
      logs:        () => this.logger.getEntries(),
      metrics:     () => this.metrics.getSummary(),
      version:     () => this.versionService.getPlatformVersion(),
    };
  }
}
```

---

## 19. PlatformContext

**`src/app/core/kernel/context/platform-context.service.ts`**

**Purpose:** The signal-based `RuntimeContext`. Every engine reads from this service. Updated by AuthFacade (session restore, login, logout) and ContextFacade (tenant/company/branch switch).

```typescript
import { computed, Injectable, signal, Signal } from '@angular/core';

export interface UserProfile {
  id:        string;
  email:     string;
  firstName: string;
  lastName:  string;
  fullName:  string;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class PlatformContext {
  // ─── Purpose ─────────────────────────────────────────────────────────────
  // Canonical signal-based runtime context.
  // AuthFacade and ContextFacade WRITE to this service.
  // All engines, guards, and directives READ from this service.
  // This is Ring 1 state — it has no knowledge of any ERP domain.

  // ─── Authentication ───────────────────────────────────────────────────────
  private readonly _isAuthenticated = signal(false);
  private readonly _currentUser     = signal<UserProfile | null>(null);

  readonly isAuthenticated: Signal<boolean>          = this._isAuthenticated.asReadonly();
  readonly currentUser:     Signal<UserProfile | null> = this._currentUser.asReadonly();

  // ─── Multi-Tenancy ────────────────────────────────────────────────────────
  private readonly _tenantId  = signal<string | null>(null);
  private readonly _companyId = signal<string | null>(null);
  private readonly _branchId  = signal<string | null>(null);

  readonly tenantId:  Signal<string | null> = this._tenantId.asReadonly();
  readonly companyId: Signal<string | null> = this._companyId.asReadonly();
  readonly branchId:  Signal<string | null> = this._branchId.asReadonly();

  // ─── Permissions ──────────────────────────────────────────────────────────
  private readonly _permissions   = signal<Set<string>>(new Set());
  private readonly _activeModules = signal<Set<string>>(new Set());
  private readonly _featureFlags  = signal<Set<string>>(new Set());

  readonly permissions:   Signal<Set<string>> = this._permissions.asReadonly();
  readonly activeModules: Signal<Set<string>> = this._activeModules.asReadonly();
  readonly featureFlags:  Signal<Set<string>> = this._featureFlags.asReadonly();

  // ─── Derived ─────────────────────────────────────────────────────────────
  readonly isSuperAdmin = computed(() =>
    this._permissions().has('SYSTEM:superadmin')
  );

  // ─── Write API (called by AuthFacade / ContextFacade) ─────────────────────

  setAuthenticated(user: UserProfile): void {
    this._currentUser.set(user);
    this._isAuthenticated.set(true);
  }

  clearAuthentication(): void {
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this._permissions.set(new Set());
    this._tenantId.set(null);
    this._companyId.set(null);
    this._branchId.set(null);
    this._activeModules.set(new Set());
  }

  setTenantContext(tenantId: string): void {
    this._tenantId.set(tenantId);
    this._companyId.set(null);
    this._branchId.set(null);
  }

  setCompanyContext(companyId: string): void {
    this._companyId.set(companyId);
    this._branchId.set(null);
  }

  setBranchContext(branchId: string): void {
    this._branchId.set(branchId);
  }

  setPermissions(permissions: string[]): void {
    this._permissions.set(new Set(permissions));
  }

  setActiveModules(moduleCodes: string[]): void {
    this._activeModules.set(new Set(moduleCodes));
  }

  setFeatureFlags(flags: string[]): void {
    this._featureFlags.set(new Set(flags));
  }

  // ─── Query API ────────────────────────────────────────────────────────────

  hasPermission(code: string): boolean {
    return this.isSuperAdmin() || this._permissions().has(code);
  }

  hasAnyPermission(codes: string[]): boolean {
    return this.isSuperAdmin() || codes.some(c => this._permissions().has(c));
  }

  hasAllPermissions(codes: string[]): boolean {
    return this.isSuperAdmin() || codes.every(c => this._permissions().has(c));
  }

  hasModule(moduleCode: string): boolean {
    return this._activeModules().has(moduleCode);
  }

  hasFeature(flag: string): boolean {
    return this._featureFlags().has(flag);
  }
}
```

---

## 20. PlatformKernel

**`src/app/core/kernel/platform-kernel.service.ts`**

**Purpose:** The top-level orchestrator. Implements `KernelAPI`. All external consumers go through this class.

```typescript
import { computed, inject, Injectable, Signal } from '@angular/core';
import { BootManager }          from './boot/boot-manager.service';
import { BootStateMachine, KernelStatus } from './boot/boot-state-machine';
import { BootMetrics }          from './boot/boot-metrics';
import { BootLogger }           from './boot/boot-logger';
import { LifecycleHooksService } from './lifecycle/lifecycle-hooks.service';
import { HealthService, KernelHealthReport } from './health/health.service';
import { DiagnosticsService, DiagnosticsReport } from './diagnostics/diagnostics.service';
import { VersionService, PlatformVersion } from './version/version.service';
import { PlatformContext }      from './context/platform-context.service';
import { KernelAPI }            from './interfaces/kernel-api.interface';
import { REGISTRY_API_TOKEN, PLUGIN_HOST_TOKEN, PLATFORM_CONFIG_TOKEN } from './tokens/kernel.tokens';
import type { RegistryAPI }     from './interfaces/registry-api.interface';
import type { PluginHostAPI }   from './interfaces/plugin-host-api.interface';

// ─── Errors ───────────────────────────────────────────────────────────────────

export class KernelAlreadyBootedError extends Error {
  constructor() {
    super('PlatformKernel.boot() was called but the kernel has already booted.');
    this.name = 'KernelAlreadyBootedError';
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PlatformKernel implements KernelAPI {

  // ─── Purpose ─────────────────────────────────────────────────────────────────
  // The single entry point for the platform runtime.
  // Delegates all work to specialist services.
  // Exposes KernelAPI to the rest of the application.

  // ─── Responsibilities ─────────────────────────────────────────────────────────
  // 1. Expose KernelStatus signal
  // 2. Orchestrate boot() and shutdown() flows via BootManager
  // 3. Delegate health, diagnostics, version to their services
  // 4. Expose registry and plugin host references
  // 5. Manage lifecycle hooks
  // 6. Expose dev tools in non-production mode

  // ─── Dependencies ────────────────────────────────────────────────────────────
  private readonly bootManager      = inject(BootManager);
  private readonly stateMachine     = inject(BootStateMachine);
  private readonly lifecycleHooks   = inject(LifecycleHooksService);
  private readonly healthService    = inject(HealthService);
  private readonly diagnostics      = inject(DiagnosticsService);
  private readonly versionSvc       = inject(VersionService);
  private readonly bootLogger       = inject(BootLogger);
  private readonly bootMetrics      = inject(BootMetrics);
  private readonly config           = inject(PLATFORM_CONFIG_TOKEN, { optional: true });

  // Subsystems accessed via tokens (loose coupling)
  readonly registry   = inject(REGISTRY_API_TOKEN,  { optional: true }) as RegistryAPI;
  readonly plugins    = inject(PLUGIN_HOST_TOKEN,    { optional: true }) as PluginHostAPI;

  // ─── Public State ─────────────────────────────────────────────────────────────
  readonly status:  Signal<KernelStatus> = this.stateMachine.status;
  readonly isReady: Signal<boolean>      = computed(() =>
    this.stateMachine.status() === 'ready' || this.stateMachine.status() === 'degraded'
  );

  // ─── Boot ─────────────────────────────────────────────────────────────────────

  async boot(): Promise<void> {
    if (!this.stateMachine.canTransitionTo('booting')) {
      throw new KernelAlreadyBootedError();
    }

    await this.lifecycleHooks.run('beforeBoot');

    const ctx = await this.bootManager.run();

    // Populate diagnostics service with boot results
    this.diagnostics.loadedPlugins = ctx.loadedPluginIds;
    this.diagnostics.failedPlugins = ctx.failedPluginIds;
    this.diagnostics.bootWarnings  = ctx.warnings;

    if (this.stateMachine.current === 'error') {
      await this.lifecycleHooks.run('onError');
      throw new Error(
        `Platform boot failed. Check boot log for details. ` +
        `Warnings: ${ctx.warnings.join(' | ')}`
      );
    }

    if (this.stateMachine.current === 'degraded') {
      await this.lifecycleHooks.run('onDegraded');
    }

    await this.lifecycleHooks.run('afterBoot');

    // Expose dev tools in non-production environments
    if (!this.config?.production) {
      this.diagnostics.exposeDevTools(this.config?.apiUrl);
    }
  }

  // ─── Shutdown ─────────────────────────────────────────────────────────────────

  async shutdown(): Promise<void> {
    if (!this.stateMachine.canTransitionTo('shutting-down')) {
      return; // Already shutting down or offline
    }

    await this.lifecycleHooks.run('beforeShutdown');
    this.stateMachine.transition('shutting-down');
    this.bootLogger.info('[Kernel] Shutting down...');

    // Allow plugins to clean up (delegated to PluginHost in Phase 2.4)
    // await this.plugins?.shutdown?.();

    // Clear platform context
    const ctx = inject(PlatformContext);
    ctx.clearAuthentication();

    this.stateMachine.transition('offline');
    this.bootLogger.info('[Kernel] Offline.');

    await this.lifecycleHooks.run('afterShutdown');
  }

  // ─── Diagnostics ──────────────────────────────────────────────────────────────

  getHealthReport(): KernelHealthReport {
    // Synchronous snapshot — returns last cached health or a minimal report.
    // For a fresh async check: await healthService.runAll()
    return {
      status:    this.isReady() ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks:    [],
      summary:   { total: 0, healthy: 0, degraded: 0, unhealthy: 0 },
    };
  }

  getDiagnosticsReport(): DiagnosticsReport {
    // Synchronous version — returns partial report without async health checks
    return {
      generatedAt:     new Date().toISOString(),
      kernelStatus:    this.stateMachine.current,
      platformVersion: this.versionSvc.getPlatformVersion(),
      bootMetrics:     this.bootMetrics.getSummary(),
      health:          null,
      bootLog:         this.bootLogger.getEntries(),
      loadedPlugins:   this.diagnostics.loadedPlugins,
      failedPlugins:   this.diagnostics.failedPlugins,
      warnings:        this.diagnostics.bootWarnings,
      environment: {
        userAgent: navigator.userAgent,
        language:  navigator.language,
        online:    navigator.onLine,
      },
    };
  }

  getVersion(): PlatformVersion {
    return this.versionSvc.getPlatformVersion();
  }

  // ─── Lifecycle Registration ───────────────────────────────────────────────────

  onReady(handler: () => void | Promise<void>): void {
    this.lifecycleHooks.register('afterBoot', handler);
  }

  onShutdown(handler: () => void | Promise<void>): void {
    this.lifecycleHooks.register('beforeShutdown', handler);
  }

  // ─── Future Extension Points ──────────────────────────────────────────────────
  // v1.1: kernel.registerHealthCheck(check) — public API for subsystem health checks
  // v1.1: kernel.getBootLog() — public access to BootLogger entries
  // v1.2: kernel.plugin.register(manifest) — runtime plugin loading (dynamic)
  // v2.0: kernel.remote.loadPlugin(url) — remote plugin loader
}
```

---

## 21. Kernel Provider

**`src/app/core/kernel/providers/kernel.provider.ts`**

**Purpose:** Single function that configures all Kernel services as Angular providers. Called in `app.config.ts`.

```typescript
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { PlatformConfig } from '../interfaces/platform-config.interface';
import { PLATFORM_CONFIG_TOKEN } from '../tokens/kernel.tokens';

// Kernel services
import { PlatformKernel }       from '../platform-kernel.service';
import { BootManager }          from '../boot/boot-manager.service';
import { BootPipeline }         from '../boot/boot-pipeline';
import { BootStateMachine }     from '../boot/boot-state-machine';
import { BootLogger }           from '../boot/boot-logger';
import { BootMetrics }          from '../boot/boot-metrics';
import { LifecycleHooksService } from '../lifecycle/lifecycle-hooks.service';
import { VersionService }       from '../version/version.service';
import { HealthService }        from '../health/health.service';
import { DiagnosticsService }   from '../diagnostics/diagnostics.service';
import { PlatformContext }      from '../context/platform-context.service';

// Boot steps
import { ConfigurationStep }       from '../boot/steps/01-configuration.step';
import { StartupValidationStep }   from '../boot/steps/02-startup-validation.step';
import { RegistryInitStep }        from '../boot/steps/03-registry-init.step';
import { PluginDiscoveryStep }     from '../boot/steps/04-plugin-discovery.step';
import { DependencyGraphStep }     from '../boot/steps/05-dependency-graph.step';
import { PluginRegistrationStep }  from '../boot/steps/06-plugin-registration.step';
import { SecurityInitStep }        from '../boot/steps/07-security-init.step';
import { RouteBuildStep }          from '../boot/steps/08-route-build.step';
import { ReadyStep }               from '../boot/steps/09-ready.step';

// Built-in health checks
import { ApiConnectivityCheck }    from '../health/checks/api-connectivity.check';
import { StorageAvailabilityCheck } from '../health/checks/storage-availability.check';

/**
 * Configure and provide the Platform Kernel.
 *
 * Usage:
 * ```typescript
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     providePlatform({ apiUrl: 'http://localhost:8080/api', production: false, platformVersion: '1.0.0' }),
 *     providePlugin(HrPluginManifest),
 *   ]
 * };
 * ```
 */
export function providePlatform(config: PlatformConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    // Config
    { provide: PLATFORM_CONFIG_TOKEN, useValue: config },

    // Kernel core
    PlatformKernel,
    BootManager,
    BootPipeline,
    BootStateMachine,
    BootLogger,
    BootMetrics,
    LifecycleHooksService,
    VersionService,
    HealthService,
    DiagnosticsService,
    PlatformContext,

    // Boot steps
    ConfigurationStep,
    StartupValidationStep,
    RegistryInitStep,
    PluginDiscoveryStep,
    DependencyGraphStep,
    PluginRegistrationStep,
    SecurityInitStep,
    RouteBuildStep,
    ReadyStep,

    // Built-in health checks (registered lazily via HealthService.register() in onInit)
    ApiConnectivityCheck,
    StorageAvailabilityCheck,
  ]);
}

/**
 * Register an additional plugin manifest.
 * Each call to providePlugin() appends one manifest to PLUGIN_MANIFEST_TOKEN.
 */
export function providePlugin(manifest: unknown): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PLUGIN_MANIFEST_TOKEN, useValue: manifest, multi: true },
  ]);
}
```

---

## 22. APP_INITIALIZER Wiring

**`src/app/app.config.ts`** — updated section

```typescript
import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter }             from '@angular/router';
import { provideAnimationsAsync }    from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes }                    from './app.routes';
import { providePlatform, providePlugin } from './core/kernel/providers/kernel.provider';
import { PlatformKernel }            from './core/kernel/platform-kernel.service';
import { jwtInterceptor }            from './core/auth/interceptors/jwt.interceptor';
import { contextInterceptor }        from './core/context/interceptors/context.interceptor';
import { loggingInterceptor }        from './core/interceptors/logging.interceptor';
import { errorInterceptor }          from './core/interceptors/error.interceptor';

// ─── Boot Factory ──────────────────────────────────────────────────────────

function bootKernelFactory(kernel: PlatformKernel): () => Promise<void> {
  return () => kernel.boot();
}

// ─── App Config ────────────────────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([loggingInterceptor, errorInterceptor, jwtInterceptor, contextInterceptor])
    ),

    // ─── Platform Kernel ────────────────────────────────────────────────────
    providePlatform({
      apiUrl:          'http://localhost:8080/api',
      production:      false,
      platformVersion: '1.0.0',
      bootLogLevel:    'info',
      bootTimeoutMs:   30_000,
    }),

    // ─── APP_INITIALIZER: Boot the Kernel before first render ───────────────
    {
      provide:    APP_INITIALIZER,
      useFactory: bootKernelFactory,
      deps:       [PlatformKernel],
      multi:      true,
    },

    // ─── Plugins (added here as modules are implemented) ───────────────────
    // providePlugin(HrPluginManifest),
    // providePlugin(FleetPluginManifest),
  ],
};
```

---

## 23. Error Recovery Model

### 23.1 Critical vs Non-Critical Failures

| Failure Type | Step(s) | Recovery Strategy |
|---|---|---|
| Config missing | `01-configuration` | Boot aborts → show config error screen |
| Invalid environment | `02-startup-validation` | Boot aborts → show browser requirements screen |
| Registry init failed | `03-registry-init` | Boot aborts → no recovery possible |
| Zero plugins found | `04-plugin-discovery` | Continue degraded → platform shell loads, no modules |
| Circular dependency | `05-dependency-graph` | Boot aborts → dependency cycle shown in error screen |
| Individual plugin registration fails | `06-plugin-registration` | Skip that plugin → degraded |
| Session restore fails | `07-security-init` | Continue unauthenticated → auth guard redirects to /login |
| Route build fails | `08-route-build` | Boot aborts → unnavigable platform |

### 23.2 Degraded Mode

When the kernel enters `degraded` status:

- The platform shell renders normally
- Failed plugins are absent from the menu (their menu items were never registered)
- Users can access modules from successfully loaded plugins
- The developer diagnostics panel shows which plugins failed and why
- `kernel:degraded` event is emitted — monitoring can alert on this

### 23.3 Error Screen

When the kernel enters `error` status, `AppComponent` reads the kernel status signal and renders `PlatformErrorComponent`:

```typescript
// app.component.ts
@Component({
  template: `
    @if (kernel.status() === 'error') {
      <app-platform-error />
    } @else if (kernel.isReady()) {
      <router-outlet />
    } @else {
      <app-boot-loading />
    }
  `
})
export class AppComponent {
  readonly kernel = inject(PlatformKernel);
}
```

### 23.4 Boot Timeout

If `boot()` does not complete within `PlatformConfig.bootTimeoutMs` (default: 30 seconds), `BootManager` rejects with `BootTimeoutError`. This transitions the kernel to `error` and renders the error screen with a "reload" button.

Common causes:
- Backend API unreachable (Step 07 security init waits for API)
- Very large number of plugins with slow `onInit()` handlers
- Network timeout on session restore

---

*End of Kernel Implementation Specification v1.0.0*

*Next Phase: 2.3 — Registry Manager Implementation*
