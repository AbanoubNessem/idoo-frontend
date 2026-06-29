import { computed, Injectable, signal } from '@angular/core';
import { FormLifecycleEvent, FormLifecyclePhase } from '../form.types';

const MAX_EVENTS = 200;

@Injectable({ providedIn: 'root' })
export class DynamicFormLifecycleService {
  private readonly _events = signal<FormLifecycleEvent[]>([]);

  readonly events     = this._events.asReadonly();
  readonly eventCount = computed(() => this._events().length);

  readonly activeInstances = computed<Map<string, FormLifecyclePhase>>(() => {
    const map = new Map<string, FormLifecyclePhase>();
    for (const event of this._events()) {
      if (event.phase === 'destroyed') {
        map.delete(event.formId);
      } else {
        map.set(event.formId, event.phase);
      }
    }
    return map;
  });

  readonly instanceCount = computed(() => this.activeInstances().size);

  transition(formId: string, phase: FormLifecyclePhase, durationMs?: number): void {
    const event: FormLifecycleEvent = {
      formId,
      phase,
      timestamp: new Date().toISOString(),
      durationMs,
    };
    this._events.update(events => {
      const next = [...events, event];
      return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
    });
  }

  onCreated(formId: string): void      { this.transition(formId, 'created'); }
  onInitializing(formId: string): void { this.transition(formId, 'initializing'); }
  onInitialized(formId: string, durationMs?: number): void {
    this.transition(formId, 'initialized', durationMs);
  }
  onValidating(formId: string): void   { this.transition(formId, 'validating'); }
  onValid(formId: string): void        { this.transition(formId, 'valid'); }
  onInvalid(formId: string): void      { this.transition(formId, 'invalid'); }
  onSubmitting(formId: string): void   { this.transition(formId, 'submitting'); }
  onSubmitted(formId: string, durationMs?: number): void {
    this.transition(formId, 'submitted', durationMs);
  }
  onDestroyed(formId: string): void    { this.transition(formId, 'destroyed'); }

  getPhase(formId: string): FormLifecyclePhase | null {
    return this.activeInstances().get(formId) ?? null;
  }

  forForm(formId: string): FormLifecycleEvent[] {
    return this._events().filter(e => e.formId === formId);
  }
}
