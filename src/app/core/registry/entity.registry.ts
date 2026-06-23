import { EntityDefinition } from '../models/engine-types';
import { MenuRegistry } from './menu.registry';
import { RouteRegistry } from './route.registry';

export class EntityRegistry {
  private static entities = new Map<string, EntityDefinition>();

  static register(key: string, def: EntityDefinition) {
    this.entities.set(key, def);
    
    if (def.menuConfig) {
      MenuRegistry.add(def.menuConfig);
    }
    
    if (def.routeConfig) {
      RouteRegistry.add(def.routeConfig);
    }
    // Note: FormRegistry and TableRegistry logic would also hook in here
  }

  static getEntity(key: string): EntityDefinition | undefined {
    return this.entities.get(key);
  }

  static getAllKeys(): string[] {
    return Array.from(this.entities.keys());
  }

  static clear() {
    this.entities.clear();
    MenuRegistry.clear();
    RouteRegistry.clear();
  }
}
