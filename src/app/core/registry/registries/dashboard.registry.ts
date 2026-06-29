import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface DashboardSlotDef {
  widgetId: string;
  column: number;
  row: number;
  colSpan: number;
  rowSpan?: number;
}

export interface DashboardDef {
  id: string;
  name: string;
  targetRole?: string;
  moduleCode?: string;
  locked?: boolean;
  slots: DashboardSlotDef[];
}

@Injectable({ providedIn: 'root' })
export class DashboardRegistryService extends BaseRegistry<DashboardDef> {
  readonly name = 'dashboard';
  readonly mergeStrategy: MergeStrategy = 'REPLACE';

  getForModule(moduleCode: string): import('../registry.types').RegistryEntry<DashboardDef>[] {
    return this.query({ predicate: e => e.definition.moduleCode === moduleCode });
  }

  protected override validate(id: string, def: DashboardDef): string[] {
    const errors: string[] = [];
    if (!def.slots || def.slots.length === 0) errors.push(`${id}: dashboard must have at least one slot`);
    return errors;
  }
}
