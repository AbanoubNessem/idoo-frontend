import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MetadataStatisticsService } from '../metadata-statistics.service';
import { MetadataEntry, MetadataConflict, MetadataType } from '../metadata.types';

function makeEntry(type: MetadataType, id: string, isValid = true, isResolved = true): MetadataEntry {
  return {
    id,
    type,
    sourcePluginId: 'plugin',
    version: '1.0.0',
    definition: {},
    resolvedAt: isResolved ? new Date().toISOString() : null,
    validationErrors: [],
    isResolved,
    isValid,
    overriddenBy: null,
    checksum: 'abc',
  };
}

describe('MetadataStatisticsService', () => {
  let service: MetadataStatisticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataStatisticsService);
  });

  it('should return null for getLast() initially', () => {
    expect(service.getLast()).toBeNull();
  });

  it('should compute stats from entries', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:e1', makeEntry('entity', 'e1', true, true)],
      ['entity:e2', makeEntry('entity', 'e2', false, false)],
      ['form:f1', makeEntry('form', 'f1', true, true)],
    ]);
    const stats = service.compute(entries, [], { load: 10, validate: 5, resolve: 3, index: 2 });

    expect(stats.totalEntries).toBe(3);
    expect(stats.byType['entity']).toBe(2);
    expect(stats.byType['form']).toBe(1);
    expect(stats.validEntries).toBe(2);
    expect(stats.invalidEntries).toBe(1);
    expect(stats.resolvedEntries).toBe(2);
    expect(stats.unresolvedEntries).toBe(1);
  });

  it('should record timing sums in totalPipelineDurationMs', () => {
    const stats = service.compute(new Map(), [], { load: 10, validate: 20, resolve: 15, index: 5 });
    expect(stats.loadDurationMs).toBe(10);
    expect(stats.validationDurationMs).toBe(20);
    expect(stats.resolutionDurationMs).toBe(15);
    expect(stats.indexingDurationMs).toBe(5);
    expect(stats.totalPipelineDurationMs).toBe(50);
  });

  it('should count conflicts', () => {
    const conflicts: MetadataConflict[] = [
      { id: 'x', type: 'entity', existingPluginId: 'a', incomingPluginId: 'b', conflictType: 'duplicate-id', resolution: 'incoming-wins' },
    ];
    const stats = service.compute(new Map(), conflicts, {});
    expect(stats.conflictCount).toBe(1);
  });

  it('should cache last computed stats', () => {
    service.compute(new Map(), [], {});
    expect(service.getLast()).not.toBeNull();
  });

  it('should produce a readable summary string', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:e1', makeEntry('entity', 'e1')],
    ]);
    const stats = service.compute(entries, [], { load: 5, validate: 3, resolve: 2, index: 1 });
    const summary = service.summarize(stats);
    expect(summary).toContain('entity:1');
    expect(summary).toContain('Total:');
  });

  it('should compute type diff between two snapshots', () => {
    const a = service.compute(
      new Map([['entity:e1', makeEntry('entity', 'e1')]]),
      [], {}
    );
    const b = service.compute(
      new Map([
        ['entity:e1', makeEntry('entity', 'e1')],
        ['entity:e2', makeEntry('entity', 'e2')],
        ['form:f1', makeEntry('form', 'f1')],
      ]),
      [], {}
    );
    const diff = service.diffTypes(a, b);
    expect(diff['entity']).toBe(1);
    expect(diff['form']).toBe(1);
    expect(diff['workflow']).toBeUndefined();
  });

  it('should include generatedAt timestamp', () => {
    const stats = service.compute(new Map(), [], {});
    expect(stats.generatedAt).toBeTruthy();
    expect(new Date(stats.generatedAt).getTime()).toBeGreaterThan(0);
  });
});
