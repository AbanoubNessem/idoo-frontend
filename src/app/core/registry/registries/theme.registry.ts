import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface ThemeDef {
  id: string;
  name: string;
  cssClass: string;
  primaryColor: string;
  accentColor: string;
  warnColor: string;
  darkMode?: boolean;
  variables?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ThemeRegistryService extends BaseRegistry<ThemeDef> {
  readonly name = 'theme';
  readonly mergeStrategy: MergeStrategy = 'DEEP';

  getDefault(): import('../registry.types').RegistryEntry<ThemeDef> | undefined {
    return this.getAll()[0];
  }
}
