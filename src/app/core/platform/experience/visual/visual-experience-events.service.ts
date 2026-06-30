import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { VisualEvent } from './visual.types';

@Injectable({ providedIn: 'root' })
export class VisualExperienceEventsService implements OnDestroy {
  private readonly _bus$ = new Subject<VisualEvent>();

  readonly events$: Observable<VisualEvent> = this._bus$.asObservable();

  ngOnDestroy(): void {
    this._bus$.complete();
  }

  emit(event: VisualEvent): void {
    this._bus$.next(event);
  }

  on<T extends VisualEvent['type']>(
    type: T,
  ): Observable<Extract<VisualEvent, { type: T }>> {
    return this._bus$.pipe(
      filter((e): e is Extract<VisualEvent, { type: T }> => e.type === type),
    );
  }
}
