import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MetadataLifecycleService } from '../metadata-lifecycle.service';

describe('MetadataLifecycleService', () => {
  let service: MetadataLifecycleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataLifecycleService);
  });

  it('should start in uninitialized state', () => {
    expect(service.state()).toBe('uninitialized');
  });

  it('should not be ready initially', () => {
    expect(service.isReady()).toBe(false);
  });

  it('should not be busy initially', () => {
    expect(service.isBusy()).toBe(false);
  });

  it('should transition uninitialized → loading', () => {
    service.transition('loading');
    expect(service.state()).toBe('loading');
    expect(service.isBusy()).toBe(true);
  });

  it('should transition through the full happy path', () => {
    service.transition('loading');
    service.transition('validating');
    service.transition('resolving');
    service.transition('indexing');
    service.transition('ready');
    expect(service.state()).toBe('ready');
    expect(service.isReady()).toBe(true);
    expect(service.isBusy()).toBe(false);
  });

  it('should transition to error from any busy state', () => {
    service.transition('loading');
    service.transition('error', 'something went wrong');
    expect(service.state()).toBe('error');
    expect(service.isError()).toBe(true);
    expect(service.errorMessage()).toBe('something went wrong');
  });

  it('should clear error message when transitioning out of error', () => {
    service.transition('loading');
    service.transition('error', 'oops');
    service.transition('loading');
    expect(service.errorMessage()).toBeNull();
  });

  it('should reject invalid transitions', () => {
    expect(() => service.transition('ready')).toThrow('invalid transition');
  });

  it('should reject skipping states', () => {
    service.transition('loading');
    expect(() => service.transition('ready')).toThrow('invalid transition');
  });

  it('should track transition history', () => {
    service.transition('loading');
    service.transition('validating');
    service.transition('resolving');

    const history = service.getHistory();
    expect(history).toEqual(['uninitialized', 'loading', 'validating']);
  });

  it('should support refresh cycle: ready → refreshing → loading', () => {
    service.transition('loading');
    service.transition('validating');
    service.transition('resolving');
    service.transition('indexing');
    service.transition('ready');
    service.transition('refreshing');
    service.transition('loading');
    expect(service.state()).toBe('loading');
  });

  it('should recover from error via loading', () => {
    service.transition('loading');
    service.transition('error', 'test error');
    service.transition('loading');
    expect(service.state()).toBe('loading');
  });

  it('should return empty history before any transitions', () => {
    expect(service.getHistory()).toEqual([]);
  });

  it('canTransitionTo should return true for valid next states', () => {
    expect(service.canTransitionTo('loading')).toBe(true);
    expect(service.canTransitionTo('ready')).toBe(false);
  });

  it('should reset to uninitialized', () => {
    service.transition('loading');
    service.transition('validating');
    service.reset();
    expect(service.state()).toBe('uninitialized');
    expect(service.getHistory()).toEqual([]);
    expect(service.errorMessage()).toBeNull();
  });
});
