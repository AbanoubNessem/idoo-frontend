import { Injectable, inject } from '@angular/core';
import { TranslationMap } from './translation.types';
import { TRANSLATION_CACHE_TTL_MS } from './translation.tokens';

interface CacheEntry {
  data:      TranslationMap;
  cachedAt:  number;
  hitCount:  number;
}

@Injectable({ providedIn: 'root' })
export class TranslationCacheService {
  private readonly _ttl   = inject(TRANSLATION_CACHE_TTL_MS);
  private readonly _store = new Map<string, CacheEntry>();

  set(namespace: string, locale: string, data: TranslationMap): void {
    this._store.set(this._key(namespace, locale), { data, cachedAt: Date.now(), hitCount: 0 });
  }

  get(namespace: string, locale: string): TranslationMap | null {
    const key   = this._key(namespace, locale);
    const entry = this._store.get(key);
    if (!entry) return null;
    if (this._isExpired(entry)) { this._store.delete(key); return null; }
    entry.hitCount++;
    return entry.data;
  }

  has(namespace: string, locale: string): boolean {
    const key   = this._key(namespace, locale);
    const entry = this._store.get(key);
    if (!entry) return false;
    if (this._isExpired(entry)) { this._store.delete(key); return false; }
    return true;
  }

  invalidate(namespace: string, locale?: string): void {
    if (locale) {
      this._store.delete(this._key(namespace, locale));
    } else {
      for (const key of Array.from(this._store.keys())) {
        if (key.startsWith(`${namespace}::`) ) this._store.delete(key);
      }
    }
  }

  clear(): void {
    this._store.clear();
  }

  size(): number {
    this._evictExpired();
    return this._store.size;
  }

  stats(): ReadonlyArray<{ namespace: string; locale: string; hitCount: number; cachedAt: number }> {
    this._evictExpired();
    return Array.from(this._store.entries()).map(([k, e]) => {
      const [ns, loc] = k.split('::');
      return { namespace: ns, locale: loc, hitCount: e.hitCount, cachedAt: e.cachedAt };
    });
  }

  private _key(namespace: string, locale: string): string {
    return `${namespace}::${locale}`;
  }

  private _isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.cachedAt > this._ttl;
  }

  private _evictExpired(): void {
    for (const [k, e] of this._store.entries()) {
      if (this._isExpired(e)) this._store.delete(k);
    }
  }
}
