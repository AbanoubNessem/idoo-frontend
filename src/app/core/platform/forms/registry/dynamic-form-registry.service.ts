import { computed, Injectable, signal } from '@angular/core';
import { FormDefinition, FormRegistrationOptions, FormRegistryEntry } from '../form.types';

@Injectable({ providedIn: 'root' })
export class DynamicFormRegistryService {
  private readonly _entries  = new Map<string, FormRegistryEntry>();
  private readonly _version  = signal(0);

  readonly registeredCount = computed(() => {
    this._version();
    return this._entries.size;
  });

  readonly all = computed<FormRegistryEntry[]>(() => {
    this._version();
    return Array.from(this._entries.values());
  });

  register(definition: FormDefinition, options: FormRegistrationOptions = {}): void {
    if (this._entries.has(definition.id) && !options.overwrite) {
      throw new Error(
        `[DynamicFormRegistry] Form "${definition.id}" is already registered. ` +
        `Pass { overwrite: true } to replace it.`,
      );
    }

    const entry: FormRegistryEntry = {
      id:           definition.id,
      definition,
      registeredAt: new Date().toISOString(),
      tags:         options.tags ?? [],
      factory:      options.factory,
    };

    this._entries.set(definition.id, entry);
    this._version.update(v => v + 1);
  }

  registerLazy(id: string, factory: () => Promise<FormDefinition>, options: FormRegistrationOptions = {}): void {
    const entry: FormRegistryEntry = {
      id,
      definition: { id, version: 'lazy', mode: 'create', layout: 'simple' } as FormDefinition,
      registeredAt: new Date().toISOString(),
      tags:         options.tags ?? [],
      factory,
    };
    this._entries.set(id, entry);
    this._version.update(v => v + 1);
  }

  async resolve(id: string): Promise<FormDefinition | null> {
    const entry = this._entries.get(id);
    if (!entry) return null;
    if (entry.factory) {
      const def = await entry.factory();
      this._entries.set(id, { ...entry, definition: def, factory: undefined });
      return def;
    }
    return entry.definition;
  }

  get(id: string): FormRegistryEntry | undefined {
    return this._entries.get(id);
  }

  has(id: string): boolean {
    return this._entries.has(id);
  }

  unregister(id: string): boolean {
    const deleted = this._entries.delete(id);
    if (deleted) this._version.update(v => v + 1);
    return deleted;
  }

  query(tags: string[]): FormRegistryEntry[] {
    return Array.from(this._entries.values()).filter(e =>
      tags.every(tag => e.tags.includes(tag)),
    );
  }
}
