import { Injectable, Type } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface WidgetDef {
  id: string;
  name: string;
  icon: string;
  component: () => Promise<Type<unknown>>;
  permission?: string;
  minWidth?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  category?: string;
  description?: string;
  configSchema?: unknown;
}

@Injectable({ providedIn: 'root' })
export class WidgetRegistryService extends BaseRegistry<WidgetDef> {
  readonly name = 'widget';
  readonly mergeStrategy: MergeStrategy = 'REPLACE';

  getByCategory(category: string): import('../registry.types').RegistryEntry<WidgetDef>[] {
    return this.query({ predicate: e => e.definition.category === category });
  }

  protected override validate(id: string, def: WidgetDef): string[] {
    const errors: string[] = [];
    if (!def.component) errors.push(`${id}: component loader is required`);
    if (def.minWidth !== undefined && (def.minWidth < 1 || def.minWidth > 12)) {
      errors.push(`${id}: minWidth must be 1-12`);
    }
    return errors;
  }
}
