import { computed, Injectable, signal } from '@angular/core';
import { TABLE_RESOLUTION_ORDER } from '../table.constants';
import {
  TableDefinition,
  TableLayerOverride,
  TableRegistryLayer,
} from '../table.types';

// ─── TableMetadataRegistryService ────────────────────────────────────────────
// Manages layer-based overrides for table definitions.
// Supports the resolution chain: platform → plugin → module → runtime.

@Injectable({ providedIn: 'root' })
export class TableMetadataRegistryService {
  private readonly _overrides = new Map<string, TableLayerOverride[]>();
  private readonly _version   = signal(0);

  readonly overrideCount = computed(() => {
    this._version();
    let total = 0;
    this._overrides.forEach(list => (total += list.length));
    return total;
  });

  applyOverride(
    tableId: string,
    layer: TableRegistryLayer,
    patch: Partial<Omit<TableDefinition, 'id' | 'name'>>,
  ): void {
    const override: TableLayerOverride = {
      tableId,
      layer,
      patch,
      appliedAt: new Date().toISOString(),
    };

    const existing = this._overrides.get(tableId) ?? [];
    const filtered = existing.filter(o => o.layer !== layer);
    this._overrides.set(tableId, [...filtered, override]);
    this._version.update(v => v + 1);
  }

  removeOverride(tableId: string, layer: TableRegistryLayer): boolean {
    const existing = this._overrides.get(tableId);
    if (!existing) return false;
    const filtered = existing.filter(o => o.layer !== layer);
    if (filtered.length === existing.length) return false;
    if (filtered.length === 0) {
      this._overrides.delete(tableId);
    } else {
      this._overrides.set(tableId, filtered);
    }
    this._version.update(v => v + 1);
    return true;
  }

  getOverridesFor(tableId: string): TableLayerOverride[] {
    const all = this._overrides.get(tableId) ?? [];
    return TABLE_RESOLUTION_ORDER
      .map(layer => all.find(o => o.layer === layer))
      .filter((o): o is TableLayerOverride => o !== undefined);
  }

  mergeInto(base: TableDefinition): TableDefinition {
    const overrides = this.getOverridesFor(base.id);
    if (overrides.length === 0) return base;

    let merged: TableDefinition = base;
    for (const override of overrides) {
      merged = { ...merged, ...override.patch, id: base.id, name: base.name };
    }
    return merged;
  }

  hasOverrides(tableId: string): boolean {
    return (this._overrides.get(tableId)?.length ?? 0) > 0;
  }

  clearForTable(tableId: string): void {
    if (this._overrides.delete(tableId)) {
      this._version.update(v => v + 1);
    }
  }

  clearAll(): void {
    this._overrides.clear();
    this._version.update(v => v + 1);
  }

  listTableIds(): string[] {
    return Array.from(this._overrides.keys());
  }
}
