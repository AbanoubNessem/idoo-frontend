import { Injectable, signal, computed } from '@angular/core';
import { CachedRenderResult, RenderResult } from './rendering.types';

@Injectable({ providedIn: 'root' })
export class RenderCacheService {
  private readonly _cache = new Map<string, CachedRenderResult>();
  private readonly _size = signal(0);
  private _hits = 0;
  private _misses = 0;

  readonly size = computed(() => this._size());

  buildKey(fieldType: string, adapter: string, mode: string, configHash?: string): string {
    return `${fieldType}:${adapter}:${mode}${configHash ? ':' + configHash : ''}`;
  }

  get(key: string): RenderResult | null {
    const entry = this._cache.get(key);
    if (!entry) {
      this._misses++;
      return null;
    }
    this._hits++;
    this._cache.set(key, { ...entry, hitCount: entry.hitCount + 1 });
    return entry.result;
  }

  set(key: string, result: RenderResult): void {
    this._cache.set(key, { result, cachedAt: Date.now(), hitCount: 0 });
    this._size.set(this._cache.size);
  }

  has(key: string): boolean {
    return this._cache.has(key);
  }

  invalidate(key: string): void {
    this._cache.delete(key);
    this._size.set(this._cache.size);
  }

  invalidateByFieldType(fieldType: string): void {
    for (const key of this._cache.keys()) {
      if (key.startsWith(`${fieldType}:`)) {
        this._cache.delete(key);
      }
    }
    this._size.set(this._cache.size);
  }

  clear(): void {
    this._cache.clear();
    this._size.set(0);
  }

  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this._hits + this._misses;
    return {
      hits: this._hits,
      misses: this._misses,
      hitRate: total > 0 ? this._hits / total : 0,
      size: this._cache.size,
    };
  }

  resetStats(): void {
    this._hits = 0;
    this._misses = 0;
  }
}
