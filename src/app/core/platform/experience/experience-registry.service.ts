import { Injectable } from '@angular/core';
import {
  ExperienceDimension, ExperienceProfileBase, ExperienceRegistryEntry,
  DimensionProfileMap,
} from './experience.types';
import { EXPERIENCE_DIMENSIONS } from './experience.constants';

@Injectable({ providedIn: 'root' })
export class ExperienceRegistryService {
  private readonly _stores = new Map<ExperienceDimension, Map<string, ExperienceRegistryEntry>>(
    EXPERIENCE_DIMENSIONS.map(d => [d, new Map()]),
  );

  // ─── Generic API ─────────────────────────────────────────────────────────

  register<D extends ExperienceDimension>(
    dimension: D,
    profile: DimensionProfileMap[D],
    options: { version?: string; tags?: ReadonlyArray<string>; isDefault?: boolean } = {},
  ): void {
    const store = this._store(dimension);
    const entry: ExperienceRegistryEntry = {
      profile,
      dimension,
      registeredAt: new Date().toISOString(),
      version:      options.version,
      tags:         options.tags,
      isDefault:    options.isDefault,
    };
    store.set(profile.id, entry);
  }

  get<D extends ExperienceDimension>(dimension: D, id: string): DimensionProfileMap[D] | null {
    return (this._store(dimension).get(id)?.profile as DimensionProfileMap[D]) ?? null;
  }

  has(dimension: ExperienceDimension, id: string): boolean {
    return this._store(dimension).has(id);
  }

  unregister(dimension: ExperienceDimension, id: string): boolean {
    return this._store(dimension).delete(id);
  }

  getEntry(dimension: ExperienceDimension, id: string): ExperienceRegistryEntry | null {
    return this._store(dimension).get(id) ?? null;
  }

  all<D extends ExperienceDimension>(dimension: D): ReadonlyArray<DimensionProfileMap[D]> {
    return Array.from(this._store(dimension).values())
      .map(e => e.profile as DimensionProfileMap[D]);
  }

  countByDimension(): Record<ExperienceDimension, number> {
    return Object.fromEntries(
      EXPERIENCE_DIMENSIONS.map(d => [d, this._store(d).size]),
    ) as Record<ExperienceDimension, number>;
  }

  totalCount(): number {
    return EXPERIENCE_DIMENSIONS.reduce((sum, d) => sum + this._store(d).size, 0);
  }

  defaultFor<D extends ExperienceDimension>(dimension: D): DimensionProfileMap[D] | null {
    for (const entry of this._store(dimension).values()) {
      if (entry.isDefault) return entry.profile as DimensionProfileMap[D];
    }
    return null;
  }

  byTag(dimension: ExperienceDimension, tag: string): ReadonlyArray<ExperienceProfileBase> {
    return Array.from(this._store(dimension).values())
      .filter(e => e.tags?.includes(tag))
      .map(e => e.profile);
  }

  clear(dimension?: ExperienceDimension): void {
    if (dimension) {
      this._store(dimension).clear();
    } else {
      for (const store of this._stores.values()) store.clear();
    }
  }

  private _store(dimension: ExperienceDimension): Map<string, ExperienceRegistryEntry> {
    return this._stores.get(dimension)!;
  }
}
