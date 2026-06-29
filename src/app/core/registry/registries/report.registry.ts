import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface ReportDef {
  id: string;
  name: string;
  permission: string;
  formats: ('pdf' | 'csv' | 'xlsx')[];
  endpoint: string;
  entityId?: string;
  parameters?: unknown;
  description?: string;
  icon?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportRegistryService extends BaseRegistry<ReportDef> {
  readonly name = 'report';
  readonly mergeStrategy: MergeStrategy = 'REPLACE';

  getForEntity(entityId: string): import('../registry.types').RegistryEntry<ReportDef>[] {
    return this.query({ predicate: e => e.definition.entityId === entityId });
  }

  protected override validate(id: string, def: ReportDef): string[] {
    const errors: string[] = [];
    if (!def.endpoint) errors.push(`${id}: endpoint is required`);
    if (!def.formats || def.formats.length === 0) errors.push(`${id}: at least one format is required`);
    return errors;
  }
}
