import { Injectable, Signal, computed, signal } from '@angular/core';

export interface TableInteractionMetricsSnapshot {
  readonly selectionChanges:   number;
  readonly editStarts:         number;
  readonly editCommits:        number;
  readonly editCancels:        number;
  readonly validationFailures: number;
  readonly trackedTables:      number;
  readonly lastActivityAt:     string | null;
}

interface _TableMetricEntry {
  selectionChanges:   number;
  editStarts:         number;
  editCommits:        number;
  editCancels:        number;
  validationFailures: number;
  lastActivityAt:     string | null;
}

@Injectable({ providedIn: 'root' })
export class TableInteractionMetrics {
  private readonly _counters = new Map<string, _TableMetricEntry>();
  private readonly _version  = signal(0);

  readonly trackedCount: Signal<number> = computed(() => {
    this._version();
    return this._counters.size;
  });

  track(tableId: string): void {
    if (!this._counters.has(tableId)) {
      this._counters.set(tableId, {
        selectionChanges:   0,
        editStarts:         0,
        editCommits:        0,
        editCancels:        0,
        validationFailures: 0,
        lastActivityAt:     null,
      });
      this._version.update(v => v + 1);
    }
  }

  recordSelectionChange(tableId: string): void {
    const c = this._ensure(tableId);
    c.selectionChanges++;
    c.lastActivityAt = new Date().toISOString();
    this._version.update(v => v + 1);
  }

  recordEditStart(tableId: string): void {
    const c = this._ensure(tableId);
    c.editStarts++;
    c.lastActivityAt = new Date().toISOString();
    this._version.update(v => v + 1);
  }

  recordEditCommit(tableId: string): void {
    const c = this._ensure(tableId);
    c.editCommits++;
    c.lastActivityAt = new Date().toISOString();
    this._version.update(v => v + 1);
  }

  recordEditCancel(tableId: string): void {
    const c = this._ensure(tableId);
    c.editCancels++;
    c.lastActivityAt = new Date().toISOString();
    this._version.update(v => v + 1);
  }

  recordValidationFailure(tableId: string): void {
    const c = this._ensure(tableId);
    c.validationFailures++;
    c.lastActivityAt = new Date().toISOString();
    this._version.update(v => v + 1);
  }

  getSnapshot(tableId: string): TableInteractionMetricsSnapshot | null {
    const c = this._counters.get(tableId);
    if (!c) return null;
    return Object.freeze({
      selectionChanges:   c.selectionChanges,
      editStarts:         c.editStarts,
      editCommits:        c.editCommits,
      editCancels:        c.editCancels,
      validationFailures: c.validationFailures,
      trackedTables:      this._counters.size,
      lastActivityAt:     c.lastActivityAt,
    });
  }

  dispose(tableId: string): void {
    this._counters.delete(tableId);
    this._version.update(v => v + 1);
  }

  private _ensure(tableId: string): _TableMetricEntry {
    if (!this._counters.has(tableId)) this.track(tableId);
    return this._counters.get(tableId)!;
  }
}
