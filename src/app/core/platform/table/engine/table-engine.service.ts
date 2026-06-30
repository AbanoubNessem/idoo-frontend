import { computed, inject, Injectable, signal } from '@angular/core';
import { TableDiagnosticsService } from '../diagnostics/table-diagnostics.service';
import { TableMetricsService } from '../metrics/table-metrics.service';
import { TableMetadataRegistryService } from '../registry/table-metadata-registry.service';
import { TableRegistryService } from '../registry/table-registry.service';
import { TableResolverService } from '../resolver/table-resolver.service';
import { TableSerializerService } from '../serializer/table-serializer.service';
import { TableValidatorService } from '../validator/table-validator.service';
import {
  ResolvedTableDefinition,
  TableDefinition,
  TableEvent,
  TableEventType,
  TableLayerOverride,
  TableRegistrationOptions,
  TableRegistryLayer,
  TableSerializationOptions,
  TableValidationResult,
} from '../table.types';

type EventHandler<T = unknown> = (event: TableEvent<T>) => void;
type Unsubscribe = () => void;

// ─── TableEngine ──────────────────────────────────────────────────────────────
// Main facade for the Dynamic Table sub-system.
// Orchestrates: registry, metadata-registry, resolver, validator, serializer,
//               diagnostics, metrics, and events.

@Injectable({ providedIn: 'root' })
export class TableEngine {
  private readonly registry         = inject(TableRegistryService);
  private readonly metadataRegistry = inject(TableMetadataRegistryService);
  private readonly resolver         = inject(TableResolverService);
  private readonly validator        = inject(TableValidatorService);
  private readonly serializer       = inject(TableSerializerService);
  private readonly diag             = inject(TableDiagnosticsService);
  private readonly metrics          = inject(TableMetricsService);

  private readonly _resolvedCache = signal<Map<string, ResolvedTableDefinition>>(new Map());
  private readonly _handlers      = new Map<string, Set<EventHandler>>();

  readonly cachedCount   = computed(() => this._resolvedCache().size);
  readonly registryCount = this.registry.registeredCount;

  // ─── Service Facades ──────────────────────────────────────────────────────

  get Registry():         TableRegistryService         { return this.registry; }
  get MetadataRegistry(): TableMetadataRegistryService { return this.metadataRegistry; }
  get Resolver():         TableResolverService         { return this.resolver; }
  get Validator():        TableValidatorService        { return this.validator; }
  get Serializer():       TableSerializerService       { return this.serializer; }
  get Diagnostics():      TableDiagnosticsService      { return this.diag; }
  get Metrics():          TableMetricsService          { return this.metrics; }

  // ─── Registration ─────────────────────────────────────────────────────────

  register(definition: TableDefinition, options: TableRegistrationOptions = {}): void {
    const result = this.validator.validate(definition);
    if (!result.valid) {
      const msg = result.errors.map(e => e.message).join('; ');
      throw new Error(`[TableEngine] Table "${definition.id}" failed validation: ${msg}`);
    }
    this.registry.register(definition, options);
    this.metrics.trackRegistration(definition.id);
    this.diag.recordRegister(definition.id, options.layer);
    this._emit('TableRegistered', definition.id, options.layer);
  }

  registerLazy(
    id: string,
    factory: () => Promise<TableDefinition>,
    options: TableRegistrationOptions = {},
  ): void {
    this.registry.registerLazy(id, factory, options);
    this.metrics.trackRegistration(id);
    this.diag.recordRegister(id, options.layer);
  }

  remove(id: string): void {
    this._resolvedCache.update(m => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
    this.registry.remove(id);
    this.metadataRegistry.clearForTable(id);
    this.diag.recordRemove(id);
    this._emit('TableRemoved', id);
  }

  // ─── Overrides ────────────────────────────────────────────────────────────

  applyOverride(
    tableId: string,
    layer: TableRegistryLayer,
    patch: TableLayerOverride['patch'],
  ): void {
    this.metadataRegistry.applyOverride(tableId, layer, patch);
    this._invalidateCache(tableId);
    this.diag.recordLifecycle(tableId, `override:${layer}`);
    this._emit('TableMetadataChanged', tableId, layer);
  }

  removeOverride(tableId: string, layer: TableRegistryLayer): void {
    this.metadataRegistry.removeOverride(tableId, layer);
    this._invalidateCache(tableId);
    this._emit('TableMetadataChanged', tableId, layer);
  }

  // ─── Resolution ───────────────────────────────────────────────────────────

  async resolve(tableId: string, useCache = true): Promise<ResolvedTableDefinition | null> {
    if (useCache) {
      const cached = this._resolvedCache().get(tableId);
      if (cached) return cached;
    }

    const start = performance.now();
    const resolved = await this.resolver.resolve(tableId);
    const durationMs = performance.now() - start;

    if (resolved) {
      this._resolvedCache.update(m => {
        const next = new Map(m);
        next.set(tableId, resolved);
        return next;
      });
      this.metrics.trackResolve(tableId, durationMs);
      this.diag.recordResolve(tableId, durationMs);
      this._emit('TableResolved', tableId);
    }

    return resolved;
  }

  resolveSync(definition: TableDefinition): ResolvedTableDefinition {
    return this.resolver.resolveSync(definition);
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  validate(definition: TableDefinition): TableValidationResult {
    const result = this.validator.validate(definition);
    this.diag.recordValidate(definition.id, result.valid, result.errors.length);
    return result;
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  serialize(definition: TableDefinition, options?: TableSerializationOptions): string {
    const start = performance.now();
    const json  = this.serializer.serialize(definition, options);
    this.diag.recordSerialize(definition.id, performance.now() - start);
    return json;
  }

  deserialize(json: string): TableDefinition {
    return this.serializer.deserialize(json);
  }

  // ─── Cache ────────────────────────────────────────────────────────────────

  invalidateCache(tableId?: string): void {
    if (tableId) {
      this._invalidateCache(tableId);
    } else {
      this._resolvedCache.set(new Map());
    }
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  on<T = unknown>(
    tableId: string | '*',
    type: TableEventType | '*',
    handler: EventHandler<T>,
  ): Unsubscribe {
    const key = `${tableId}::${type}`;
    if (!this._handlers.has(key)) this._handlers.set(key, new Set());
    this._handlers.get(key)!.add(handler as EventHandler);
    return () => this._handlers.get(key)?.delete(handler as EventHandler);
  }

  // ─── Diagnostics Shortcuts ────────────────────────────────────────────────

  enableDiagnostics(): void  { this.diag.enable(); }
  disableDiagnostics(): void { this.diag.disable(); }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private _emit(type: TableEventType, tableId: string, layer?: TableRegistryLayer): void {
    const event: TableEvent = { type, tableId, timestamp: new Date().toISOString(), layer };

    const keys = [
      `${tableId}::${type}`,
      `${tableId}::*`,
      `*::${type}`,
      `*::*`,
    ];

    for (const key of keys) {
      this._handlers.get(key)?.forEach(h => h(event));
    }
  }

  private _invalidateCache(tableId: string): void {
    this._resolvedCache.update(m => {
      if (!m.has(tableId)) return m;
      const next = new Map(m);
      next.delete(tableId);
      return next;
    });
  }
}
