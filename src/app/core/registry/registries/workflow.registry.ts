import { Injectable } from '@angular/core';
import { BaseRegistry } from '../base.registry';
import { MergeStrategy } from '../registry.types';

export interface WorkflowStateDef {
  id: string;
  label: string;
  terminal: boolean;
  color: 'success' | 'warn' | 'danger' | 'neutral' | 'info';
  icon?: string;
}

export interface WorkflowTransitionDef {
  id: string;
  from: string | string[];
  to: string;
  label: string;
  permission: string;
  handler?: (ctx: Record<string, unknown>) => void | Promise<void>;
  confirmBefore?: { title: string; message: string; type: string };
  icon?: string;
}

export interface WorkflowDef {
  id: string;
  entityId: string;
  initialState: string;
  states: WorkflowStateDef[];
  transitions: WorkflowTransitionDef[];
}

@Injectable({ providedIn: 'root' })
export class WorkflowRegistryService extends BaseRegistry<WorkflowDef> {
  readonly name = 'workflow';
  readonly mergeStrategy: MergeStrategy = 'REPLACE';

  getForEntity(entityId: string): import('../registry.types').RegistryEntry<WorkflowDef> | undefined {
    return this.query({ predicate: e => e.definition.entityId === entityId })[0];
  }

  protected override validate(id: string, def: WorkflowDef): string[] {
    const errors: string[] = [];
    if (!def.initialState) errors.push(`${id}: initialState is required`);
    if (!def.states || def.states.length === 0) errors.push(`${id}: at least one state is required`);
    if (!def.transitions || def.transitions.length === 0) errors.push(`${id}: at least one transition is required`);

    const stateIds = new Set(def.states?.map(s => s.id) ?? []);
    for (const t of def.transitions ?? []) {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      for (const f of froms) {
        if (!stateIds.has(f)) errors.push(`${id}: transition.from '${f}' references unknown state`);
      }
      if (!stateIds.has(t.to)) errors.push(`${id}: transition.to '${t.to}' references unknown state`);
    }

    return errors;
  }
}
