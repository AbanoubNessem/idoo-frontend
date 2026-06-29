import { Injectable } from '@angular/core';
import { CacheEntry, CacheOptions } from '../runtime.types';

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 1000;

@Injectable({ providedIn: 'root' })
export class CacheEngineService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = DEFAULT_MAX_SIZE;

  configure(options: CacheOptions): void {
    if (options.maxSize !== undefined) this.maxSize = options.maxSize;
  }

  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    this.evictExpired();

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const ttl = options.ttlMs ?? DEFAULT_TTL_MS;
    const now = Date.now();

    this.cache.set(key, {
      key,
      value,
      expiresAt: now + ttl,
      createdAt: now,
      hitCount: 0,
    });
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    (entry as CacheEntry<unknown>).hitCount++;
    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  deletePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  getOrSet<T>(key: string, factory: () => T, options?: CacheOptions): T {
    const existing = this.get<T>(key);
    if (existing !== undefined) return existing;

    const value = factory();
    this.set(key, value, options);
    return value;
  }

  async getOrSetAsync<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const existing = this.get<T>(key);
    if (existing !== undefined) return existing;

    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  invalidate(keyOrPrefix: string): void {
    for (const key of this.cache.keys()) {
      if (key === keyOrPrefix || key.startsWith(`${keyOrPrefix}:`)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.evictExpired();
    return this.cache.size;
  }

  getStats(): { size: number; hits: number; maxSize: number } {
    const hits = Array.from(this.cache.values()).reduce((sum, e) => sum + e.hitCount, 0);
    return { size: this.cache.size, hits, maxSize: this.maxSize };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
