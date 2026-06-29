import { Injectable, Type, signal, computed } from '@angular/core';
import {
  ComponentDefinition, ComponentEntry, ComponentQuery,
  ComponentRegistrationOptions, ComponentFieldType, ComponentCategory,
} from '../component.types';

@Injectable({ providedIn: 'root' })
export class ComponentRegistryService {
  private readonly _entries = new Map<string, ComponentEntry>();
  private readonly _version = signal(0);

  /** Total number of registered components (reactive). */
  readonly registeredCount = computed(() => {
    this._version();
    return this._entries.size;
  });

  /** All registered entries (reactive snapshot). */
  readonly all = computed<ComponentEntry[]>(() => {
    this._version();
    return Array.from(this._entries.values());
  });

  register(
    definition: ComponentDefinition,
    options: ComponentRegistrationOptions = {},
  ): void {
    const existing = this._entries.get(definition.key);
    if (existing && !options.override) {
      throw new Error(
        `ComponentRegistry: "${definition.key}" is already registered. ` +
        `Pass { override: true } to replace it.`,
      );
    }

    const entry: ComponentEntry = {
      ...definition,
      resolved: !definition.factory,
    };

    this._entries.set(definition.key, entry);
    this._bump();
  }

  /**
   * Resolves a lazy-registered component, replacing its factory with the
   * concrete type. Resolves immediately for eagerly registered components.
   */
  async resolve(key: string): Promise<Type<unknown>> {
    const entry = this._entries.get(key);
    if (!entry) throw new Error(`ComponentRegistry: "${key}" is not registered.`);

    if (entry.resolved) return entry.component;

    if (!entry.factory) {
      throw new Error(`ComponentRegistry: "${key}" has no factory and is not resolved.`);
    }

    const resolved = await entry.factory();
    this._entries.set(key, { ...entry, component: resolved, resolved: true });
    this._bump();
    return resolved;
  }

  get(key: string): ComponentEntry | undefined {
    return this._entries.get(key);
  }

  getByFieldType(fieldType: ComponentFieldType): ComponentEntry | undefined {
    for (const entry of this._entries.values()) {
      if (entry.fieldType === fieldType) return entry;
    }
    return undefined;
  }

  query(criteria: ComponentQuery): ComponentEntry[] {
    return Array.from(this._entries.values()).filter(e => {
      if (criteria.category && e.category !== criteria.category) return false;
      if (criteria.fieldType && e.fieldType !== criteria.fieldType) return false;
      if (criteria.version && e.version !== criteria.version) return false;
      if (criteria.tags?.length) {
        const entryTags = new Set(e.tags);
        if (!criteria.tags.every(t => entryTags.has(t))) return false;
      }
      return true;
    });
  }

  hasKey(key: string): boolean {
    return this._entries.has(key);
  }

  unregister(key: string): boolean {
    const deleted = this._entries.delete(key);
    if (deleted) this._bump();
    return deleted;
  }

  getCategories(): ComponentCategory[] {
    const cats = new Set<ComponentCategory>();
    for (const e of this._entries.values()) cats.add(e.category);
    return Array.from(cats);
  }

  private _bump(): void {
    this._version.update(v => v + 1);
  }
}
