import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { StateEngineService } from './state-engine.service';

describe('StateEngineService', () => {
  let service: StateEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StateEngineService] });
    service = TestBed.inject(StateEngineService);
    service.clear();
  });

  it('should create a state slice with initial value', () => {
    const slice = service.create('count', 0);
    expect(slice.value()).toBe(0);
  });

  it('should set a new value', () => {
    const slice = service.create('msg', 'hello');
    slice.set('world');
    expect(slice.value()).toBe('world');
  });

  it('should update using a function', () => {
    const slice = service.create('num', 5);
    slice.update(n => n + 1);
    expect(slice.value()).toBe(6);
  });

  it('should return existing slice on duplicate create', () => {
    const slice1 = service.create('x', 10);
    const slice2 = service.create('x', 99);
    expect(slice1).toBe(slice2);
    expect(slice2.value()).toBe(10);
  });

  it('should check has()', () => {
    service.create('known', true);
    expect(service.has('known')).toBe(true);
    expect(service.has('unknown')).toBe(false);
  });

  it('should remove a slice', () => {
    service.create('toRemove', 42);
    expect(service.remove('toRemove')).toBe(true);
    expect(service.has('toRemove')).toBe(false);
  });

  it('should take a snapshot of all slices', () => {
    service.create('a', 1);
    service.create('b', 'hello');
    const snap = service.snapshot();
    expect(snap['a']).toBe(1);
    expect(snap['b']).toBe('hello');
  });

  it('should clear all slices', () => {
    service.create('s1', 1);
    service.create('s2', 2);
    service.clear();
    expect(service.listKeys()).toHaveLength(0);
  });

  it('should getOrCreate existing', () => {
    const s1 = service.create('existing', 'value');
    const s2 = service.getOrCreate('existing', 'other');
    expect(s2.value()).toBe('value');
    expect(s1).toBe(s2);
  });
});
