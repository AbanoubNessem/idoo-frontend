import { MenuConfig } from '../models/engine-types';

export class MenuRegistry {
  private static menus: MenuConfig[] = [];

  static add(menu: MenuConfig) {
    this.menus.push(menu);
    // Sort by order
    this.menus.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }

  static getMenus(): MenuConfig[] {
    return [...this.menus];
  }

  static clear() {
    this.menus = [];
  }
}
