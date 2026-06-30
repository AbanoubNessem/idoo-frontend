import { Injectable } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { LayoutEvent, LayoutEventType } from './layout.types';

@Injectable({ providedIn: 'root' })
export class LayoutEventsService {
  private readonly _bus = new Subject<LayoutEvent>();

  readonly events$: Observable<LayoutEvent> = this._bus.asObservable();

  emit(event: LayoutEvent): void {
    this._bus.next(event);
  }

  emitFor(layoutId: string, type: LayoutEventType, payload: unknown = null): void {
    this._bus.next({ type, layoutId, payload, timestamp: new Date().toISOString() });
  }

  on(type: LayoutEventType): Observable<LayoutEvent> {
    return this._bus.pipe(filter(e => e.type === type));
  }

  forLayout(layoutId: string): Observable<LayoutEvent> {
    return this._bus.pipe(filter(e => e.layoutId === layoutId));
  }
}
