import { Injectable } from '@angular/core';
import { Theme, ThemeMode } from '../ui.types';
import { LIGHT_THEME } from './themes/light.theme';
import { DARK_THEME } from './themes/dark.theme';
import { BRAND_THEME } from './themes/brand.theme';

@Injectable({ providedIn: 'root' })
export class ThemeRegistryService {
  private readonly _themes = new Map<string, Theme>();

  constructor() {
    this.register(LIGHT_THEME);
    this.register(DARK_THEME);
    this.register(BRAND_THEME);
  }

  register(theme: Theme): void {
    if (!theme.id?.trim()) throw new Error('ThemeRegistry: theme id is required');
    this._themes.set(theme.id, theme);
  }

  get(id: string): Theme | null {
    return this._themes.get(id) ?? null;
  }

  getAll(): ReadonlyArray<Theme> {
    return Array.from(this._themes.values());
  }

  getByMode(mode: ThemeMode): ReadonlyArray<Theme> {
    return this.getAll().filter(t => t.mode === mode);
  }

  has(id: string): boolean {
    return this._themes.has(id);
  }

  remove(id: string): boolean {
    if (id === 'light' || id === 'dark') {
      throw new Error(`ThemeRegistry: built-in theme "${id}" cannot be removed`);
    }
    return this._themes.delete(id);
  }

  get count(): number {
    return this._themes.size;
  }
}
