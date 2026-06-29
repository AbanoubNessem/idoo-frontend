import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface EntityDef {
  id: string;
  apiPath: string;
  labelSingular: string;
  labelPlural: string;
  labelField: string;
  icon: string;
  permissions: Record<string, string>;
  table?: unknown;
  form?: unknown;
  searchable?: boolean;
  exportable?: boolean;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class EntityRegistryService extends BaseRegistry<EntityDef> {
  readonly name = 'entity';
  readonly mergeStrategy: MergeStrategy = 'REPLACE';

  protected override validate(id: string, def: EntityDef): string[] {
    const errors: string[] = [];
    if (!def.apiPath) errors.push(`${id}: apiPath is required`);
    if (!def.labelSingular) errors.push(`${id}: labelSingular is required`);
    if (!def.permissions?.['list']) errors.push(`${id}: permissions.list is required`);
    return errors;
  }
}
