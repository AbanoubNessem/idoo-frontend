import { computed, Injectable, signal } from '@angular/core';
import {
  TableDefinition,
  TableRegistrationOptions,
  TableRegistryEntry,
  TableRegistryLayer,
} from '../table.types';

@Injectable({ providedIn: 'root' })
export class TableRegistryService {
  private readonly _entries = new Map<string, TableRegistryEntry>();
  private readonly _version = signal(0);

  readonly registeredCount = computed(() => {
    this._version();
    return this._entries.size;
  });

  readonly all = computed<TableRegistryEntry[]>(() => {
    this._version();
    return Array.from(this._entries.values());
  });

  register(definition: TableDefinition, options: TableRegistrationOptions = {}): void {
    if (this._entries.has(definition.id) && !options.overwrite) {
      throw new Error(
        `[TableRegistry] Table "${definition.id}" is already registered. ` +
        `Pass { overwrite: true } to replace it.`,
      );
    }

    const entry: TableRegistryEntry = {
      id:           definition.id,
      definition,
      layer:        options.layer ?? 'module',
      registeredAt: new Date().toISOString(),
      tags:         options.tags ?? [],
      factory:      options.factory,
    };

    this._entries.set(definition.id, entry);
    this._version.update(v => v + 1);
  }

  registerLazy(
    id: string,
    factory: () => Promise<TableDefinition>,
    options: TableRegistrationOptions = {},
  ): void {
    const stub: TableDefinition = { id, name: id, columns: [] };
    const entry: TableRegistryEntry = {
      id,
      definition:   stub,
      layer:        options.layer ?? 'module',
      registeredAt: new Date().toISOString(),
      tags:         options.tags ?? [],
      factory,
    };
    this._entries.set(id, entry);
    this._version.update(v => v + 1);
  }

  async resolve(id: string): Promise<TableDefinition | null> {
    const entry = this._entries.get(id);
    if (!entry) return null;
    if (entry.factory) {
      const def = await entry.factory();
      this._entries.set(id, { ...entry, definition: def, factory: undefined });
      return def;
    }
    return entry.definition;
  }

  get(id: string): TableRegistryEntry | undefined {
    return this._entries.get(id);
  }

  has(id: string): boolean {
    return this._entries.has(id);
  }

  remove(id: string): boolean {
    const deleted = this._entries.delete(id);
    if (deleted) this._version.update(v => v + 1);
    return deleted;
  }

  list(): TableRegistryEntry[] {
    return Array.from(this._entries.values());
  }

  listByLayer(layer: TableRegistryLayer): TableRegistryEntry[] {
    return Array.from(this._entries.values()).filter(e => e.layer === layer);
  }

  query(tags: string[]): TableRegistryEntry[] {
    return Array.from(this._entries.values()).filter(e =>
      tags.every(tag => e.tags.includes(tag)),
    );
  }
}
