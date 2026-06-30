import { computed, Injectable, signal } from '@angular/core';
import { TableMetricsSnapshot } from '../table.types';

interface MutableMetrics {
  tableId:            string;
  registrationCount:  number;
  resolveCount:       number;
  totalResolveDurMs:  number;
  errorCount:         number;
  lastActivityAt:     string;
}

@Injectable({ providedIn: 'root' })
export class TableMetricsService {
  private readonly _data    = new Map<string, MutableMetrics>();
  private readonly _version = signal(0);

  readonly trackedCount = computed(() => {
    this._version();
    return this._data.size;
  });

  trackRegistration(tableId: string): void {
    const m = this._getOrCreate(tableId);
    m.registrationCount++;
    m.lastActivityAt = new Date().toISOString();
    this._bump();
  }

  trackResolve(tableId: string, durationMs: number): void {
    const m = this._getOrCreate(tableId);
    m.resolveCount++;
    m.totalResolveDurMs += durationMs;
    m.lastActivityAt = new Date().toISOString();
    this._bump();
  }

  trackError(tableId: string): void {
    const m = this._getOrCreate(tableId);
    m.errorCount++;
    m.lastActivityAt = new Date().toISOString();
    this._bump();
  }

  snapshot(tableId: string): TableMetricsSnapshot | null {
    const m = this._data.get(tableId);
    if (!m) return null;
    return this._toSnapshot(m);
  }

  all(): TableMetricsSnapshot[] {
    return Array.from(this._data.values()).map(m => this._toSnapshot(m));
  }

  reset(tableId: string): void {
    if (this._data.delete(tableId)) this._bump();
  }

  resetAll(): void {
    this._data.clear();
    this._bump();
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private _getOrCreate(tableId: string): MutableMetrics {
    if (!this._data.has(tableId)) {
      this._data.set(tableId, {
        tableId,
        registrationCount:  0,
        resolveCount:       0,
        totalResolveDurMs:  0,
        errorCount:         0,
        lastActivityAt:     new Date().toISOString(),
      });
    }
    return this._data.get(tableId)!;
  }

  private _toSnapshot(m: MutableMetrics): TableMetricsSnapshot {
    return {
      tableId:              m.tableId,
      registrationCount:    m.registrationCount,
      resolveCount:         m.resolveCount,
      avgResolveDurationMs: m.resolveCount > 0
        ? Math.round((m.totalResolveDurMs / m.resolveCount) * 100) / 100
        : 0,
      errorCount:        m.errorCount,
      lastActivityAt:    m.lastActivityAt,
    };
  }

  private _bump(): void {
    this._version.update(v => v + 1);
  }
}
