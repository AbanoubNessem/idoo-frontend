import { signal, computed } from '@angular/core';
import { TableStateSnapshot } from './table-state.types';
import { TABLE_STATE_MAX_HISTORY_DEPTH } from './table-state.constants';

/**
 * Architecture placeholder for undo/redo capability.
 * `push()` accumulates snapshots up to maxDepth.
 * `undo()` / `redo()` are deferred to a future sprint — they return null.
 * Created via TableStateEngine.createHistory() — not @Injectable.
 */
export class TableStateHistory {
  private readonly _maxDepth: number;
  private readonly _past     = signal<TableStateSnapshot[]>([]);
  private readonly _future   = signal<TableStateSnapshot[]>([]);

  readonly canUndo = computed(() => this._past().length > 0);
  readonly canRedo = computed(() => this._future().length > 0);
  readonly depth   = computed(() => this._past().length);

  constructor(maxDepth = TABLE_STATE_MAX_HISTORY_DEPTH) {
    this._maxDepth = maxDepth;
  }

  /** Record a snapshot. Clears the redo stack. */
  push(snapshot: TableStateSnapshot): void {
    const next = [...this._past(), snapshot];
    this._past.set(next.length > this._maxDepth ? next.slice(-this._maxDepth) : next);
    this._future.set([]);
  }

  /** Peek at the most recent snapshot without removing it. */
  peek(): TableStateSnapshot | null {
    const past = this._past();
    return past.length > 0 ? past[past.length - 1] : null;
  }

  /** Deferred — returns null until a future sprint implements it. */
  undo(): TableStateSnapshot | null { return null; }

  /** Deferred — returns null until a future sprint implements it. */
  redo(): TableStateSnapshot | null { return null; }

  /** Clear the entire history stack. */
  clear(): void {
    this._past.set([]);
    this._future.set([]);
  }
}
