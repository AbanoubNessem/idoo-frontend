# Sprint 1 — Architecture Decision Log

**Sprint:** Sprint 1 — Platform Core Foundation  
**Date:** 2026-06-28  

---

## ADR-S1-001: Implementation Location — src/app/core/ vs packages/platform/

**Status:** Accepted  
**Date:** 2026-06-28  

**Context:**  
The sprint specification referenced `packages/platform/` as the target for platform core code. The project is a standard Angular CLI application, not an Nx monorepo.

**Decision:**  
Implement in `src/app/core/` subdirectories matching the existing project structure.

**Consequences:**  
- Zero: The architectural boundaries are preserved. All module paths and APIs are identical.
- If a future Nx migration occurs, only import paths need updating — not the APIs themselves.

---

## ADR-S1-002: Angular Signals for All State Management

**Status:** Accepted  
**Date:** 2026-06-28  

**Context:**  
The platform needs reactive state across kernel, registry, plugin, and runtime layers. Options: RxJS BehaviorSubject, Angular Signals, or plain objects.

**Decision:**  
Use Angular `signal()` and `computed()` for all mutable state. Use RxJS `Subject` only for event streams (EventBus).

**Consequences:**  
- Signals are synchronous, zero-overhead for computed views
- No async subscriptions needed for state reads
- EventBus uses Subject for multi-subscriber async event delivery (appropriate for fire-and-forget events)

---

## ADR-S1-003: djb2 Hash for RegistryEntry Checksum

**Status:** Accepted  
**Date:** 2026-06-28  

**Context:**  
RegistryEntry needs a checksum to detect duplicate/conflicting registrations. Options: SHA-256 (Web Crypto API), MD5, or djb2.

**Decision:**  
Use djb2 hash (pure JavaScript, no async, no browser API dependency).

**Consequences:**  
- Synchronous, works in all contexts (browser, SSR, workers)
- Not cryptographically secure — but checksums here detect accidental duplication, not malicious tampering
- Collision rate acceptable for registry key space (plugin count < 1000)

---

## ADR-S1-004: Kahn's Algorithm for Plugin Resolution

**Status:** Accepted  
**Date:** 2026-06-28  

**Context:**  
Plugins declare dependencies on other plugins. Boot order must respect these dependencies. Circular dependencies must be detected and rejected.

**Decision:**  
Implement Kahn's topological sort algorithm in `PluginResolverService`.

**Consequences:**  
- O(V+E) time complexity — efficient for expected plugin counts (< 100)
- Cycle detection is a natural byproduct of Kahn's algorithm (remaining nodes after BFS = cycle members)
- Plugins with equal depth sorted by `overridePriority` (lower = earlier) then alphabetically for determinism

---

## ADR-S1-005: 5-Second initFn Timeout via Promise.race

**Status:** Accepted  
**Date:** 2026-06-28  

**Context:**  
Plugin `initFn` callbacks can hang indefinitely. The platform must not block boot for a misbehaving plugin.

**Decision:**  
Wrap `initFn()` execution in `Promise.race([initFn(ctx), timeout(5000)])`. Timeout rejection transitions the plugin to `FAILED`.

**Consequences:**  
- Non-critical plugins that time out cause `isDegraded = true` but do not stop boot
- Critical plugins that time out abort the boot pipeline
- 5 seconds is configurable per plugin (via `bootTimeoutMs` in PlatformConfig for global override)

---

## ADR-S1-006: ExpressionEngine Uses new Function() Sandbox

**Status:** Accepted  
**Date:** 2026-06-28  

**Context:**  
The expression engine evaluates user-defined expressions (form visibility, field validation, computed values). Options: eval(), new Function(), a safe expression library (e.g. expr-eval).

**Decision:**  
Use `new Function('model', 'ctx', '"use strict"; return (' + expr + ')')` with try/catch.

**Consequences:**  
- No third-party dependency
- "use strict" prevents access to global `this`
- Expressions run in module scope — no window/document access unless explicitly passed via context
- Invalid expressions return `undefined` (not thrown to callers)
- Suitable for trusted plugin authors; not for end-user input without additional sandboxing

---

## ADR-S1-007: PLUGIN_MANIFEST_TOKEN as Multi-Provider

**Status:** Accepted  
**Date:** 2026-06-28  

**Context:**  
Multiple plugins need to be registered at application startup. Each plugin calls `providePlugin(manifest)`. The kernel needs to collect all manifests.

**Decision:**  
`PLUGIN_MANIFEST_TOKEN` is a multi-provider `InjectionToken<PluginManifest[]>`. Angular's DI system collects all multi-provider values into an array automatically.

**Consequences:**  
- Plugins are registered declaratively in `app.config.ts`
- No runtime plugin registration calls needed
- Order of providers determines discovery order (resolved by topological sort anyway)

---

## ADR-S1-008: AbstractDataProvider<T> Pattern

**Status:** Accepted  
**Date:** 2026-06-28  

**Context:**  
Business modules need a consistent data access pattern for entities. Options: generic repository class, interface, abstract class, or direct QueryEngine use.

**Decision:**  
`AbstractDataProvider<T>` is an abstract class that injects QueryEngine and provides `getAll`, `getById`, `create`, `update`, `delete`, `search` methods. Business modules extend it.

**Consequences:**  
- Consistent data access API across all entity modules
- QueryEngine handles HTTP + caching transparently
- Each DataProvider subclass specifies its `apiPath` and entity type
- Testable: mock QueryEngine can be injected in tests

---

## ADR-S1-009: IS_DEV Flag for SDK Validation

**Status:** Accepted  
**Date:** 2026-06-28  

**Context:**  
SDK `define*()` functions validate metadata at call time. This validation has runtime cost. In production, metadata is pre-validated by plugin authors.

**Decision:**  
Use `const IS_DEV = !environment.production` (or equivalent) to gate validation in `define*()` functions. In production builds, validation is skipped and the object is returned frozen immediately.

**Consequences:**  
- Zero validation overhead in production bundles
- Full validation feedback during development
- Tree-shaking removes validator code in production (when using build optimization)

---

## ADR-S1-010: EventBus Maximum Log Size (500 events)

**Status:** Accepted  
**Date:** 2026-06-28  

**Context:**  
EventBus maintains an in-memory event log for debugging. Unbounded growth would cause memory issues in long-running sessions.

**Decision:**  
Cap event log at 500 entries. When exceeded, oldest events are dropped (FIFO eviction).

**Consequences:**  
- Bounded memory usage (~50KB for 500 events)
- Last 500 events are always available for diagnostics
- Not suitable as a persistent audit log (that's a separate business concern)
