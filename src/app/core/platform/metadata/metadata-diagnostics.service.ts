import { Injectable, inject } from '@angular/core';
import { MetadataDiagnosticsReport } from './metadata.types';
import { MetadataLifecycleService } from './metadata-lifecycle.service';
import { MetadataCacheService } from './metadata-cache.service';
import { MetadataStatisticsService } from './metadata-statistics.service';

@Injectable({ providedIn: 'root' })
export class MetadataDiagnosticsService {
  private readonly lifecycle = inject(MetadataLifecycleService);
  private readonly cache = inject(MetadataCacheService);
  private readonly statistics = inject(MetadataStatisticsService);

  generate(): MetadataDiagnosticsReport {
    const snapshot = this.cache.get();
    const stats = this.statistics.getLast();

    const errors = snapshot?.validationErrors.filter(e => e.severity === 'error') ?? [];
    const warnings = snapshot?.warnings ?? [];

    const unresolvedEntries = snapshot
      ? Array.from(snapshot.entries.values()).filter(e => !e.isResolved).length
      : 0;

    const invalidEntries = snapshot
      ? Array.from(snapshot.entries.values()).filter(e => !e.isValid).length
      : 0;

    return {
      engineState: this.lifecycle.state(),
      snapshotId: snapshot?.id ?? null,
      snapshotAgeMs: this.cache.getAgeMs(),
      totalEntries: snapshot?.statistics.totalEntries ?? 0,
      validEntries: (snapshot?.statistics.totalEntries ?? 0) - invalidEntries,
      invalidEntries,
      unresolvedEntries,
      conflictCount: stats?.conflictCount ?? 0,
      errors: [...errors],
      warnings: [...warnings],
      statistics: stats,
      generatedAt: new Date().toISOString(),
    };
  }

  isHealthy(): boolean {
    const report = this.generate();
    return (
      report.engineState === 'ready' &&
      report.invalidEntries === 0 &&
      report.errors.length === 0
    );
  }

  summarize(): string {
    const r = this.generate();
    return [
      `State: ${r.engineState}`,
      `Entries: ${r.totalEntries} (${r.invalidEntries} invalid, ${r.unresolvedEntries} unresolved)`,
      `Errors: ${r.errors.length} | Warnings: ${r.warnings.length}`,
      r.snapshotAgeMs !== null ? `Snapshot age: ${Math.round(r.snapshotAgeMs / 1000)}s` : 'No snapshot',
    ].join(' | ');
  }
}
