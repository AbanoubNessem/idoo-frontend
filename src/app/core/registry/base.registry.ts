import { signal, computed } from '@angular/core';
import {
  BaseRegistryAPI,
  MergeStrategy,
  RegistryDiagnosticsReport,
  RegistryEntry,
  RegistryEntryStatus,
  RegistryEvent,
  RegistryQuery,
  RegistryStatus,
} from './registry.types';

function buildChecksum(id: string, version: string, pluginId: string): string {
  const data = `${id}:${version}:${pluginId}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export abstract class BaseRegistry<TDef> implements BaseRegistryAPI<TDef> {
  abstract readonly name: string;
  abstract readonly mergeStrategy: MergeStrategy;

  protected readonly _entries = new Map<string, RegistryEntry<TDef>>();
  protected readonly _status = signal<RegistryStatus>('initializing');
  protected readonly _eventLog: RegistryEvent[] = [];

  readonly status = computed(() => this._status());

  register(
    id: string,
    definition: TDef,
    pluginId: string,
    version = '1.0.0',
  ): RegistryEntry<TDef> {
    const normalizedId = this.normalizeId(id);
    const existing = this._entries.get(normalizedId);
    const validationErrors = this.validate(normalizedId, definition);
    const status: RegistryEntryStatus = validationErrors.length > 0 ? 'invalid' : 'registered';

    let finalDef = definition;

    if (existing && validationErrors.length === 0) {
      finalDef = this.merge(existing.definition, definition);
    }

    const entry: RegistryEntry<TDef> = {
      id: normalizedId,
      version,
      sourcePluginId: pluginId,
      overriddenBy: existing ? pluginId : null,
      dependencies: this.extractDependencies(definition),
      capabilities: this.extractCapabilities(definition),
      definition: finalDef,
      rawDefinition: definition,
      checksum: buildChecksum(normalizedId, version, pluginId),
      registeredAt: new Date().toISOString(),
      publishedAt: null,
      status,
      validationErrors,
      metadata: {},
    };

    this._entries.set(normalizedId, entry);

    this.emitEvent({
      type: existing ? 'registry:entry:overridden' : 'registry:entry:registered',
      registryName: this.name,
      entryId: normalizedId,
      sourcePluginId: pluginId,
      timestamp: entry.registeredAt,
    });

    return entry;
  }

  getById(id: string): RegistryEntry<TDef> | undefined {
    return this._entries.get(this.normalizeId(id));
  }

  getAll(): RegistryEntry<TDef>[] {
    return Array.from(this._entries.values());
  }

  query(q: RegistryQuery<TDef>): RegistryEntry<TDef>[] {
    let results = Array.from(this._entries.values());

    if (q.pluginId) {
      results = results.filter(e => e.sourcePluginId === q.pluginId);
    }
    if (q.status) {
      results = results.filter(e => e.status === q.status);
    }
    if (q.capabilities?.length) {
      results = results.filter(e =>
        q.capabilities!.every(cap => e.capabilities.includes(cap))
      );
    }
    if (q.predicate) {
      results = results.filter(q.predicate);
    }

    return results;
  }

  has(id: string): boolean {
    return this._entries.has(this.normalizeId(id));
  }

  remove(id: string, requestingPluginId: string): boolean {
    const normalized = this.normalizeId(id);
    const entry = this._entries.get(normalized);
    if (!entry) return false;
    if (entry.sourcePluginId !== requestingPluginId) return false;

    this._entries.delete(normalized);
    this.emitEvent({
      type: 'registry:entry:removed',
      registryName: this.name,
      entryId: normalized,
      sourcePluginId: requestingPluginId,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  publish(): void {
    this._status.set('publishing');
    const now = new Date().toISOString();

    for (const [id, entry] of this._entries.entries()) {
      if (entry.status === 'registered') {
        this._entries.set(id, {
          ...entry,
          publishedAt: now,
          status: 'registered',
        });
      }
    }

    const hasInvalid = Array.from(this._entries.values()).some(
      e => e.status === 'invalid'
    );

    this._status.set(hasInvalid ? 'degraded' : 'published');

    this.emitEvent({
      type: 'registry:published',
      registryName: this.name,
      entryId: '*',
      sourcePluginId: 'platform',
      timestamp: now,
    });
  }

  getDiagnostics(): RegistryDiagnosticsReport {
    const entries = Array.from(this._entries.values());
    return {
      registryName: this.name,
      totalEntries: entries.length,
      publishedEntries: entries.filter(e => e.publishedAt !== null).length,
      invalidEntries: entries.filter(e => e.status === 'invalid').length,
      overriddenEntries: entries.filter(e => e.overriddenBy !== null).length,
      issues: [],
      generatedAt: new Date().toISOString(),
    };
  }

  clear(): void {
    this._entries.clear();
    this._status.set('initializing');
    this._eventLog.length = 0;
  }

  getEvents(): RegistryEvent[] {
    return [...this._eventLog];
  }

  // ─── Overridable ──────────────────────────────────────────────────────────

  protected validate(_id: string, _def: TDef): string[] {
    return [];
  }

  protected merge(existing: TDef, incoming: TDef): TDef {
    switch (this.mergeStrategy) {
      case 'REPLACE':
        return incoming;
      case 'NO_OVERRIDE':
        return existing;
      case 'SHALLOW':
        return { ...(existing as object), ...(incoming as object) } as TDef;
      case 'DEEP':
        return this.deepMerge(existing, incoming);
      case 'ADDITIVE':
        return this.additiveMerge(existing, incoming);
    }
  }

  protected extractDependencies(_def: TDef): string[] {
    return [];
  }

  protected extractCapabilities(_def: TDef): string[] {
    return [];
  }

  private normalizeId(id: string): string {
    return id.toLowerCase().trim();
  }

  private emitEvent(event: RegistryEvent): void {
    this._eventLog.push(event);
  }

  private deepMerge(target: unknown, source: unknown): TDef {
    if (Array.isArray(target) && Array.isArray(source)) {
      return [...target, ...source] as TDef;
    }
    if (typeof target === 'object' && target !== null && typeof source === 'object' && source !== null) {
      const result = { ...target } as Record<string, unknown>;
      for (const key of Object.keys(source as object)) {
        const sv = (source as Record<string, unknown>)[key];
        const tv = (target as Record<string, unknown>)[key];
        result[key] = tv !== undefined ? this.deepMerge(tv, sv) : sv;
      }
      return result as TDef;
    }
    return source as TDef;
  }

  private additiveMerge(existing: TDef, incoming: TDef): TDef {
    if (Array.isArray(existing) && Array.isArray(incoming)) {
      return [...existing, ...incoming] as TDef;
    }
    return incoming;
  }
}
