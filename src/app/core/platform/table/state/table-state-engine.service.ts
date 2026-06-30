import { Injectable, inject } from '@angular/core';
import { TableStateStore } from './table-state-store';
import { TableStateContext } from './table-state-context';
import { TableStateHistory } from './table-state-history';
import { TableStateValidatorService } from './table-state-validator.service';
import { TableStateSerializerService } from './table-state-serializer.service';
import { TableStateMetricsService } from './table-state-metrics.service';
import {
  TableState,
  TableStateUpdate,
  TableStateSnapshot,
  TableStateValidationResult,
  TableStateMetricsSnapshot,
  TableStateEvent,
  TableStateEventType,
  TableStateEventHandler,
} from './table-state.types';
import { TABLE_STATE_MAX_HISTORY_DEPTH } from './table-state.constants';

type HandlerMap = Map<TableStateEventType | '*', Set<TableStateEventHandler>>;

/**
 * Central facade for the Table State Engine.
 * Manages store lifecycle, state operations, events, and integration hooks.
 */
@Injectable({ providedIn: 'root' })
export class TableStateEngine {
  private readonly _validator  = inject(TableStateValidatorService);
  private readonly _serializer = inject(TableStateSerializerService);
  private readonly _metrics    = inject(TableStateMetricsService);

  private readonly _stores   = new Map<string, TableStateStore>();
  private readonly _handlers = new Map<string, HandlerMap>();

  // ─── Factory Methods ──────────────────────────────────────────────────────

  /** Create and register a signal store for a table. */
  createStore(tableId: string, initial?: TableStateUpdate): TableStateStore {
    const store = new TableStateStore(tableId, initial);
    this._stores.set(tableId, store);
    return store;
  }

  /** Wrap a store in a context that exposes computed helpers. */
  createContext(store: TableStateStore): TableStateContext {
    return new TableStateContext(store);
  }

  /** Create a history tracker for undo/redo architecture. */
  createHistory(maxDepth = TABLE_STATE_MAX_HISTORY_DEPTH): TableStateHistory {
    return new TableStateHistory(maxDepth);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Initialize a store with optional initial state.
   * Emits StateInitialized.
   */
  initialize(store: TableStateStore, initial?: TableStateUpdate): void {
    if (initial) store.update(initial);
    this._emit(store, 'StateInitialized');
  }

  /**
   * Reset a store to platform defaults.
   * Emits StateReset.
   */
  reset(store: TableStateStore): void {
    store.reset();
    this._metrics.trackReset(store.tableId);
    this._emit(store, 'StateReset');
  }

  /**
   * Dispose a store — removes it from the registry, emits StateDisposed.
   */
  dispose(store: TableStateStore): void {
    this._metrics.trackDispose(store.tableId);
    this._emit(store, 'StateDisposed');
    this._stores.delete(store.tableId);
    this._handlers.delete(store.tableId);
  }

  // ─── State Operations ─────────────────────────────────────────────────────

  /**
   * Apply a partial update to a store's signals.
   * Emits StateChanged.
   */
  update(store: TableStateStore, changes: TableStateUpdate): void {
    store.update(changes);
    this._metrics.trackUpdate(store.tableId);
    this._emit(store, 'StateChanged');
  }

  /**
   * Capture an immutable snapshot of the current state.
   */
  snapshot(store: TableStateStore): TableStateSnapshot {
    const snap = this._serializer.createSnapshot(store.tableId, store.snapshot());
    this._metrics.trackSnapshot(store.tableId);
    return snap;
  }

  /**
   * Restore a store's signals from a previously captured snapshot.
   * Emits StateChanged.
   */
  restore(store: TableStateStore, snap: TableStateSnapshot): void {
    store.restore(snap.state);
    this._metrics.trackRestore(store.tableId);
    this._emit(store, 'StateChanged');
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  validate(state: TableState | TableStateUpdate): TableStateValidationResult {
    return this._validator.validate(state);
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  serialize(snap: TableStateSnapshot): string {
    return this._serializer.serialize(snap);
  }

  deserialize(json: string): TableStateSnapshot {
    return this._serializer.deserialize(json);
  }

  // ─── Metrics ─────────────────────────────────────────────────────────────

  metrics(tableId: string): TableStateMetricsSnapshot | null {
    return this._metrics.snapshot(tableId);
  }

  // ─── Event System ─────────────────────────────────────────────────────────

  /**
   * Subscribe to state events.
   * Use `'*'` for tableId or type to match all.
   * Returns an unsubscribe function.
   */
  on(
    tableId: string | '*',
    type:    TableStateEventType | '*',
    handler: TableStateEventHandler,
  ): () => void {
    const key = tableId;
    if (!this._handlers.has(key)) this._handlers.set(key, new Map());
    const typeMap = this._handlers.get(key)!;
    if (!typeMap.has(type)) typeMap.set(type, new Set());
    typeMap.get(type)!.add(handler);

    return () => typeMap.get(type)?.delete(handler);
  }

  // ─── Lookup ───────────────────────────────────────────────────────────────

  getStore(tableId: string): TableStateStore | undefined {
    return this._stores.get(tableId);
  }

  hasStore(tableId: string): boolean {
    return this._stores.has(tableId);
  }

  /** All currently registered store IDs. */
  listStores(): string[] {
    return [...this._stores.keys()];
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private _emit(store: TableStateStore, type: TableStateEventType): void {
    const snap      = this._serializer.createSnapshot(store.tableId, store.snapshot());
    const event: TableStateEvent = {
      type,
      tableId:   store.tableId,
      snapshot:  snap,
      timestamp: snap.capturedAt,
    };

    const fire = (key: string, t: TableStateEventType | '*') => {
      const typeMap = this._handlers.get(key);
      if (!typeMap) return;
      typeMap.get(t)?.forEach(h => h(event));
      if (t !== '*') typeMap.get('*')?.forEach(h => h(event));
    };

    fire(store.tableId, type);
    fire('*', type);
  }
}
