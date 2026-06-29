import { Injectable } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { MetadataEvent, MetadataEventType } from './metadata.types';

function generateCorrelationId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

@Injectable({ providedIn: 'root' })
export class MetadataEventsService {
  private readonly _subject = new Subject<MetadataEvent>();
  private readonly _log: MetadataEvent[] = [];
  private readonly MAX_LOG = 200;

  readonly events$: Observable<MetadataEvent> = this._subject.asObservable();

  emit(type: MetadataEventType, payload?: unknown, correlationId?: string): void {
    const event: MetadataEvent = {
      type,
      timestamp: new Date().toISOString(),
      payload: payload ?? null,
      correlationId: correlationId ?? generateCorrelationId(),
    };

    if (this._log.length >= this.MAX_LOG) {
      this._log.shift();
    }
    this._log.push(event);
    this._subject.next(event);
  }

  on(type: MetadataEventType): Observable<MetadataEvent> {
    return this._subject.pipe(filter(e => e.type === type));
  }

  onAny(...types: MetadataEventType[]): Observable<MetadataEvent> {
    const set = new Set(types);
    return this._subject.pipe(filter(e => set.has(e.type)));
  }

  getLog(): ReadonlyArray<MetadataEvent> {
    return [...this._log];
  }

  clearLog(): void {
    this._log.length = 0;
  }
}
