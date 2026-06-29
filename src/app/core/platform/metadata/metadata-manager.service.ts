import { Injectable, inject, computed, Signal } from '@angular/core';
import {
  MetadataEntry,
  MetadataSnapshot,
  MetadataType,
  MetadataValidationError,
} from './metadata.types';
import { MetadataCacheService } from './metadata-cache.service';
import { MetadataIndexerService } from './metadata-indexer.service';

@Injectable({ providedIn: 'root' })
export class MetadataManagerService {
  private readonly cache = inject(MetadataCacheService);
  private readonly indexer = inject(MetadataIndexerService);

  // ─── Snapshot access ─────────────────────────────────────────────────────────

  getSnapshot(): MetadataSnapshot | null {
    return this.cache.get();
  }

  // ─── Entry queries ────────────────────────────────────────────────────────────

  getById(id: string): MetadataEntry | undefined {
    const snapshot = this.cache.get();
    if (!snapshot) return undefined;
    return snapshot.index.byId.get(id);
  }

  getByType(type: MetadataType): ReadonlyArray<MetadataEntry> {
    const snapshot = this.cache.get();
    if (!snapshot) return [];
    return snapshot.index.byType.get(type) ?? [];
  }

  getByPlugin(pluginId: string): ReadonlyArray<MetadataEntry> {
    const snapshot = this.cache.get();
    if (!snapshot) return [];
    return snapshot.index.byPlugin.get(pluginId) ?? [];
  }

  findByDefinition<T>(
    type: MetadataType,
    predicate: (def: T) => boolean,
  ): MetadataEntry<T>[] {
    return (this.getByType(type) as MetadataEntry<T>[]).filter(e => predicate(e.definition));
  }

  // ─── Relation queries ─────────────────────────────────────────────────────────

  getFormsForEntity(entityId: string): ReadonlyArray<string> {
    const snapshot = this.cache.get();
    if (!snapshot) return [];
    return this.indexer.getFormsForEntity(snapshot.index, entityId);
  }

  getTablesForEntity(entityId: string): ReadonlyArray<string> {
    const snapshot = this.cache.get();
    if (!snapshot) return [];
    return this.indexer.getTablesForEntity(snapshot.index, entityId);
  }

  getWorkflowsForEntity(entityId: string): ReadonlyArray<string> {
    const snapshot = this.cache.get();
    if (!snapshot) return [];
    return this.indexer.getWorkflowsForEntity(snapshot.index, entityId);
  }

  getActionsForEntity(entityId: string): ReadonlyArray<string> {
    const snapshot = this.cache.get();
    if (!snapshot) return [];
    return this.indexer.getActionsForEntity(snapshot.index, entityId);
  }

  getRoutesForEntity(entityId: string): ReadonlyArray<string> {
    const snapshot = this.cache.get();
    if (!snapshot) return [];
    return this.indexer.getRoutesForEntity(snapshot.index, entityId);
  }

  // ─── Permission queries ───────────────────────────────────────────────────────

  getPermissionByCode(code: string): MetadataEntry | undefined {
    const snapshot = this.cache.get();
    if (!snapshot) return undefined;
    return this.indexer.getPermissionByCode(snapshot.index, code);
  }

  hasPermission(code: string): boolean {
    return this.getPermissionByCode(code) !== undefined;
  }

  // ─── Lookup queries ───────────────────────────────────────────────────────────

  getLookupById(id: string): MetadataEntry | undefined {
    const snapshot = this.cache.get();
    if (!snapshot) return undefined;
    return this.indexer.getLookupById(snapshot.index, id);
  }

  // ─── Menu queries ──────────────────────────────────────────────────────────────

  getRootMenuItems(): ReadonlyArray<string> {
    const snapshot = this.cache.get();
    if (!snapshot) return [];
    return this.indexer.getRootMenuItems(snapshot.index);
  }

  getChildMenuItems(parentId: string): ReadonlyArray<string> {
    const snapshot = this.cache.get();
    if (!snapshot) return [];
    return this.indexer.getChildMenuItems(snapshot.index, parentId);
  }

  // ─── Validation queries ───────────────────────────────────────────────────────

  getAllErrors(): ReadonlyArray<MetadataValidationError> {
    return this.cache.get()?.validationErrors ?? [];
  }

  getErrorsForType(type: MetadataType): MetadataValidationError[] {
    return this.getAllErrors().filter(e => e.type === type) as MetadataValidationError[];
  }

  getErrorsForEntry(id: string): MetadataValidationError[] {
    return this.getAllErrors().filter(e => e.entryId === id) as MetadataValidationError[];
  }

  // ─── Counts ───────────────────────────────────────────────────────────────────

  countByType(): Record<string, number> {
    const snapshot = this.cache.get();
    if (!snapshot) return {};
    return this.indexer.summarize(snapshot.index);
  }

  totalEntries(): number {
    return this.cache.get()?.statistics.totalEntries ?? 0;
  }
}
