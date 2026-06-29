import { Injectable, signal, computed } from '@angular/core';
import { ComponentLifecycleEvent, ComponentLifecyclePhase } from '../component.types';

@Injectable({ providedIn: 'root' })
export class ComponentLifecycleService {
  private readonly _events   = signal<ComponentLifecycleEvent[]>([]);
  private readonly _maxLog   = 200;

  readonly events = computed(() => this._events());

  readonly activeInstances = computed<Map<string, ComponentLifecyclePhase>>(() => {
    const map = new Map<string, ComponentLifecyclePhase>();
    for (const e of this._events()) {
      if (e.phase === 'destroyed') {
        map.delete(e.instanceId);
      } else {
        map.set(e.instanceId, e.phase);
      }
    }
    return map;
  });

  readonly instanceCount = computed(() => this.activeInstances().size);

  emit(
    phase: ComponentLifecyclePhase,
    componentKey: string,
    instanceId: string,
    data?: Record<string, unknown>,
  ): void {
    const event: ComponentLifecycleEvent = {
      phase,
      componentKey,
      instanceId,
      timestamp: new Date().toISOString(),
      data,
    };

    this._events.update(prev => {
      const next = [...prev, event];
      return next.length > this._maxLog ? next.slice(-this._maxLog) : next;
    });
  }

  onCreated(componentKey: string, instanceId: string): void {
    this.emit('created', componentKey, instanceId);
  }

  onInitialized(componentKey: string, instanceId: string): void {
    this.emit('initialized', componentKey, instanceId);
  }

  onRendered(componentKey: string, instanceId: string): void {
    this.emit('rendered', componentKey, instanceId);
  }

  onUpdated(componentKey: string, instanceId: string, changedInputs?: string[]): void {
    this.emit('updated', componentKey, instanceId, { changedInputs });
  }

  onDestroyed(componentKey: string, instanceId: string): void {
    this.emit('destroyed', componentKey, instanceId);
  }

  getEventsFor(instanceId: string): ComponentLifecycleEvent[] {
    return this._events().filter(e => e.instanceId === instanceId);
  }

  getPhase(instanceId: string): ComponentLifecyclePhase | null {
    return this.activeInstances().get(instanceId) ?? null;
  }

  clear(): void {
    this._events.set([]);
  }
}
