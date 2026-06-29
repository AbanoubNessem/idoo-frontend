import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface LookupItemDef {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface LookupDef {
  id: string;
  label: string;
  items: LookupItemDef[];
  source?: 'static' | 'remote';
  remoteUrl?: string;
  cacheTtlMs?: number;
}

@Injectable({ providedIn: 'root' })
export class LookupRegistryService extends BaseRegistry<LookupDef> {
  readonly name = 'lookup';
  readonly mergeStrategy: MergeStrategy = 'ADDITIVE';

  getItems(id: string): LookupItemDef[] {
    return this.getById(id)?.definition.items ?? [];
  }

  protected override validate(id: string, def: LookupDef): string[] {
    const errors: string[] = [];
    if (!def.items || def.items.length === 0) {
      if (def.source !== 'remote') {
        errors.push(`${id}: static lookup must have at least one item`);
      }
    }
    return errors;
  }
}
