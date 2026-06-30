import { Injectable, signal, computed, Signal } from '@angular/core';
import { TableStateMetricsSnapshot } from './table-state.types';

interface MutableMetrics {
  updateCount:   number;
  snapshotCount: number;
  restoreCount:  number;
  resetCount:    number;
  disposeCount:  number;
  lastUpdatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class TableStateMetricsService {
  private readonly _store   = new Map<string, MutableMetrics>();
  private readonly _version = signal(0);

  readonly trackedCount: Signal<number> = computed(() => {
    this._version();
    return this._store.size;
  });

  trackUpdate(tableId: string): void {
    const m = this._ensure(tableId);
    m.updateCount++;
    m.lastUpdatedAt = new Date().toISOString();
    this._bump();
  }

  trackSnapshot(tableId: string): void {
    this._ensure(tableId).snapshotCount++;
    this._bump();
  }

  trackRestore(tableId: string): void {
    this._ensure(tableId).restoreCount++;
    this._bump();
  }

  trackReset(tableId: string): void {
    this._ensure(tableId).resetCount++;
    this._bump();
  }

  trackDispose(tableId: string): void {
    this._ensure(tableId).disposeCount++;
    this._bump();
  }

  snapshot(tableId: string): TableStateMetricsSnapshot | null {
    const m = this._store.get(tableId);
    return m ? { tableId, ...m } : null;
  }

  all(): TableStateMetricsSnapshot[] {
    return [...this._store.entries()].map(([tableId, m]) => ({ tableId, ...m }));
  }

  reset(tableId: string): void {
    this._store.delete(tableId);
    this._bump();
  }

  resetAll(): void {
    this._store.clear();
    this._bump();
  }

  private _ensure(tableId: string): MutableMetrics {
    if (!this._store.has(tableId)) {
      this._store.set(tableId, {
        updateCount: 0, snapshotCount: 0, restoreCount: 0,
        resetCount: 0,  disposeCount: 0, lastUpdatedAt: null,
      });
    }
    return this._store.get(tableId)!;
  }

  private _bump(): void { this._version.update(v => v + 1); }
}
