import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface MenuItemDef {
  id: string;
  label: string;
  icon: string;
  path: string;
  order?: number;
  parentId?: string;
  permission?: string;
  moduleCode?: string;
  badgeKey?: string;
  children?: MenuItemDef[];
}

@Injectable({ providedIn: 'root' })
export class MenuRegistryService extends BaseRegistry<MenuItemDef> {
  readonly name = 'menu';
  readonly mergeStrategy: MergeStrategy = 'DEEP';

  getTopLevel(): import('../registry.types').RegistryEntry<MenuItemDef>[] {
    return this.query({ predicate: e => !e.definition.parentId });
  }

  getChildrenOf(parentId: string): import('../registry.types').RegistryEntry<MenuItemDef>[] {
    return this.query({ predicate: e => e.definition.parentId === parentId });
  }

  getSortedAll(): import('../registry.types').RegistryEntry<MenuItemDef>[] {
    return this.getAll().sort((a, b) => (a.definition.order ?? 99) - (b.definition.order ?? 99));
  }
}
