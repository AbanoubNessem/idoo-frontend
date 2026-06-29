import { Injectable } from '@angular/core';
import {
  MetadataConflict,
  MetadataEntry,
  MetadataStats,
  MetadataType,
  ALL_METADATA_TYPES,
} from './metadata.types';
import { buildMetadataStats } from './metadata-snapshot';

@Injectable({ providedIn: 'root' })
export class MetadataStatisticsService {
  private _lastStats: MetadataStats | null = null;

  compute(
    entries: Map<string, MetadataEntry>,
    conflicts: MetadataConflict[],
    timings: Record<string, number>,
  ): MetadataStats {
    const stats = buildMetadataStats(entries, conflicts, timings);
    this._lastStats = stats;
    return stats;
  }

  getLast(): MetadataStats | null {
    return this._lastStats;
  }

  summarize(stats: MetadataStats): string {
    const top = ALL_METADATA_TYPES
      .filter(t => stats.byType[t] > 0)
      .map(t => `${t}:${stats.byType[t]}`)
      .join(', ');

    return [
      `Total: ${stats.totalEntries} entries (${top})`,
      `Valid: ${stats.validEntries} | Invalid: ${stats.invalidEntries}`,
      `Resolved: ${stats.resolvedEntries} | Unresolved: ${stats.unresolvedEntries}`,
      `Pipeline: ${stats.totalPipelineDurationMs}ms`,
    ].join(' | ');
  }

  diffTypes(a: MetadataStats, b: MetadataStats): Partial<Record<MetadataType, number>> {
    const diff: Partial<Record<MetadataType, number>> = {};
    for (const type of ALL_METADATA_TYPES) {
      const delta = (b.byType[type] ?? 0) - (a.byType[type] ?? 0);
      if (delta !== 0) diff[type] = delta;
    }
    return diff;
  }
}
