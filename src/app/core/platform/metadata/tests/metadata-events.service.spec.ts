import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { MetadataEventsService } from '../metadata-events.service';
import { MetadataEvent, MetadataEventType } from '../metadata.types';

describe('MetadataEventsService', () => {
  let service: MetadataEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataEventsService);
  });

  it('should emit events to events$ observable', async () => {
    const received: MetadataEvent[] = [];
    const sub = service.events$.subscribe(e => received.push(e));

    service.emit('metadata:ready');
    service.emit('metadata:error', { message: 'test' });

    sub.unsubscribe();
    expect(received).toHaveLength(2);
    expect(received[0].type).toBe('metadata:ready');
    expect(received[1].type).toBe('metadata:error');
  });

  it('should attach timestamp and correlationId to every event', () => {
    let event: MetadataEvent | undefined;
    service.events$.subscribe(e => (event = e));
    service.emit('metadata:loading:started');

    expect(event?.timestamp).toBeTruthy();
    expect(event?.correlationId).toBeTruthy();
  });

  it('should use provided correlationId when given', () => {
    let event: MetadataEvent | undefined;
    service.events$.subscribe(e => (event = e));
    service.emit('metadata:ready', null, 'my-corr-id');

    expect(event?.correlationId).toBe('my-corr-id');
  });

  it('should attach payload to emitted event', () => {
    let event: MetadataEvent | undefined;
    service.events$.subscribe(e => (event = e));
    service.emit('metadata:snapshot:created', { snapshotId: 'abc' });

    expect(event?.payload).toEqual({ snapshotId: 'abc' });
  });

  it('on() should filter by event type', () => {
    const received: MetadataEvent[] = [];
    const sub = service.on('metadata:ready').subscribe(e => received.push(e));

    service.emit('metadata:loading:started');
    service.emit('metadata:ready');
    service.emit('metadata:error');

    sub.unsubscribe();
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('metadata:ready');
  });

  it('onAny() should filter by multiple event types', () => {
    const received: MetadataEvent[] = [];
    const sub = service.onAny('metadata:ready', 'metadata:error').subscribe(e => received.push(e));

    service.emit('metadata:loading:started');
    service.emit('metadata:ready');
    service.emit('metadata:loading:completed');
    service.emit('metadata:error');

    sub.unsubscribe();
    expect(received).toHaveLength(2);
  });

  it('should keep event log', () => {
    service.emit('metadata:loading:started');
    service.emit('metadata:loading:completed', { count: 5 });

    const log = service.getLog();
    expect(log).toHaveLength(2);
    expect(log[0].type).toBe('metadata:loading:started');
  });

  it('should clear event log', () => {
    service.emit('metadata:ready');
    service.clearLog();
    expect(service.getLog()).toHaveLength(0);
  });

  it('should evict oldest events when log reaches MAX_LOG (200)', () => {
    for (let i = 0; i < 205; i++) {
      service.emit('metadata:loading:started');
    }
    expect(service.getLog().length).toBeLessThanOrEqual(200);
  });

  it('should default payload to null when not provided', () => {
    let event: MetadataEvent | undefined;
    service.events$.subscribe(e => (event = e));
    service.emit('metadata:ready');
    expect(event?.payload).toBeNull();
  });
});
