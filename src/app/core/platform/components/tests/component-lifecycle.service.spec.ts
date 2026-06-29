import { TestBed } from '@angular/core/testing';
import { ComponentLifecycleService } from '../lifecycle/component-lifecycle.service';

describe('ComponentLifecycleService', () => {
  let service: ComponentLifecycleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentLifecycleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no events', () => {
    expect(service.events().length).toBe(0);
    expect(service.instanceCount()).toBe(0);
  });

  it('should emit created event', () => {
    service.onCreated('text-field', 'text-1');
    expect(service.events()[0].phase).toBe('created');
    expect(service.instanceCount()).toBe(1);
  });

  it('should emit initialized event', () => {
    service.onCreated('text-field', 'text-1');
    service.onInitialized('text-field', 'text-1');
    expect(service.getPhase('text-1')).toBe('initialized');
  });

  it('should emit rendered event', () => {
    service.onRendered('number-field', 'num-1');
    expect(service.getPhase('num-1')).toBe('rendered');
  });

  it('should emit updated event with changed inputs', () => {
    service.onRendered('select-field', 'sel-1');
    service.onUpdated('select-field', 'sel-1', ['label', 'disabled']);
    const events = service.getEventsFor('sel-1');
    const updated = events.find(e => e.phase === 'updated');
    expect(updated?.data?.['changedInputs']).toEqual(['label', 'disabled']);
  });

  it('should remove instance from active set on destroyed', () => {
    service.onCreated('chip-field', 'chip-1');
    expect(service.instanceCount()).toBe(1);
    service.onDestroyed('chip-field', 'chip-1');
    expect(service.instanceCount()).toBe(0);
    expect(service.getPhase('chip-1')).toBeNull();
  });

  it('should track multiple instances independently', () => {
    service.onCreated('text-field', 'text-1');
    service.onCreated('text-field', 'text-2');
    expect(service.instanceCount()).toBe(2);
    service.onDestroyed('text-field', 'text-1');
    expect(service.instanceCount()).toBe(1);
  });

  it('should get events for a specific instance', () => {
    service.onCreated('json-field', 'json-1');
    service.onRendered('json-field', 'json-1');
    service.onCreated('json-field', 'json-2');
    const forJson1 = service.getEventsFor('json-1');
    expect(forJson1.length).toBe(2);
    expect(forJson1.every(e => e.instanceId === 'json-1')).toBeTrue();
  });

  it('should clear all events', () => {
    service.onCreated('md-field', 'md-1');
    service.clear();
    expect(service.events().length).toBe(0);
    expect(service.instanceCount()).toBe(0);
  });

  it('should cap event log at 200 entries', () => {
    for (let i = 0; i < 300; i++) {
      service.onCreated('x', `x-${i}`);
    }
    expect(service.events().length).toBeLessThanOrEqual(200);
  });

  it('should return null phase for unknown instance', () => {
    expect(service.getPhase('ghost-instance')).toBeNull();
  });
});
