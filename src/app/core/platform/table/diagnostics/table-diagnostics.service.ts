import { computed, inject, Injectable, signal } from '@angular/core';
import { TABLE_MAX_DIAG_EVENTS_TOKEN } from '../table.tokens';
import {
  TableDiagEvent,
  TableDiagEventType,
  TableDiagnosticsReport,
} from '../table.types';

let _counter = 0;

@Injectable({ providedIn: 'root' })
export class TableDiagnosticsService {
  private readonly _maxEvents = inject(TABLE_MAX_DIAG_EVENTS_TOKEN);
  private readonly _events    = signal<TableDiagEvent[]>([]);
  private readonly _enabled   = signal(false);

  readonly enabled      = this._enabled.asReadonly();
  readonly eventCount   = computed(() => this._events().length);
  readonly latestErrors = computed(() =>
    this._events().filter(e => e.type === 'error').slice(-10),
  );

  enable(): void  { this._enabled.set(true); }
  disable(): void { this._enabled.set(false); this._events.set([]); }

  record(event: Omit<TableDiagEvent, 'id' | 'timestamp'>): void {
    if (!this._enabled()) return;
    const full: TableDiagEvent = {
      ...event,
      id:        `td-${++_counter}`,
      timestamp: new Date().toISOString(),
    };
    this._events.update(list => {
      const next = [...list, full];
      return next.length > this._maxEvents ? next.slice(next.length - this._maxEvents) : next;
    });
  }

  recordRegister(tableId: string, layer?: string): void {
    this.record({ type: 'register', tableId, message: `Table "${tableId}" registered${layer ? ` (${layer})` : ''}.` });
  }

  recordResolve(tableId: string, durationMs: number): void {
    this.record({ type: 'resolve', tableId, message: `Table "${tableId}" resolved.`, durationMs });
  }

  recordRemove(tableId: string): void {
    this.record({ type: 'remove', tableId, message: `Table "${tableId}" removed.` });
  }

  recordValidate(tableId: string, valid: boolean, errorCount: number): void {
    this.record({
      type:    'validate',
      tableId,
      message: `Table "${tableId}" validation ${valid ? 'passed' : `failed (${errorCount} error(s))`}.`,
    });
  }

  recordSerialize(tableId: string, durationMs: number): void {
    this.record({ type: 'serialize', tableId, message: `Table "${tableId}" serialized.`, durationMs });
  }

  recordError(tableId: string, message: string, metadata?: Record<string, unknown>): void {
    this.record({ type: 'error', tableId, message, metadata });
  }

  recordLifecycle(tableId: string, phase: string): void {
    this.record({ type: 'lifecycle', tableId, message: `Table "${tableId}" → ${phase}.` });
  }

  generateReport(tableId: string): TableDiagnosticsReport {
    const events = this._events().filter(e => e.tableId === tableId);
    return {
      tableId,
      generatedAt: new Date().toISOString(),
      totalEvents: events.length,
      errorCount:  events.filter(e => e.type === 'error').length,
      events,
    };
  }

  forTable(tableId: string): TableDiagEvent[] {
    return this._events().filter(e => e.tableId === tableId);
  }

  clearTable(tableId: string): void {
    this._events.update(list => list.filter(e => e.tableId !== tableId));
  }

  clearAll(): void {
    this._events.set([]);
  }
}
