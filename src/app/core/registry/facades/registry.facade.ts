import { Injectable, inject } from '@angular/core';
import { RegistryState } from '../state/registry.state';
import { ModuleConfig, EntityConfig } from '../models/registry.models';

@Injectable({ providedIn: 'root' })
export class RegistryFacade {
  private readonly registryState = inject(RegistryState);

  readonly modules = this.registryState.modules;
  readonly entities = this.registryState.entities;

  registerModule(config: ModuleConfig): void {
    this.registryState.addModule(config);
  }

  registerEntity(config: EntityConfig): void {
    this.registryState.addEntity(config);
  }

  getModule(id: string): ModuleConfig | undefined {
    return this.registryState.getModule(id);
  }

  getEntity(name: string): EntityConfig | undefined {
    return this.registryState.getEntity(name);
  }

  clearRegistry(): void {
    this.registryState.clear();
  }
}
