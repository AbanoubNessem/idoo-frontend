import { Injectable } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { ExperienceEvent, ExperienceEventType } from './experience.types';

@Injectable({ providedIn: 'root' })
export class ExperienceEventsService {
  private readonly _bus = new Subject<ExperienceEvent>();

  readonly events$: Observable<ExperienceEvent> = this._bus.asObservable();

  emit(type: ExperienceEventType, payload: unknown, previous?: unknown): void {
    this._bus.next({
      type,
      payload,
      previous,
      timestamp: new Date().toISOString(),
    });
  }

  on(type: ExperienceEventType): Observable<ExperienceEvent> {
    return this._bus.pipe(filter(e => e.type === type));
  }

  onAny(types: ReadonlyArray<ExperienceEventType>): Observable<ExperienceEvent> {
    const set = new Set(types);
    return this._bus.pipe(filter(e => set.has(e.type)));
  }
}
