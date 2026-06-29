import { Injectable } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { PlatformEvent } from '../runtime.types';

@Injectable({ providedIn: 'root' })
export class EventBusService {
  private readonly _bus = new Subject<PlatformEvent>();
  private readonly _eventLog: PlatformEvent[] = [];
  private readonly MAX_LOG_SIZE = 500;

  readonly all$: Observable<PlatformEvent> = this._bus.asObservable();

  emit<T = unknown>(type: string, payload: T, source = 'platform'): void {
    const event: PlatformEvent<T> = {
      type,
      payload,
      source,
      timestamp: new Date().toISOString(),
      correlationId: this.generateId(),
    };

    if (this._eventLog.length >= this.MAX_LOG_SIZE) {
      this._eventLog.shift();
    }
    this._eventLog.push(event as PlatformEvent);

    this._bus.next(event as PlatformEvent);
  }

  on<T = unknown>(type: string): Observable<PlatformEvent<T>> {
    return this._bus.pipe(
      filter(e => e.type === type)
    ) as Observable<PlatformEvent<T>>;
  }

  onPattern<T = unknown>(pattern: RegExp): Observable<PlatformEvent<T>> {
    return this._bus.pipe(
      filter(e => pattern.test(e.type))
    ) as Observable<PlatformEvent<T>>;
  }

  onSource<T = unknown>(source: string): Observable<PlatformEvent<T>> {
    return this._bus.pipe(
      filter(e => e.source === source)
    ) as Observable<PlatformEvent<T>>;
  }

  getLog(): PlatformEvent[] {
    return [...this._eventLog];
  }

  getLogByType(type: string): PlatformEvent[] {
    return this._eventLog.filter(e => e.type === type);
  }

  clearLog(): void {
    this._eventLog.length = 0;
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }
}
