import { TestBed } from '@angular/core/testing';
import { DynamicFormLifecycleService } from '../lifecycle/dynamic-form-lifecycle.service';

describe('DynamicFormLifecycleService', () => {
  let service: DynamicFormLifecycleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DynamicFormLifecycleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with zero instances', () => {
    expect(service.instanceCount()).toBe(0);
  });

  it('should track created instance', () => {
    service.onCreated('f1');
    expect(service.instanceCount()).toBe(1);
    expect(service.getPhase('f1')).toBe('created');
  });

  it('should track phase transitions', () => {
    service.onCreated('f1');
    service.onInitializing('f1');
    expect(service.getPhase('f1')).toBe('initializing');
    service.onInitialized('f1', 50);
    expect(service.getPhase('f1')).toBe('initialized');
  });

  it('should track validating phase', () => {
    service.onCreated('f1');
    service.onValidating('f1');
    expect(service.getPhase('f1')).toBe('validating');
  });

  it('should track submitting and submitted phases', () => {
    service.onCreated('f1');
    service.onSubmitting('f1');
    expect(service.getPhase('f1')).toBe('submitting');
    service.onSubmitted('f1', 200);
    expect(service.getPhase('f1')).toBe('submitted');
  });

  it('should remove instance on destroyed', () => {
    service.onCreated('f1');
    service.onDestroyed('f1');
    expect(service.instanceCount()).toBe(0);
    expect(service.getPhase('f1')).toBeNull();
  });

  it('should track multiple independent instances', () => {
    service.onCreated('f1');
    service.onCreated('f2');
    expect(service.instanceCount()).toBe(2);
    service.onDestroyed('f1');
    expect(service.instanceCount()).toBe(1);
    expect(service.getPhase('f2')).toBe('created');
  });

  it('should filter events by form id', () => {
    service.onCreated('f1');
    service.onInitialized('f1');
    service.onCreated('f2');
    const events = service.forForm('f1');
    expect(events.every(e => e.formId === 'f1')).toBeTrue();
    expect(events.length).toBe(2);
  });

  it('should record durationMs when provided', () => {
    service.onInitialized('f1', 123);
    const event = service.forForm('f1').find(e => e.phase === 'initialized');
    expect(event?.durationMs).toBe(123);
  });

  it('should return null getPhase for unknown form', () => {
    expect(service.getPhase('unknown')).toBeNull();
  });
});
