import { TestBed } from '@angular/core/testing';
import { DynamicFormEventsService } from '../events/dynamic-form-events.service';

describe('DynamicFormEventsService', () => {
  let service: DynamicFormEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFormEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with zero events', () => {
    expect(service.eventCount()).toBe(0);
  });

  it('should emit and record an event', () => {
    service.emit('form:initialized', 'f1', {});
    expect(service.eventCount()).toBe(1);
  });

  it('should filter events by form id', () => {
    service.emit('form:initialized', 'f1', {});
    service.emit('form:initialized', 'f2', {});
    expect(service.forForm('f1').length).toBe(1);
    expect(service.forForm('f2').length).toBe(1);
  });

  it('should filter events by type', () => {
    service.emit('form:initialized', 'f1', {});
    service.emit('form:submitted', 'f1', {});
    expect(service.forType('form:submitted').length).toBe(1);
  });

  it('should notify listeners when event emitted', () => {
    const events: unknown[] = [];
    service.on('f1', 'form:initialized', e => events.push(e));
    service.emit('form:initialized', 'f1', { x: 1 });
    expect(events.length).toBe(1);
  });

  it('should not notify after listener unsubscribe', () => {
    const events: unknown[] = [];
    const off = service.on('f1', 'form:reset', e => events.push(e));
    service.emit('form:reset', 'f1', {});
    off();
    service.emit('form:reset', 'f1', {});
    expect(events.length).toBe(1);
  });

  it('should support wildcard type listener', () => {
    const events: unknown[] = [];
    service.on('f1', '*', e => events.push(e));
    service.emit('form:initialized', 'f1', {});
    service.emit('field:value-changed', 'f1', {});
    expect(events.length).toBe(2);
  });

  it('should store event payload', () => {
    service.emit('field:value-changed', 'f1', { key: 'name', oldValue: null, newValue: 'Alice' });
    const event = service.forType('field:value-changed')[0];
    expect((event.payload as { key: string }).key).toBe('name');
  });

  it('should expose latestEvents (last 10)', () => {
    for (let i = 0; i < 15; i++) {
      service.emit('form:initialized', `f${i}`, {});
    }
    expect(service.latestEvents().length).toBe(10);
  });

  it('should clear events for a specific form', () => {
    service.emit('form:initialized', 'f1', {});
    service.emit('form:initialized', 'f2', {});
    service.clear('f1');
    expect(service.forForm('f1').length).toBe(0);
    expect(service.forForm('f2').length).toBe(1);
  });

  it('should clear all events', () => {
    service.emit('form:initialized', 'f1', {});
    service.emit('form:initialized', 'f2', {});
    service.clear();
    expect(service.eventCount()).toBe(0);
  });
});
