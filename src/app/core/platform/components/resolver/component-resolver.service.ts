import { Injectable, Type, inject, signal, computed } from '@angular/core';
import { ComponentRegistryService } from '../registry/component-registry.service';
import { ComponentFieldType } from '../component.types';

export type ResolverState = 'idle' | 'resolving' | 'ready' | 'error';

interface ResolutionCache {
  readonly type: Type<unknown>;
  readonly resolvedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ComponentResolverService {
  private readonly registry = inject(ComponentRegistryService);
  private readonly _cache   = new Map<string, ResolutionCache>();
  private readonly _state   = signal<ResolverState>('idle');
  private readonly _errors  = signal<string[]>([]);
  private _pending          = 0;

  readonly state  = computed(() => this._state());
  readonly errors = computed(() => this._errors());

  /**
   * Resolves a registered component by its field type key.
   * Uses cache for subsequent lookups — resolving a lazy component only once.
   */
  async resolveField(fieldType: ComponentFieldType): Promise<Type<unknown> | null> {
    const entry = this.registry.getByFieldType(fieldType);
    if (!entry) return null;
    return this._resolveKey(entry.key);
  }

  /**
   * Resolves a registered component by its registry key.
   */
  async resolveKey(key: string): Promise<Type<unknown> | null> {
    if (!this.registry.hasKey(key)) return null;
    return this._resolveKey(key);
  }

  /**
   * Eagerly pre-resolves all registered lazy components.
   * Call at app startup after all components are registered.
   */
  async preResolveAll(): Promise<void> {
    const entries = this.registry.all();
    const lazy    = entries.filter(e => !e.resolved);

    if (lazy.length === 0) return;

    this._beginResolving();

    const results = await Promise.allSettled(
      lazy.map(e => this._resolveKey(e.key)),
    );

    const failures = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
    if (failures.length > 0) {
      this._errors.update(prev => [
        ...prev,
        ...failures.map(f => String(f.reason)),
      ]);
    }

    this._finishResolving();
  }

  isCached(key: string): boolean {
    return this._cache.has(key);
  }

  clearCache(): void {
    this._cache.clear();
  }

  private async _resolveKey(key: string): Promise<Type<unknown>> {
    const cached = this._cache.get(key);
    if (cached) return cached.type;

    this._beginResolving();
    try {
      const type = await this.registry.resolve(key);
      this._cache.set(key, { type, resolvedAt: new Date().toISOString() });
      return type;
    } catch (err) {
      const msg = `ComponentResolver: failed to resolve "${key}": ${String(err)}`;
      this._errors.update(prev => [...prev, msg]);
      throw new Error(msg);
    } finally {
      this._finishResolving();
    }
  }

  private _beginResolving(): void {
    this._pending++;
    if (this._state() !== 'resolving') this._state.set('resolving');
  }

  private _finishResolving(): void {
    this._pending = Math.max(0, this._pending - 1);
    if (this._pending === 0) {
      this._state.set(this._errors().length > 0 ? 'error' : 'ready');
    }
  }
}
