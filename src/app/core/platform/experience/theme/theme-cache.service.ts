import { Injectable, inject } from '@angular/core';
import { ThemeDefinition } from './theme.types';
import { THEME_CACHE_TTL_MS } from './theme.tokens';

interface CacheEntry {
  theme:     ThemeDefinition;
  cachedAt:  number;
  hitCount:  number;
}

@Injectable({ providedIn: 'root' })
export class ThemeCacheService {
  private readonly _ttl    = inject(THEME_CACHE_TTL_MS);
  private readonly _store  = new Map<string, CacheEntry>();

  set(theme: ThemeDefinition): void {
    this._store.set(theme.id, {
      theme,
      cachedAt: Date.now(),
      hitCount: 0,
    });
  }

  get(themeId: string): ThemeDefinition | null {
    const entry = this._store.get(themeId);
    if (!entry) return null;
    if (this._isExpired(entry)) {
      this._store.delete(themeId);
      return null;
    }
    entry.hitCount++;
    return entry.theme;
  }

  has(themeId: string): boolean {
    const entry = this._store.get(themeId);
    if (!entry) return false;
    if (this._isExpired(entry)) {
      this._store.delete(themeId);
      return false;
    }
    return true;
  }

  invalidate(themeId: string): void {
    this._store.delete(themeId);
  }

  clear(): void {
    this._store.clear();
  }

  size(): number {
    this._evictExpired();
    return this._store.size;
  }

  stats(): ReadonlyArray<{ id: string; hitCount: number; cachedAt: number }> {
    this._evictExpired();
    return Array.from(this._store.entries()).map(([id, e]) => ({
      id,
      hitCount: e.hitCount,
      cachedAt: e.cachedAt,
    }));
  }

  private _isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.cachedAt > this._ttl;
  }

  private _evictExpired(): void {
    for (const [id, entry] of this._store.entries()) {
      if (this._isExpired(entry)) this._store.delete(id);
    }
  }
}
