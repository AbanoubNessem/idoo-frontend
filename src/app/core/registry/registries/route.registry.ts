import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface RouteDef {
  path: string;
  entityId: string;
  title?: string;
  permissions?: string[];
  moduleCode?: string;
  preload?: boolean;
  data?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class RouteRegistryService extends BaseRegistry<RouteDef> {
  readonly name = 'route';
  readonly mergeStrategy: MergeStrategy = 'REPLACE';

  protected override validate(id: string, def: RouteDef): string[] {
    const errors: string[] = [];
    if (!def.path) errors.push(`${id}: route path is required`);
    if (!def.entityId) errors.push(`${id}: entityId is required`);
    return errors;
  }
}
