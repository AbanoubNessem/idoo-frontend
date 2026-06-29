import { Injectable } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { RenderEvent, RenderEventType } from './rendering.types';

function corrId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

@Injectable({ providedIn: 'root' })
export class RenderEventsService {
  private readonly _subject = new Subject<RenderEvent>();
  private readonly _log: RenderEvent[] = [];
  private readonly MAX_LOG = 500;

  readonly events$: Observable<RenderEvent> = this._subject.asObservable();

  emit(type: RenderEventType, payload?: unknown, correlationId?: string): void {
    const event: RenderEvent = {
      type,
      timestamp: new Date().toISOString(),
      payload: payload ?? null,
      correlationId: correlationId ?? corrId(),
    };

    if (this._log.length >= this.MAX_LOG) this._log.shift();
    this._log.push(event);
    this._subject.next(event);
  }

  on(type: RenderEventType): Observable<RenderEvent> {
    return this._subject.pipe(filter(e => e.type === type));
  }

  onAny(...types: RenderEventType[]): Observable<RenderEvent> {
    const set = new Set(types);
    return this._subject.pipe(filter(e => set.has(e.type)));
  }

  getLog(): ReadonlyArray<RenderEvent> {
    return [...this._log];
  }

  clearLog(): void {
    this._log.length = 0;
  }
}
