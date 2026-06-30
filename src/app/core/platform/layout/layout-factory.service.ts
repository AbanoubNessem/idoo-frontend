import { Injectable, inject } from '@angular/core';
import {
  LayoutDefinition, LayoutInstance, LayoutPhase, LayoutContextData,
} from './layout.types';
import { LayoutResolverService } from './layout-resolver.service';
import { LayoutMetricsService } from './layout-metrics.service';
import { LayoutLifecycleService } from './layout-lifecycle.service';
import { LayoutEventsService } from './layout-events.service';

interface MutableInstance {
  id: string;
  definition: LayoutDefinition;
  phase: LayoutPhase;
  resolved: import('./layout.types').ResolvedLayout | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LayoutFactoryService {
  private readonly _resolver  = inject(LayoutResolverService);
  private readonly _metrics   = inject(LayoutMetricsService);
  private readonly _lifecycle = inject(LayoutLifecycleService);
  private readonly _events    = inject(LayoutEventsService);

  private readonly _instances = new Map<string, MutableInstance>();

  create(definition: LayoutDefinition, context: LayoutContextData): LayoutInstance {
    const instance: MutableInstance = {
      id:         definition.id,
      definition,
      phase:      'created',
      resolved:   null,
      createdAt:  new Date().toISOString(),
    };

    this._instances.set(definition.id, instance);
    this._metrics.track(definition.id);
    this._events.emitFor(definition.id, 'layout:created', null);

    this._transition(instance, 'created', 'initializing');
    this._resolve(instance, context);
    this._transition(instance, 'initializing', 'ready');

    return this._toReadonly(instance);
  }

  update(id: string, context: LayoutContextData): LayoutInstance | null {
    const instance = this._instances.get(id);
    if (!instance || instance.phase === 'destroyed') return null;

    const start = performance.now();
    this._transition(instance, 'ready', 'updating');
    this._resolve(instance, context);
    this._transition(instance, 'updating', 'ready');

    const elapsed = performance.now() - start;
    this._metrics.recordRender(id, elapsed);

    return this._toReadonly(instance);
  }

  destroy(id: string): void {
    const instance = this._instances.get(id);
    if (!instance) return;

    this._transition(instance, 'ready', 'destroying');
    this._transition(instance, 'destroying', 'destroyed');
    this._metrics.untrack(id);
    this._instances.delete(id);
  }

  get(id: string): LayoutInstance | null {
    const inst = this._instances.get(id);
    return inst ? this._toReadonly(inst) : null;
  }

  has(id: string): boolean {
    return this._instances.has(id);
  }

  allInstances(): ReadonlyArray<LayoutInstance> {
    return Array.from(this._instances.values()).map(i => this._toReadonly(i));
  }

  private _resolve(instance: MutableInstance, context: LayoutContextData): void {
    const start = performance.now();
    try {
      instance.resolved = this._resolver.resolve(instance.definition, context);
    } catch (err) {
      this._events.emitFor(instance.id, 'layout:error', err);
      instance.resolved = null;
    }
    this._metrics.recordResolve(instance.id);
    this._metrics.recordRender(instance.id, performance.now() - start);
  }

  private _transition(inst: MutableInstance, from: LayoutPhase, to: LayoutPhase): void {
    inst.phase = to;
    this._lifecycle.transition(inst.id, from, to);
  }

  private _toReadonly(inst: MutableInstance): LayoutInstance {
    return {
      id:         inst.id,
      definition: inst.definition,
      phase:      inst.phase,
      resolved:   inst.resolved,
      createdAt:  inst.createdAt,
    };
  }
}
