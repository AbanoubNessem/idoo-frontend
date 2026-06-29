import { Injectable, signal, computed } from '@angular/core';
import { MetadataSnapshot, MetadataType } from './metadata.types';

interface CacheEntry {
  readonly snapshot: MetadataSnapshot;
  readonly storedAt: number;
}

@Injectable({ providedIn: 'root' })
export class MetadataCacheService {
  private readonly _current = signal<CacheEntry | null>(null);
  private _hitCount = 0;
  private _missCount = 0;

  readonly hasSnapshot = computed(() => this._current() !== null);
  readonly snapshotId = computed(() => this._current()?.snapshot.id ?? null);

  store(snapshot: MetadataSnapshot): void {
    this._current.set({ snapshot, storedAt: Date.now() });
  }

  get(): MetadataSnapshot | null {
    const entry = this._current();
    if (!entry) {
      this._missCount++;
      return null;
    }
    this._hitCount++;
    return entry.snapshot;
  }

  getAgeMs(): number | null {
    const entry = this._current();
    return entry ? Date.now() - entry.storedAt : null;
  }

  invalidate(): void {
    this._current.set(null);
  }

  invalidateByType(type: MetadataType): void {
    // Invalidate the whole snapshot — it must be rebuilt to reflect type changes
    const entry = this._current();
    if (!entry) return;

    const hasType = (entry.snapshot.index.byType.get(type)?.length ?? 0) > 0;
    if (hasType) this._current.set(null);
  }

  invalidateByPlugin(pluginId: string): void {
    const entry = this._current();
    if (!entry) return;

    const hasPlugin = entry.snapshot.index.byPlugin.has(pluginId);
    if (hasPlugin) this._current.set(null);
  }

  getStats(): { hits: number; misses: number; hitRate: number } {
    const total = this._hitCount + this._missCount;
    return {
      hits: this._hitCount,
      misses: this._missCount,
      hitRate: total > 0 ? this._hitCount / total : 0,
    };
  }

  resetStats(): void {
    this._hitCount = 0;
    this._missCount = 0;
  }
}
