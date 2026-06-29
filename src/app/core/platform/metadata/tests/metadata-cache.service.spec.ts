import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MetadataCacheService } from '../metadata-cache.service';
import { MetadataSnapshot } from '../metadata.types';

function makeSnapshot(id = 'snap-1'): MetadataSnapshot {
  return {
    id,
    createdAt: new Date().toISOString(),
    entries: new Map(),
    index: {
      byId: new Map(),
      byType: new Map(),
      byPlugin: new Map(),
      entityToForms: new Map(),
      entityToTables: new Map(),
      entityToWorkflows: new Map(),
      entityToActions: new Map(),
      entityToRoutes: new Map(),
      permissionsByCode: new Map(),
      lookupById: new Map(),
      menuByParent: new Map(),
    },
    statistics: {
      totalEntries: 0,
      byType: {} as never,
      validEntries: 0,
      invalidEntries: 0,
      resolvedEntries: 0,
      unresolvedEntries: 0,
      conflictCount: 0,
      loadDurationMs: 0,
      validationDurationMs: 0,
      resolutionDurationMs: 0,
      indexingDurationMs: 0,
      totalPipelineDurationMs: 0,
      generatedAt: new Date().toISOString(),
    },
    validationErrors: [],
    warnings: [],
  };
}

describe('MetadataCacheService', () => {
  let service: MetadataCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataCacheService);
  });

  it('should return null when no snapshot stored', () => {
    expect(service.get()).toBeNull();
    expect(service.hasSnapshot()).toBe(false);
    expect(service.snapshotId()).toBeNull();
  });

  it('should store and retrieve a snapshot', () => {
    const snap = makeSnapshot('s1');
    service.store(snap);

    expect(service.get()).toBe(snap);
    expect(service.hasSnapshot()).toBe(true);
    expect(service.snapshotId()).toBe('s1');
  });

  it('should replace existing snapshot on re-store', () => {
    service.store(makeSnapshot('s1'));
    service.store(makeSnapshot('s2'));

    expect(service.snapshotId()).toBe('s2');
  });

  it('should invalidate the snapshot', () => {
    service.store(makeSnapshot('s1'));
    service.invalidate();

    expect(service.get()).toBeNull();
    expect(service.hasSnapshot()).toBe(false);
  });

  it('should return age in ms after storing', () => {
    service.store(makeSnapshot());
    const age = service.getAgeMs();
    expect(age).not.toBeNull();
    expect(age!).toBeGreaterThanOrEqual(0);
    expect(age!).toBeLessThan(1000);
  });

  it('should return null age when no snapshot', () => {
    expect(service.getAgeMs()).toBeNull();
  });

  it('should track hit/miss stats', () => {
    service.get(); // miss
    service.store(makeSnapshot());
    service.get(); // hit
    service.get(); // hit

    const stats = service.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(2 / 3);
  });

  it('should reset stats', () => {
    service.get();
    service.store(makeSnapshot());
    service.get();
    service.resetStats();

    const stats = service.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.hitRate).toBe(0);
  });

  it('invalidateByPlugin should clear snapshot when plugin has entries', () => {
    const snap = makeSnapshot('s1');
    (snap.index.byPlugin as Map<string, unknown>).set('MY_PLUGIN', []);
    service.store(snap);
    service.invalidateByPlugin('MY_PLUGIN');
    expect(service.get()).toBeNull();
  });

  it('invalidateByPlugin should not clear snapshot when plugin not present', () => {
    service.store(makeSnapshot('s1'));
    service.invalidateByPlugin('UNKNOWN_PLUGIN');
    expect(service.get()).not.toBeNull();
  });

  it('invalidateByType should not clear when type has no entries', () => {
    const snap = makeSnapshot('s1');
    service.store(snap);
    service.invalidateByType('entity');
    expect(service.get()).not.toBeNull();
  });
});
