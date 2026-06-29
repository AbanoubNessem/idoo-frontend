import { Injectable, signal, computed } from '@angular/core';
import { FormEvent, FormEventType } from '../form.types';

const MAX_EVENTS = 500;

@Injectable({ providedIn: 'root' })
export class DynamicFormEventsService {
  private readonly _events = signal<FormEvent[]>([]);
  private readonly _listeners = new Map<string, Set<(event: FormEvent) => void>>();

  readonly allEvents   = this._events.asReadonly();
  readonly eventCount  = computed(() => this._events().length);

  readonly latestEvents = computed(() => this._events().slice(-10));

  emit<T = unknown>(type: FormEventType, formId: string, payload: T): void {
    const event: FormEvent<T> = {
      type,
      formId,
      timestamp: new Date().toISOString(),
      payload,
    };

    this._events.update(events => {
      const next = [...events, event as FormEvent];
      return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
    });

    // Notify typed listeners
    const key = `${formId}:${type}`;
    const globalKey = `*:${type}`;
    const anyKey = `${formId}:*`;

    for (const listenerKey of [key, globalKey, anyKey]) {
      this._listeners.get(listenerKey)?.forEach(fn => fn(event as FormEvent));
    }
  }

  on(
    formId: string,
    type: FormEventType | '*',
    listener: (event: FormEvent) => void,
  ): () => void {
    const key = `${formId}:${type}`;
    if (!this._listeners.has(key)) this._listeners.set(key, new Set());
    this._listeners.get(key)!.add(listener);
    return () => this._listeners.get(key)?.delete(listener);
  }

  forForm(formId: string): FormEvent[] {
    return this._events().filter(e => e.formId === formId);
  }

  forType(type: FormEventType): FormEvent[] {
    return this._events().filter(e => e.type === type);
  }

  clear(formId?: string): void {
    if (formId) {
      this._events.update(events => events.filter(e => e.formId !== formId));
      for (const key of this._listeners.keys()) {
        if (key.startsWith(`${formId}:`)) this._listeners.delete(key);
      }
    } else {
      this._events.set([]);
      this._listeners.clear();
    }
  }
}
