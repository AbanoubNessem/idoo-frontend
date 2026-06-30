import { Injectable, Signal, computed, signal } from '@angular/core';
import {
  TableInteractionEvent,
  TableInteractionEventHandler,
  TableInteractionEventType,
} from './table-interaction.types';

@Injectable({ providedIn: 'root' })
export class TableInteractionEvents {
  private readonly _handlers = new Map<
    string,
    Map<TableInteractionEventType | '*', Set<TableInteractionEventHandler>>
  >();
  private readonly _version = signal(0);

  readonly handlerCount: Signal<number> = computed(() => {
    this._version();
    let count = 0;
    for (const byType of this._handlers.values()) {
      for (const set of byType.values()) count += set.size;
    }
    return count;
  });

  emit(event: TableInteractionEvent): void {
    const targets: string[]                           = [event.tableId, '*'];
    const types:   (TableInteractionEventType | '*')[] = [event.type, '*'];

    for (const tableId of targets) {
      const byType = this._handlers.get(tableId);
      if (!byType) continue;
      for (const type of types) {
        const handlers = byType.get(type);
        if (!handlers) continue;
        for (const handler of handlers) handler(event);
      }
    }
  }

  on(
    tableId: string | '*',
    type:    TableInteractionEventType | '*',
    handler: TableInteractionEventHandler,
  ): () => void {
    if (!this._handlers.has(tableId)) {
      this._handlers.set(tableId, new Map());
    }
    const byType = this._handlers.get(tableId)!;
    if (!byType.has(type)) {
      byType.set(type, new Set());
    }
    byType.get(type)!.add(handler);
    this._version.update(v => v + 1);

    return () => {
      byType.get(type)?.delete(handler);
      this._version.update(v => v + 1);
    };
  }

  off(tableId: string | '*', type: TableInteractionEventType | '*'): void {
    this._handlers.get(tableId)?.delete(type);
    this._version.update(v => v + 1);
  }

  clear(tableId: string): void {
    this._handlers.delete(tableId);
    this._version.update(v => v + 1);
  }
}
