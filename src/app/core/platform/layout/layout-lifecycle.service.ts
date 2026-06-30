import { Injectable, inject } from '@angular/core';
import { LayoutPhase } from './layout.types';
import { LayoutEventsService } from './layout-events.service';

@Injectable({ providedIn: 'root' })
export class LayoutLifecycleService {
  private readonly _events = inject(LayoutEventsService);

  transition(instanceId: string, from: LayoutPhase, to: LayoutPhase): void {
    if (!this._isValid(from, to)) {
      console.warn(`[LayoutLifecycle] Invalid transition ${from} → ${to} for ${instanceId}`);
      return;
    }
    const eventType = this._toEventType(to);
    if (eventType) {
      this._events.emitFor(instanceId, eventType, { from, to });
    }
  }

  private _isValid(from: LayoutPhase, to: LayoutPhase): boolean {
    const allowed: Partial<Record<LayoutPhase, ReadonlyArray<LayoutPhase>>> = {
      created:      ['initializing', 'destroyed'],
      initializing: ['ready', 'destroyed'],
      ready:        ['updating', 'destroying'],
      updating:     ['ready', 'destroying'],
      destroying:   ['destroyed'],
      destroyed:    [],
    };
    return allowed[from]?.includes(to) ?? false;
  }

  private _toEventType(phase: LayoutPhase): import('./layout.types').LayoutEventType | null {
    switch (phase) {
      case 'ready':     return 'layout:initialized';
      case 'updating':  return 'layout:updated';
      case 'destroyed': return 'layout:destroyed';
      default:          return null;
    }
  }
}
