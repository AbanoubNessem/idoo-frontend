import { Injectable } from '@angular/core';
import { LayoutDefinition, LayoutRegistryEntry } from './layout.types';

@Injectable({ providedIn: 'root' })
export class LayoutRegistryService {
  private readonly _entries = new Map<string, LayoutRegistryEntry>();

  register(
    definition: LayoutDefinition,
    options: { version?: string; tags?: ReadonlyArray<string> } = {},
  ): void {
    this._entries.set(definition.id, {
      definition,
      registeredAt: new Date().toISOString(),
      version:      options.version,
      tags:         options.tags,
    });
  }

  registerAll(definitions: ReadonlyArray<LayoutDefinition>): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  get(id: string): LayoutDefinition | null {
    return this._entries.get(id)?.definition ?? null;
  }

  getEntry(id: string): LayoutRegistryEntry | null {
    return this._entries.get(id) ?? null;
  }

  has(id: string): boolean {
    return this._entries.has(id);
  }

  unregister(id: string): boolean {
    return this._entries.delete(id);
  }

  clear(): void {
    this._entries.clear();
  }

  size(): number {
    return this._entries.size;
  }

  all(): ReadonlyArray<LayoutDefinition> {
    return Array.from(this._entries.values()).map(e => e.definition);
  }

  byTag(tag: string): ReadonlyArray<LayoutDefinition> {
    return Array.from(this._entries.values())
      .filter(e => e.tags?.includes(tag))
      .map(e => e.definition);
  }
}
