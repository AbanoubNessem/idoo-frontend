import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface PermissionDef {
  code: string;
  moduleCode: string;
  resource: string;
  action: string;
  label: string;
  description?: string;
  implies?: string[];
}

const PERMISSION_PATTERN = /^[A-Z0-9_]+:[A-Z0-9_]+:[A-Z0-9_]+$/;

@Injectable({ providedIn: 'root' })
export class PermissionRegistryService extends BaseRegistry<PermissionDef> {
  readonly name = 'permission';
  readonly mergeStrategy: MergeStrategy = 'NO_OVERRIDE';

  getByModule(moduleCode: string): import('../registry.types').RegistryEntry<PermissionDef>[] {
    return this.query({ predicate: e => e.definition.moduleCode === moduleCode });
  }

  getImplied(code: string): string[] {
    const entry = this.getById(code);
    if (!entry) return [];
    return entry.definition.implies ?? [];
  }

  protected override validate(id: string, def: PermissionDef): string[] {
    const errors: string[] = [];
    if (!PERMISSION_PATTERN.test(def.code)) {
      errors.push(`${id}: permission code must match MODULE:RESOURCE:ACTION (uppercase)`);
    }
    return errors;
  }
}
