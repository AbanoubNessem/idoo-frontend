import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MetadataDiagnosticsService } from '../metadata-diagnostics.service';
import { MetadataLifecycleService } from '../metadata-lifecycle.service';
import { MetadataCacheService } from '../metadata-cache.service';
import { MetadataStatisticsService } from '../metadata-statistics.service';
import { MetadataEntry, MetadataType } from '../metadata.types';
import { buildMetadataIndex, buildMetadataStats, createMetadataSnapshot } from '../metadata-snapshot';

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

describe('MetadataDiagnosticsService', () => {
  let service: MetadataDiagnosticsService;
  let lifecycle: MetadataLifecycleService;
  let cache: MetadataCacheService;
  let statistics: MetadataStatisticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataDiagnosticsService);
    lifecycle = TestBed.inject(MetadataLifecycleService);
    cache = TestBed.inject(MetadataCacheService);
    statistics = TestBed.inject(MetadataStatisticsService);
  });

  it('should report uninitialized state with no snapshot', () => {
    const report = service.generate();
    expect(report.engineState).toBe('uninitialized');
    expect(report.snapshotId).toBeNull();
    expect(report.totalEntries).toBe(0);
    expect(report.statistics).toBeNull();
  });

  it('should include engine state in report', () => {
    lifecycle.transition('loading');
    lifecycle.transition('validating');
    const report = service.generate();
    expect(report.engineState).toBe('validating');
  });

  it('should include snapshot id when snapshot present', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:e1', makeEntry('entity', 'e1')],
    ]);
    const index = buildMetadataIndex(entries);
    const stats = buildMetadataStats(entries, [], {});
    const snap = createMetadataSnapshot(entries, index, stats, [], []);
    statistics.compute(entries, [], {});
    cache.store(snap);

    const report = service.generate();
    expect(report.snapshotId).toBe(snap.id);
    expect(report.totalEntries).toBe(1);
  });

  it('should count invalid entries', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:e1', makeEntry('entity', 'e1', true)],
      ['entity:e2', makeEntry('entity', 'e2', false)],
    ]);
    const index = buildMetadataIndex(entries);
    const stats = buildMetadataStats(entries, [], {});
    cache.store(createMetadataSnapshot(entries, index, stats, [], []));
    statistics.compute(entries, [], {});

    const report = service.generate();
    expect(report.invalidEntries).toBe(1);
    expect(report.validEntries).toBe(1);
  });

  it('should count unresolved entries', () => {
    const entries = new Map<string, MetadataEntry>([
      ['route:e1', makeEntry('route', 'e1', true, false)],
    ]);
    const index = buildMetadataIndex(entries);
    const stats = buildMetadataStats(entries, [], {});
    cache.store(createMetadataSnapshot(entries, index, stats, [], []));
    statistics.compute(entries, [], {});

    const report = service.generate();
    expect(report.unresolvedEntries).toBe(1);
  });

  it('isHealthy should return false when in error state', () => {
    lifecycle.transition('loading');
    lifecycle.transition('error', 'crash');
    expect(service.isHealthy()).toBe(false);
  });

  it('isHealthy should return true when ready with no errors', () => {
    const entries = new Map<string, MetadataEntry>([
      ['entity:e1', makeEntry('entity', 'e1', true, true)],
    ]);
    const index = buildMetadataIndex(entries);
    const stats = buildMetadataStats(entries, [], {});
    cache.store(createMetadataSnapshot(entries, index, stats, [], []));
    statistics.compute(entries, [], {});

    lifecycle.transition('loading');
    lifecycle.transition('validating');
    lifecycle.transition('resolving');
    lifecycle.transition('indexing');
    lifecycle.transition('ready');

    expect(service.isHealthy()).toBe(true);
  });

  it('summarize should return a readable string', () => {
    const summary = service.summarize();
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
    expect(summary).toContain('State:');
  });

  it('should include snapshotAgeMs when snapshot exists', () => {
    const entries = new Map<string, MetadataEntry>();
    const index = buildMetadataIndex(entries);
    const stats = buildMetadataStats(entries, [], {});
    cache.store(createMetadataSnapshot(entries, index, stats, [], []));

    const report = service.generate();
    expect(report.snapshotAgeMs).not.toBeNull();
    expect(report.snapshotAgeMs!).toBeGreaterThanOrEqual(0);
  });

  it('should include statistics from StatisticsService.getLast()', () => {
    statistics.compute(new Map(), [], { load: 5 });
    const report = service.generate();
    expect(report.statistics).not.toBeNull();
    expect(report.statistics!.loadDurationMs).toBe(5);
  });
});
