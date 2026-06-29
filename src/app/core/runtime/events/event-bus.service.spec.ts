import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EventBusService } from './event-bus.service';

describe('EventBusService', () => {
  let service: EventBusService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EventBusService] });
    service = TestBed.inject(EventBusService);
    service.clearLog();
  });

  it('should emit and receive an event', () => {
    const received: unknown[] = [];
    service.on('test:event').subscribe(e => received.push(e.payload));
    service.emit('test:event', { value: 42 });
    expect(received).toHaveLength(1);
    expect((received[0] as Record<string, unknown>)['value']).toBe(42);
  });

  it('should not receive events of other types', () => {
    const received: unknown[] = [];
    service.on('type:a').subscribe(e => received.push(e));
    service.emit('type:b', {});
    expect(received).toHaveLength(0);
  });

  it('should log emitted events', () => {
    service.emit('log:test', { x: 1 });
    service.emit('log:test', { x: 2 });
    const log = service.getLog();
    expect(log).toHaveLength(2);
  });

  it('should filter log by type', () => {
    service.emit('a', {});
    service.emit('b', {});
    service.emit('a', {});
    const aLog = service.getLogByType('a');
    expect(aLog).toHaveLength(2);
  });

  it('should receive events by pattern', () => {
    const received: unknown[] = [];
    service.onPattern(/^plugin:/).subscribe(e => received.push(e));
    service.emit('plugin:loaded', {});
    service.emit('plugin:ready', {});
    service.emit('kernel:ready', {});
    expect(received).toHaveLength(2);
  });

  it('should filter by source', () => {
    const received: unknown[] = [];
    service.onSource('kernel').subscribe(e => received.push(e));
    service.emit('ev1', {}, 'kernel');
    service.emit('ev2', {}, 'plugin');
    expect(received).toHaveLength(1);
  });

  it('should clear event log', () => {
    service.emit('e', {});
    service.clearLog();
    expect(service.getLog()).toHaveLength(0);
  });

  it('should assign correlationId to each event', () => {
    service.emit('corr', {});
    const log = service.getLog();
    expect(log[0].correlationId).toBeDefined();
  });
});
