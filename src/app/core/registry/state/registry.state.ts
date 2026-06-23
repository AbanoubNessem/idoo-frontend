import { Injectable, signal, computed } from '@angular/core';
import { ModuleConfig, EntityConfig } from '../models/registry.models';

@Injectable({ providedIn: 'root' })
export class RegistryState {
  private readonly _modules = signal<Map<string, ModuleConfig>>(new Map());
  private readonly _entities = signal<Map<string, EntityConfig>>(new Map());

  public readonly modules = computed(() => {
    const modulesArr = Array.from(this._modules().values());
    return modulesArr.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  public readonly entities = computed(() => Array.from(this._entities().values()));

  addModule(config: ModuleConfig): void {
    this._modules.update(map => {
      const newMap = new Map(map);
      newMap.set(config.id, config);
      return newMap;
    });
  }

  addEntity(config: EntityConfig): void {
    this._entities.update(map => {
      const newMap = new Map(map);
      newMap.set(config.name, config);
      return newMap;
    });
  }

  getEntity(name: string): EntityConfig | undefined {
    return this._entities().get(name);
  }

  getModule(id: string): ModuleConfig | undefined {
    return this._modules().get(id);
  }

  clear(): void {
    this._modules.set(new Map());
    this._entities.set(new Map());
  }
}
