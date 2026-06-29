import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BootStateMachineService, InvalidKernelStateTransitionError } from './boot-state-machine.service';

describe('BootStateMachineService', () => {
  let service: BootStateMachineService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BootStateMachineService] });
    service = TestBed.inject(BootStateMachineService);
    service.reset();
  });

  it('should start in idle state', () => {
    expect(service.state()).toBe('idle');
  });

  it('should transition idle → booting', () => {
    service.transition('booting', 'test');
    expect(service.state()).toBe('booting');
    expect(service.isBooting()).toBe(true);
  });

  it('should transition booting → ready', () => {
    service.transition('booting', 'test');
    service.transition('ready', 'test');
    expect(service.state()).toBe('ready');
    expect(service.isReady()).toBe(true);
  });

  it('should transition booting → degraded', () => {
    service.transition('booting', 'test');
    service.transition('degraded', 'test');
    expect(service.state()).toBe('degraded');
    expect(service.isDegraded()).toBe(true);
  });

  it('should transition booting → error', () => {
    service.transition('booting', 'test');
    service.transition('error', 'test');
    expect(service.state()).toBe('error');
    expect(service.isError()).toBe(true);
  });

  it('should throw on invalid transition', () => {
    expect(() => service.transition('ready', 'bad')).toThrow(InvalidKernelStateTransitionError);
  });

  it('should record history', () => {
    service.transition('booting', 'trigger1');
    service.transition('ready', 'trigger2');
    const history = service.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].from).toBe('idle');
    expect(history[0].to).toBe('booting');
    expect(history[0].trigger).toBe('trigger1');
  });

  it('should reset correctly', () => {
    service.transition('booting', 'test');
    service.reset();
    expect(service.state()).toBe('idle');
    expect(service.getHistory().length).toBe(0);
  });

  it('should correctly report canTransitionTo', () => {
    expect(service.canTransitionTo('booting')).toBe(true);
    expect(service.canTransitionTo('ready')).toBe(false);
  });

  it('should complete full shutdown sequence', () => {
    service.transition('booting', 't');
    service.transition('ready', 't');
    service.transition('shutting-down', 't');
    service.transition('offline', 't');
    expect(service.state()).toBe('offline');
    expect(service.isOffline()).toBe(true);
  });
});
