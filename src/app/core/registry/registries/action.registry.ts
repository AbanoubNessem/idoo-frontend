import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export type ActionScope = 'row' | 'bulk' | 'global' | 'header' | 'detail';

export interface ActionDef {
  id: string;
  label: string;
  icon?: string;
  scope: ActionScope[];
  permission?: string;
  handler: (ctx: ActionContext) => void | Promise<void>;
  hidden?: (ctx: ActionContext) => boolean;
  disabled?: (ctx: ActionContext) => boolean;
  confirmBefore?: { title: string; message: string; type: string };
  successMessage?: string;
  errorMessage?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  order?: number;
}

export interface ActionContext {
  row?: Record<string, unknown>;
  rows?: Record<string, unknown>[];
  entityId: string;
  mode: ActionScope;
}

@Injectable({ providedIn: 'root' })
export class ActionRegistryService extends BaseRegistry<ActionDef> {
  readonly name = 'action';
  readonly mergeStrategy: MergeStrategy = 'REPLACE';

  getForEntity(entityId: string): import('../registry.types').RegistryEntry<ActionDef>[] {
    return this.query({ predicate: e => e.id.startsWith(entityId) });
  }

  getForScope(
    entityId: string,
    scope: ActionScope,
  ): import('../registry.types').RegistryEntry<ActionDef>[] {
    return this.query({
      predicate: e =>
        e.id.startsWith(entityId) && e.definition.scope.includes(scope),
    }).sort((a, b) => (a.definition.order ?? 99) - (b.definition.order ?? 99));
  }
}
